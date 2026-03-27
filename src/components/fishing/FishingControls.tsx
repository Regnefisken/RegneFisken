import { useEffect, useRef } from 'react';
import { useAudio } from '../../audio/useAudio';
import { ENRICHED_CATCH_DATA } from '../../data/enrichment';
import { rollForCatch } from '../../logic/catch-engine';
import { generateMathProblem } from '../../logic/math-engine';
import { useGameStore } from '../../store/useGameStore';
import { useFishingStore } from '../../store/useFishingStore';
import { useMathStore } from '../../store/useMathStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUIStore } from '../../store/useUIStore';

export function FishingControls() {
  const { play } = useAudio();
  const waitTimerRef = useRef<number | null>(null);

  const gameState = useGameStore((s) => s.gameState);
  const setGameState = useGameStore((s) => s.setGameState);
  const currentLocation = useGameStore((s) => s.currentLocation);
  const weatherType = useGameStore((s) => s.weatherType);

  const setHookedFish = useFishingStore((s) => s.setHookedFish);
  const setFightStages = useFishingStore((s) => s.setFightStages);

  const setProblem = useMathStore((s) => s.setProblem);
  const setUserAnswer = useMathStore((s) => s.setUserAnswer);
  const setTimeLeft = useMathStore((s) => s.setTimeLeft);
  const setInitialTime = useMathStore((s) => s.setInitialTime);
  const zenMode = useMathStore((s) => s.zenMode);
  const activeOps = useMathStore((s) => s.activeOps);
  const mathDifficulty = useMathStore((s) => s.mathDifficulty);
  const mathCategory = useMathStore((s) => s.mathCategory);

  const progression = usePlayerStore((s) => s.progression);
  const upgrades = usePlayerStore((s) => s.upgrades);
  const questItems = usePlayerStore((s) => s.questItems);
  const activeBait = usePlayerStore((s) => s.activeBait);
  const conchBaitExpiry = usePlayerStore((s) => s.conchBaitExpiry);
  const fossilBaitExpiry = usePlayerStore((s) => s.fossilBaitExpiry);
  const flyBaitExpiry = usePlayerStore((s) => s.flyBaitExpiry);
  const hajBloodExpiry = usePlayerStore((s) => s.hajBloodExpiry);
  const perleLimExpiry = usePlayerStore((s) => s.perleLimExpiry);
  const hvalbofActive = usePlayerStore((s) => s.hvalbofActive);
  const krakenDefeated = usePlayerStore((s) => s.krakenDefeated);
  const koedklumpActive = usePlayerStore((s) => s.koedklumpActive);
  const soeuhyreDefeated = usePlayerStore((s) => s.soeuhyreDefeated);
  const stats = usePlayerStore((s) => s.stats);

  const setToastMessage = useUIStore((s) => s.setToastMessage);

  function clearWaitTimer() {
    if (waitTimerRef.current != null) {
      window.clearTimeout(waitTimerRef.current);
      waitTimerRef.current = null;
    }
  }

  function startMathFight() {
    const now = Date.now();
    const fish = rollForCatch({
      difficulty: Math.min(3, Math.max(1, Math.floor(progression.level / 4) || 1)),
      level: progression.level,
      location: currentLocation,
      playerUpgrades: upgrades,
      questItems,
      activeBait,
      weatherType,
      hasMapLeft: questItems.includes('map_left'),
      activeConchBait: now < conchBaitExpiry,
      activeFossilBait: now < fossilBaitExpiry,
      activeFlyBait: now < flyBaitExpiry,
      hajBloodExpiry,
      perleLimExpiry,
      junkStreak: stats.currentJunkStreak,
      helleflynderCaught: 0,
      hvalbofActive,
      krakenDefeated,
      koedklumpActive,
      soeuhyreDefeated,
    });

    setHookedFish(fish);
    const entry = fish.fishModelId
      ? ENRICHED_CATCH_DATA.find((e) => e.id === fish.fishModelId)
      : undefined;
    const totalStages = entry?.fightParams?.requiredAnswers ?? 1;
    setFightStages({ current: 0, total: totalStages });

    const difficultyTier = Math.min(3, Math.max(1, Math.floor(progression.level / 5) || 1));
    const problem = generateMathProblem(
      difficultyTier,
      progression.level >= 10,
      activeOps,
      mathDifficulty,
      mathCategory
    );
    setProblem(problem);
    setUserAnswer('');

    const limit = entry?.fightParams?.baseTimeLimit || 25;
    if (!zenMode) {
      setInitialTime(limit);
      setTimeLeft(limit);
    }

    setGameState('fighting');
    play('ui');
  }

  function castLine() {
    if (gameState !== 'idle') return;
    play('cast');
    clearWaitTimer();
    window.setTimeout(() => play('splash'), 650);
    setGameState('waiting');
    waitTimerRef.current = window.setTimeout(() => {
      setGameState('biting');
      waitTimerRef.current = null;
    }, 1200 + Math.random() * 800);
  }

  useEffect(() => {
    if (gameState === 'biting') play('bite');
  }, [gameState, play]);

  function reelIn() {
    if (gameState !== 'biting') return;
    clearWaitTimer();
    startMathFight();
  }

  if (gameState === 'idle') {
    return (
      <button
        type="button"
        onClick={castLine}
        className="btn-glass touch-manipulation pointer-events-auto rounded-full border border-white/20 px-10 py-4 text-xl font-black text-white shadow-lg transition-all hover:scale-105 hover:bg-sky-600 active:scale-95"
      >
        🎣 Kast ud
      </button>
    );
  }

  if (gameState === 'waiting') {
    return (
      <div className="btn-glass pointer-events-none rounded-full border border-white/20 px-8 py-3 font-bold text-white shadow-lg animate-pulse">
        Venter på bid…
      </div>
    );
  }

  if (gameState === 'biting') {
    return (
      <button
        type="button"
        onClick={reelIn}
        className="touch-manipulation pointer-events-auto rounded-full border-8 border-white/30 bg-red-600 px-16 py-8 text-6xl font-black text-white shadow-lg transition-transform hover:scale-110 animate-bounce glow-bite hover:bg-red-500"
      >
        BID!
      </button>
    );
  }

  if (gameState === 'fighting') {
    return (
      <button
        type="button"
        onClick={() => {
          play('ui');
          setToastMessage('Klip linen — prøv igen!');
          useFishingStore.getState().setHookedFish(null);
          useFishingStore.getState().setFightStages({ current: 0, total: 1 });
          useMathStore.getState().setProblem(null);
          setGameState('idle');
        }}
        className="btn-glass touch-manipulation pointer-events-auto mt-4 rounded-full border border-white/20 px-6 py-2 text-sm font-bold text-white/90 hover:bg-white/10"
      >
        ✂️ Klip line (afslut)
      </button>
    );
  }

  return null;
}
