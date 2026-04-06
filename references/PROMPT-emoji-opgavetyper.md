# Implementeringsprompt: Tre nye emoji-opgavetyper

> **Kontekst:** Regnefisken er et børne-matematikspe med fiskeri-tema. Spilleren fanger fisk ved at løse regneopgaver. Spillet har tre "farvande" (sværhedsgrader): Kysten (0.–3. kl.), Det Åbne Hav (4.–6. kl.), Dybet (7.–9. kl.). Opgaver genereres i `math-engine.ts`, konfigureres i `math-config.ts`, vises i `MathChallenge.tsx`, og indstilles i `MathSettingsScreen.tsx`.

---

## Opgave

Implementer **tre nye opgavetyper** i Regnefisken. Alle tre bruger emojis visuelt og tilhører kategori-systemet (ikke special-operators). Brug de to vedlagte design-dokumenter som autoritative referencer:

- `references/emoji-counting-design.md` — Opgavetype 1
- `references/emoji-most-least-and-size-compare-design.md` — Opgavetype 2 og 3

**Implementer i denne rækkefølge**, da 2 og 3 bygger oven på infrastruktur fra 1, og 3 genbruger klik-mekanismen fra 2:

---

## Opgavetype 1: Emoji-tælling (`emoji-counting`)

**Koncept:** Spilleren ser to kasser med emojis og skal tælle emojierne, udføre den viste regneart, og taste svaret som et tal via det eksisterende input-system.

### Filer der skal ændres

#### 1.1 `src/types/math.ts`

Tilføj et nyt interface `EmojiData` og et valgfrit felt `emojiData?: EmojiData` på `MathProblem`:

```typescript
interface EmojiData {
  emoji: string;
  leftCount: number;
  rightCount: number;
  operator: '+' | '-' | '*' | '/';
}
```

#### 1.2 `src/logic/math-engine.ts`

**Tilføj øverst i filen:**

En `EMOJI_POOL`-konstant med 51 hav/fiske-tema emojis (se design-dokument sektion 3 for den komplette liste).

**Tilføj ny generator-funktion:**

`generateEmojiCountingProblem(activeOps, selectedFarvand, mathDifficulty)` — se design-dokument sektion 6 for komplet pseudokode. Vigtige regler:

- **Kysten:** Kun `+` og `-`. Sværhedsgrad `beginner` → maks resultat ≤ 10. `intermediate`/`expert` → maks resultat ≤ 20.
- **Åbent Hav:** Kun `*` og `/`. Sværhedsgrad ignoreres (altid 1–10 per kasse).
- **Division** genereres baglæns: vælg divisor og kvotient først, beregn dividend `a = b × kvotient`, gentag hvis `a > 10`.
- **Subtraktion:** `a > b` altid (positivt svar).
- Én tilfældig emoji fra `EMOJI_POOL` per opgave. Begge kasser bruger **samme** emoji.
- `displayType: 'emoji-counting'`, `category: 'emoji-counting'`, `xpBonus: 15`.

**Tilføj routing i `generateMathProblem()`:**

Indsæt et nyt check **efter** special-operator checks (`tenfriends`, `100friends`, `skaeve100friends`) og **før** `regnehistorier`-checket:

```typescript
if (mathCategory === 'emoji-counting') {
  const selectedFarvand = difficulty === 1 ? 'kysten' : 'aabenhav';
  return generateEmojiCountingProblem(activeOps || ['+'], selectedFarvand, mathDifficulty);
}
```

Farvand-bestemmelsen bruger `difficulty`-parameteren: `1` = Kysten, `2` = Åbent Hav. Kysten filtrerer ops til `['+', '-']`, Åbent Hav til `['*', '/']`.

#### 1.3 `src/data/math-config.ts`

Tilføj `'emoji-counting'` til `allowedCategories` for **kysten** og **aabenhav**:

```typescript
kysten: {
  allowedCategories: ['basic', 'lette-historier', 'emoji-counting'],
  // ...resten uændret
},
aabenhav: {
  allowedCategories: ['basic', 'multi-term', 'regnehistorier', 'emoji-counting'],
  // ...resten uændret
},
```

`dybet` forbliver **uændret** (ingen emoji-counting).

#### 1.4 `src/components/screens/MathSettingsScreen.tsx`

Tilføj til `CATEGORY_ROWS`-arrayet:

```typescript
{ id: 'emoji-counting', label: 'Emoji-tælling', icon: '🎯', desc: 'Tæl emojis og regn!' },
```

Kategorien filtreres automatisk af farvandets `allowedCategories`, så den kun vises for Kysten og Åbent Hav.

#### 1.5 `src/components/fishing/MathChallenge.tsx`

Tilføj et **nyt render-tilfælde** for `displayType === 'emoji-counting'`. Placer det **før** den eksisterende `regnehistorier`/`lette-historier`-check og den generelle text-display.

Layout: To kasser side om side med emojis, operator-symbol imellem, `= ?` nedenunder. Stil:

- Kasser: `border-2 border-dashed border-cyan-400/50 rounded-xl bg-cyan-900/20`, emojis i `flex flex-wrap gap-1`, `max-w-[160px]`
- Operator: `text-4xl font-bold text-white/90`
- Brug `+`, `−` (minus-tegn), `×`, `÷` som visningstegn

Input og numpad forbliver **synlige** (spilleren taster svar som normalt).

Tilføj også et badge-tilfælde i kategori-badge-logikken:

```typescript
mathCategory === 'emoji-counting' ? '🎯 Emoji-tælling'
```

---

## Opgavetype 2: Flest / færrest (`emoji-most-least`)

**Koncept:** Spilleren ser to kasser med emojis (muligvis to forskellige slags) og skal **klikke/tappe** på kassen med flest eller færrest. Intet tal-input — numpad og inputfelt skjules.

### Filer der skal ændres

#### 2.1 `src/types/math.ts`

Tilføj nyt interface `EmojiChoiceData` og felt `emojiChoiceData?: EmojiChoiceData`:

```typescript
interface EmojiChoiceData {
  mode: 'most' | 'least';
  leftEmoji: string;
  rightEmoji: string;
  leftCount: number;
  rightCount: number;
  correctSide: 'left' | 'right';
}
```

#### 2.2 `src/logic/math-engine.ts`

**Tilføj ny generator:**

`generateEmojiMostLeastProblem()` — se design-dokument sektion A6. Vigtige regler:

- 50/50 chance for `'most'` vs `'least'` mode.
- Hver kasse har sin **egen tilfældigt valgte emoji** fra `EMOJI_POOL` (de to kasser kan have forskellige emojis).
- Antal per kasse: 1–10, men **aldrig lige mange** (`countA !== countB`).
- `answer: -1` (speciel markør for klik-baserede opgaver).
- `displayType: 'emoji-most-least'`, `category: 'emoji-most-least'`, `xpBonus: 10`.
- `op: '+'`, `multiplier: 1` (neutrale værdier, bruges ikke til beregning).
- Kun tilgængelig på **Kysten**. Sværhedsgrad ignoreres.

**Routing:** Tilføj i `generateMathProblem()` **før** `emoji-counting`-checket:

```typescript
if (mathCategory === 'emoji-most-least') {
  return generateEmojiMostLeastProblem();
}
```

#### 2.3 `src/data/math-config.ts`

Tilføj `'emoji-most-least'` til Kystens `allowedCategories`:

```typescript
kysten: {
  allowedCategories: ['basic', 'lette-historier', 'emoji-counting', 'emoji-most-least'],
},
```

Kun Kysten — **ikke** Åbent Hav eller Dybet.

#### 2.4 `src/components/screens/MathSettingsScreen.tsx`

Tilføj til `CATEGORY_ROWS`:

```typescript
{ id: 'emoji-most-least', label: 'Flest / færrest', icon: '⚖️', desc: 'Tryk på den rigtige kasse' },
```

#### 2.5 `src/components/fishing/MathChallenge.tsx`

**Denne opgavetype kræver en ny svar-mekanisme.** Det er den største ændring.

**A) Ny helper-variabel:**

```typescript
const isClickBasedProblem = problem?.displayType === 'emoji-most-least'
                         || problem?.displayType === 'emoji-size-compare';
```

**B) Skjul input og numpad** for klik-baserede opgaver. Wrap det eksisterende input/numpad-afsnit (den `<div className="relative">` der indeholder form, numpad og zen-knap) i:

```tsx
{!isClickBasedProblem && (
  // ...eksisterende input, numpad, zen-knap...
)}
```

**C) Ny svar-handler `handleEmojiChoice(side)`:**

```typescript
function handleEmojiChoice(side: 'left' | 'right') {
  if (gameState !== 'fighting' || !problem || revealingAnswer) return;
  const choiceData = problem.emojiChoiceData || problem.emojiSizeData;
  if (!choiceData) return;

  const isCorrect = side === choiceData.correctSide;

  if (isCorrect) {
    // Gentag præcis den korrekte-svar-logik fra checkAnswer():
    // play('ui'), avancér fightStages, speed-solve check, finalizeCatch/nextProblem
    play('ui');
    const fs = useFishingStore.getState().fightStages;
    const next = fs.current + 1;
    const mSnap = useMathStore.getState();
    const speedEligible = !zenMode && mSnap.initialTime > 0 && mSnap.timeLeft / mSnap.initialTime > 0.8;
    if (next >= fs.total) {
      if (speedEligible) setStats(s => ({ ...s, speedSolves: s.speedSolves + 1 }));
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
  } else {
    // Gentag præcis den forkerte-svar-logik fra checkAnswer():
    // play('error'), streak reset, -3s timer
    play('error');
    const hook = hookedFish;
    if (hook && !STREAK_EXCEPTION_TYPES.has(hook.itemType)) {
      setCurrentStreak(0);
      setStreakMilestoneToast(null);
    }
    const mWrong = useMathStore.getState();
    mWrong.setTimeLeft(Math.max(0, mWrong.timeLeft - 3));
  }
}
```

> **Vigtigt:** Den korrekte og forkerte svar-logik skal matche den eksisterende `checkAnswer()`-funktion præcist. Brug refactoring: overvej at udtrække de to grene ("korrekt svar" og "forkert svar") til to interne hjælpefunktioner (`onCorrect()`, `onWrong()`) og kald dem fra **både** `checkAnswer()` og `handleEmojiChoice()`, så logikken ikke dubleres. Dette er den anbefalede tilgang.

**D) Nyt render-layout for `displayType === 'emoji-most-least'`:**

Vis instruktionstekst ("Tryk på den med FLEST!" / "Tryk på den med FÆRREST!") med grøn farve for `most`, gul for `least`. To **klikbare `<button>`-elementer** (kasserne) side om side med "eller" imellem. Stil:

- Kasser: `border-2 border-dashed border-cyan-400/50 rounded-xl bg-cyan-900/20`, hover-effekt, `active:scale-95`, `cursor-pointer`
- Emojis: `text-2xl`, `flex flex-wrap gap-1`
- Klik kalder `handleEmojiChoice('left')` / `handleEmojiChoice('right')`

**E) Badge-tilfælde:**

```typescript
mathCategory === 'emoji-most-least' ? '⚖️ Flest / færrest'
```

**F) Zen-mode "Vis svar":**

Når `isClickBasedProblem && zenMode`, vis en alternativ "Vis svar"-knap der fremhæver den korrekte kasse visuelt (fx grøn border + puls-animation) i stedet for at vise et tal.

---

## Opgavetype 3: Størst / mindst (`emoji-size-compare`)

**Koncept:** Spilleren ser to kasser med **samme** emoji i **forskellig fysisk størrelse** (CSS font-size) og skal klikke/tappe på kassen med de største eller mindste emojis. Antal er bevidst modsat (store emojis har få stk, små har mange).

### Filer der skal ændres

#### 3.1 `src/types/math.ts`

Tilføj nyt interface `EmojiSizeData` og felt `emojiSizeData?: EmojiSizeData`:

```typescript
interface EmojiSizeData {
  mode: 'biggest' | 'smallest';
  emoji: string;
  leftSize: 'small' | 'medium' | 'large';
  rightSize: 'small' | 'medium' | 'large';
  leftCount: number;
  rightCount: number;
  correctSide: 'left' | 'right';
}
```

#### 3.2 `src/logic/math-engine.ts`

**Tilføj konstanter:**

```typescript
const EMOJI_SIZES = {
  small:  { fontSize: '1.2rem', label: 'lille' },
  medium: { fontSize: '2rem',   label: 'mellem' },
  large:  { fontSize: '3.2rem', label: 'stor' },
};

const SIZE_PAIRS: ['small' | 'medium' | 'large', 'small' | 'medium' | 'large'][] = [
  ['small', 'medium'],
  ['small', 'large'],
  ['medium', 'large'],
];
```

Eksporter `EMOJI_SIZES` så `MathChallenge.tsx` kan bruge den til at sætte `fontSize`.

**Tilføj ny generator:**

`generateEmojiSizeCompareProblem()` — se design-dokument sektion B7. Vigtige regler:

- 50/50 chance for `'biggest'` vs `'smallest'` mode.
- Begge kasser bruger **samme** emoji (kun størrelsen er anderledes).
- Størrelses-par vælges fra `SIZE_PAIRS`, fordeles tilfældigt på venstre/højre.
- **Modsat-strategi for antal:** `small` → 4–7 stk, `medium` → 2–5 stk, `large` → 1–3 stk.
- `answer: -1`, `displayType: 'emoji-size-compare'`, `category: 'emoji-size-compare'`, `xpBonus: 10`.
- Kun tilgængelig på **Kysten**. Sværhedsgrad ignoreres.

**Routing:** Tilføj i `generateMathProblem()` **mellem** `emoji-most-least` og `emoji-counting`:

```typescript
if (mathCategory === 'emoji-size-compare') {
  return generateEmojiSizeCompareProblem();
}
```

#### 3.3 `src/data/math-config.ts`

Tilføj `'emoji-size-compare'` til Kystens `allowedCategories`:

```typescript
kysten: {
  allowedCategories: ['basic', 'lette-historier', 'emoji-counting', 'emoji-most-least', 'emoji-size-compare'],
},
```

#### 3.4 `src/components/screens/MathSettingsScreen.tsx`

Tilføj til `CATEGORY_ROWS`:

```typescript
{ id: 'emoji-size-compare', label: 'Størst / mindst', icon: '🔍', desc: 'Tryk på de store eller små' },
```

#### 3.5 `src/components/fishing/MathChallenge.tsx`

**A) Nyt render-layout for `displayType === 'emoji-size-compare'`:**

Meget lig `emoji-most-least`, men med:

- **Variabel `fontSize`** per kasse via inline `style={{ fontSize: EMOJI_SIZES[...].fontSize }}`
- Lilla border i stedet for cyan: `border-purple-400/50`, `bg-purple-900/20`
- Instruktionstekst: "🔍 Tryk på de STØRSTE!" / "🔍 Tryk på de MINDSTE!"
- Klik kalder samme `handleEmojiChoice('left')`/`handleEmojiChoice('right')` som opgavetype 2

`handleEmojiChoice` fungerer allerede korrekt, da den checker `problem.emojiChoiceData || problem.emojiSizeData`.

`isClickBasedProblem` inkluderer allerede `emoji-size-compare` (defineret i opgavetype 2).

**B) Badge-tilfælde:**

```typescript
mathCategory === 'emoji-size-compare' ? '🔍 Størst / mindst'
```

---

## Samlet routing-rækkefølge i `generateMathProblem()`

Efter implementering skal routing-flowet være:

```
generateMathProblem(...)
│
├─ activeOps includes 'tenfriends'?       → generateTenFriendsProblem()
├─ activeOps includes '100friends'?       → generate100FriendsQuestion()
├─ activeOps includes 'skaeve100friends'? → generateSkaeve100FriendsQuestion()
│
├─ mathCategory === 'emoji-most-least'?   → generateEmojiMostLeastProblem()
├─ mathCategory === 'emoji-size-compare'? → generateEmojiSizeCompareProblem()
├─ mathCategory === 'emoji-counting'?     → generateEmojiCountingProblem()
│
├─ mathCategory === 'regnehistorier'?     → generateRegneHistorie()
├─ mathCategory === 'lette-historier'?    → generateLetRegneHistorie()
├─ mathCategory === 'multi-term'?         → generateMultiTermProblem()
├─ mathCategory === 'equations'?          → generateEquationProblem()
├─ mathCategory === 'decimals'?           → generateDecimalProblem()
│
└─ default (basic)                        → generisk op-baseret opgave
```

---

## Samlet oversigt over berørte filer

| # | Fil | Ændringer |
|---|-----|-----------|
| 1 | `src/types/math.ts` | Tilføj `EmojiData`, `EmojiChoiceData`, `EmojiSizeData` interfaces. Tilføj `emojiData?`, `emojiChoiceData?`, `emojiSizeData?` felter på `MathProblem`. |
| 2 | `src/logic/math-engine.ts` | Tilføj `EMOJI_POOL`, `EMOJI_SIZES`, `SIZE_PAIRS`. Tilføj `generateEmojiCountingProblem()`, `generateEmojiMostLeastProblem()`, `generateEmojiSizeCompareProblem()`, `getCountForSize()`. Tilføj routing for alle tre i `generateMathProblem()`. Eksporter `EMOJI_SIZES` og `EMOJI_POOL`. |
| 3 | `src/data/math-config.ts` | Tilføj `'emoji-counting'` til kysten + aabenhav. Tilføj `'emoji-most-least'` og `'emoji-size-compare'` kun til kysten. |
| 4 | `src/components/screens/MathSettingsScreen.tsx` | Tilføj tre nye entries i `CATEGORY_ROWS`. |
| 5 | `src/components/fishing/MathChallenge.tsx` | Tre nye render-layouts. Ny `handleEmojiChoice()` funktion. `isClickBasedProblem`-helper. Skjul input/numpad for klik-opgaver. Refactor korrekt/forkert-logik til genanvendelige hjælpere. Tre nye badge-tilfælde. Zen-mode visning for klik-opgaver. |

---

## Vigtige designbeslutninger at respektere

1. **Kategori-baseret, ikke special-operator:** Alle tre opgavetyper er kategorier (som `regnehistorier`), ikke eksklusive special-operators (som `tenfriends`). De sameksisterer med andre kategorier.

2. **`answer: -1` konventionen:** Opgavetype 2 og 3 bruger `answer: -1` som markør for klik-baserede opgaver. Numerisk validering i `checkAnswer()` skal **ikke** trigges for disse.

3. **Fælles `EMOJI_POOL`:** Alle tre opgavetyper deler samme pool. Definer den **én gang** i `math-engine.ts`.

4. **Kompatibilitet:** Boss-kampe, zen-mode, streak og speed-solve skal alle fungere med de nye opgavetyper. Brug `handleCorrectAnswer`/`handleWrongAnswer`-hjælpefunktioner (refactored fra `checkAnswer`) i `handleEmojiChoice`.

5. **Sværhedsgrad:** Kun `emoji-counting` på Kysten bruger `mathDifficulty` (begynder ≤ 10, øvet ≤ 20). Alle andre kombinationer ignorerer sværhedsgrad.

6. **Ingen nye afhængigheder** — alt bygges med eksisterende React, Tailwind og Zustand.

---

## Referencemateriale

De originale design-specifikationer ligger i `references/`-mappen som baggrundsmateriale, men **denne prompt er den autoritative implementeringsguide**. Følg instruktionerne heri.
