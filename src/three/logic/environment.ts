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

const SKY_BY_PHASE_NAME: Record<
  string,
  { inclination: number; azimuth: number; turbidity: number; rayleigh: number }
> = {
  Morgen: { inclination: 0.51, azimuth: 0.22, turbidity: 5.5, rayleigh: 0.52 },
  Dag: { inclination: 0.58, azimuth: 0.26, turbidity: 3.8, rayleigh: 0.42 },
  Aften: { inclination: 0.485, azimuth: 0.33, turbidity: 7.2, rayleigh: 0.3 },
  Nat: { inclination: 0.44, azimuth: 0.52, turbidity: 13.5, rayleigh: 0.16 },
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
    return {
      bg: new Color(0x010101),
      fogColor: new Color(0x020202),
      fogNear: opts.headlampOn ? 6 : 12,
      fogFar: opts.headlampOn ? 28 : 35,
      sunColor: new Color(0xffffff),
      sunIntensity: 0,
      ambColor: new Color(0x8899aa),
      ambIntensity: 0.04,
      caveMode: true,
    };
  }

  const { phaseIdx, cur, nxt, lerpT } = computeDayNightPhase(opts.timeMs);
  void phaseIdx;

  const baseLight = new Color().lerpColors(new Color(cur.lightColor), new Color(nxt.lightColor), lerpT);
  const baseBg = new Color().lerpColors(new Color(cur.bgColor), new Color(nxt.bgColor), lerpT);
  const baseFog = new Color().lerpColors(new Color(cur.fogColor), new Color(nxt.fogColor), lerpT);

  const mod = wData.lightMod;
  const sunColor = baseLight.clone().multiplyScalar(mod);
  const sunIntensity = MathUtils.lerp(cur.intensity, nxt.intensity, lerpT) * mod;

  const finalBg = baseBg.clone().multiplyScalar(mod);
  const finalFog = baseFog.clone().multiplyScalar(mod);

  if (wData.storm) {
    const storm = new Color(0x1a202c);
    finalBg.lerp(storm, 0.75);
    finalFog.lerp(storm, 0.75);
  }

  finalBg.lerp(new Color(loc.bgColor), 0.22);
  finalFog.lerp(new Color(loc.fogColor), 0.25);

  const foggy = wData.fogDens > 0.04;
  const fogNear = foggy ? 5 : loc.fogNear;
  const fogFar = foggy ? 25 : loc.fogFar;

  const ambIntensity =
    MathUtils.lerp(0.6, cur.intensity < 0.5 ? 0.3 : 0.7, lerpT) * Math.max(0.4, mod);

  const ambColor = new Color().lerpColors(new Color(cur.ambientColor), new Color(nxt.ambientColor), lerpT);
  ambColor.multiplyScalar(mod);

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
  };
}
