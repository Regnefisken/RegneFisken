# Nye opgavetyper — Flest/færrest & Størst/mindst

> Til: Regnefisken  
> Dato: april 2026  
> Status: Design-specifikation  
> Scope: To selvstændige opgavetyper, implementeres separat

---

# OPGAVETYPE A: Flest / færrest (emoji-most-least)

## A1. Koncept

Spilleren ser **to kasser med emojis** — muligvis to forskellige slags — og skal **trykke på den kasse** der indeholder flest eller færrest emojis. Der skrives intet svar; numpad og inputfelt skjules helt.

**Eksempel — "Tryk på kassen med FLEST":**

```
  Tryk på den med FLEST!

┌──────────────────┐    ┌─────────────────┐
│ 🐟🐟🐟🐟🐟🐟   │    │ 🦀🦀🦀🦀       │
└──────────────────┘    └─────────────────┘
      (6 stk)                (4 stk)
         ✅                    
```

Spilleren trykker på venstre kasse → korrekt!

---

## A2. Farvand og indstillinger

| Parameter | Værdi |
|-----------|-------|
| Farvand | 🏖️ Kysten (0.–3. klasse) |
| Kategori-ID | `emoji-most-least` |
| Sværhedsgrad | Kun "begynder" — `intermediate` og `expert` mapper begge til begynder |
| Eksklusiv? | Nej — kategori-baseret (som `lette-historier`) |
| Special-operator? | Nej |

---

## A3. Emoji-pool

Samme pool som emoji-counting:

```typescript
const EMOJI_POOL: string[] = [
  '⚓', '🏴‍☠️', '🐟', '🐠', '🐡', '🐳', '🐋', '🐬', '🦭', '🦈',
  '🐙', '🦑', '🦀', '🦞', '🦐', '🪼', '🪸', '🐚', '🦪', '🐢',
  '🦦', '🪱', '🎣', '🪝', '⛵', '🚤', '🛥️', '🛶', '🏖️', '🏝️',
  '⛱️', '🌴', '🌅', '☀️', '☁️', '🧭', '🗺️', '🤿', '🛟', '🧜',
  '🧜‍♀️', '🧜‍♂️', '🦜', '🪙', '🚢', '💰', '🐦', '🌞', '🌤️', '🏄', '🏊'
];
```

**Vigtigt:** De to kasser kan have **forskellige emojis** — dette træner evnen til at tælle uanset type. Emojien for hver kasse vælges uafhængigt og uniformt tilfældigt.

---

## A4. Regler og begrænsninger

### Generelle regler
- Hver kasse: **1–10 emojis**
- Kasserne har **altid forskelligt antal** (aldrig lige mange)
- Hver kasse bruger én emoji-type (men de to kasser kan have forskellige typer)
- 50/50 chance for "flest" vs. "færrest" spørgsmål
- Svaret er **et klik/tap** på den korrekte kasse — ikke et tal

### Genereringslogik

```
1. Vælg mode tilfældigt: 'most' eller 'least'
2. Vælg emoji A tilfældigt fra EMOJI_POOL
3. Vælg emoji B tilfældigt fra EMOJI_POOL (må gerne være lig A)
4. Vælg countA tilfældigt i [1, 10]
5. Vælg countB tilfældigt i [1, 10], gentag hvis countB === countA
6. correctSide = 
     mode === 'most'  → den side med Math.max(countA, countB)
     mode === 'least' → den side med Math.min(countA, countB)
```

### Garantier
- `countA !== countB` (altid et entydigt svar)
- Svaret er altid enten `'left'` eller `'right'`
- Fordelingen af korrekt-side er naturligt ~50/50 over tid (da tal genereres tilfældigt)

---

## A5. MathProblem-felter

```typescript
{
  question: string,          // "Tryk på den med FLEST!" / "Tryk på den med FÆRREST!"
  answer: -1,                // Speciel markør: svaret er ikke et tal
  difficulty: 1,
  op: '+',                   // Neutral — bruges ikke til beregning
  multiplier: 1,
  category: 'emoji-most-least',
  displayType: 'emoji-most-least',  // NY displayType → trigger klik-UI
  xpBonus: 10,
  isDecimal: false,

  // NYE felter:
  emojiChoiceData: {
    mode: 'most' | 'least',
    leftEmoji: string,       // Fx '🐟'
    rightEmoji: string,      // Fx '🦀'
    leftCount: number,       // Fx 6
    rightCount: number,      // Fx 4
    correctSide: 'left' | 'right'
  }
}
```

**`answer: -1`** er en speciel markør der signalerer at svaret ikke valideres numerisk. I stedet valideres det via `correctSide` i en ny svar-mekanisme (se A8).

---

## A6. Generator-funktion

```typescript
function generateEmojiMostLeastProblem(): MathProblem {
  // 1. Vælg mode
  const mode: 'most' | 'least' = Math.random() < 0.5 ? 'most' : 'least';

  // 2. Vælg emojis (uafhængigt — kan være ens eller forskellige)
  const leftEmoji = EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)];
  const rightEmoji = EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)];

  // 3. Generer tal (altid forskellige)
  const countA = randInt(1, 10);
  let countB = randInt(1, 10);
  while (countB === countA) {
    countB = randInt(1, 10);
  }

  // 4. Bestem korrekt side
  const correctSide: 'left' | 'right' =
    mode === 'most'
      ? (countA > countB ? 'left' : 'right')
      : (countA < countB ? 'left' : 'right');

  // 5. Byg spørgsmålstekst
  const question = mode === 'most'
    ? 'Tryk på den med FLEST!'
    : 'Tryk på den med FÆRREST!';

  return {
    question,
    answer: -1,
    difficulty: 1,
    op: '+',
    multiplier: 1,
    category: 'emoji-most-least',
    displayType: 'emoji-most-least',
    xpBonus: 10,
    isDecimal: false,
    emojiChoiceData: {
      mode,
      leftEmoji,
      rightEmoji,
      leftCount: countA,
      rightCount: countB,
      correctSide
    }
  };
}
```

---

## A7. Routing i generateMathProblem()

```
generateMathProblem(...)
│
├─ activeOps indeholder 'tenfriends'?      → ...
├─ activeOps indeholder '100friends'?      → ...
├─ activeOps indeholder 'skaeve100friends'? → ...
│
├─ mathCategory === 'emoji-most-least'?    → generateEmojiMostLeastProblem()  ← NY
├─ mathCategory === 'emoji-counting'?      → generateEmojiCountingProblem()
│  ...osv.
```

---

## A8. UI-design (MathChallenge.tsx)

### Nyt layout: displayType === 'emoji-most-least'

**Kritisk forskel:** Denne opgavetype bruger **klik-svar** i stedet for tal-input. Det kræver:

1. **Skjul numpad og inputfelt** når `displayType === 'emoji-most-least'`
2. **Vis to klikbare kasser** side om side
3. **Vis instruktionstekst** ("Tryk på den med FLEST!" / "...FÆRREST!")
4. **Håndter klik** som svar-mekanisme

```tsx
{problem.displayType === 'emoji-most-least' && problem.emojiChoiceData && (
  <div className="flex flex-col items-center gap-4 py-4">
    {/* Instruktionstekst */}
    <div className="text-center">
      <span className={`text-2xl font-bold ${
        problem.emojiChoiceData.mode === 'most' 
          ? 'text-emerald-400' 
          : 'text-amber-400'
      }`}>
        {problem.emojiChoiceData.mode === 'most' 
          ? 'Tryk på den med FLEST!' 
          : 'Tryk på den med FÆRREST!'}
      </span>
    </div>

    {/* To klikbare kasser */}
    <div className="flex items-stretch justify-center gap-6">
      {/* Venstre kasse */}
      <button
        onClick={() => handleEmojiChoice('left')}
        className="
          border-2 border-dashed border-cyan-400/50
          rounded-xl px-4 py-3
          bg-cyan-900/20
          hover:bg-cyan-800/40 hover:border-cyan-300/80
          active:scale-95
          transition-all cursor-pointer
          flex flex-wrap justify-center gap-1
          min-w-[100px] max-w-[160px]
        "
      >
        {Array.from({ length: problem.emojiChoiceData.leftCount }).map((_, i) => (
          <span key={i} className="text-2xl">
            {problem.emojiChoiceData.leftEmoji}
          </span>
        ))}
      </button>

      {/* Mellemrum / "eller" */}
      <div className="flex items-center">
        <span className="text-lg text-white/40">eller</span>
      </div>

      {/* Højre kasse */}
      <button
        onClick={() => handleEmojiChoice('right')}
        className="
          border-2 border-dashed border-cyan-400/50
          rounded-xl px-4 py-3
          bg-cyan-900/20
          hover:bg-cyan-800/40 hover:border-cyan-300/80
          active:scale-95
          transition-all cursor-pointer
          flex flex-wrap justify-center gap-1
          min-w-[100px] max-w-[160px]
        "
      >
        {Array.from({ length: problem.emojiChoiceData.rightCount }).map((_, i) => (
          <span key={i} className="text-2xl">
            {problem.emojiChoiceData.rightEmoji}
          </span>
        ))}
      </button>
    </div>
  </div>
)}
```

### Ny svar-handler

```typescript
function handleEmojiChoice(side: 'left' | 'right') {
  if (!problem?.emojiChoiceData) return;

  const isCorrect = side === problem.emojiChoiceData.correctSide;

  if (isCorrect) {
    // Samme flow som korrekt tal-svar:
    // streak++, lyd, avancér fase / finalizeCatch()
    handleCorrectAnswer();
  } else {
    // Samme flow som forkert tal-svar:
    // streak reset, -3 sek, fejl-lyd
    handleWrongAnswer();
  }
}
```

### Skjul input-elementer

Tilføj betingelse til eksisterende render-logik:

```typescript
const isClickBasedProblem = problem?.displayType === 'emoji-most-least' 
                         || problem?.displayType === 'emoji-size-compare';

// I JSX:
{!isClickBasedProblem && (
  <>
    <input ... />  {/* Tal-input */}
    {showNumberPad && <NumberPad ... />}
  </>
)}
```

---

## A9. Svar-validering

Den eksisterende `numericAnswerOk()` skal **ikke** bruges til denne opgavetype. I stedet:

```typescript
// I checkAnswer() eller tilsvarende:
if (problem.displayType === 'emoji-most-least' || 
    problem.displayType === 'emoji-size-compare') {
  // Svar valideres via handleEmojiChoice() — skip numerisk check
  return;
}

// Eksisterende numerisk validering...
```

---

## A10. Konfiguration (math-config.ts)

### FARVANDE

```typescript
FARVANDE: {
  kysten: {
    allowedCategories: [
      'basic', 'lette-historier', 'emoji-counting',
      'emoji-most-least'  // ← TILFØJET
    ],
    // ...resten uændret
  },
  // aabenhav og dybet: IKKE tilføjet (kun Kysten)
}
```

---

## A11. Indstillinger (MathSettingsScreen.tsx)

```typescript
const CATEGORY_ROWS = [
  // ...eksisterende...
  { 
    id: 'emoji-most-least', 
    label: 'Flest / færrest',
    icon: '⚖️',
    desc: 'Tryk på den rigtige kasse' 
  },
];
```

---

## A12. Types (math.ts)

```typescript
interface EmojiChoiceData {
  mode: 'most' | 'least';
  leftEmoji: string;
  rightEmoji: string;
  leftCount: number;
  rightCount: number;
  correctSide: 'left' | 'right';
}

interface MathProblem {
  // ...eksisterende felter...
  emojiChoiceData?: EmojiChoiceData;
}
```

---

## A13. Tests

```typescript
describe('emoji-most-least', () => {
  it('kasserne har altid forskelligt antal', () => {
    for (let i = 0; i < 100; i++) {
      const p = generateEmojiMostLeastProblem();
      expect(p.emojiChoiceData!.leftCount)
        .not.toBe(p.emojiChoiceData!.rightCount);
    }
  });

  it('correctSide peger på den korrekte kasse for "most"', () => {
    for (let i = 0; i < 100; i++) {
      const p = generateEmojiMostLeastProblem();
      if (p.emojiChoiceData!.mode === 'most') {
        const bigger = p.emojiChoiceData!.leftCount > p.emojiChoiceData!.rightCount 
          ? 'left' : 'right';
        expect(p.emojiChoiceData!.correctSide).toBe(bigger);
      }
    }
  });

  it('correctSide peger på den korrekte kasse for "least"', () => {
    for (let i = 0; i < 100; i++) {
      const p = generateEmojiMostLeastProblem();
      if (p.emojiChoiceData!.mode === 'least') {
        const smaller = p.emojiChoiceData!.leftCount < p.emojiChoiceData!.rightCount 
          ? 'left' : 'right';
        expect(p.emojiChoiceData!.correctSide).toBe(smaller);
      }
    }
  });

  it('begge emojis er fra EMOJI_POOL', () => {
    for (let i = 0; i < 50; i++) {
      const p = generateEmojiMostLeastProblem();
      expect(EMOJI_POOL).toContain(p.emojiChoiceData!.leftEmoji);
      expect(EMOJI_POOL).toContain(p.emojiChoiceData!.rightEmoji);
    }
  });

  it('antal er altid 1-10', () => {
    for (let i = 0; i < 100; i++) {
      const p = generateEmojiMostLeastProblem();
      expect(p.emojiChoiceData!.leftCount).toBeGreaterThanOrEqual(1);
      expect(p.emojiChoiceData!.leftCount).toBeLessThanOrEqual(10);
      expect(p.emojiChoiceData!.rightCount).toBeGreaterThanOrEqual(1);
      expect(p.emojiChoiceData!.rightCount).toBeLessThanOrEqual(10);
    }
  });

  it('mode fordeles ~50/50', () => {
    let mostCount = 0;
    for (let i = 0; i < 1000; i++) {
      const p = generateEmojiMostLeastProblem();
      if (p.emojiChoiceData!.mode === 'most') mostCount++;
    }
    expect(mostCount).toBeGreaterThan(400);
    expect(mostCount).toBeLessThan(600);
  });

  it('answer er -1 (klik-baseret)', () => {
    const p = generateEmojiMostLeastProblem();
    expect(p.answer).toBe(-1);
  });
});
```

---

## A14. Komplet checkliste

### Obligatorisk

| # | Fil | Ændring |
|---|-----|---------|
| 1 | `src/types/math.ts` | Tilføj `EmojiChoiceData` interface + `emojiChoiceData?` felt |
| 2 | `src/logic/math-engine.ts` | Tilføj `generateEmojiMostLeastProblem()` + routing |
| 3 | `src/data/math-config.ts` | Tilføj `'emoji-most-least'` til Kystens `allowedCategories` |
| 4 | `src/components/screens/MathSettingsScreen.tsx` | Tilføj til `CATEGORY_ROWS` |
| 5 | `src/components/fishing/MathChallenge.tsx` | Nyt klik-layout, skjul input/numpad, `handleEmojiChoice()` |

### Valgfrit

| # | Fil | Ændring |
|---|-----|---------|
| 6 | `tests/math-engine.test.ts` | Test-suite for emoji-most-least |
| 7 | `src/logic/game-persistence.ts` | Verificer persistence |

---
---
---

# OPGAVETYPE B: Størst / mindst (emoji-size-compare)

## B1. Koncept

Spilleren ser **to kasser** med emojis i **forskellig fysisk størrelse** og skal **trykke på den kasse** der indeholder de **største** (B1) eller **mindste** (B2) emojis. Antallet i kasserne er irrelevant — det handler udelukkende om den visuelle størrelse (CSS `font-size`) af emojien.

**Eksempel — "Tryk på den med de STØRSTE":**

```
  Tryk på de STØRSTE!

┌──────────────────┐    ┌─────────────────┐
│ 🐙 🐙 🐙        │    │  🐙    🐙       │
│  (normal)        │    │  (STOR)         │
└──────────────────┘    └─────────────────┘
                               ✅
```

Spilleren trykker på højre kasse → korrekt! (emojierne er fysisk større)

---

## B2. Farvand og indstillinger

| Parameter | Værdi |
|-----------|-------|
| Farvand | 🏖️ Kysten (0.–3. klasse) |
| Kategori-ID | `emoji-size-compare` |
| Sværhedsgrad | Kun "begynder" — `intermediate` og `expert` mapper begge til begynder |
| Eksklusiv? | Nej — kategori-baseret |
| Special-operator? | Nej |

---

## B3. Emoji-pool

Samme pool som de øvrige emoji-opgavetyper (se EMOJI_POOL i opgavetype A).

**Vigtigt:** Begge kasser bruger **samme emoji** — ellers ville det være uklart om man sammenligner størrelse eller type. Kun skaleringen (font-size) er forskellig.

---

## B4. Størrelses-trin

Tre faste størrelsestrin sikrer en tydelig visuel forskel:

```typescript
const EMOJI_SIZES = {
  small:  { fontSize: '1.2rem', label: 'lille' },   // ~19px
  medium: { fontSize: '2rem',   label: 'mellem' },  // ~32px — standard
  large:  { fontSize: '3.2rem', label: 'stor' },    // ~51px
};
```

**Regler for størrelses-par:**

| Venstre kasse | Højre kasse | Gyldig? | Begrundelse |
|---------------|-------------|---------|-------------|
| small | medium | ✅ | Tydelig forskel |
| small | large | ✅ | Meget tydelig forskel |
| medium | large | ✅ | Tydelig forskel |
| small | small | ❌ | Ingen forskel |
| medium | medium | ❌ | Ingen forskel |
| large | large | ❌ | Ingen forskel |

De to kasser har altid **forskellig størrelse**. Alle 6 gyldige kombinationer (3 par × 2 retninger) er lige sandsynlige.

---

## B5. Antal emojis per kasse

For at undgå at spilleren bare tæller og dermed forveksler "størst" med "flest", bruges en **bevidst modsat-strategi** for antallet:

```
- Den kasse med de STORE emojis har FÆRRE emojis (1–3 stk)
- Den kasse med de SMÅ emojis har FLERE emojis (4–7 stk)
- Den mellemstore kasse har et mellemtal (2–5 stk)
```

Dette er kernen i den pædagogiske værdi: barnet skal vurdere **størrelse**, ikke **antal**. Hvis den "store" kasse også havde flest emojis, ville opgaven være triviel.

```typescript
function getCountForSize(size: 'small' | 'medium' | 'large'): number {
  switch (size) {
    case 'small':  return randInt(4, 7);  // Mange små
    case 'medium': return randInt(2, 5);  // Mellem
    case 'large':  return randInt(1, 3);  // Få store
  }
}
```

---

## B6. MathProblem-felter

```typescript
{
  question: string,          // "Tryk på de STØRSTE!" / "Tryk på de MINDSTE!"
  answer: -1,                // Klik-baseret
  difficulty: 1,
  op: '+',
  multiplier: 1,
  category: 'emoji-size-compare',
  displayType: 'emoji-size-compare',  // NY displayType
  xpBonus: 10,
  isDecimal: false,

  // NYE felter:
  emojiSizeData: {
    mode: 'biggest' | 'smallest',
    emoji: string,                      // Samme emoji i begge kasser
    leftSize: 'small' | 'medium' | 'large',
    rightSize: 'small' | 'medium' | 'large',
    leftCount: number,
    rightCount: number,
    correctSide: 'left' | 'right'
  }
}
```

---

## B7. Generator-funktion

```typescript
type EmojiSizeLevel = 'small' | 'medium' | 'large';

const SIZE_PAIRS: [EmojiSizeLevel, EmojiSizeLevel][] = [
  ['small', 'medium'],
  ['small', 'large'],
  ['medium', 'large'],
];

function generateEmojiSizeCompareProblem(): MathProblem {
  // 1. Vælg mode
  const mode: 'biggest' | 'smallest' = Math.random() < 0.5 ? 'biggest' : 'smallest';

  // 2. Vælg emoji (samme i begge kasser)
  const emoji = EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)];

  // 3. Vælg størrelsespar og fordel tilfældigt på venstre/højre
  const pair = SIZE_PAIRS[Math.floor(Math.random() * SIZE_PAIRS.length)];
  const swapped = Math.random() < 0.5;
  const leftSize: EmojiSizeLevel = swapped ? pair[1] : pair[0];
  const rightSize: EmojiSizeLevel = swapped ? pair[0] : pair[1];

  // 4. Generer antal baseret på størrelse (modsat-strategi)
  const leftCount = getCountForSize(leftSize);
  const rightCount = getCountForSize(rightSize);

  // 5. Bestem korrekt side
  const sizeRank = { small: 1, medium: 2, large: 3 };
  const correctSide: 'left' | 'right' =
    mode === 'biggest'
      ? (sizeRank[leftSize] > sizeRank[rightSize] ? 'left' : 'right')
      : (sizeRank[leftSize] < sizeRank[rightSize] ? 'left' : 'right');

  // 6. Byg spørgsmålstekst
  const question = mode === 'biggest'
    ? 'Tryk på de STØRSTE!'
    : 'Tryk på de MINDSTE!';

  return {
    question,
    answer: -1,
    difficulty: 1,
    op: '+',
    multiplier: 1,
    category: 'emoji-size-compare',
    displayType: 'emoji-size-compare',
    xpBonus: 10,
    isDecimal: false,
    emojiSizeData: {
      mode,
      emoji,
      leftSize,
      rightSize,
      leftCount,
      rightCount,
      correctSide
    }
  };
}

function getCountForSize(size: EmojiSizeLevel): number {
  switch (size) {
    case 'small':  return randInt(4, 7);
    case 'medium': return randInt(2, 5);
    case 'large':  return randInt(1, 3);
  }
}
```

---

## B8. Routing i generateMathProblem()

```
generateMathProblem(...)
│
├─ ...special-ops...
│
├─ mathCategory === 'emoji-most-least'?    → generateEmojiMostLeastProblem()
├─ mathCategory === 'emoji-size-compare'?  → generateEmojiSizeCompareProblem()  ← NY
├─ mathCategory === 'emoji-counting'?      → generateEmojiCountingProblem()
│  ...osv.
```

---

## B9. UI-design (MathChallenge.tsx)

### Nyt layout: displayType === 'emoji-size-compare'

Meget lig opgavetype A, men med **variabel font-size** på emojierne:

```tsx
{problem.displayType === 'emoji-size-compare' && problem.emojiSizeData && (
  <div className="flex flex-col items-center gap-4 py-4">
    {/* Instruktionstekst */}
    <div className="text-center">
      <span className={`text-2xl font-bold ${
        problem.emojiSizeData.mode === 'biggest' 
          ? 'text-emerald-400' 
          : 'text-amber-400'
      }`}>
        {problem.emojiSizeData.mode === 'biggest' 
          ? '🔍 Tryk på de STØRSTE!' 
          : '🔍 Tryk på de MINDSTE!'}
      </span>
    </div>

    {/* To klikbare kasser */}
    <div className="flex items-stretch justify-center gap-6">
      {/* Venstre kasse */}
      <button
        onClick={() => handleEmojiChoice('left')}
        className="
          border-2 border-dashed border-purple-400/50
          rounded-xl px-4 py-3
          bg-purple-900/20
          hover:bg-purple-800/40 hover:border-purple-300/80
          active:scale-95
          transition-all cursor-pointer
          flex flex-wrap justify-center items-center gap-1
          min-w-[100px] max-w-[180px]
        "
      >
        {Array.from({ length: problem.emojiSizeData.leftCount }).map((_, i) => (
          <span 
            key={i} 
            style={{ fontSize: EMOJI_SIZES[problem.emojiSizeData.leftSize].fontSize }}
          >
            {problem.emojiSizeData.emoji}
          </span>
        ))}
      </button>

      {/* Mellemrum */}
      <div className="flex items-center">
        <span className="text-lg text-white/40">eller</span>
      </div>

      {/* Højre kasse */}
      <button
        onClick={() => handleEmojiChoice('right')}
        className="
          border-2 border-dashed border-purple-400/50
          rounded-xl px-4 py-3
          bg-purple-900/20
          hover:bg-purple-800/40 hover:border-purple-300/80
          active:scale-95
          transition-all cursor-pointer
          flex flex-wrap justify-center items-center gap-1
          min-w-[100px] max-w-[180px]
        "
      >
        {Array.from({ length: problem.emojiSizeData.rightCount }).map((_, i) => (
          <span 
            key={i} 
            style={{ fontSize: EMOJI_SIZES[problem.emojiSizeData.rightSize].fontSize }}
          >
            {problem.emojiSizeData.emoji}
          </span>
        ))}
      </button>
    </div>
  </div>
)}
```

### Svar-handler

Nøjagtig samme `handleEmojiChoice()` som opgavetype A — den kigger på `emojiChoiceData` eller `emojiSizeData`:

```typescript
function handleEmojiChoice(side: 'left' | 'right') {
  const choiceData = problem?.emojiChoiceData || problem?.emojiSizeData;
  if (!choiceData) return;

  const isCorrect = side === choiceData.correctSide;

  if (isCorrect) {
    handleCorrectAnswer();
  } else {
    handleWrongAnswer();
  }
}
```

### Skjul input-elementer

Opdater den eksisterende betingelse:

```typescript
const isClickBasedProblem = problem?.displayType === 'emoji-most-least'
                         || problem?.displayType === 'emoji-size-compare';
```

---

## B10. Konfiguration (math-config.ts)

### FARVANDE

```typescript
FARVANDE: {
  kysten: {
    allowedCategories: [
      'basic', 'lette-historier', 'emoji-counting',
      'emoji-most-least', 'emoji-size-compare'  // ← TILFØJET
    ],
  },
}
```

---

## B11. Indstillinger (MathSettingsScreen.tsx)

```typescript
const CATEGORY_ROWS = [
  // ...eksisterende...
  { 
    id: 'emoji-size-compare', 
    label: '🔍 Størst / mindst', 
    desc: 'Tryk på de store eller små' 
  },
];
```

---

## B12. Types (math.ts)

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

interface MathProblem {
  // ...eksisterende felter...
  emojiSizeData?: EmojiSizeData;
}
```

---

## B13. Tests

```typescript
describe('emoji-size-compare', () => {
  it('kasserne har altid forskellig størrelse', () => {
    for (let i = 0; i < 100; i++) {
      const p = generateEmojiSizeCompareProblem();
      expect(p.emojiSizeData!.leftSize)
        .not.toBe(p.emojiSizeData!.rightSize);
    }
  });

  it('correctSide peger på størst for "biggest"', () => {
    const rank = { small: 1, medium: 2, large: 3 };
    for (let i = 0; i < 100; i++) {
      const p = generateEmojiSizeCompareProblem();
      if (p.emojiSizeData!.mode === 'biggest') {
        const biggerSide = rank[p.emojiSizeData!.leftSize] > rank[p.emojiSizeData!.rightSize]
          ? 'left' : 'right';
        expect(p.emojiSizeData!.correctSide).toBe(biggerSide);
      }
    }
  });

  it('correctSide peger på mindst for "smallest"', () => {
    const rank = { small: 1, medium: 2, large: 3 };
    for (let i = 0; i < 100; i++) {
      const p = generateEmojiSizeCompareProblem();
      if (p.emojiSizeData!.mode === 'smallest') {
        const smallerSide = rank[p.emojiSizeData!.leftSize] < rank[p.emojiSizeData!.rightSize]
          ? 'left' : 'right';
        expect(p.emojiSizeData!.correctSide).toBe(smallerSide);
      }
    }
  });

  it('store emojis har få stk, små har mange (modsat-strategi)', () => {
    for (let i = 0; i < 100; i++) {
      const p = generateEmojiSizeCompareProblem();
      const d = p.emojiSizeData!;
      
      if (d.leftSize === 'large') {
        expect(d.leftCount).toBeLessThanOrEqual(3);
      }
      if (d.leftSize === 'small') {
        expect(d.leftCount).toBeGreaterThanOrEqual(4);
      }
      if (d.rightSize === 'large') {
        expect(d.rightCount).toBeLessThanOrEqual(3);
      }
      if (d.rightSize === 'small') {
        expect(d.rightCount).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it('begge kasser bruger samme emoji', () => {
    for (let i = 0; i < 50; i++) {
      const p = generateEmojiSizeCompareProblem();
      // Kun én emoji i emojiSizeData — begge kasser bruger den
      expect(EMOJI_POOL).toContain(p.emojiSizeData!.emoji);
    }
  });

  it('answer er -1 (klik-baseret)', () => {
    const p = generateEmojiSizeCompareProblem();
    expect(p.answer).toBe(-1);
  });

  it('mode fordeles ~50/50', () => {
    let biggestCount = 0;
    for (let i = 0; i < 1000; i++) {
      const p = generateEmojiSizeCompareProblem();
      if (p.emojiSizeData!.mode === 'biggest') biggestCount++;
    }
    expect(biggestCount).toBeGreaterThan(400);
    expect(biggestCount).toBeLessThan(600);
  });
});
```

---

## B14. Komplet checkliste

### Obligatorisk

| # | Fil | Ændring |
|---|-----|---------|
| 1 | `src/types/math.ts` | Tilføj `EmojiSizeData` interface + `emojiSizeData?` felt |
| 2 | `src/logic/math-engine.ts` | Tilføj `EMOJI_SIZES`, `SIZE_PAIRS`, `getCountForSize()`, `generateEmojiSizeCompareProblem()` + routing |
| 3 | `src/data/math-config.ts` | Tilføj `'emoji-size-compare'` til Kystens `allowedCategories` |
| 4 | `src/components/screens/MathSettingsScreen.tsx` | Tilføj til `CATEGORY_ROWS` |
| 5 | `src/components/fishing/MathChallenge.tsx` | Nyt størrelsesbaseret klik-layout med variabel `fontSize` |

### Valgfrit

| # | Fil | Ændring |
|---|-----|---------|
| 6 | `tests/math-engine.test.ts` | Test-suite for emoji-size-compare |
| 7 | `src/logic/game-persistence.ts` | Verificer persistence |

---
---

# Fælles implementeringsnoter

## Delt kode mellem opgavetype A og B

De to opgavetyper deler:
- `EMOJI_POOL` (allerede defineret for emoji-counting)
- `handleEmojiChoice()` — fælles svar-handler
- `isClickBasedProblem` — fælles input-skjul-logik
- `answer: -1` konventionen for klik-baserede opgaver

## Rækkefølge for implementering

Opgavetype A (flest/færrest) er **simplere** og bør implementeres først, da den etablerer:
1. Den nye klik-baserede svar-mekanisme
2. Input/numpad-skjul-logikken
3. `answer: -1` konventionen

Opgavetype B bygger ovenpå det og tilføjer kun størrelses-skalering.

## Kompatibilitet med boss-kampe

Begge opgavetyper fungerer med multi-fase boss-kampe: hvert korrekt klik avancerer fasen, og forkert klik trækker 3 sekunder. Ingen ændringer nødvendige i boss-logikken, så længe `handleCorrectAnswer()` og `handleWrongAnswer()` bruges.

## Kompatibilitet med zen-mode

I zen-mode (ingen timer) fungerer opgavetyperne normalt. "Vis svar"-knappen kan enten:
- Fremhæve den korrekte kasse visuelt (anbefalet), eller
- Falde tilbage til at vise en tekst som "Svar: venstre kasse"

## Streak og speed-solve

Klik-svar tæller med i streak og speed-solve-beregninger præcis som tal-svar. Intet nyt state kræves.
