# Regnefisken — Analyse af Matematik- og Opgavesystemet

> Dokument genereret: april 2026  
> Formål: Grundig analyse af det eksisterende opgave-/matematiksystem som forberedelse til nye opgavetyper.

---

## Indholdsfortegnelse

1. [Overordnet arkitektur](#1-overordnet-arkitektur)
2. [Kernefiler og ansvar](#2-kernefiler-og-ansvar)
3. [Typer og datamodeller](#3-typer-og-datamodeller)
4. [Farvande (sværhedsgrupper)](#4-farvande-sværhedsgrupper)
5. [Sværhedsgrader (MathDifficulty)](#5-sværhedsgrader-mathdifficulty)
6. [Opgavetyper i detaljer](#6-opgavetyper-i-detaljer)
7. [Opgavegenerering — flow og routing](#7-opgavegenerering--flow-og-routing)
8. [Belønningssystem og multipliers](#8-belønningssystem-og-multipliers)
9. [Timer, Zen-mode og Boss-kampe](#9-timer-zen-mode-og-boss-kampe)
10. [UI-flow i MathChallenge](#10-ui-flow-i-mathchallenge)
11. [Indstillingsskærm (MathSettingsScreen)](#11-indstillingsskærm-mathsettingsscreen)
12. [State management (useMathStore)](#12-state-management-usemathstore)
13. [Tests](#13-tests)
14. [Afhængigheder og integrationer](#14-afhængigheder-og-integrationer)
15. [Checkliste: Tilføjelse af en ny opgavetype](#15-checkliste-tilføjelse-af-en-ny-opgavetype)

---

## 1. Overordnet arkitektur

Matematik-systemet fungerer som en **gate-mekanisme** i fiskespillet: Når spilleren hooker en fisk, skal vedkommende løse et eller flere regnestykker for at "lande" fangsten. Systemet er bygget op i tre lag:

```
┌─────────────────────────────────────────────────┐
│  UI-lag                                         │
│  MathChallenge.tsx  ·  MathSettingsScreen.tsx    │
│  NumberPad.tsx                                   │
├─────────────────────────────────────────────────┤
│  State-lag                                      │
│  useMathStore.ts (Zustand)                      │
├─────────────────────────────────────────────────┤
│  Logik-lag                                      │
│  math-engine.ts  ·  math-config.ts              │
│  types/math.ts                                  │
└─────────────────────────────────────────────────┘
```

Logik-laget er **rent funktionelt** (ingen side-effekter) og er selvstændigt testbart. State-laget holder den aktuelle opgave, svar, timer og indstillinger. UI-laget orkestrerer hele "kamp-loopet" og integrerer med fiske-, spiller- og collection-stores.

---

## 2. Kernefiler og ansvar

| Fil | Ansvar |
|-----|--------|
| `src/types/math.ts` | TypeScript-interfaces for alle matematik-typer |
| `src/data/math-config.ts` | Konfiguration: Farvande, regnehistorie-skabeloner, OP_MULTIPLIERS, `getDifficultyMultiplier()` |
| `src/logic/math-engine.ts` | Alle generatorfunktioner (en pr. opgavetype) + den overordnede `generateMathProblem()` |
| `src/store/useMathStore.ts` | Zustand-store med alle math-relaterede state-felter |
| `src/components/fishing/MathChallenge.tsx` | UI-komponent: viser opgave, input, timer, boss-indikator, numpad, svar-logik |
| `src/components/screens/MathSettingsScreen.tsx` | Indstillingsmenu: farvand, regnearter, sværhedsgrad, tid, numpad |
| `src/components/mobile/NumberPad.tsx` | Touch-venligt numpad til mobil |
| `tests/math-engine.test.ts` | Unit-tests for generatorer |

---

## 3. Typer og datamodeller

### MathProblem (det genererede regnestykke)

```typescript
interface MathProblem {
  question: string;      // Tekst vist til spilleren ("3 + 4" eller tekstopgave)
  answer: number;        // Det korrekte numeriske svar
  difficulty: number;    // Numerisk sværhed (1–3, brugt til legacy-routing)
  op: string;            // Operator-ID: '+', '-', '*', '/', 'tenfriends', '100friends', 'skaeve100friends'
  multiplier: number;    // Rarity-boost-multiplikator (1–4)
  category: string;      // Kategori: 'basic', 'tenfriends', '100friends', 'skaeve100friends',
                         //           'regnehistorier', 'lette-historier', 'multi-term',
                         //           'equations', 'decimals'
  displayType: string;   // 'text' eller 'regnehistorie' (bestemmer UI-layout)
  unit?: string;         // Enhed til regnehistorier ("fisk", "kr.", "km" osv.)
  xpBonus?: number;      // Ekstra XP-bonus for sværere opgavetyper
  rarityBoost?: number;  // Ekstra rarity-multiplikator (bruges af skæve 100-venner)
  isDecimal?: boolean;   // Markerer om svaret kræver decimal-input
}
```

### FarvandDef (sværhedsgruppe-definition)

```typescript
interface FarvandDef {
  name: string;              // Display-navn ("🏖️ Kysten")
  desc: string;              // Beskrivelse ("0.–3. klasse")
  allowedOps: string[];      // Hvilke operatorer/special-typer er tilladte
  allowedCategories: string[]; // Hvilke kategorier er tilladte
  canUseDecimal: boolean;    // Om decimaltal kan forekomme
  canUseNegative: boolean;   // Om negative tal kan forekomme
}
```

### RegnehistorieTemplate (skabelon til tekstopgaver)

To varianter:

```typescript
// Addition, subtraktion, multiplikation
interface RegnehistorieAddSubMul {
  type: '+' | '-' | '*';
  template: string;   // "Der svømmer {a} fisk ... {b} gemmer sig ..."
  unit: string;       // "fisk"
  minA, maxA: number; // Talintervaller for variabel a
  minB, maxB: number; // Talintervaller for variabel b
  cond?: (a: number, b: number) => boolean; // Valgfri betingelse (fx a > b)
}

// Division
interface RegnehistorieDiv {
  type: '/';
  template: string;   // "{total} fisk fordeles på {div} fiskere ..."
  unit: string;
  totalMin, totalMax: number;
  divOptions: number[];  // Lovlige divisorer ([3, 4, 6, 8])
}
```

---

## 4. Farvande (sværhedsgrupper)

Farvandene fungerer som **overordnede "niveauer"** der bestemmer, hvilke regnearter og kategorier der er tilgængelige. De er defineret i `FARVANDE` i `math-config.ts`:

| Farvand | ID | Målgruppe | Tilladte operatorer | Tilladte kategorier |
|---------|-----|-----------|-------------------|-------------------|
| 🏖️ Kysten | `kysten` | 0.–3. klasse | `+`, `-`, `tenfriends`, `100friends` | `basic`, `lette-historier` |
| ⛵ Det Åbne Hav | `aabenhav` | 4.–6. klasse | `+`, `-`, `*`, `/`, `multi-term`, `skaeve100friends` | `basic`, `multi-term`, `regnehistorier` |
| 🐋 Dybet | `dybet` | 7.–9. klasse | `+`, `-`, `*`, `/`, `multi-term`, `decimal`, `equation` | `basic`, `multi-term`, `equations`, `decimals` |

**Nøglepunkt:** Når brugeren skifter farvand, filtreres de aktive operatorer og kategorier automatisk, så kun de tilladte forbliver valgte. Hvis ingen er valgte efter filtreringen, falder den tilbage til den første tilladte operator.

---

## 5. Sværhedsgrader (MathDifficulty)

Sværhedsgraden styrer **talintervallerne** inden for den valgte opgavetype. Den er uafhængig af farvand.

| ID | Label | Multiplikator | Beskrivelse |
|----|-------|--------------|-------------|
| `beginner` | Begynder | ×1 | Encifrede tal, simple tabeller (1–10) |
| `intermediate` | Øvet | ×4 | To- og trecifrede tal, den lille tabel |
| `expert` | Ekspert | ×10 | Store tal, gange med tocifret × encifret |

**Multiplikatoren** (`getDifficultyMultiplier()`) bruges til at skalere `maxA`/`maxB` i regnehistorie-skabeloner og ligning-generatoren. Tallene i `generateNumbersForOp()` bruger hardcoded intervaller pr. sværhedsgrad i stedet.

---

## 6. Opgavetyper i detaljer

### 6.1 Basic (standard regnearter)

**Generator:** `generateNumbersForOp()` + `generateMathProblem()` (default path)

Genererer `a OP b` med fire grundoperationer. Talintervaller pr. sværhedsgrad:

| Op | Begynder | Øvet | Ekspert |
|----|----------|------|---------|
| `+` | 1–9 + 1–9 | 10–59 + 5–44 | 100–699 + 50–549 |
| `-` | 1–9 − 1–a | 20–89 − 1–(a-1) | 200–899 − 1–(a-1) |
| `*` | {1,2,5,10} × 1–10 | 3–9 × 3–9 | 10–39 × 2–10 |
| `/` | {1,2,5,10} ÷ → kvotient 1–9 | 3–9 ÷ → kvotient 2–10 | 2–10 ÷ → kvotient 5–19 |

**Visning:** `displayType: 'text'`, vises som stor matematik-tekst (fx `"42 + 17"`).

**Division** sikrer altid heltalssvar ved at generere `b * answer` som dividend.

**Multiplier:** Basisoperator-multiplikator fra `OP_MULTIPLIERS`: `+` = 1, `-` = 2, `*` = 3, `/` = 4.

---

### 6.2 10'er-venner (tenfriends)

**Generator:** `generateTenFriendsProblem()`

Genererer "find det manglende tal" opgaver hvor summen er 10:
- `? + 3 = 10` (svar: 7)
- `6 + ? = 10` (svar: 4)

**Egenskaber:**
- Vælger tilfældigt om `?` er til venstre eller højre
- a er altid 1–9, b = 10 − a
- `difficulty: 1`, `multiplier: 1`
- Ignorerer `mathDifficulty`-parameteren (altid enkle tal)
- **Eksklusiv:** Når `tenfriends` er i `activeOps`, returneres *kun* denne type (priority-check i `generateMathProblem()`)

---

### 6.3 100'er-venner (100friends)

**Generator:** `generate100FriendsQuestion()`

Tal der summer til 100, men kun **hele tiere** (10, 20, ..., 90):
- `30 + ? = 100`
- `? + 70 = 100`
- Hvis `-` er i `activeOps`: `100 − ? = 30` / `100 − 30 = ?`

**Egenskaber:**
- `difficulty: 1`, `multiplier: 1.25`
- **Eksklusiv** ligesom tenfriends

---

### 6.4 Skæve 100'er-venner (skaeve100friends)

**Generator:** `generateSkaeve100FriendsQuestion()`

Som 100-venner, men med **alle tal 1–99** (ikke kun hele tiere):
- `37 + ? = 100`
- `100 − 63 = ?`

**Egenskaber:**
- `difficulty: 2`, `multiplier: 1.5`
- `xpBonus: 20`, `rarityBoost: 1.35`
- **Eksklusiv** ligesom tenfriends/100friends

---

### 6.5 Regnehistorier

**Generator:** `generateRegneHistorie()`

Tekstopgaver pakket ind i tematiske mini-historier (hajer, fisk, dykkere). Bruger skabeloner fra `REGNEHISTORIE_TEMPLATES` (12 skabeloner i alt).

**Skabeloner pr. operator:**

| Operator | Antal skabeloner | Eksempel |
|----------|-----------------|----------|
| `+` (addition) | 3 | "Der svømmer {a} fisk i havet, og {b} gemmer sig i tangen – hvor mange fisk er der i alt?" |
| `-` (subtraktion) | 3 | "En fisker fanger {a} fisk og sælger {b} – hvor mange har han tilbage?" |
| `*` (multiplikation) | 3 | "En fiskebutik sælger {a} fisk om dagen – hvor mange på {b} dage?" |
| `/` (division) | 3 | "En båd fanger {total} fisk og deler dem ligeligt mellem {div} fiskere – hvor mange får hver?" |

**Talintervaller** skaleres med `getDifficultyMultiplier()` (begynder ×1, øvet ×4, ekspert ×10).

**Division-logik:** Vælger en divisor fra `divOptions`, genererer et heltalssvar, og beregner `total = answer * div` for at sikre præcist resultat. Svarenes størrelse skaleres med sværhedsgrad.

**Sprogbehandling:** Funktionen `retEntalFlertal()` håndterer dansk ental/flertal-bøjning automatisk (fx "1 hajer" → "1 haj", "3 fisk" forbliver).

**Egenskaber:**
- `difficulty: 2`, `multiplier:` fra `OP_MULTIPLIERS` for den valgte operator
- `displayType: 'regnehistorie'` → vises i et blågrønt panel med 📖-ikon
- `xpBonus: 20`
- **Kategori-baseret:** Kræver `mathCategory === 'regnehistorier'`

---

### 6.6 Lette regnehistorier

**Generator:** `generateLetRegneHistorie()`

Super-simple additionsopgaver for de yngste (0.–1. klasse). Bruger 28 skabeloner fra `LETTE_REGNEHISTORIE_TEMPLATES`.

**Temaer:** Strand & hav, solbriller, is, sandaler, solcreme. Alle er addition med meget lave tal (typisk 1–4 + 1–3).

**Egenskaber:**
- `difficulty: 1`, `multiplier: 1`
- `displayType: 'regnehistorie'`
- `xpBonus: 10`
- **Kategori-baseret:** Kræver `mathCategory === 'lette-historier'`

---

### 6.7 Flere led (multi-term)

**Generator:** `generateMultiTermProblem()`

Regnestykker med **tre tal og to operatorer** (+ eller −):
- `a ± b ± c`
- Eksempel: `15 + 8 − 3`

**Talintervaller:**

| Sværhed | a | b | c |
|---------|---|---|---|
| Begynder | 2–9 | 1–5 | 1–5 |
| Øvet | 10–39 | 5–24 | 1–15 |
| Ekspert | 50–249 | 20–119 | 10–89 |

**Sikkerhedsmekanisme:** Hvis resultatet er negativt, kalder funktionen sig selv rekursivt for at generere et nyt stykke.

**Egenskaber:**
- `difficulty: 3`, `multiplier: 4`
- `op: '*'` (historisk artefakt — bruges som markør for høj sværhed)
- **Kategori-baseret:** Kræver `mathCategory === 'multi-term'`

---

### 6.8 Ligninger (equations)

**Generator:** `generateEquationProblem()`

"Find x"-opgaver med tre varianter:

| Variant | Format | Eksempel |
|---------|--------|----------|
| Addition | `a + x = c` | `7 + x = 12` → x = 5 |
| Subtraktion | `x − b = c` | `x − 4 = 8` → x = 12 |
| Multiplikation | `b × x = c` | `3 × x = 15` → x = 5 |

Varianten vælges tilfældigt. Talintervallerne skaleres med `getDifficultyMultiplier()`.

**Egenskaber:**
- `difficulty: 3`, `multiplier: 4`
- **Kategori-baseret:** Kræver `mathCategory === 'equations'`

---

### 6.9 Decimaler (decimals)

**Generator:** `generateDecimalProblem()`

Addition eller subtraktion med decimaltal (én decimal):
- 60% chance for addition, 40% for subtraktion
- Tal rundes til én decimal
- Ved subtraktion: det største tal trækker altid det mindste fra (ingen negative resultater)

**Egenskaber:**
- `difficulty: 3`, `multiplier: 4`
- `isDecimal: true` (bruges af input-validering)
- **Kategori-baseret:** Kræver `mathCategory === 'decimals'`

---

## 7. Opgavegenerering — flow og routing

Den centrale funktion `generateMathProblem()` fungerer som en **router** der vælger den rigtige generator baseret på de aktive indstillinger:

```
generateMathProblem(difficulty, allowDivision, activeOps, mathDifficulty, mathCategory)
│
├─ activeOps indeholder 'tenfriends'?  → generateTenFriendsProblem()
├─ activeOps indeholder '100friends'?  → generate100FriendsQuestion()
├─ activeOps indeholder 'skaeve100friends'?  → generateSkaeve100FriendsQuestion()
│
├─ mathCategory === 'regnehistorier'?  → generateRegneHistorie()
├─ mathCategory === 'lette-historier'? → generateLetRegneHistorie()
├─ mathCategory === 'multi-term'?     → generateMultiTermProblem()
├─ mathCategory === 'equations'?      → generateEquationProblem()
├─ mathCategory === 'decimals'?       → generateDecimalProblem()
│
└─ Default (basic):
   ├─ Filtrer operatorer fra activeOps (fjern specials)
   ├─ Fallback til legacy difficulty-tier baseret routing
   ├─ Vælg tilfældig operator fra filteret
   ├─ Generer tal med generateNumbersForOp()
   └─ Returner MathProblem med beregnet svar
```

**Prioritetsrækkefølge:** Special-operatorer (`tenfriends`, `100friends`, `skaeve100friends`) checkes **først** og er eksklusive — de overruler kategori-valget.

**Legacy-parameteren `difficulty`** (1–3) bruges kun i basic-moden, hvor den bestemmer standard-operatorsættet, hvis `activeOps` er tom/null.

---

## 8. Belønningssystem og multipliers

### 8.1 Operator-multiplikatorer (OP_MULTIPLIERS)

Hver operator har en **rarity-boost** der øger chancen for sjældne fisk:

| Operator | Multiplikator | Effekt |
|----------|--------------|--------|
| `+` | ×1 | Basis-chance |
| `-` | ×2 | Dobbelt chance for sjældne fisk |
| `*` | ×3 | Tredobbelt chance |
| `/` | ×4 | Firdobbelt chance |
| `tenfriends` | ×1 | Basis |
| `100friends` | ×1.25 | Let forhøjet |
| `skaeve100friends` | ×1.5 | Markant forhøjet |

Multiplikatoren vises i UI'et som "✨ x3 CHANCE FOR SJÆLDEN FISK" og bruges af catch-engine til at justere pool-vægtningen.

### 8.2 XP-belønning

Basis-XP afhænger af fangstens rarity (fra `xp-engine.ts`):

| Rarity | XP |
|--------|----|
| Almindelig | 10 |
| Sjælden | 25 |
| Legendarisk | 60 |
| Treasure | 80 |
| Junk | 2 |

**Bonusser:** Opgavetyper med `xpBonus` (regnehistorier: +20, lette historier: +10, skæve 100-venner: +20) giver ikke direkte ekstra XP i den nuværende implementering — det er felter på `MathProblem` men bruges ikke eksplicit i `finalizeCatch()`.

### 8.3 Streak-bonus

Korrekte svar i træk bygger en streak op:
- Streak ≥ 5: +3 kr. per 5-tier (standard mode)
- Zen-mode: +1 kr. per streak (når streak ≥ 5)
- **Forkert svar:** Nulstiller streaken (undtagen for `jellyfish`, `piranha`, `kraken`)
- Forkert svar trækker også **3 sekunder** fra timeren

### 8.4 Speed-solve bonus

Hvis spilleren svarer med **> 80% tid tilbage**, tælles det som et "speed solve" (bruges til progression-mål).

---

## 9. Timer, Zen-mode og Boss-kampe

### 9.1 Timer-system

Tidsbegrænsningen bestemmes af den hookede fisks `fightParams.baseTimeLimit`:

| Fisk-type | Tid | Faser |
|-----------|-----|-------|
| Almindelig fisk | 25 sek (default) | 1 |
| Piranha | 25 sek | 3 |
| Kraken | 30 sek | 3 |
| Østers | 30 sek | 3 |
| Gnavne Gorm | 30 sek | 6 |
| Hvidhaj (boss) | 30 sek | 6 |
| Søuhyre | 32 sek | 6 |
| Plesiosaur | 30 sek | 3 |
| Junk/treasure/osv. | 0 (ingen timer) | 1 |

**Timeren** tikker ned med 1 sekund pr. interval. Når den rammer 0, tabes kampen (`enterLostState()`). Under 5 sekunder vises rød pulserende animation.

### 9.2 Zen-mode

Når `zenMode === true`:
- Ingen timer (viser ♾️ i stedet)
- "Vis svar (zen)"-knap vises, der afslører svaret efter klik
- Reduceret streak-bonus
- Ingen tab muligt (bortset fra at lukke/navigere væk)
- Valgfri "Klip linen"-knap efter 10 eller 15 sek (konfigurerbar via `zenSkipDelay`)

### 9.3 Boss-kampe (multi-fase)

Bosser kræver **flere korrekte svar i træk** for at besejres:

- Kampforløb tracker `fightStages: { current: number, total: number }`
- Progresstrin vises som en horisontale bjælke med amber-farvede segmenter
- Hver korrekt svar avancerer `current` med 1
- Når `current >= total` → fangsten finaliseres
- Forkert svar nulstiller **ikke** kampen, men trækker 3 sek fra timeren
- Boss-kampe har særlig rød kant og "⚔️ Boss: [navn]" header
- Boss-ambience-lyd afspilles under kampen

---

## 10. UI-flow i MathChallenge

### Komplet flow fra hook til fangst:

```
1. Fisk hookes → gameState = 'fighting'
2. nextProblem() genererer MathProblem
3. Timer startes (medmindre zenMode)
4. Spiller indtaster svar (input-felt eller NumberPad)
5. checkAnswer() valideres:
   ├─ Forkert: streak nulstilles, -3 sek, fejl-lyd
   └─ Korrekt:
      ├─ Multi-fase (boss): avancér fase, kald nextProblem()
      └─ Sidste/eneste fase: finalizeCatch()
6. finalizeCatch() → XP, inventory, stats, gameState = 'catch'
7. Timer timeout → enterLostState() → gameState = 'lost'/'kraken_lost'
```

### Svar-validering

```typescript
function numericAnswerOk(user: string, expected: number): boolean {
  // Erstatter komma med punktum (dansk decimalformat)
  // Tolererer numerisk afvigelse < 0.001
}
```

### Visningstyper

| `displayType` | Layout |
|---------------|--------|
| `'text'` | Stor tekst (6xl–8xl) i hvid monospace |
| `'regnehistorie'` | Blågrønt panel med 📖-ikon og normal tekststørrelse |

For ligninger bruges dynamisk `fontSize: clamp(2rem, 7vw, 4.5rem)`.

### Abe-hjælper (Monkey Helper)

Når `monkeyHelpsThisRound === true`, vises et lille CSS-animeret abe-ikon. Klik afslører svaret i en tale-boble. Abens hjælp nulstilles ved nyt problem og ved kamp-slut.

---

## 11. Indstillingsskærm (MathSettingsScreen)

Indstillingerne er organiseret i **5 tabs**:

| Tab | ID | Indhold |
|-----|----|---------|
| 🌊 Farvand | `farvand` | Valg mellem Kysten/Åbent Hav/Dybet |
| 🎣 Regneart | `ops` | Toggle for +, −, ×, ÷ + special-operatorer + kategori-valg |
| 📊 Sværhedsgrad | `level` | Begynder/Øvet/Ekspert |
| 🕐 Tid | `time` | Med tid / Uden tid (zen) + zen-skip-delay |
| ✨ Avanceret | `more` | Touch-numpad toggle |

### Filtrering

Farvand-valget fungerer som en **gate** for de øvrige tabs:
- Operatorer filtreres: kun `allowedOps` fra farvandet vises
- Kategorier filtreres: kun `allowedCategories` vises
- Ved farvand-skift auto-filtreres aktive valg

### Special-operatorer som "Specialmadding"

`tenfriends`, `100friends` og `skaeve100friends` fungerer som **eksklusive toggles** — de erstatter alle andre operatorer når de aktiveres, og falder tilbage til `['+']` når de deaktiveres.

---

## 12. State management (useMathStore)

Zustand-store med følgende felter:

| Felt | Type | Default | Formål |
|------|------|---------|--------|
| `activeOps` | `string[]` | `['+']` | Aktive operatorer |
| `mathDifficulty` | `MathDifficulty` | `'beginner'` | Sværhedsgrad |
| `mathCategory` | `string` | `'basic'` | Aktiv kategori |
| `selectedFarvand` | `FarvandId` | `'kysten'` | Valgt farvand |
| `zenMode` | `boolean` | `false` | Uden tidspres |
| `zenSkipDelay` | `number` | `10` | Sek. før "vis svar"-knap |
| `showNumberPad` | `boolean` | Auto-detect | Mobil numpad |
| `showSpecialKeys` | `boolean` | `false` | Minus/decimal-taster |
| `problem` | `MathProblem \| null` | `null` | Aktuelt regnestykke |
| `userAnswer` | `string` | `''` | Spillerens input |
| `timeLeft` | `number` | `0` | Resterende sekunder |
| `initialTime` | `number` | `1` | Starttid (til speed-beregning) |
| `showMathSettings` | `boolean` | `false` | Vis indstillingsskærm |
| `mathSettingsTab` | `string` | `'farvand'` | Aktiv tab |
| `showSkipButton` | `boolean` | `false` | Vis skip-knap (zen) |
| `revealingAnswer` | `boolean` | `false` | Viser svar-animation |
| `isMobile` | `boolean` | `false` | Mobil-flag |

---

## 13. Tests

Filen `tests/math-engine.test.ts` indeholder 4 test-cases:

| Test | Dækning |
|------|---------|
| `tenfriends: ukendt led + kendt led giver sum 10` | Validerer spørgsmålsformat og svar for 40 iterationer |
| `basic addition beginner: svar matcher udtryk` | Parser spørgsmål og verificerer svar for 30 iterationer |
| `lette-historier: addition og svar > 0` | Checker kategori, positivt svar og minimum spørgsmålslængde |
| `multi-term: tre tal og korrekt svar (ikke-negativt)` | Verificerer ikke-negativt svar og korrekt antal dele |

**Bemærk:** Der mangler tests for `100friends`, `skaeve100friends`, `equations`, `decimals`, `regnehistorier` (med division), og edge cases.

---

## 14. Afhængigheder og integrationer

### Math-engine afhænger af:
- `data/math-config.ts` — konfiguration og skabeloner
- `types/math.ts` — typedeklarationer

### MathChallenge afhænger af:
- `logic/math-engine.ts` — generering
- `logic/xp-engine.ts` — XP-beregning og streak-bonus
- `logic/catch-engine.ts` — `makeId()`
- `data/combat.ts` — `STREAK_EXCEPTION_TYPES`, `TRUE_BOSS_ITEM_TYPES`
- `data/enrichment.ts` — `ENRICHED_CATCH_DATA` (til tidsgrænser)
- `data/equipment.ts` — bucket-kapacitet
- `store/useMathStore.ts` — matematik-state
- `store/useFishingStore.ts` — kamp-state
- `store/useGameStore.ts` — game-state
- `store/usePlayerStore.ts` — progression, inventory, upgrades
- `store/useCollectionStore.ts` — collectibles
- `store/useUIStore.ts` — toasts, level-up overlay
- `audio/useAudio.ts` — lydeffekter
- `components/mobile/NumberPad.tsx` — touch-input

### Berørte systemer ved ny opgavetype:
- **catch-engine**: Rarity-boost fra `multiplier`
- **xp-engine**: XP fra fangst (indirekte via opgavetype)
- **goal-progress**: Speed-solves, combo/streak
- **game-persistence/save-load**: `activeOps`, `mathCategory`, `mathDifficulty`, `selectedFarvand` persisteres

---

## 15. Checkliste: Tilføjelse af en ny opgavetype

For at tilføje en ny opgavetype skal følgende steder opdateres:

### Obligatorisk:

1. **`src/types/math.ts`**
   - Tilføj nyt interface for skabeloner (hvis skabelon-baseret)
   - Evt. udvid `RegnehistorieOp` type

2. **`src/logic/math-engine.ts`**
   - Opret ny `generateXxxProblem()` funktion
   - Tilføj routing i `generateMathProblem()` (enten som special-op check eller category-check)
   - Bestem `MathProblem`-feltværdier: `category`, `displayType`, `op`, `multiplier`, `difficulty`, `xpBonus`

3. **`src/data/math-config.ts`**
   - Tilføj skabeloner (hvis skabelon-baseret)
   - Tilføj operator til relevante farvande i `FARVANDE.[farvand].allowedOps`
   - Tilføj kategori til relevante farvande i `FARVANDE.[farvand].allowedCategories`
   - Tilføj evt. ny multiplier til `OP_MULTIPLIERS`

4. **`src/components/screens/MathSettingsScreen.tsx`**
   - Tilføj nyt element til `CATEGORY_ROWS` (hvis kategori-baseret)
   - Eller tilføj ny `SpecialOpToggle` (hvis special-operator)

### Valgfrit:

5. **`src/components/fishing/MathChallenge.tsx`**
   - Tilpas visning hvis ny `displayType` kræves
   - Tilpas kategori-badge-tekst i render-logikken

6. **`src/store/useMathStore.ts`**
   - Ingen ændringer nødvendige (medmindre ny state-type kræves)

7. **`tests/math-engine.test.ts`**
   - Tilføj unit-test for den nye generator

8. **`src/logic/game-persistence.ts` / `src/logic/save-load.ts`**
   - Verificer at nye værdier i `activeOps`/`mathCategory` persisteres korrekt

---

## Appendix A: Komplet liste over `category`-værdier

| Category | Generator | Farvand |
|----------|-----------|---------|
| `basic` | Default path i `generateMathProblem()` | Alle |
| `tenfriends` | `generateTenFriendsProblem()` | Kysten |
| `100friends` | `generate100FriendsQuestion()` | Kysten |
| `skaeve100friends` | `generateSkaeve100FriendsQuestion()` | Åbent Hav |
| `regnehistorier` | `generateRegneHistorie()` | Åbent Hav |
| `lette-historier` | `generateLetRegneHistorie()` | Kysten |
| `multi-term` | `generateMultiTermProblem()` | Åbent Hav, Dybet |
| `equations` | `generateEquationProblem()` | Dybet |
| `decimals` | `generateDecimalProblem()` | Dybet |

## Appendix B: Komplet liste over `op`-værdier

| Op-værdi | Bruges i | Eksklusiv? |
|----------|----------|------------|
| `+` | Basic, regnehistorier | Nej |
| `-` | Basic, regnehistorier | Nej |
| `*` | Basic, regnehistorier, multi-term, equations | Nej |
| `/` | Basic, regnehistorier | Nej |
| `tenfriends` | 10'er-venner | Ja |
| `100friends` | 100'er-venner | Ja |
| `skaeve100friends` | Skæve 100'er-venner | Ja |
