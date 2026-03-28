import { useEffect } from 'react';
import { useAudio } from '../../audio/useAudio.js';
import { COMPANIONS_DATABASE } from '../../data/collectibles.js';
import { tryCompleteNextGoal } from '../../logic/goal-progress.js';
import { useCollectionStore } from '../../store/useCollectionStore.js';
import { usePlayerStore } from '../../store/usePlayerStore.js';

/** Synkroniserer afsluttede mål med stats/samling — som legacy goals-`useEffect`. */
export function GoalProgressSync() {
  const { play } = useAudio();
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
  const hasMonkeyOnPier = useCollectionStore((s) => s.hasMonkeyOnPier);
  const hasHeartBalloon = useCollectionStore((s) => s.hasHeartBalloon);
  const hasGoldenFrog = useCollectionStore((s) => s.hasGoldenFrog);

  /** Auto-unlock kæledyr som legacy `useEffect` (~9706–9728). */
  useEffect(() => {
    const prev = useCollectionStore.getState().unlockedCompanions;
    const next = [...prev];
    let changed = false;
    const push = (id: string) => {
      if (!next.includes(id)) {
        next.push(id);
        changed = true;
      }
    };
    if (cheeseSources.length >= 3) push('rat');
    if (featherSources.length >= 3) push('parrot');
    if (questItems.includes('turtle_hatched')) push('turtle');
    if (hasMonkeyOnPier) push('monkey');
    if (hasHeartBalloon) push('balloon');
    if (hasGoldenFrog) push('golden_frog');
    if (cheeseSources.includes('shop')) push('cheese_pet');
    if (questItems.includes('has_axolotl') || stats.axolotlCaught) push('axolotl');
    if (!changed) return;
    const newOnes = next.filter((id) => !prev.includes(id));
    useCollectionStore.getState().setUnlockedCompanions(next);
    for (const id of newOnes) {
      if (COMPANIONS_DATABASE.some((c) => c.id === id)) play('unlock');
    }
  }, [
    cheeseSources,
    featherSources,
    questItems,
    hasMonkeyOnPier,
    hasHeartBalloon,
    hasGoldenFrog,
    stats.axolotlCaught,
    play,
  ]);

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
