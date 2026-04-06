# Emoji-tælling — Designdokument for ny opgavetype

> Til: Regnefisken  
> Dato: april 2026  
> Status: Design-specifikation

---

## 1. Koncept

En ny opgavetype hvor spilleren ser **to kasser med emojis** og skal tælle og udføre den viste regneart. Svaret skrives som et normalt tal via det eksisterende input-system.

**Eksempel (addition):**

```
┌─────────────┐       ┌──────────────────┐
│ 🐟 🐟 🐟   │   +   │ 🐟 🐟 🐟 🐟     │
└─────────────┘       └──────────────────┘
                 = ?
```

Svar: `7`

---

## 2. Farvande og regnearter

| Farvand | Regnearter | Kategori-ID |
|---------|-----------|-------------|
| 🏖️ Kysten (0.–3. kl.) | Addition (`+`), Subtraktion (`-`) | `emoji-counting` |
| ⛵ Det Åbne Hav (4.–6. kl.) | Multiplikation (`*`), Division (`/`) | `emoji-counting` |

> **Bemærk:** Opgavetypen dækker to farvande, men bruger **samme category-ID**. Regnearten bestemmes af spillerens aktive operatorer (`activeOps`) filtreret mod farvandets `allowedOps`.

---

## 3. Emoji-pool

Følgende 50 emojis er tilgængelige (hav/fiske-tema):

```typescript
const EMOJI_POOL: string[] = [
  '⚓', '🏴‍☠️', '🐟', '🐠', '🐡', '🐳', '🐋', '🐬', '🦭', '🦈',
  '🐙', '🦑', '🦀', '🦞', '🦐', '🪼', '🪸', '🐚', '🦪', '🐢',
  '🦦', '🪱', '🎣', '🪝', '⛵', '🚤', '🛥️', '🛶', '🏖️', '🏝️',
  '⛱️', '🌴', '🌅', '☀️', '☁️', '🧭', '🗺️', '🤿', '🛟', '🧜',
  '🧜‍♀️', '🧜‍♂️', '🦜', '🪙', '🚢', '💰', '🐦', '🌞', '🌤️', '🏄', '🏊'
];
```

**Udvælgelseslogik:** Hver opgave vælger **én tilfældig emoji** fra poolen (ligelig sandsynlighed). Begge kasser bruger **samme emoji**.

---

## 4. Regler og begrænsninger

### Generelle regler (alle regnearter)
- Begge kasser indeholder **1–10 emojis**
- Begge kasser bruger **altid samme emoji**
- Svaret er **altid et positivt heltal** (> 0)
- Emojien vælges **uniformt tilfældigt** fra `EMOJI_POOL`

### Sværhedsgrader og deres effekt

Sværhedsgraden (`mathDifficulty`) påvirker **kun Kysten** (addition/subtraktion) ved at begrænse det maksimale resultat:

| Farvand | mathDifficulty | Effektiv sværhed | Maks resultat |
|---------|---------------|------------------|---------------|
| 🏖️ Kysten | `beginner` | Begynder | **≤ 10** |
| 🏖️ Kysten | `intermediate` | Øvet | **≤ 20** |
| 🏖️ Kysten | `expert` | = Øvet | **≤ 20** (ekspert svarer til øvet) |
| ⛵ Åbent Hav | `beginner` | = Begynder | Altid 1–10 per kasse |
| ⛵ Åbent Hav | `intermediate` | = Begynder | Altid 1–10 per kasse |
| ⛵ Åbent Hav | `expert` | = Begynder | Altid 1–10 per kasse |

> **Begrundelse:** For Åbent Hav (multiplikation/division) er kasserne allerede begrænset til 1–10 emojis, og der er ingen meningsfuld skalering — sværhedsgraden ignoreres. For Kysten giver det en naturlig progression: begyndere ser kun opgaver med resultat ≤ 10 (fx `3 + 4`, `7 − 2`), mens øvede kan se opgaver op til 20 (fx `8 + 9`, `10 − 3`).

### Per regneart

#### 🏖️ Kysten — Begynder (maks resultat ≤ 10)

| Regneart | Venstre kasse (a) | Højre kasse (b) | Svar | Ekstra betingelse |
|----------|-------------------|-----------------|------|-------------------|
| Addition | 1–9 | 1–(10 − a) | a + b | Svar ≤ 10 |
| Subtraktion | 2–10 | 1–(a-1) | a − b | a > b (altid positivt) |

#### 🏖️ Kysten — Øvet / Ekspert (maks resultat ≤ 20)

| Regneart | Venstre kasse (a) | Højre kasse (b) | Svar | Ekstra betingelse |
|----------|-------------------|-----------------|------|-------------------|
| Addition | 1–10 | 1–10 | a + b | Svar ≤ 20 (altid opfyldt med 1–10 per kasse) |
| Subtraktion | 2–10 | 1–(a-1) | a − b | a > b (altid positivt) |

#### ⛵ Åbent Hav — Alle sværhedsgrader (altid "begynder")

| Regneart | Venstre kasse (a) | Højre kasse (b) | Svar | Ekstra betingelse |
|----------|-------------------|-----------------|------|-------------------|
| Multiplikation | 1–10 | 1–10 | a × b | Ingen (svar kan være 1–100) |
| Division | 2–10 | 1–10 | a ÷ b | a er altid et multiplum af b, a ≥ b, svar ≥ 1 |

### Division — særlig genereringslogik

For at sikre heltalssvar genereres division **baglæns**:

```
1. Vælg b (divisor) tilfældigt i [1, 10]
2. Vælg svar (kvotient) tilfældigt i [1, 10]
3. Beregn a = b × svar
4. Hvis a > 10: gentag fra step 1
   (dette begrænser effektivt de mulige kombinationer)
```

Gyldige divisions-par (a, b) hvor a ≤ 10:

| b (divisor) | Mulige a-værdier | Mulige svar |
|-------------|-----------------|-------------|
| 1 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | 1–10 |
| 2 | 2, 4, 6, 8, 10 | 1–5 |
| 3 | 3, 6, 9 | 1–3 |
| 4 | 4, 8 | 1–2 |
| 5 | 5, 10 | 1–2 |
| 6 | 6 | 1 |
| 7 | 7 | 1 |
| 8 | 8 | 1 |
| 9 | 9 | 1 |
| 10 | 10 | 1 |

---

## 5. MathProblem-felter

Den genererede `MathProblem` skal udfyldes sådan:

```typescript
{
  question: string,        // Se "question-format" nedenfor
  answer: number,          // Det numeriske svar
  difficulty: 1,           // Kysten: 1, Åbent Hav: 2
  op: '+' | '-' | '*' | '/',  // Den aktuelle regneart
  multiplier: number,      // Fra OP_MULTIPLIERS for den valgte operator
  category: 'emoji-counting',
  displayType: 'emoji-counting',  // NY displayType → trigger nyt UI-layout
  unit: undefined,
  xpBonus: 15,             // Moderat XP-bonus (mellem lette-historier og regnehistorier)
  isDecimal: false,
  
  // NYE felter specifikt for emoji-counting:
  emojiData: {
    emoji: string,         // Den valgte emoji (fx '🐟')
    leftCount: number,     // Antal i venstre kasse
    rightCount: number,    // Antal i højre kasse
    operator: '+' | '-' | '*' | '/'
  }
}
```

### question-format

`question`-feltet bruges som fallback-tekst (fx i tests eller hvis UI'et ikke understøtter `displayType: 'emoji-counting'`):

```
"🐟🐟🐟 + 🐟🐟🐟🐟"     // Addition: 3 + 4
"⛵⛵⛵⛵⛵ − ⛵⛵"         // Subtraktion: 5 - 2
"🦀🦀🦀 × 🦀🦀🦀🦀"     // Multiplikation: 3 × 4
"🐙🐙🐙🐙🐙🐙 ÷ 🐙🐙"   // Division: 6 ÷ 2
```

---

## 6. Generator-funktion

```typescript
// Ny funktion i math-engine.ts

function generateEmojiCountingProblem(
  activeOps: string[],
  selectedFarvand: FarvandId,
  mathDifficulty: MathDifficulty
): MathProblem {
  // 1. Bestem tilgængelige regnearter baseret på farvand
  const emojiOps = selectedFarvand === 'kysten' 
    ? ['+', '-'].filter(op => activeOps.includes(op))
    : ['*', '/'].filter(op => activeOps.includes(op));
  
  // Fallback: brug første tilladte op
  const ops = emojiOps.length > 0 ? emojiOps : [selectedFarvand === 'kysten' ? '+' : '*'];
  
  // 2. Vælg tilfældig regneart
  const op = ops[Math.floor(Math.random() * ops.length)];
  
  // 3. Vælg tilfældig emoji
  const emoji = EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)];
  
  // 4. Bestem maks-resultat for Kysten baseret på sværhedsgrad
  //    - beginner: maks 10
  //    - intermediate/expert: maks 20 (expert = øvet for denne opgavetype)
  //    - Åbent Hav: ignorerer sværhedsgrad (altid 1–10 per kasse)
  const maxResult = (selectedFarvand === 'kysten' && mathDifficulty === 'beginner') ? 10 : 20;
  
  // 5. Generer tal baseret på regneart
  let a: number, b: number, answer: number;
  
  switch (op) {
    case '+': {
      // Kysten begynder: a + b ≤ 10, dvs. b ≤ (10 - a)
      // Kysten øvet/ekspert: a + b ≤ 20, dvs. frit (maks 10+10=20)
      const maxA = maxResult === 10 ? 9 : 10;  // begynder: maks 9 (ellers b=0)
      a = randInt(1, maxA);
      const maxB = Math.min(10, maxResult - a); // begænser b så svar ≤ maxResult
      b = randInt(1, maxB);
      answer = a + b;
      break;
    }
      
    case '-':
      // Subtraktion: resultat er altid ≤ a, som er ≤ 10
      // Sværhedsgrad påvirker ikke subtraktion (resultat er naturligt ≤ 10)
      a = randInt(2, 10);
      b = randInt(1, a - 1);
      answer = a - b;
      break;
      
    case '*':
      // Åbent Hav: sværhedsgrad ignoreres — altid 1–10 per kasse
      a = randInt(1, 10);
      b = randInt(1, 10);
      answer = a * b;
      break;
      
    case '/': {
      // Åbent Hav: sværhedsgrad ignoreres — generer baglæns for heltal
      b = randInt(1, 10);
      const maxQuotient = Math.floor(10 / b);
      const quotient = randInt(1, maxQuotient);
      a = b * quotient;
      answer = quotient;
      break;
    }
  }
  
  // 6. Byg question-string
  const leftEmojis = emoji.repeat(a);
  const rightEmojis = emoji.repeat(b);
  const opSymbol = op === '*' ? '×' : op === '/' ? '÷' : op === '-' ? '−' : op;
  const question = `${leftEmojis} ${opSymbol} ${rightEmojis}`;
  
  return {
    question,
    answer,
    difficulty: selectedFarvand === 'kysten' ? 1 : 2,
    op,
    multiplier: OP_MULTIPLIERS[op] || 1,
    category: 'emoji-counting',
    displayType: 'emoji-counting',
    xpBonus: 15,
    isDecimal: false,
    emojiData: {
      emoji,
      leftCount: a,
      rightCount: b,
      operator: op
    }
  };
}

// Hjælpefunktion
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
```

---

## 7. Routing i generateMathProblem()

Tilføj et nyt category-check i routing-flowet:

```
generateMathProblem(...)
│
├─ activeOps indeholder 'tenfriends'?      → generateTenFriendsProblem()
├─ activeOps indeholder '100friends'?      → generate100FriendsQuestion()
├─ activeOps indeholder 'skaeve100friends'? → generateSkaeve100FriendsQuestion()
│
├─ mathCategory === 'emoji-counting'?      → generateEmojiCountingProblem()  ← NY
│
├─ mathCategory === 'regnehistorier'?      → generateRegneHistorie()
├─ mathCategory === 'lette-historier'?     → generateLetRegneHistorie()
│  ...osv.
```

**Placering:** Lige efter special-op checks, før de andre kategori-checks (linje-rækkefølge i koden).

---

## 8. Konfiguration (math-config.ts)

### FARVANDE — tilføj emoji-counting til allowedOps og allowedCategories

```typescript
FARVANDE: {
  kysten: {
    name: '🏖️ Kysten',
    desc: '0.–3. klasse',
    allowedOps: ['+', '-', 'tenfriends', '100friends'],  // Uændret
    allowedCategories: ['basic', 'lette-historier', 'emoji-counting'],  // ← TILFØJET
    canUseDecimal: false,
    canUseNegative: false,
  },
  aabenhav: {
    name: '⛵ Det Åbne Hav',
    desc: '4.–6. klasse',
    allowedOps: ['+', '-', '*', '/', 'multi-term', 'skaeve100friends'],  // Uændret
    allowedCategories: ['basic', 'multi-term', 'regnehistorier', 'emoji-counting'],  // ← TILFØJET
    canUseDecimal: false,
    canUseNegative: false,
  },
  // dybet: uændret (ingen emoji-counting)
}
```

---

## 9. UI-design (MathChallenge.tsx)

### Ny displayType: 'emoji-counting'

Tilføj et tredje layout-tilfælde i render-logikken, ved siden af `'text'` og `'regnehistorie'`:

```tsx
{problem.displayType === 'emoji-counting' && problem.emojiData && (
  <div className="flex items-center justify-center gap-3 py-4">
    {/* Venstre kasse */}
    <div className="
      border-2 border-dashed border-cyan-400/50 
      rounded-xl px-3 py-2 
      bg-cyan-900/20
      flex flex-wrap justify-center gap-1
      max-w-[160px]
    ">
      {Array.from({ length: problem.emojiData.leftCount }).map((_, i) => (
        <span key={i} className="text-2xl">{problem.emojiData.emoji}</span>
      ))}
    </div>
    
    {/* Operator-symbol */}
    <span className="text-4xl font-bold text-white/90 min-w-[40px] text-center">
      {problem.emojiData.operator === '+' ? '+' :
       problem.emojiData.operator === '-' ? '−' :
       problem.emojiData.operator === '*' ? '×' : '÷'}
    </span>
    
    {/* Højre kasse */}
    <div className="
      border-2 border-dashed border-cyan-400/50 
      rounded-xl px-3 py-2 
      bg-cyan-900/20
      flex flex-wrap justify-center gap-1
      max-w-[160px]
    ">
      {Array.from({ length: problem.emojiData.rightCount }).map((_, i) => (
        <span key={i} className="text-2xl">{problem.emojiData.emoji}</span>
      ))}
    </div>
  </div>
)}
```

### Kategori-badge

Tilføj badge-tekst for den nye kategori:

```tsx
// I render-logikken for kategori-badges
case 'emoji-counting':
  return '🎯 Emoji-tælling';
```

---

## 10. Indstillinger (MathSettingsScreen.tsx)

### CATEGORY_ROWS — tilføj nyt element

```typescript
const CATEGORY_ROWS = [
  // ...eksisterende kategorier...
  { 
    id: 'emoji-counting', 
    label: '🎯 Emoji-tælling', 
    desc: 'Tæl emojis og regn!' 
  },
];
```

Kategorien filtreres automatisk baseret på farvandets `allowedCategories`, så den kun vises for Kysten og Åbent Hav.

---

## 11. Types (math.ts)

### Tilføj EmojiData til MathProblem

```typescript
interface EmojiData {
  emoji: string;
  leftCount: number;
  rightCount: number;
  operator: '+' | '-' | '*' | '/';
}

interface MathProblem {
  // ...eksisterende felter...
  emojiData?: EmojiData;  // Kun sat når displayType === 'emoji-counting'
}
```

---

## 12. Tests (math-engine.test.ts)

### Foreslåede test-cases

```typescript
describe('emoji-counting', () => {
  it('addition begynder: svar aldrig over 10', () => {
    for (let i = 0; i < 100; i++) {
      const p = generateEmojiCountingProblem(['+'], 'kysten', 'beginner');
      expect(p.answer).toBeLessThanOrEqual(10);
      expect(p.answer).toBeGreaterThanOrEqual(2);  // mindst 1+1
      expect(p.emojiData!.leftCount).toBeGreaterThanOrEqual(1);
      expect(p.emojiData!.leftCount).toBeLessThanOrEqual(9);
      expect(p.emojiData!.rightCount).toBeGreaterThanOrEqual(1);
      expect(p.emojiData!.rightCount).toBeLessThanOrEqual(10);
      expect(p.answer).toBe(p.emojiData!.leftCount + p.emojiData!.rightCount);
    }
  });

  it('addition øvet: svar kan være op til 20', () => {
    let sawAbove10 = false;
    for (let i = 0; i < 200; i++) {
      const p = generateEmojiCountingProblem(['+'], 'kysten', 'intermediate');
      expect(p.answer).toBeLessThanOrEqual(20);
      expect(p.emojiData!.leftCount).toBeLessThanOrEqual(10);
      expect(p.emojiData!.rightCount).toBeLessThanOrEqual(10);
      if (p.answer > 10) sawAbove10 = true;
    }
    expect(sawAbove10).toBe(true);  // over 200 forsøg bør vi se mindst ét svar > 10
  });

  it('addition ekspert: opfører sig som øvet (maks 20)', () => {
    for (let i = 0; i < 100; i++) {
      const p = generateEmojiCountingProblem(['+'], 'kysten', 'expert');
      expect(p.answer).toBeLessThanOrEqual(20);
    }
  });

  it('subtraktion: venstre > højre, positivt svar', () => {
    for (let i = 0; i < 50; i++) {
      const p = generateEmojiCountingProblem(['-'], 'kysten', 'beginner');
      expect(p.emojiData!.leftCount).toBeGreaterThan(p.emojiData!.rightCount);
      expect(p.answer).toBeGreaterThan(0);
    }
  });

  it('multiplikation: korrekt produkt, ignorerer sværhedsgrad', () => {
    for (let i = 0; i < 50; i++) {
      // Selv med 'expert' skal det opføre sig som begynder
      const p = generateEmojiCountingProblem(['*'], 'aabenhav', 'expert');
      expect(p.emojiData!.leftCount).toBeGreaterThanOrEqual(1);
      expect(p.emojiData!.leftCount).toBeLessThanOrEqual(10);
      expect(p.emojiData!.rightCount).toBeGreaterThanOrEqual(1);
      expect(p.emojiData!.rightCount).toBeLessThanOrEqual(10);
      expect(p.answer).toBe(p.emojiData!.leftCount * p.emojiData!.rightCount);
    }
  });

  it('division: heltalssvar, a deleligt med b', () => {
    for (let i = 0; i < 50; i++) {
      const p = generateEmojiCountingProblem(['/'], 'aabenhav', 'beginner');
      expect(p.emojiData!.leftCount % p.emojiData!.rightCount).toBe(0);
      expect(p.answer).toBe(p.emojiData!.leftCount / p.emojiData!.rightCount);
      expect(p.answer).toBeGreaterThanOrEqual(1);
      expect(Number.isInteger(p.answer)).toBe(true);
    }
  });

  it('emojien er fra EMOJI_POOL', () => {
    for (let i = 0; i < 30; i++) {
      const p = generateEmojiCountingProblem(['+'], 'kysten', 'beginner');
      expect(EMOJI_POOL).toContain(p.emojiData!.emoji);
    }
  });

  it('ligelig fordeling af emojis over mange iterationer', () => {
    const counts: Record<string, number> = {};
    const iterations = 5000;
    for (let i = 0; i < iterations; i++) {
      const p = generateEmojiCountingProblem(['+'], 'kysten', 'beginner');
      counts[p.emojiData!.emoji] = (counts[p.emojiData!.emoji] || 0) + 1;
    }
    const expected = iterations / EMOJI_POOL.length;
    // Tillad 50% afvigelse (statistisk margin)
    for (const emoji of EMOJI_POOL) {
      expect(counts[emoji] || 0).toBeGreaterThan(expected * 0.5);
      expect(counts[emoji] || 0).toBeLessThan(expected * 1.5);
    }
  });
});
```

---

## 13. Komplet checkliste

### Obligatorisk

| # | Fil | Ændring | Status |
|---|-----|---------|--------|
| 1 | `src/types/math.ts` | Tilføj `EmojiData` interface, tilføj `emojiData?` felt til `MathProblem` | ⬜ |
| 2 | `src/logic/math-engine.ts` | Tilføj `EMOJI_POOL`, `generateEmojiCountingProblem()`, routing i `generateMathProblem()` | ⬜ |
| 3 | `src/data/math-config.ts` | Tilføj `'emoji-counting'` til `allowedCategories` for `kysten` og `aabenhav` | ⬜ |
| 4 | `src/components/screens/MathSettingsScreen.tsx` | Tilføj emoji-counting til `CATEGORY_ROWS` | ⬜ |
| 5 | `src/components/fishing/MathChallenge.tsx` | Tilføj `displayType === 'emoji-counting'` layout + kategori-badge | ⬜ |

### Valgfrit (men anbefalet)

| # | Fil | Ændring | Status |
|---|-----|---------|--------|
| 6 | `tests/math-engine.test.ts` | Tilføj test-suite for emoji-counting | ⬜ |
| 7 | `src/logic/game-persistence.ts` | Verificer at `'emoji-counting'` i `mathCategory` persisteres | ⬜ |

---

## 14. Designovervejelser og åbne spørgsmål

### Sværhedsgrad (mathDifficulty)

Opgavetypen bruger `mathDifficulty` **kun for Kysten** (addition/subtraktion):

| Sværhedsgrad | Kysten-effekt | Åbent Hav-effekt |
|-------------|---------------|------------------|
| Begynder | Resultat ≤ 10 | Ingen effekt (altid 1–10/kasse) |
| Øvet | Resultat ≤ 20 | Ingen effekt (altid 1–10/kasse) |
| Ekspert | = Øvet (≤ 20) | Ingen effekt (altid 1–10/kasse) |

Begynder-niveauet giver en blødere start for de yngste (0.–1. klasse), hvor opgaver som `8 + 9` undgås. Ekspert mapper til øvet, da der ikke er en meningsfuld tredje sværhedsgrad inden for 1–10 emojis.

### Er det en special-operator eller en kategori?

**Anbefaling: Kategori-baseret** (ikke special-operator). Begrundelse:
- Special-operatorer (`tenfriends`, `100friends`, `skaeve100friends`) er **eksklusive** og overtager al opgavegenerering
- Emoji-tælling bør kunne **sameksistere** med andre aktive kategorier, så spilleren kan skifte frit
- Det passer bedre ind i det eksisterende UI-flow med `CATEGORY_ROWS`

### Multiplikation-forklaring i UI (åbent)

Til multiplikation/division kunne man overveje at vise et lille hjælpe-hint som "Tæl hver kasse og gang/del tallene". Det er valgfrit men kan hjælpe yngre spillere i Åbent Hav.

### Emoji-rendering på tværs af enheder

Visse emojis (fx `🏴‍☠️`, `🧜‍♀️`, `🧜‍♂️`) er **ZWJ-sekvenser** (sammensat af flere Unicode-codepoints). De bør testes på:
- iOS Safari
- Android Chrome  
- Desktop Chrome/Firefox

Hvis nogen renderes som to separate tegn, kan de fjernes fra `EMOJI_POOL`.
