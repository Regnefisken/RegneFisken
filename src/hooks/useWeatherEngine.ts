import { useEffect, useRef } from 'react';
import { playSoundEffect, setRainVolume, startAmbience, stopAmbience } from '../audio/audioEngine.js';
import { getLocation } from '../data/locations.js';
import type { WeatherTypeId } from '../data/weather.js';
import { useGameStore } from '../store/useGameStore.js';
import { usePlayerStore } from '../store/usePlayerStore.js';
import { useUIStore } from '../store/useUIStore.js';

const SUNNY_LOCATIONS = new Set([
  'tropical_island',
  'cabin_living',
  'cabin_kitchen',
  'cabin_bedroom',
  'pier',
  'jungle_island',
]);
const ARCTIC_LOCATIONS = new Set(['arctic_sea']);
const CAVE_LOCATIONS = new Set(['cave']);

const STD_DUR: Record<WeatherTypeId, [number, number]> = {
  clear: [180_000, 300_000],
  overcast: [60_000, 120_000],
  rain: [60_000, 100_000],
  storm: [45_000, 75_000],
  fog: [90_000, 150_000],
  snow: [60_000, 100_000],
  snowstorm: [45_000, 75_000],
};

const DARK_DUR: Record<WeatherTypeId, [number, number]> = {
  clear: [60_000, 120_000],
  overcast: [30_000, 60_000],
  rain: [45_000, 75_000],
  storm: [30_000, 60_000],
  fog: [45_000, 90_000],
  snow: [45_000, 75_000],
  snowstorm: [30_000, 60_000],
};

function isSunnyLocation(locationId: string): boolean {
  return SUNNY_LOCATIONS.has(locationId);
}

function isArcticLocation(locationId: string): boolean {
  return ARCTIC_LOCATIONS.has(locationId);
}

function isCaveLocation(locationId: string): boolean {
  return CAVE_LOCATIONS.has(locationId);
}

function isDarkLocation(locationId: string): boolean {
  return getLocation(locationId).specialRules?.darkLocation === true;
}

function durationMs(weather: WeatherTypeId, dark: boolean): number {
  const [min, max] = (dark ? DARK_DUR : STD_DUR)[weather];
  return min + Math.random() * (max - min);
}

function pickStandardNext(current: WeatherTypeId, prev: WeatherTypeId): WeatherTypeId {
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

function pickDarkNext(current: WeatherTypeId): WeatherTypeId {
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

function pickArcticNext(current: WeatherTypeId, prev: WeatherTypeId): WeatherTypeId {
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
function toArcticWeather(weather: WeatherTypeId): WeatherTypeId {
  if (weather === 'rain') return 'snow';
  if (weather === 'storm') return 'snowstorm';
  return weather;
}

function toCaveWeather(weather: WeatherTypeId): WeatherTypeId {
  if (weather === 'rain' || weather === 'storm' || weather === 'snowstorm' || weather === 'snow') return 'clear';
  return weather;
}

function pickCaveNext(current: WeatherTypeId): WeatherTypeId {
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

function applySunnyOverride(next: WeatherTypeId, sunny: boolean): WeatherTypeId {
  if (!sunny) return next;
  if (next === 'overcast' || next === 'fog') return 'clear';
  return next;
}

function pickNextWeather(params: {
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

function rollThunder(weather: WeatherTypeId): boolean {
  if (weather === 'storm' || weather === 'snowstorm') return Math.random() < 0.6;
  if (weather === 'rain') return Math.random() < 0.3;
  return false;
}

function syncRainVolume(weather: WeatherTypeId) {
  if (useUIStore.getState().isMuted) {
    setRainVolume(0);
    return;
  }
  if (weather === 'storm') setRainVolume(0.8);
  else if (weather === 'rain') setRainVolume(0.4);
  else setRainVolume(0);
}

/**
 * Legacy vejr: Markov-overgange, override ved rejse, torden-loop, regnlyd, toasts.
 */
export function useWeatherEngine() {
  const hasStarted = useUIStore((s) => s.hasStarted);
  const isMuted = useUIStore((s) => s.isMuted);
  const currentLocation = useGameStore((s) => s.currentLocation);
  const weatherType = useGameStore((s) => s.weatherType);
  const thunderActive = useGameStore((s) => s.thunderActive);
  const setToastMessage = useUIStore((s) => s.setToastMessage);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstCheckDoneRef = useRef(false);

  useEffect(() => {
    if (!hasStarted) return;
    if (isMuted) {
      stopAmbience();
      setRainVolume(0);
    } else {
      startAmbience();
      syncRainVolume(useGameStore.getState().weatherType);
    }
  }, [hasStarted, isMuted]);

  useEffect(() => {
    if (!hasStarted || isMuted) return;
    syncRainVolume(weatherType);
  }, [hasStarted, isMuted, weatherType]);

  useEffect(() => {
    if (!hasStarted) return;
    if (currentLocation === 'jungle_island') {
      const st = useGameStore.getState();
      if (st.thunderActive) st.setThunderActive(false);
      if (st.showLightning) st.setShowLightning(false);
    }
    if (isSunnyLocation(currentLocation) && weatherType !== 'clear') {
      useGameStore.getState().setWeatherType('clear');
      useGameStore.getState().setPrevWeather('clear');
    }
    if (isArcticLocation(currentLocation)) {
      const converted = toArcticWeather(weatherType);
      if (converted !== weatherType) {
        useGameStore.getState().setWeatherType(converted);
      }
    }
    if (isCaveLocation(currentLocation)) {
      const converted = toCaveWeather(weatherType);
      if (converted !== weatherType) {
        useGameStore.getState().setWeatherType(converted);
      }
    }
  }, [hasStarted, currentLocation, weatherType]);

  useEffect(() => {
    if (!hasStarted) return;

    function clearTimer() {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    function applyTransition(from: WeatherTypeId, to: WeatherTypeId) {
      const set = useGameStore.getState();
      set.setPrevWeather(from);
      set.setWeatherType(to);
      const thunderOn = (to === 'rain' || to === 'storm' || to === 'snowstorm') && rollThunder(to);
      set.setThunderActive(thunderOn);

      if (isCaveLocation(useGameStore.getState().currentLocation)) {
        // Ingen vejr-toasts i grotten
      } else {
        if (to === 'storm' && from !== 'storm') {
          setToastMessage('STORMEN KOMMER! Pas på derude!');
        } else if (to === 'snowstorm' && from !== 'snowstorm') {
          setToastMessage('SNESTORM! Temperaturen styrtdykker!');
        } else if (to === 'rain' && from !== 'storm') {
          setToastMessage('🌧️ Regnen sætter ind...');
        } else if (to === 'snow' && from !== 'snowstorm') {
          setToastMessage('🌨️ Sneen daler ned...');
        } else if (to === 'clear' && (from === 'rain' || from === 'storm' || from === 'snow' || from === 'snowstorm')) {
          setToastMessage('☀️ Vejret klarer op!');
        }
      }
    }

    function tick() {
      const g = useGameStore.getState();
      const loc = g.currentLocation;
      const overrideUntil = g.weatherOverrideUntil;

      if (Date.now() < overrideUntil) {
        const wait = Math.max(400, overrideUntil - Date.now());
        timeoutRef.current = setTimeout(tick, wait);
        return;
      }

      const dark = isDarkLocation(loc);
      const delay = !firstCheckDoneRef.current ? 45_000 : durationMs(g.weatherType, dark);

      timeoutRef.current = setTimeout(() => {
        firstCheckDoneRef.current = true;
        const st = useGameStore.getState();
        const levelNow = usePlayerStore.getState().progression.level;
        const darkNow = isDarkLocation(st.currentLocation);
        if (isSunnyLocation(st.currentLocation)) {
          if (st.weatherType !== 'clear') {
            applyTransition(st.weatherType, 'clear');
          }
          timeoutRef.current = setTimeout(tick, durationMs('clear', darkNow));
          return;
        }

        const from = st.weatherType;
        const prev = st.prevWeather;
        const to = pickNextWeather({
          level: levelNow,
          locationId: st.currentLocation,
          current: from,
          prev,
        });

        if (to !== from) {
          applyTransition(from, to);
        }

        timeoutRef.current = setTimeout(tick, durationMs(to, darkNow));
      }, delay);
    }

    clearTimer();
    tick();

    return () => clearTimer();
  }, [hasStarted, currentLocation, setToastMessage]);

  useEffect(() => {
    if (!hasStarted) return;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    function scheduleFlash() {
      const st = useGameStore.getState();
      if (cancelled || !st.thunderActive) return;
      if (isCaveLocation(st.currentLocation)) return;
      const wx = st.weatherType;
      if (wx !== 'rain' && wx !== 'storm' && wx !== 'snowstorm') return;
      const baseDelay = (wx === 'storm' || wx === 'snowstorm') ? 4000 : 9000;
      const delay = Math.random() * baseDelay + 2000;
      timeoutId = window.setTimeout(() => {
        if (cancelled) return;
        const st2 = useGameStore.getState();
        if (!st2.thunderActive) return;
        if (isCaveLocation(st2.currentLocation)) {
          scheduleFlash();
          return;
        }
        st2.setShowLightning(true);
        playSoundEffect('thunder');
        window.setTimeout(() => {
          if (!cancelled) useGameStore.getState().setShowLightning(false);
        }, 500);
        scheduleFlash();
      }, delay);
    }

    if (useGameStore.getState().thunderActive) {
      scheduleFlash();
    }

    return () => {
      cancelled = true;
      if (timeoutId !== null) clearTimeout(timeoutId);
    };
  }, [hasStarted, thunderActive]);
}
