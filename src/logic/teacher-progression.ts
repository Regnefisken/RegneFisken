import { usePlayerStore } from '../store/usePlayerStore.js';

/** Delt med AdminPanel: +1 level, XP nulstilles (som når man leveler i flowet). */
export function addOneLevelFromTeacherOrAdmin(): void {
  const { progression: p, setProgression } = usePlayerStore.getState();
  setProgression({ ...p, level: p.level + 1, xp: 0 });
}

export function addThousandCoinsFromTeacherOrAdmin(): void {
  usePlayerStore.getState().setCoins((c) => c + 1000);
}
