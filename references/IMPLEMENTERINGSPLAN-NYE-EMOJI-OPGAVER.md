# Implementeringsplan: 8 nye emoji-opgavetyper (C–J)

> **Dato:** april 2026
> **Basis:** `emoji-task-ideas-catalog.md`
> **Scope:** Opgavetype C, D, E, F, G, H, I, J — **ikke** Bonus (Emoji-bingo)
> **Strategi:** Genbrug eksisterende mønstre (EMOJI_POOL, `answer: -1`, EmojiBox, klik-mekanisme) og tilføj minimalt nyt

---

## Overblik over ændrede filer

| Fil | Ændringer |
|-----|-----------|
| `src/types/math.ts` | 6 nye data-interfaces + udvidelse af `MathProblem` |
| `src/types/progression.ts` | 5 nye felter i `GoalStats` |
| `src/logic/math-engine.ts` | 8 nye `generate*`-funktioner + tilføjelse i `generateForMathType` |
| `src/data/math-config.ts` | 8 nye entries i `MATH_TYPE_DEFS` + opdatering af `FARVANDE.kysten` og `FARVANDE.aabenhav` |
| `src/data/progression.ts` | 11 nye `GoalDef`-entries (achievements) |
| `src/components/fishing/MathChallenge.tsx` | 6 nye Panel-komponenter + render-logik + klik-håndtering + kategori-tracking |
| `src/logic/goal-progress.ts` | 5 nye felter i `buildGoalStatsSnapshot` |
| `src/logic/goal-row-progress.ts` | 11 nye progress-bar cases |
| `src/store/usePlayerStore.ts` | 5 nye initiale stats-værdier |
| `src/store/useMathStore.ts` | Ingen ændringer nødvendige (dynamisk baseret på `activeMathTypes`) |
| `src/components/screens/MathSettingsScreen.tsx` | Automatisk — nye typer vises via `MATH_TYPE_DEFS` iteration |

---

## Fase 1 — Typesystem og datamodeller

### Trin 1.1: Nye interfaces i `src/types/math.ts`

Tilføj disse interfaces **efter** den eksisterende `EmojiAntalData`:

```ts
/** D: Find halvdelen + E: Find det dobbelte + H: Gør dem lige mange (delt layout) */
export interface EmojiHalvdelData {
  emoji: string;
  count: number;           // det viste antal (altid lige for D)
  mode: 'half' | 'double'; // halvdel eller dobbelt
}

/** F: Lige eller ulige */
export interface EmojiEvenOddData {
  emoji: string;
  count: number;           // 1–10
  isEven: boolean;         // det korrekte svar
}

/** G: Fortsæt mønsteret */
export interface EmojiPatternData {
  sequence: string[];          // den viste sekvens (fx ['🐟','🦀','🐟','🦀','🐟','🦀','🐟'])
  correctNext: string;         // den emoji der er korrekt
  choices: string[];           // 2–3 svarmuligheder (inkl. correctNext)
  patternType: 'AB' | 'ABB' | 'AAB' | 'ABC' | 'ABAC';
}

/** C: Sorter i rækkefølge */
export interface EmojiSortData {
  boxes: { emoji: string; count: number }[];  // altid 3 kasser
  mode: 'asc' | 'desc';                       // færrest→flest eller flest→færrest
  correctOrder: number[];                      // indices i boxes[] i korrekt rækkefølge
}

/** H: Gør dem lige mange */
export interface EmojiEqualizeData {
  emoji: string;
  leftCount: number;
  rightCount: number;
  difference: number;   // altid |leftCount - rightCount|, altid > 0
}

/** I: Brøkdele visuelt */
export interface EmojiFractionData {
  emoji: string;
  total: 10;                    // altid 10
  highlighted: number;          // 1–9
  correctFraction: string;      // forenklet brøk som streng, fx "2/5"
  choices: string[];            // 3–4 svarmuligheder inkl. korrekt
}

/** J: Procentdel */
export interface EmojiPercentData {
  emoji: string;
  total: 10;                    // altid 10
  highlighted: number;          // 1–10
  correctPercent: number;       // 10, 20, ..., 100
}
```

### Trin 1.2: Udvid `MathProblem` interfacet i `src/types/math.ts`

Tilføj de nye valgfrie felter i det eksisterende `MathProblem` interface, **efter** `emojiAntalData`:

```ts
export interface MathProblem {
  // ... eksisterende felter ...
  emojiAntalData?: EmojiAntalData;

  // NYE:
  emojiHalvdelData?: EmojiHalvdelData;
  emojiEvenOddData?: EmojiEvenOddData;
  emojiPatternData?: EmojiPatternData;
  emojiSortData?: EmojiSortData;
  emojiEqualizeData?: EmojiEqualizeData;
  emojiFractionData?: EmojiFractionData;
  emojiPercentData?: EmojiPercentData;
}
```

### Trin 1.3: Nye type-definitioner i `src/data/math-config.ts`

Tilføj 8 nye entries i `MATH_TYPE_DEFS`-arrayet **efter** `emoji-size-compare`:

```ts
{
  id: 'emoji-half',
  label: 'Find halvdelen',
  icon: '✂️',
  desc: 'Hvor mange er halvdelen?',
  group: 'emoji',
  supportsOps: false,
},
{
  id: 'emoji-double',
  label: 'Find det dobbelte',
  icon: '🔄',
  desc: 'Hvor mange er det dobbelte?',
  group: 'emoji',
  supportsOps: false,
},
{
  id: 'emoji-even-odd',
  label: 'Lige eller ulige?',
  icon: '🎲',
  desc: 'Er antallet lige eller ulige?',
  group: 'emoji',
  supportsOps: false,
},
{
  id: 'emoji-pattern',
  label: 'Fortsæt mønsteret',
  icon: '🔮',
  desc: 'Hvad kommer nu i sekvensen?',
  group: 'emoji',
  supportsOps: false,
},
{
  id: 'emoji-sort',
  label: 'Sorter i rækkefølge',
  icon: '📊',
  desc: 'Tryk i rækkefølge: færrest → flest',
  group: 'emoji',
  supportsOps: false,
},
{
  id: 'emoji-equalize',
  label: 'Gør dem lige mange',
  icon: '⚖️',
  desc: 'Hvor mange mangler?',
  group: 'emoji',
  supportsOps: false,
},
{
  id: 'emoji-fraction',
  label: 'Brøkdele',
  icon: '🍕',
  desc: 'Hvilken brøkdel er fremhævet?',
  group: 'emoji',
  supportsOps: false,
},
{
  id: 'emoji-percent',
  label: 'Procentdel',
  icon: '📈',
  desc: 'Hvor mange procent er fremhævet?',
  group: 'emoji',
  supportsOps: false,
},
```

### Trin 1.4: Opdater `FARVANDE` i `src/data/math-config.ts`

**Kysten** — tilføj til `allowedMathTypes`:

```ts
kysten: {
  // ...
  allowedMathTypes: [
    'plus', 'minus', 'tenfriends', '100friends', 'lette-historier',
    'emoji-antal', 'emoji-counting', 'emoji-most-least', 'emoji-size-compare',
    // NYE Kysten-typer:
    'emoji-half',
    'emoji-double',
    'emoji-even-odd',
    'emoji-pattern',
    'emoji-sort',
    'emoji-equalize',
  ],
  // ...
},
```

**Det Åbne Hav** — tilføj til `allowedMathTypes`:

```ts
aabenhav: {
  // ...
  allowedMathTypes: [
    'plus', 'minus', 'gange', 'division', 'tenfriends', 'skaeve100friends',
    'multi-term', 'regnehistorier', 'emoji-counting',
    // NYE Åbent Hav-typer:
    'emoji-fraction',
    'emoji-percent',
  ],
  // ...
},
```

---

## Fase 2 — Opgavegenerering i math-engine

Alle funktioner tilføjes i `src/logic/math-engine.ts`.

### Trin 2.1: D — `generateEmojiHalfProblem()`

```ts
export function generateEmojiHalfProblem(): MathProblem {
  // Altid lige antal: 2, 4, 6, 8, 10
  const evenNumbers = [2, 4, 6, 8, 10];
  const count = evenNumbers[Math.floor(Math.random() * evenNumbers.length)]!;
  const answer = count / 2;
  const emoji = EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)]!;

  return {
    question: 'Hvor mange er halvdelen?',
    answer,
    difficulty: 1,
    op: '/',
    category: 'emoji-half',
    displayType: 'emoji-half',
    xpBonus: 10,
    isDecimal: false,
    emojiHalvdelData: {
      emoji,
      count,
      mode: 'half',
    },
  };
}
```

### Trin 2.2: E — `generateEmojiDoubleProblem()`

```ts
export function generateEmojiDoubleProblem(): MathProblem {
  // 1–5 emojis, svar altid 2–10
  const count = randInt(1, 5);
  const answer = count * 2;
  const emoji = EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)]!;

  return {
    question: 'Hvor mange er det dobbelte?',
    answer,
    difficulty: 1,
    op: '*',
    category: 'emoji-double',
    displayType: 'emoji-double',
    xpBonus: 10,
    isDecimal: false,
    emojiHalvdelData: {
      emoji,
      count,
      mode: 'double',
    },
  };
}
```

> **Bemærk:** D og E deler `EmojiHalvdelData` og kan dele panel-komponent — `mode` afgør om spørgsmålet er halvdel eller dobbelt.

### Trin 2.3: H — `generateEmojiEqualizeProblem()`

```ts
export function generateEmojiEqualizeProblem(): MathProblem {
  const emoji = EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)]!;
  let a = randInt(1, 10);
  let b = randInt(1, 10);
  while (b === a) b = randInt(1, 10);

  // Sørg for at a altid er den største (vises til venstre 50% af tiden via UI)
  const leftCount = Math.max(a, b);
  const rightCount = Math.min(a, b);
  const difference = leftCount - rightCount;

  // Tilfældig placering: swap 50% af gangene
  const swapped = Math.random() < 0.5;

  return {
    question: 'Hvor mange mangler der, så de har lige mange?',
    answer: difference,
    difficulty: 1,
    op: '-',
    category: 'emoji-equalize',
    displayType: 'emoji-equalize',
    xpBonus: 10,
    isDecimal: false,
    emojiEqualizeData: {
      emoji,
      leftCount: swapped ? rightCount : leftCount,
      rightCount: swapped ? leftCount : rightCount,
      difference,
    },
  };
}
```

### Trin 2.4: F — `generateEmojiEvenOddProblem()`

```ts
export function generateEmojiEvenOddProblem(): MathProblem {
  const count = randInt(1, 10);
  const isEven = count % 2 === 0;
  const emoji = EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)]!;

  return {
    question: 'Er det lige eller ulige?',
    answer: -1,   // klik-baseret
    difficulty: 1,
    op: '+',
    category: 'emoji-even-odd',
    displayType: 'emoji-even-odd',
    xpBonus: 10,
    isDecimal: false,
    emojiEvenOddData: {
      emoji,
      count,
      isEven,
    },
  };
}
```

### Trin 2.5: G — `generateEmojiPatternProblem()`

```ts
type PatternType = 'AB' | 'ABB' | 'AAB' | 'ABC' | 'ABAC';

function pickDistinctEmojis(n: number): string[] {
  const pool = [...EMOJI_POOL];
  const result: string[] = [];
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(idx, 1)[0]!);
  }
  return result;
}

export function generateEmojiPatternProblem(): MathProblem {
  // Vælg mønstertype med vægtede sandsynligheder
  const roll = Math.random();
  let patternType: PatternType;
  if (roll < 0.40) patternType = 'AB';
  else if (roll < 0.60) patternType = 'ABB';
  else if (roll < 0.80) patternType = 'AAB';
  else if (roll < 0.95) patternType = 'ABC';
  else patternType = 'ABAC';

  // Opbyg cyklus og vælg emojis
  let cycle: number[];       // indices ind i emojis-arrayet
  let emojiCount: number;

  switch (patternType) {
    case 'AB':   cycle = [0, 1];          emojiCount = 2; break;
    case 'ABB':  cycle = [0, 1, 1];       emojiCount = 2; break;
    case 'AAB':  cycle = [0, 0, 1];       emojiCount = 2; break;
    case 'ABC':  cycle = [0, 1, 2];       emojiCount = 3; break;
    case 'ABAC': cycle = [0, 1, 0, 2];    emojiCount = 3; break;
  }

  const emojis = pickDistinctEmojis(emojiCount);

  // Byg sekvens: mindst 2 fulde cykler + start af næste (minus sidste element)
  const fullCycles = 2;
  const sequence: string[] = [];
  for (let c = 0; c < fullCycles; c++) {
    for (const idx of cycle) sequence.push(emojis[idx]!);
  }
  // Tilføj start af næste cyklus (alle undtagen det sidste element)
  for (let i = 0; i < cycle.length - 1; i++) {
    sequence.push(emojis[cycle[i]!]!);
  }

  // Det korrekte næste element
  const correctNext = emojis[cycle[cycle.length - 1]!]!;

  // Byg svarmuligheder: alle unikke emojis i mønsteret (inkl. korrekt)
  const uniqueInPattern = [...new Set([...emojis])];
  // Sørg for korrekt er med, og tilføj distraktor kun fra mønsterets emojis
  const choices = [...uniqueInPattern];
  // Hvis kun 1 unik (umuligt med vores mønstre, men safety):
  if (choices.length < 2) {
    const extra = EMOJI_POOL.find((e) => !choices.includes(e))!;
    choices.push(extra);
  }
  // Shuffle
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j]!, choices[i]!];
  }

  return {
    question: 'Hvad kommer nu?',
    answer: -1,   // klik-baseret
    difficulty: 1,
    op: '+',
    category: 'emoji-pattern',
    displayType: 'emoji-pattern',
    xpBonus: 15,
    isDecimal: false,
    emojiPatternData: {
      sequence,
      correctNext,
      choices,
      patternType,
    },
  };
}
```

### Trin 2.6: C — `generateEmojiSortProblem()`

```ts
export function generateEmojiSortProblem(): MathProblem {
  const mode: 'asc' | 'desc' = Math.random() < 0.5 ? 'asc' : 'desc';

  // Tre unikke antal (1–10)
  const counts: number[] = [];
  while (counts.length < 3) {
    const n = randInt(1, 10);
    if (!counts.includes(n)) counts.push(n);
  }

  // Tre (evt. forskellige) emojis
  const emojis = pickDistinctEmojis(3);

  const boxes = counts.map((count, i) => ({
    emoji: emojis[i]!,
    count,
  }));

  // Korrekt rækkefølge som indices sorteret
  const sorted = [...boxes.map((b, i) => ({ count: b.count, idx: i }))]
    .sort((a, b) => mode === 'asc' ? a.count - b.count : b.count - a.count);
  const correctOrder = sorted.map((s) => s.idx);

  return {
    question: mode === 'asc'
      ? 'Tryk i rækkefølge: færrest til flest!'
      : 'Tryk i rækkefølge: flest til færrest!',
    answer: -1,   // klik-baseret (sekventiel)
    difficulty: 1,
    op: '+',
    category: 'emoji-sort',
    displayType: 'emoji-sort',
    xpBonus: 15,
    isDecimal: false,
    emojiSortData: {
      boxes,
      mode,
      correctOrder,
    },
  };
}
```

### Trin 2.7: I — `generateEmojiFractionProblem()`

```ts
/** Forenklede brøker for 1–9 ud af 10 */
const FRACTION_MAP: Record<number, string> = {
  1: '1/10',
  2: '1/5',
  3: '3/10',
  4: '2/5',
  5: '1/2',
  6: '3/5',
  7: '7/10',
  8: '4/5',
  9: '9/10',
};

/** Distraktorer per antal fremhævede */
const FRACTION_DISTRACTORS: Record<number, string[]> = {
  1: ['1/5', '1/2'],
  2: ['1/10', '2/5', '1/2'],
  3: ['1/5', '2/5', '1/3'],
  4: ['1/5', '1/2', '3/10'],
  5: ['2/5', '3/5', '1/3'],
  6: ['1/2', '2/5', '7/10'],
  7: ['3/5', '4/5', '1/2'],
  8: ['3/5', '7/10', '9/10'],
  9: ['4/5', '7/10', '1'],
};

export function generateEmojiFractionProblem(): MathProblem {
  const highlighted = randInt(1, 9);
  const correctFraction = FRACTION_MAP[highlighted]!;
  const emoji = EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)]!;

  // Byg svarmuligheder: korrekt + 2–3 distraktorer
  const distractors = FRACTION_DISTRACTORS[highlighted]!
    .filter((d) => d !== correctFraction);
  // Tag 2–3 tilfældige distraktorer
  const numDistractors = Math.min(distractors.length, randInt(2, 3));
  const shuffledDistractors = [...distractors]
    .sort(() => Math.random() - 0.5)
    .slice(0, numDistractors);

  const choices = [correctFraction, ...shuffledDistractors]
    .sort(() => Math.random() - 0.5);

  return {
    question: 'Hvor stor en del er fremhævet?',
    answer: -1,   // klik-baseret
    difficulty: 2,
    op: '/',
    category: 'emoji-fraction',
    displayType: 'emoji-fraction',
    xpBonus: 15,
    isDecimal: false,
    emojiFractionData: {
      emoji,
      total: 10,
      highlighted,
      correctFraction,
      choices,
    },
  };
}
```

### Trin 2.8: J — `generateEmojiPercentProblem()`

```ts
export function generateEmojiPercentProblem(): MathProblem {
  const highlighted = randInt(1, 10);
  const correctPercent = highlighted * 10;
  const emoji = EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)]!;

  return {
    question: 'Hvor mange procent er fremhævet?',
    answer: correctPercent,   // tal-input (10, 20, ..., 100)
    difficulty: 2,
    op: '*',
    category: 'emoji-percent',
    displayType: 'emoji-percent',
    xpBonus: 15,
    isDecimal: false,
    emojiPercentData: {
      emoji,
      total: 10,
      highlighted,
      correctPercent,
    },
  };
}
```

### Trin 2.9: Tilslut i `generateForMathType()`

Tilføj disse linjer i `generateForMathType`-funktionen i `src/logic/math-engine.ts`, **efter** den eksisterende `emoji-size-compare`-linje:

```ts
if (type === 'emoji-half') return generateEmojiHalfProblem();
if (type === 'emoji-double') return generateEmojiDoubleProblem();
if (type === 'emoji-even-odd') return generateEmojiEvenOddProblem();
if (type === 'emoji-pattern') return generateEmojiPatternProblem();
if (type === 'emoji-sort') return generateEmojiSortProblem();
if (type === 'emoji-equalize') return generateEmojiEqualizeProblem();
if (type === 'emoji-fraction') return generateEmojiFractionProblem();
if (type === 'emoji-percent') return generateEmojiPercentProblem();
```

---

## Fase 3 — UI-paneler i MathChallenge

Alle paneler tilføjes i `src/components/fishing/MathChallenge.tsx`.

### Trin 3.1: Import af nye typer

Tilføj i import-linjen øverst (efter eksisterende imports fra `types/math`):

```ts
import type {
  EmojiAntalData, EmojiChoiceData, EmojiData, EmojiSizeData,
  // NYE:
  EmojiHalvdelData, EmojiEvenOddData, EmojiPatternData,
  EmojiSortData, EmojiEqualizeData, EmojiFractionData, EmojiPercentData,
} from '../../types/math';
```

### Trin 3.2: Panel — D/E: `EmojiHalvdelPanel`

Delt komponent for halvdel og dobbelt. Bruger to-række-layout med stiplet delelinje for halvdel.

```tsx
function EmojiHalvdelPanel({ data }: { data: EmojiHalvdelData }) {
  const isHalf = data.mode === 'half';
  const cols = Math.min(data.count, 5);
  const halfCount = data.count / 2;

  return (
    <div className="mb-3 flex flex-col items-center gap-3">
      <div className="text-center text-xl font-bold text-cyan-300">
        {isHalf ? '✂️ Hvor mange er halvdelen?' : '🔄 Hvor mange er det dobbelte?'}
      </div>
      <div className="rounded-xl border-2 border-dashed border-cyan-400/50 bg-cyan-900/20 p-4">
        {isHalf ? (
          /* To-række layout med stiplet delelinje */
          <div className="flex flex-col items-center gap-0">
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: `repeat(${halfCount}, min-content)` }}
            >
              {Array.from({ length: halfCount }).map((_, i) => (
                <span key={`h-top-${i}`} className="text-2xl leading-none">
                  {data.emoji}
                </span>
              ))}
            </div>
            <div className="my-1.5 w-full border-t-2 border-dashed border-white/30" />
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: `repeat(${halfCount}, min-content)` }}
            >
              {Array.from({ length: halfCount }).map((_, i) => (
                <span key={`h-bot-${i}`} className="text-2xl leading-none">
                  {data.emoji}
                </span>
              ))}
            </div>
          </div>
        ) : (
          /* Simpel visning for dobbelt */
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${cols}, min-content)` }}
          >
            {Array.from({ length: data.count }).map((_, i) => (
              <span key={`dbl-${i}`} className="text-2xl leading-none">
                {data.emoji}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="text-sm text-white/50">
        ({data.count} stk i alt)
      </div>
    </div>
  );
}
```

### Trin 3.3: Panel — F: `EmojiEvenOddPanel`

To store knapper — "Lige" og "Ulige". Parvis arrangement (to kolonner).

```tsx
function EmojiEvenOddPanel({
  data,
  revealingAnswer,
  zenMode,
  onChoose,
}: {
  data: EmojiEvenOddData;
  revealingAnswer: boolean;
  zenMode: boolean;
  onChoose: (choice: 'even' | 'odd') => void;
}) {
  const rows = Math.ceil(data.count / 2);
  const hasLeftover = data.count % 2 !== 0;

  return (
    <div className="mb-3 flex flex-col items-center gap-4 py-2">
      <div className="text-center text-xl font-bold text-cyan-300">
        🎲 Er det lige eller ulige?
      </div>

      {/* Parvis arrangement */}
      <div className="rounded-xl border-2 border-dashed border-cyan-400/50 bg-cyan-900/20 p-4">
        <div className="flex flex-col items-center gap-1">
          {Array.from({ length: rows }).map((_, row) => {
            const isLastRow = row === rows - 1 && hasLeftover;
            return (
              <div key={`row-${row}`} className="flex gap-3">
                <span className="text-2xl leading-none">{data.emoji}</span>
                {!isLastRow && (
                  <span className="text-2xl leading-none">{data.emoji}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-sm text-white/50">({data.count} stk)</div>

      {/* Klik-knapper */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => onChoose('even')}
          className={`touch-manipulation rounded-2xl border-2 border-emerald-400/50 bg-emerald-900/30 px-8 py-4 text-xl font-black text-emerald-300 transition-all hover:bg-emerald-800/50 active:scale-95 ${
            revealingAnswer && zenMode && data.isEven
              ? 'animate-pulse border-green-400 ring-4 ring-green-400/80'
              : ''
          }`}
        >
          Lige
        </button>
        <button
          type="button"
          onClick={() => onChoose('odd')}
          className={`touch-manipulation rounded-2xl border-2 border-amber-400/50 bg-amber-900/30 px-8 py-4 text-xl font-black text-amber-300 transition-all hover:bg-amber-800/50 active:scale-95 ${
            revealingAnswer && zenMode && !data.isEven
              ? 'animate-pulse border-green-400 ring-4 ring-green-400/80'
              : ''
          }`}
        >
          Ulige
        </button>
      </div>
    </div>
  );
}
```

### Trin 3.4: Panel — G: `EmojiPatternPanel`

Sekvens med `?` og multiple-choice knapper.

```tsx
function EmojiPatternPanel({
  data,
  revealingAnswer,
  zenMode,
  onChoose,
}: {
  data: EmojiPatternData;
  revealingAnswer: boolean;
  zenMode: boolean;
  onChoose: (emoji: string) => void;
}) {
  return (
    <div className="mb-3 flex flex-col items-center gap-4 py-2">
      <div className="text-center text-xl font-bold text-cyan-300">
        🔮 Hvad kommer nu?
      </div>

      {/* Sekvens-visning */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-cyan-400/50 bg-cyan-900/20 px-4 py-3">
        {data.sequence.map((emoji, i) => (
          <span key={`seq-${i}`} className="text-2xl leading-none">
            {emoji}
          </span>
        ))}
        <span className="ml-1 text-3xl font-black leading-none text-amber-400">?</span>
      </div>

      {/* Svarmuligheder */}
      <div className="flex gap-3">
        {data.choices.map((emoji, i) => (
          <button
            key={`choice-${i}`}
            type="button"
            onClick={() => onChoose(emoji)}
            className={`touch-manipulation rounded-xl border-2 border-dashed border-cyan-400/50 bg-cyan-900/20 px-5 py-3 text-3xl transition-all hover:border-cyan-300/80 hover:bg-cyan-800/40 active:scale-95 ${
              revealingAnswer && zenMode && emoji === data.correctNext
                ? 'animate-pulse border-green-400 ring-4 ring-green-400/80'
                : ''
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### Trin 3.5: Panel — C: `EmojiSortPanel`

Tre kasser med sekventiel klik. Kræver lokal state til at tracke klik-sekvens.

```tsx
function EmojiSortPanel({
  data,
  revealingAnswer,
  zenMode,
  onComplete,
  onWrong,
}: {
  data: EmojiSortData;
  revealingAnswer: boolean;
  zenMode: boolean;
  onComplete: () => void;
  onWrong: () => void;
}) {
  const [clickedIndices, setClickedIndices] = useState<number[]>([]);

  // Reset når data ændres (nyt problem)
  useEffect(() => {
    setClickedIndices([]);
  }, [data]);

  function handleBoxClick(boxIndex: number) {
    if (revealingAnswer) return;
    if (clickedIndices.includes(boxIndex)) return; // allerede valgt

    const nextStep = clickedIndices.length;
    const expectedIndex = data.correctOrder[nextStep];

    if (boxIndex === expectedIndex) {
      const newClicked = [...clickedIndices, boxIndex];
      setClickedIndices(newClicked);

      if (newClicked.length === 3) {
        // Alle tre korrekt — godkend
        onComplete();
      }
    } else {
      // Forkert tryk — straf, men fortsæt fra nuværende position
      onWrong();
    }
  }

  return (
    <div className="mb-3 flex flex-col items-center gap-4 py-2">
      <div className={`text-center text-xl font-bold ${
        data.mode === 'asc' ? 'text-emerald-400' : 'text-amber-400'
      }`}>
        📊 {data.mode === 'asc'
          ? 'Tryk i rækkefølge: færrest → flest!'
          : 'Tryk i rækkefølge: flest → færrest!'}
      </div>

      {/* Trin-indikator */}
      <div className="flex gap-2">
        {[0, 1, 2].map((step) => (
          <div
            key={step}
            className={`h-3 w-8 rounded-full transition-all ${
              step < clickedIndices.length
                ? 'bg-green-400'
                : step === clickedIndices.length
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-slate-600'
            }`}
          />
        ))}
      </div>

      {/* Tre kasser */}
      <div className="flex flex-wrap justify-center gap-3">
        {data.boxes.map((box, i) => {
          const alreadyClicked = clickedIndices.includes(i);
          const clickOrder = clickedIndices.indexOf(i);
          const cols = Math.min(box.count, 5);

          return (
            <button
              key={`sort-box-${i}`}
              type="button"
              onClick={() => handleBoxClick(i)}
              disabled={alreadyClicked}
              className={`touch-manipulation flex min-h-[5rem] min-w-[80px] max-w-[160px] flex-col items-center justify-center rounded-xl border-2 px-3 py-3 transition-all active:scale-95 ${
                alreadyClicked
                  ? 'border-green-400 bg-green-900/30 ring-2 ring-green-400/60'
                  : 'cursor-pointer border-dashed border-cyan-400/50 bg-cyan-900/20 hover:border-cyan-300/80 hover:bg-cyan-800/40'
              }`}
            >
              <div
                className="grid gap-1"
                style={{ gridTemplateColumns: `repeat(${cols}, min-content)` }}
              >
                {Array.from({ length: box.count }).map((_, j) => (
                  <span key={`sb-${i}-${j}`} className="text-2xl leading-none">
                    {box.emoji}
                  </span>
                ))}
              </div>
              {alreadyClicked && (
                <div className="mt-1 text-xs font-bold text-green-400">
                  {clickOrder + 1}.
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

### Trin 3.6: Panel — H: `EmojiEqualizePanel`

Genbruger eksisterende `EmojiBox`-komponent.

```tsx
function EmojiEqualizePanel({ data }: { data: EmojiEqualizeData }) {
  return (
    <div className="mb-3 flex flex-col items-center gap-3">
      <div className="text-center text-xl font-bold text-cyan-300">
        ⚖️ Hvor mange mangler, så de har lige mange?
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <EmojiBox emoji={data.emoji} count={data.leftCount} keyPrefix="eq-l" />
        <span className="text-2xl font-bold text-white/70">og</span>
        <EmojiBox emoji={data.emoji} count={data.rightCount} keyPrefix="eq-r" />
      </div>
    </div>
  );
}
```

### Trin 3.7: Panel — I: `EmojiFractionPanel`

10 emojis i en række/gitter, fremhævede med gul ring + scale-up.

```tsx
function EmojiFractionPanel({
  data,
  revealingAnswer,
  zenMode,
  onChoose,
}: {
  data: EmojiFractionData;
  revealingAnswer: boolean;
  zenMode: boolean;
  onChoose: (fraction: string) => void;
}) {
  return (
    <div className="mb-3 flex flex-col items-center gap-4 py-2">
      <div className="text-center text-xl font-bold text-cyan-300">
        🍕 Hvor stor en del er fremhævet?
      </div>

      {/* 10 emojis — 2×5 gitter */}
      <div className="rounded-xl border-2 border-dashed border-cyan-400/50 bg-cyan-900/20 p-4">
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 10 }).map((_, i) => {
            const isHighlighted = i < data.highlighted;
            return (
              <span
                key={`frac-${i}`}
                className={`flex items-center justify-center rounded-lg text-2xl leading-none transition-all ${
                  isHighlighted
                    ? 'scale-110 ring-2 ring-amber-400 ring-offset-1 ring-offset-transparent'
                    : 'opacity-40'
                }`}
                style={{ width: '2.5rem', height: '2.5rem' }}
              >
                {data.emoji}
              </span>
            );
          })}
        </div>
      </div>

      <div className="text-sm text-white/50">
        {data.highlighted} ud af {data.total}
      </div>

      {/* Svarmuligheder */}
      <div className="flex flex-wrap justify-center gap-3">
        {data.choices.map((fraction, i) => (
          <button
            key={`fc-${i}`}
            type="button"
            onClick={() => onChoose(fraction)}
            className={`touch-manipulation rounded-xl border-2 border-dashed border-indigo-400/50 bg-indigo-900/20 px-5 py-3 text-xl font-black text-indigo-200 transition-all hover:border-indigo-300/80 hover:bg-indigo-800/40 active:scale-95 ${
              revealingAnswer && zenMode && fraction === data.correctFraction
                ? 'animate-pulse border-green-400 ring-4 ring-green-400/80'
                : ''
            }`}
          >
            {fraction}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### Trin 3.8: Panel — J: `EmojiPercentPanel`

Genbruger den samme 10-emoji visning som brøk, men med tal-input.

```tsx
function EmojiPercentPanel({ data }: { data: EmojiPercentData }) {
  return (
    <div className="mb-3 flex flex-col items-center gap-3">
      <div className="text-center text-xl font-bold text-cyan-300">
        📈 Hvor mange procent er fremhævet?
      </div>

      {/* 10 emojis — 2×5 gitter */}
      <div className="rounded-xl border-2 border-dashed border-cyan-400/50 bg-cyan-900/20 p-4">
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 10 }).map((_, i) => {
            const isHighlighted = i < data.highlighted;
            return (
              <span
                key={`pct-${i}`}
                className={`flex items-center justify-center rounded-lg text-2xl leading-none transition-all ${
                  isHighlighted
                    ? 'scale-110 ring-2 ring-amber-400 ring-offset-1 ring-offset-transparent'
                    : 'opacity-40'
                }`}
                style={{ width: '2.5rem', height: '2.5rem' }}
              >
                {data.emoji}
              </span>
            );
          })}
        </div>
      </div>

      <div className="text-sm text-white/50">
        {data.highlighted} ud af {data.total}
      </div>
    </div>
  );
}
```

---

## Fase 4 — Klik-håndtering og render-logik

### Trin 4.1: Udvid `isClickBasedProblem`

I `MathChallenge`, find den eksisterende linje:

```ts
const isClickBasedProblem =
  problem.displayType === 'emoji-most-least' || problem.displayType === 'emoji-size-compare';
```

Erstat med:

```ts
const isClickBasedProblem =
  problem.displayType === 'emoji-most-least' ||
  problem.displayType === 'emoji-size-compare' ||
  problem.displayType === 'emoji-even-odd' ||
  problem.displayType === 'emoji-pattern' ||
  problem.displayType === 'emoji-sort' ||
  problem.displayType === 'emoji-fraction';
```

> **Bemærk:** `emoji-half`, `emoji-double`, `emoji-equalize` og `emoji-percent` er **IKKE** klik-baserede — de bruger tal-input.

### Trin 4.2: Nye klik-handlers i `MathChallenge`

Tilføj disse funktioner **efter** den eksisterende `handleEmojiChoice`:

```ts
function handleEvenOddChoice(choice: 'even' | 'odd') {
  if (gameState !== 'fighting' || !problem || revealingAnswer) return;
  const data = problem.emojiEvenOddData;
  if (!data) return;
  const isCorrect = (choice === 'even') === data.isEven;
  if (isCorrect) handleAnswerCorrect();
  else handleAnswerWrong();
}

function handlePatternChoice(emoji: string) {
  if (gameState !== 'fighting' || !problem || revealingAnswer) return;
  const data = problem.emojiPatternData;
  if (!data) return;
  const isCorrect = emoji === data.correctNext;
  if (isCorrect) handleAnswerCorrect();
  else handleAnswerWrong();
}

function handleFractionChoice(fraction: string) {
  if (gameState !== 'fighting' || !problem || revealingAnswer) return;
  const data = problem.emojiFractionData;
  if (!data) return;
  const isCorrect = fraction === data.correctFraction;
  if (isCorrect) handleAnswerCorrect();
  else handleAnswerWrong();
}

// EmojiSortPanel kalder direkte handleAnswerCorrect/handleAnswerWrong
// via onComplete/onWrong callbacks
```

### Trin 4.3: Udvid `clickRevealData`

Udvid den eksisterende `clickRevealData`-linje:

```ts
const clickRevealData = problem.emojiChoiceData || problem.emojiSizeData || problem.emojiEvenOddData;
```

### Trin 4.4: Udvid `monkeyBusyLayout`

Tilføj de nye displayTypes til den eksisterende `monkeyBusyLayout`-check:

```ts
const monkeyBusyLayout = Boolean(
  problem &&
    (isMultiPhase ||
      problem.displayType === 'emoji-most-least' ||
      problem.displayType === 'emoji-size-compare' ||
      problem.displayType === 'emoji-antal' ||
      problem.displayType === 'emoji-counting' ||
      // NYE:
      problem.displayType === 'emoji-half' ||
      problem.displayType === 'emoji-double' ||
      problem.displayType === 'emoji-even-odd' ||
      problem.displayType === 'emoji-pattern' ||
      problem.displayType === 'emoji-sort' ||
      problem.displayType === 'emoji-equalize' ||
      problem.displayType === 'emoji-fraction' ||
      problem.displayType === 'emoji-percent' ||
      problem.category === 'regnehistorier' ||
      problem.category === 'lette-historier' ||
      problem.category === 'equations'),
);
```

### Trin 4.5: Udvid render-logikken (JSX)

I den store `{problem.displayType === ...}`-blok, tilføj **efter** `EmojiCountingPanel` men **før** regnehistorie-blokken:

```tsx
) : problem.displayType === 'emoji-half' && problem.emojiHalvdelData ? (
  <EmojiHalvdelPanel data={problem.emojiHalvdelData} />
) : problem.displayType === 'emoji-double' && problem.emojiHalvdelData ? (
  <EmojiHalvdelPanel data={problem.emojiHalvdelData} />
) : problem.displayType === 'emoji-even-odd' && problem.emojiEvenOddData ? (
  <EmojiEvenOddPanel
    data={problem.emojiEvenOddData}
    revealingAnswer={revealingAnswer}
    zenMode={zenMode}
    onChoose={handleEvenOddChoice}
  />
) : problem.displayType === 'emoji-pattern' && problem.emojiPatternData ? (
  <EmojiPatternPanel
    data={problem.emojiPatternData}
    revealingAnswer={revealingAnswer}
    zenMode={zenMode}
    onChoose={handlePatternChoice}
  />
) : problem.displayType === 'emoji-sort' && problem.emojiSortData ? (
  <EmojiSortPanel
    data={problem.emojiSortData}
    revealingAnswer={revealingAnswer}
    zenMode={zenMode}
    onComplete={handleAnswerCorrect}
    onWrong={handleAnswerWrong}
  />
) : problem.displayType === 'emoji-equalize' && problem.emojiEqualizeData ? (
  <EmojiEqualizePanel data={problem.emojiEqualizeData} />
) : problem.displayType === 'emoji-fraction' && problem.emojiFractionData ? (
  <EmojiFractionPanel
    data={problem.emojiFractionData}
    revealingAnswer={revealingAnswer}
    zenMode={zenMode}
    onChoose={handleFractionChoice}
  />
) : problem.displayType === 'emoji-percent' && problem.emojiPercentData ? (
  <EmojiPercentPanel data={problem.emojiPercentData} />
```

### Trin 4.6: Udvid `problemTypeBadgeLabel`

Tilføj i den eksisterende switch-blok:

```ts
case 'emoji-half':
  return '✂️ Find halvdelen';
case 'emoji-double':
  return '🔄 Det dobbelte';
case 'emoji-even-odd':
  return '🎲 Lige / ulige';
case 'emoji-pattern':
  return '🔮 Mønster';
case 'emoji-sort':
  return '📊 Sorter';
case 'emoji-equalize':
  return '⚖️ Gør dem lige';
case 'emoji-fraction':
  return '🍕 Brøkdele';
case 'emoji-percent':
  return '📈 Procentdel';
```

### Trin 4.7: Monkey-helper tekst for klik-opgaver

Udvid den eksisterende `problem.answer === -1`-gren i monkey-boblen (ca. linje 906) til at give lidt mere specifik tekst. Den eksisterende tekst "Tryk på den rigtige kasse!" virker fint som fallback for alle klik-baserede opgaver. Ingen ændring nødvendig her — det eksisterende catch-all fungerer.

---

## Fase 5 — MathSettingsScreen

### Trin 5.1: Ingen kodeændring nødvendig!

`MathSettingsScreen` itererer allerede over `MATH_TYPE_DEFS` og renderer en toggle for hver entry i gruppen `'emoji'`. Ved at tilføje de 8 nye entries i `MATH_TYPE_DEFS` (Fase 1, Trin 1.3) vises de automatisk i indstillingerne.

**Verificér** at den eksisterende logik korrekt filtrerer baseret på `FARVANDE[selectedFarvand].allowedMathTypes` — det gør den allerede, da det er en del af `generateMathProblem`-flowet.

---

## Fase 6 — Achievements / mål-integration

Det eksisterende mål-system (83 mål i `src/data/progression.ts`) har 12 matematik-mål, men de tracker kun generisk performance (combo-streak, boss-wins, speed-solves). Der er **ingen mål der relaterer til specifikke opgavetyper** — hverken for de 4 eksisterende emoji-typer eller de 8 nye. Denne fase lukker det hul.

### Trin 6.1: Udvid `GoalStats` i `src/types/progression.ts`

Tilføj et nyt felt til at tracke hvilke opgave-kategorier spilleren har løst korrekt, samt tællere for mestrings-mål:

```ts
export interface GoalStats {
  // ... eksisterende felter ...

  /** Set af opgave-categories spilleren har klaret mindst én af korrekt */
  solvedCategories: string[];
  /** Antal korrekt løste brøk-opgaver */
  fractionSolves: number;
  /** Antal korrekt løste procent-opgaver */
  percentSolves: number;
  /** Antal korrekt løste mønster-opgaver */
  patternSolves: number;
  /** Antal korrekt løste halvdel/dobbelt-opgaver */
  halvdelDobbeltSolves: number;
}
```

### Trin 6.2: Initialiser nye stats i `usePlayerStore`

I `src/store/usePlayerStore.ts`, udvid den initiale `stats`-objekt (eller `emptyStats`):

```ts
solvedCategories: [],
fractionSolves: 0,
percentSolves: 0,
patternSolves: 0,
halvdelDobbeltSolves: 0,
```

### Trin 6.3: Track korrekte svar per kategori i `MathChallenge.tsx`

I `handleAnswerCorrect()`-funktionen (ca. linje 710), tilføj kategori-tracking **efter** den eksisterende `speedSolves`-logik men **inden** `finalizeCatch`:

```ts
function handleAnswerCorrect() {
  play('ui');

  // --- NY: Track løst kategori ---
  if (problem) {
    const cat = problem.category;
    setStats((s) => {
      const cats = s.solvedCategories ?? [];
      const newCats = cats.includes(cat) ? cats : [...cats, cat];
      return {
        ...s,
        solvedCategories: newCats,
        fractionSolves: s.fractionSolves + (cat === 'emoji-fraction' ? 1 : 0),
        percentSolves: s.percentSolves + (cat === 'emoji-percent' ? 1 : 0),
        patternSolves: s.patternSolves + (cat === 'emoji-pattern' ? 1 : 0),
        halvdelDobbeltSolves: s.halvdelDobbeltSolves +
          (cat === 'emoji-half' || cat === 'emoji-double' ? 1 : 0),
      };
    });
  }

  // ... resten af eksisterende logik ...
```

**Vigtigt:** Denne `setStats`-kald skal også dække klik-baserede svar. Da `handleAnswerCorrect` allerede kaldes fra `handleEmojiChoice`, `handleEvenOddChoice`, `handlePatternChoice`, `handleFractionChoice`, og `EmojiSortPanel.onComplete`, fanges alle korrekte svar automatisk.

### Trin 6.4: Opdater `buildGoalStatsSnapshot()` i `src/logic/goal-progress.ts`

Tilføj de nye felter i snapshot-funktionen (de er direkte fra `p.stats`, ingen ekstra mapping):

```ts
export function buildGoalStatsSnapshot(): GoalStats {
  const p = usePlayerStore.getState();
  // ...
  return {
    ...p.stats,
    // ... eksisterende overrides ...
    // NYE (direkte fra stats, men med fallback):
    solvedCategories: p.stats.solvedCategories ?? [],
    fractionSolves: p.stats.fractionSolves ?? 0,
    percentSolves: p.stats.percentSolves ?? 0,
    patternSolves: p.stats.patternSolves ?? 0,
    halvdelDobbeltSolves: p.stats.halvdelDobbeltSolves ?? 0,
  };
}
```

### Trin 6.5: Nye mål-definitioner i `src/data/progression.ts`

Tilføj disse **efter** de eksisterende matematik-mål (ca. linje 76):

```ts
// --- EMOJI-OPGAVETYPE MÅL ---

// "Første gang"-mål for nøgle-koncepter
{
  id: 'first_halvdel',
  title: 'Delt i to!',
  description: 'Løs din første halveringsopgave.',
  icon: '✂️',
  category: 'matematik',
  condition: (s) => (s.solvedCategories ?? []).includes('emoji-half'),
  reward: { xp: 30, coins: 20 },
  secret: false,
},
{
  id: 'first_dobbelt',
  title: 'Dobbelt op!',
  description: 'Løs din første fordoblingsopgave.',
  icon: '🔄',
  category: 'matematik',
  condition: (s) => (s.solvedCategories ?? []).includes('emoji-double'),
  reward: { xp: 30, coins: 20 },
  secret: false,
},
{
  id: 'first_pattern',
  title: 'Mønsterbryder',
  description: 'Løs din første mønsteropgave.',
  icon: '🔮',
  category: 'matematik',
  condition: (s) => (s.solvedCategories ?? []).includes('emoji-pattern'),
  reward: { xp: 40, coins: 30 },
  secret: false,
},
{
  id: 'first_fraction',
  title: 'Brøk-begynder',
  description: 'Løs din første brøkopgave.',
  icon: '🍕',
  category: 'matematik',
  condition: (s) => (s.solvedCategories ?? []).includes('emoji-fraction'),
  reward: { xp: 50, coins: 40 },
  secret: false,
},
{
  id: 'first_percent',
  title: 'Procent-debutant',
  description: 'Løs din første procentopgave.',
  icon: '📈',
  category: 'matematik',
  condition: (s) => (s.solvedCategories ?? []).includes('emoji-percent'),
  reward: { xp: 50, coins: 40 },
  secret: false,
},

// Mestrings-mål (kræver gentagelse)
{
  id: 'halvdel_dobbelt_10',
  title: 'Halvdels- & dobbeltmester',
  description: 'Løs 10 halvdel- eller dobbeltopgaver korrekt.',
  icon: '🪞',
  category: 'matematik',
  condition: (s) => (s.halvdelDobbeltSolves ?? 0) >= 10,
  reward: { xp: 100, coins: 75 },
  secret: false,
},
{
  id: 'pattern_10',
  title: 'Mønsterjæger',
  description: 'Løs 10 mønsteropgaver korrekt.',
  icon: '🔮',
  category: 'matematik',
  condition: (s) => (s.patternSolves ?? 0) >= 10,
  reward: { xp: 120, coins: 100 },
  secret: false,
},
{
  id: 'fraction_master',
  title: 'Brøkmester',
  description: 'Løs 15 brøkopgaver korrekt.',
  icon: '🍕',
  category: 'matematik',
  condition: (s) => (s.fractionSolves ?? 0) >= 15,
  reward: { xp: 200, coins: 150 },
  secret: false,
},
{
  id: 'percent_master',
  title: 'Procentkonge',
  description: 'Løs 15 procentopgaver korrekt.',
  icon: '👑',
  category: 'matematik',
  condition: (s) => (s.percentSolves ?? 0) >= 15,
  reward: { xp: 200, coins: 150 },
  secret: false,
},

// Det ultimative samle-mål
{
  id: 'emoji_master',
  title: 'Emoji-mester',
  description: 'Løs mindst én opgave af hver emoji-type (alle 12).',
  icon: '🏆',
  category: 'matematik',
  condition: (s) => {
    const cats = s.solvedCategories ?? [];
    const allEmojiCats = [
      'emoji-antal', 'emoji-counting', 'emoji-most-least', 'emoji-size-compare',
      'emoji-half', 'emoji-double', 'emoji-even-odd', 'emoji-pattern',
      'emoji-sort', 'emoji-equalize', 'emoji-fraction', 'emoji-percent',
    ];
    return allEmojiCats.every((c) => cats.includes(c));
  },
  reward: { xp: 500, coins: 500 },
  secret: true,
},
```

### Trin 6.6: Opdater `getGoalRowProgress()` i `src/logic/goal-row-progress.ts`

Tilføj progress-bars for de nye mål i switch-blokken:

```ts
// "Første gang"-mål (binære: 0 eller 1)
case 'first_halvdel':
  return { cur: (s.solvedCategories ?? []).includes('emoji-half') ? 1 : 0, max: 1 };
case 'first_dobbelt':
  return { cur: (s.solvedCategories ?? []).includes('emoji-double') ? 1 : 0, max: 1 };
case 'first_pattern':
  return { cur: (s.solvedCategories ?? []).includes('emoji-pattern') ? 1 : 0, max: 1 };
case 'first_fraction':
  return { cur: (s.solvedCategories ?? []).includes('emoji-fraction') ? 1 : 0, max: 1 };
case 'first_percent':
  return { cur: (s.solvedCategories ?? []).includes('emoji-percent') ? 1 : 0, max: 1 };

// Mestrings-mål (progress-bar)
case 'halvdel_dobbelt_10':
  return { cur: Math.min(s.halvdelDobbeltSolves ?? 0, 10), max: 10 };
case 'pattern_10':
  return { cur: Math.min(s.patternSolves ?? 0, 10), max: 10 };
case 'fraction_master':
  return { cur: Math.min(s.fractionSolves ?? 0, 15), max: 15 };
case 'percent_master':
  return { cur: Math.min(s.percentSolves ?? 0, 15), max: 15 };

// Samle-mål
case 'emoji_master': {
  const allEmojiCats = [
    'emoji-antal', 'emoji-counting', 'emoji-most-least', 'emoji-size-compare',
    'emoji-half', 'emoji-double', 'emoji-even-odd', 'emoji-pattern',
    'emoji-sort', 'emoji-equalize', 'emoji-fraction', 'emoji-percent',
  ];
  const solved = allEmojiCats.filter((c) => (s.solvedCategories ?? []).includes(c)).length;
  return { cur: solved, max: 12 };
}
```

### Oversigt over nye mål (11 stk)

| ID | Titel | Type | Krav | Belønning | Secret |
|----|-------|------|------|-----------|--------|
| `first_halvdel` | Delt i to! | Første gang | 1 halvdelingsopgave | 30 XP, 20 kr | Nej |
| `first_dobbelt` | Dobbelt op! | Første gang | 1 fordoblingsopgave | 30 XP, 20 kr | Nej |
| `first_pattern` | Mønsterbryder | Første gang | 1 mønsteropgave | 40 XP, 30 kr | Nej |
| `first_fraction` | Brøk-begynder | Første gang | 1 brøkopgave | 50 XP, 40 kr | Nej |
| `first_percent` | Procent-debutant | Første gang | 1 procentopgave | 50 XP, 40 kr | Nej |
| `halvdel_dobbelt_10` | Halvdels- & dobbeltmester | Mestring | 10 halvdel/dobbelt løst | 100 XP, 75 kr | Nej |
| `pattern_10` | Mønsterjæger | Mestring | 10 mønsteropgaver løst | 120 XP, 100 kr | Nej |
| `fraction_master` | Brøkmester | Mestring | 15 brøkopgaver løst | 200 XP, 150 kr | Nej |
| `percent_master` | Procentkonge | Mestring | 15 procentopgaver løst | 200 XP, 150 kr | Nej |
| `emoji_master` | Emoji-mester | Samle-mål | Alle 12 emoji-typer klaret | 500 XP, 500 kr | Ja |

### Ændringsresumé for Fase 6

| Fil | Ændring |
|-----|---------|
| `src/types/progression.ts` | +5 felter i `GoalStats` |
| `src/store/usePlayerStore.ts` | +5 initiale værdier i stats |
| `src/components/fishing/MathChallenge.tsx` | +15 linjer i `handleAnswerCorrect` |
| `src/logic/goal-progress.ts` | +5 linjer i `buildGoalStatsSnapshot` |
| `src/data/progression.ts` | +11 nye `GoalDef`-entries |
| `src/logic/goal-row-progress.ts` | +11 nye cases i switch |

---

## Samlet ændringsoversigt per fil

### `src/types/math.ts`

- **Tilføj** 7 nye interfaces: `EmojiHalvdelData`, `EmojiEvenOddData`, `EmojiPatternData`, `EmojiSortData`, `EmojiEqualizeData`, `EmojiFractionData`, `EmojiPercentData`
- **Udvid** `MathProblem` med 7 nye valgfrie felter

### `src/data/math-config.ts`

- **Tilføj** 8 nye entries i `MATH_TYPE_DEFS`
- **Udvid** `FARVANDE.kysten.allowedMathTypes` med 6 nye typer
- **Udvid** `FARVANDE.aabenhav.allowedMathTypes` med 2 nye typer

### `src/logic/math-engine.ts`

- **Tilføj** hjælpefunktion `pickDistinctEmojis()`
- **Tilføj** konstanter `FRACTION_MAP` og `FRACTION_DISTRACTORS`
- **Tilføj** 8 nye `generate*`-funktioner
- **Udvid** `generateForMathType()` med 8 nye `if`-grene

### `src/components/fishing/MathChallenge.tsx`

- **Tilføj** 8 nye Panel-komponenter (ca. 350 linjer JSX)
- **Tilføj** 3 nye klik-handlers (`handleEvenOddChoice`, `handlePatternChoice`, `handleFractionChoice`)
- **Udvid** `isClickBasedProblem` med 4 nye displayTypes
- **Udvid** `monkeyBusyLayout` med 8 nye displayTypes
- **Udvid** render-logik med 8 nye betingede blokke
- **Udvid** `problemTypeBadgeLabel` med 8 nye cases
- **Udvid** imports med nye typer

---

## Implementeringsrækkefølge (anbefalet)

Alle faser kan teknisk set implementeres i vilkårlig rækkefølge, men denne sekvens minimerer risikoen for fejl og giver testbar funktionalitet tidligst muligt:

1. **Trin 1.1–1.4** — Typesystem + config (grundlag for alt)
2. **Trin 2.1–2.3** → **Trin 3.2, 3.6** → **Trin 4.5** — D, E, H (tal-input, genbruger eksisterende)
3. **Trin 2.4** → **Trin 3.3** → **Trin 4.1–4.5** — F (ny klik-variant, simpel)
4. **Trin 2.5** → **Trin 3.4** → **Trin 4.1–4.5** — G (ny klik-variant, medium)
5. **Trin 2.6** → **Trin 3.5** → **Trin 4.1–4.5** — C (sekventiel klik, mest kompleks Kysten)
6. **Trin 2.7–2.8** → **Trin 3.7–3.8** → **Trin 4.1–4.5** — I, J (Åbent Hav)
7. **Trin 4.6** — Badge-labels (kan gøres når som helst)
8. **Trin 6.1–6.6** — Achievements/mål (efter alle opgavetyper er implementeret)

---

## Design-beslutninger (bekræftet)

| Beslutning | Valg |
|-----------|------|
| C: Fejl nulstiller sekvensen? | **Nej** — spilleren fortsætter fra nuværende trin |
| D: Stiplet delelinje? | **Ja** — to-række-layout med synlig delelinje |
| I/J: Fremhævningsmetode? | **Gul ring/border + scale-up** |
| Settings: Toggle-struktur? | **Individuelle toggles** per opgavetype |

---

## Test-checkliste

- [ ] Alle 8 opgavetyper genererer korrekt i math-engine (unit test)
- [ ] D: Altid lige antal, svar altid helt tal 1–5
- [ ] E: Altid 1–5 emojis, svar altid 2–10
- [ ] H: Altid ulige antal, differens altid > 0
- [ ] F: 50/50 fordeling af lige/ulige
- [ ] G: Alle 5 mønstertyper genereres med korrekte vægte
- [ ] C: Tre unikke antal, sekventiel klik fungerer
- [ ] I: Korrekt brøk-forenkling, distraktorer er rimelige
- [ ] J: Svar altid multiplum af 10
- [ ] Klik-baserede opgaver skjuler tal-input korrekt
- [ ] Tal-input-opgaver viser numpad korrekt
- [ ] Zen-mode viser "Vis svar" for alle nye typer
- [ ] Monkey-helper fungerer med nye typer
- [ ] Settings viser alle 8 nye toggles
- [ ] Kysten-farvand tillader C, D, E, F, G, H
- [ ] Åbent Hav-farvand tillader I, J
- [ ] Badges vises korrekt for alle nye typer
- [ ] Achievements: "Første gang"-mål udløses ved første korrekte svar
- [ ] Achievements: Mestrings-mål tæller korrekte svar over tid
- [ ] Achievements: "Emoji-mester" kræver alle 12 emoji-kategorier
- [ ] Achievements: Progress-bars viser korrekt fremskridt
- [ ] Achievements: solvedCategories persisterer korrekt i save/load
- [ ] Build kompilerer uden TypeScript-fejl
