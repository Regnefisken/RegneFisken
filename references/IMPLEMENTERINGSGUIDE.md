# Implementeringsguide: Nye regnearter til Regnefisken

Denne guide er skrevet til en AI-agent (Cursor Composer) og indeholder praecise instruktioner for alle aendringer. Udfoer aendringerne i den angivne raekkefoelge. Hver opgave angiver praecis hvilke filer der skal aendres, hvad der skal tilfojes, og hvordan det skal haenge sammen med resten af systemet.

**Vigtigt:**
- Laes altid den eksisterende kode i de naevnte filer foer du redigerer. Bevar det eksisterende kodeformat og stil. Alle nye funktioner skal exporteres.
- **Sproget er dansk.** Alle brugersynlige strenge (labels, beskrivelser, spoergsmaalstekster, abe-hints, UI-tekster) skal skrives paa dansk med æ, ø og å. Kodeblokke i denne guide indeholder allerede korrekt dansk tekst — brug dem direkte.

---

## Opgave 0: Forstaa systemet

Laes disse filer grundigt foer du begynder:

- `src/types/math.ts` — alle TypeScript-typer
- `src/data/math-config.ts` — MATH_TYPE_DEFS, FARVANDE, templates
- `src/logic/math-engine.ts` — alle generatorer og `generateForMathType()` dispatch
- `src/components/fishing/MathChallenge.tsx` — UI, abe-hint, numpad
- `src/components/mobile/NumberPad.tsx` — numpad med showDecimal prop
- `src/store/useMathStore.ts` — Zustand state (alle matematik-indstillinger)
- `src/components/screens/MathSettingsScreen.tsx` — settings UI med fanen "Avanceret"

**Arkitektur-oversigt:**

1. En regneart defineres i `MATH_TYPE_DEFS` (id, label, icon, desc, gruppe)
2. Den tilfojes til de relevante farvandeS `allowedMathTypes` i `FARVANDE`
3. En generator-funktion oprettes i `math-engine.ts`
4. Generatoren registreres i `generateForMathType()` dispatch-funktionen
5. Evt. badge-label tilfojes i `MathChallenge.tsx`s `problemTypeBadgeLabel()`
6. Evt. nye TypeScript-typer tilfojes i `math.ts` og felter paa `MathProblem`

---

## Opgave 1: Decimalseparator-indstilling (komma som standard)

Spillet skal bruge **komma** som decimalseparator overalt (dansk konvention). Under "Avanceret"-fanen i matematik-indstillingerne skal man kunne vaelge punktum i stedet.

Indstillingen paavirker tre ting:
- Spoergsmaalstekster: "2,5 + 1,3" (ikke "2.5 + 1.3")
- NumberPad-tasten: viser `,` eller `.`
- Abe-hint: viser svaret med korrekt separator

Svar-validering (`numericAnswerOk`) accepterer allerede baade komma og punktum — den linje skal IKKE aendres.

### 1A. Store

**Fil: `src/store/useMathStore.ts`**

Tilfoej nyt felt i `MathState`-interfacet (linje ~4-18):

```ts
decimalSeparator: ',' | '.';
```

Tilfoej setter i interfacet:

```ts
setDecimalSeparator: (v: ',' | '.') => void;
```

Tilfoej default-vaerdi i `create<MathState>` (linje ~46-63):

```ts
decimalSeparator: ',',
```

Tilfoej setter-implementering (linje ~64-80):

```ts
setDecimalSeparator: (decimalSeparator) => set({ decimalSeparator }),
```

### 1B. Hjælpefunktion til formatering

**Fil: `src/logic/math-engine.ts`**

Tilfoej denne eksporterede funktion oeverst i filen (efter imports, foer EMOJI_POOL):

```ts
/**
 * Formaterer et tal med den valgte decimalseparator.
 * Bruges i spoergsmaalstekster og abe-hints.
 */
export function formatDecimal(n: number, separator: ',' | '.'): string {
  const s = String(n);
  return separator === ',' ? s.replace('.', ',') : s;
}
```

### 1C. Brug i eksisterende decimal-generator

**Fil: `src/logic/math-engine.ts`**

Den eksisterende `generateDecimalProblem()` (linje ~924) bruger template literals med JS-tal, som giver punktum. Funktionen skal nu modtage separatoren og bruge `formatDecimal`.

Aendr signaturen:

```ts
export function generateDecimalProblem(mathDifficulty: MathDifficulty, separator: ',' | '.' = ','): MathProblem {
```

Aendr spoergsmaalstekst-opbygningen. I addition-grenen (linje ~933):

```ts
question: `${formatDecimal(a, separator)} ${isAdd ? '+' : '−'} ${formatDecimal(b, separator)}`,
```

I subtraktions-grenen (linje ~946):

```ts
question: `${formatDecimal(big, separator)} − ${formatDecimal(small, separator)}`,
```

### 1D. Gennemfør separator i dispatch

**Fil: `src/logic/math-engine.ts`**

`generateForMathType()` og `generateMathProblem()` skal modtage separatoren og videregive den til generatorer der producerer decimaltal i spoergsmaalstekster.

Aendr `generateForMathType` signaturen (linje ~998):

```ts
function generateForMathType(
  type: string,
  mathDifficulty: MathDifficulty,
  selectedFarvand: FarvandId,
  typeOps: Record<string, string[]>,
  fv: FarvandDef,
  difficultyNum: number,
  separator: ',' | '.' = ','
): MathProblem | null {
```

Aendr kaldet til `generateDecimalProblem` (linje ~1015):

```ts
if (type === 'decimals') return generateDecimalProblem(mathDifficulty, separator);
```

Aendr `generateMathProblem` signaturen (linje ~1040):

```ts
export function generateMathProblem(
  activeMathTypes: string[],
  mathDifficulty: MathDifficulty,
  selectedFarvand: FarvandId,
  typeOps: Record<string, string[]>,
  separator: ',' | '.' = ','
): MathProblem {
```

Aendr kaldet til `generateForMathType` inde i `generateMathProblem` (linje ~1054):

```ts
const p = generateForMathType(mathType, mathDifficulty, selectedFarvand, typeOps, fv, difficultyNum, separator);
```

### 1E. Send separator fra UI til generator

**Fil: `src/components/fishing/MathChallenge.tsx`**

Find hvor `generateMathProblem` kaldes. Tilfoej `decimalSeparator` fra storen som ekstra argument:

```ts
const decimalSeparator = useMathStore((s) => s.decimalSeparator);
```

Og i kaldet til `generateMathProblem(...)`, tilfoej `decimalSeparator` som sidste argument.

**VIGTIG:** Soeg i hele MathChallenge.tsx efter alle steder `generateMathProblem` kaldes — der kan vaere flere (f.eks. ved ny opgave efter korrekt svar, ved boss-fight faser, osv.). Alle kald skal have separator-argumentet.

### 1F. NumberPad viser separator

**Fil: `src/components/fishing/MathChallenge.tsx`**

Find NumberPad-kaldene (~linje 1624-1630). Tilfoej en ny prop `decimalKey`:

```tsx
<NumberPad
  onDigit={(d) => setUserAnswer((a) => `${a}${d}`)}
  onBackspace={() => setUserAnswer((a) => a.slice(0, -1))}
  onSubmit={() => checkAnswer()}
  showDecimal={problem?.isDecimal === true}
  showMinus={selectedFarvand === 'dybet'}
  decimalKey={decimalSeparator}
/>
```

**Fil: `src/components/mobile/NumberPad.tsx`**

Tilfoej ny prop:

```ts
type NumberPadProps = {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  showDecimal?: boolean;
  showMinus?: boolean;
  /** Hvilket tegn decimal-tasten viser og sender. Default ',' */
  decimalKey?: ',' | '.';
};
```

Opdater default-vaerdi og brug:

```ts
export function NumberPad({ onDigit, onBackspace, onSubmit, showDecimal = false, showMinus = false, decimalKey = ',' }: NumberPadProps) {
```

Aendr linje 16 fra:

```ts
showDecimal ? '.' : null,
```

til:

```ts
showDecimal ? decimalKey : null,
```

### 1G. Abe-hint med korrekt separator

**Fil: `src/components/fishing/MathChallenge.tsx`**

I `getMonkeyHint()`-funktionen (som vi opretter i opgave 2), naar `p.answer !== -1` og `p.isDecimal`:

```ts
if (p.answer !== -1) {
  const val = p.isDecimal
    ? formatDecimal(p.answer, decimalSeparator)
    : String(p.answer);
  return { prefix: 'Svaret er ', value: val, suffix: '!' };
}
```

Her skal `decimalSeparator` vaere tilgaengelig. Loes det enten ved at:
- Importere `formatDecimal` fra `math-engine` og lade `getMonkeyHint` tage separatoren som parameter: `getMonkeyHint(problem, decimalSeparator)`
- Eller laese storen direkte i funktionen

Anbefalng: giv den som parameter.

### 1H. Settings-UI toggle

**Fil: `src/components/screens/MathSettingsScreen.tsx`**

I fanen "Avanceret" (`mathSettingsTab === 'more'`, linje ~529), tilfoej en ny sektion **efter** den eksisterende numpad-toggle (efter `</div>` paa linje ~566, foer den afsluttende `</div>` for hele more-panelet):

```tsx
{/* ── Decimalseparator ── */}
<h3 className="mt-8 mb-4 text-sm font-black tracking-widest text-slate-400 uppercase">
  🔢 Decimaltegn
</h3>
<div className="flex items-center justify-between rounded-3xl border border-slate-700 bg-slate-800/70 p-5">
  <div className="flex items-center gap-4">
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 text-3xl">
      {decimalSeparator === ',' ? ',' : '.'}
    </div>
    <div>
      <div className="text-lg font-bold text-white">
        {decimalSeparator === ',' ? 'Komma (dansk)' : 'Punktum (engelsk)'}
      </div>
      <div className="text-sm text-slate-400">
        Bruges i opgaver og paa numpad
      </div>
    </div>
  </div>
  <button
    type="button"
    onClick={() => {
      play('ui');
      setDecimalSeparator(decimalSeparator === ',' ? '.' : ',');
    }}
    className={`relative h-9 w-16 rounded-full transition-all ${decimalSeparator === '.' ? 'bg-amber-500' : 'bg-slate-600'}`}
  >
    <div
      className={`absolute top-0.5 left-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-black shadow-md transition-all ${decimalSeparator === '.' ? 'translate-x-7' : ''}`}
    >
      {decimalSeparator === ',' ? ',' : '.'}
    </div>
  </button>
</div>
<div
  className="mt-3 rounded-xl border border-slate-600/40 px-3 py-2 text-xs font-bold text-slate-400"
  style={{ background: 'rgba(15,23,42,0.6)' }}
>
  💡 Standard er komma. Skift til punktum hvis du foretraekker international notation.
</div>
```

Husk at laese storen oevrst i komponenten:

```ts
const decimalSeparator = useMathStore((s) => s.decimalSeparator);
const setDecimalSeparator = useMathStore((s) => s.setDecimalSeparator);
```

Opdater ogsaa den eksisterende hint-tekst (~linje 565) fra:

```
💡 Numpad inkluderer C, − og . knapper. Minus og komma er kun synlige i Dybet-farvandet.
```

til:

```
💡 Numpad inkluderer C og − knapper. Decimaltast og minus vises kun ved relevante opgavetyper.
```

---

## Opgave 2: Fiks abe-hint for vaelg-opgaver

### Fil: `src/components/fishing/MathChallenge.tsx`

Find linje ~1367-1381 (abe-hint boble-indhold). Den eksisterende kode er:

```tsx
{showMonkeyBubble && problem && (
  <div className="speech-bubble-monkey">
    {problem.answer === -1 ? (
      <>
        Ooo aah! Tryk på den rigtige kasse!{' '}
        <span className="ml-1 text-2xl leading-none">🐒</span>
      </>
    ) : (
      <>
        Ooo aah! Svaret er{' '}
        <span className="text-lg font-black text-[#b45309]">{problem.answer}</span>!{' '}
        <span className="ml-1 text-2xl leading-none">🐒</span>
      </>
    )}
  </div>
)}
```

Erstat **hele blokken** med:

```tsx
{showMonkeyBubble && problem && (
  <div className="speech-bubble-monkey">
    {(() => {
      const hint = getMonkeyHint(problem, decimalSeparator);
      if (hint === null) {
        return (
          <>
            Ooo aah! Den er for svær for mig, min ven!{' '}
            <span className="ml-1 text-2xl leading-none">🐒</span>
          </>
        );
      }
      return (
        <>
          Ooo aah! {hint.prefix}
          <span className="text-lg font-black text-[#b45309]">{hint.value}</span>
          {hint.suffix}{' '}
          <span className="ml-1 text-2xl leading-none">🐒</span>
        </>
      );
    })()}
  </div>
)}
```

Tilfoej denne hjaelpefunktion **over** `MathChallenge`-komponenten (f.eks. lige efter `numericAnswerOk`-funktionen, omkring linje 651). Importer `formatDecimal` fra `../../logic/math-engine`:

```tsx
import { formatDecimal } from '../../logic/math-engine';
```

```tsx
function getMonkeyHint(
  p: MathProblem,
  separator: ',' | '.'
): { prefix: string; value: string; suffix: string } | null {
  // Standard numerisk svar
  if (p.answer !== -1) {
    const val = p.isDecimal ? formatDecimal(p.answer, separator) : String(p.answer);
    return { prefix: 'Svaret er ', value: val, suffix: '!' };
  }

  // emoji-most-least
  if (p.emojiChoiceData) {
    const side = p.emojiChoiceData.correctSide === 'left' ? 'den til venstre' : 'den til højre';
    return { prefix: 'Det er ', value: side, suffix: '!' };
  }

  // emoji-size-compare
  if (p.emojiSizeData) {
    const side = p.emojiSizeData.correctSide === 'left' ? 'den til venstre' : 'den til højre';
    return { prefix: 'Det er ', value: side, suffix: '!' };
  }

  // emoji-even-odd
  if (p.emojiEvenOddData) {
    return { prefix: 'Det er ', value: p.emojiEvenOddData.isEven ? 'lige' : 'ulige', suffix: '!' };
  }

  // emoji-pattern
  if (p.emojiPatternData) {
    return { prefix: 'Det er ', value: p.emojiPatternData.correctNext, suffix: '!' };
  }

  // emoji-fraction
  if (p.emojiFractionData) {
    return { prefix: 'Det er ', value: p.emojiFractionData.correctFraction, suffix: '!' };
  }

  // fraction-decimal (multiple choice) — tilfojes i opgave 6
  if ((p as any).fractionDecimalData?.choices) {
    return { prefix: 'Det er ', value: (p as any).fractionDecimalData.fraction, suffix: '!' };
  }

  // emoji-sort — for svær at forklare i tekst
  if (p.emojiSortData) {
    return null;
  }

  // Fallback
  return null;
}
```

**Note:** `(p as any).fractionDecimalData` bruges midlertidigt foer typen er tilfojet i opgave 6. Naar opgave 6 er udfoert, fjern `as any`.

---

## Opgave 3: Implementer Afrunding

### 3A. Type-definition

**Fil: `src/types/math.ts`**

Ingen nye typer noedvendige. Afrunding bruger standard `MathProblem` med `question` (tekst), `answer` (heltal) og `displayType: 'text'`.

### 3B. Registrer regnearten

**Fil: `src/data/math-config.ts`**

Tilfoej i `MATH_TYPE_DEFS`-arrayet (efter `skaeve100friends`-objektet, dvs. efter linje ~53):

```ts
{
  id: 'afrunding',
  label: 'Afrunding',
  icon: '🎯',
  desc: 'Afrund til nærmeste 10, 100 eller 1.000',
  group: 'talforståelse',
  supportsOps: false,
},
```

Tilfoej `'afrunding'` til **kun** `aabenhav.allowedMathTypes` (linje ~201-213) og `dybet.allowedMathTypes` (linje ~224). **IKKE** kysten. Placer den efter de eksisterende talforstaelse-typer.

### 3C. Generator

**Fil: `src/logic/math-engine.ts`**

Tilfoej denne funktion (f.eks. efter `generateSkaeve100FriendsQuestion` omkring linje 833):

```ts
export function generateAfrundingProblem(mathDifficulty: MathDifficulty): MathProblem {
  let tal: number;
  let rundTil: number;
  let rundTilLabel: string;

  if (mathDifficulty === 'beginner') {
    tal = randInt(11, 99);
    rundTil = 10;
    rundTilLabel = 'tier';
  } else if (mathDifficulty === 'intermediate') {
    const use100 = Math.random() < 0.5;
    if (use100) {
      tal = randInt(101, 999);
      rundTil = 100;
      rundTilLabel = 'hundrede';
    } else {
      tal = randInt(101, 999);
      rundTil = 10;
      rundTilLabel = 'tier';
    }
  } else {
    const use1000 = Math.random() < 0.5;
    if (use1000) {
      tal = randInt(1001, 9999);
      rundTil = 1000;
      rundTilLabel = 'tusinde';
    } else {
      tal = randInt(1001, 9999);
      rundTil = 100;
      rundTilLabel = 'hundrede';
    }
  }

  const answer = Math.round(tal / rundTil) * rundTil;

  return {
    question: `Afrund ${tal} til nærmeste ${rundTilLabel}`,
    answer,
    difficulty: mathDifficulty === 'beginner' ? 1 : mathDifficulty === 'intermediate' ? 2 : 3,
    op: 'afrunding',
    category: 'afrunding',
    displayType: 'text',
  };
}
```

### 3D. Dispatch

I `generateForMathType()`, tilfoej **foer** `return null`:

```ts
if (type === 'afrunding') return generateAfrundingProblem(mathDifficulty);
```

### 3E. Badge

**Fil: `src/components/fishing/MathChallenge.tsx`**

I `problemTypeBadgeLabel()` (starter linje ~36), tilfoej en case:

```ts
case 'afrunding':
  return '🎯 Afrunding';
```

---

## Opgave 4: Implementer Procent <-> Decimal

### 4A. Registrer regnearten

**Fil: `src/data/math-config.ts`**

Tilfoej i `MATH_TYPE_DEFS` (i gruppen `speciale`, efter `decimals`):

```ts
{
  id: 'percent-decimal',
  label: 'Procent ↔ Decimal',
  icon: '%',
  desc: 'Omskriv mellem procent og decimaltal',
  group: 'speciale',
  supportsOps: false,
},
```

Tilfoej `'percent-decimal'` til `aabenhav.allowedMathTypes` og `dybet.allowedMathTypes`.

### 4B. Generator

**Fil: `src/logic/math-engine.ts`**

```ts
export function generatePercentDecimalProblem(
  mathDifficulty: MathDifficulty,
  separator: ',' | '.' = ','
): MathProblem {
  let percent: number;

  if (mathDifficulty === 'beginner') {
    const easy = [10, 25, 50, 75, 100];
    percent = easy[Math.floor(Math.random() * easy.length)]!;
  } else if (mathDifficulty === 'intermediate') {
    percent = randInt(1, 19) * 5;
  } else {
    percent = randInt(1, 99);
  }

  const decimal = percent / 100;
  const direction = Math.random() < 0.5 ? 'percent-to-decimal' : 'decimal-to-percent';

  if (direction === 'percent-to-decimal') {
    return {
      question: `${percent}% = ?`,
      answer: decimal,
      difficulty: mathDifficulty === 'beginner' ? 1 : mathDifficulty === 'intermediate' ? 2 : 3,
      op: 'percent-decimal',
      category: 'percent-decimal',
      displayType: 'text',
      isDecimal: true,
    };
  } else {
    const decimalStr = formatDecimal(decimal, separator);
    return {
      question: `${decimalStr} = ?%`,
      answer: percent,
      difficulty: mathDifficulty === 'beginner' ? 1 : mathDifficulty === 'intermediate' ? 2 : 3,
      op: 'percent-decimal',
      category: 'percent-decimal',
      displayType: 'text',
      isDecimal: false,
    };
  }
}
```

### 4C. Dispatch

I `generateForMathType()`:

```ts
if (type === 'percent-decimal') return generatePercentDecimalProblem(mathDifficulty, separator);
```

### 4D. Badge

I `problemTypeBadgeLabel()`:

```ts
case 'percent-decimal':
  return '% Procent ↔ Decimal';
```

---

## Opgave 5: Aktiver Decimalregning paa mellemtrin

### Fil: `src/data/math-config.ts`

Tilfoej `'decimals'` til `aabenhav.allowedMathTypes` (linje ~201-213). Placer det efter `'multi-term'`.

Det er hele aendringen — generatoren skalerer allerede via svaerhedsgrad, og separator-support blev tilfojet i opgave 1C.

---

## Opgave 6: Implementer Broek <-> Decimal

### 6A. Type-definition

**Fil: `src/types/math.ts`**

Tilfoej nyt interface:

```ts
/** Brøk <-> decimal (multiple choice naar svaret er en brøk) */
export interface FractionDecimalData {
  direction: 'fraction-to-decimal' | 'decimal-to-fraction';
  fraction: string;
  decimal: number;
  choices?: string[];
}
```

Tilfoej felt paa `MathProblem` (efter de eksisterende emoji-felter):

```ts
fractionDecimalData?: FractionDecimalData;
```

Naar dette er gjort, fjern `as any` casts i `getMonkeyHint()` (opgave 2) og tilfoej `FractionDecimalData` til importen i MathChallenge.tsx.

### 6B. Registrer regnearten

**Fil: `src/data/math-config.ts`**

Tilfoej i `MATH_TYPE_DEFS` (i gruppen `speciale`):

```ts
{
  id: 'fraction-decimal',
  label: 'Brøk ↔ Decimal',
  icon: '🔢',
  desc: 'Omskriv mellem brøk og decimaltal',
  group: 'speciale',
  supportsOps: false,
},
```

Tilfoej `'fraction-decimal'` til `aabenhav.allowedMathTypes` og `dybet.allowedMathTypes`.

### 6C. Generator

**Fil: `src/logic/math-engine.ts`**

Tilfoej konstanten og funktionen:

```ts
const FRACTION_DECIMAL_PAIRS: { fraction: string; decimal: number }[] = [
  { fraction: '1/2', decimal: 0.5 },
  { fraction: '1/4', decimal: 0.25 },
  { fraction: '3/4', decimal: 0.75 },
  { fraction: '1/10', decimal: 0.1 },
  { fraction: '1/5', decimal: 0.2 },
  { fraction: '2/5', decimal: 0.4 },
  { fraction: '3/5', decimal: 0.6 },
  { fraction: '4/5', decimal: 0.8 },
  { fraction: '1/8', decimal: 0.125 },
  { fraction: '3/8', decimal: 0.375 },
  { fraction: '5/8', decimal: 0.625 },
  { fraction: '7/8', decimal: 0.875 },
  { fraction: '3/10', decimal: 0.3 },
  { fraction: '7/10', decimal: 0.7 },
  { fraction: '9/10', decimal: 0.9 },
];

export function generateFractionDecimalProblem(
  mathDifficulty: MathDifficulty,
  separator: ',' | '.' = ','
): MathProblem {
  let pool: typeof FRACTION_DECIMAL_PAIRS;

  if (mathDifficulty === 'beginner') {
    pool = FRACTION_DECIMAL_PAIRS.filter(p =>
      ['1/2', '1/4', '3/4', '1/10'].includes(p.fraction)
    );
  } else if (mathDifficulty === 'intermediate') {
    pool = FRACTION_DECIMAL_PAIRS.filter(p =>
      ['1/2', '1/4', '3/4', '1/10', '1/5', '2/5', '3/5', '1/8', '3/8'].includes(p.fraction)
    );
  } else {
    pool = [...FRACTION_DECIMAL_PAIRS];
  }

  const pair = pool[Math.floor(Math.random() * pool.length)]!;
  const direction = Math.random() < 0.5 ? 'fraction-to-decimal' : 'decimal-to-fraction';

  if (direction === 'fraction-to-decimal') {
    return {
      question: `${pair.fraction} = ?`,
      answer: pair.decimal,
      difficulty: mathDifficulty === 'beginner' ? 1 : mathDifficulty === 'intermediate' ? 2 : 3,
      op: 'fraction-decimal',
      category: 'fraction-decimal',
      displayType: 'text',
      isDecimal: true,
      fractionDecimalData: { direction, fraction: pair.fraction, decimal: pair.decimal },
    };
  } else {
    const decimalStr = formatDecimal(pair.decimal, separator);
    const distractors = FRACTION_DECIMAL_PAIRS
      .filter(p => p.fraction !== pair.fraction)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(p => p.fraction);
    const choices = [pair.fraction, ...distractors].sort(() => Math.random() - 0.5);

    return {
      question: `${decimalStr} = ?`,
      answer: -1,
      difficulty: mathDifficulty === 'beginner' ? 1 : mathDifficulty === 'intermediate' ? 2 : 3,
      op: 'fraction-decimal',
      category: 'fraction-decimal',
      displayType: 'fraction-decimal-choice',
      isDecimal: false,
      fractionDecimalData: { direction, fraction: pair.fraction, decimal: pair.decimal, choices },
    };
  }
}
```

### 6D. Dispatch

I `generateForMathType()`:

```ts
if (type === 'fraction-decimal') return generateFractionDecimalProblem(mathDifficulty, separator);
```

### 6E. Badge

I `problemTypeBadgeLabel()`:

```ts
case 'fraction-decimal':
  return '🔢 Brøk ↔ Decimal';
```

### 6F. UI for multiple choice (decimal-to-fraction retning)

**Fil: `src/components/fishing/MathChallenge.tsx`**

Naar `problem.displayType === 'fraction-decimal-choice'`, skal der vises valgknapper (ligesom emoji-fraction goer det). Find den eksisterende rendering-logik for `emoji-fraction` i MathChallenge og brug den som skabelon.

Det kraever en ny renderblok i MathChallenge der vises naar `problem.fractionDecimalData?.choices` eksisterer. Vis 4 knapper med broek-tekst. Naar brugeren klikker den rigtige (`problem.fractionDecimalData.fraction`), er svaret korrekt.

**Vurdering af svar:** I `numericAnswerOk()` haandteres dette IKKE (fordi `answer === -1`). Valget skal i stedet haandteres direkte i click-handleren for knapperne, analogt med `emoji-fraction`-knaphaandteringen. Soeg efter hvordan `emoji-fraction` choices haandteres i MathChallenge og foelg samme moenster.

---

## Opgave 7: Implementer Taelleraekker

### 7A. Registrer regnearten

**Fil: `src/data/math-config.ts`**

Tilfoej i `MATH_TYPE_DEFS` (i gruppen `talforstaelse`):

```ts
{
  id: 'taelleraekke',
  label: 'Tællerækker',
  icon: '🔢',
  desc: 'Find næste tal i rækken',
  group: 'talforståelse',
  supportsOps: false,
},
```

Tilfoej `'taelleraekke'` til **alle tre** farvandeS `allowedMathTypes`:
- `kysten.allowedMathTypes`
- `aabenhav.allowedMathTypes`
- `dybet.allowedMathTypes`

### 7B. Generator

**Fil: `src/logic/math-engine.ts`**

```ts
export function generateTaelleraekke(mathDifficulty: MathDifficulty): MathProblem {
  let step: number;
  let backwards = false;

  if (mathDifficulty === 'beginner') {
    step = pickRandom([2, 5, 10]);
  } else if (mathDifficulty === 'intermediate') {
    step = randInt(2, 10);
  } else {
    step = pickRandom([2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 15, 25]);
    backwards = Math.random() < 0.3;
  }

  const visibleCount = mathDifficulty === 'beginner' ? 4 : 5;
  let start: number;

  if (backwards) {
    const minStart = step * (visibleCount + 1);
    start = randInt(minStart, minStart + step * 5);
    start = Math.round(start / step) * step;
  } else {
    if (mathDifficulty === 'beginner') {
      start = step;
    } else {
      start = step * randInt(1, 3);
    }
  }

  const sequence: number[] = [];
  for (let i = 0; i < visibleCount; i++) {
    sequence.push(backwards ? start - step * i : start + step * i);
  }
  const answer = backwards ? start - step * visibleCount : start + step * visibleCount;

  const question = sequence.join(', ') + ', ?';

  return {
    question,
    answer,
    difficulty: mathDifficulty === 'beginner' ? 1 : mathDifficulty === 'intermediate' ? 2 : 3,
    op: 'taelleraekke',
    category: 'taelleraekke',
    displayType: 'text',
  };
}
```

### 7C. Dispatch

I `generateForMathType()`:

```ts
if (type === 'taelleraekke') return generateTaelleraekke(mathDifficulty);
```

### 7D. Badge

I `problemTypeBadgeLabel()`:

```ts
case 'taelleraekke':
  return '🔢 Tællerækker';
```

---

## Opgave 8: Verificering

Naar alle opgaver er implementeret:

1. **Byg projektet:** `npm run build` — ret eventuelle TypeScript-fejl
2. **Koer tests:** `npm test` — eksisterende tests maa ikke fejle
3. **Manuel test:** Start appen og:
   - Skift til hvert farvand og verificer at de nye regnearter dukker op i indstillingerne
   - Aktiver hver ny regneart og loes 3-5 opgaver
   - Check at aben giver korrekt svar (ogsaa for de gamle vaelg-opgaver som emoji-most-least)
   - Check at komma-tasten vises naar man faar en decimalopgave i Aabent Hav
   - Check at komma-tasten IKKE vises for afrunding/taelleraekke-opgaver
   - Check at decimaltegn-toggle under Avanceret virker: skift til punktum, loes en decimalopgave, og se at baade spoergsmaal og numpad bruger punktum
   - Check at spoergsmaalstekster i procent-decimal og broek-decimal bruger den valgte separator

---

## Opsummering af filaendringer

| Fil | Aendringer |
|-----|-----------|
| `src/store/useMathStore.ts` | Nyt felt `decimalSeparator` + setter |
| `src/types/math.ts` | `FractionDecimalData` interface + `fractionDecimalData?` paa `MathProblem` |
| `src/data/math-config.ts` | 4 nye entries i `MATH_TYPE_DEFS` + opdater alle 3 farvandeS `allowedMathTypes` |
| `src/logic/math-engine.ts` | Ny `formatDecimal()` + separator-parameter paa relevante generatorer + 4 nye generator-funktioner + 4 nye linjer i `generateForMathType()` + separator-parameter paa `generateMathProblem()` |
| `src/components/fishing/MathChallenge.tsx` | Komma-fix (showDecimal) + abe-hint fix (`getMonkeyHint` med separator) + 4 nye badge-cases + fraction-decimal choice UI + separator videregives til alle `generateMathProblem`-kald |
| `src/components/mobile/NumberPad.tsx` | Ny `decimalKey` prop der styrer hvad tasten viser |
| `src/components/screens/MathSettingsScreen.tsx` | Ny decimaltegn-toggle i Avanceret-fanen + opdateret hint-tekst |
