# Implementeringsplan: Udvidet M\u00e5lsystem (Goals/Achievements)

## Oversigt

Denne plan udvider Regnefiskens m\u00e5lsystem fra ~40 til ~80 m\u00e5l, retter eksisterende fejl, indf\u00f8rer ny kategorisering, og tilf\u00f8jer manglende stats-tracking. Planen er opdelt i 7 sekventielle faser.

**Beslutninger taget f\u00f8r implementering:**
- `companion_master` **fjernes helt** og erstattes af `all_companions`
- Alle m\u00e5l (nye + eksisterende) migreres til **ny kategorisering**: `fangst`, `matematik`, `udforskning`, `samling`, `\u00f8konomi`
- `earn_500` \u00e6ndres til `>= 1000` (beholder titel "F\u00f8rste tusindlap") \u2014 men da vi ogs\u00e5 tilf\u00f8jer `earn_1000`, skal `earn_500`-m\u00e5let f\u00e5 **nyt id + ny titel** i stedet (se Fase 3)
- Secret-m\u00e5l forbliver i deres tematiske kategorier, vises som `???` indtil f\u00e6rdige

---

## Fase 1: Opdater GoalStats-typen

**Fil:** `src/types/progression.ts`

Tilf\u00f8j f\u00f8lgende felter til `GoalStats`-interfacet:

```ts
// Nye fangst-stats
junkCatches: number;          // Antal stykker skrald fanget
frogCatches: number;          // Antal fr\u00f8er fanget
sharkCaught: boolean;         // Har fanget en haj
narwhalCaught: boolean;       // Har fanget en narhval
plesiosaurCaught: boolean;    // Har fanget en plesiosaurus
goldenCarpCaught: boolean;    // Har fanget Den Gyldne Karpe
tropicalSpeciesCaught: number; // Antal unikke tropiske arter fanget
bottleCatches: number;        // Antal flaskeposter fanget
tireCaught: number;           // Antal bild\u00e6k fanget
teddyCaught: number;          // Antal v\u00e5de bamser fanget

// Nye matematik-stats
perfectBossWins: number;      // Boss-kampe vundet uden fejl

// Nye \u00f8konomi-stats
hasLuxuryBoat: boolean;       // Ejer den flotte sejlb\u00e5d
legendarySold: number;        // Antal legend\u00e6re fisk solgt

// Nye samling-stats
ratUnlocked: boolean;         // Rotten l\u00e5st op
parrotUnlocked: boolean;      // Papeg\u00f8jen l\u00e5st op
pearlCount: number;           // Antal perler afleveret til Havfruen

// Nye vejr/milj\u00f8-stats
nightCatches: number;         // Fisk fanget om natten
snowCatches: number;          // Fisk fanget i snefald
```

**VIGTIG NOTE:** Felterne `conchCount`, `companionsUnlocked`, `wishesUsed`, `hasTurtleHatched`, `collectiblesFound` er allerede optional (`?`). Overvej at fjerne `?` fra dem, da de altid bygges i `buildGoalStatsSnapshot()`. De nye felter b\u00f8r ligeledes v\u00e6re required (ikke optional) i interfacet, med default-v\u00e6rdier sat i snapshot-funktionen.

---

## Fase 2: Opdater buildGoalStatsSnapshot

**Fil:** `src/logic/goal-progress.ts`

Udvid `buildGoalStatsSnapshot()` til at inkludere alle nye stats. For mange af disse kr\u00e6ves det, at de relevante stores allerede tracker dataen. Nedenfor specificeres hvad der h\u00f8rer til snapshot-funktionen vs. hvad der kr\u00e6ver nye store-felter:

### 2a: Stats der allerede kan udledes fra eksisterende data

Unders\u00f8g f\u00f8rst om f\u00f8lgende kan beregnes ud fra eksisterende stores:

```ts
// I buildGoalStatsSnapshot():
const p = usePlayerStore.getState();
const c = useCollectionStore.getState();

return {
  ...p.stats,
  // ... eksisterende felter ...

  // Nye felter - udledt fra companions-listen:
  ratUnlocked: c.unlockedCompanions.includes('rat'),
  parrotUnlocked: c.unlockedCompanions.includes('parrot'),

  // Perler - fra collectibleDelivered eller inventory:
  pearlCount: c.collectibleDelivered?.pearl ?? 0,

  // Luxury boat - unders\u00f8g om dette trackes i player inventory/upgrades
  hasLuxuryBoat: p.upgrades?.includes('luxury_boat') ?? false, // TILPAS til reel datastruktur
};
```

### 2b: Stats der kr\u00e6ver NYE felter i usePlayerStore.stats

F\u00f8lgende m\u00e5 tilf\u00f8jes som nye teller-felter i `usePlayerStore`s `stats`-objekt, da de **ikke kan udledes** fra eksisterende data:

```ts
// Disse skal trackes aktivt n\u00e5r de sker i spillet:
junkCatches: 0,
frogCatches: 0,
sharkCaught: false,
narwhalCaught: false,
plesiosaurCaught: false,
goldenCarpCaught: false,
tropicalSpeciesCaught: 0,  // Alternativt: beregn fra en Set af fangede tropiske arter
bottleCatches: 0,
tireCaught: 0,
teddyCaught: 0,
perfectBossWins: 0,
legendarySold: 0,
nightCatches: 0,
snowCatches: 0,
```

### 2c: Find de steder i koden, hvor stats skal inkrementeres

Disse steder skal identificeres og opdateres (instruktion til Cursor):

| Ny stat | Sandsynlig fil/funktion | Kontekst |
|---------|------------------------|----------|
| `junkCatches` | `catch-engine.ts` / fangst-logik | N\u00e5r en fangst er af type 'junk' |
| `frogCatches` | `catch-engine.ts` | N\u00e5r fisken er en fr\u00f8 |
| `sharkCaught` | `catch-engine.ts` | N\u00e5r fiskens id === 'shark' (eller lignende) |
| `narwhalCaught` | `catch-engine.ts` | N\u00e5r fiskens id === 'narwhal' |
| `plesiosaurCaught` | `catch-engine.ts` | N\u00e5r fiskens id === 'plesiosaur' |
| `goldenCarpCaught` | `catch-engine.ts` | N\u00e5r fiskens id === 'golden_carp' |
| `tropicalSpeciesCaught` | `catch-engine.ts` | Antal unikke arter fanget p\u00e5 tropical_island. **Anbefaling:** Hold et `Set<string>` af fangede tropiske arter i player-state, og brug `.size` i snapshot. |
| `bottleCatches` | `catch-engine.ts` | N\u00e5r fangst er en flaskepost |
| `tireCaught` | `catch-engine.ts` | N\u00e5r fangst er et bild\u00e6k |
| `teddyCaught` | `catch-engine.ts` | N\u00e5r fangst er en v\u00e5d bamse |
| `perfectBossWins` | Boss-kamp-logik | N\u00e5r boss besejres med 0 forkerte svar |
| `legendarySold` | Salgs-logik / shop | N\u00e5r en legend\u00e6r fisk s\u00e6lges |
| `nightCatches` | `catch-engine.ts` | N\u00e5r fangst sker i natte-tilstand |
| `snowCatches` | `catch-engine.ts` | N\u00e5r vejret er sne under fangst |

**VIGTIGT \u2014 Pr\u00e6cise filreferencer fundet ved kodebase-analyse:**

- Stats initialiseres i `src/logic/xp-engine.ts` via `emptyStats()` \u2014 alle nye felter skal tilf\u00f8jes her med default `0` / `false`.
- Stats inkrementeres i `src/components/fishing/MathChallenge.tsx` via `setStats`-kaldet. F\u00f8lg eksakt m\u00f8nstret for `rainCatches`/`stormCatches`:
  ```ts
  rainCatches: s.rainCatches + (weatherType === 'rain' && resolved.itemType === 'fish' ? 1 : 0),
  ```
- Fisk-ID'er i kodebasen bruger `fisk_`-pr\u00e6fiks: `fisk_hvidhaj` (haj), `fisk_narhval` (narhval), `fisk_plesiosaurus` (plesiosaurus), `fisk_gyldne_karpe` (gylden karpe), `fisk_gylden_fr\u00f8` (fr\u00f8).
- `luxury_boat` trackes via `upgrades.includes('luxury_boat')` i player store (shop-item koster 12.500 kr, kr\u00e6ver level 20).
- Salgs-logik for `legendarySold` skal tilf\u00f8jes der, hvor fisk s\u00e6lges (unders\u00f8g komponenter der h\u00e5ndterer salg/butik).
- `perfectBossWins` skal inkrementeres i boss-kamp-logikken n\u00e5r kampen afsluttes med 0 fejl.

### 2d: Tropical species count-konstant

Defin\u00e9r en konstant for antal tropiske arter:

```ts
// I src/data/progression.ts (eller src/data/fish.ts):
import { CATCH_MASTER_DATA } from './fish.js';  // eller relevant import

export const TROPICAL_SPECIES_COUNT = CATCH_MASTER_DATA
  .filter(f => f.location === 'tropical_island' && f.type === 'fish')
  .length;
```

Alternativt, hvis fisk-datastrukturen er anderledes, skal Cursor f\u00f8rst unders\u00f8ge `CATCH_MASTER_DATA` og `LOCATIONS` for at finde den pr\u00e6cise filtrering.

---

## Fase 3: Ret eksisterende fejl i progression.ts

**Fil:** `src/data/progression.ts`

### 3a: Fjern companion_master

Slet hele linjen med `companion_master`:
```ts
// SLET DETTE:
{ id: 'companion_master', title: 'Dyrehvisker', description: 'L\u00e5s op for alle 5 k\u00e6ledyr.', icon: '\ud83d\udc3e', category: 'progression', condition: (s) => (s.companionsUnlocked ?? 0) >= 5, reward: { xp: 150, coins: 0 }, secret: false },
```

Erstattes af `all_companions` i Fase 4 (under samling-kategorien).

### 3b: Ret earn_500 (titel vs. beløb)

Da vi tilf\u00f8jer `earn_1000` som nyt m\u00e5l, skal det eksisterende `earn_500` **beholde sit bel\u00f8b p\u00e5 500** men f\u00e5 en ny titel:

```ts
// FRA:
{ id: 'earn_500', title: 'F\u00f8rste tusindlap', description: 'Tjen 500 kr. fra salg i alt.', icon: '\ud83d\udcb0', category: '\u00f8konomi', condition: (s) => s.totalEarned >= 500, reward: { xp: 60, coins: 0 }, secret: false },

// TIL:
{ id: 'earn_500', title: 'God start', description: 'Tjen 500 kr. fra salg i alt.', icon: '\ud83d\udcb0', category: '\u00f8konomi', condition: (s) => s.totalEarned >= 500, reward: { xp: 60, coins: 0 }, secret: false },
```

### 3c: Ret duplikerede ikoner for reach_5 og reach_10

```ts
// FRA:
{ id: 'reach_5', ..., icon: '\u2b50' }
{ id: 'reach_10', ..., icon: '\u2b50' }

// TIL:
{ id: 'reach_5', ..., icon: '\u2b50' }   // ⭐
{ id: 'reach_10', ..., icon: '\ud83c\udf1f' }  // 🌟
```

Og opdater `reach_20` til:
```ts
{ id: 'reach_20', ..., icon: '\ud83d\udcab' }  // 💫
```

---

## Fase 4: Migrer eksisterende m\u00e5l til ny kategorisering

**Fil:** `src/data/progression.ts`

Alle eksisterende m\u00e5l skal opdateres med de nye kategorier. Her er den fulde kategori-mapping:

### Ny kategoristruktur

| Ny kategori | Indhold |
|-------------|---------|
| `fangst` | Alt relateret til at fange fisk, skrald, specielle v\u00e6sner |
| `matematik` | Streak, speed, boss-kampe, regnestykker |
| `udforskning` | Bes\u00f8g lokationer, globetrotter |
| `samling` | K\u00e6ledyr, fossiler, konkylier, perler, collectibles |
| `\u00f8konomi` | Tjene penge, k\u00f8be opgraderinger, s\u00e6lge |

### Migrations-tabel for eksisterende m\u00e5l

| M\u00e5l-id | Gammel kategori | Ny kategori |
|-----------|-----------------|-------------|
| `first_catch` | fangst | **fangst** (u\u00e6ndret) |
| `catch_rain` | fangst | **fangst** (u\u00e6ndret) |
| `catch_storm` | fangst | **fangst** (u\u00e6ndret) |
| `catch_10` | fangst | **fangst** (u\u00e6ndret) |
| `catch_50` | fangst | **fangst** (u\u00e6ndret) |
| `first_rare` | fangst | **fangst** (u\u00e6ndret) |
| `first_legendary` | fangst | **fangst** (u\u00e6ndret) |
| `first_treasure` | fangst | **fangst** (u\u00e6ndret) |
| `kraken` | fangst | **fangst** (u\u00e6ndret) |
| `cave_axolotl` | fangst | **fangst** (u\u00e6ndret) |
| `cave_crystal` | fangst | **fangst** (u\u00e6ndret) |
| `ouch_jellyfish` | fangst | **fangst** (u\u00e6ndret) |
| `no_junk` | udfordring | **matematik** |
| `speed_catch` | udfordring | **matematik** |
| `boss_slayer` | udfordring | **matematik** |
| `combo_master` | udfordring | **matematik** |
| `cave_gorm` | udfordring | **matematik** |
| `cave_complete` | udfordring | **matematik** |
| `earn_500` | \u00f8konomi | **\u00f8konomi** (u\u00e6ndret) |
| `earn_5000` | \u00f8konomi | **\u00f8konomi** (u\u00e6ndret) |
| `full_upgrade` | \u00f8konomi | **\u00f8konomi** (u\u00e6ndret) |
| `reach_5` | progression | **udforskning** |
| `reach_10` | progression | **udforskning** |
| `reach_20` | progression | **udforskning** |
| `explore_smaragd` | progression | **udforskning** |
| `globetrotter` | progression | **udforskning** |
| `turtle_dad` | progression | **samling** |
| `wish_master` | progression | **udforskning** |
| `scavenger` | udfordring | **samling** |
| `conch_king` | samling | **samling** (u\u00e6ndret) |
| `fossil_1` | udfordring | **samling** |
| `fossil_30` | udfordring | **samling** |

**Note om `no_junk`, `cave_gorm` og `cave_complete`:** Disse er en blanding af fangst og udfordring. `no_junk` (streak uden skrald) og `cave_gorm` (boss-kamp) passer bedre under `matematik` da de involverer gameplay-udfordringer snarere end ren fangst. `cave_complete` er et compound-m\u00e5l der kr\u00e6ver alle grotte-opgaver \u2014 det kan argumenteres begge veje, men samles her under `matematik` som "den store udfordring". **Cursor-implementerer b\u00f8r tage en pragmatisk beslutning her.**

---

## Fase 5: Tilf\u00f8j alle nye m\u00e5l

**Fil:** `src/data/progression.ts`

Tilf\u00f8j f\u00f8lgende m\u00e5l til `GOALS`-arrayet. De er organiseret efter den nye kategorisering. Alle `category`-felter er allerede opdateret til de nye kategorier.

### 5.1 Fangst-m\u00e5l

```ts
// --- NYE FANGST-M\u00c5L ---
{ id: 'catch_25', title: 'Halvvejs', description: 'Fang 25 fisk i alt.', icon: '\ud83c\udfa3',
  category: 'fangst', condition: (s) => s.totalCatches >= 25,
  reward: { xp: 80, coins: 50 }, secret: false },

{ id: 'catch_100', title: 'Hundredmanden', description: 'Fang 100 fisk i alt.', icon: '\ud83d\udcaf',
  category: 'fangst', condition: (s) => s.totalCatches >= 100,
  reward: { xp: 300, coins: 200 }, secret: false },

{ id: 'catch_250', title: 'Utr\u00e6ttelig fisker', description: 'Fang 250 fisk i alt.', icon: '\ud83c\udf0a',
  category: 'fangst', condition: (s) => s.totalCatches >= 250,
  reward: { xp: 600, coins: 500 }, secret: false },

{ id: 'first_junk', title: 'Hvad er det her?!', description: 'Fang dit f\u00f8rste stykke skrald.', icon: '\ud83d\uddd1\ufe0f',
  category: 'fangst', condition: (s) => s.junkCatches >= 1,
  reward: { xp: 10, coins: 0 }, secret: false },

{ id: 'catch_frog', title: 'Ribbid!', description: 'Fang din f\u00f8rste fr\u00f8.', icon: '\ud83d\udc38',
  category: 'fangst', condition: (s) => s.frogCatches >= 1,
  reward: { xp: 20, coins: 20 }, secret: false },

{ id: 'catch_shark', title: 'Havets R\u00f8ver', description: 'Fang en haj.', icon: '\ud83e\udd88',
  category: 'fangst', condition: (s) => s.sharkCaught,
  reward: { xp: 200, coins: 300 }, secret: true },

{ id: 'catch_narwhale', title: 'Ensomme Horn', description: 'Fang en narhval i Ishavet.', icon: '\ud83e\udd84',
  category: 'fangst', condition: (s) => s.narwhalCaught,
  reward: { xp: 250, coins: 400 }, secret: true },

{ id: 'catch_plesiosaur', title: 'Forhistorisk fangst', description: 'Fang en Plesiosaurus i Dybet.', icon: '\ud83e\udd95',
  category: 'fangst', condition: (s) => s.plesiosaurCaught,
  reward: { xp: 400, coins: 600 }, secret: true },

{ id: 'catch_golden_carp', title: '\u00d8nsket opfyldt', description: 'Fang Den Gyldne Karpe.', icon: '\u2728',
  category: 'fangst', condition: (s) => s.goldenCarpCaught,
  reward: { xp: 300, coins: 750 }, secret: true },

{ id: 'catch_all_tropisk', title: 'Tropeekspert', description: 'Fang alle fisk p\u00e5 Den Tropiske \u00d8.', icon: '\ud83c\udf34',
  category: 'fangst', condition: (s) => s.tropicalSpeciesCaught >= TROPICAL_SPECIES_COUNT,
  reward: { xp: 500, coins: 500 }, secret: false },

{ id: 'junk_tire', title: 'Hvad laver det her!?', description: 'Fang et gammelt bild\u00e6k.', icon: '\ud83d\udede',
  category: 'fangst', condition: (s) => s.tireCaught >= 1,
  reward: { xp: 15, coins: 10 }, secret: true },

{ id: 'junk_teddy', title: 'Bl\u00f8d landing', description: 'Fang en v\u00e5d bamse.', icon: '\ud83e\uddf8',
  category: 'fangst', condition: (s) => s.teddyCaught >= 1,
  reward: { xp: 20, coins: 0 }, secret: true },

{ id: 'catch_bottle', title: 'Postmanden reddede ikke pakken', description: 'Fang en flaskepost.', icon: '\ud83d\udcdc',
  category: 'fangst', condition: (s) => s.bottleCatches >= 1,
  reward: { xp: 50, coins: 50 }, secret: true },

{ id: 'catch_5_junk', title: 'Milj\u00f8vagt', description: 'Fang 5 stykker skrald i alt.', icon: '\u267b\ufe0f',
  category: 'fangst', condition: (s) => s.junkCatches >= 5,
  reward: { xp: 40, coins: 0 }, secret: false },
```

### 5.2 Matematik-m\u00e5l

```ts
// --- NYE MATEMATIK-M\u00c5L ---
{ id: 'math_streak_3', title: 'P\u00e5 rette vej', description: 'Svar rigtigt 3 gange i tr\u00e6k.', icon: '\ud83d\udd25',
  category: 'matematik', condition: (s) => (s.maxCombo ?? 0) >= 3,
  reward: { xp: 50, coins: 30 }, secret: false },

{ id: 'math_streak_10', title: 'Regneguru', description: 'Svar rigtigt 10 gange i tr\u00e6k.', icon: '\ud83e\uddee',
  category: 'matematik', condition: (s) => (s.maxCombo ?? 0) >= 10,
  reward: { xp: 600, coins: 200 }, secret: false },

{ id: 'math_speed_5', title: 'Lynhjerne', description: 'L\u00f8s 5 regnestykker med over 80% tid tilbage.', icon: '\u26a1',
  category: 'matematik', condition: (s) => s.speedSolves >= 5,
  reward: { xp: 150, coins: 100 }, secret: false },

{ id: 'math_perfect_boss', title: 'Fejlfri k\u00e6mper', description: 'Vind en boss-kamp uden at svare forkert \u00e9n gang.', icon: '\ud83d\udc8e',
  category: 'matematik', condition: (s) => s.perfectBossWins >= 1,
  reward: { xp: 200, coins: 250 }, secret: true },

{ id: 'math_boss_10', title: 'Mesterk\u00e6mper', description: 'Vind 10 boss-kampe.', icon: '\u2694\ufe0f',
  category: 'matematik', condition: (s) => s.bossWins >= 10,
  reward: { xp: 300, coins: 400 }, secret: false },

{ id: 'jellyfish_10', title: 'Gentagende uheld', description: 'Mist fangst til brandmand 10 gange.', icon: '\ud83e\udebc',
  category: 'matematik', condition: (s) => (s.jellyfishCaught ?? 0) >= 10,
  reward: { xp: 100, coins: 200 }, secret: true },
```

### 5.3 \u00d8konomi-m\u00e5l

```ts
// --- NYE \u00d8KONOMI-M\u00c5L ---
{ id: 'earn_1000', title: 'God dag p\u00e5 molen', description: 'Tjen 1.000 kr. fra salg i alt.', icon: '\ud83d\udcb5',
  category: '\u00f8konomi', condition: (s) => s.totalEarned >= 1000,
  reward: { xp: 100, coins: 0 }, secret: false },

{ id: 'earn_25000', title: 'Fiskeri-milliard\u00e6r', description: 'Tjen 25.000 kr. fra salg i alt.', icon: '\ud83d\udcb0',
  category: '\u00f8konomi', condition: (s) => s.totalEarned >= 25000,
  reward: { xp: 500, coins: 0 }, secret: true },

{ id: 'first_upgrade', title: 'F\u00f8rste investering', description: 'K\u00f8b din f\u00f8rste opgradering i butikken.', icon: '\ud83d\uded2',
  category: '\u00f8konomi', condition: (s) => s.upgradesBought >= 1,
  reward: { xp: 30, coins: 0 }, secret: false },

{ id: 'buy_luxury_boat', title: 'Skipper!', description: 'K\u00f8b den flotte sejlb\u00e5d.', icon: '\u26f5',
  category: '\u00f8konomi', condition: (s) => s.hasLuxuryBoat,
  reward: { xp: 400, coins: 500 }, secret: false },

{ id: 'sell_legendary', title: 'Med stor fortjeneste', description: 'S\u00e6lg din f\u00f8rste legend\u00e6re fisk.', icon: '\ud83e\udd11',
  category: '\u00f8konomi', condition: (s) => s.legendarySold >= 1,
  reward: { xp: 80, coins: 100 }, secret: false },
```

### 5.4 Udforskning-m\u00e5l

```ts
// --- NYE UDFORSKNING-M\u00c5L ---
{ id: 'visit_cave', title: 'Ind i m\u00f8rket', description: 'Bes\u00f8g Den M\u00f8rke Grotte.', icon: '\ud83e\udea8',
  category: 'udforskning', condition: (s) => s.areasVisited.includes('cave'),
  reward: { xp: 60, coins: 0 }, secret: false },

{ id: 'visit_arctic', title: 'Frostv\u00e6gt', description: 'Bes\u00f8g Ishavet.', icon: '\ud83e\uddca',
  category: 'udforskning', condition: (s) => s.areasVisited.includes('arctic_sea'),
  reward: { xp: 60, coins: 0 }, secret: false },

{ id: 'visit_desert', title: 'Varmblodet fisker', description: 'Bes\u00f8g \u00d8rkens\u00f8en.', icon: '\ud83c\udfdc\ufe0f',
  category: 'udforskning', condition: (s) => s.areasVisited.includes('desert_lake'),
  reward: { xp: 60, coins: 0 }, secret: false },

{ id: 'visit_forbidden', title: 'Den forbudte passage', description: 'Bes\u00f8g Den Forbudte S\u00f8.', icon: '\ud83c\udff4\u200d\u2620\ufe0f',
  category: 'udforskning', condition: (s) => s.areasVisited.includes('forbidden'),
  reward: { xp: 80, coins: 100 }, secret: false },

{ id: 'visit_jungle', title: 'Dinosaurernes \u00d8', description: 'Find Jungle\u00f8en \u2014 opdaget via Plesiosaurus.', icon: '\ud83e\udd95',
  category: 'udforskning', condition: (s) => s.areasVisited.includes('jungle_island'),
  reward: { xp: 200, coins: 200 }, secret: true },

{ id: 'visit_cabin', title: 'Hjemme igen', description: 'Find og bes\u00f8g Fiskehytten.', icon: '\ud83c\udfe0',
  category: 'udforskning', condition: (s) => s.areasVisited.includes('cabin_living'),
  reward: { xp: 100, coins: 0 }, secret: false },

{ id: 'wish_first', title: 'Et \u00f8nske', description: 'Brug dit f\u00f8rste \u00f8nske fra Helleflynderen.', icon: '\ud83c\udf20',
  category: 'udforskning', condition: (s) => (s.wishesUsed ?? 0) >= 1,
  reward: { xp: 100, coins: 0 }, secret: true },

// Level-progression (under udforskning):
{ id: 'reach_3', title: 'Ny fisker', description: 'N\u00e5 level 3.', icon: '\u2b50',
  category: 'udforskning', condition: (s) => s.maxLevel >= 3,
  reward: { xp: 0, coins: 50 }, secret: false },

{ id: 'reach_15', title: 'Havets Veteran', description: 'N\u00e5 level 15.', icon: '\ud83c\udf0a',
  category: 'udforskning', condition: (s) => s.maxLevel >= 15,
  reward: { xp: 0, coins: 500 }, secret: false },

{ id: 'reach_25', title: 'Havlegenden', description: 'N\u00e5 level 25.', icon: '\ud83c\udfc6',
  category: 'udforskning', condition: (s) => s.maxLevel >= 25,
  reward: { xp: 0, coins: 2000 }, secret: true },

// Placeholder-m\u00e5l (level 30\u201350):
{ id: 'reach_30', title: 'Havets Mester', description: 'N\u00e5 level 30.', icon: '\ud83c\udf1f',
  category: 'udforskning', condition: (s) => s.maxLevel >= 30,
  reward: { xp: 0, coins: 100 }, secret: true },

{ id: 'reach_35', title: 'Havets Legende', description: 'N\u00e5 level 35.', icon: '\ud83c\udfc5',
  category: 'udforskning', condition: (s) => s.maxLevel >= 35,
  reward: { xp: 0, coins: 150 }, secret: true },

{ id: 'reach_40', title: 'Uovervindelig Fisker', description: 'N\u00e5 level 40.', icon: '\ud83d\udd31',
  category: 'udforskning', condition: (s) => s.maxLevel >= 40,
  reward: { xp: 0, coins: 200 }, secret: true },

{ id: 'reach_45', title: 'Evig Fisker', description: 'N\u00e5 level 45.', icon: '\u267e\ufe0f',
  category: 'udforskning', condition: (s) => s.maxLevel >= 45,
  reward: { xp: 0, coins: 200 }, secret: true },

{ id: 'reach_50', title: 'Guddommelig Fisker', description: 'N\u00e5 level 50.', icon: '\u2728',
  category: 'udforskning', condition: (s) => s.maxLevel >= 50,
  reward: { xp: 0, coins: 200 }, secret: true },
```

### 5.5 Samling-m\u00e5l

```ts
// --- NYE SAMLING-M\u00c5L ---
{ id: 'first_companion', title: 'Nye venner', description: 'L\u00e5s op for dit f\u00f8rste k\u00e6ledyr.', icon: '\ud83d\udc3e',
  category: 'samling', condition: (s) => (s.companionsUnlocked ?? 0) >= 1,
  reward: { xp: 50, coins: 0 }, secret: false },

{ id: 'rat_friend', title: 'Rottemester', description: 'L\u00e5s op for Rotten som k\u00e6ledyr.', icon: '\ud83d\udc00',
  category: 'samling', condition: (s) => s.ratUnlocked,
  reward: { xp: 80, coins: 0 }, secret: false },

{ id: 'parrot_friend', title: 'Fuglevenneren', description: 'L\u00e5s op for Papeg\u00f8jen som k\u00e6ledyr.', icon: '\ud83e\udd9c',
  category: 'samling', condition: (s) => s.parrotUnlocked,
  reward: { xp: 80, coins: 0 }, secret: false },

{ id: 'fossil_10', title: 'Dinosaursamler', description: 'Aflever 10 fossiler til Kaptajn Rottesk\u00e6g.', icon: '\ud83e\uddb4',
  category: 'samling', condition: (s) => (s.fossilCount ?? 0) >= 10,
  reward: { xp: 150, coins: 150 }, secret: false },

{ id: 'pearl_5', title: 'Havets Perle', description: 'Aflever 5 perler til Havfruen.', icon: '\ud83d\udc8e',
  category: 'samling', condition: (s) => (s.pearlCount ?? 0) >= 5,
  reward: { xp: 200, coins: 250 }, secret: false },

{ id: 'conch_5', title: 'Pingvinens Ven', description: 'Aflever 5 konkylier til Pingvinen.', icon: '\ud83d\udc27',
  category: 'samling', condition: (s) => (s.conchCount ?? 0) >= 5,
  reward: { xp: 100, coins: 100 }, secret: false },

{ id: 'conch_first', title: 'Sneglemand', description: 'Saml din f\u00f8rste konkylie.', icon: '\ud83d\udc1a',
  category: 'samling', condition: (s) => (s.conchCount ?? 0) >= 1,
  reward: { xp: 20, coins: 0 }, secret: false },

{ id: 'all_companions', title: 'Dyrehord', description: 'L\u00e5s op for alle k\u00e6ledyr i spillet.', icon: '\ud83d\udc3e',
  category: 'samling', condition: (s) => (s.companionsUnlocked ?? 0) >= COMPANIONS_DATABASE.length,
  reward: { xp: 500, coins: 500 }, secret: true },
```

**Note:** `all_companions` bruger `COMPANIONS_DATABASE.length` i stedet for hardcoded 8 \u2014 s\u00e5 den automatisk synkroniserer hvis nye k\u00e6ledyr tilf\u00f8jes. Import\u00e9r `COMPANIONS_DATABASE` \u00f8verst i filen:

```ts
import { COMPANIONS_DATABASE } from './collectibles.js';
```

### 5.6 Vejr/milj\u00f8-m\u00e5l

```ts
// --- NYE VEJR-M\u00c5L ---
{ id: 'catch_night', title: 'Natteravnen', description: 'Fang en fisk om natten.', icon: '\ud83c\udf19',
  category: 'fangst', condition: (s) => s.nightCatches >= 1,
  reward: { xp: 60, coins: 50 }, secret: false },

{ id: 'catch_10_rain', title: 'Regnvejrsfisk', description: 'Fang 10 fisk mens det regner.', icon: '\ud83c\udf27\ufe0f',
  category: 'fangst', condition: (s) => s.rainCatches >= 10,
  reward: { xp: 150, coins: 100 }, secret: false },

{ id: 'catch_snow', title: 'Sneregnsfisker', description: 'Fang en fisk i snefald.', icon: '\u2744\ufe0f',
  category: 'fangst', condition: (s) => s.snowCatches >= 1,
  reward: { xp: 80, coins: 75 }, secret: false },
```

**Note:** Vejr-m\u00e5lene placeres under `fangst` (ikke en separat kategori), da de handler om at fange fisk under specifikke forhold.

---

## Fase 6: Opdater getGoalRowProgress

**Fil:** `src/logic/goal-row-progress.ts`

Tilf\u00f8j `case`-blokke for alle nye m\u00e5l der har en meningsfuld progress-bar. M\u00e5l med boolean-betingelser (f.eks. `sharkCaught`) og secret-m\u00e5l viser typisk ikke progress, men de b\u00f8r stadig have en case s\u00e5 de returnerer `{ cur: 0/1, max: 1 }` for konsistens.

Tilf\u00f8j f\u00f8lgende cases i `switch`-blokken:

```ts
// Fangst-m\u00e5l med progress:
case 'catch_25':
  return { cur: Math.min(s.totalCatches, 25), max: 25 };
case 'catch_100':
  return { cur: Math.min(s.totalCatches, 100), max: 100 };
case 'catch_250':
  return { cur: Math.min(s.totalCatches, 250), max: 250 };
case 'first_junk':
  return { cur: Math.min(s.junkCatches, 1), max: 1 };
case 'catch_frog':
  return { cur: Math.min(s.frogCatches, 1), max: 1 };
case 'catch_shark':
  return { cur: s.sharkCaught ? 1 : 0, max: 1 };
case 'catch_narwhale':
  return { cur: s.narwhalCaught ? 1 : 0, max: 1 };
case 'catch_plesiosaur':
  return { cur: s.plesiosaurCaught ? 1 : 0, max: 1 };
case 'catch_golden_carp':
  return { cur: s.goldenCarpCaught ? 1 : 0, max: 1 };
case 'catch_all_tropisk':
  return { cur: Math.min(s.tropicalSpeciesCaught, TROPICAL_SPECIES_COUNT), max: TROPICAL_SPECIES_COUNT };
case 'catch_5_junk':
  return { cur: Math.min(s.junkCatches, 5), max: 5 };
case 'junk_tire':
  return { cur: Math.min(s.tireCaught, 1), max: 1 };
case 'junk_teddy':
  return { cur: Math.min(s.teddyCaught, 1), max: 1 };
case 'catch_bottle':
  return { cur: Math.min(s.bottleCatches, 1), max: 1 };

// Matematik-m\u00e5l:
case 'math_streak_3':
  return { cur: Math.min(s.maxCombo ?? 0, 3), max: 3 };
case 'math_streak_10':
  return { cur: Math.min(s.maxCombo ?? 0, 10), max: 10 };
case 'math_speed_5':
  return { cur: Math.min(s.speedSolves, 5), max: 5 };
case 'math_perfect_boss':
  return { cur: Math.min(s.perfectBossWins, 1), max: 1 };
case 'math_boss_10':
  return { cur: Math.min(s.bossWins, 10), max: 10 };
case 'jellyfish_10':
  return { cur: Math.min(s.jellyfishCaught ?? 0, 10), max: 10 };

// \u00d8konomi-m\u00e5l:
case 'earn_1000':
  return { cur: Math.min(s.totalEarned, 1000), max: 1000 };
case 'earn_25000':
  return { cur: Math.min(s.totalEarned, 25000), max: 25000 };
case 'first_upgrade':
  return { cur: Math.min(s.upgradesBought, 1), max: 1 };
case 'buy_luxury_boat':
  return { cur: s.hasLuxuryBoat ? 1 : 0, max: 1 };
case 'sell_legendary':
  return { cur: Math.min(s.legendarySold, 1), max: 1 };

// Udforskning-m\u00e5l:
case 'visit_cave':
  return { cur: s.areasVisited.includes('cave') ? 1 : 0, max: 1 };
case 'visit_arctic':
  return { cur: s.areasVisited.includes('arctic_sea') ? 1 : 0, max: 1 };
case 'visit_desert':
  return { cur: s.areasVisited.includes('desert_lake') ? 1 : 0, max: 1 };
case 'visit_forbidden':
  return { cur: s.areasVisited.includes('forbidden') ? 1 : 0, max: 1 };
case 'visit_jungle':
  return { cur: s.areasVisited.includes('jungle_island') ? 1 : 0, max: 1 };
case 'visit_cabin':
  return { cur: s.areasVisited.includes('cabin_living') ? 1 : 0, max: 1 };
case 'wish_first':
  return { cur: Math.min(s.wishesUsed ?? 0, 1), max: 1 };
case 'reach_3':
  return { cur: Math.min(s.maxLevel, 3), max: 3 };
case 'reach_15':
  return { cur: Math.min(s.maxLevel, 15), max: 15 };
case 'reach_25':
  return { cur: Math.min(s.maxLevel, 25), max: 25 };
case 'reach_30':
  return { cur: Math.min(s.maxLevel, 30), max: 30 };
case 'reach_35':
  return { cur: Math.min(s.maxLevel, 35), max: 35 };
case 'reach_40':
  return { cur: Math.min(s.maxLevel, 40), max: 40 };
case 'reach_45':
  return { cur: Math.min(s.maxLevel, 45), max: 45 };
case 'reach_50':
  return { cur: Math.min(s.maxLevel, 50), max: 50 };

// Samling-m\u00e5l:
case 'first_companion':
  return { cur: Math.min(s.companionsUnlocked ?? 0, 1), max: 1 };
case 'rat_friend':
  return { cur: s.ratUnlocked ? 1 : 0, max: 1 };
case 'parrot_friend':
  return { cur: s.parrotUnlocked ? 1 : 0, max: 1 };
case 'fossil_10':
  return { cur: Math.min(s.fossilCount ?? 0, 10), max: 10 };
case 'pearl_5':
  return { cur: Math.min(s.pearlCount ?? 0, 5), max: 5 };
case 'conch_5':
  return { cur: Math.min(s.conchCount ?? 0, 5), max: 5 };
case 'conch_first':
  return { cur: Math.min(s.conchCount ?? 0, 1), max: 1 };
case 'all_companions':
  return { cur: Math.min(s.companionsUnlocked ?? 0, COMPANIONS_DATABASE.length), max: COMPANIONS_DATABASE.length };

// Vejr-m\u00e5l:
case 'catch_night':
  return { cur: Math.min(s.nightCatches, 1), max: 1 };
case 'catch_10_rain':
  return { cur: Math.min(s.rainCatches, 10), max: 10 };
case 'catch_snow':
  return { cur: Math.min(s.snowCatches, 1), max: 1 };
```

**Import:** Tilf\u00f8j \u00f8verst i filen:
```ts
import { COMPANIONS_DATABASE } from '../data/collectibles';
import { TROPICAL_SPECIES_COUNT } from '../data/progression';
```

**Fjern** ogs\u00e5 det gamle `companion_master`-case fra switch-blokken.

---

## Fase 7: Opdater GoalsScreen UI

**Fil:** `src/components/screens/GoalsScreen.tsx`

### 7a: Opdater kategori-tabs

\u00c6ndr `categories`-arrayet til de nye kategorier:

```ts
// FRA:
const categories = ['alle', 'fangst', '\u00f8konomi', 'progression', 'udfordring', 'samling'];

// TIL:
const categories = ['alle', 'fangst', 'matematik', 'udforskning', 'samling', '\u00f8konomi'];
```

### 7b: Tjek MobileGoalsTab

**Fil:** `src/components/goals/MobileGoalsTab.tsx`

Unders\u00f8g om denne komponent ogs\u00e5 har en hardcoded kategori-liste og opdater tilsvarende.

### 7c: Overvej scrolling/paginering

Med ~80 m\u00e5l (dobbelt s\u00e5 mange som f\u00f8r) b\u00f8r det overvejes om m\u00e5l-listen kr\u00e6ver bedre scrolling. Dette er en valgfri forbedring, ikke et krav.

---

## Fase 8: Verificering og test

### 8a: TypeScript-kompilering

K\u00f8r `npx tsc --noEmit` for at verificere at alle nye GoalStats-felter er korrekt typet og at `buildGoalStatsSnapshot()` returnerer den rette type.

### 8b: Tjek for manglende stats-inkrementering

S\u00f8g efter alle steder i kodebasen, der kalder `setStats`, `incrementStat`, eller lignende funktioner i catch-engine og boss-logik. Verificer at de nye felter (`junkCatches`, `nightCatches`, `snowCatches`, `perfectBossWins`, `legendarySold` osv.) faktisk bliver inkrementeret n\u00e5r de relevante h\u00e6ndelser sker.

### 8c: Test-scenarie-tjekliste

- [ ] F\u00e5 en fangst \u2192 check `first_catch` stadig virker
- [ ] Skift kategori-tabs \u2192 nye kategorier vises korrekt
- [ ] Secret-m\u00e5l vises som ??? i rigtige kategorier
- [ ] Progress-bars viser korrekt for `catch_25`, `math_streak_3`, `fossil_10` osv.
- [ ] `all_companions` viser korrekt max (8, ikke 5)
- [ ] `earn_500` viser ny titel "God start"
- [ ] `reach_10` viser \ud83c\udf1f (ikke \u2b50)
- [ ] Ingen TypeScript-fejl ved build

### 8d: Backward compatibility med gemte spil

Spillere med eksisterende save-data skal ikke miste fremskridt. Da de nye stats-felter har default-v\u00e6rdier (0, false), vil de starte fra 0 for eksisterende spillere. Det er acceptabelt \u2014 men overvej om nogen af de nye felter kan udledes retrospektivt (f.eks. `junkCatches` fra historik). Sandsynligvis ikke, og det er ok.

---

## Opsummering: Filer der \u00e6ndres

| Fil | Type \u00e6ndring |
|-----|---------------|
| `src/types/progression.ts` | Tilf\u00f8j ~17 nye felter til GoalStats |
| `src/data/progression.ts` | Slet companion_master, ret earn_500/ikoner, migrer kategorier, tilf\u00f8j ~40 nye m\u00e5l, tilf\u00f8j TROPICAL_SPECIES_COUNT, tilf\u00f8j import af COMPANIONS_DATABASE |
| `src/logic/goal-progress.ts` | Udvid buildGoalStatsSnapshot() med nye felter |
| `src/logic/goal-row-progress.ts` | Tilf\u00f8j ~40 nye cases, fjern companion_master case, tilf\u00f8j imports |
| `src/components/screens/GoalsScreen.tsx` | Opdater kategori-tabs |
| `src/components/goals/MobileGoalsTab.tsx` | Opdater kategori-tabs (hvis hardcoded) |
| `src/store/usePlayerStore.ts` | Tilf\u00f8j nye stat-felter med defaults |
| `src/logic/xp-engine.ts` | Tilf\u00f8j nye felter i `emptyStats()` |
| `src/components/fishing/MathChallenge.tsx` | Inkrementer nye stats i `setStats`-kaldet |
| Salgs-/shop-komponenter | Inkrementer `legendarySold` |
| Boss-kamp-logik | Inkrementer `perfectBossWins` |

## Prioriteret r\u00e6kkef\u00f8lge

1. **Fase 1** (GoalStats type) \u2192 fundament
2. **Fase 2** (buildGoalStatsSnapshot + store) \u2192 data-pipeline
3. **Fase 3** (ret fejl) \u2192 oprydning
4. **Fase 4** (migrer kategorier) \u2192 struktur
5. **Fase 5** (nye m\u00e5l) \u2192 indhold
6. **Fase 6** (getGoalRowProgress) \u2192 progress-visning
7. **Fase 7** (UI) \u2192 synlighed
8. **Fase 8** (test) \u2192 validering

Hver fase er designet s\u00e5 koden kompilerer og virker efter f\u00e6rdigg\u00f8relse, s\u00e5 man kan teste undervejs.
