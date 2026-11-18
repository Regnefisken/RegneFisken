/**
 * Vejrets regler: hvilke lokationer har hvilket vejr, hvor længe det varer, og hvad det skifter til.
 * Rene funktioner uden React, lyd eller stores, så de kan testes. Bruges af `useWeatherEngine`.
 */
import { getLocation } from '../data/locations.js';
import type { WeatherTypeId } from '../data/weather.js';

export const SUNNY_LOCATIONS = new Set([
  'tropical_island',
  'cabin_living',
  'cabin_kitchen',
  'cabin_bedroom',
  'pier',
  'jungle_island',
]);
export const ARCTIC_LOCATIONS = new Set(['arctic_sea']);
export const CAVE_LOCATIONS = new Set(['cave']);

export const STD_DUR: Record<WeatherTypeId, [number, number]> = {
  clear: [180_000, 300_000],
  overcast: [60_000, 120_000],
  rain: [60_000, 100_000],
  storm: [45_000, 75_000],
  fog: [90_000, 150_000],
  snow: [60_000, 100_000],
  snowstorm: [45_000, 75_000],
};

export const DARK_DUR: Record<WeatherTypeId, [number, number]> = {
  clear: [60_000, 120_000],
  overcast: [30_000, 60_000],
  rain: [45_000, 75_000],
  storm: [30_000, 60_000],
  fog: [45_000, 90_000],
  snow: [45_000, 75_000],
  snowstorm: [30_000, 60_000],
};

export function isSunnyLocation(locationId: string): boolean {
  return SUNNY_LOCATIONS.has(locationId);
}

export function isArcticLocation(locationId: string): boolean {
  return ARCTIC_LOCATIONS.has(locationId);
}

export function isCaveLocation(locationId: string): boolean {
  return CAVE_LOCATIONS.has(locationId);
}

export function isDarkLocation(locationId: string): boolean {
  return getLocation(locationId).specialRules?.darkLocation === true;
}

export function durationMs(weather: WeatherTypeId, dark: boolean): number {
  const [min, max] = (dark ? DARK_DUR : STD_DUR)[weather];
  return min + Math.random() * (max - min);
}

export function pickStandardNext(current: WeatherTypeId, prev: WeatherTypeId): WeatherTypeId {
  const r = Math.random();
  switch (current) {
    case 'clear':
      return r < 0.55 ? 'overcast' : 'clear';
    case 'overcast':
      if (r < 0.55) return 'rain';
      if (r < 0.7) return 'fog';
      return 'clear';
    case 'rain':
      if (prev === 'storm') return r < 0.8 ? 'clear' : 'overcast';
      return r < 0.5 ? 'storm' : 'clear';
    case 'storm':
      return 'rain';
    case 'fog':
      return r < 0.5 ? 'overcast' : 'clear';
    default:
      return 'clear';
  }
}

export function pickDarkNext(current: WeatherTypeId): WeatherTypeId {
  const r = Math.random();
  switch (current) {
    case 'clear':
      return r < 0.7 ? 'overcast' : 'clear';
    case 'overcast':
      if (r < 0.65) return 'rain';
      if (r < 0.8) return 'fog';
      return 'clear';
    case 'rain':
      if (r < 0.65) return 'storm';
      if (r < 0.85) return 'fog';
      return 'clear';
    case 'fog':
      if (r < 0.5) return 'rain';
      if (r < 0.75) return 'overcast';
      return 'clear';
    case 'storm':
      return 'rain';
    default:
      return 'clear';
  }
}

export function pickArcticNext(current: WeatherTypeId, prev: WeatherTypeId): WeatherTypeId {
  const r = Math.random();
  switch (current) {
    case 'clear':
      return r < 0.55 ? 'overcast' : 'clear';
    case 'overcast':
      if (r < 0.5) return 'snow';
      if (r < 0.65) return 'fog';
      return 'clear';
    case 'snow':
      if (prev === 'snowstorm') return r < 0.8 ? 'clear' : 'overcast';
      return r < 0.5 ? 'snowstorm' : 'clear';
    case 'snowstorm':
      return 'snow';
    case 'fog':
      return r < 0.5 ? 'overcast' : 'clear';
    default:
      return 'clear';
  }
}

/** Converts rain/storm to arctic equivalents when entering an arctic location. */
export function toArcticWeather(weather: WeatherTypeId): WeatherTypeId {
  if (weather === 'rain') return 'snow';
  if (weather === 'storm') return 'snowstorm';
  return weather;
}

export function toCaveWeather(weather: WeatherTypeId): WeatherTypeId {
  if (weather === 'rain' || weather === 'storm' || weather === 'snowstorm' || weather === 'snow') return 'clear';
  return weather;
}

export function pickCaveNext(current: WeatherTypeId): WeatherTypeId {
  const r = Math.random();
  switch (current) {
    case 'clear':
      return r < 0.35 ? 'fog' : r < 0.55 ? 'overcast' : 'clear';
    case 'fog':
      return r < 0.45 ? 'clear' : r < 0.65 ? 'overcast' : 'fog';
    case 'overcast':
      return r < 0.45 ? 'clear' : r < 0.65 ? 'fog' : 'overcast';
    default:
      return 'clear';
  }
}

export function applySunnyOverride(next: WeatherTypeId, sunny: boolean): WeatherTypeId {
  if (!sunny) return next;
  if (next === 'overcast' || next === 'fog') return 'clear';
  return next;
}

export function pickNextWeather(params: {
  level: number;
  locationId: string;
  current: WeatherTypeId;
  prev: WeatherTypeId;
}): WeatherTypeId {
  const { level, locationId, current, prev } = params;
  const sunny = isSunnyLocation(locationId);

  if (level < 5) return 'clear';
  if (sunny) return 'clear';

  if (level >= 5 && level < 10) {
    if (current !== 'clear' && current !== 'overcast') return 'clear';
    const r = Math.random();
    if (current === 'clear') return r < 0.5 ? 'overcast' : 'clear';
    return r < 0.4 ? 'clear' : 'overcast';
  }

  if (isCaveLocation(locationId)) {
    return pickCaveNext(current);
  }

  if (isArcticLocation(locationId)) {
    return pickArcticNext(current, prev);
  }

  const dark = isDarkLocation(locationId);
  const raw = dark ? pickDarkNext(current) : pickStandardNext(current, prev);
  return applySunnyOverride(raw, sunny);
}

export function rollThunder(weather: WeatherTypeId): boolean {
  if (weather === 'storm' || weather === 'snowstorm') return Math.random() < 0.6;
  if (weather === 'rain') return Math.random() < 0.3;
  return false;
}
