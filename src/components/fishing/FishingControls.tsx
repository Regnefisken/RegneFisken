import { useEffect, useRef } from 'react';
import { useAudio } from '../../audio/useAudio';
import { ENRICHED_CATCH_DATA } from '../../data/enrichment';
import { rollForCatch } from '../../logic/catch-engine';
import { generateMathProblem } from '../../logic/math-engine';
import { getBucketTier } from '../../data/equipment';
import { useGameStore } from '../../store/useGameStore';
import { useFishingStore } from '../../store/useFishingStore';
import { useMathStore } from '../../store/useMathStore';
import { useCollectionStore } from '../../store/useCollectionStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUIStore } from '../../store/useUIStore';
import type { FarvandId } from '../../types/math';
import { getLocation } from '../../data/locations';
import { isCabinLocation } from '../../logic/location-helpers';
import { inventoryBucketCount } from '../../logic/bucket-inventory';

export function FishingControls() {
  const { play } = useAudio();
  const waitTimerRef = useRef<number | null>(null);
  const castingTimerRef = useRef<number | null>(null);

  const gameState = useGameStore((s) => s.gameState);
  const setGameState = useGameStore((s) => s.setGameState);
  const currentLocation = useGameStore((s) => s.currentLocation);
  const jungleFishing = useGameStore((s) => s.jungleFishing);
  const nearJungleBucket = useGameStore((s) => s.nearJungleBucket);
  const headlampOn = useGameStore((s) => s.headlampOn);
  const setHeadlampOn = useGameStore((s) => s.setHeadlampOn);
  const setCurrentLocation = useGameStore((s) => s.setCurrentLocation);
  const resetWeatherForTravel = useGameStore((s) => s.resetWeatherForTravel);
  const weatherType = useGameStore((s) => s.weatherType);

  const setHookedFish = useFishingStore((s) => s.setHookedFish);
  const setFightStages = useFishingStore((s) => s.setFightStages);

  const setProblem = useMathStore((s) => s.setProblem);
  const setUserAnswer = useMathStore((s) => s.setUserAnswer);
  const setTimeLeft = useMathStore((s) => s.setTimeLeft);
  const setInitialTime = useMathStore((s) => s.setInitialTime);
  const zenMode = useMathStore((s) => s.zenMode);
  const activeMathTypes = useMathStore((s) => s.activeMathTypes);
  const typeOps = useMathStore((s) => s.typeOps);
  const mathDifficulty = useMathStore((s) => s.mathDifficulty);
  const selectedFarvand = useMathStore((s) => s.selectedFarvand);

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
  const inventory = usePlayerStore((s) => s.inventory);
  const helleflynderCaught = useCollectionStore((s) => s.helleflynderCaught);

  const setToastMessage = useUIStore((s) => s.setToastMessage);

  const bucketTier = getBucketTier(upgrades);
  const fishInBucket = inventoryBucketCount(inventory);
  const bucketFull = fishInBucket >= bucketTier.capacity;

  function clearWaitTimer() {
    if (waitTimerRef.current != null) {
      window.clearTimeout(waitTimerRef.current);
      waitTimerRef.current = null;
    }
    if (castingTimerRef.current != null) {
      window.clearTimeout(castingTimerRef.current);
      castingTimerRef.current = null;
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
      helleflynderCaught,
      hvalbofActive,
      krakenDefeated,
      koedklumpActive,
      soeuhyreDefeated,
    });

    setHookedFish(fish);
    const preloadKey = fish.fishModelId || fish.itemType;
    if (preloadKey) {
      useFishingStore.getState().setUrgentPreload(preloadKey);
    }
    const monkeyUnlocked = useCollectionStore.getState().unlockedCompanions.includes('monkey');
    useFishingStore.getState().setMonkeyHelpsThisRound(monkeyUnlocked && Math.random() < 0.05);
    const entry = fish.fishModelId
      ? ENRICHED_CATCH_DATA.find((e) => e.id === fish.fishModelId)
      : undefined;
    const totalStages = entry?.fightParams?.requiredAnswers ?? 1;
    setFightStages({ current: 0, total: totalStages });

    const problem = generateMathProblem(
      activeMathTypes,
      mathDifficulty,
      selectedFarvand as FarvandId,
      typeOps
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

    const loc = getLocation(String(currentLocation));
    const sr = loc.specialRules;

    // Legacy castLine — samme rækkefølge som legacy-game.html
    if (currentLocation === 'smaragd' && !upgrades.includes('license_smaragd')) {
      play('error');
      setToastMessage('🚫 Du skal have Fisketilladelsen for at fiske i Skovsøen. Køb den i butikken!');
      return;
    }
    if (currentLocation === 'abyss' && !upgrades.includes('license_abyss')) {
      play('error');
      setToastMessage('🚫 Du skal have Fisketilladelsen for at fiske i Dybet. Køb den i butikken!');
      return;
    }
    if (currentLocation === 'abyss' && !upgrades.includes('rod_bambus')) {
      setToastMessage('🎣 Du mangler Bambus-stangen for at fiske i Dybet!');
      play('error');
      return;
    }
    if (sr?.noFishing) {
      play('error');
      setToastMessage('🏠 Der er intet vand at fiske i her!');
      return;
    }
    if (sr?.requiresHeadlamp && !headlampOn) {
      play('error');
      setToastMessage('🔦 Du kan ikke fiske i mørket — tænd pandelampen!');
      return;
    }
    if (sr?.requiresMahogni && !upgrades.includes('rod_mahogni')) {
      setToastMessage('Du mangler Mahogni-stangen til dette område! Køb den i butikken.');
      return;
    }
    if (bucketFull) {
      play('error');
      setToastMessage(`${bucketTier.name} er fuld! Sælg dine fisk først.`);
      return;
    }

    play('cast');
    clearWaitTimer();
    setGameState('casting');
    castingTimerRef.current = window.setTimeout(() => {
      setGameState('waiting');
      castingTimerRef.current = null;
      waitTimerRef.current = window.setTimeout(() => {
        setGameState('biting');
        waitTimerRef.current = null;
      }, 1200 + Math.random() * 800);
    }, 650);
  }

  useEffect(() => {
    if (gameState === 'biting') play('bite');
  }, [gameState, play]);

  if (currentLocation === 'jungle_island' && !jungleFishing) {
    return (
      <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center">
        <div className="relative h-5 w-5 opacity-50">
          <div className="absolute left-1/2 top-1/2 h-[2px] w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60" />
          <div className="absolute left-1/2 top-1/2 h-5 w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60" />
        </div>
        {nearJungleBucket && (
          <div className="pointer-events-none absolute bottom-32 text-lg font-bold text-white/80">
            Tryk E for at fiske
          </div>
        )}
      </div>
    );
  }

  function reelIn() {
    if (gameState !== 'biting') return;
    clearWaitTimer();
    startMathFight();
  }

  const castBtnBase =
    'touch-manipulation pointer-events-auto flex items-center gap-4 rounded-full border-4 border-white/20 px-16 py-6 text-2xl font-black text-white transition-all';

  const onTropicalIsland = currentLocation === 'tropical_island';

  function leaveCaveToTropicalIsland() {
    play('ui');
    setCurrentLocation('tropical_island');
    resetWeatherForTravel(false);
  }

  if (gameState === 'idle' && isCabinLocation(currentLocation)) {
    return null;
  }

  /* ── GROTTE: legacy-game.html ~11915–11958 — mørk skærm / fisk i mørket / tilbage ── */
  if (gameState === 'idle' && currentLocation === 'cave') {
    if (!headlampOn) {
      return (
        <>
          <div
            className="anim-cave-entrance fixed inset-0 z-[40] flex flex-col items-center justify-center pointer-events-auto"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.97) 70%)',
            }}
          >
            <div className="mb-8 px-8 text-center">
              <p className="mb-2 text-sm font-bold tracking-widest text-gray-500 uppercase">
                Det er kulsort herinde
              </p>
              <h3
                className="text-2xl font-black text-white"
                style={{ textShadow: '0 0 20px rgba(255,255,200,0.3)' }}
              >
                Du kan ikke se noget
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                play('ui');
                setHeadlampOn(true);
              }}
              className="anim-headlamp-pulse flex flex-col items-center gap-3 rounded-full border-4 border-yellow-400/60 px-16 py-8 transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'radial-gradient(circle, rgba(234,179,8,0.2) 0%, rgba(0,0,0,0.4) 70%)',
                boxShadow: '0 0 40px 8px rgba(234,179,8,0.25)',
              }}
            >
              <span
                className="text-[4rem] leading-none"
                style={{ filter: 'drop-shadow(0 0 12px rgba(234,179,8,0.8))' }}
              >
                🔦
              </span>
              <span
                className="text-xl font-black tracking-widest text-yellow-300 uppercase"
                style={{ textShadow: '0 0 10px rgba(234,179,8,0.6)' }}
              >
                Tænd Pandelampe
              </span>
            </button>
            <p className="mt-8 text-xs tracking-widest text-gray-600 uppercase">Tryk for at se i mørket</p>
          </div>
          <button
            type="button"
            onClick={leaveCaveToTropicalIsland}
            className="pointer-events-auto fixed top-1/2 left-6 z-[41] flex flex-col items-center gap-1 rounded-xl border-2 px-4 py-3 transition-all hover:scale-105"
            style={{
              background: 'rgba(20,10,5,0.85)',
              borderColor: 'rgba(120,80,40,0.5)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
              transform: 'translateY(-50%) rotate(-2deg)',
            }}
          >
            <span className="text-xl">⬅</span>
            <span className="text-xs font-bold tracking-wider whitespace-nowrap text-amber-400/80 uppercase">
              Tilbage til lyset
            </span>
          </button>
        </>
      );
    }

    return (
      <>
        <div className="pointer-events-auto mt-32 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={castLine}
            disabled={bucketFull}
            className={`${castBtnBase} ${
              bucketFull
                ? 'cursor-not-allowed bg-slate-600 opacity-60'
                : 'bg-emerald-700 hover:scale-105 hover:bg-emerald-600 active:translate-y-2'
            }`}
            style={
              bucketFull
                ? undefined
                : { boxShadow: '0 8px 0 rgb(6,78,59), 0 15px 20px rgba(0,0,0,0.5)' }
            }
          >
            {bucketFull ? '🪣 SPANDEN ER FULD' : '🦑 FISK I MØRKET'}
          </button>
          <button
            type="button"
            onClick={() => {
              play('ui');
              setHeadlampOn(false);
            }}
            className="mt-2 flex items-center gap-2 rounded-xl border border-yellow-600/40 px-5 py-2 text-sm font-bold tracking-wider text-yellow-400 uppercase transition-all hover:border-yellow-500/60 hover:bg-yellow-900/30"
          >
            🔦 Sluk lampe
          </button>
        </div>
        <button
          type="button"
          onClick={leaveCaveToTropicalIsland}
          className="pointer-events-auto fixed top-1/2 left-6 z-30 flex flex-col items-center gap-1 rounded-xl border-2 px-4 py-3 transition-all hover:scale-105"
          style={{
            background: 'rgba(20,10,5,0.85)',
            borderColor: 'rgba(120,80,40,0.5)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
            transform: 'translateY(-50%) rotate(-2deg)',
          }}
        >
          <span className="text-xl">⬅</span>
          <span className="text-xs font-bold tracking-wider whitespace-nowrap text-amber-400/80 uppercase">
            Tilbage til lyset
          </span>
        </button>
      </>
    );
  }

  if (gameState === 'idle') {
    return (
      <>
        {jungleFishing && (
          <div className="pointer-events-none fixed bottom-8 left-1/2 z-30 -translate-x-1/2 text-sm font-bold text-white/60">
            Tryk Q for at gå
          </div>
        )}
        <button
          type="button"
          onClick={castLine}
          disabled={bucketFull}
          className={`${castBtnBase} ${
            bucketFull
              ? 'cursor-not-allowed bg-slate-600 opacity-60'
              : onTropicalIsland
                ? 'bg-teal-500 hover:scale-105 hover:bg-teal-400 active:translate-y-2'
                : 'bg-sky-500 hover:scale-105 hover:bg-sky-400 active:translate-y-2'
          }`}
          style={
            bucketFull
              ? undefined
              : onTropicalIsland
                ? {
                    boxShadow: '0 8px 0 rgb(15,118,110), 0 15px 20px rgba(0,0,0,0.4)',
                  }
                : {
                    boxShadow: '0 8px 0 rgb(14,116,144), 0 15px 20px rgba(0,0,0,0.4)',
                  }
          }
        >
          {bucketFull ? '🪣 SPANDEN ER FULD' : onTropicalIsland ? '🐠 KAST SNØREN' : '🐟 KAST SNØREN'}
        </button>
      </>
    );
  }

  if (gameState === 'casting') {
    return (
      <div
        className="pointer-events-none flex items-center gap-3 rounded-full border-4 border-white/20 bg-sky-600/90 px-12 py-5 text-xl font-black text-white animate-pulse"
        style={{ boxShadow: '0 6px 0 rgb(14,116,144), 0 12px 18px rgba(0,0,0,0.35)' }}
      >
        Kaster…
      </div>
    );
  }

  if (gameState === 'waiting') {
    return (
      <div
        className="pointer-events-none flex items-center gap-3 rounded-full border-4 border-white/20 bg-sky-700/85 px-10 py-4 text-lg font-bold text-white animate-pulse"
        style={{ boxShadow: '0 5px 0 rgb(14,116,144), 0 10px 16px rgba(0,0,0,0.3)' }}
      >
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
