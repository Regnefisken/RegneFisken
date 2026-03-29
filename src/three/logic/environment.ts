import { Color, MathUtils, Vector3 } from 'three';
import { DAY_NIGHT_CYCLE } from '../../data/world.js';
import { WEATHER_TYPES } from '../../data/weather.js';
import { getLocation } from '../../data/locations.js';
import type { DayNightPhase } from '../../types/game.js';

export function getWeatherEntry(weatherType: string) {
  const key = weatherType.toUpperCase() as keyof typeof WEATHER_TYPES;
  return WEATHER_TYPES[key] ?? WEATHER_TYPES.CLEAR;
}

export function smoothstep01(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/**
 * I Nat→Morgen-segmentet går rå `lerpT` 0→1 over hele "nat"-fasen, så himmel/lys ellers lerper mod
 * morgen fra første sekund (fejl: nat der lyser som solopgang). Holder effektiv interpolation på Nat
 * indtil samme grænse som stjerne-fade — derefter kort overgang til Morgen (ikke halv nat).
 */
export const NAT_TO_MORGEN_HOLD_LERP = 0.94;

/**
 * Nat→Morgen: lys/tåge holder stadig nat til `NAT_TO_MORGEN_HOLD_LERP`, men solens kørebane
 * skal bevæge sig roligt over sen nat — ellers ligger hele vinkel-springet i sidste ~6% af segmentet.
 */
const NAT_TO_MORGEN_SUN_ARC_START_LERP = 0.5;

/** Under/ over denne grænse skjules Drei-himmel og der bruges solid baggrund til stjerner. */
export const NIGHT_SKY_DREI_THRESHOLD = 0.87;

export function effectivePhaseLerpT(curName: string, nxtName: string, segmentLerpT: number): number {
  if (curName === 'Nat' && nxtName === 'Morgen') {
    if (segmentLerpT <= NAT_TO_MORGEN_HOLD_LERP) return 0;
    return (segmentLerpT - NAT_TO_MORGEN_HOLD_LERP) / (1 - NAT_TO_MORGEN_HOLD_LERP);
  }
  return segmentLerpT;
}

/** Lerpfaktor kun til solens inklinations/azimuth (himmel + skygger) — adskilt fra lys/turbidity-hold. */
export function sunAnglesLerpT(curName: string, nxtName: string, segmentLerpT: number): number {
  if (curName === 'Nat' && nxtName === 'Morgen') {
    const t0 = NAT_TO_MORGEN_SUN_ARC_START_LERP;
    if (segmentLerpT <= t0) return 0;
    const u = MathUtils.clamp((segmentLerpT - t0) / (1 - t0), 0, 1);
    return smoothstep01(u);
  }
  return effectivePhaseLerpT(curName, nxtName, segmentLerpT);
}

/**
 * Synlighed af stjerner/måne (0–1). Bruges også til Drei-Sky vs. solid natbaggrund —
 * samme maske undgår "kontakt" når fasen skifter til Morgen.
 */
export function computeNightSkyOpacity(curName: string, nxtName: string, lerpT: number): number {
  if (curName === 'Morgen' || curName === 'Dag') return 0;
  if (curName === 'Aften' && nxtName === 'Nat') {
    if (lerpT < 0.5) return 0;
    const t = (lerpT - 0.5) / 0.5;
    return smoothstep01(t);
  }
  if (curName === 'Nat' && nxtName === 'Morgen') {
    if (lerpT < NAT_TO_MORGEN_HOLD_LERP) return 1;
    const t = (lerpT - NAT_TO_MORGEN_HOLD_LERP) / (1 - NAT_TO_MORGEN_HOLD_LERP);
    return 1 - smoothstep01(t);
  }
  return 0;
}

/**
 * Monoton 0→1+ over synlig nat og ind i morgen.
 * Starter ~20 s *før* Nat-fasens begyndelse; fortsætter forbi 1.0 efter
 * cyklus-wrap så månen kan stige ud af billedet i stedet for at forsvinde brat.
 * `arcLen` er uændret (= 1 − natStart) så tempo/dybde er identisk.
 */
const MOON_EARLY_S = 20;
const MOON_SPEED = 1.2;

export function computeMoonArcU(cycleProgress: number): number | null {
  const natStart = DAY_NIGHT_CYCLE.phases[3].time;
  const arcLen = 1.0 - natStart;
  const earlyFrac = MOON_EARLY_S / (DAY_NIGHT_CYCLE.duration / 1000);
  const moonStart = natStart - earlyFrac;
  if (cycleProgress >= moonStart) {
    return ((cycleProgress - moonStart) / arcLen) * MOON_SPEED;
  }
  const dagStart = DAY_NIGHT_CYCLE.phases[1].time;
  if (cycleProgress < dagStart) {
    return ((arcLen + earlyFrac + cycleProgress) / arcLen) * MOON_SPEED;
  }
  return null;
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

const SKY_OFF_LOCATIONS = new Set(['cave']);

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
  const { cur, nxt, lerpT: segmentLerpT } = computeDayNightPhase(opts.timeMs);
  const tintLerp = effectivePhaseLerpT(cur.name, nxt.name, segmentLerpT);
  const sunLerp = sunAnglesLerpT(cur.name, nxt.name, segmentLerpT);
  const A = SKY_BY_PHASE_NAME[cur.name] ?? SKY_BY_PHASE_NAME.Dag;
  const B = SKY_BY_PHASE_NAME[nxt.name] ?? SKY_BY_PHASE_NAME.Dag;

  const inclination = MathUtils.lerp(A.inclination, B.inclination, sunLerp);
  let azimuth =
    MathUtils.lerp(A.azimuth, B.azimuth, sunLerp) +
    (opts.timeMs / DAY_NIGHT_CYCLE.duration) * 0.12;

  let turbidity = MathUtils.lerp(A.turbidity, B.turbidity, tintLerp);
  let rayleigh = MathUtils.lerp(A.rayleigh, B.rayleigh, tintLerp);
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

  /* Nat→Morgen: dæmp Preetham-dis så Drei-Sky ikke blinker hvid når den afløser solid natbaggrund.
     Solvinkel er allerede nær Morgen-position (sunAnglesLerpT ≫ tintLerp), men turbidity/rayleigh
     er stadig på Nat-niveau — kombinationen giver blændende hvid haze i Preetham-modellen. */
  {
    const nightOp = computeNightSkyOpacity(cur.name, nxt.name, segmentLerpT);
    if (nightOp < 0.55 && (cur.name === 'Nat' || cur.name === 'Morgen')) {
      const w = Math.min(1, (0.55 - nightOp) / 0.55);
      mieCoefficient *= MathUtils.lerp(1, 0.38, w);
      turbidity = Math.max(2.2, turbidity - 5 * w);
      rayleigh = MathUtils.lerp(rayleigh, 0.58, 0.35 * w);
    }
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
      bg: new Color(lit ? 0x060809 : 0x05060a),
      fogColor: new Color(lit ? 0x1a2530 : 0x0a1018),
      fogNear: lit ? 1.5 : 10,
      fogFar: lit ? 78 : 38,
      sunColor: new Color(0xffffff),
      sunIntensity: 0,
      ambColor: new Color(lit ? 0xffffff : 0x8ca0b0),
      ambIntensity: lit ? 0.48 : 0.11,
      caveMode: true,
      caveSpotIntensity: lit ? 42 : 0,
      caveHemiIntensity: lit ? 0.62 : 0,
    };
  }

  const { cur, nxt, lerpT: segmentLerpT } = computeDayNightPhase(opts.timeMs);
  const lerpT = effectivePhaseLerpT(cur.name, nxt.name, segmentLerpT);

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

  // Kun grotte: statisk lokationstoner i bg/tåge. Hytte bruger samme himmel som molen (synligt vindue).
  if (!usesDayNightSolidBackdrop(opts.locationId)) {
    finalBg.lerp(new Color(loc.bgColor), 0.22);
    finalFog.lerp(new Color(loc.fogColor), 0.25);
  }

  /* Fiskehytte: morgenudsyn — sart lyseblå → dybere dagblå (mindre fersken-grå tåge gennem glas). */
  if (opts.locationId === 'fishing_cabin' && cur.name === 'Morgen' && nxt.name === 'Dag') {
    const winSky = new Color().lerpColors(new Color(0xc8eaff), new Color(0x5a9ec9), segmentLerpT);
    finalBg.lerp(winSky, 0.22);
    finalFog.lerp(winSky, 0.26);
  }

  /* Nat→Morgen: dæmp hvid glimt i bg/tåge når stjernebaggrund slipper og Drei-himmel vises. */
  {
    const nightOp = computeNightSkyOpacity(cur.name, nxt.name, segmentLerpT);
    if (nightOp < 0.5 && (cur.name === 'Nat' || cur.name === 'Morgen')) {
      const dawn = new Color(0x6a94b8);
      const w = Math.min(1, (0.5 - nightOp) / 0.5);
      finalBg.lerp(dawn, 0.42 * w);
      finalFog.lerp(dawn, 0.46 * w);
    }
  }

  const foggy = wData.fogDens > 0.04;
  const fogNear = foggy ? 5 : loc.fogNear;
  const fogFar = foggy ? 25 : loc.fogFar;

  const baseAmb = MathUtils.lerp(cur.intensity, nxt.intensity, lerpT);
  let ambIntensity = MathUtils.clamp(baseAmb * 0.45 + 0.30, 0.18, 0.95) * Math.max(0.45, mod);
  let ambColor = new Color(0xffffff);

  // Solstyrke som legacy (ingen ekstra 1.35×); toneMapping i Canvas giver lys nok.

  if (opts.locationId === 'fishing_cabin') {
    sunIntensity *= 0.15;
    const isNat = cur.name === 'Nat';
    const isTransition = cur.name === 'Morgen' || cur.name === 'Aften';
    const cabinAmbFloor = isNat ? 0.4 : isTransition ? 0.6 : 0.85;
    ambIntensity = Math.max(ambIntensity, cabinAmbFloor);
    ambColor.lerp(new Color(0xfff5e6), 0.15);
  }

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
