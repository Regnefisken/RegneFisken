/**
 * Røgtest: spiller spillet igennem i en rigtig browser (headless Chromium) og tjekker,
 * at de vigtigste forløb virker, og at der ikke kommer fejl i konsollen.
 *
 * Brug:
 *   npm run build
 *   npm run preview -- --port 4173 --strictPort      (i et andet vindue)
 *   node scripts/smoke-test.cjs [url] [mappe-til-skærmbilleder]
 *
 * Kræver Playwright med Chromium (er ikke en del af projektets afhængigheder).
 * Testen ser kun, om tingene virker — ikke om de ser pæne ud eller kører flydende.
 */
const fs = require('fs');
const path = require('path');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  console.error('Playwright er ikke installeret. Installer det, eller kør testen i et miljø, hvor det findes.');
  process.exit(2);
}

const URL = process.argv[2] || 'http://localhost:4173/';
const OUT = process.argv[3] || path.join(process.cwd(), 'smoke-screenshots');
const SAVE_KEY = 'regnefisken_save';
const SAVE_VERSION = 15;

/** Varigt udstyr der tæller med i målet «Fuldt udrustet» (se FULL_UPGRADE_ITEM_IDS i src/data/shop.ts). */
const FULL_UPGRADE_IDS = [
  'rod_havblaa', 'rod_bambus', 'rod_mahogni', 'reel_upgrade', 'magnet', 'travel_pass',
  'license_smaragd', 'license_abyss', 'map_right', 'heldig_firkloever', 'bucket_iron',
  'bucket_copper', 'bucket_silver', 'bucket_gold', 'desert_sunglasses', 'desert_waterbottle',
  'desert_sunhat', 'desert_sunscreen', 'arctic_beanie', 'arctic_gloves', 'arctic_hotwater',
  'arctic_scarf', 'rowboat', 'headlamp', 'luxury_boat', 'biolum_floats', 'golden_hook',
];

const results = [];
function check(scenario, name, ok, detail = '') {
  results.push({ scenario, name, ok: !!ok, detail });
  console.log(`  ${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function bodyText(page) {
  return page.evaluate(() => document.body.innerText.replace(/\n+/g, ' | '));
}

async function readSave(page) {
  return page.evaluate((k) => {
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : null;
  }, SAVE_KEY);
}

async function startGame(page) {
  await page.getByText('START').first().click();
  await page.getByText('KAST SNØREN').waitFor({ timeout: 60000 });
  await page.waitForTimeout(1500);
}

/** Kaster snøren og haler ind; returnerer opgaveteksten (fx "8 + 4"). */
async function castAndHook(page) {
  await page.getByText('KAST SNØREN').click();
  await page.getByText('BID!').click({ timeout: 60000, force: true });
  await page.getByRole('button', { name: 'OK', exact: true }).waitFor({ timeout: 15000 });
  await page.waitForTimeout(600);
  const m = (await bodyText(page)).match(/(\d+) ([+-]) (\d+)/);
  if (!m) throw new Error('Kunne ikke læse opgaven');
  const a = Number(m[1]);
  const b = Number(m[3]);
  return { text: m[0], answer: m[2] === '+' ? a + b : a - b };
}

async function typeAnswer(page, answer) {
  for (const ch of String(answer)) {
    await page.getByRole('button', { name: ch, exact: true }).click();
  }
  await page.getByRole('button', { name: 'OK', exact: true }).click();
}

async function isFighting(page) {
  return page.getByRole('button', { name: 'OK', exact: true }).isVisible();
}

/** Lukker fangst-skærmen, uanset hvad der blev fanget. */
async function dismissCatch(page) {
  for (let i = 0; i < 20; i++) {
    if (await page.getByText('KAST SNØREN').isVisible()) return;
    const buttons = page.locator('button:visible');
    const labels = await buttons.allInnerTexts();
    const idx = labels.findIndex((t) => /Læg i Spanden|Åbn kisten|Tag med|Smid|Fortsæt|OK|Luk|Videre|Behold/i.test(t));
    if (idx >= 0) {
      // Klik kun, hvis knappen faktisk kan rammes — en knap der er skåret væk eller dækket, skal få testen til at fejle.
      const btn = buttons.nth(idx);
      const reachable = await btn
        .evaluate((el) => {
          const r = el.getBoundingClientRect();
          const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          return !!hit && (hit === el || el.contains(hit));
        })
        .catch(() => false);
      if (reachable) await btn.click({ force: true, timeout: 3000 }).catch(() => {});
    }
    else await page.keyboard.press('Escape');
    await page.waitForTimeout(700);
  }
  throw new Error('Kunne ikke komme tilbage til fiskeriet efter fangst');
}

async function sellAllIfPossible(page) {
  const sell = page.getByText(/Sælg Alt/i).first();
  if (await sell.isVisible().catch(() => false)) {
    await sell.click();
    await page.waitForTimeout(600);
    return true;
  }
  return false;
}

async function runScenario(browser, name, seedSave, fn) {
  console.log(`\n${name}`);
  // 1920×1080: stort nok til, at alle paneler kan være der i desktop-visning.
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`fejl: ${e.message.slice(0, 200)}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`konsol: ${m.text().slice(0, 200)}`);
  });
  if (seedSave) {
    // Kun ved første indlæsning, så et senere reload læser det, spillet selv har gemt.
    await page.addInitScript(
      ([key, save]) => {
        if (!sessionStorage.getItem('smoke_seeded')) {
          sessionStorage.setItem('smoke_seeded', '1');
          localStorage.setItem(key, save);
        }
      },
      [SAVE_KEY, JSON.stringify({ v: SAVE_VERSION, _saveFormatVersion: SAVE_VERSION, uiMode: 'desktop', ...seedSave })],
    );
  }
  const shot = async (label) => {
    await page.screenshot({ path: path.join(OUT, `${name.split(' ')[0]}-${label}.png`) });
  };
  try {
    await page.goto(URL, { waitUntil: 'load' });
    await page.getByText('START').first().waitFor({ timeout: 30000 });
    await fn(page, shot);
  } catch (e) {
    check(name, 'forløbet kunne gennemføres', false, String(e.message).split('\n')[0].slice(0, 200));
    await shot('FEJL').catch(() => {});
  }
  check(name, 'ingen fejl i konsollen', errors.length === 0, errors.slice(0, 3).join(' / '));
  await context.close();
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });

  /* ── 1: ny spiller ───────────────────────────────────────────────────────── */
  const S1 = '1 Ny spiller: fang, sælg og åbn alle paneler';
  await runScenario(browser, S1, null, async (page, shot) => {
    await shot('startskaerm');
    await startGame(page);
    check(S1, 'spillet starter på Den Gamle Mole', (await bodyText(page)).includes('DEN GAMLE MOLE'));
    check(S1, '3D-scenen har et lærred', (await page.locator('canvas').count()) > 0);
    await shot('molen');

    const q = await castAndHook(page);
    check(S1, 'der kommer en regneopgave efter bid', true, q.text);
    await shot('opgave');
    await typeAnswer(page, q.answer);
    await page.getByText('FANGET!').waitFor({ timeout: 15000 });
    check(S1, 'rigtigt svar fanger fisken', true);
    await shot('fanget');
    await dismissCatch(page);

    await page.waitForTimeout(1200);
    const afterCatch = await readSave(page);
    check(S1, 'fangsten ligger i spanden og er gemt', afterCatch && afterCatch.inventory.length === 1);
    check(S1, 'fangsten gav XP', afterCatch && afterCatch.progression.xp > 0, `${afterCatch?.progression.xp} XP`);

    const value = afterCatch.inventory[0].value;
    check(S1, 'knappen "Sælg Alt" findes', await sellAllIfPossible(page));
    await page.waitForTimeout(1200);
    const afterSell = await readSave(page);
    check(S1, 'salget tømmer spanden og giver mønter', afterSell.inventory.length === 0 && afterSell.coins >= value,
      `${afterSell.coins} kr`);

    const panels = [
      ['Butik', /Butik|Fiskegrej|Rejser/i],
      ['Kiste', /Kiste|Udstyr|Madding|Skatte/i],
      ['Mål', /Første fangst/i],
      ['Matematik', /Kysten|Farvand/i],
      ['Menu', /Indstillinger|Nulstil|Om spillet|Skærm/i],
    ];
    for (const [label, expected] of panels) {
      await page.getByRole('button', { name: new RegExp(label) }).first().click();
      await page.waitForTimeout(1200);
      const txt = await bodyText(page);
      check(S1, `panelet "${label}" åbner`, expected.test(txt));
      await shot(`panel-${label.toLowerCase().replace('å', 'aa')}`);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(600);
      if (!(await page.getByText('KAST SNØREN').isVisible())) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(600);
      }
      check(S1, `panelet "${label}" kan lukkes igen`, await page.getByText('KAST SNØREN').isVisible());
    }
  });

  /* ── 2: tomt svar ────────────────────────────────────────────────────────── */
  const S2 = '2 Tomt svar: godkendes ikke, heller ikke når facit er 0';
  await runScenario(browser, S2, { activeMathTypes: ['minus'], questItems: ['map_left'] }, async (page, shot) => {
    await startGame(page);
    let sawZero = false;
    let sawNonZero = false;
    for (let i = 0; i < 25 && !(sawZero && sawNonZero); i++) {
      const q = await castAndHook(page);
      const isZero = q.answer === 0;
      if ((isZero && !sawZero) || (!isZero && !sawNonZero)) {
        await page.getByRole('button', { name: 'OK', exact: true }).click();
        await page.waitForTimeout(1500);
        const stillFighting = await isFighting(page);
        const caught = await page.getByText('FANGET!').isVisible().catch(() => false);
        check(S2, `tomt svar på "${q.text}" (facit ${q.answer}) fanger ikke fisken`, stillFighting && !caught);
        if (isZero) {
          sawZero = true;
          await shot('facit-nul-tomt-svar');
        } else sawNonZero = true;
      }
      if (await isFighting(page)) {
        await typeAnswer(page, q.answer);
        await page.waitForTimeout(1500);
        if (isZero) check(S2, `svaret "0" på "${q.text}" godkendes`, !(await isFighting(page)));
      }
      await dismissCatch(page);
      await sellAllIfPossible(page);
    }
    check(S2, 'en opgave med facit 0 blev afprøvet', sawZero);
    check(S2, 'en opgave med andet facit blev afprøvet', sawNonZero);
  });

  /* ── 3: decimaltegn ──────────────────────────────────────────────────────── */
  const S3 = '3 Decimaltegn: valget huskes efter genindlæsning';
  await runScenario(browser, S3, { selectedFarvand: 'dybet', activeMathTypes: ['plus'] }, async (page, shot) => {
    const openSeparatorSetting = async () => {
      await page.getByRole('button', { name: /Matematik/ }).first().click();
      await page.waitForTimeout(1000);
      if (!(await page.getByText(/Komma \(dansk\)|Punktum \(engelsk\)/).first().isVisible().catch(() => false))) {
        // Indstillingen ligger på en af fanerne — prøv dem efter tur.
        const tabs = page.locator('button:visible');
        const n = await tabs.count();
        for (let i = 0; i < n; i++) {
          const label = (await tabs.nth(i).innerText().catch(() => '')).trim();
          if (!/Indstillinger|Tastatur|Visning|Andet|Avanceret|Opgaver|Farvand/i.test(label)) continue;
          await tabs.nth(i).click().catch(() => {});
          await page.waitForTimeout(500);
          if (await page.getByText(/Komma \(dansk\)|Punktum \(engelsk\)/).first().isVisible().catch(() => false)) break;
        }
      }
    };
    await startGame(page);
    await openSeparatorSetting();
    check(S3, 'standarden er komma', await page.getByText('Komma (dansk)').isVisible());
    const row = page.getByText('Komma (dansk)').locator('xpath=ancestor::div[.//button][1]');
    await row.locator('button').last().click();
    await page.waitForTimeout(400);
    check(S3, 'valget skifter til punktum', await page.getByText('Punktum (engelsk)').isVisible());
    await shot('punktum-valgt');
    await page.waitForTimeout(1500);
    check(S3, 'valget er gemt', (await readSave(page))?.decimalSeparator === '.');

    await page.reload({ waitUntil: 'load' });
    await page.getByText('START').first().waitFor({ timeout: 30000 });
    await startGame(page);
    await openSeparatorSetting();
    check(S3, 'efter genindlæsning er punktum stadig valgt', await page.getByText('Punktum (engelsk)').isVisible());
    await shot('efter-genindlaesning');
  });

  /* ── 4: målet Fuldt udrustet ─────────────────────────────────────────────── */
  const S4a = '4a Fuldt udrustet: mange køb af madding udløser ikke målet';
  await runScenario(browser, S4a, { coins: 100, stats: { upgradesBought: 500 } }, async (page, shot) => {
    await startGame(page);
    await page.waitForTimeout(5000);
    const save = await readSave(page);
    check(S4a, 'målet er ikke opnået efter 500 køb uden udstyr', !save.completedGoals.includes('full_upgrade'));
    check(S4a, '"Første investering" er opnået', save.completedGoals.includes('first_upgrade'));
    for (let i = 0; i < 6 && !(await page.getByText('KAST SNØREN').isVisible()); i++) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
    await page.getByRole('button', { name: /Mål/ }).first().click();
    await page.waitForTimeout(1200);
    const row = page.getByText('Fuldt udrustet').first();
    await row.scrollIntoViewIfNeeded().catch(() => {});
    const rowText = await row.locator('xpath=ancestor::*[contains(., "/")][1]').innerText().catch(() => '');
    check(S4a, 'fremdriften viser 0 af 27', /0\s*\/\s*27/.test(rowText.replace(/\n/g, ' ')), rowText.replace(/\n+/g, ' ').slice(0, 80));
    await shot('maal');
  });

  const S4b = '4b Fuldt udrustet: alt varigt udstyr udløser målet';
  await runScenario(browser, S4b, { coins: 100, upgrades: FULL_UPGRADE_IDS }, async (page, shot) => {
    await startGame(page);
    let save = null;
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(1000);
      save = await readSave(page);
      if (save && save.completedGoals && save.completedGoals.includes('full_upgrade')) break;
    }
    check(S4b, 'målet opnås med de 27 varer (uden Sørøverens Hat)', save.completedGoals.includes('full_upgrade'));
    check(S4b, 'belønningen på 300 mønter er udbetalt', save.coins >= 400, `${save.coins} kr`);
    await shot('opnaaet');
  });

  await browser.close();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length} af ${results.length} tjek bestod.`);
  if (failed.length > 0) {
    console.log('Fejlede:');
    for (const f of failed) console.log(`  ✗ [${f.scenario.split(' ')[0]}] ${f.name}${f.detail ? ` — ${f.detail}` : ''}`);
  }
  console.log(`Skærmbilleder: ${OUT}`);
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
