import { useEffect, useRef } from 'react';
import { useAudio } from '../audio/useAudio.js';
import { useGameStore } from '../store/useGameStore.js';
import { usePlayerStore } from '../store/usePlayerStore.js';
import { useUIStore } from '../store/useUIStore.js';

function replaceQuestTurtleEggWithHatched() {
  usePlayerStore.getState().setQuestItems((q) => {
    const i = q.indexOf('turtle_egg');
    if (i === -1) return q;
    const next = [...q];
    next[i] = 'turtle_hatched';
    return next;
  });
}

/** Sti A (15 min → hytte), Sti B (15 min → vild skildpadde), forlad ø med æg-flag */
export function useTurtleEggTimer() {
  const { play } = useAudio();
  const currentLocation = useGameStore((s) => s.currentLocation);
  const questItems = usePlayerStore((s) => s.questItems);
  const eggHatchAt = usePlayerStore((s) => s.eggHatchAt);
  const eggLeftTimestamp = usePlayerStore((s) => s.eggLeftTimestamp);
  const wildTurtleSpawned = usePlayerStore((s) => s.wildTurtleSpawned);
  const setEggCountdown = usePlayerStore((s) => s.setEggCountdown);
  const setWildTurtleSpawned = usePlayerStore((s) => s.setWildTurtleSpawned);

  const prevLocRef = useRef<string | null>(null);

  useEffect(() => {
    if (!questItems.includes('turtle_egg') || questItems.includes('turtle_hatched')) return;
    if (eggHatchAt === 0) return;

    const now = Date.now();
    if (eggHatchAt - now <= 0) {
      replaceQuestTurtleEggWithHatched();
      setEggCountdown('');
      return;
    }

    let intervalId = 0;
    const finishHatch = () => {
      replaceQuestTurtleEggWithHatched();
      setEggCountdown('');
      useUIStore.getState().setToastMessage('🐢 Skildpaddeægget er klækket! Tjek fiskehytten!');
      play('win');
      useUIStore.getState().setWorldParticleBurst('levelup');
      window.setTimeout(() => useUIStore.getState().setWorldParticleBurst(null), 1800);
    };

    const tick = () => {
      const left = eggHatchAt - Date.now();
      if (left <= 0) {
        window.clearInterval(intervalId);
        finishHatch();
        return;
      }
      const mins = Math.floor(left / 60000);
      const secs = Math.floor((left % 60000) / 1000);
      setEggCountdown(`${mins}:${String(secs).padStart(2, '0')}`);
    };

    tick();
    intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [eggHatchAt, questItems, setEggCountdown, play]);

  useEffect(() => {
    const prev = prevLocRef.current;
    if (prev === 'tropical_island' && currentLocation !== 'tropical_island') {
      const q = usePlayerStore.getState().questItems;
      if (q.includes('turtle_egg') && !q.includes('left_island_with_egg')) {
        usePlayerStore.getState().setQuestItems([...q, 'left_island_with_egg']);
      }
    }
    prevLocRef.current = currentLocation;
  }, [currentLocation]);

  useEffect(() => {
    if (currentLocation !== 'tropical_island') return;
    if (!eggLeftTimestamp || wildTurtleSpawned) return;

    let intervalId = 0;
    const trySpawn = () => {
      const ts = usePlayerStore.getState().eggLeftTimestamp;
      if (!ts || usePlayerStore.getState().wildTurtleSpawned) return;
      if (Date.now() - ts < 900000) return;
      window.clearInterval(intervalId);
      setWildTurtleSpawned(true);
      useUIStore.getState().setToastMessage(
        '🐢 En lille skildpadde er klækket ud! Den sidder nu ved reden på øen!',
      );
      play('win');
      useUIStore.getState().setWorldParticleBurst('confetti');
      window.setTimeout(() => useUIStore.getState().setWorldParticleBurst(null), 1800);
    };

    trySpawn();
    intervalId = window.setInterval(trySpawn, 1000);
    return () => window.clearInterval(intervalId);
  }, [currentLocation, eggLeftTimestamp, wildTurtleSpawned, play, setWildTurtleSpawned]);
}

export function TurtleEggEffects() {
  useTurtleEggTimer();
  return null;
}
