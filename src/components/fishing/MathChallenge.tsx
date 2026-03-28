import { useCallback, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { useAudio } from '../../audio/useAudio';
import { getBucketTier } from '../../data/equipment';
import { STREAK_EXCEPTION_TYPES, TRUE_BOSS_ITEM_TYPES } from '../../data/combat';
import { ENRICHED_CATCH_DATA } from '../../data/enrichment';
import { makeId } from '../../logic/catch-engine';
import { inventoryBucketCount } from '../../logic/bucket-inventory';
import { generateMathProblem } from '../../logic/math-engine';
import { applyXP, calculateStreakBonus, xpForCatch } from '../../logic/xp-engine';
import type { RollCatchResult } from '../../types/fish';
import { useCollectionStore } from '../../store/useCollectionStore';
import { useGameStore } from '../../store/useGameStore';
import { useFishingStore } from '../../store/useFishingStore';
import { useMathStore } from '../../store/useMathStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUIStore } from '../../store/useUIStore';
import { markSoeuhyreCaughtThisVisit } from '../../three/soeuhyre-ambient-flags.js';
import { NumberPad } from '../mobile/NumberPad';

function numericAnswerOk(user: string, expected: number): boolean {
  const n = Number(String(user).trim().replace(',', '.'));
  if (Number.isNaN(n)) return false;
  return Math.abs(n - expected) < 0.001;
}

export function MathChallenge() {
  const { play, startBossAmbience, stopBossAmbience } = useAudio();
  const gameState = useGameStore((s) => s.gameState);
  const setGameState = useGameStore((s) => s.setGameState);
  const weatherType = useGameStore((s) => s.weatherType);

  const hookedFish = useFishingStore((s) => s.hookedFish);
  const fightStages = useFishingStore((s) => s.fightStages);
  const setFightStages = useFishingStore((s) => s.setFightStages);
  const setHookedFish = useFishingStore((s) => s.setHookedFish);
  const setLastCatch = useFishingStore((s) => s.setLastCatch);
  const setCurrentStreak = useFishingStore((s) => s.setCurrentStreak);
  const setStreakMilestoneToast = useFishingStore((s) => s.setStreakMilestoneToast);
  const setLastWasTrueBoss = useFishingStore((s) => s.setLastWasTrueBoss);
  const monkeyHelpsThisRound = useFishingStore((s) => s.monkeyHelpsThisRound);
  const setMonkeyHelpsThisRound = useFishingStore((s) => s.setMonkeyHelpsThisRound);
  const showMonkeyBubble = useCollectionStore((s) => s.showMonkeyBubble);
  const setShowMonkeyBubble = useCollectionStore((s) => s.setShowMonkeyBubble);

  const problem = useMathStore((s) => s.problem);
  const userAnswer = useMathStore((s) => s.userAnswer);
  const setUserAnswer = useMathStore((s) => s.setUserAnswer);
  const timeLeft = useMathStore((s) => s.timeLeft);
  const setTimeLeft = useMathStore((s) => s.setTimeLeft);
  const setProblem = useMathStore((s) => s.setProblem);
  const zenMode = useMathStore((s) => s.zenMode);
  const showNumberPad = useMathStore((s) => s.showNumberPad);
  const revealingAnswer = useMathStore((s) => s.revealingAnswer);
  const setRevealingAnswer = useMathStore((s) => s.setRevealingAnswer);
  const activeOps = useMathStore((s) => s.activeOps);
  const mathDifficulty = useMathStore((s) => s.mathDifficulty);
  const mathCategory = useMathStore((s) => s.mathCategory);
  const setInitialTime = useMathStore((s) => s.setInitialTime);

  const progression = usePlayerStore((s) => s.progression);
  const setProgression = usePlayerStore((s) => s.setProgression);
  const inventory = usePlayerStore((s) => s.inventory);
  const setInventory = usePlayerStore((s) => s.setInventory);
  const upgrades = usePlayerStore((s) => s.upgrades);
  const setStats = usePlayerStore((s) => s.setStats);
  const setKrakenDefeated = usePlayerStore((s) => s.setKrakenDefeated);
  const setSoeuhyreDefeated = usePlayerStore((s) => s.setSoeuhyreDefeated);
  const setActiveBait = usePlayerStore((s) => s.setActiveBait);
  const activeBait = usePlayerStore((s) => s.activeBait);
  const setCoins = usePlayerStore((s) => s.setCoins);
  const setKrakenLoss = usePlayerStore((s) => s.setKrakenLoss);

  const setToastMessage = useUIStore((s) => s.setToastMessage);
  const setXpToast = useUIStore((s) => s.setXpToast);
  const setShowLevelUp = useUIStore((s) => s.setShowLevelUp);

  const isMultiPhase = fightStages.total > 1;
  const isBossFight = isMultiPhase && hookedFish && ['kraken', 'boss_hvidhaj', 'soeuhyre', 'oyster', 'gnavne_gorm'].includes(hookedFish.itemType);

  const lossFromTimerRef = useRef(false);

  useEffect(() => {
    if (gameState === 'fighting') lossFromTimerRef.current = false;
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'fighting') {
      setMonkeyHelpsThisRound(false);
      setShowMonkeyBubble(false);
    }
  }, [gameState, setMonkeyHelpsThisRound, setShowMonkeyBubble]);

  useEffect(() => {
    setShowMonkeyBubble(false);
  }, [problem?.question, setShowMonkeyBubble]);

  const enterLostState = useCallback(() => {
    if (useGameStore.getState().gameState !== 'fighting') return;
    if (lossFromTimerRef.current) return;
    lossFromTimerRef.current = true;

    play('lose');
    setLastWasTrueBoss(false);
    const danger = useFishingStore.getState().hookedFish;
    if (danger?.itemType === 'jellyfish') {
      setStats((st) => ({ ...st, jellyfishCaught: (st.jellyfishCaught ?? 0) + 1 }));
    }
    if (danger?.itemType === 'kraken') {
      setCoins((prev) => {
        const loss = Math.min(prev, 1000);
        setKrakenLoss(loss);
        return prev - loss;
      });
      setGameState('kraken_lost');
    } else {
      setGameState('lost');
    }
    setHookedFish(null);
    setFightStages({ current: 0, total: 1 });
    setProblem(null);
    setUserAnswer('');
    setRevealingAnswer(false);
  }, [
    play,
    setLastWasTrueBoss,
    setStats,
    setCoins,
    setKrakenLoss,
    setGameState,
    setHookedFish,
    setFightStages,
    setProblem,
    setUserAnswer,
    setRevealingAnswer,
  ]);

  useEffect(() => {
    if (gameState !== 'fighting' || !isBossFight) {
      stopBossAmbience();
    } else {
      startBossAmbience();
    }
    return () => stopBossAmbience();
  }, [gameState, isBossFight, startBossAmbience, stopBossAmbience]);

  useEffect(() => {
    if (gameState !== 'fighting' || !problem || zenMode) return;
    const id = window.setInterval(() => {
      const m = useMathStore.getState();
      if (useGameStore.getState().gameState !== 'fighting') {
        window.clearInterval(id);
        return;
      }
      if (m.timeLeft <= 0) {
        window.clearInterval(id);
        return;
      }
      if (m.timeLeft <= 1) {
        window.clearInterval(id);
        m.setTimeLeft(0);
        return;
      }
      play('tick');
      m.setTimeLeft(m.timeLeft - 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [gameState, problem, zenMode, play]);

  useEffect(() => {
    if (gameState !== 'fighting' || zenMode || !problem) return;
    if (timeLeft !== 0) return;
    enterLostState();
  }, [gameState, timeLeft, zenMode, problem, enterLostState]);

  function nextProblem() {
    const fishNow = useFishingStore.getState().hookedFish;
    const difficultyTier = Math.min(3, Math.max(1, Math.floor(progression.level / 5) || 1));
    const p = generateMathProblem(
      difficultyTier,
      progression.level >= 10,
      activeOps,
      mathDifficulty,
      mathCategory
    );
    setProblem(p);
    setUserAnswer('');
    const entry = fishNow?.fishModelId
      ? ENRICHED_CATCH_DATA.find((e) => e.id === fishNow.fishModelId)
      : undefined;
    const limit = entry?.fightParams?.baseTimeLimit || 25;
    if (!zenMode) {
      setInitialTime(limit);
      setTimeLeft(limit);
    }
  }

  function finalizeCatch(fish: RollCatchResult) {
    if (fish.itemType === 'cabin_key') {
      setLastCatch({ ...fish, value: fish.value });
      setHookedFish(null);
      setFightStages({ current: 0, total: 1 });
      setProblem(null);
      setUserAnswer('');
      setGameState('catch');
      play('win');
      return;
    }

    /** Østers-boss → perle-belønning (som legacy pearlDrop). */
    let resolved: RollCatchResult = fish;
    if (fish.itemType === 'oyster') {
      resolved = {
        ...fish,
        id: makeId(),
        fishModelId: undefined,
        species: 'Perle',
        itemType: 'pearl',
        weight: 0.08,
        value: 120,
        rarity: 'Mystisk',
        color: 0xf8f8ff,
        visual: 'pearl',
      };
      useCollectionStore.getState().setCollectibleInventory((c) => ({
        ...c,
        pearlCount: c.pearlCount + 1,
      }));
    }

    const tier = getBucketTier(upgrades);
    const fishCount = inventoryBucketCount(inventory);
    if (
      resolved.itemType === 'fish' ||
      resolved.itemType === 'junk' ||
      resolved.itemType === 'treasure'
    ) {
      if (fishCount >= tier.capacity) {
        setToastMessage('Spanden er fuld!');
        setGameState('idle');
        setHookedFish(null);
        setProblem(null);
        return;
      }
    }

    let value = resolved.value;
    const streakBefore = useFishingStore.getState().currentStreak;
    const streakBonus = calculateStreakBonus(streakBefore + 1, zenMode, value);
    value += streakBonus;

    const xpAmt = xpForCatch(resolved) + (upgrades.includes('luxury_boat') ? 15 : 0);
    const { level, xp, levelUps } = applyXP(progression.level, progression.xp, xpAmt);
    setProgression({ level, xp });
    if (levelUps.length > 0) {
      setShowLevelUp(levelUps[levelUps.length - 1]!);
    }
    setXpToast(`+${xpAmt} XP`);

    const addToInventory =
      resolved.itemType === 'fish' ||
      resolved.itemType === 'treasure' ||
      resolved.itemType === 'junk' ||
      resolved.itemType === 'golden_frog' ||
      resolved.itemType === 'axolotl' ||
      resolved.itemType === 'halibut' ||
      resolved.itemType === 'pearl';
    if (addToInventory) {
      setInventory((inv) => [...inv, { ...resolved, value }]);
    }

    if (resolved.itemType === 'fossil') {
      setInventory((inv) => [...inv, { ...resolved, value }]);
      useCollectionStore.getState().setCollectibleInventory((c) => ({
        ...c,
        fossilCount: c.fossilCount + 1,
      }));
    }
    if (resolved.itemType === 'conch') {
      setInventory((inv) => [...inv, { ...resolved, value }]);
      useCollectionStore.getState().setCollectibleInventory((c) => ({
        ...c,
        conchCount: c.conchCount + 1,
      }));
    }

    if (resolved.itemType === 'kraken') {
      setKrakenDefeated(true);
    }
    if (resolved.itemType === 'soeuhyre') {
      setSoeuhyreDefeated(true);
      markSoeuhyreCaughtThisVisit();
    }

    const bossWin = TRUE_BOSS_ITEM_TYPES.has(fish.itemType);

    setStats((s) => {
      const junk = resolved.itemType === 'junk';
      const nextJunk = junk ? s.currentJunkStreak + 1 : 0;
      return {
        ...s,
        totalCatches: s.totalCatches + (resolved.itemType === 'fish' ? 1 : 0),
        rareCatches: s.rareCatches + (resolved.rarity === 'Sjælden' ? 1 : 0),
        legendaryCatches: s.legendaryCatches + (resolved.rarity === 'Legendarisk' ? 1 : 0),
        treasureCatches: s.treasureCatches + (resolved.itemType === 'treasure' ? 1 : 0),
        maxLevel: Math.max(s.maxLevel, level),
        currentJunkStreak: nextJunk,
        bestJunkStreak: Math.max(s.bestJunkStreak, nextJunk),
        maxCombo: Math.max(s.maxCombo ?? 0, streakBefore + 1),
        rainCatches:
          s.rainCatches + (weatherType === 'rain' && resolved.itemType === 'fish' ? 1 : 0),
        stormCatches:
          s.stormCatches + (weatherType === 'storm' && resolved.itemType === 'fish' ? 1 : 0),
        krakenCaught: s.krakenCaught || resolved.itemType === 'kraken',
        axolotlCaught: s.axolotlCaught,
        crystalFound: s.crystalFound || resolved.itemType === 'crystal_junk',
        gormDefeated: s.gormDefeated || resolved.itemType === 'gnavne_gorm',
        bossWins: s.bossWins + (bossWin ? 1 : 0),
      };
    });

    if (activeBait === 'legendary_bait') {
      setActiveBait(null);
    }

    setCurrentStreak((n) => n + 1);
    setLastCatch({ ...resolved, value });
    setHookedFish(null);
    setFightStages({ current: 0, total: 1 });
    setProblem(null);
    setUserAnswer('');
    setGameState('catch');
    if (resolved.itemType === 'treasure' || resolved.rarity === 'Legendarisk') play('legendary');
    else if (resolved.itemType === 'junk') play('junk');
    else play('win');
    play('xp');
  }

  function checkAnswer(e?: FormEvent) {
    e?.preventDefault();
    if (gameState !== 'fighting' || !problem || revealingAnswer) return;
    if (!numericAnswerOk(userAnswer, problem.answer)) {
      play('error');
      setUserAnswer('');
      const hook = hookedFish;
      if (hook && !STREAK_EXCEPTION_TYPES.has(hook.itemType)) {
        setCurrentStreak(0);
        setStreakMilestoneToast(null);
      }
      const mWrong = useMathStore.getState();
      mWrong.setTimeLeft(Math.max(0, mWrong.timeLeft - 3));
      return;
    }

    play('ui');
    const fs = useFishingStore.getState().fightStages;
    const next = fs.current + 1;
    const mSnap = useMathStore.getState();
    const speedEligible =
      !zenMode && mSnap.initialTime > 0 && mSnap.timeLeft / mSnap.initialTime > 0.8;
    if (next >= fs.total) {
      if (speedEligible) {
        setStats((s) => ({ ...s, speedSolves: s.speedSolves + 1 }));
      }
      const fish = hookedFish;
      if (!fish) return;
      if (fish.itemType === 'nothing') {
        setToastMessage('Tom krog…');
        setHookedFish(null);
        setProblem(null);
        setGameState('idle');
        return;
      }
      finalizeCatch(fish);
      return;
    }

    setFightStages({ ...fs, current: next });
    nextProblem();
  }

  if (gameState !== 'fighting' || !problem) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center p-4">
      <div className="mx-auto w-full max-w-xl">
        <div
          className={`anim-zoom-in pointer-events-auto relative w-full rounded-3xl p-5 shadow-2xl md:p-10 ${
            isBossFight
              ? 'border-8 border-red-600 bg-boss animate-shake'
              : isMultiPhase
                ? 'panel-dark border-4 border-amber-500'
                : 'panel-dark border-4 border-sky-500'
          }`}
        >
        {monkeyHelpsThisRound && problem && (
          <div className="absolute top-2 right-2 z-20 md:top-4 md:right-6">
            <button
              type="button"
              className="pointer-events-auto flex flex-col items-center rounded-xl border border-amber-700/40 bg-amber-950/50 px-2 py-1.5 text-[0.5rem] font-bold text-amber-100 shadow-lg hover:bg-amber-900/60"
              onClick={() => {
                play('ui');
                setShowMonkeyBubble(true);
              }}
            >
              <span className="text-3xl leading-none animate-bounce">🐒</span>
              <span className="mt-0.5 text-[0.5rem] text-amber-200">Klik!</span>
            </button>
            {showMonkeyBubble && (
              <div
                className="pointer-events-auto absolute top-full right-0 mt-2 max-w-[14rem] rounded-2xl border border-amber-600/50 bg-black/80 px-3 py-2 text-left text-sm text-amber-50 shadow-xl"
                style={{
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                }}
              >
                Ooo aah! Svaret er{' '}
                <span className="text-lg font-black text-amber-600">{problem.answer}</span>! 🐒
              </div>
            )}
          </div>
        )}

        <div className="mb-4 flex items-center justify-between border-b border-slate-700/50 pb-3 md:mb-8 md:pb-6">
          <span className="flex items-center gap-2 text-xs font-bold tracking-widest text-white/60 uppercase">
            {!zenMode && (problem.multiplier ?? 1) > 1 && (
              <span className="text-teal-300">
                ✨ x{problem.multiplier} CHANCE FOR SJÆLDEN FISK
              </span>
            )}
          </span>
          <div className="ml-auto flex items-center gap-4">
            {zenMode ? (
              <div
                className="flex items-center gap-2 rounded-xl bg-black/40 px-4 py-2 font-mono text-2xl font-black text-emerald-400"
                style={{ minWidth: '7rem', justifyContent: 'center' }}
              >
                ♾️
              </div>
            ) : (
              <div
                className={`flex items-center gap-2 rounded-xl bg-black/40 px-4 py-2 font-mono text-3xl font-black tabular-nums ${
                  timeLeft < 5 ? 'animate-pulse text-red-500' : 'text-sky-300'
                }`}
                style={{ minWidth: '7rem', justifyContent: 'center' }}
              >
                🕐 {timeLeft}s
              </div>
            )}
          </div>
        </div>

        {isBossFight && hookedFish && (
          <div className="mb-3 text-center text-2xl font-black tracking-widest text-red-400 uppercase">
            ⚔️ Boss: {hookedFish.species}
          </div>
        )}

        {isMultiPhase && (
          <div className="mb-6 flex justify-center gap-2">
            {[...Array(fightStages.total)].map((_, i) => (
              <div
                key={i}
                className={`h-4 w-full rounded-full transition-all duration-500 ${
                  i < fightStages.current ? 'bg-slate-800' : 'bg-amber-500'
                }`}
                style={
                  i >= fightStages.current
                    ? { boxShadow: '0 0 10px rgba(245,158,11,0.6)' }
                    : undefined
                }
              />
            ))}
          </div>
        )}

        <div className="mb-6 text-center">
          {(mathCategory !== 'basic' ||
            activeOps.some((o) => ['tenfriends', '100friends', 'skaeve100friends'].includes(o))) && (
            <div className="mb-2 flex justify-center">
              <span
                className="rounded-full border px-3 py-1 text-xs font-black tracking-widest uppercase"
                style={{
                  background:
                    mathCategory !== 'basic'
                      ? 'rgba(99,102,241,0.25)'
                      : 'rgba(16,185,129,0.25)',
                  color: mathCategory !== 'basic' ? '#a5b4fc' : '#6ee7b7',
                  borderColor:
                    mathCategory !== 'basic'
                      ? 'rgba(99,102,241,0.4)'
                      : 'rgba(16,185,129,0.4)',
                }}
              >
                {mathCategory === 'equations'
                  ? '🔤 Ligninger'
                  : mathCategory === 'multi-term'
                    ? '📐 Flere led'
                    : mathCategory === 'decimals'
                      ? '🔬 Decimaler'
                      : mathCategory === 'regnehistorier'
                        ? '📖 Regnehistorier'
                        : mathCategory === 'lette-historier'
                          ? '📖 Lette historier'
                          : ''}
              </span>
            </div>
          )}

          {problem.category === 'regnehistorier' || problem.category === 'lette-historier' ? (
            <div
              className="mb-3 rounded-2xl border border-emerald-400/30 bg-blue-950/80 p-4 text-center text-base font-bold text-emerald-300"
              style={{ lineHeight: 1.5 }}
            >
              📖 {problem.question}
            </div>
          ) : (
            <div
              className="math-question-text mb-3 flex min-h-[4.5rem] items-center justify-center text-6xl font-black tracking-tighter text-white tabular-nums md:text-8xl"
              style={
                problem.category === 'equations'
                  ? { fontSize: 'clamp(2rem, 7vw, 4.5rem)' }
                  : undefined
              }
            >
              {problem.question}
            </div>
          )}
          <div className="mb-2 text-sm font-medium text-slate-400">
            {problem.category === 'regnehistorier' || problem.category === 'lette-historier'
              ? `Skriv svaret (${problem.unit ?? ''}) og tryk enter`
              : problem.category === 'equations'
                ? 'Find x og tryk enter'
                : 'Udregn og tryk enter'}
          </div>
        </div>

        <div className="relative">
          {showNumberPad ? (
            <div className="flex w-full items-stretch gap-2">
              <div
                className="min-h-[4.5rem] min-w-0 flex-1 select-none rounded-3xl border-4 border-slate-600 px-4 py-5 text-center text-5xl font-black text-white"
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  visibility: revealingAnswer ? 'hidden' : 'visible',
                  lineHeight: 1.2,
                }}
              >
                {userAnswer || <span className="text-slate-700">?</span>}
              </div>
            </div>
          ) : (
            <form onSubmit={checkAnswer} className="flex w-full items-stretch gap-2">
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={userAnswer}
                onChange={(ev) => !revealingAnswer && setUserAnswer(ev.target.value)}
                className="min-w-0 flex-1 rounded-3xl border-4 border-slate-600 bg-black/40 px-4 py-6 text-center text-5xl font-black text-white placeholder-slate-700 focus:border-sky-500 focus:outline-none"
                style={{ visibility: revealingAnswer ? 'hidden' : 'visible' }}
                placeholder="?"
              />
              <button
                type="submit"
                className="touch-manipulation shrink-0 rounded-3xl border-4 border-emerald-600/50 bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 text-lg font-black whitespace-nowrap text-white shadow-lg hover:from-emerald-600 hover:to-cyan-600 active:scale-95"
              >
                Enter
              </button>
            </form>
          )}

          {revealingAnswer && (
            <div
              className="anim-zoom-in absolute inset-0 flex flex-col items-center justify-center rounded-3xl border-4 border-green-700 bg-black/40"
            >
              <div className="animate-bounce text-5xl font-black text-green-400">
                {problem.answer}
              </div>
            </div>
          )}
        </div>

        {zenMode && (
          <button
            type="button"
            className="touch-manipulation mt-4 w-full rounded-2xl border border-emerald-500/50 py-3 font-bold text-emerald-300 hover:bg-emerald-900/30"
            onClick={() => {
              play('ui');
              setRevealingAnswer(true);
              window.setTimeout(() => {
                setRevealingAnswer(false);
                checkAnswer();
              }, 900);
            }}
          >
            ✂️ Vis svar (zen)
          </button>
        )}

        {showNumberPad && (
          <NumberPad
            onDigit={(d) => setUserAnswer((a) => `${a}${d}`)}
            onBackspace={() => setUserAnswer((a) => a.slice(0, -1))}
            onSubmit={() => checkAnswer()}
          />
        )}
        </div>
      </div>
    </div>
  );
}
