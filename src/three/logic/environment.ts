import { Color, MathUtils, Vector3 } from 'three';
import { DAY_NIGHT_CYCLE } from '../../data/world.js';
import { WEATHER_TYPES } from '../../data/weather.js';
import { getLocation } from '../../data/locations.js';
import type { DayNightPhase } from '../../types/game.js';

export function getWeatherEntry(weatherType: string) {
  const key = weatherType.toUpperCase() as keyof typeof WEATHER_TYPES;
  return WEATHER_TYPES[key] ?? WEATHER_TYPES.CLEAR;
}

export function computeDayNightPhase(timeMs: number): {
  phaseIdx: number;
  cur: DayNightPhase;
  nxt: DayNightPhase;
  lerpT: number;
} {
  const { duration, phases } = DAY_NIGHT_CYCLE;
  const cycleProgress = (timeMs % duration) / duration;
  let phaseIdx = phases.length - 1;
  for (let i = 0; i < phases.length - 1; i++) {
    if (cycleProgress >= phases[i].time && cycleProgress < phases[i + 1].time) {
      phaseIdx = i;
      break;
    }
  }
  const nextIdx = (phaseIdx + 1) % phases.length;
  const cur = phases[phaseIdx] as DayNightPhase;
  const nxt = phases[nextIdx] as DayNightPhase;
  const segStart = cur.time;
  const segEnd = nextIdx === 0 ? 1.0 : nxt.time;
  const lerpT = MathUtils.clamp((cycleProgress - segStart) / (segEnd - segStart), 0, 1);
  return { phaseIdx, cur, nxt, lerpT };
}

const SKY_OFF_LOCATIONS = new Set(['cave', 'fishing_cabin']);

/** Udendørs fiskesteder med synlig himmel — samme døgn-/baggrund som mole (ingen lokations-lerp mod statisk farve). */
export function usesDayNightSolidBackdrop(locationId: string): boolean {
  return !SKY_OFF_LOCATIONS.has(locationId);
}

const SKY_BY_PHASE_NAME: Record<
  string,
  { inclination: number; azimuth: number; turbidity: number; rayleigh: number }
> = {
  Morgen: { inclination: 0.545, azimuth: 0.20, turbidity: 4.0, rayleigh: 0.55 },
  Dag:    { inclination: 0.68,  azimuth: 0.28, turbidity: 2.5, rayleigh: 0.60 },
  Aften:  { inclination: 0.52,  azimuth: 0.40, turbidity: 7.0, rayleigh: 0.25 },
  Nat:    { inclination: 0.40,  azimuth: 0.52, turbidity: 18,  rayleigh: 0.07 },
};

export interface SkyFrame {
  enabled: boolean;
  inclination: number;
  azimuth: number;
  turbidity: number;
  rayleigh: number;
  mieCoefficient: number;
  mieDirectionalG: number;
  sunDirection: Vector3;
}

function sunDirectionFromAngles(inclination: number, azimuth: number, target: Vector3) {
  const theta = Math.PI * (inclination - 0.5);
  const phi = 2 * Math.PI * (azimuth - 0.5);
  target.set(Math.cos(phi), Math.sin(theta), Math.sin(phi));
  if (target.lengthSq() < 1e-8) target.set(0, 1, 0);
  else target.normalize();
}

/** Drei `<Sky>` + sollys — koblet til døgn (timeMs) og vejr. */
export function computeSkyFrame(
  opts: { timeMs: number; weatherType: string; locationId: string },
  sunDirectionOut: Vector3,
): SkyFrame {
  if (SKY_OFF_LOCATIONS.has(opts.locationId)) {
    sunDirectionOut.set(0, 1, 0);
    return {
      enabled: false,
      inclination: 0.5,
      azimuth: 0.25,
      turbidity: 10,
      rayleigh: 0.5,
      mieCoefficient: 0.005,
      mieDirectionalG: 0.8,
      sunDirection: sunDirectionOut,
    };
  }

  const wData = getWeatherEntry(opts.weatherType);
  const { cur, nxt, lerpT } = computeDayNightPhase(opts.timeMs);
  const A = SKY_BY_PHASE_NAME[cur.name] ?? SKY_BY_PHASE_NAME.Dag;
  const B = SKY_BY_PHASE_NAME[nxt.name] ?? SKY_BY_PHASE_NAME.Dag;

  const inclination = MathUtils.lerp(A.inclination, B.inclination, lerpT);
  let azimuth =
    MathUtils.lerp(A.azimuth, B.azimuth, lerpT) +
    (opts.timeMs / DAY_NIGHT_CYCLE.duration) * 0.12;
  azimuth = ((azimuth % 1) + 1) % 1;

  let turbidity = MathUtils.lerp(A.turbidity, B.turbidity, lerpT);
  let rayleigh = MathUtils.lerp(A.rayleigh, B.rayleigh, lerpT);
  let mieCoefficient = 0.0028 + (1 - wData.lightMod) * 0.014;

  if (wData.storm) {
    turbidity += 11;
    mieCoefficient += 0.022;
    rayleigh *= 0.72;
  } else if (wData.rain) {
    turbidity += 4.5;
    mieCoefficient += 0.008;
    rayleigh *= 0.88;
  }

  if (wData.fogDens > 0.06) {
    turbidity += 3;
    mieCoefficient += 0.004;
  }

  sunDirectionFromAngles(inclination, azimuth, sunDirectionOut);

  return {
    enabled: true,
    inclination,
    azimuth,
    turbidity,
    rayleigh,
    mieCoefficient,
    mieDirectionalG: wData.storm ? 0.72 : 0.82,
    sunDirection: sunDirectionOut,
  };
}

export interface EnvironmentFrame {
  bg: Color;
  fogColor: Color;
  fogNear: number;
  fogFar: number;
  sunColor: Color;
  sunIntensity: number;
  ambColor: Color;
  ambIntensity: number;
  caveMode: boolean;
  /** Pandelampe (SpotLight) — kun >0 i grotte med tændt lampe. */
  caveSpotIntensity: number;
  /** Hemisphere-fill over/under scenen — kun >0 i grotte med tændt lampe. */
  caveHemiIntensity: number;
}

export function computeEnvironmentFrame(opts: {
  timeMs: number;
  weatherType: string;
  locationId: string;
  headlampOn: boolean;
}): EnvironmentFrame {
  const loc = getLocation(opts.locationId);
  const wData = getWeatherEntry(opts.weatherType);
  const cave = opts.locationId === 'cave';

  if (cave) {
    const lit = opts.headlampOn;
    /* Uden lampe: næsten sort. Med lampe: højere ambient + hemi + kraftig spot — ellers ses kun additive partikler/emissive. */
    return {
      bg: new Color(lit ? 0x060809 : 0x010101),
      fogColor: new Color(lit ? 0x1a2530 : 0x020202),
      fogNear: lit ? 1.5 : 12,
      fogFar: lit ? 78 : 35,
      sunColor: new Color(0xffffff),
      sunIntensity: 0,
      ambColor: new Color(lit ? 0xffffff : 0x8899aa),
      ambIntensity: lit ? 0.48 : 0.035,
      caveMode: true,
      caveSpotIntensity: lit ? 42 : 0,
      caveHemiIntensity: lit ? 0.62 : 0,
    };
  }

  const { cur, nxt, lerpT } = computeDayNightPhase(opts.timeMs);

  const baseLight = new Color().lerpColors(new Color(cur.lightColor), new Color(nxt.lightColor), lerpT);
  const baseBg = new Color().lerpColors(new Color(cur.bgColor), new Color(nxt.bgColor), lerpT);
  const baseFog = new Color().lerpColors(new Color(cur.fogColor), new Color(nxt.fogColor), lerpT);

  const mod = wData.lightMod;
  const sunColor = baseLight.clone().multiplyScalar(mod);
  let sunIntensity = MathUtils.lerp(cur.intensity, nxt.intensity, lerpT) * mod;

  const finalBg = baseBg.clone().multiplyScalar(mod);
  const finalFog = baseFog.clone().multiplyScalar(mod);

  if (wData.storm) {
    const storm = new Color(0x1a202c);
    const stormLerp = opts.locationId === 'pier' ? 0.8 : 0.75;
    finalBg.lerp(storm, stormLerp);
    finalFog.lerp(storm, stormLerp);
  }

  // Grottesø/hytte: bevar lokationstoner i bg/tåge. Øvrige fiskesteder: ren døgn + vejr (som legacy mole).
  if (!usesDayNightSolidBackdrop(opts.locationId)) {
    finalBg.lerp(new Color(loc.bgColor), 0.22);
    finalFog.lerp(new Color(loc.fogColor), 0.25);
  }

  const foggy = wData.fogDens > 0.04;
  const fogNear = foggy ? 5 : loc.fogNear;
  const fogFar = foggy ? 25 : loc.fogFar;

  const baseAmb = MathUtils.lerp(cur.intensity, nxt.intensity, lerpT);
  const ambIntensity = MathUtils.clamp(baseAmb * 0.45 + 0.30, 0.18, 0.95) * Math.max(0.45, mod);
  const ambColor = new Color(0xffffff);

  // Solstyrke som legacy (ingen ekstra 1.35×); toneMapping i Canvas giver lys nok.

  return {
    bg: finalBg,
    fogColor: finalFog,
    fogNear,
    fogFar,
    sunColor,
    sunIntensity,
    ambColor,
    ambIntensity,
    caveMode: false,
    caveSpotIntensity: 0,
    caveHemiIntensity: 0,
  };
}
