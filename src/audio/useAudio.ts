import { useCallback, useMemo } from 'react';
import type { SoundId } from '../data/audio.js';
import {
  ensureAmbienceStarted,
  playSoundEffect,
  setRainVolume,
  startAmbience,
  startBossAmbience,
  stopAmbience,
  stopBossAmbience,
} from './audioEngine.js';

export function useAudio() {
  const play = useCallback((name?: string) => {
    ensureAmbienceStarted();
    if (name) playSoundEffect(name as SoundId);
  }, []);

  return useMemo(
    () => ({
      play,
      startAmbience,
      stopAmbience,
      setRainVolume,
      startBossAmbience,
      stopBossAmbience,
    }),
    [play],
  );
}
