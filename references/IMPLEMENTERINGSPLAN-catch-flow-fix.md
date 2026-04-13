# Implementeringsplan: Fix frame-drops ved biting → fighting overgang

## Baggrund & Problem

Når spilleren trykker "BID!" opstår synlige frame-drops/hak fordi `startMathFight()` udfører al tung beregning + 8 separate Zustand store-updates + kamerabevægelse + MathChallenge-mount i ét enkelt JavaScript-frame.

Derudover er "venter på bid"-fasen for kort (1.2–2.0s) og varierer kun 0.8s.

## Mål

1. Fjerne eller markant reducere frame-drops ved biting → fighting overgang
2. Forlænge "venter på bid" med 2–5 sekunder (variabel fra gang til gang)
3. Udnytte ventetiden til at pre-compute fish roll + math problem

---

## Ændring 1: Forlæng ventetiden og pre-compute under "waiting"

### Fil: `src/components/fishing/FishingControls.tsx`

### 1A. Tilføj en ref til at holde pre-computed data

Tilføj øverst i komponenten (ved de andre refs):

```tsx
const precomputedRef = useRef<{
  fish: ReturnType<typeof rollForCatch>;
  problem: ReturnType<typeof generateMathProblem>;
  entry: (typeof ENRICHED_CATCH_DATA)[number] | undefined;
  totalStages: number;
  timeLimit: number;
} | null>(null);
```

### 1B. Forlæng ventetiden i `castLine()` og start pre-compute

Erstat den nuværende wait-timer logik (linje ~185-192):

**FØR:**
```tsx
castingTimerRef.current = window.setTimeout(() => {
  setGameState('waiting');
  castingTimerRef.current = null;
  waitTimerRef.current = window.setTimeout(() => {
    setGameState('biting');
    waitTimerRef.current = null;
  }, 1200 + Math.random() * 800);
}, 650);
```

**EFTER:**
```tsx
castingTimerRef.current = window.setTimeout(() => {
  play('splash');
  setGameState('waiting');
  castingTimerRef.current = null;

  // Pre-compute fish roll + math problem mens spilleren venter
  precomputeNextCatch();

  // Ventetid: 3200–7000ms (2–5 sek længere end før)
  const waitMs = 3200 + Math.random() * 3800;
  waitTimerRef.current = window.setTimeout(() => {
    setGameState('biting');
    waitTimerRef.current = null;
  }, waitMs);
}, 650);
```

### 1C. Tilføj `precomputeNextCatch()` funktion

Tilføj denne funktion i FishingControls-komponenten (før `startMathFight`):

```tsx
function precomputeNextCatch() {
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

  const entry = fish.fishModelId
    ? ENRICHED_CATCH_DATA.find((e) => e.id === fish.fishModelId)
    : undefined;
  const totalStages = entry?.fightParams?.requiredAnswers ?? 1;
  const timeLimit = entry?.fightParams?.baseTimeLimit || 25;

  const problem = generateMathProblem(
    activeMathTypes,
    mathDifficulty,
    selectedFarvand as FarvandId,
    typeOps
  );

  precomputedRef.current = { fish, problem, entry, totalStages, timeLimit };

  // Start 3D-model preload tidligt
  const preloadKey = fish.fishModelId || fish.itemType;
  if (preloadKey) {
    useFishingStore.getState().setUrgentPreload(preloadKey);
  }
}
```

### 1D. Forenkle `startMathFight()` til kun at aktivere pre-computed data

Erstat hele `startMathFight()` med:

```tsx
function startMathFight() {
  // Brug pre-computed data hvis tilgængeligt, ellers compute nu (fallback)
  let data = precomputedRef.current;
  if (!data) {
    // Fallback: compute synkront (bør ikke ske normalt)
    precomputeNextCatch();
    data = precomputedRef.current!;
  }
  precomputedRef.current = null; // Ryd op

  const { fish, problem, totalStages, timeLimit } = data;

  // Batch alle state-updates sammen
  setHookedFish(fish);
  const monkeyUnlocked = useCollectionStore.getState().unlockedCompanions.includes('monkey');
  useFishingStore.getState().setMonkeyHelpsThisRound(monkeyUnlocked && Math.random() < 0.05);
  setFightStages({ current: 0, total: totalStages });

  setProblem(problem);
  setUserAnswer('');

  if (!zenMode) {
    setInitialTime(timeLimit);
    setTimeLeft(timeLimit);
  }

  // Stagger: sæt gameState i næste frame så camera-lerp
  // starter uden at konkurrere med ovenstående React re-renders
  requestAnimationFrame(() => {
    setGameState('fighting');
    play('ui');
  });
}
```

### Nøglepunkt om `requestAnimationFrame`

Ved at flytte `setGameState('fighting')` til næste animation frame:
- Alle data-state-updates (fish, problem, timer) committer først i ét React-batch
- I næste frame starter kamera-lerp + MathChallenge mount
- Resultatet er at den tunge beregning er splittet over 2 frames i stedet for 1

---

## Ændring 2: Ryd precomputed data ved cancel/cleanup

### Fil: `src/components/fishing/FishingControls.tsx`

I `clearWaitTimer()` funktionen, tilføj cleanup af precomputed ref:

**FØR:**
```tsx
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
```

**EFTER:**
```tsx
function clearWaitTimer() {
  if (waitTimerRef.current != null) {
    window.clearTimeout(waitTimerRef.current);
    waitTimerRef.current = null;
  }
  if (castingTimerRef.current != null) {
    window.clearTimeout(castingTimerRef.current);
    castingTimerRef.current = null;
  }
  precomputedRef.current = null;
}
```

---

## Ændring 3 (valgfri optimering): Reducer MathChallenge mount-overhead

### Fil: `src/components/fishing/MathChallenge.tsx`

Denne ændring er valgfri men kan give yderligere forbedring. Timer-useEffect'en (linje ~424-445) kører `play('tick')` hvert sekund, men opsættes øjeblikkeligt ved mount. Overvej at starte timeren med en lille forsinkelse:

```tsx
useEffect(() => {
  if (gameState !== 'fighting' || !problem || zenMode) return;
  // Vent 150ms så kamera-lerp og initial render er færdig
  const startDelay = window.setTimeout(() => {
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
    // Gem interval-id til cleanup
    timerIntervalRef.current = id;
  }, 150);
  return () => {
    window.clearTimeout(startDelay);
    if (timerIntervalRef.current != null) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };
}, [gameState, problem, zenMode, play]);
```

(Kræver en ny ref: `const timerIntervalRef = useRef<number | null>(null);`)

---

## Opsummering af ændringer

| # | Fil | Ændring | Effekt |
|---|-----|---------|--------|
| 1A | FishingControls.tsx | Tilføj `precomputedRef` | Holder pre-computed data |
| 1B | FishingControls.tsx | Forlæng ventetid til 3.2–7.0s | Mere variation + tid til precompute |
| 1C | FishingControls.tsx | Ny `precomputeNextCatch()` | Tung beregning sker under "venter på bid" |
| 1D | FishingControls.tsx | Forenklet `startMathFight()` + `requestAnimationFrame` | Stagger state-updates og kamera-transition |
| 2 | FishingControls.tsx | Ryd precomputed i `clearWaitTimer()` | Forhindre stale data |
| 3 | MathChallenge.tsx | (Valgfri) Timer-forsinkelse 150ms | Reducer mount-overhead |

## Test-kriterier

- [ ] Tryk "KAST SNØREN" → "Venter på bid..." vises i 3–7 sekunder (variabel)
- [ ] Tryk "BID!" → overgang til math challenge uden synligt hak
- [ ] Kamerabevægelse fra bite-position til fight-position er smooth
- [ ] Math-problem vises korrekt med korrekt timer
- [ ] Boss-fights virker stadig (multi-phase, boss-ambience)
- [ ] "Klip line" knappen virker under fighting
- [ ] Zen-mode virker stadig korrekt (ingen timer)
- [ ] 3D-model preload sker tidligt under ventetiden
