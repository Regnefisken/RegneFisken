# Matematik-System – Ekstraheret Dokumentation

> Samlet fil til kopiering i andet projekt. Indeholder dokumentation + spejlede kilder fra regnefisken (TypeScript/React).

## 1. Oversigt

- **Typer:** `src/types/math.ts` — `FarvandId`, `MathProblem`, emoji-data, skabeloner.
- **Konfig:** `src/data/math-config.ts` — opgavetyper, `FARVANDE`, historie-templates, `getDifficultyMultiplier`.
- **Motor:** `src/logic/math-engine.ts` — `generateMathProblem` og alle generatorer.
- **State:** `src/store/useMathStore.ts` — Zustand (inkl. numpad, decimalseparator).
- **UI:** `src/components/fishing/MathChallenge.tsx`, `src/components/mobile/NumberPad.tsx`, `src/components/screens/MathSettingsScreen.tsx`.
- **Persistens (uddrag):** `src/logic/game-persistence.ts` — `pickMath`, hydrering af matematikfelter.

**Dataflow:** `generateMathProblem(activeMathTypes, mathDifficulty, selectedFarvand, typeOps, separator)` filtrerer mod `FARVANDE[selectedFarvand].allowedMathTypes`, trækker tilfældig type og returnerer `MathProblem`.

---

## 2. Opgavetyper

Se `MATH_TYPE_DEFS` og `MathProblem` i bilagene nedenfor. Klik-baserede opgaver har typisk `answer: -1` og `displayType` som `emoji-most-least`, `emoji-size-compare`, `emoji-even-odd`, `emoji-pattern`, `emoji-sort`, `emoji-fraction`, `fraction-decimal-choice`.

---

## 3. Farvand

Tre keys: `kysten`, `aabenhav`, `dybet` — se `FARVANDE` i `math-config` bilaget.

---

## 4. Regnearter og historier

Grundregning via `generateNumbersForOp` + `generateBasicFromOp`. Regnehistorier bruger `REGNEHISTORIE_TEMPLATES` / `LETTE_REGNEHISTORIE_TEMPLATES` og `retEntalFlertal` i `math-engine`.

---

## 5. Avanceret matematik

Multi-led, ligninger, decimal, procent↔decimal, brøk↔decimal, tællerækker, afrunding, emoji-brøk/procent — alt i `math-engine.ts` bilaget.

---

## 6. Touch-numpad og input

- Komponent: `NumberPad.tsx` (cifre, OK, tilbage, valgfri decimal/minus, layout 123 vs telefon).
- `MathChallenge` skifter mellem tekstfelt+Enter og numpad via `showNumberPad`; `showDecimal` fra `problem.isDecimal`, `showMinus` når `selectedFarvand === dybet`.
- Validering: `numericAnswerOk` — trim, komma→punktum, tolerance 0.001.
- Indstillinger under **Avanceret** i `MathSettingsScreen`: numpad on/off, tastelayout, komma/punktum.

---

## 7. Hjælpeklasser, persistens, tests

- `useMathStore` — bilag.
- `pickMath` + hydrering: se uddrag i bilag fra `game-persistence.ts`.
- Vitest: `tests/math-engine.test.ts` — bilag.

**Bemærk:** `decimalSeparator` er ikke med i `pickMath`; den nulstilles ved frisk load medmindre I udvider save-format.

---

## 8. Integration (kort)

- `FishingControls.precomputeNextCatch` / `startMathFight`: `generateMathProblem(..., decimalSeparator)`.
- `MathChallenge.nextProblem`: samme kald med state fra store.

---

## 9. Øvrigt / udeladt

- **Abe-hjælper / hints** (`getMonkeyHint` m.m. i `MathChallenge`) er ikke dokumenteret her (per ønske om at ignorere abe-relateret indhold).
- **Stack:** TypeScript/React, ikke C#/Unity.
- `FarvandDef.canUseDecimal` / `canUseNegative` afviger i praksis fra numpad-logikken; se kode i `MathChallenge`.

---

# Bilag — fuld kildekode

### A. `src/types/math.ts`

**src/types/math.ts**

```typescript
export type FarvandId = 'kysten' | 'aabenhav' | 'dybet';

export interface EmojiData {
  emoji: string;
  leftCount: number;
  rightCount: number;
  operator: '+' | '-' | '*' | '/';
}

export interface EmojiChoiceData {
  mode: 'most' | 'least';
  leftEmoji: string;
  rightEmoji: string;
  leftCount: number;
  rightCount: number;
  correctSide: 'left' | 'right';
}

export type EmojiSizeLevel = 'small' | 'medium' | 'large';

export interface EmojiSizeData {
  mode: 'biggest' | 'smallest';
  emoji: string;
  leftSize: EmojiSizeLevel;
  rightSize: EmojiSizeLevel;
  leftCount: number;
  rightCount: number;
  correctSide: 'left' | 'right';
}

export interface EmojiAntalData {
  emoji: string;
  count: number;
}

/** D: Find halvdelen + E: Find det dobbelte + H: Samme antal (delt layout) */
export interface EmojiHalvdelData {
  emoji: string;
  count: number;
  mode: 'half' | 'double';
}

/** F: Lige eller ulige */
export interface EmojiEvenOddData {
  emoji: string;
  count: number;
  isEven: boolean;
}

/** G: Fortsæt mønstret */
export interface EmojiPatternData {
  sequence: string[];
  correctNext: string;
  choices: string[];
  patternType: 'AB' | 'ABB' | 'AAB' | 'ABC' | 'ABAC';
}

/** C: Sorter i rækkefølge */
export interface EmojiSortData {
  boxes: { emoji: string; count: number }[];
  mode: 'asc' | 'desc';
  correctOrder: number[];
}

/** H: Samme antal */
export interface EmojiEqualizeData {
  emoji: string;
  leftCount: number;
  rightCount: number;
  difference: number;
}

/** I: Brøkdele visuelt */
export interface EmojiFractionData {
  emoji: string;
  total: 10;
  highlighted: number;
  correctFraction: string;
  choices: string[];
}

/** J: Procentdel */
export interface EmojiPercentData {
  emoji: string;
  total: 10;
  highlighted: number;
  correctPercent: number;
}

/** Brøk ↔ decimal (multiple choice når svaret er en brøk) */
export interface FractionDecimalData {
  direction: 'fraction-to-decimal' | 'decimal-to-fraction';
  fraction: string;
  decimal: number;
  choices?: string[];
}

export type MathTypeGroup = 'regnearter' | 'talforståelse' | 'speciale' | 'historier' | 'emoji';

export interface MathTypeDefinition {
  id: string;
  label: string;
  icon: string;
  desc: string;
  group: MathTypeGroup;
  /** Vis operator-pills under togglen når typen er slået til */
  supportsOps: boolean;
}

export interface FarvandDef {
  name: string;
  desc: string;
  allowedMathTypes: string[];
  /** Hvilke operatorer pills-UI må tilbyde per opgavetype i dette farvand */
  typeOpsAvailable: Record<string, string[]>;
  canUseDecimal: boolean;
  canUseNegative: boolean;
}

export type FarvandeMap = Record<FarvandId, FarvandDef>;

export type RegnehistorieOp = '+' | '-' | '*' | '/';

/** Addition/subtraktion/multiplikation-skabeloner */
export interface RegnehistorieTemplateBase {
  type: RegnehistorieOp;
  template: string;
  unit: string;
}

export interface RegnehistorieAddSubMul extends RegnehistorieTemplateBase {
  type: '+' | '-' | '*';
  minA: number;
  maxA: number;
  minB: number;
  maxB: number;
  cond?: (a: number, b: number) => boolean;
}

export interface RegnehistorieDiv extends RegnehistorieTemplateBase {
  type: '/';
  totalMin: number;
  totalMax: number;
  divOptions: number[];
}

export type RegnehistorieTemplate = RegnehistorieAddSubMul | RegnehistorieDiv;

export interface LetteRegnehistorieTemplate {
  type: '+';
  template: string;
  unit: string;
  minA: number;
  maxA: number;
  minB: number;
  maxB: number;
}

export type MathDifficulty = 'beginner' | 'intermediate' | 'expert';

/** Legacy 1–3 sværhed til tilfældig op-vælger i basic-mode */
export type BasicDifficultyTier = 1 | 2 | 3;

/** Genereret regnestykke til MathChallenge / zen */
export interface MathProblem {
  question: string;
  answer: number;
  difficulty: number;
  op: string;
  category: string;
  displayType: string;
  unit?: string;
  xpBonus?: number;
  isDecimal?: boolean;
  emojiData?: EmojiData;
  emojiChoiceData?: EmojiChoiceData;
  emojiSizeData?: EmojiSizeData;
  emojiAntalData?: EmojiAntalData;
  emojiHalvdelData?: EmojiHalvdelData;
  emojiEvenOddData?: EmojiEvenOddData;
  emojiPatternData?: EmojiPatternData;
  emojiSortData?: EmojiSortData;
  emojiEqualizeData?: EmojiEqualizeData;
  emojiFractionData?: EmojiFractionData;
  emojiPercentData?: EmojiPercentData;
  fractionDecimalData?: FractionDecimalData;
}

```

### B. `src/data/math-config.ts`

**src/data/math-config.ts**

```typescript
import type {
  FarvandeMap,
  MathTypeDefinition,
  MathTypeGroup,
  RegnehistorieTemplate,
  LetteRegnehistorieTemplate,
} from '../types/math.js';

export const MATH_TYPE_GROUP_ORDER: MathTypeGroup[] = [
  'regnearter',
  'talforståelse',
  'speciale',
  'historier',
  'emoji',
];

export const MATH_TYPE_GROUP_LABEL: Record<MathTypeGroup, string> = {
  regnearter: 'Regnearter',
  talforståelse: 'Talforståelse',
  speciale: 'Speciale',
  historier: 'Historier',
  emoji: 'Emoji',
};

export const MATH_TYPE_DEFS: MathTypeDefinition[] = [
  { id: 'plus', label: 'Plus (+)', icon: '➕', desc: 'Addition', group: 'regnearter', supportsOps: false },
  { id: 'minus', label: 'Minus (−)', icon: '➖', desc: 'Subtraktion', group: 'regnearter', supportsOps: false },
  { id: 'gange', label: 'Gange (×)', icon: '✖️', desc: 'Multiplikation', group: 'regnearter', supportsOps: false },
  { id: 'division', label: 'Division (÷)', icon: '➗', desc: 'Division', group: 'regnearter', supportsOps: false },
  {
    id: 'tenfriends',
    label: "10'er-venner",
    icon: '🎯',
    desc: '? + 3 = 10 — find det manglende tal',
    group: 'talforståelse',
    supportsOps: false,
  },
  {
    id: '100friends',
    label: "100'er-venner",
    icon: '🎯',
    desc: '90 + ? = 100 — hele tiere',
    group: 'talforståelse',
    supportsOps: false,
  },
  {
    id: 'skaeve100friends',
    label: "Skæve 100'er-venner",
    icon: '🎯',
    desc: '37 + ? = 100 — alle tal 1–99',
    group: 'talforståelse',
    supportsOps: false,
  },
  {
    id: 'afrunding',
    label: 'Afrunding',
    icon: '🎯',
    desc: 'Afrund til nærmeste 10, 100 eller 1.000',
    group: 'talforståelse',
    supportsOps: false,
  },
  {
    id: 'taelleraekke',
    label: 'Tællerækker',
    icon: '🔢',
    desc: 'Find næste tal i rækken',
    group: 'talforståelse',
    supportsOps: false,
  },
  { id: 'multi-term', label: 'Flere led', icon: '📐', desc: '3 led: a + b − c', group: 'speciale', supportsOps: false },
  { id: 'equations', label: 'Ligninger', icon: '🔤', desc: 'Find x: a + x = c', group: 'speciale', supportsOps: false },
  { id: 'decimals', label: 'Decimaler', icon: '🔬', desc: 'Regn med decimaltal', group: 'speciale', supportsOps: false },
  {
    id: 'percent-decimal',
    label: 'Procent ↔ Decimal',
    icon: '%',
    desc: 'Omskriv mellem procent og decimaltal',
    group: 'speciale',
    supportsOps: false,
  },
  {
    id: 'fraction-decimal',
    label: 'Brøk ↔ Decimal',
    icon: '🔢',
    desc: 'Omskriv mellem brøk og decimaltal',
    group: 'speciale',
    supportsOps: false,
  },
  {
    id: 'regnehistorier',
    label: 'Regnehistorier',
    icon: '📖',
    desc: 'Tekstopgaver med hajer & fisk',
    group: 'historier',
    supportsOps: true,
  },
  {
    id: 'lette-historier',
    label: 'Regnehistorier',
    icon: '🧸',
    desc: 'Korte historier om antal',
    group: 'historier',
    supportsOps: false,
  },
  {
    id: 'emoji-antal',
    label: 'Antal',
    icon: '🔢',
    desc: 'Tæl emojis — hvor mange er der?',
    group: 'emoji',
    supportsOps: false,
  },
  {
    id: 'emoji-counting',
    label: 'Emoji-tælling',
    icon: '🎯',
    desc: 'Tæl emojis og regn!',
    group: 'emoji',
    supportsOps: true,
  },
  {
    id: 'emoji-most-least',
    label: 'Flest / færrest',
    icon: '⚖️',
    desc: 'Tryk på den rigtige kasse',
    group: 'emoji',
    supportsOps: false,
  },
  {
    id: 'emoji-size-compare',
    label: 'Størst / mindst',
    icon: '🔍',
    desc: 'Tryk på de store eller små',
    group: 'emoji',
    supportsOps: false,
  },
  {
    id: 'emoji-half',
    label: 'Find halvdelen',
    icon: '✂️',
    desc: 'Hvor meget er halvdelen?',
    group: 'emoji',
    supportsOps: false,
  },
  {
    id: 'emoji-double',
    label: 'Find det dobbelte',
    icon: '🔄',
    desc: 'Hvor meget er det dobbelte?',
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
    label: 'Fortsæt mønstret',
    icon: '🔮',
    desc: 'Hvilket symbol mangler i rækkefølgen?',
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
    label: 'Samme antal',
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
];

export const FARVANDE = {
  kysten: {
    name: '🏖️ Kysten',
    desc: '0.–3. klasse',
    allowedMathTypes: [
      'plus',
      'minus',
      'tenfriends',
      '100friends',
      'lette-historier',
      'emoji-antal',
      'emoji-counting',
      'emoji-most-least',
      'emoji-size-compare',
      'emoji-half',
      'emoji-double',
      'emoji-even-odd',
      'emoji-pattern',
      'emoji-sort',
      'emoji-equalize',
      'taelleraekke',
    ],
    typeOpsAvailable: {
      'emoji-counting': ['+', '-'],
    },
    canUseDecimal: false,
    canUseNegative: false,
  },
  aabenhav: {
    name: '⛵ Det Åbne Hav',
    desc: '4.–6. klasse',
    allowedMathTypes: [
      'plus',
      'minus',
      'gange',
      'division',
      'tenfriends',
      'skaeve100friends',
      'afrunding',
      'multi-term',
      'decimals',
      'percent-decimal',
      'fraction-decimal',
      'regnehistorier',
      'emoji-counting',
      'emoji-fraction',
      'emoji-percent',
      'taelleraekke',
    ],
    typeOpsAvailable: {
      'emoji-counting': ['+', '-', '*', '/'],
      regnehistorier: ['+', '-', '*', '/'],
    },
    canUseDecimal: false,
    canUseNegative: false,
  },
  dybet: {
    name: '🐋 Dybet',
    desc: '7.–9. klasse',
    allowedMathTypes: [
      'plus',
      'minus',
      'gange',
      'division',
      'multi-term',
      'equations',
      'decimals',
      'afrunding',
      'percent-decimal',
      'fraction-decimal',
      'taelleraekke',
    ],
    typeOpsAvailable: {},
    canUseDecimal: true,
    canUseNegative: true,
  },
} as const satisfies FarvandeMap;

export function getDifficultyMultiplier(difficulty: string): number {
  if (difficulty === 'expert') return 10;
  if (difficulty === 'intermediate') return 4;
  return 1;
}

export const REGNEHISTORIE_TEMPLATES: RegnehistorieTemplate[] = [
  // + (addition)
  { type: '+', template: "Der svømmer {a} fisk i havet, og {b} gemmer sig i tangen – hvor mange fisk er der i alt?", unit: "fisk", minA:8, maxA:35, minB:3, maxB:18 },
  { type: '+', template: "{a} hajer kredser om båden, og der kommer {b} mere – hvor mange hajer er der nu?", unit: "hajer", minA:2, maxA:8, minB:4, maxB:15 },
  { type: '+', template: "En dykker ser {a} hajer om formiddagen og {b} om eftermiddagen – hvor mange i alt?", unit: "hajer", minA:5, maxA:22, minB:3, maxB:14 },

  // − (subtraction)
  { type: '-', template: "En haj koster {a} kr, og du har {b} kr – hvor mange mangler du?", unit: "kr", minA:45, maxA:220, minB:10, maxB:180, cond: (a,b)=>a>b },
  { type: '-', template: "En fisker fanger {a} fisk og sælger {b} – hvor mange har han tilbage?", unit: "fisk", minA:18, maxA:65, minB:5, maxB:28 },
  { type: '-', template: "En haj har {a} tænder – den mister {b} under jagten. Hvor mange har den nu?", unit: "tænder", minA:50, maxA:150, minB:8, maxB:35 },

  // × (multiplication)
  { type: '*', template: "En fiskebutik sælger {a} fisk om dagen – hvor mange på {b} dage?", unit: "fisk", minA:12, maxA:35, minB:3, maxB:7 },
  { type: '*', template: "En haj svømmer {a} km om dagen – hvor langt på {b} dage?", unit: "km", minA:7, maxA:22, minB:3, maxB:6 },
  { type: '*', template: "{b} både fanger hver {a} fisk – hvor mange fisk fanger de tilsammen?", unit: "fisk", minA:8, maxA:25, minB:3, maxB:6 },

  // ÷ (division – altid præcis)
  { type: '/', template: "En båd fanger {total} fisk og deler dem ligeligt mellem {div} fiskere – hvor mange får hver?", unit: "fisk", totalMin:24, totalMax:96, divOptions:[3,4,6,8] },
  { type: '/', template: "{total} liter saltvand fordeles på {div} akvarier – hvor mange liter er der i hvert?", unit: "liter", totalMin:36, totalMax:120, divOptions:[4,6,9] },
  { type: '/', template: "{total} hajtænder fordeles på {div} hajer – hvor mange tænder har hver?", unit: "tænder", totalMin:48, totalMax:96, divOptions:[6,8] }
];

export const LETTE_REGNEHISTORIE_TEMPLATES: LetteRegnehistorieTemplate[] = [
  // ── Generelle lette kyst-historier (strand & hav) ──
  { type: '+', template: "Der svømmer {a} fisk. Der kommer {b} mere. Hvor mange er der nu?", unit: "fisk", minA:1, maxA:3, minB:1, maxB:3 },
  { type: '+', template: "Du ser {a} krabber. Din ven ser {b} krabber. Hvor mange krabber ser I tilsammen?", unit: "krabber", minA:1, maxA:4, minB:1, maxB:3 },
  { type: '+', template: "Vi finder {a} muslinger. Så finder vi {b} mere. Hvor mange muslinger har vi?", unit: "muslinger", minA:2, maxA:4, minB:1, maxB:2 },
  { type: '+', template: "Der ligger {a} håndklæder på stranden. Nogen lægger {b} mere. Hvor mange håndklæder er der nu?", unit: "håndklæder", minA:1, maxA:3, minB:1, maxB:3 },
  { type: '+', template: "Du ser {a} bølger. Så kommer der {b} mere. Hvor mange bølger er det i alt?", unit: "bølger", minA:2, maxA:4, minB:1, maxB:3 },
  { type: '+', template: "Der er {a} ispinde i fryseren. Far køber {b} mere. Hvor mange ispinde er der nu?", unit: "ispinde", minA:1, maxA:3, minB:1, maxB:3 },
  { type: '+', template: "Du tæller {a} måger på molen. Der lander {b} mere. Hvor mange måger er der nu?", unit: "måger", minA:2, maxA:4, minB:1, maxB:3 },
  { type: '+', template: "Der sejler {a} både i havnen. Der kommer {b} mere. Hvor mange både er der nu?", unit: "både", minA:1, maxA:3, minB:1, maxB:3 },
  { type: '+', template: "Du samler {a} sten på stranden. Din søster finder {b} mere. Hvor mange sten har I?", unit: "sten", minA:2, maxA:4, minB:1, maxB:3 },
  { type: '+', template: "Der er {a} sandslotte. I bygger {b} mere. Hvor mange sandslotte er der nu?", unit: "sandslotte", minA:1, maxA:3, minB:1, maxB:2 },
  { type: '+', template: "Du har {a} skaller i lommen. Du finder {b} mere. Hvor mange skaller har du nu?", unit: "skaller", minA:1, maxA:3, minB:1, maxB:3 },
  { type: '+', template: "Der er {a} søstjerner i vandkanten. Du opdager {b} mere. Hvor mange søstjerner er der i alt?", unit: "søstjerner", minA:1, maxA:3, minB:1, maxB:2 },

  // ── Solbriller, is og sandaler (12 stk) ──
  { type: '+', template: "Du har {a} solbriller. Din ven giver dig {b} mere. Hvor mange solbriller har du nu?", unit: "solbriller", minA:1, maxA:4, minB:1, maxB:3 },
  { type: '+', template: "Der er {a} solbriller i tasken. Mor lægger {b} mere i. Hvor mange solbriller er der nu?", unit: "solbriller", minA:1, maxA:3, minB:1, maxB:2 },
  { type: '+', template: "Du ser {a} par solbriller i butikken. Du finder {b} par mere. Hvor mange par er der i alt?", unit: "par solbriller", minA:2, maxA:4, minB:1, maxB:3 },
  { type: '+', template: "Du køber {a} kugler is. Din ven køber {b} kugler is. Hvor mange kugler is har I tilsammen?", unit: "kugler is", minA:1, maxA:3, minB:1, maxB:3 },
  { type: '+', template: "Der er {a} is i fryseren. Far lægger {b} mere derind. Hvor mange is er der nu?", unit: "is", minA:2, maxA:4, minB:1, maxB:3 },
  { type: '+', template: "Du spiser {a} kugler is. Så får du {b} kugler mere. Hvor mange kugler is har du spist i alt?", unit: "kugler is", minA:1, maxA:3, minB:1, maxB:2 },
  { type: '+', template: "Der står {a} is i kiosken. Manden sætter {b} flere frem. Hvor mange is er der nu?", unit: "is", minA:2, maxA:4, minB:1, maxB:3 },
  { type: '+', template: "Du har {a} par sandaler. Du får {b} nye par. Hvor mange par sandaler har du nu?", unit: "par sandaler", minA:1, maxA:3, minB:1, maxB:2 },
  { type: '+', template: "Der står {a} par sandaler ved døren. Nogen stiller {b} par mere. Hvor mange par er der nu?", unit: "par sandaler", minA:1, maxA:3, minB:1, maxB:3 },
  { type: '+', template: "Du tæller {a} par sandaler i butikken. Du finder {b} par mere. Hvor mange par er der i alt?", unit: "par sandaler", minA:2, maxA:4, minB:1, maxB:2 },
  { type: '+', template: "Der ligger {a} par sandaler på stranden. Der kommer {b} par mere. Hvor mange par er der nu?", unit: "par sandaler", minA:1, maxA:3, minB:1, maxB:3 },

  // ── Solcreme (5 stk) ──
  { type: '+', template: "Du har {a} tube solcreme. Mor giver dig {b} mere. Hvor mange tuber har du nu?", unit: "tuber solcreme", minA:1, maxA:4, minB:1, maxB:2 },
  { type: '+', template: "Der er {a} tuber solcreme i strandtasken. Far putter {b} mere i. Hvor mange tuber er der nu?", unit: "tuber solcreme", minA:1, maxA:3, minB:1, maxB:2 },
  { type: '+', template: "Du ser {a} tuber solcreme i butikken. Din ven finder {b} mere. Hvor mange tuber er der i alt?", unit: "tuber solcreme", minA:2, maxA:4, minB:1, maxB:2 },
  { type: '+', template: "Der ligger {a} tube solcreme på håndklædet. Nogen lægger {b} mere. Hvor mange tuber er der nu?", unit: "tuber solcreme", minA:1, maxA:3, minB:1, maxB:2 },
  { type: '+', template: "Du pakker {a} tube solcreme i tasken. Mor pakker {b} mere. Hvor mange tuber er der i tasken?", unit: "tuber solcreme", minA:1, maxA:3, minB:1, maxB:3 },
];


```

### C. `src/logic/math-engine.ts`

**src/logic/math-engine.ts**

```typescript
import type {
  EmojiSizeLevel,
  FarvandDef,
  FarvandId,
  MathDifficulty,
  MathProblem,
  RegnehistorieTemplate,
} from '../types/math.js';
import {
  FARVANDE,
  getDifficultyMultiplier,
  LETTE_REGNEHISTORIE_TEMPLATES,
  REGNEHISTORIE_TEMPLATES,
} from '../data/math-config.js';

/**
 * Formaterer et tal med den valgte decimalseparator.
 * Bruges i spørgsmålstekster og abe-hints.
 */
export function formatDecimal(n: number, separator: ',' | '.'): string {
  const s = String(n);
  return separator === ',' ? s.replace('.', ',') : s;
}

/** Hav/fiske-tema — delt af alle emoji-opgavetyper */
export const EMOJI_POOL: string[] = [
  '⚓',
  '🏴‍☠️',
  '🐟',
  '🐠',
  '🐡',
  '🐳',
  '🐋',
  '🐬',
  '🦭',
  '🦈',
  '🐙',
  '🦑',
  '🦀',
  '🦞',
  '🦐',
  '🪼',
  '🪸',
  '🐚',
  '🦪',
  '🐢',
  '🦦',
  '🪱',
  '🎣',
  '🪝',
  '⛵',
  '🚤',
  '🛥️',
  '🛶',
  '🏖️',
  '🏝️',
  '⛱️',
  '🌴',
  '🌅',
  '☀️',
  '☁️',
  '🧭',
  '🗺️',
  '🤿',
  '🛟',
  '🧜',
  '🧜‍♀️',
  '🧜‍♂️',
  '🦜',
  '🪙',
  '🚢',
  '💰',
  '🐦',
  '🌞',
  '🌤️',
  '🏄',
  '🏊',
];

export const EMOJI_SIZES = {
  small: { fontSize: '1.2rem', label: 'lille' },
  medium: { fontSize: '2rem', label: 'mellem' },
  large: { fontSize: '3.2rem', label: 'stor' },
} as const;

export const SIZE_PAIRS: [EmojiSizeLevel, EmojiSizeLevel][] = [
  ['small', 'medium'],
  ['small', 'large'],
  ['medium', 'large'],
];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getCountForSize(size: EmojiSizeLevel): number {
  switch (size) {
    case 'small':
      return randInt(4, 7);
    case 'medium':
      return randInt(2, 5);
    case 'large':
      return randInt(1, 3);
    default:
      return randInt(2, 5);
  }
}

export function generateEmojiCountingProblem(
  selectedOps: string[],
  selectedFarvand: 'kysten' | 'aabenhav',
  mathDifficulty: MathDifficulty
): MathProblem {
  const valid = selectedOps.filter((o): o is '+' | '-' | '*' | '/' =>
    o === '+' || o === '-' || o === '*' || o === '/',
  );
  const ops: ('+' | '-' | '*' | '/')[] =
    valid.length > 0 ? valid : [selectedFarvand === 'kysten' ? '+' : '+'];
  const op = ops[Math.floor(Math.random() * ops.length)]!;

  const emoji = EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)]!;

  const maxResult =
    selectedFarvand === 'kysten' && mathDifficulty === 'beginner' ? 10 : 20;

  let a: number;
  let b: number;
  let answer: number;

  if (op === '+') {
    const maxA = maxResult === 10 ? 9 : 10;
    a = randInt(1, maxA);
    const maxB = Math.min(10, maxResult - a);
    b = randInt(1, maxB);
    answer = a + b;
  } else if (op === '-') {
    a = randInt(2, 10);
    b = randInt(1, a - 1);
    answer = a - b;
  } else if (op === '*') {
    a = randInt(1, 10);
    b = randInt(1, 10);
    answer = a * b;
  } else {
    b = randInt(1, 10);
    const maxQuotient = Math.floor(10 / b);
    const quotient = randInt(1, maxQuotient);
    a = b * quotient;
    answer = quotient;
  }

  const leftEmojis = emoji.repeat(a);
  const rightEmojis = emoji.repeat(b);
  const opSymbol = op === '*' ? '×' : op === '/' ? '÷' : op === '-' ? '−' : op;
  const question = `${leftEmojis} ${opSymbol} ${rightEmojis}`;

  return {
    question,
    answer,
    difficulty: selectedFarvand === 'kysten' ? 1 : 2,
    op,
    category: 'emoji-counting',
    displayType: 'emoji-counting',
    xpBonus: 15,
    isDecimal: false,
    emojiData: {
      emoji,
      leftCount: a,
      rightCount: b,
      operator: op,
    },
  };
}

export function generateEmojiMostLeastProblem(): MathProblem {
  const mode: 'most' | 'least' = Math.random() < 0.5 ? 'most' : 'least';
  const leftEmoji = EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)]!;
  const rightEmoji = EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)]!;
  const countA = randInt(1, 10);
  let countB = randInt(1, 10);
  while (countB === countA) {
    countB = randInt(1, 10);
  }
  const correctSide: 'left' | 'right' =
    mode === 'most' ? (countA > countB ? 'left' : 'right') : countA < countB ? 'left' : 'right';
  const question = mode === 'most' ? 'Tryk på den med FLEST!' : 'Tryk på den med FÆRREST!';
  return {
    question,
    answer: -1,
    difficulty: 1,
    op: '+',
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
      correctSide,
    },
  };
}

export function generateEmojiSizeCompareProblem(): MathProblem {
  const mode: 'biggest' | 'smallest' = Math.random() < 0.5 ? 'biggest' : 'smallest';
  const emoji = EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)]!;
  const pair = SIZE_PAIRS[Math.floor(Math.random() * SIZE_PAIRS.length)]!;
  const swapped = Math.random() < 0.5;
  const leftSize: EmojiSizeLevel = swapped ? pair[1]! : pair[0]!;
  const rightSize: EmojiSizeLevel = swapped ? pair[0]! : pair[1]!;
  const leftCount = getCountForSize(leftSize);
  const rightCount = getCountForSize(rightSize);
  const sizeRank: Record<EmojiSizeLevel, number> = { small: 1, medium: 2, large: 3 };
  const correctSide: 'left' | 'right' =
    mode === 'biggest'
      ? sizeRank[leftSize] > sizeRank[rightSize]
        ? 'left'
        : 'right'
      : sizeRank[leftSize] < sizeRank[rightSize]
        ? 'left'
        : 'right';
  const question = mode === 'biggest' ? 'Tryk på de STØRSTE!' : 'Tryk på de MINDSTE!';
  return {
    question,
    answer: -1,
    difficulty: 1,
    op: '+',
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
      correctSide,
    },
  };
}

export function generateEmojiAntalProblem(mathDifficulty: MathDifficulty): MathProblem {
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

export function generateEmojiHalfProblem(): MathProblem {
  const evenNumbers = [2, 4, 6, 8, 10];
  const count = evenNumbers[Math.floor(Math.random() * evenNumbers.length)]!;
  const answer = count / 2;
  const emoji = EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)]!;

  return {
    question: 'Hvor meget er halvdelen?',
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

export function generateEmojiDoubleProblem(): MathProblem {
  const count = randInt(1, 5);
  const answer = count * 2;
  const emoji = EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)]!;

  return {
    question: 'Hvor meget er det dobbelte?',
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

export function generateEmojiEqualizeProblem(): MathProblem {
  const emoji = EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)]!;
  let a = randInt(1, 10);
  let b = randInt(1, 10);
  while (b === a) b = randInt(1, 10);

  const leftCount = Math.max(a, b);
  const rightCount = Math.min(a, b);
  const difference = leftCount - rightCount;

  const swapped = Math.random() < 0.5;

  return {
    question: 'Hvor mange mangler, så der er lige mange?',
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

export function generateEmojiEvenOddProblem(): MathProblem {
  const count = randInt(1, 10);
  const isEven = count % 2 === 0;
  const emoji = EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)]!;

  return {
    question: 'Er antallet lige eller ulige?',
    answer: -1,
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

export function generateEmojiPatternProblem(): MathProblem {
  const roll = Math.random();
  let patternType: PatternType;
  if (roll < 0.4) patternType = 'AB';
  else if (roll < 0.6) patternType = 'ABB';
  else if (roll < 0.8) patternType = 'AAB';
  else if (roll < 0.95) patternType = 'ABC';
  else patternType = 'ABAC';

  let cycle: number[];
  let emojiCount: number;

  switch (patternType) {
    case 'AB':
      cycle = [0, 1];
      emojiCount = 2;
      break;
    case 'ABB':
      cycle = [0, 1, 1];
      emojiCount = 2;
      break;
    case 'AAB':
      cycle = [0, 0, 1];
      emojiCount = 2;
      break;
    case 'ABC':
      cycle = [0, 1, 2];
      emojiCount = 3;
      break;
    case 'ABAC':
      cycle = [0, 1, 0, 2];
      emojiCount = 3;
      break;
  }

  const emojis = pickDistinctEmojis(emojiCount);

  const fullCycles = 2;
  const sequence: string[] = [];
  for (let c = 0; c < fullCycles; c++) {
    for (const idx of cycle) sequence.push(emojis[idx]!);
  }
  for (let i = 0; i < cycle.length - 1; i++) {
    sequence.push(emojis[cycle[i]!]!);
  }

  const correctNext = emojis[cycle[cycle.length - 1]!]!;

  const uniqueInPattern = [...new Set([...emojis])];
  const choices = [...uniqueInPattern];
  if (choices.length < 2) {
    const extra = EMOJI_POOL.find((e) => !choices.includes(e))!;
    choices.push(extra);
  }
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j]!, choices[i]!];
  }

  return {
    question: 'Hvilket symbol mangler i rækkefølgen?',
    answer: -1,
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

export function generateEmojiSortProblem(): MathProblem {
  const mode: 'asc' | 'desc' = Math.random() < 0.5 ? 'asc' : 'desc';

  const counts: number[] = [];
  while (counts.length < 3) {
    const n = randInt(1, 10);
    if (!counts.includes(n)) counts.push(n);
  }

  const emojis = pickDistinctEmojis(3);

  const boxes = counts.map((count, i) => ({
    emoji: emojis[i]!,
    count,
  }));

  const sorted = [...boxes.map((b, i) => ({ count: b.count, idx: i }))].sort((a, b) =>
    mode === 'asc' ? a.count - b.count : b.count - a.count,
  );
  const correctOrder = sorted.map((s) => s.idx);

  return {
    question:
      mode === 'asc'
        ? 'Tryk i rækkefølge: færrest til flest!'
        : 'Tryk i rækkefølge: flest til færrest!',
    answer: -1,
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

  const distractors = FRACTION_DISTRACTORS[highlighted]!.filter((d) => d !== correctFraction);
  const numDistractors = Math.min(distractors.length, randInt(2, 3));
  const shuffledDistractors = [...distractors]
    .sort(() => Math.random() - 0.5)
    .slice(0, numDistractors);

  const choices = [correctFraction, ...shuffledDistractors].sort(() => Math.random() - 0.5);

  return {
    question: 'Hvor stor en del er fremhævet?',
    answer: -1,
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

export function generateEmojiPercentProblem(): MathProblem {
  const highlighted = randInt(1, 10);
  const correctPercent = highlighted * 10;
  const emoji = EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)]!;

  return {
    question: 'Hvor mange procent er fremhævet?',
    answer: correctPercent,
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

function retEntalFlertal(tekst: string): string {
  let resultat = tekst;
  const entalMap: Record<string, string> = {
    hajer: 'haj',
    krabber: 'krabbe',
    muslinger: 'musling',
    håndklæder: 'håndklæde',
    bølger: 'bølge',
    ispinde: 'ispind',
    måger: 'måge',
    både: 'båd',
    sandslotte: 'sandslot',
    skaller: 'skal',
    søstjerner: 'søstjerne',
    'kugler is': 'kugle is',
    dage: 'dag',
    tænder: 'tand',
    fiskere: 'fisker',
    akvarier: 'akvarie',
    tuber: 'tube',
    flasker: 'flaske',
    poser: 'pose',
    solcremer: 'solcreme',
  };
  for (const [flertal, ental] of Object.entries(entalMap)) {
    const regex = new RegExp(`\\b1 ${flertal}\\b`, 'gi');
    resultat = resultat.replace(regex, `1 ${ental}`);
  }
  const flertalMap: Record<string, string> = {
    tube: 'tuber',
    solcreme: 'solcremer',
    flaske: 'flasker',
    pose: 'poser',
  };
  for (const [ental, flertal] of Object.entries(flertalMap)) {
    const regex = new RegExp(`\\b([2-9]|[1-9][0-9]+) ${ental}\\b`, 'gi');
    resultat = resultat.replace(regex, `$1 ${flertal}`);
  }
  return resultat;
}

export function generateRegneHistorie(
  mathDifficulty: MathDifficulty,
  opsForType: string[]
): MathProblem | null {
  const opsToCheck =
    opsForType.length > 0
      ? opsForType.filter((o) => ['+', '-', '*', '/'].includes(o))
      : ['+', '-', '*', '/'];
  const possible = REGNEHISTORIE_TEMPLATES.filter((t) => opsToCheck.includes(t.type));
  if (possible.length === 0) return null;
  const tmpl = possible[Math.floor(Math.random() * possible.length)] as RegnehistorieTemplate;

  const mult = getDifficultyMultiplier(mathDifficulty);
  let a = 0;
  let b = 0;
  let total = 0;
  let div = 0;
  let answer = 0;

  if (tmpl.type === '+') {
    a = Math.floor(Math.random() * (tmpl.maxA * mult - tmpl.minA + 1)) + tmpl.minA;
    b = Math.floor(Math.random() * (tmpl.maxB * mult - tmpl.minB + 1)) + tmpl.minB;
    answer = a + b;
  } else if (tmpl.type === '-') {
    a = Math.floor(Math.random() * (tmpl.maxA * mult - tmpl.minA + 1)) + tmpl.minA;
    b = Math.floor(Math.random() * (tmpl.maxB * mult - tmpl.minB + 1)) + tmpl.minB;
    if (tmpl.cond && !tmpl.cond(a, b)) b = Math.floor(a * 0.6);
    if (b > a) b = Math.floor(a * 0.6);
    answer = a - b;
  } else if (tmpl.type === '*') {
    a = Math.floor(Math.random() * (tmpl.maxA * mult - tmpl.minA + 1)) + tmpl.minA;
    b = Math.floor(Math.random() * (tmpl.maxB * mult - tmpl.minB + 1)) + tmpl.minB;
    answer = a * b;
  } else if (tmpl.type === '/') {
    div = tmpl.divOptions[Math.floor(Math.random() * tmpl.divOptions.length)];
    const base = mathDifficulty === 'beginner' ? 6 : mathDifficulty === 'intermediate' ? 9 : 12;
    answer = (base + Math.floor(Math.random() * 6)) * (mathDifficulty === 'expert' ? 3 : 1);
    total = answer * div;
  }

  let question = tmpl.template
    .replace('{a}', String(a || ''))
    .replace('{b}', String(b || ''))
    .replace('{total}', String(total || ''))
    .replace('{div}', String(div || ''));
  question = retEntalFlertal(question);

  return {
    question,
    answer,
    difficulty: 2,
    op: tmpl.type,
    category: 'regnehistorier',
    displayType: 'regnehistorie',
    unit: tmpl.unit,
    xpBonus: 20,
  };
}

export function generateLetRegneHistorie(mathDifficulty?: MathDifficulty): MathProblem {
  const tmpl =
    LETTE_REGNEHISTORIE_TEMPLATES[
      Math.floor(Math.random() * LETTE_REGNEHISTORIE_TEMPLATES.length)
    ];
  const mult = getDifficultyMultiplier(mathDifficulty || 'beginner');
  const a = Math.floor(Math.random() * (tmpl.maxA * mult - tmpl.minA + 1)) + tmpl.minA;
  const b = Math.floor(Math.random() * (tmpl.maxB * mult - tmpl.minB + 1)) + tmpl.minB;
  const answer = a + b;
  let question = tmpl.template.replace('{a}', String(a)).replace('{b}', String(b));
  question = retEntalFlertal(question);
  return {
    question,
    answer,
    difficulty: 1,
    op: '+',
    category: 'lette-historier',
    displayType: 'regnehistorie',
    unit: tmpl.unit,
    xpBonus: 10,
  };
}

export function generateNumbersForOp(
  op: string,
  mathDifficulty: MathDifficulty
): { a: number; b: number } {
  let a = 0;
  let b = 0;
  if (op === '+') {
    if (mathDifficulty === 'beginner') {
      a = Math.floor(Math.random() * 9) + 1;
      b = Math.floor(Math.random() * 9) + 1;
    } else if (mathDifficulty === 'intermediate') {
      a = Math.floor(Math.random() * 50) + 10;
      b = Math.floor(Math.random() * 40) + 5;
    } else {
      a = Math.floor(Math.random() * 600) + 100;
      b = Math.floor(Math.random() * 500) + 50;
    }
  } else if (op === '-') {
    if (mathDifficulty === 'beginner') {
      a = Math.floor(Math.random() * 9) + 1;
      b = Math.floor(Math.random() * a) + 1;
    } else if (mathDifficulty === 'intermediate') {
      a = Math.floor(Math.random() * 70) + 20;
      b = Math.floor(Math.random() * (a - 1)) + 1;
    } else {
      a = Math.floor(Math.random() * 700) + 200;
      b = Math.floor(Math.random() * (a - 1)) + 1;
    }
  } else if (op === '*') {
    if (mathDifficulty === 'beginner') {
      const easyTables = [1, 2, 5, 10];
      a = easyTables[Math.floor(Math.random() * easyTables.length)];
      b = Math.floor(Math.random() * 10) + 1;
    } else if (mathDifficulty === 'intermediate') {
      a = Math.floor(Math.random() * 7) + 3;
      b = Math.floor(Math.random() * 7) + 3;
    } else {
      a = Math.floor(Math.random() * 30) + 10;
      b = Math.floor(Math.random() * 9) + 2;
    }
  } else {
    if (mathDifficulty === 'beginner') {
      const easyDivisors = [1, 2, 5, 10];
      b = easyDivisors[Math.floor(Math.random() * easyDivisors.length)];
      const ans = Math.floor(Math.random() * 9) + 1;
      a = b * ans;
    } else if (mathDifficulty === 'intermediate') {
      b = Math.floor(Math.random() * 7) + 3;
      const ans = Math.floor(Math.random() * 9) + 2;
      a = b * ans;
    } else {
      b = Math.floor(Math.random() * 9) + 2;
      const ans = Math.floor(Math.random() * 15) + 5;
      a = b * ans;
    }
  }
  return { a, b };
}

export function generateTenFriendsProblem(mathDifficulty: MathDifficulty): MathProblem {
  void mathDifficulty;
  const a = Math.floor(Math.random() * 9) + 1;
  const b = 10 - a;
  const showLeft = Math.random() < 0.5;
  return {
    question: showLeft ? `? + ${b} = 10` : `${a} + ? = 10`,
    answer: showLeft ? a : b,
    difficulty: 1,
    op: 'tenfriends',
    category: 'tenfriends',
    displayType: 'text',
  };
}

export function generate100FriendsQuestion(): MathProblem {
  const tiere = [10, 20, 30, 40, 50, 60, 70, 80, 90];
  const valgtTal = tiere[Math.floor(Math.random() * tiere.length)];
  const svar = 100 - valgtTal;

  const typer = [
    `${valgtTal} + ? = 100`,
    `? + ${valgtTal} = 100`,
    `100 − ? = ${valgtTal}`,
    `100 − ${valgtTal} = ?`,
  ];
  const visTekst = typer[Math.floor(Math.random() * typer.length)];

  let answer: number;
  if (visTekst.startsWith('?')) {
    answer = 100 - valgtTal;
  } else if (visTekst.includes('+ ?')) {
    answer = svar;
  } else if (visTekst.endsWith('= ?')) {
    answer = svar;
  } else {
    answer = svar;
  }

  return {
    question: visTekst,
    answer,
    difficulty: 1,
    op: '100friends',
    category: '100friends',
    displayType: 'text',
  };
}

export function generateSkaeve100FriendsQuestion(): MathProblem {
  const valgtTal = Math.floor(Math.random() * 99) + 1;
  const svar = 100 - valgtTal;

  const typer = [
    `${valgtTal} + ? = 100`,
    `? + ${valgtTal} = 100`,
    `100 − ? = ${valgtTal}`,
    `100 − ${valgtTal} = ?`,
  ];
  const visTekst = typer[Math.floor(Math.random() * typer.length)];

  let answer: number;
  if (visTekst.startsWith('?')) {
    answer = 100 - valgtTal;
  } else if (visTekst.includes('+ ?')) {
    answer = svar;
  } else if (visTekst.endsWith('= ?')) {
    answer = svar;
  } else {
    answer = svar;
  }

  return {
    question: visTekst,
    answer,
    difficulty: 2,
    op: 'skaeve100friends',
    category: 'skaeve100friends',
    displayType: 'text',
    xpBonus: 20,
  };
}

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

export function generateMultiTermProblem(mathDifficulty: MathDifficulty, _retries = 0): MathProblem {
  // Sikkerhedsnet: efter 20 fejlede forsøg, returner en simpel addition
  if (_retries > 20) {
    return generateBasicFromOp('+', mathDifficulty, 3);
  }

  const ops = ['+', '-'];
  const op1 = ops[Math.floor(Math.random() * ops.length)];
  const op2 = ops[Math.floor(Math.random() * ops.length)];
  let a = 0;
  let b = 0;
  let c = 0;
  if (mathDifficulty === 'beginner') {
    a = Math.floor(Math.random() * 8) + 2;
    b = Math.floor(Math.random() * 5) + 1;
    c = Math.floor(Math.random() * 5) + 1;
  } else if (mathDifficulty === 'intermediate') {
    a = Math.floor(Math.random() * 30) + 10;
    b = Math.floor(Math.random() * 20) + 5;
    c = Math.floor(Math.random() * 15) + 1;
  } else {
    a = Math.floor(Math.random() * 200) + 50;
    b = Math.floor(Math.random() * 100) + 20;
    c = Math.floor(Math.random() * 80) + 10;
  }

  // Check mellemresultat efter første operator — undgå negative mellemtrin
  const afterOp1 = op1 === '+' ? a + b : a - b;
  if (afterOp1 < 0) return generateMultiTermProblem(mathDifficulty, _retries + 1);

  // Check slutresultat
  const result = op2 === '+' ? afterOp1 + c : afterOp1 - c;
  if (result < 0) return generateMultiTermProblem(mathDifficulty, _retries + 1);

  const sym1 = op1 === '-' ? '−' : '+';
  const sym2 = op2 === '-' ? '−' : '+';
  return {
    question: `${a} ${sym1} ${b} ${sym2} ${c}`,
    answer: result,
    difficulty: 3,
    op: '*',
    category: 'multi-term',
    displayType: 'text',
  };
}

export function generateEquationProblem(mathDifficulty: MathDifficulty): MathProblem {
  const mult = getDifficultyMultiplier(mathDifficulty);
  const type = Math.floor(Math.random() * 3);
  let question: string;
  let answer: number;
  if (type === 0) {
    const a = Math.floor(Math.random() * 15 * mult) + 1;
    const x = Math.floor(Math.random() * 15 * mult) + 1;
    const c = a + x;
    question = `${a} + x = ${c}`;
    answer = x;
  } else if (type === 1) {
    const x = Math.floor(Math.random() * 20 * mult) + 5;
    const b = Math.floor(Math.random() * (x - 1)) + 1;
    const c = x - b;
    question = `x − ${b} = ${c}`;
    answer = x;
  } else {
    const b =
      Math.floor(Math.random() * (mathDifficulty === 'expert' ? 15 : 8)) + 2;
    const x =
      Math.floor(
        Math.random() *
          (mathDifficulty === 'expert'
            ? 20
            : mathDifficulty === 'intermediate'
              ? 12
              : 10)
      ) + 1;
    const c = b * x;
    question = `${b} × x = ${c}`;
    answer = x;
  }
  return {
    question,
    answer,
    difficulty: 3,
    op: '*',
    category: 'equations',
    displayType: 'text',
  };
}

export function generateDecimalProblem(mathDifficulty: MathDifficulty, separator: ',' | '.' = ','): MathProblem {
  const mult = getDifficultyMultiplier(mathDifficulty);
  const isAdd = Math.random() < 0.6;
  const a = Math.round((Math.random() * 8 * mult + 1) * 10) / 10;
  const b = Math.round((Math.random() * 4 * mult + 0.5) * 10) / 10;
  let result: number;
  if (isAdd) {
    result = Math.round((a + b) * 10) / 10;
    return {
      question: `${formatDecimal(a, separator)} ${isAdd ? '+' : '−'} ${formatDecimal(b, separator)}`,
      answer: result,
      difficulty: 3,
      op: '+',
      category: 'decimals',
      displayType: 'text',
      isDecimal: true,
    };
  }
  const big = Math.max(a, b);
  const small = Math.min(a, b);
  result = Math.round((big - small) * 10) / 10;
  return {
    question: `${formatDecimal(big, separator)} − ${formatDecimal(small, separator)}`,
    answer: result,
    difficulty: 3,
    op: '-',
    category: 'decimals',
    displayType: 'text',
    isDecimal: true,
  };
}

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
    pool = FRACTION_DECIMAL_PAIRS.filter((p) => ['1/2', '1/4', '3/4', '1/10'].includes(p.fraction));
  } else if (mathDifficulty === 'intermediate') {
    pool = FRACTION_DECIMAL_PAIRS.filter((p) =>
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
    const distractors = FRACTION_DECIMAL_PAIRS.filter((p) => p.fraction !== pair.fraction)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((p) => p.fraction);
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

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

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

function difficultyTier(mathDifficulty: MathDifficulty): number {
  if (mathDifficulty === 'beginner') return 1;
  if (mathDifficulty === 'intermediate') return 2;
  return 3;
}

function resolveRegnehistorieOps(fv: FarvandDef, typeOps: Record<string, string[]>): string[] {
  const toa = fv.typeOpsAvailable as Record<string, string[]>;
  const avail = toa['regnehistorier'] ?? ['+', '-', '*', '/'];
  const sel = typeOps['regnehistorier']?.filter((o) => avail.includes(o)) ?? avail;
  return sel.length > 0 ? sel : avail;
}

function resolveEmojiCountingOps(fv: FarvandDef, typeOps: Record<string, string[]>): string[] {
  const toa = fv.typeOpsAvailable as Record<string, string[]>;
  const avail = toa['emoji-counting'] ?? ['+', '-'];
  const sel = typeOps['emoji-counting']?.filter((o) => avail.includes(o)) ?? avail;
  return sel.length > 0 ? sel : avail;
}

function generateBasicFromOp(
  op: string,
  mathDifficulty: MathDifficulty,
  difficultyNum: number
): MathProblem {
  const { a, b } = generateNumbersForOp(op, mathDifficulty);
  const answer = op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : a / b;
  const opSymbol = op === '*' ? '×' : op === '/' ? ':' : op;
  return {
    question: `${a} ${opSymbol} ${b}`,
    answer,
    difficulty: difficultyNum,
    op,
    category: 'basic',
    displayType: 'text',
  };
}

function generateForMathType(
  type: string,
  mathDifficulty: MathDifficulty,
  selectedFarvand: FarvandId,
  typeOps: Record<string, string[]>,
  fv: FarvandDef,
  difficultyNum: number,
  separator: ',' | '.' = ','
): MathProblem | null {
  if (type === 'plus') return generateBasicFromOp('+', mathDifficulty, difficultyNum);
  if (type === 'minus') return generateBasicFromOp('-', mathDifficulty, difficultyNum);
  if (type === 'gange') return generateBasicFromOp('*', mathDifficulty, difficultyNum);
  if (type === 'division') return generateBasicFromOp('/', mathDifficulty, difficultyNum);
  if (type === 'tenfriends') return generateTenFriendsProblem(mathDifficulty);
  if (type === '100friends') return generate100FriendsQuestion();
  if (type === 'skaeve100friends') return generateSkaeve100FriendsQuestion();
  if (type === 'multi-term') return generateMultiTermProblem(mathDifficulty);
  if (type === 'equations') return generateEquationProblem(mathDifficulty);
  if (type === 'decimals') return generateDecimalProblem(mathDifficulty, separator);
  if (type === 'afrunding') return generateAfrundingProblem(mathDifficulty);
  if (type === 'percent-decimal') return generatePercentDecimalProblem(mathDifficulty, separator);
  if (type === 'fraction-decimal') return generateFractionDecimalProblem(mathDifficulty, separator);
  if (type === 'taelleraekke') return generateTaelleraekke(mathDifficulty);
  if (type === 'regnehistorier') {
    const ops = resolveRegnehistorieOps(fv, typeOps);
    return generateRegneHistorie(mathDifficulty, ops);
  }
  if (type === 'lette-historier') return generateLetRegneHistorie(mathDifficulty);
  if (type === 'emoji-antal') return generateEmojiAntalProblem(mathDifficulty);
  if (type === 'emoji-counting') {
    const fvKey: 'kysten' | 'aabenhav' = selectedFarvand === 'aabenhav' ? 'aabenhav' : 'kysten';
    const ops = resolveEmojiCountingOps(fv, typeOps);
    return generateEmojiCountingProblem(ops, fvKey, mathDifficulty);
  }
  if (type === 'emoji-most-least') return generateEmojiMostLeastProblem();
  if (type === 'emoji-size-compare') return generateEmojiSizeCompareProblem();
  if (type === 'emoji-half') return generateEmojiHalfProblem();
  if (type === 'emoji-double') return generateEmojiDoubleProblem();
  if (type === 'emoji-even-odd') return generateEmojiEvenOddProblem();
  if (type === 'emoji-pattern') return generateEmojiPatternProblem();
  if (type === 'emoji-sort') return generateEmojiSortProblem();
  if (type === 'emoji-equalize') return generateEmojiEqualizeProblem();
  if (type === 'emoji-fraction') return generateEmojiFractionProblem();
  if (type === 'emoji-percent') return generateEmojiPercentProblem();
  return null;
}

export function generateMathProblem(
  activeMathTypes: string[],
  mathDifficulty: MathDifficulty,
  selectedFarvand: FarvandId,
  typeOps: Record<string, string[]>,
  separator: ',' | '.' = ','
): MathProblem {
  const fv = FARVANDE[selectedFarvand];
  const allowed = new Set<string>(fv.allowedMathTypes as string[]);
  const types = activeMathTypes.filter((t) => allowed.has(t));
  const pool: string[] = types.length > 0 ? [...types] : ['plus'];
  const difficultyNum = difficultyTier(mathDifficulty);

  for (let attempt = 0; attempt < 80; attempt++) {
    const mathType = pickRandom(pool);
    const p = generateForMathType(mathType, mathDifficulty, selectedFarvand, typeOps, fv, difficultyNum, separator);
    if (p) return p;
  }
  return generateBasicFromOp('+', mathDifficulty, difficultyNum);
}

```

### D. `src/store/useMathStore.ts`

**src/store/useMathStore.ts**

```typescript
import { create } from 'zustand';
import type { FarvandId, MathDifficulty, MathProblem } from '../types/math.js';

interface MathState {
  activeMathTypes: string[];
  typeOps: Record<string, string[]>;
  mathDifficulty: MathDifficulty;
  showMathSettings: boolean;
  mathSettingsTab: string;
  zenMode: boolean;
  zenSkipDelay: number;
  showNumberPad: boolean;
  /** `true` (standard): 1–2–3 øverst; `false`: telefon-layout med 7–8–9 øverst. Gælder touch-numpad. */
  numpadAscendingLayout: boolean;
  showSpecialKeys: boolean;
  isMobile: boolean;
  selectedFarvand: FarvandId | string;
  showSkipButton: boolean;
  revealingAnswer: boolean;
  /** Dansk standard: komma. Kan skiftes til punktum under Avanceret. */
  decimalSeparator: ',' | '.';
  problem: MathProblem | null;
  userAnswer: string;
  timeLeft: number;
  initialTime: number;
  setActiveMathTypes: (v: string[] | ((p: string[]) => string[])) => void;
  setTypeOps: (v: Record<string, string[]> | ((p: Record<string, string[]>) => Record<string, string[]>)) => void;
  setMathDifficulty: (v: MathDifficulty) => void;
  setShowMathSettings: (v: boolean) => void;
  setMathSettingsTab: (v: string) => void;
  setZenMode: (v: boolean) => void;
  setZenSkipDelay: (v: number) => void;
  setShowNumberPad: (v: boolean) => void;
  setNumpadAscendingLayout: (v: boolean) => void;
  setShowSpecialKeys: (v: boolean) => void;
  setIsMobile: (v: boolean) => void;
  setSelectedFarvand: (v: FarvandId | string) => void;
  setShowSkipButton: (v: boolean) => void;
  setRevealingAnswer: (v: boolean) => void;
  setDecimalSeparator: (v: ',' | '.') => void;
  setProblem: (v: MathProblem | null) => void;
  setUserAnswer: (v: string | ((p: string) => string)) => void;
  setTimeLeft: (v: number) => void;
  setInitialTime: (v: number) => void;
}

function resolve<T>(next: T | ((prev: T) => T), prev: T): T {
  return typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
}

/** Synkroniseres ved spilstart med `uiMode` / small-screen (StartScreen), ikke hardkodet 768px. */
export const useMathStore = create<MathState>((set) => ({
  activeMathTypes: ['plus'],
  typeOps: {},
  mathDifficulty: 'beginner',
  showMathSettings: false,
  mathSettingsTab: 'farvand',
  zenMode: false,
  zenSkipDelay: 10,
  showNumberPad: false,
  numpadAscendingLayout: true,
  showSpecialKeys: false,
  isMobile: false,
  selectedFarvand: 'kysten',
  showSkipButton: false,
  revealingAnswer: false,
  decimalSeparator: ',',
  problem: null,
  userAnswer: '',
  timeLeft: 0,
  initialTime: 1,
  setActiveMathTypes: (v) => set((s) => ({ activeMathTypes: resolve(v, s.activeMathTypes) })),
  setTypeOps: (v) => set((s) => ({ typeOps: resolve(v, s.typeOps) })),
  setMathDifficulty: (mathDifficulty) => set({ mathDifficulty }),
  setShowMathSettings: (showMathSettings) => set({ showMathSettings }),
  setMathSettingsTab: (mathSettingsTab) => set({ mathSettingsTab }),
  setZenMode: (zenMode) => set({ zenMode }),
  setZenSkipDelay: (zenSkipDelay) => set({ zenSkipDelay }),
  setShowNumberPad: (showNumberPad) => set({ showNumberPad }),
  setNumpadAscendingLayout: (numpadAscendingLayout) => set({ numpadAscendingLayout }),
  setShowSpecialKeys: (showSpecialKeys) => set({ showSpecialKeys }),
  setIsMobile: (isMobile) => set({ isMobile }),
  setSelectedFarvand: (selectedFarvand) => set({ selectedFarvand }),
  setShowSkipButton: (showSkipButton) => set({ showSkipButton }),
  setRevealingAnswer: (revealingAnswer) => set({ revealingAnswer }),
  setDecimalSeparator: (decimalSeparator) => set({ decimalSeparator }),
  setProblem: (problem) => set({ problem }),
  setUserAnswer: (v) => set((s) => ({ userAnswer: resolve(v, s.userAnswer) })),
  setTimeLeft: (timeLeft) => set({ timeLeft }),
  setInitialTime: (initialTime) => set({ initialTime }),
}));

```

### E. `src/components/mobile/NumberPad.tsx`

**src/components/mobile/NumberPad.tsx**

```tsx
type NumberPadProps = {
  onDigit: (d: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  /** Vis decimal- og minus-tast? Kun relevant i Dybet (7.-9. kl.). */
  showDecimal?: boolean;
  showMinus?: boolean;
  /** Hvilket tegn decimal-tasten viser og sender. Standard ',' */
  decimalKey?: ',' | '.';
  /** `true` (typisk standard): 123 øverst. `false`: klassisk telefon (789 øverst). */
  ascendingDigits?: boolean;
};

export function NumberPad({
  onDigit,
  onBackspace,
  onSubmit,
  showDecimal = false,
  showMinus = false,
  decimalKey = ',',
  /** Match `useMathStore.numpadAscendingLayout` standard (1–2–3 øverst). */
  ascendingDigits = true,
}: NumberPadProps) {
  const digitBlock = ascendingDigits
    ? (['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const)
    : (['7', '8', '9', '4', '5', '6', '1', '2', '3'] as const);
  const keys = [
    ...digitBlock,
    '0',
    showDecimal ? decimalKey : null,
    showMinus ? '-' : null,
  ].filter((k): k is string => k !== null);

  /** Uden decimal/minus er der kun 10 cifre — sidste række er kun "0"; spænd over alle tre kolonner så der ikke er tomme felter. */
  const digitsOnlyPad = !showDecimal && !showMinus;

  return (
    <div className="mt-4 grid min-h-0 w-full min-w-0 max-w-full grid-cols-3 gap-2 [@media(max-height:460px)]:mt-2 [@media(max-height:460px)]:gap-1.5">
      {keys.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onDigit(k)}
          className={`touch-manipulation min-h-[44px] min-w-0 rounded-2xl bg-slate-700 px-1 py-4 text-2xl font-black text-white transition-colors hover:bg-slate-600 active:scale-95 [@media(max-height:460px)]:py-2 [@media(max-height:460px)]:text-xl${
            digitsOnlyPad && k === '0' ? ' col-span-3' : ''
          }`}
        >
          {k}
        </button>
      ))}
      <button
        type="button"
        onClick={onBackspace}
        className="touch-manipulation min-h-[44px] min-w-0 rounded-2xl bg-slate-800 px-1 py-4 text-sm font-bold text-slate-300 hover:bg-slate-700 [@media(max-height:460px)]:py-2 [@media(max-height:460px)]:text-xs"
      >
        ⌫
      </button>
      <button
        type="button"
        onClick={onSubmit}
        className="touch-manipulation col-span-2 min-h-[44px] min-w-0 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-2 py-4 text-lg font-black text-white hover:from-emerald-600 hover:to-cyan-600 [@media(max-height:460px)]:py-2 [@media(max-height:460px)]:text-base"
      >
        OK
      </button>
    </div>
  );
}

```

### F. Uddrag `src/logic/game-persistence.ts` (matematik)

**src/logic/game-persistence.ts (uddrag)**

```typescript
function pickMath(s: ReturnType<typeof useMathStore.getState>) {
  return {
    activeMathTypes: s.activeMathTypes,
    typeOps: s.typeOps,
    mathDifficulty: s.mathDifficulty,
    selectedFarvand: s.selectedFarvand,
    zenMode: s.zenMode,
    zenSkipDelay: s.zenSkipDelay,
    showNumberPad: s.showNumberPad,
    numpadAscendingLayout: s.numpadAscendingLayout,
    showSpecialKeys: s.showSpecialKeys,
  } as Record<string, unknown>;
}



const amt = (data as { activeMathTypes?: string[] }).activeMathTypes;
  if (Array.isArray(amt) && amt.length > 0 && amt.every((x) => typeof x === 'string')) {
    m.setActiveMathTypes(amt);
  }
  const to = (data as { typeOps?: Record<string, unknown> }).typeOps;
  if (to && typeof to === 'object' && !Array.isArray(to)) {
    const next: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(to)) {
      if (Array.isArray(v) && v.every((x) => typeof x === 'string')) next[k] = v as string[];
    }
    if (Object.keys(next).length > 0) m.setTypeOps(next);
  }
  const md = (data as { mathDifficulty?: string }).mathDifficulty;
  if (md === 'easy') m.setMathDifficulty('beginner');
  else if (md === 'beginner' || md === 'intermediate' || md === 'expert') m.setMathDifficulty(md);
  const sf = (data as { selectedFarvand?: string }).selectedFarvand;
  if (typeof sf === 'string') m.setSelectedFarvand(sf);
  if (typeof (data as { zenMode?: boolean }).zenMode === 'boolean') {
    m.setZenMode((data as { zenMode: boolean }).zenMode);
  }
  const zsd = num((data as { zenSkipDelay?: number }).zenSkipDelay);
  if (zsd !== undefined) m.setZenSkipDelay(zsd);
  if (typeof (data as { showNumberPad?: boolean }).showNumberPad === 'boolean') {
    m.setShowNumberPad((data as { showNumberPad: boolean }).showNumberPad);
  }
  {
    const nal = (data as { numpadAscendingLayout?: unknown }).numpadAscendingLayout;
    if (typeof nal === 'boolean') {
      m.setNumpadAscendingLayout(nal);
    } else {
      /** Legacy saves uden felt — standard er 1–2–3 øverst (matcher `useMathStore`). */
      m.setNumpadAscendingLayout(true);
    }
  }
  if (typeof (data as { showSpecialKeys?: boolean }).showSpecialKeys === 'boolean') {
    m.setShowSpecialKeys((data as { showSpecialKeys: boolean }).showSpecialKeys);
  }

  

// bootstrapPersistence (uddrag – showNumberPad ved mobile efter save-migration)
const pUm = preserved.uiMode;
    if (pUm === 'desktop' || pUm === 'mobile') {
      u.setUiMode(pUm);
      useMathStore.getState().setShowNumberPad(pUm === 'mobile');
    }

    u.setNeedsReset(true);
```

### G. `tests/math-engine.test.ts`

**tests/math-engine.test.ts**

```typescript
import { describe, expect, it } from 'vitest';
import {
  generateEmojiDoubleProblem,
  generateEmojiFractionProblem,
  generateEmojiHalfProblem,
  generateLetRegneHistorie,
  generateMathProblem,
  generateMultiTermProblem,
} from '../src/logic/math-engine.js';

describe('math-engine', () => {
  it('tenfriends: ukendt led + kendt led giver sum 10', () => {
    for (let i = 0; i < 40; i++) {
      const p = generateMathProblem(['tenfriends'], 'beginner', 'kysten', {});
      expect(p.op).toBe('tenfriends');
      expect(typeof p.answer).toBe('number');
      const m1 = p.question.match(/^\? \+ (\d+) = 10$/);
      const m2 = p.question.match(/^(\d+) \+ \? = 10$/);
      expect(m1 || m2).toBeTruthy();
      if (m1) {
        expect(p.answer + Number(m1[1])).toBe(10);
      } else if (m2) {
        expect(Number(m2[1]) + p.answer).toBe(10);
      }
    }
  });

  it('basic addition beginner: svar matcher udtryk', () => {
    for (let i = 0; i < 30; i++) {
      const p = generateMathProblem(['plus'], 'beginner', 'kysten', {});
      const m = p.question.match(/^(\d+) \+ (\d+)$/);
      expect(m).toBeTruthy();
      expect(Number(m![1]) + Number(m![2])).toBe(p.answer);
    }
  });

  it('lette-historier: addition og svar > 0', () => {
    for (let i = 0; i < 20; i++) {
      const p = generateLetRegneHistorie('beginner');
      expect(p.category).toBe('lette-historier');
      expect(p.answer).toBeGreaterThan(0);
      expect(p.question.length).toBeGreaterThan(10);
    }
  });

  it('multi-term: tre tal og korrekt svar (ikke-negativt)', () => {
    for (let i = 0; i < 25; i++) {
      const p = generateMultiTermProblem('beginner');
      expect(p.answer).toBeGreaterThanOrEqual(0);
      const parts = p.question.split(' ');
      expect(parts.length).toBeGreaterThanOrEqual(5);
    }
  });

  it('emoji-half: lige antal og svar = halvdelen', () => {
    for (let i = 0; i < 30; i++) {
      const p = generateEmojiHalfProblem();
      expect(p.category).toBe('emoji-half');
      expect(p.emojiHalvdelData?.mode).toBe('half');
      const c = p.emojiHalvdelData!.count;
      expect([2, 4, 6, 8, 10]).toContain(c);
      expect(p.answer).toBe(c / 2);
    }
  });

  it('emoji-double: svar er det dobbelte af vist antal', () => {
    for (let i = 0; i < 30; i++) {
      const p = generateEmojiDoubleProblem();
      expect(p.category).toBe('emoji-double');
      const n = p.emojiHalvdelData!.count;
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(5);
      expect(p.answer).toBe(n * 2);
    }
  });

  it('emoji-fraction: brøk matcher fremhævet antal', () => {
    for (let i = 0; i < 20; i++) {
      const p = generateEmojiFractionProblem();
      expect(p.category).toBe('emoji-fraction');
      const h = p.emojiFractionData!.highlighted;
      expect(h).toBeGreaterThanOrEqual(1);
      expect(h).toBeLessThanOrEqual(9);
      expect(p.emojiFractionData!.choices).toContain(p.emojiFractionData!.correctFraction);
    }
  });
});

```

### H. `MathChallenge.tsx` — udvalgte udsnit (badges, validering, numpad, klik-handlers)

**src/components/fishing/MathChallenge.tsx (uddrag — uden abe-UI)**

```tsx
function problemTypeBadgeLabel(p: MathProblem): string | null {
  switch (p.category) {
    case 'basic':
      return null;
    case 'tenfriends':
      return "🎯 10'er-venner";
    case '100friends':
      return "🎯 100'er-venner";
    case 'skaeve100friends':
      return "🎯 Skæve 100'er-venner";
    case 'equations':
      return '🔤 Ligninger';
    case 'multi-term':
      return '📐 Flere led';
    case 'decimals':
      return '🔬 Decimaler';
    case 'afrunding':
      return '🎯 Afrunding';
    case 'percent-decimal':
      return '% Procent ↔ Decimal';
    case 'fraction-decimal':
      return '🔢 Brøk ↔ Decimal';
    case 'taelleraekke':
      return '🔢 Tællerækker';
    case 'regnehistorier':
      return '📖 Regnehistorier';
    case 'lette-historier':
      return '📖 Lette historier';
    case 'emoji-antal':
      return '🔢 Antal';
    case 'emoji-counting':
      return '🎯 Emoji-tælling';
    case 'emoji-most-least':
      return '⚖️ Flest / færrest';
    case 'emoji-size-compare':
      return '🔍 Størst / mindst';
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
      return '⚖️ Samme antal';
    case 'emoji-fraction':
      return '🍕 Brøkdele';
    case 'emoji-percent':
      return '📈 Procentdel';
    default:
      return null;
  }
}



function problemTypeBadgeIsGreen(p: MathProblem): boolean {
  return (
    p.category === 'tenfriends' ||
    p.category === '100friends' ||
    p.category === 'skaeve100friends'
  );
}



function numericAnswerOk(user: string, expected: number): boolean {
  const n = Number(String(user).trim().replace(',', '.'));
  if (Number.isNaN(n)) return false;
  return Math.abs(n - expected) < 0.001;
}



function handleEmojiChoice(side: 'left' | 'right') {
    if (gameState !== 'fighting' || !problem || revealingAnswer) return;
    const choiceData = problem.emojiChoiceData || problem.emojiSizeData;
    if (!choiceData) return;
    const isCorrect = side === choiceData.correctSide;
    if (isCorrect) {
      handleAnswerCorrect();
    } else {
      handleAnswerWrong();
    }
  }

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

  function handleFractionDecimalChoice(fraction: string) {
    if (gameState !== 'fighting' || !problem || revealingAnswer) return;
    const data = problem.fractionDecimalData;
    if (!data?.choices) return;
    const isCorrect = fraction === data.fraction;
    if (isCorrect) handleAnswerCorrect();
    else handleAnswerWrong();
  }

  function checkAnswer(e?: FormEvent) {
    e?.preventDefault();
    if (gameState !== 'fighting' || !problem || revealingAnswer) return;
    if (problem.answer === -1) return;
    if (!numericAnswerOk(userAnswer, problem.answer)) {
      setUserAnswer('');
      handleAnswerWrong();
      return;
    }

    handleAnswerCorrect();
  }



  const isClickBasedProblem =
    problem.displayType === 'emoji-most-least' ||
    problem.displayType === 'emoji-size-compare' ||
    problem.displayType === 'emoji-even-odd' ||
    problem.displayType === 'emoji-pattern' ||
    problem.displayType === 'emoji-sort' ||
    problem.displayType === 'emoji-fraction' ||
    problem.displayType === 'fraction-decimal-choice';



        {!isClickBasedProblem && (
              <button
                type="button"
                onClick={() => {
                  play('ui');
                  setShowNumberPad(!showNumberPad);
                }}
                className={`touch-manipulation shrink-0 rounded-lg p-1 transition-all active:scale-90 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none ${
                  showNumberPad
                    ? 'bg-slate-600/70 text-sky-200 shadow-sm'
                    : 'bg-slate-800/50 text-slate-500 opacity-60 hover:opacity-85'
                }`}
                aria-pressed={showNumberPad}
                aria-label={showNumberPad ? 'Skjul touch-numpad' : 'Vis touch-numpad'}
                title="Touch-numpad"
              >
                <TouchNumpadGlyph className="size-[1.35rem] sm:size-6" />
              </button>
            )}
            {problem && problemTypeBadgeLabel(problem) && (
              <span
                className="min-w-0 truncate rounded-full border px-3 py-1 text-xs font-black tracking-widest uppercase"
                style={{
                  background: problemTypeBadgeIsGreen(problem)
                    ? 'rgba(16,185,129,0.25)'
                    : 'rgba(99,102,241,0.25)',
                  color: problemTypeBadgeIsGreen(problem) ? '#6ee7b7' : '#a5b4fc',
                  borderColor: problemTypeBadgeIsGreen(problem)
                    ? 'rgba(16,185,129,0.4)'
                    : 'rgba(99,102,241,0.4)',
                }}
              >
                {problemTypeBadgeLabel(problem)}
              </span>
            )}
          </div>
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
          <div
            className="mb-3 max-w-full px-1 text-center font-black leading-tight tracking-widest break-words text-red-400 uppercase"
            style={{ fontSize: 'clamp(0.8rem, 3.6vw, 1.5rem)' }}
          >
            ⚔️ Boss:{' '}
            {hookedFish.itemType === 'oyster' ? 'Østers' : hookedFish.species}
          </div>
        )}

        {isMultiPhase && (
          <div
            className="mb-6 grid min-h-0 w-full min-w-0 max-w-full gap-1.5 px-1 sm:gap-2"
            style={{
              gridTemplateColumns: `repeat(${fightStages.total}, minmax(0, 1fr))`,
            }}
          >
            {[...Array(fightStages.total)].map((_, i) => (
              <div
                key={i}
                className={`h-3.5 min-h-0 w-full max-w-full rounded-full transition-all duration-500 sm:h-4 ${
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

        <div className="mb-6 w-full min-w-0 max-w-full text-center break-words [overflow-wrap:anywhere]">
          {problem.displayType === 'emoji-most-least' && problem.emojiChoiceData ? (
            <EmojiMostLeastPanel
              data={problem.emojiChoiceData}
              revealingAnswer={revealingAnswer}
              zenMode={zenMode}
              clickRevealData={clickRevealData}
              onChoose={handleEmojiChoice}
            />
          ) : problem.displayType === 'emoji-size-compare' && problem.emojiSizeData ? (
            <EmojiSizeComparePanel
              data={problem.emojiSizeData}
              revealingAnswer={revealingAnswer}
              zenMode={zenMode}
              clickRevealData={clickRevealData}
              onChoose={handleEmojiChoice}
            />
          ) : problem.displayType === 'emoji-antal' && problem.emojiAntalData ? (
            <EmojiAntalPanel data={problem.emojiAntalData} />
          ) : problem.displayType === 'emoji-counting' && problem.emojiData ? (
            <EmojiCountingPanel data={problem.emojiData} />
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
          ) : problem.displayType === 'fraction-decimal-choice' && problem.fractionDecimalData?.choices ? (
            <>
              <div
                className="math-question-text mb-3 flex min-h-[4.5rem] w-full min-w-0 items-center justify-center break-words px-1 text-6xl font-black tracking-tighter text-white tabular-nums md:text-8xl [overflow-wrap:anywhere]"
              >
                {problem.question}
              </div>
              <FractionDecimalChoicePanel
                data={problem.fractionDecimalData}
                revealingAnswer={revealingAnswer}
                zenMode={zenMode}
                onChoose={handleFractionDecimalChoice}
              />
            </>
          ) : problem.displayType === 'emoji-percent' && problem.emojiPercentData ? (
            <EmojiPercentPanel data={problem.emojiPercentData} />
          ) : problem.category === 'regnehistorier' || problem.category === 'lette-historier' ? (
            <div
              className="mb-3 rounded-2xl border border-emerald-400/30 bg-blue-950/80 p-4 text-center text-base font-bold text-emerald-300 break-words [overflow-wrap:anywhere]"
              style={{ lineHeight: 1.5 }}
            >
              📖 {problem.question}
            </div>
          ) : (
            <div
              className="math-question-text mb-3 flex min-h-[4.5rem] w-full min-w-0 items-center justify-center break-words px-1 text-6xl font-black tracking-tighter text-white tabular-nums md:text-8xl [overflow-wrap:anywhere]"
              style={
                problem.category === 'equations'
                  ? {
                      fontSize: narrowViewport
                        ? 'clamp(1.5rem, 5vw, 4.5rem)'
                        : 'clamp(2rem, 7vw, 4.5rem)',
                    }
                  : undefined
              }
            >
              {problem.question}
            </div>
          )}
        </div>

        {!isClickBasedProblem && (
          <div className="relative min-w-0 w-full max-w-full">
          {effectiveShowNumpad ? (
            <div className="flex min-w-0 w-full max-w-full items-stretch gap-2">
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
            <form onSubmit={checkAnswer} className="flex min-w-0 w-full max-w-full items-stretch gap-2">
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
        )}
```

### I. `MathSettingsScreen.tsx` — fanen Avanceret (numpad, layout, decimal)

**src/components/screens/MathSettingsScreen.tsx (uddrag)**

```tsx
{mathSettingsTab === 'more' && (
            <div className="flex flex-col pt-2">
              <h3 className="mb-4 text-sm font-black tracking-widest text-slate-400 uppercase">
                ⌨️ Indtastningsmetode
              </h3>
              <div className="flex items-center justify-between rounded-3xl border border-slate-700 bg-slate-800/70 p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 text-3xl">
                    🔢
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">Touch-numpad</div>
                    <div className="text-sm text-slate-400">
                      Store knapper i kamp-skærmen. Standard på mobil.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    play('ui');
                    setShowNumberPad(!showNumberPad);
                  }}
                  className={`relative h-9 w-16 shrink-0 overflow-hidden rounded-full transition-colors ${showNumberPad ? 'bg-emerald-500' : 'bg-slate-600'}`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 flex size-8 min-h-8 min-w-8 max-h-8 max-w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-[10px] font-black leading-none shadow-md transition-transform duration-200 ${showNumberPad ? 'translate-x-7' : 'translate-x-0'}`}
                  >
                    {showNumberPad ? 'ON' : 'OFF'}
                  </div>
                </button>
              </div>
              <div
                className="mt-3 rounded-xl border border-slate-600/40 px-3 py-2 text-xs font-bold text-slate-400"
                style={{ background: 'rgba(15,23,42,0.6)' }}
              >
                💡 Numpad inkluderer C og − knapper. Decimaltast og minus vises kun ved relevante opgavetyper.
              </div>

              {showNumberPad && (
                <>
                  <div className="mt-6 flex items-center justify-between rounded-3xl border border-slate-700 bg-slate-800/70 p-5">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 to-indigo-500 text-[10px] font-black leading-tight text-white">
                        <span>7 8 9</span>
                        <span>4 5 6</span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-lg font-bold text-white">Tastelayout</div>
                        <div className="text-sm text-slate-400">
                          1–2–3 øverst er standard. Slå til for layout med 7–8–9 øverst.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        play('ui');
                        setNumpadAscendingLayout(!numpadAscendingLayout);
                      }}
                      aria-pressed={!numpadAscendingLayout}
                      aria-label={
                        !numpadAscendingLayout
                          ? 'Telefon-layout (7–8–9 øverst) er aktivt'
                          : 'Aktivér telefon-layout (7–8–9 øverst)'
                      }
                      className={`relative h-9 w-16 shrink-0 overflow-hidden rounded-full transition-colors ${numpadAscendingLayout ? 'bg-slate-600' : 'bg-violet-500'}`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 flex size-8 min-h-8 min-w-8 max-h-8 max-w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-[10px] font-black leading-none shadow-md transition-transform duration-200 ${numpadAscendingLayout ? 'translate-x-0' : 'translate-x-7'}`}
                      >
                        {!numpadAscendingLayout ? 'ON' : 'OFF'}
                      </div>
                    </button>
                  </div>
                  <div
                    className="mt-3 rounded-xl border border-slate-600/40 px-3 py-2 text-xs font-bold text-slate-400"
                    style={{ background: 'rgba(15,23,42,0.6)' }}
                  >
                    💡 Gælder touch-numpad i kamp-skærmen på både mobil- og desktop-layout.
                  </div>
                </>
              )}

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
                    <div className="text-sm text-slate-400">Bruges i opgaver og på numpad</div>
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
                💡 Standard er komma. Skift til punktum hvis du foretrækker international notation.
              </div>

              
```

