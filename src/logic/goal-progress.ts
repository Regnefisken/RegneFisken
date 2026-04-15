import { playSoundEffect } from '../audio/audioEngine.js';
import { GOALS } from '../data/progression.js';
import { useCollectionStore } from '../store/useCollectionStore.js';
import { usePlayerStore } from '../store/usePlayerStore.js';
import { useUIStore } from '../store/useUIStore.js';
import type { GoalStats } from '../types/progression.js';
import { applyXP } from './xp-engine.js';

/** Mål-snapshot som legacy `currentStats` — merger player.stats med progression, quest og samling. */
export function buildGoalStatsSnapshot(): GoalStats {
  const p = usePlayerStore.getState();
  const c = useCollectionStore.getState();
  const fossil = c.collectibleDelivered?.fossil ?? 0;
  const ids = p.stats.tropicalFishCaughtIds ?? [];
  return {
    ...p.stats,
    solvedCategories: p.stats.solvedCategories ?? [],
    fractionSolves: p.stats.fractionSolves ?? 0,
    percentSolves: p.stats.percentSolves ?? 0,
    patternSolves: p.stats.patternSolves ?? 0,
    halvdelDobbeltSolves: p.stats.halvdelDobbeltSolves ?? 0,
    maxLevel: Math.max(p.stats.maxLevel, p.progression.level),
    hasTurtleHatched: p.questItems.includes('turtle_hatched'),
    collectiblesFound: p.cheeseSources.length + p.featherSources.length,
    conchCount: c.collectibleInventory?.conchCount ?? 0,
    conchDelivered: c.collectibleDelivered?.conch ?? 0,
    fossilCount: fossil,
    companionsUnlocked: c.unlockedCompanions.length,
    wishesUsed: c.usedWishes.length,
    ratUnlocked: c.unlockedCompanions.includes('rat'),
    parrotUnlocked: c.unlockedCompanions.includes('parrot'),
    pearlCount: c.collectibleDelivered?.pearl ?? 0,
    hasLuxuryBoat: p.upgrades.includes('luxury_boat'),
    tropicalSpeciesCaught: ids.length,
    tropicalFishCaughtIds: ids,
    pirateCatUnlocked: c.unlockedCompanions.includes('pirate_cat'),
    jungleKeyObtained: p.questItems.includes('jungle_chest_key'),
    pirateChestUnlocked: p.unlockedFurniture.includes('pirate_chest'),
    sardineDelivered: c.collectibleDelivered?.sardine ?? 0,
    hapsUnlocked: c.unlockedCompanions.includes('haps'),
  };
}

/**
 * Afslutter ét nyt mål ad gangen (som legacy useEffect), tildeler belønning og afspiller lyd.
 * Kald efter relevant state er committed (fx efter setStats).
 */
export function tryCompleteNextGoal(): void {
  const p = usePlayerStore.getState();
  const snapshot = buildGoalStatsSnapshot();
  const next = GOALS.find(
    (g) => !p.completedGoals.includes(g.id) && g.condition(snapshot)
  );
  if (!next) return;

  usePlayerStore.setState((s) => ({
    completedGoals: [...s.completedGoals, next.id],
    coins: s.coins + next.reward.coins,
  }));

  useUIStore.getState().setPendingGoal(next.id);
  playSoundEffect('unlock');

  if (next.reward.xp > 0) {
    const prog = usePlayerStore.getState().progression;
    const { level, xp, levelUps } = applyXP(prog.level, prog.xp, next.reward.xp);
    usePlayerStore.getState().setProgression({ level, xp });
    if (levelUps.length > 0) {
      useUIStore.getState().setShowLevelUp(levelUps[levelUps.length - 1]!);
    }
  }
}

let goalCheckTimer: ReturnType<typeof setTimeout> | null = null;
let goalUnsub: (() => void) | null = null;

function scheduleGoalCheck(): void {
  if (goalCheckTimer) window.clearTimeout(goalCheckTimer);
  goalCheckTimer = window.setTimeout(() => {
    goalCheckTimer = null;
    tryCompleteNextGoal();
  }, 250);
}

/** Kald én gang ved app-opstart (samme mønster som `startPersistenceSubscription`). */
export function startGoalProgressSubscription(): () => void {
  if (goalUnsub) return goalUnsub;
  const u1 = usePlayerStore.subscribe(scheduleGoalCheck);
  const u2 = useCollectionStore.subscribe(scheduleGoalCheck);
  tryCompleteNextGoal();
  goalUnsub = () => {
    u1();
    u2();
    if (goalCheckTimer) window.clearTimeout(goalCheckTimer);
    goalCheckTimer = null;
    goalUnsub = null;
  };
  return goalUnsub;
}
