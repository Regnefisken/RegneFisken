/** Fælles hjælpere til balance-rapporten og balancemålene. */
import type { SimResult } from './sim-core.js';

export function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (pos - lo);
}

export function median(values: number[]): number {
  return quantile([...values].sort((a, b) => a - b), 0.5);
}

export function fmtMin(m: number): string {
  if (!Number.isFinite(m)) return '–';
  if (Math.round(m) < 60) return `${Math.round(m)} min`;
  const total = Math.round(m);
  const h = Math.floor(total / 60);
  const r = total - h * 60;
  return r === 0 ? `${h} t` : `${h} t ${r} min`;
}

export const fmtKr = (n: number) => `${Math.round(n).toLocaleString('da-DK')} kr`;
export const fmtNum = (n: number, d = 1) =>
  n.toLocaleString('da-DK', { minimumFractionDigits: d, maximumFractionDigits: d });
export const fmtPct = (share: number) => `${fmtNum(share * 100, 0)} %`;

/**
 * Tider (minutter) for en milepæl. Spillere, der ikke nåede den, tæller som `Infinity`,
 * så kvantiler bliver "efter simuleringens slut" i stedet for at blive udeladt.
 */
export function milestoneTimes(results: SimResult[], key: string): number[] {
  return results.map((r) => r.milestones[key] ?? Infinity).sort((a, b) => a - b);
}

/** Andel af spillerne, der nåede en milepæl. */
export function reachedShare(results: SimResult[], key: string): number {
  return results.filter((r) => r.milestones[key] !== undefined).length / results.length;
}

export function table(header: string[], rows: string[][]): string {
  const line = (cells: string[]) => `| ${cells.join(' | ')} |`;
  return [line(header), line(header.map(() => '---')), ...rows.map(line)].join('\n');
}
