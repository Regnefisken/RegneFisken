# Implementeringsprompt: Opgavetype "Antal" (`emoji-antal`)

> **Kontekst:** Regnefisken er et børne-matematikspil med fiskeri-tema. Spillet har tre emoji-opgavetyper der allerede er implementeret (`emoji-counting`, `emoji-most-least`, `emoji-size-compare`) — se `references/PROMPT-emoji-opgavetyper.md` for den implementering. Denne prompt tilføjer en **fjerde**, enklere emoji-opgavetype.

---

## Koncept

Spilleren ser **én kasse** med tilfældige emojis (samme slags) og skal blot **tælle dem** og skrive antallet som et tal via det eksisterende input-system.

**Eksempel:**

```
┌──────────────────────┐
│ 🐟 🐟 🐟 🐟 🐟      │
│ 🐟 🐟                │
└──────────────────────┘
Hvor mange er der?  →  ?
```

Svar: `7`

Ingen regneart — ingen operator — bare tæl og skriv tallet.

---

## Farvand og sværhedsgrad

| Farvand | Tilgængeligt? |
|---------|---------------|
| 🏖️ Kysten (0.–3. kl.) | **Ja** |
| ⛵ Det Åbne Hav | Nej |
| 🐋 Dybet | Nej |

| `mathDifficulty` | Antal emojis | Effekt |
|------------------|-------------|--------|
| `beginner` | **1–10** | Tæl op til 10 |
| `intermediate` | **11–20** | Tæl op til 20 |
| `expert` | **11–20** | Samme som øvet (ingen særskilt ekspert-niveau) |

---

## Filer der skal ændres

### 1. `src/types/math.ts`

Tilføj et nyt interface `EmojiAntalData` og et valgfrit felt `emojiAntalData?: EmojiAntalData` på `MathProblem`:

```typescript
export interface EmojiAntalData {
  emoji: string;
  count: number;
}
```

Tilføj feltet på `MathProblem` ved de øvrige emoji-felter:

```typescript
export interface MathProblem {
  // ...eksisterende felter...
  emojiData?: EmojiData;
  emojiChoiceData?: EmojiChoiceData;
  emojiSizeData?: EmojiSizeData;
  emojiAntalData?: EmojiAntalData;       // ← NY
}
```

---

### 2. `src/logic/math-engine.ts`

#### 2a. Ny generator-funktion

Tilføj `generateEmojiAntalProblem()`. Funktionen bruger den eksisterende `EMOJI_POOL` (allerede eksporteret) og `randInt()` (allerede defineret øverst i filen).

```typescript
export function generateEmojiAntalProblem(
  mathDifficulty: MathDifficulty
): MathProblem {
  // beginner: 1–10, intermediate/expert: 11–20
  const min = mathDifficulty === 'beginner' ? 1 : 11;
  const max = mathDifficulty === 'beginner' ? 10 : 20;
  const count = randInt(min, max);

  const emoji = EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)]!;
  const question = `${emoji.repeat(count)} — Hvor mange?`;

  return {
    question,
    answer: count,
    difficulty: 1,
    op: '+',
    multiplier: 1,
    category: 'emoji-antal',
    displayType: 'emoji-antal',
    xpBonus: 5,
    isDecimal: false,
    emojiAntalData: {
      emoji,
      count,
    },
  };
}
```

**Nøglepunkter:**
- `answer` = antallet (positivt heltal) — valideres numerisk via det eksisterende `checkAnswer()`.
- `op: '+'` og `multiplier: 1` er neutrale pladsholderværdier (ingen regneart).
- `xpBonus: 5` — laveste bonus, da det er den simpleste opgave.
- `displayType: 'emoji-antal'` — ny displayType der triggerer nyt UI-layout.
- `question`-strengen er en fallback-tekst med emojis + "— Hvor mange?".

#### 2b. Routing i `generateMathProblem()`

Tilføj et nyt category-check **før** de øvrige emoji-checks (det er den enkleste opgavetype og bør tjekkes tidligt).

Den aktuelle rækkefølge i `generateMathProblem()` (linje ~646):

```typescript
if (mathCategory === 'emoji-most-least') { ... }
if (mathCategory === 'emoji-size-compare') { ... }
if (mathCategory === 'emoji-counting') { ... }
```

**Indsæt ÉT nyt check OVER disse tre:**

```typescript
if (mathCategory === 'emoji-antal') {
  return generateEmojiAntalProblem(mathDifficulty);
}

if (mathCategory === 'emoji-most-least') { ... }
// ...resten uændret
```

**Komplet routing-flow efter ændringen:**

```
generateMathProblem(...)
│
├─ activeOps includes 'tenfriends'?       → generateTenFriendsProblem()
├─ activeOps includes '100friends'?       → generate100FriendsQuestion()
├─ activeOps includes 'skaeve100friends'? → generateSkaeve100FriendsQuestion()
│
├─ mathCategory === 'emoji-antal'?        → generateEmojiAntalProblem()      ← NY
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

### 3. `src/data/math-config.ts`

Tilføj `'emoji-antal'` til Kystens `allowedCategories`. **Kun Kysten** — ikke Åbent Hav eller Dybet.

**Nuværende:**

```typescript
kysten: {
  allowedCategories: ['basic','lette-historier','emoji-counting','emoji-most-least','emoji-size-compare'],
```

**Ny:**

```typescript
kysten: {
  allowedCategories: ['basic','lette-historier','emoji-antal','emoji-counting','emoji-most-least','emoji-size-compare'],
```

> `emoji-antal` er placeret **før** de andre emoji-kategorier i listen for naturlig sortering (simplest → mest kompleks), men placeringen i arrayet er kun kosmetisk.

---

### 4. `src/components/screens/MathSettingsScreen.tsx`

Tilføj til `CATEGORY_ROWS`-arrayet. Placer den **før** `emoji-counting` for at afspejle stigende sværhedsgrad i UI'et:

**Nuværende (linje 61–63):**

```typescript
  { id: 'emoji-counting', label: 'Emoji-tælling', icon: '🎯', desc: 'Tæl emojis og regn!' },
  { id: 'emoji-most-least', label: 'Flest / færrest', icon: '⚖️', desc: 'Tryk på den rigtige kasse' },
  { id: 'emoji-size-compare', label: 'Størst / mindst', icon: '🔍', desc: 'Tryk på de store eller små' },
```

**Ny (indsæt OVER de tre eksisterende emoji-rækker):**

```typescript
  { id: 'emoji-antal', label: 'Antal', icon: '🔢', desc: 'Tæl emojis — hvor mange er der?' },
  { id: 'emoji-counting', label: 'Emoji-tælling', icon: '🎯', desc: 'Tæl emojis og regn!' },
  { id: 'emoji-most-least', label: 'Flest / færrest', icon: '⚖️', desc: 'Tryk på den rigtige kasse' },
  { id: 'emoji-size-compare', label: 'Størst / mindst', icon: '🔍', desc: 'Tryk på de store eller små' },
```

Kategorien filtreres automatisk af farvandets `allowedCategories`, så den kun vises for Kysten.

---

### 5. `src/components/fishing/MathChallenge.tsx`

#### 5a. Import af nyt type

Tilføj `EmojiAntalData` til den eksisterende type-import (linje 21):

```typescript
import type { EmojiChoiceData, EmojiData, EmojiSizeData, EmojiAntalData } from '../../types/math';
```

#### 5b. Ny panel-komponent

Tilføj en ny `EmojiAntalPanel` komponent **ved de andre emoji-paneler** (efter `EmojiCountingPanel`, før `numericAnswerOk`):

```tsx
function EmojiAntalPanel({ data }: { data: EmojiAntalData }) {
  return (
    <div className="mb-3 flex flex-col items-center gap-3">
      <div className="text-center text-xl font-bold text-cyan-300">
        Hvor mange er der?
      </div>
      <div className="max-w-[280px] rounded-xl border-2 border-dashed border-cyan-400/50 bg-cyan-900/20 p-4">
        <div className="flex flex-wrap justify-center gap-1">
          {Array.from({ length: data.count }).map((_, i) => (
            <span key={`ea-${i}`} className="text-2xl leading-none">
              {data.emoji}
            </span>
          ))}
        </div>
      </div>
      <div className="text-3xl font-black tabular-nums text-white">= ?</div>
    </div>
  );
}
```

**Stil-noter:**
- **Én** kasse (ikke to som `emoji-counting`).
- `max-w-[280px]` — lidt bredere end emoji-counting-kasserne (160px) for at give plads til op til 20 emojis.
- Samme cyan-farveskema som de øvrige emoji-opgaver.
- "Hvor mange er der?" som instruktionstekst over kassen.
- `= ?` nedenunder — identisk med `emoji-counting`.

#### 5c. Nyt render-tilfælde i displayType-kæden

I den store ternary-kæde (linje ~840–876), tilføj et nyt led **før** `emoji-counting`-checket:

**Nuværende:**

```tsx
          ) : problem.displayType === 'emoji-counting' && problem.emojiData ? (
            <EmojiCountingPanel data={problem.emojiData} />
          ) : problem.category === 'regnehistorier' || ...
```

**Ny (indsæt OVER det nuværende `emoji-counting`-check):**

```tsx
          ) : problem.displayType === 'emoji-antal' && problem.emojiAntalData ? (
            <EmojiAntalPanel data={problem.emojiAntalData} />
          ) : problem.displayType === 'emoji-counting' && problem.emojiData ? (
            <EmojiCountingPanel data={problem.emojiData} />
          ) : problem.category === 'regnehistorier' || ...
```

#### 5d. Badge-tilfælde

I badge-kæden (linje ~829–835), tilføj et nyt led:

**Nuværende:**

```typescript
: mathCategory === 'emoji-counting'
  ? '🎯 Emoji-tælling'
```

**Tilføj ÉT nyt led FØR `emoji-counting`:**

```typescript
: mathCategory === 'emoji-antal'
  ? '🔢 Antal'
: mathCategory === 'emoji-counting'
  ? '🎯 Emoji-tælling'
```

#### 5e. Hjælpetekst

I hint-tekst-sektionen (linje ~877–886), tilføj et check for `emoji-antal`:

**Nuværende:**

```typescript
: problem.displayType === 'emoji-counting'
  ? 'Tæl og skriv svaret — tryk enter'
```

**Tilføj FØR dette check:**

```typescript
: problem.displayType === 'emoji-antal'
  ? 'Tæl og skriv antallet — tryk enter'
: problem.displayType === 'emoji-counting'
  ? 'Tæl og skriv svaret — tryk enter'
```

#### 5f. Intet nyt for klik/numpad/zen

`emoji-antal` er **ikke** en klik-baseret opgave. `isClickBasedProblem` inkluderer den **ikke** (den tjekker kun `emoji-most-least` og `emoji-size-compare`). Input, numpad og standard zen-knap fungerer som normalt — ingen ændringer nødvendige.

---

## MathProblem-felter (komplet)

```typescript
{
  question: '🐟🐟🐟🐟🐟🐟🐟 — Hvor mange?',
  answer: 7,               // = antal emojis
  difficulty: 1,            // Altid Kysten
  op: '+',                  // Neutral (ingen regneart)
  multiplier: 1,            // Ingen bonus
  category: 'emoji-antal',
  displayType: 'emoji-antal',
  xpBonus: 5,
  isDecimal: false,
  emojiAntalData: {
    emoji: '🐟',
    count: 7
  }
}
```

---

## Samlet oversigt over berørte filer

| # | Fil | Ændringer |
|---|-----|-----------|
| 1 | `src/types/math.ts` | Tilføj `EmojiAntalData` interface + `emojiAntalData?` felt på `MathProblem` |
| 2 | `src/logic/math-engine.ts` | Tilføj `generateEmojiAntalProblem()` + routing i `generateMathProblem()` |
| 3 | `src/data/math-config.ts` | Tilføj `'emoji-antal'` til kystens `allowedCategories` |
| 4 | `src/components/screens/MathSettingsScreen.tsx` | Tilføj ny entry i `CATEGORY_ROWS` |
| 5 | `src/components/fishing/MathChallenge.tsx` | Tilføj `EmojiAntalPanel` komponent, nyt render-tilfælde, badge-tilfælde, hjælpetekst |

---

## Vigtige designbeslutninger

1. **Kategori-baseret, ikke special-operator.** `emoji-antal` er en kategori (som de andre emoji-typer), ikke en eksklusiv special-operator.

2. **Kun Kysten (0.–3. kl.).** Opgaven er for simpel til Åbent Hav og Dybet.

3. **Sværhedsgrad styrer range.** `beginner` = 1–10, `intermediate`/`expert` = 11–20. Intet andet ændrer sig.

4. **Genbrug af `EMOJI_POOL` og `randInt`.** Begge er allerede defineret og tilgængelige i `math-engine.ts`.

5. **Numpad + input forbliver synlige.** Svaret skrives som et tal, præcis som `emoji-counting` og `basic`.

6. **Ingen nye afhængigheder.** Alt bygges med eksisterende React, Tailwind og Zustand.

7. **Kompatibilitet.** Boss-kampe, zen-mode, streak og speed-solve fungerer alle som normalt — opgaven bruger standard `checkAnswer()` og `handleAnswerCorrect()`/`handleAnswerWrong()`.

---

## Anbefalet implementeringsrækkefølge

1. `src/types/math.ts` — tilføj interface og felt
2. `src/logic/math-engine.ts` — tilføj generator + routing
3. `src/data/math-config.ts` — tilføj til kystens kategorier
4. `src/components/screens/MathSettingsScreen.tsx` — tilføj settings-række
5. `src/components/fishing/MathChallenge.tsx` — tilføj panel, render, badge, hjælpetekst
6. Kør `npm run build` og `npx vitest run` for at verificere
