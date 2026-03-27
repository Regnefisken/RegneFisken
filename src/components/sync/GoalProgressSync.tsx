import { useEffect } from 'react';
import { tryCompleteNextGoal } from '../../logic/goal-progress.js';
import { useCollectionStore } from '../../store/useCollectionStore.js';
import { usePlayerStore } from '../../store/usePlayerStore.js';

/** Synkroniserer afsluttede mål med stats/samling — som legacy goals-`useEffect`. */
export function GoalProgressSync() {
  const stats = usePlayerStore((s) => s.stats);
  const progression = usePlayerStore((s) => s.progression);
  const completedGoals = usePlayerStore((s) => s.completedGoals);
  const questItems = usePlayerStore((s) => s.questItems);
  const cheeseSources = usePlayerStore((s) => s.cheeseSources);
  const featherSources = usePlayerStore((s) => s.featherSources);
  const upgrades = usePlayerStore((s) => s.upgrades);
  const collectibleInventory = useCollectionStore((s) => s.collectibleInventory);
  const collectibleDelivered = useCollectionStore((s) => s.collectibleDelivered);
  const unlockedCompanions = useCollectionStore((s) => s.unlockedCompanions);
  const usedWishes = useCollectionStore((s) => s.usedWishes);

  useEffect(() => {
    tryCompleteNextGoal();
  }, [
    stats,
    progression,
    completedGoals,
    questItems,
    cheeseSources,
    featherSources,
    upgrades,
    collectibleInventory,
    collectibleDelivered,
    unlockedCompanions,
    usedWishes,
  ]);

  return null;
}
