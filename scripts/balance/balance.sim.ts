/**
 * Kører balance-simulatoren og skriver rapporten til `docs/balance-report.md`.
 *
 *   npm run sim
 *
 * Miljøvariabler (valgfri): BALANCE_PLAYERS (spillere pr. elevtype, standard 100),
 * BALANCE_MINUTES (spilletid pr. spiller, standard 240), BALANCE_SEED (standard 1).
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { it, vi } from 'vitest';
import { getLocation } from '../../src/data/locations.js';
import { SHOP_ITEMS } from '../../src/data/shop.js';
import {
  DEFAULT_BUY_ORDER,
  DEFAULT_PROFILES,
  TIMING,
  catchTable,
  simulatePlayer,
  type CatchCategory,
  type SimResult,
  type StudentProfile,
} from './sim-core.js';

vi.mock('../../src/audio/audioEngine.js');

const PLAYERS = Number(process.env.BALANCE_PLAYERS ?? 100);
const MINUTES = Number(process.env.BALANCE_MINUTES ?? 240);
const SEED = Number(process.env.BALANCE_SEED ?? 1);

const CATEGORY_LABEL: Record<CatchCategory, string> = {
  fisk: 'Fisk',
  kiste_lille: 'Lille kiste',
  kiste: 'Kiste',
  kiste_stor: 'Stor kiste',
  skrald: 'Skrald',
  flaskepost: 'Flaskepost',
  boss: 'Boss',
  krystal: 'Krystal',
  samleobjekt: 'Samleobjekt',
  brandmand: 'Brandmand',
  tom_krog: 'Tom krog',
  andet: 'Andet',
};
const CATEGORIES = Object.keys(CATEGORY_LABEL) as CatchCategory[];

// ─── Hjælpere ────────────────────────────────────────────────────────────────

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (pos - lo);
}

function fmtMin(m: number): string {
  if (!Number.isFinite(m)) return '–';
  if (Math.round(m) < 60) return `${Math.round(m)} min`;
  const total = Math.round(m);
  const h = Math.floor(total / 60);
  const r = total - h * 60;
  return r === 0 ? `${h} t` : `${h} t ${r} min`;
}

const fmtKr = (n: number) => `${Math.round(n).toLocaleString('da-DK')} kr`;
const fmtNum = (n: number, d = 1) => n.toLocaleString('da-DK', { minimumFractionDigits: d, maximumFractionDigits: d });

/** "median (p10–p90)" for en milepæl og andelen, der nåede den. */
function milestoneCell(results: SimResult[], key: string): string {
  const times = results.map((r) => r.milestones[key]).filter((v): v is number => v !== undefined).sort((a, b) => a - b);
  const share = times.length / results.length;
  if (share < 0.5) return share === 0 ? 'ikke nået' : `kun ${Math.round(share * 100)} % nåede det`;
  const med = quantile(times, 0.5);
  const p10 = quantile(times, 0.1);
  // p90 over alle spillere; dem der ikke nåede det tæller som "efter simuleringens slut".
  const all = results.map((r) => r.milestones[key] ?? Infinity).sort((a, b) => a - b);
  const p90 = quantile(all.map((v) => (Number.isFinite(v) ? v : MINUTES * 10)), 0.9);
  const p90txt = p90 > MINUTES ? `>${fmtMin(MINUTES)}` : fmtMin(p90);
  const suffix = share < 1 ? ` · ${Math.round(share * 100)} % nåede` : '';
  return `${fmtMin(med)} (${fmtMin(p10)}–${p90txt})${suffix}`;
}

function table(header: string[], rows: string[][]): string {
  const line = (cells: string[]) => `| ${cells.join(' | ')} |`;
  return [line(header), line(header.map(() => '---')), ...rows.map(line)].join('\n');
}

const locName = (id: string) => getLocation(id).name;
const shopName = (id: string) => SHOP_ITEMS.find((i) => i.id === id)?.name ?? id;

// ─── Kørsel ──────────────────────────────────────────────────────────────────

function runProfile(profile: StudentProfile, profileIndex: number): SimResult[] {
  const out: SimResult[] = [];
  for (let i = 0; i < PLAYERS; i++) {
    out.push(simulatePlayer({ profile, minutes: MINUTES, seed: SEED * 1_000_003 + profileIndex * 100_000 + i }));
  }
  return out;
}

function buildReport(byProfile: Map<StudentProfile, SimResult[]>): string {
  const profiles = [...byProfile.keys()];
  const header = ['', ...profiles.map((p) => p.name)];
  const parts: string[] = [];

  parts.push(`# Balance-rapport

Genereret af \`npm run sim\` den ${new Date().toLocaleDateString('da-DK')}. ${PLAYERS} virtuelle spillere pr. elevtype,
hver med ${fmtMin(MINUTES)} spilletid (frø ${SEED}). Tider er **spilletid**, ikke kalendertid.

Tal vises som **median (de hurtigste 10 % – de langsomste 10 %)**. "x % nåede" betyder, at resten ikke nåede
milepælen inden for spilletiden.

## Forudsætninger

${table(['Elevtype', 'Rigtige svar', 'Tid pr. svar'], profiles.map((p) => [p.name, `${Math.round(p.correctRate * 100)} %`, `${p.secondsPerAnswer} s`]))}

- Fast tid pr. kast: kast ${fmtNum(TIMING.castSec, 2)} s, ventetid til bid ${fmtNum(TIMING.biteMinSec)}–${fmtNum(TIMING.biteMinSec + TIMING.biteSpanSec)} s
  (Turbo Hjul: ${TIMING.reelShaveSec} s kortere maks.), reaktion ${TIMING.reactSec} s, fangst-panel ${TIMING.resultPanelSec} s.
  Salg ${TIMING.sellSec} s, køb ${TIMING.buySec} s, rejse ${TIMING.travelSec} s. Forkert svar koster ${TIMING.wrongPenaltySec} s.
- Spilleren sælger, når spanden er fuld, og fisker der, hvor en fangst i gennemsnit er mest værd.
- Indkøbsliste (spilleren sparer op til den næste ting og springer intet over):
  ${DEFAULT_BUY_ORDER.map(shopName).join(' → ')}.
- **Ikke med:** mål-belønninger, bossernes særlige belønninger, madding, vejr (altid klart), garderobe-ting fra
  kister, hytten, Jungleøen, NPC'er og minispil. Tallene for mønter er derfor et minimum.
`);

  // Fremgang
  const levelKeys = [3, 5, 8, 10, 12, 15, 20].map((l) => `level_${l}`);
  parts.push(`## Fremgang: hvornår når man et level

${table(header, levelKeys.map((k) => [k.replace('level_', 'Level '), ...profiles.map((p) => milestoneCell(byProfile.get(p)!, k))]))}
`);

  const areaKeys = [...new Set(profiles.flatMap((p) => byProfile.get(p)!.flatMap((r) => Object.keys(r.milestones))))]
    .filter((k) => k.startsWith('omraade_'));
  const firstAreaTime = (k: string) => {
    const ts = profiles.flatMap((p) => byProfile.get(p)!.map((r) => r.milestones[k] ?? Infinity));
    return quantile(ts.sort((a, b) => a - b), 0.5);
  };
  areaKeys.sort((a, b) => firstAreaTime(a) - firstAreaTime(b));
  parts.push(`## Fremgang: hvornår kan man fiske i et nyt område

Tidspunktet, hvor området er låst op **og** spilleren har det, der skal til for at fiske der (fx fisketilladelse
eller stang).

${table(header, areaKeys.map((k) => [locName(k.replace('omraade_', '')), ...profiles.map((p) => milestoneCell(byProfile.get(p)!, k))]))}
`);

  parts.push(`## Butikken: hvornår har man købt hver ting

${table(['Vare (pris)', ...profiles.map((p) => p.name)], DEFAULT_BUY_ORDER.map((id) => {
    const item = SHOP_ITEMS.find((i) => i.id === id)!;
    return [`${item.name} (${fmtKr(item.cost)})`, ...profiles.map((p) => milestoneCell(byProfile.get(p)!, `koeb_${id}`))];
  }))}
`);

  // Økonomi
  const checkpoints = [15, 30, 60, 120, 180, 240].filter((m) => m <= MINUTES);
  parts.push(`## Økonomi: mønter tjent i alt (salg)

${table(['Efter', ...profiles.map((p) => p.name)], checkpoints.map((m) => [fmtMin(m), ...profiles.map((p) => {
    const v = byProfile.get(p)!.map((r) => r.earnedByMinute[m - 1] ?? r.final.earned).sort((a, b) => a - b);
    return `${fmtKr(quantile(v, 0.5))} (${fmtKr(quantile(v, 0.1))}–${fmtKr(quantile(v, 0.9))})`;
  })]))}
`);

  const hours = Math.floor(MINUTES / 60);
  if (hours >= 1) {
    parts.push(`### Mønter pr. time

${table(['Time', ...profiles.map((p) => p.name)], Array.from({ length: hours }, (_, h) => [`${h + 1}. time`, ...profiles.map((p) => {
      const v = byProfile.get(p)!.map((r) => (r.earnedByMinute[(h + 1) * 60 - 1] ?? 0) - (h === 0 ? 0 : r.earnedByMinute[h * 60 - 1] ?? 0)).sort((a, b) => a - b);
      return fmtKr(quantile(v, 0.5));
    })]))}
`);
  }

  // Fangster
  parts.push(`## Fangster: hvad kommer op pr. 100 kast

Alle kast i simuleringen samlet pr. elevtype. "Fanget" er andelen af kast, hvor kampen blev vundet.

${table(['', ...profiles.map((p) => p.name)], [
    ...CATEGORIES.map((cat) => [CATEGORY_LABEL[cat], ...profiles.map((p) => {
      const all = byProfile.get(p)!.flatMap((r) => r.catches);
      return fmtNum((all.filter((c) => c.category === cat).length / all.length) * 100);
    })]).filter((row) => row.slice(1).some((v) => v !== '0,0')),
    ['**Fanget**', ...profiles.map((p) => {
      const all = byProfile.get(p)!.flatMap((r) => r.catches);
      return `${fmtNum((all.filter((c) => c.won).length / all.length) * 100)} %`;
    })],
    ['**Kast pr. time**', ...profiles.map((p) => {
      const rs = byProfile.get(p)!;
      return fmtNum(rs.reduce((s, r) => s + r.catches.length, 0) / rs.length / (MINUTES / 60), 0);
    })],
  ])}
`);

  parts.push(`### Kister

${table(['', ...profiles.map((p) => p.name)], [
    ['Kister fanget pr. time', ...profiles.map((p) => {
      const rs = byProfile.get(p)!;
      const n = rs.reduce((s, r) => s + r.catches.filter((c) => c.won && c.category.startsWith('kiste')).length, 0);
      return fmtNum(n / rs.length / (MINUTES / 60));
    })],
    ['Fangster pr. kiste', ...profiles.map((p) => {
      const all = byProfile.get(p)!.flatMap((r) => r.catches.filter((c) => c.won));
      const n = all.filter((c) => c.category.startsWith('kiste')).length;
      return n === 0 ? '–' : fmtNum(all.length / n);
    })],
    ['Andel af indtjeningen fra kister', ...profiles.map((p) => {
      const all = byProfile.get(p)!.flatMap((r) => r.catches.filter((c) => c.won));
      const total = all.reduce((s, c) => s + c.value, 0);
      const chest = all.filter((c) => c.category.startsWith('kiste')).reduce((s, c) => s + c.value, 0);
      return `${fmtNum((chest / total) * 100)} %`;
    })],
    ['Minutter til første kiste', ...profiles.map((p) => milestoneCell(byProfile.get(p)!, 'foerste_kiste'))],
  ])}
`);

  // Tid pr. sted
  const locIds = [...new Set(profiles.flatMap((p) => byProfile.get(p)!.flatMap((r) => Object.keys(r.secondsByLocation))))];
  parts.push(`## Hvor bruger spillerne tiden

${table(['Sted', ...profiles.map((p) => p.name)], locIds.map((id) => [locName(id), ...profiles.map((p) => {
    const rs = byProfile.get(p)!;
    const sec = rs.reduce((s, r) => s + (r.secondsByLocation[id] ?? 0), 0);
    return `${fmtNum((sec / (rs.length * MINUTES * 60)) * 100)} %`;
  })]))}
`);

  // Fangsttabel pr. sted
  const setups: { level: number; upgrades: string[]; label: string }[] = [
    { level: 3, upgrades: [], label: 'Level 3, intet udstyr' },
    { level: 10, upgrades: ['rod_havblaa', 'rod_bambus', 'license_smaragd', 'license_abyss', 'heldig_firkloever'], label: 'Level 10, Bambus + Firkløver' },
    { level: 20, upgrades: ['rod_havblaa', 'rod_bambus', 'rod_mahogni', 'license_smaragd', 'license_abyss', 'headlamp', 'heldig_firkloever', 'biolum_floats', 'golden_hook'], label: 'Level 20, alt udstyr' },
  ];
  const tableLocs = ['pier', 'smaragd', 'abyss', 'desert_lake', 'arctic_sea', 'forbidden', 'tropical_island', 'cave'];
  for (const setup of setups) {
    const rows = tableLocs.map((id) => {
      const { perHundred, avgValue } = catchTable(id, setup.level, setup.upgrades, 20_000, SEED);
      return [locName(id), fmtNum(avgValue), ...CATEGORIES.map((c) => fmtNum(perHundred[c] ?? 0))];
    });
    const used = CATEGORIES.filter((_, i) => rows.some((r) => r[i + 2] !== '0,0'));
    parts.push(`## Fangsttabel: ${setup.label}

Pr. 100 kast (20.000 prøvekast pr. sted, uden spillere, flaskeposten allerede fundet). "Værdi" er
gennemsnitlig salgsværdi pr. kast uden streak-bonus. Steder, man ikke kan fiske på med dette udstyr, vises
alligevel som "hvis man kunne".

${table(['Sted', 'Værdi', ...used.map((c) => CATEGORY_LABEL[c])], rows.map((r) => [r[0]!, r[1]!, ...used.map((c) => r[CATEGORIES.indexOf(c) + 2]!)]))}
`);
  }

  return parts.join('\n');
}

it('balance-simulering', () => {
  const byProfile = new Map<StudentProfile, SimResult[]>();
  DEFAULT_PROFILES.forEach((p, i) => byProfile.set(p, runProfile(p, i)));
  const report = buildReport(byProfile);
  const file = resolve(process.cwd(), 'docs', 'balance-report.md');
  writeFileSync(file, report, 'utf8');
  console.log(`\nRapport skrevet til ${file}\n`);
}, 30 * 60 * 1000);
