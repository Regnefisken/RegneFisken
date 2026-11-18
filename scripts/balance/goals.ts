/**
 * Balancemål og automatiske fund til balance-rapporten.
 *
 * Hvert mål sammenligner et tal fra simuleringen med en grænse og giver 🟢 (nået), 🔴 (ikke nået) eller
 * 🟡 (kan ikke afgøres, fx fordi simuleringen er for kort). Grænserne står i `GOAL_LIMITS` herunder og kan
 * rettes, når I bliver klogere på, hvad der er rigtigt for jeres elever.
 *
 * Antagelser bag grænserne: spillet bruges mest i lektioner på 45 min (ca. 30-35 min reel spilletid), og det
 * skal kunne bruges af hele klassen, også af elever, der regner langsomt.
 */
import { getLocation } from '../../src/data/locations.js';
import { SHOP_ITEMS } from '../../src/data/shop.js';
import { DEFAULT_BUY_ORDER, catchTable, type SimResult } from './sim-core.js';
import { fmtMin, fmtNum, fmtPct, median, milestoneTimes, quantile, reachedShare, table } from './stats.js';

export const GOAL_LIMITS = {
  /** Mål 1: usikker regner kan fiske i Skovsøen inden for første lektion. */
  firstAreaMedianMin: 30,
  firstAreaP90Min: 40,
  /** Mål 2: længste tid uden et nyt level, køb eller område. */
  maxGapMin: 15,
  /** Mål 3: usikker regner må højst være så mange gange langsommere end middel (tid til level 10). */
  weakVsMiddleSlowdown: 2,
  /** Mål 4: andel usikre regnere, der når Den Tropiske Ø inden for simuleringens tid. */
  weakTropicalShare: 0.5,
  /** Mål 5: hele spillet (alt udstyr undtagen Sejlbåden) for middel regner, i minutter. */
  fullGameMinMin: 180,
  fullGameMaxMin: 280,
  /** Mål 6: Dybet skal give mindst så meget mere pr. kast end Ørkensøen. */
  abyssOverDesert: 1.2,
  /** Mål 7: længste opsparing til næste vare for middel regner. */
  maxSavingMin: 15,
  /** Mål 8: stærk regner må højst tjene så mange gange mere end usikker i første time. */
  strongVsWeakEarnings: 3,
  /** Mål 9: kister. */
  minCatchesPerChest: 20,
  maxChestIncomeShare: 0.15,
  /** Mål 10: usikker regner skal fange mindst denne andel af det, der bider. */
  weakCatchRate: 0.75,
  /** Mål 11: skrald pr. 100 kast. */
  junkMin: 8,
  junkMax: 14,
};

export type GoalStatus = 'ok' | 'fejl' | 'uafklaret';

export interface GoalResult {
  nr: number;
  title: string;
  target: string;
  measured: string;
  status: GoalStatus;
}

export interface GoalContext {
  /** Resultater pr. elevtype-id ('svag', 'middel', 'staerk'). */
  byId: Record<string, SimResult[]>;
  minutes: number;
  seed: number;
}

const locName = (id: string) => getLocation(id).name;
const shopName = (id: string) => SHOP_ITEMS.find((i) => i.id === id)?.name ?? id;
const PROFILE_NAME: Record<string, string> = { svag: 'usikker', middel: 'middel', staerk: 'stærk' };

/** Median tid for en milepæl; `Infinity` hvis under halvdelen nåede den. */
function medianTime(results: SimResult[], key: string): number {
  return quantile(milestoneTimes(results, key), 0.5);
}

/** Længste tid (min) mellem to milepæle for én spiller. Slutningen tæller med, til indkøbslisten er købt. */
export function longestGap(r: SimResult): number {
  const events = Object.entries(r.milestones)
    .filter(([k]) => k.startsWith('level_') || k.startsWith('koeb_') || k.startsWith('omraade_'))
    .map(([, t]) => t)
    .sort((a, b) => a - b);
  const done = DEFAULT_BUY_ORDER.every((id) => r.milestones[`koeb_${id}`] !== undefined);
  const points = [0, ...events];
  if (!done) points.push(r.minutes);
  let max = 0;
  for (let i = 1; i < points.length; i++) max = Math.max(max, points[i]! - points[i - 1]!);
  return max;
}

/** Fælles udstyr til at sammenligne steder på lige fod. */
const COMPARE_LEVEL = 12;
const COMPARE_GEAR = [
  'rod_havblaa', 'rod_bambus', 'rod_mahogni', 'license_smaragd', 'license_abyss', 'headlamp', 'heldig_firkloever',
];

export function evaluateGoals(ctx: GoalContext): GoalResult[] {
  const L = GOAL_LIMITS;
  const svag = ctx.byId.svag ?? [];
  const middel = ctx.byId.middel ?? [];
  const staerk = ctx.byId.staerk ?? [];
  const out: GoalResult[] = [];

  // 1. Første lektion
  {
    const times = milestoneTimes(svag, 'omraade_smaragd');
    const med = quantile(times, 0.5);
    const p90 = quantile(times, 0.9);
    out.push({
      nr: 1,
      title: 'Usikker regner kan fiske i Skovsøen i første lektion',
      target: `median ≤ ${L.firstAreaMedianMin} min, langsomste 10 % ≤ ${L.firstAreaP90Min} min`,
      measured: `median ${fmtMin(med)}, langsomste 10 % ${Number.isFinite(p90) ? fmtMin(p90) : `>${fmtMin(ctx.minutes)}`}`,
      status: med <= L.firstAreaMedianMin && p90 <= L.firstAreaP90Min ? 'ok' : 'fejl',
    });
  }

  // 2. Noget nyt hvert 15. minut
  {
    const worst = Object.entries(ctx.byId)
      .map(([id, rs]) => ({ id, gap: median(rs.map(longestGap)) }))
      .sort((a, b) => b.gap - a.gap)[0];
    out.push({
      nr: 2,
      title: 'Der sker noget nyt (level, køb eller område) mindst hvert 15. minut',
      target: `længste pause ≤ ${L.maxGapMin} min for alle elevtyper`,
      measured: worst ? `længste pause ${fmtMin(worst.gap)} (${PROFILE_NAME[worst.id] ?? worst.id} regner, median)` : '–',
      status: worst && worst.gap <= L.maxGapMin ? 'ok' : 'fejl',
    });
  }

  // 3. Usikker vs. middel
  {
    const s = medianTime(svag, 'level_10');
    const m = medianTime(middel, 'level_10');
    const ratio = s / m;
    out.push({
      nr: 3,
      title: 'Usikker regner er højst dobbelt så langsom som middel',
      target: `tid til level 10 ≤ ${L.weakVsMiddleSlowdown}× middel`,
      measured: Number.isFinite(ratio) ? `${fmtNum(ratio)}× (${fmtMin(s)} mod ${fmtMin(m)})` : 'level 10 ikke nået',
      status: !Number.isFinite(ratio) ? 'uafklaret' : ratio <= L.weakVsMiddleSlowdown ? 'ok' : 'fejl',
    });
  }

  // 4. Usikker når Tropisk Ø
  {
    const share = reachedShare(svag, 'omraade_tropical_island');
    out.push({
      nr: 4,
      title: `Usikker regner når Den Tropiske Ø inden for ${fmtMin(ctx.minutes)}`,
      target: `mindst ${fmtPct(L.weakTropicalShare)} af de usikre regnere`,
      measured: `${fmtPct(share)} nåede det`,
      status: share >= L.weakTropicalShare ? 'ok' : 'fejl',
    });
  }

  // 5. Hele spillet
  {
    const t = medianTime(middel, 'koeb_golden_hook');
    let status: GoalStatus;
    if (Number.isFinite(t)) status = t >= L.fullGameMinMin && t <= L.fullGameMaxMin ? 'ok' : 'fejl';
    else status = ctx.minutes < L.fullGameMaxMin ? 'uafklaret' : 'fejl';
    out.push({
      nr: 5,
      title: 'Hele spillet varer 6-8 lektioner for en middel regner',
      target: `alt udstyr undtagen Sejlbåden købt efter ${fmtMin(L.fullGameMinMin)}-${fmtMin(L.fullGameMaxMin)}`,
      measured: Number.isFinite(t) ? fmtMin(t) : `ikke nået inden for ${fmtMin(ctx.minutes)}`,
      status,
    });
  }

  // 6. Områdestige
  {
    const ev = (id: string) => catchTable(id, COMPARE_LEVEL, COMPARE_GEAR, 20_000, ctx.seed).avgValue;
    const desert = ev('desert_lake');
    const abyss = ev('abyss');
    const tropical = ev('tropical_island');
    const cave = ev('cave');
    const ok = abyss >= desert * L.abyssOverDesert && tropical > abyss && cave > abyss;
    out.push({
      nr: 6,
      title: 'Hvert nyt område giver mere pr. kast end det forrige',
      target: `Dybet ≥ ${fmtNum(L.abyssOverDesert)}× Ørkensøen; Tropisk Ø og Grotten > Dybet`,
      measured: `pr. kast: Ørkensøen ${fmtNum(desert)}, Dybet ${fmtNum(abyss)}, Tropisk Ø ${fmtNum(tropical)}, Grotten ${fmtNum(cave)} kr (level ${COMPARE_LEVEL}, bosser uden belønning)`,
      status: ok ? 'ok' : 'fejl',
    });
  }

  // 7. Opsparing til næste vare
  {
    const order = DEFAULT_BUY_ORDER.filter((id) => id !== 'luxury_boat');
    const slow: { id: string; gap: number }[] = [];
    for (let i = 0; i < order.length; i++) {
      const id = order[i]!;
      const gaps = middel
        .filter((r) => r.milestones[`koeb_${id}`] !== undefined)
        .map((r) => r.milestones[`koeb_${id}`]! - (i === 0 ? 0 : r.milestones[`koeb_${order[i - 1]!}`] ?? 0));
      if (gaps.length < middel.length / 2) continue;
      const g = median(gaps);
      if (g > L.maxSavingMin) slow.push({ id, gap: g });
    }
    slow.sort((a, b) => b.gap - a.gap);
    out.push({
      nr: 7,
      title: 'Opsparingen til næste vare tager højst 15 minutter (middel regner)',
      target: `≤ ${L.maxSavingMin} min fra forrige køb`,
      measured: slow.length === 0
        ? 'ingen varer over grænsen'
        : slow.slice(0, 4).map((s) => `${shopName(s.id)} ${fmtMin(s.gap)}`).join(', ') + (slow.length > 4 ? ` m.fl. (${slow.length} i alt)` : ''),
      status: slow.length === 0 ? 'ok' : 'fejl',
    });
  }

  // 8. Stærk vs. usikker indtjening
  {
    const at60 = (rs: SimResult[]) => median(rs.map((r) => r.earnedByMinute[59] ?? r.final.earned));
    const ratio = at60(staerk) / at60(svag);
    out.push({
      nr: 8,
      title: 'Stærk regner tjener højst tre gange så meget som usikker',
      target: `≤ ${fmtNum(L.strongVsWeakEarnings)}× i første time`,
      measured: `${fmtNum(ratio)}×`,
      status: ratio <= L.strongVsWeakEarnings ? 'ok' : 'fejl',
    });
  }

  // 9. Kister
  {
    const won = middel.flatMap((r) => r.catches.filter((c) => c.won));
    const chests = won.filter((c) => c.category.startsWith('kiste'));
    const perChest = chests.length === 0 ? Infinity : won.length / chests.length;
    const total = won.reduce((s, c) => s + c.value, 0);
    const share = chests.reduce((s, c) => s + c.value, 0) / total;
    out.push({
      nr: 9,
      title: 'En kiste er noget særligt',
      target: `højst 1 pr. ${L.minCatchesPerChest} fangster og ≤ ${fmtPct(L.maxChestIncomeShare)} af indtjeningen`,
      measured: `1 pr. ${fmtNum(perChest)} fangster, ${fmtPct(share)} af indtjeningen (middel regner)`,
      status: perChest >= L.minCatchesPerChest && share <= L.maxChestIncomeShare ? 'ok' : 'fejl',
    });
  }

  // 10. Usikker regner fanger nok
  {
    const all = svag.flatMap((r) => r.catches);
    const rate = all.filter((c) => c.won).length / all.length;
    out.push({
      nr: 10,
      title: 'Usikker regner fanger det meste af det, der bider',
      target: `mindst ${fmtPct(L.weakCatchRate)}`,
      measured: fmtPct(rate),
      status: rate >= L.weakCatchRate ? 'ok' : 'fejl',
    });
  }

  // 11. Skrald
  {
    const all = middel.flatMap((r) => r.catches);
    const junk = (all.filter((c) => c.category === 'skrald').length / all.length) * 100;
    out.push({
      nr: 11,
      title: 'Skrald fylder en lille del af fangsterne',
      target: `${L.junkMin}-${L.junkMax} pr. 100 kast`,
      measured: `${fmtNum(junk)} pr. 100 kast (middel regner)`,
      status: junk >= L.junkMin && junk <= L.junkMax ? 'ok' : 'fejl',
    });
  }

  return out;
}

// ─── Automatiske fund ────────────────────────────────────────────────────────

/**
 * Udstyr, der skal kunne mærkes på fangsten (ikke adgangsting, spande eller Turbo Hjul), og hvor det
 * måles: sted, level og det udstyr, der i forvejen skal til for at fiske der.
 */
const VALUE_ITEMS: { id: string; location: string; level: number; base: string[] }[] = [
  { id: 'heldig_firkloever', location: 'pier', level: 10, base: ['rod_havblaa', 'rod_bambus'] },
  { id: 'golden_hook', location: 'pier', level: 18, base: ['rod_havblaa', 'rod_bambus', 'rod_mahogni'] },
  { id: 'biolum_floats', location: 'cave', level: 16, base: ['rod_havblaa', 'rod_bambus', 'rod_mahogni', 'headlamp'] },
];

const PROFILE_PLURAL: Record<string, string> = { svag: 'usikre', middel: 'middel', staerk: 'stærke' };

export function findAnomalies(ctx: GoalContext): string[] {
  const out: string[] = [];
  const minutes = ctx.minutes;

  // Områder, man låser op, men ikke bruger: samlet pr. område på tværs af elevtyper.
  const unused = new Map<string, string[]>();
  for (const [id, rs] of Object.entries(ctx.byId)) {
    const areas = new Set(rs.flatMap((r) => Object.keys(r.milestones).filter((k) => k.startsWith('omraade_'))));
    for (const key of areas) {
      const loc = key.replace('omraade_', '');
      if (reachedShare(rs, key) < 0.5) continue;
      const timeShare = rs.reduce((s, r) => s + (r.secondsByLocation[loc] ?? 0), 0) / (rs.length * minutes * 60);
      if (timeShare < 0.02) {
        unused.set(loc, [...(unused.get(loc) ?? []), `${PROFILE_PLURAL[id] ?? id} ${fmtNum(timeShare * 100)} %`]);
      }
    }
  }
  for (const [loc, parts] of unused) {
    out.push(
      `**${locName(loc)}** bliver låst op, men næsten ingen fisker der (andel af tiden: ${parts.join(', ')}). Andre steder giver mere.`,
    );
  }

  // Udstyr uden effekt på fangsten.
  for (const item of VALUE_ITEMS) {
    const before = catchTable(item.location, item.level, item.base, 20_000, ctx.seed).avgValue;
    const after = catchTable(item.location, item.level, [...item.base, item.id], 20_000, ctx.seed).avgValue;
    if (Math.abs(after / before - 1) < 0.01) {
      out.push(
        `**${shopName(item.id)}** ændrer ikke salgsværdien pr. kast (målt i ${locName(item.location)}, level ${item.level}). Den kan have en anden effekt, som simulatoren ikke måler.`,
      );
    }
  }

  // Varer, ingen elevtype når at købe.
  const never = DEFAULT_BUY_ORDER.filter((id) =>
    Object.values(ctx.byId).every((rs) => reachedShare(rs, `koeb_${id}`) < 0.5),
  );
  if (never.length > 0) {
    out.push(`Ingen elevtype når at købe ${never.map(shopName).join(', ')} inden for ${fmtMin(minutes)}.`);
  }

  return out;
}

// ─── Rapport ─────────────────────────────────────────────────────────────────

const ICON: Record<GoalStatus, string> = { ok: '🟢', fejl: '🔴', uafklaret: '🟡' };

export function renderGoals(goals: GoalResult[], anomalies: string[]): string {
  const failed = goals.filter((g) => g.status === 'fejl').length;
  const ok = goals.filter((g) => g.status === 'ok').length;
  const unknown = goals.length - failed - ok;
  return `## Røde flag

**${failed} af ${goals.length} mål er ikke nået** (🟢 ${ok} · 🔴 ${failed}${unknown ? ` · 🟡 ${unknown}` : ''}). Grænserne står i
\`GOAL_LIMITS\` i \`scripts/balance/goals.ts\`.

${table(['', 'Mål', 'Målt', 'Grænse'], goals.map((g) => [ICON[g.status], `${g.nr}. ${g.title}`, g.measured, g.target]))}

### Automatiske fund

Ting, simulatoren selv har bemærket, uden at der er sat et mål for dem.

${anomalies.length === 0 ? '- Ingen.' : anomalies.map((a) => `- ${a}`).join('\n')}
`;
}
