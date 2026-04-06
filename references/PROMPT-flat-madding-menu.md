# Prompt: Flad madding-menu — fjern to-lags-systemet

## Baggrund og motivation

Matematik-indstillingerne har i dag **to separate lag** under "Regneart"-fanen:

1. **"Vælg madding (Regnearter)"** — checkboxes for `+`, `−`, `×`, `÷` (multi-select)
2. **"Specialmadding"** — to under-sektioner:
   - *Toggle-knapper* for 10'er-venner, 100'er-venner, Skæve 100'er-venner
   - *Radio-knap-liste* med "Ingen (standard regnearter)" + 9 specialkategorier

Dette skaber forvirring fordi:
- Brugeren skal forstå forskellen på "standard regnearter" og "specialmadding"
- Når en specialkategori er valgt, ignoreres de valgte standard-regnearter (undtagen emoji-counting, der filtrerer på dem)
- "Ingen (standard regnearter)" er et forvirrende navn — det lyder som "ingen madding"
- Nogle "ops" (`tenfriends`, `100friends`, `skaeve100friends`) lever i `activeOps`-arrayet sammen med `+`, `-`, `*`, `/`, men opfører sig som selvstændige kategorier
- Det er uklart hvilke indstillinger der faktisk påvirker hvad

## Ønsket resultat

**Én flad liste** af alle opgavetyper under overskriften **"Vælg madding (regnearter)"**. Brugeren toggle'r dem frit (multi-select, mindst 1 valgt). Når flere er slået til, vælges tilfældigt mellem dem for hver opgave.

Opgavetyper der understøtter operator-filtrering (regnehistorier, emoji-tælling) får **ekspanderbare operator-pills** der kun vises når typen er slået til.

## Nuværende arkitektur (vigtig kontekst)

### State (useMathStore)
```typescript
activeOps: string[]       // f.eks. ['+', '-', 'tenfriends']
mathCategory: string      // f.eks. 'basic', 'emoji-counting', 'regnehistorier'
```

### Problemgenerering (generateMathProblem i math-engine.ts)
Prioritering i koden:
1. Hvis `activeOps` indeholder `tenfriends`/`100friends`/`skaeve100friends` → generer den type (uanset mathCategory)
2. Ellers: branch på `mathCategory` for specialkategorier
3. Ellers: fald igennem til basic-stien der bruger `activeOps` (`+`, `-`, `*`, `/`)

### Farvand-gating (math-config.ts FARVANDE)
Hvert farvand definerer `allowedOps` og `allowedCategories`:
```
kysten:    ops=[+, -, tenfriends, 100friends]       cats=[basic, lette-historier, emoji-antal, emoji-counting, emoji-most-least, emoji-size-compare]
aabenhav:  ops=[+, -, *, /, multi-term, skaeve100friends]  cats=[basic, multi-term, regnehistorier, emoji-counting]
dybet:     ops=[+, -, *, /, multi-term, decimal, equation]  cats=[basic, multi-term, equations, decimals]
```
NB: `multi-term`, `decimal`, `equation` lever allerede som pseudo-ops i `allowedOps`, selvom de også er kategorier. De bruges dog ikke som ops — kun som kategori-gating.

### Alle opgavetyper i systemet (16 stk)

| ID (ny) | Nuværende placering | Generator-funktion | Har operator-filtrering? | Input-type |
|---|---|---|---|---|
| `plus` | activeOps `+` | basic-sti | — | numerisk |
| `minus` | activeOps `-` | basic-sti | — | numerisk |
| `gange` | activeOps `*` | basic-sti | — | numerisk |
| `division` | activeOps `/` | basic-sti | — | numerisk |
| `tenfriends` | activeOps `tenfriends` | `generateTenFriendsProblem` | nej | numerisk |
| `100friends` | activeOps `100friends` | `generate100FriendsQuestion` | nej | numerisk |
| `skaeve100friends` | activeOps `skaeve100friends` | `generateSkaeve100FriendsQuestion` | nej | numerisk |
| `multi-term` | mathCategory | `generateMultiTermProblem` | nej | numerisk |
| `equations` | mathCategory | `generateEquationProblem` | nej | numerisk |
| `decimals` | mathCategory | `generateDecimalProblem` | nej | numerisk |
| `regnehistorier` | mathCategory | `generateRegneHistorie` | **JA** — filtrerer templates på +/−/×/÷ | numerisk |
| `lette-historier` | mathCategory | `generateLetRegneHistorie` | nej (kun +) | numerisk |
| `emoji-antal` | mathCategory | `generateEmojiAntalProblem` | nej | numerisk |
| `emoji-counting` | mathCategory | `generateEmojiCountingProblem` | **JA** — vælger operator baseret på farvand + activeOps | numerisk |
| `emoji-most-least` | mathCategory | `generateEmojiMostLeastProblem` | nej | klik |
| `emoji-size-compare` | mathCategory | `generateEmojiSizeCompareProblem` | nej | klik |

## Design

### 1. Alle opgavetyper er individuelle toggles

Hver af de 16 typer er sin egen toggle i én flad liste. De er gatede af farvand, så brugeren ser kun dem der er relevante (Kysten viser ~9, Åbent Hav ~8, Dybet ~8).

### 2. Ekspanderbare operator-pills for typer med operator-filtrering

To opgavetyper understøtter operator-filtrering: **regnehistorier** og **emoji-tælling**. Når en af disse er slået til, vises en række små operator-pills lige under toggle-knappen:

```
✅ Emoji-tælling              Tæl emojis og regn!
   [+] [−]                    ← pills, kun synlig når toggled ON
                                 kun operators tilgængelig for farvandet

✅ Regnehistorier              Tekstopgaver med hajer & fisk
   [+] [−] [×] [÷]           ← pills, kun synlig når toggled ON
```

**Regler for pills:**
- Vises KUN når opgavetypen er slået til (accordion-stil)
- Kun operatorer der er tilgængelige i det valgte farvand vises (kysten: +/−, åbent hav: +/−/×/÷)
- Default: alle tilgængelige operatorer er valgt
- Mindst 1 operator skal altid være valgt (kan ikke un-toggle sidste)
- Når opgavetypen slås fra, nulstilles operator-valget til default (alle til) — så det er friskt næste gang

**Visuelt:** Pills er små, runde knapper (ca. 32×32px) med operatortegnet. Aktive er highlighted (f.eks. cyan/teal), inaktive er dæmpede. De sidder i en kompakt række med lille indrykning under toggle-knappen.

### 3. 100'er-venner subtraktionsvarianter

`100friends` og `skaeve100friends` inkluderer **altid** subtraktionsvarianter (`100 − ? = 70`, `100 − 30 = ?`). De er en naturlig del af talforståelse og gør opgavetypen rigere. Generatorerne tilpasses til ikke at tjekke activeOps for dette.

### 4. State-model

**Nuværende:**
```typescript
activeOps: string[]   // ['+', '-', 'tenfriends', ...]
mathCategory: string  // 'basic' | 'emoji-counting' | ...
```

**Ny:**
```typescript
activeMathTypes: string[]  // ['plus', 'minus', 'emoji-counting', 'tenfriends', ...]
typeOps: Record<string, string[]>  // { 'emoji-counting': ['+', '-'], 'regnehistorier': ['+', '*'] }
```

`activeMathTypes` erstatter BEGGE felter. Mindst 1 skal altid være valgt (default: `['plus']`).

`typeOps` holder operator-valget for de to typer der understøtter det. Kun relevant når typen er i `activeMathTypes`. Nøgler er kun `'emoji-counting'` og `'regnehistorier'`. Når en type ikke har en entry i `typeOps`, bruges alle tilgængelige operatorer.

**Ingen state-migration nødvendig.** Der skal laves et stort reset af alle brugeres indstillinger som del af en større opdatering. Gammel localStorage kan ignoreres/slettes.

### 5. Problemgenererings-flow

**Nuværende:** `generateMathProblem(difficulty, allowDivision, activeOps, mathDifficulty, mathCategory, selectedFarvand)`

**Ny:**
```typescript
function generateMathProblem(
  activeMathTypes: string[],
  mathDifficulty: MathDifficulty,
  selectedFarvand: FarvandId,
  typeOps: Record<string, string[]>
): MathProblem
```

Flow:
1. Vælg tilfældig type fra `activeMathTypes`
2. Kald den tilhørende generator:
   - `plus` → `generateNumbersForOp('+', mathDifficulty)` + basic return
   - `minus` → `generateNumbersForOp('-', mathDifficulty)` + basic return
   - `gange` → `generateNumbersForOp('*', mathDifficulty)` + basic return
   - `division` → `generateNumbersForOp('/', mathDifficulty)` + basic return
   - `tenfriends` → `generateTenFriendsProblem(mathDifficulty)`
   - `100friends` → `generate100FriendsQuestion()` (altid inkl. subtraktionsvarianter)
   - `skaeve100friends` → `generateSkaeve100FriendsQuestion()` (altid inkl. subtraktionsvarianter)
   - `multi-term` → `generateMultiTermProblem(mathDifficulty)`
   - `equations` → `generateEquationProblem(mathDifficulty)`
   - `decimals` → `generateDecimalProblem(mathDifficulty)`
   - `regnehistorier` → `generateRegneHistorie(mathDifficulty, typeOps['regnehistorier'] ?? ['+','-','*','/'])`
   - `lette-historier` → `generateLetRegneHistorie(mathDifficulty)`
   - `emoji-antal` → `generateEmojiAntalProblem(mathDifficulty)`
   - `emoji-counting` → `generateEmojiCountingProblem(typeOps['emoji-counting'] ?? defaultOpsForFarvand, selectedFarvand, mathDifficulty)`
   - `emoji-most-least` → `generateEmojiMostLeastProblem()`
   - `emoji-size-compare` → `generateEmojiSizeCompareProblem()`
3. Returner problem

`difficulty`-tier og `allowDivision`-parametre er legacy og kan fjernes.

### 6. Farvand-gating simplificering

`FARVANDE` skal kun have én liste + operator-tilgængelighed per type:

```typescript
kysten: {
  name: '🏖️ Kysten',
  desc: '0.–3. klasse',
  allowedMathTypes: ['plus', 'minus', 'tenfriends', '100friends', 'lette-historier', 'emoji-antal', 'emoji-counting', 'emoji-most-least', 'emoji-size-compare'],
  typeOpsAvailable: {
    'emoji-counting': ['+', '-'],
  },
  canUseDecimal: false,
  canUseNegative: false,
}
aabenhav: {
  name: '⛵ Det Åbne Hav',
  desc: '4.–6. klasse',
  allowedMathTypes: ['plus', 'minus', 'gange', 'division', 'tenfriends', 'skaeve100friends', 'multi-term', 'regnehistorier', 'emoji-counting'],
  typeOpsAvailable: {
    'emoji-counting': ['+', '-', '*', '/'],
    'regnehistorier': ['+', '-', '*', '/'],
  },
  canUseDecimal: false,
  canUseNegative: false,
}
dybet: {
  name: '🐋 Dybet',
  desc: '7.–9. klasse',
  allowedMathTypes: ['plus', 'minus', 'gange', 'division', 'multi-term', 'equations', 'decimals'],
  typeOpsAvailable: {},
  canUseDecimal: true,
  canUseNegative: true,
}
```

`allowedOps` og `allowedCategories` **fjernes** og erstattes af `allowedMathTypes`.

`typeOpsAvailable` definerer hvilke operators der er tilgængelige for pills-UI'et per type i det farvand. Typer der ikke er nøgle her, har ingen pills (ingen operator-filtrering).

### 7. UI-layout

Fanen "Regneart" viser **én scrollbar liste** med visuelle gruppeoverskrifter:

```
🎣 Vælg madding (regnearter)
Mindst 1 skal være valgt. Vælg flere for tilfældigt mix.

── Regnearter ──
  ✅ Plus (+)               Addition
  ✅ Minus (−)              Subtraktion
  ☐  Gange (×)              Multiplikation       ← skjult på Kysten
  ☐  Division (÷)           Division              ← skjult på Kysten

── Talforståelse ──
  ☐  10'er-venner           ? + 3 = 10
  ✅ 100'er-venner          90 + ? = 100
  ☐  Skæve 100'er-venner   37 + ? = 100          ← kun Åbent Hav

── Speciale ──                                     ← gruppe kun synlig hvis farvand har nogen
  ☐  Flere led              a + b − c
  ☐  Ligninger              Find x: a + x = c     ← kun Dybet
  ☐  Decimaler              Regn med decimaltal    ← kun Dybet

── Historier ──
  ☐  Regnehistorier         Tekstopgaver med hajer & fisk
     [+] [−] [×] [÷]       ← pills, kun synlig når toggled ON
  ✅ Lette historier         Super-lette for 0.–1. kl.

── Emoji ──
  ✅ Antal                   Tæl emojis — hvor mange?
  ☐  Emoji-tælling          Tæl emojis og regn!
     [+] [−]                ← pills (Kysten: kun +/−, Åbent Hav: +/−/×/÷)
  ☐  Flest / færrest        Tryk på den rigtige kasse
  ☐  Størst / mindst        Tryk på de store eller små
```

**Gruppelayout-regler:**
- Grupper der ikke har nogen synlige items (pga. farvand-gating) skjules helt
- Gruppeoverskrifter er visuelle headere (ikke interaktive), samme stil som nuværende sektionsoverskrifter
- Toggle-knapper er checkbox-stil (som de nuværende +/−/×/÷ knapper med ✓-cirkel)
- Operator-pills har lille indrykning (pl-8 eller lignende) og er kun synlige når parent-toggle er ON

### 8. Definitioner for alle math types

Master-liste over alle typer med metadata til UI og gating:

```typescript
interface MathTypeDefinition {
  id: string;
  label: string;
  icon: string;
  desc: string;
  group: 'regnearter' | 'talforståelse' | 'speciale' | 'historier' | 'emoji';
  supportsOps: boolean;  // true = vis operator-pills når enabled
}

const MATH_TYPE_DEFS: MathTypeDefinition[] = [
  // Regnearter
  { id: 'plus',      label: 'Plus (+)',     icon: '➕', desc: 'Addition',        group: 'regnearter', supportsOps: false },
  { id: 'minus',     label: 'Minus (−)',    icon: '➖', desc: 'Subtraktion',     group: 'regnearter', supportsOps: false },
  { id: 'gange',     label: 'Gange (×)',    icon: '✖️', desc: 'Multiplikation',  group: 'regnearter', supportsOps: false },
  { id: 'division',  label: 'Division (÷)', icon: '➗', desc: 'Division',        group: 'regnearter', supportsOps: false },

  // Talforståelse
  { id: 'tenfriends',       label: "10'er-venner",         icon: '🎯', desc: '? + 3 = 10 — find det manglende tal',    group: 'talforståelse', supportsOps: false },
  { id: '100friends',       label: "100'er-venner",        icon: '🎯', desc: '90 + ? = 100 — hele tiere',              group: 'talforståelse', supportsOps: false },
  { id: 'skaeve100friends', label: "Skæve 100'er-venner",  icon: '🎯', desc: '37 + ? = 100 — alle tal 1–99',           group: 'talforståelse', supportsOps: false },

  // Speciale
  { id: 'multi-term', label: 'Flere led',   icon: '📐', desc: '3 led: a + b − c',       group: 'speciale', supportsOps: false },
  { id: 'equations',  label: 'Ligninger',   icon: '🔤', desc: 'Find x: a + x = c',      group: 'speciale', supportsOps: false },
  { id: 'decimals',   label: 'Decimaler',   icon: '🔬', desc: 'Regn med decimaltal',     group: 'speciale', supportsOps: false },

  // Historier
  { id: 'regnehistorier', label: 'Regnehistorier',                    icon: '📖', desc: 'Tekstopgaver med hajer & fisk',   group: 'historier', supportsOps: true },
  { id: 'lette-historier', label: 'Regnehistorier – de allermindste', icon: '🧸', desc: 'Super-lette historier for 0.–1. kl.', group: 'historier', supportsOps: false },

  // Emoji
  { id: 'emoji-antal',        label: 'Antal',           icon: '🔢', desc: 'Tæl emojis — hvor mange er der?',  group: 'emoji', supportsOps: false },
  { id: 'emoji-counting',     label: 'Emoji-tælling',   icon: '🎯', desc: 'Tæl emojis og regn!',              group: 'emoji', supportsOps: true },
  { id: 'emoji-most-least',   label: 'Flest / færrest', icon: '⚖️', desc: 'Tryk på den rigtige kasse',        group: 'emoji', supportsOps: false },
  { id: 'emoji-size-compare', label: 'Størst / mindst', icon: '🔍', desc: 'Tryk på de store eller små',       group: 'emoji', supportsOps: false },
];
```

## Berørte filer

| Fil | Ændring |
|---|---|
| `src/types/math.ts` | Opdater `FarvandDef`: fjern `allowedOps`/`allowedCategories`, tilføj `allowedMathTypes: string[]` og `typeOpsAvailable: Record<string, string[]>`. |
| `src/data/math-config.ts` | Omskriv `FARVANDE` til nyt format. Fjern gamle `allowedOps`/`allowedCategories`. Tilføj `MATH_TYPE_DEFS` master-liste. |
| `src/store/useMathStore.ts` | Erstat `activeOps: string[]` + `mathCategory: string` med `activeMathTypes: string[]` + `typeOps: Record<string, string[]>`. Ingen migration — localStorage ryddes. |
| `src/logic/math-engine.ts` | Ny signatur `generateMathProblem(activeMathTypes, mathDifficulty, selectedFarvand, typeOps)`. Simpel random-vælger + dispatch-map. Fjern legacy `difficulty`/`allowDivision` params. Tilpas `generate100FriendsQuestion`/`generateSkaeve100FriendsQuestion` til altid at inkludere subtraktionsvarianter. Tilpas `generateRegneHistorie` til at bruge `typeOps` i stedet for `activeOps`. Tilpas `generateEmojiCountingProblem` til at bruge `typeOps` i stedet for `activeOps`. |
| `src/components/fishing/FishingControls.tsx` | Tilpas kald til `generateMathProblem` med ny signatur. |
| `src/components/screens/MathSettingsScreen.tsx` | Komplet omskrivning af "Regneart"-fanen. Fjern `CATEGORY_ROWS`, `SpecialOpToggle`, hele specialmadding-sektionen. Erstat med grouped toggles + ekspanderbare operator-pills. |
| `src/components/fishing/MathChallenge.tsx` | Tilpas category-badge der viser nuværende kategori (minimal ændring). |
| `tests/math-engine.test.ts` | Tilpas tests til ny signatur. |

## Implementeringsrækkefølge

1. **types** — Opdater `FarvandDef` interface
2. **config** — Omskriv `FARVANDE` + tilføj `MATH_TYPE_DEFS`
3. **store** — Erstat state-felter
4. **engine** — Ny `generateMathProblem` signatur + random-dispatch
5. **FishingControls** — Tilpas kald
6. **MathSettingsScreen** — Ny flad UI med grouped toggles + pills
7. **MathChallenge** — Tilpas badge (minimal)
8. **Tests** — Opdater
9. **Build + test** — Verificer

## Risici og edge cases

1. **"Mindst 1 valgt"-reglen:** Skal håndhæves i UI (kan ikke un-toggle sidste aktive). Allerede implementeret for nuværende activeOps, men skal gælde den nye liste.
2. **Farvand-skift nulstiller:** Når brugeren skifter farvand og nogle af deres valgte typer ikke er tilgængelige i det nye farvand, skal de filtreres fra. Hvis ingen overlever, fallback til `['plus']`.
3. **typeOps nulstilling:** Når en type med operator-pills slås fra, nulstilles dens `typeOps`-entry, så den er frisk næste gang den slås til.
4. **Regnehistorier returnerer null:** `generateRegneHistorie` kan returnere `null` hvis ingen templates matcher de valgte operatorer. Engine'en skal håndtere dette ved at vælge en anden tilfældig type som fallback.
