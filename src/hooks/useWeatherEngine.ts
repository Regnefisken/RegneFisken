import { useEffect, useRef } from 'react';
import {
  fadeOutStopAmbience,
  INDOOR_OCEAN_FADE_OUT_SEC,
  LOCATION_AMBIENCE_CROSSFADE_SEC,
  playSoundEffect,
  setRainVolume,
  startAmbience,
  startCaveAmbience,
  stopAmbience,
  stopCaveAmbience,
} from '../audio/audioEngine.js';
import type { WeatherTypeId } from '../data/weather.js';
import { shouldPlayOceanAmbience } from '../logic/location-helpers.js';
import {
  durationMs,
  isArcticLocation,
  isCaveLocation,
  isDarkLocation,
  isSunnyLocation,
  pickNextWeather,
  rollThunder,
  toArcticWeather,
  toCaveWeather,
} from '../logic/weather-rules.js';
import { useGameStore } from '../store/useGameStore.js';
import { usePlayerStore } from '../store/usePlayerStore.js';
import { useUIStore } from '../store/useUIStore.js';

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
    if (!hasStarted) {
      stopCaveAmbience();
      return;
    }
    if (isMuted) {
      stopAmbience();
      setRainVolume(0);
      stopCaveAmbience();
      return;
    }
    if (currentLocation === 'cave') {
      fadeOutStopAmbience(LOCATION_AMBIENCE_CROSSFADE_SEC);
      startCaveAmbience(LOCATION_AMBIENCE_CROSSFADE_SEC);
      return;
    }
    stopCaveAmbience();
    if (!shouldPlayOceanAmbience(currentLocation)) {
      fadeOutStopAmbience(INDOOR_OCEAN_FADE_OUT_SEC);
      return;
    }
    startAmbience(LOCATION_AMBIENCE_CROSSFADE_SEC);
    syncRainVolume(weatherType);
  }, [hasStarted, isMuted, currentLocation, weatherType]);

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
          setToastMessage('STORMEN KOMMER! Pas på derude!', 'weather');
        } else if (to === 'snowstorm' && from !== 'snowstorm') {
          setToastMessage('SNESTORM! Temperaturen styrtdykker!', 'weather');
        } else if (to === 'rain' && from !== 'storm') {
          setToastMessage('🌧️ Regnen sætter ind...', 'weather');
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
