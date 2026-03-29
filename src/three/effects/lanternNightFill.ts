import {
  computeDayNightPhase,
  computeNightSkyOpacity,
  getWeatherEntry,
  smoothstep01,
} from '../logic/environment.js';

/**
 * `computeNightSkyOpacity` er til stjerner og er 0 i første halvdel af Aften→Nat — molen skal have
 * fill tidligere; se PierLantern.
 */
export function pierLanternFillFactor(curName: string, nxtName: string, lerpT: number): number {
  const starMask = computeNightSkyOpacity(curName, nxtName, lerpT);
  if (curName === 'Aften' && nxtName === 'Nat') {
    return Math.max(starMask, smoothstep01(lerpT));
  }
  return starMask;
}

/** Molen: nat/skur + vejr — samme maske som PierLantern. */
export function computeLanternTargetIntensity(timeMs: number, weatherType: string): number {
  const { cur, nxt, lerpT } = computeDayNightPhase(timeMs);
  const fillOp = pierLanternFillFactor(cur.name, nxt.name, lerpT);
  const baseIntensity = smoothstep01(fillOp) * 5.5;
  const { lightMod } = getWeatherEntry(weatherType);
  const weatherBoost = 1.0 + (1.0 - lightMod) * 0.6;
  return baseIntensity * weatherBoost;
}

/**
 * Grotte har ingen sollys — vi holder et gulv i fyld (så den ikke er sort midt på "dagen"), og
 * skalerer stadig med vejr + skumring som molen.
 */
export function computeCaveFillTargetIntensity(timeMs: number, weatherType: string): number {
  const { cur, nxt, lerpT } = computeDayNightPhase(timeMs);
  const fillOp = Math.max(pierLanternFillFactor(cur.name, nxt.name, lerpT), 0.52);
  const baseIntensity = smoothstep01(fillOp) * 4.2;
  const { lightMod } = getWeatherEntry(weatherType);
  const weatherBoost = 1.0 + (1.0 - lightMod) * 0.6;
  return baseIntensity * weatherBoost;
}
