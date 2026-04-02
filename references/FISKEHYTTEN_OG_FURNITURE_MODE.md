# RegneFisken 3D — Fiskehytten & Furniture Mode

Grundig teknisk reference til samtale om fiskehytten og møbel-arrangering udenfor Cursor.

---

## 1. Projektoverblik

**RegneFisken 3D** er et afslappende 3D-fiskespil kombineret med regneudfordringer. Dansk UI. Spilleren kaster snøre, reagerer på bid, løser regneopgaver for at trække fisk ind, tjener XP/mønter, opgraderer udstyr og låser nye lokationer op.

### Tech-stack

| Lag | Valg |
|-----|------|
| Build | Vite 8 |
| UI | React 19, TypeScript 5.9 |
| Styling | Tailwind CSS 4 |
| 3D | Three.js ~0.183, React Three Fiber 9, Drei 10 |
| State | Zustand 5 (ingen React Router, ingen Context) |
| Tests | Vitest |

### Arkitektur-principper

- **Ingen URL-routing** — navigation sker udelukkende via Zustand-tilstandsændringer (`useGameStore.currentLocation`).
- **Ét enkelt R3F `<Canvas>`** — alle lokationer lever som betingede R3F-undertræer i samme scene.
- **Data-drevet lokationer** — én `LOCATIONS`-tabel driver oplåsning, rejse, vand/tåge-farver, og megen 3D/UI-adfærd.
- **100% procedurel geometri** — ingen `.glb`/`.gltf`-filer; alt er kode-drevet Three.js (`boxGeometry`, `sphereGeometry`, `cylinderGeometry`, `BufferGeometry`, shaders osv.).
- **10 Zustand-stores** under `src/store/` opdelt efter ansvarsområde (spiltilstand, spiller, matematik, fiskeri, UI, save, collection, bucket, editor, admin).

---

## 2. Lokationssystemet

Spillet har disse lokationer (alle defineret i `src/data/locations.ts`):

| ID | Navn | Type | Oplåsning |
|----|------|------|-----------|
| `pier` | Den Gamle Mole | `fishing` | Altid tilgængelig (start) |
| `smaragd` | Skovsøen | `fishing` | Level 3 + Rejsekort |
| `abyss` | Dybet | `fishing` | Level 8 + Rejsekort |
| `forbidden` | Den Forbudte Sø | `fishing` | Komplet skattekort (venstre + højre halvdel) |
| `desert_lake` | Ørkensøen | `fishing` | Alt ørkenudstyr |
| `arctic_sea` | Ishavet | `fishing` | Alt ishavsudstyr |
| `tropical_island` | Den Tropiske Ø | `fishing` | Robåd |
| `cave` | Den Mørke Grotte | `fishing` | Robåd + pandelampe |
| `fishing_cabin` | Fiskehytten | `base` | Magnet-upgrade + cabin_key |
| `jungle_island` | Jungleøen | `world` | Opdaget via Plesiosaurus |

Lokationstyper:
- **`fishing`** — standard fiskeri-lokation med vand, stang, flåd, fiskepulje.
- **`base`** — hytten; ingen fiskeri, interiør med møbler.
- **`world`** — jungleøen; ligesom cabin: ingen fiskeri-stack, men anderledes gameplay.

Rejse sker via `TravelNavModal` → `setCurrentLocation(id)`. Streak nulstilles ved rejse.

---

## 3. Fiskehytten (fishing_cabin)

### 3.1 Hvad er fiskehytten?

Fiskehytten er spillerens hjem — en indendørs lokation med `type: 'base'` og `noFishing: true`. Den indeholder møbler, kæledyr og dekorationer, som spilleren kan arrangere frit. Hytten fungerer som et "belønningsrum" og et samlingspunkt for unlockede kompagnoner og skatte.

Beskrivelsen i koden: *"Dit hjem — slap af med dine kæledyr"*.

### 3.2 Oplåsning

Fiskehytten kræver **to ting** for at kunne besøges:
1. **Magnet-upgrade** (`upgrades.includes('magnet')`)
2. **Cabin Key** (`questItems.includes('cabin_key')`)

Nøglen ("Fiskehyttens Nøgle") er en quest-fisk der fanges med magneten fra Den Gamle Mole. UI-flowet guider spilleren via `PierCabinHint`-komponenten.

### 3.3 Hvad der IKKE renderes i hytten

Når `currentLocation` er `fishing_cabin` (eller `jungle_island`), betragtes lokationen som `isWorldLocation`, og hele fiskeri-stakken deaktiveres:

- Ingen `FishPool`, `Bucket`, `Rod`, `Bobber`, `FishingLine`
- Ingen `CaveFillLights`, `PierLantern`
- Ingen `FishingControls` (UI returnerer `null` ved idle)
- Ingen `WaterSurface` (mesh skjules, opdateringer springes over)
- Ingen `LocationDock` (returnerer `null`)
- Ingen global `NightSky` stjernepunkter (erstattet af vindue-stjernefelt)

### 3.4 Hvad der renderes i stedet

Hytten er bygget som én stor `FishingCabin`-komponent (`src/three/environments/FishingCabin.tsx`), monteret via `LocationScenery` når `currentLocation === 'fishing_cabin'`. Dertil monteres `CabinFurnitureDrag` i `Experience.tsx`.

#### Rum-dimensioner

```
Bredde (W) = 12 enheder
Dybde (D) = 10 enheder
Højde foran (H) = 5.5 enheder
Højde bag (H_BACK) = 9.0 enheder
Z-front (ZF) = 5
Z-bag (ZB) = -5
```

#### Strukturelle elementer (ikke-flytbare)

- **Gulv** — vandret plan, brun træfarve
- **Sidevægge** — venstre og højre, brun træ
- **Bagvæg** — opdelt omkring vinduet (venstre side, højre side, top-stykke, bund-stykke)
- **Vindue** — 2.8 × 2.0 enheder, transparent glasplan, sprouts med mørke ramme-bjælker
- **Tag-bjælker** — to diagonale bjælker der danner skrå loft
- **Dør** — venstre side, med synlig ramme, dørplade og messing-dørhåndtag; usynligt hit-target for klik → rejsemenu

#### Lys

- **Vindues-pointlight** — blåligt, svagt (0.6 intensitet)
- **Fyld-pointlight (fill)** — varmt, centralt (1.2 intensitet, justeres efter tid: nat=0.5, morgen/aften=0.9, dag=1.2)
- **Pejs-pointlight** — varm orange (2.5 ± 0.7 flimrende), position ved pejs

#### Stjernefelt bag vinduet

`CabinWindowStarfield` er en shader-plane placeret bag bagvæggen (dybere Z end sky/fugle-Z-båndet). Den viser procedurale stjerner kun i den øvre del af vinduets UV-område. Erstatter det globale `NightSky` som er slukket for hytten.

#### Måger

Speciel spawn-logik i `AmbientLife.tsx`: for hytten forskydes fuglenes X langt negativt (ca. −28..31) og retning tvinges, så de ser ud som om de flyver forbi udenfor vinduet.

### 3.5 Kamera

Fra `CameraRig.tsx`:
- **Idle-position i hytten:** `(0, 2.8, 8.0)`
- **Look-at:** `(0, 1.6, -1)`

Til sammenligning bruger Den Gamle Mole: position `(0, 4.6, 13)`, look-at `(0, 0.3, 0)`.

### 3.6 Navigation ud af hytten

Spilleren klikker på **døren** (raycast mod `cabinDoorHitRef`). Hvis `canOpenTravelMenu` er opfyldt (mere end én oplåst lokation, level/items OK), åbnes `TravelNavModal`. Ellers vises en fejl-toast ("Kræver level X" eller "Du mangler fiskekort!").

Samme rejsemenu kan også åbnes via `GameCornerUI`.

### 3.7 Interaktioner (uden for furniture mode)

- **Klik på dør** → rejsemenu (prioriteret over alt andet)
- **Klik på skildpadde** → åbner wild turtle modal (`setShowWildTurtleModal(true)`)

### 3.8 Første besøg

`CabinFirstVisitModal` vises når `hasVisitedCabin` er `false` i `useCollectionStore`. Sættes derefter til `true`.

---

## 4. Møbler og genstande i hytten

### 4.1 Altid tilstede (faste møbler)

Disse er altid til stede i hytten og kan altid flyttes i furniture mode:

| `movableType` | Beskrivelse | Default position | Default Y |
|----------------|-------------|------------------|-----------|
| `fireplace` | Stenpejs med kul, animerede flammer, flimrende pointlight | `(-3.6, 0, -4.5)` | 0 |
| `table` | Træbord med fire cylindriske ben | `(0.22, 0, -1.0)` | 0 |
| `rug` | Stribet gulvtæppe (canvas-tekstur: beige med bordeaux striber, mørk kant) | `(0.3, 0, -1.0)` | 0 |
| `chair` | Trægstol med sæde, ryglæn, fire ben | `(1.34, 0, -1.0)` rot: 270° | 0 |
| `aquarium` | Akvarium med glas-sider, vand-volumen, bobler, animeret guldfisk | `(4.15, -0.2, -4.2)` | -0.2 |
| `shelf` | Bogreol med 3 hylder og procedurale farvede bøger | `(5.4, 0, 1.5)` rot: -90° | 0 |
| `rod_wall` | Fiskestangsholder med 4 tematiske lavpoly-stænger + usynlig hitbox | `(5.4, 2.091, -1.3)` rot: -90° | 2.091 |
| `table_vase` | Glasvase med blomster (gul kegle + blå kugle) | `(0.22, 1.215, -1.0)` | 1.215 |

### 4.2 Betingede møbler/kompagnoner

Disse vises kun når bestemte betingelser er opfyldt:

| `movableType` | Betingelse | Beskrivelse | Default Y |
|----------------|-----------|-------------|-----------|
| `turtle` | `questItems.includes('turtle_hatched')` | `GiantLandTurtle` med `cabinIdle`; bob-animation og drejer mod kamera; hovedbevægelser | 0.19 |
| `axolotl` | `questItems.includes('has_axolotl')` | `AxolotlCatchModel` (statisk, `animated={false}`) skaleret 0.292× | 1.33 |
| `cheese` | `cheeseSources.includes('shop') \|\| cheeseSources.length >= 3` | Pentagonal ost-frustum med huller (procedurel) skaleret 2.5× | 0.08 |
| `golden_frog` | `useCollectionStore.hasGoldenFrog` | `GoldenFrog`-model | 0 |

### 4.3 Ikke-flytbare elementer

- **Vinduet** — har `isMovable: false` og `movableType: 'window'` men er IKKE i `cabinMovableRoots` listen.
- Alle strukturelle elementer (vægge, gulv, tag, dør) er faste.

### 4.4 Skildpaddens specielle adfærd

Når hytten vises og furniture mode er FRA, kører `useFrame` en idle-animation på skildpadden:
- **Bob-animation:** `position.y = baseY + sin(time/500) * 0.008`
- **Drej mod kamera:** gradvis (`diff * 0.015` per frame)
- **Hovedbevægelser:** sinus-baseret rotation på head-bone (`turtleHead`), x/y/z akser

Når furniture mode er TIL, stoppes disse animationer, og skildpadden kan frit flyttes.

Ved exit af furniture mode gemmes den aktuelle Y som `_savedY` på skildpaddegruppens `userData`, så bobbing-animation bruger den nye baseline.

---

## 5. Furniture Mode ("Arranger Møbler")

### 5.1 Tilstand (State)

| Store | Felt | Type | Persisteret? |
|-------|------|------|--------------|
| `useGameStore` | `furnitureMode` | `boolean` | Nej (session) |
| `useGameStore` | `selectedFurniture` | `string \| null` | Nej (session) |
| `usePlayerStore` | `furniturePositions` | `Record<string, {x,y,z,rot?}>` | Ja (localStorage) |

`furnitureMode` og `selectedFurniture` nulstilles ved at forlade hytten (effect i `CabinFurnitureDrag`).

### 5.2 Filstruktur

| Fil | Ansvar |
|-----|--------|
| `src/three/cabin/CabinFurnitureDrag.tsx` | Pointer/touch raycasts, drag, wheel-rotation, dør-klik, skildpadde-klik, cursor |
| `src/three/cabin/cabinFurniturePersistence.ts` | Snapshot/apply/reset positioner, Y-defaults, reset-defaults |
| `src/three/cabin/cabinMovablesRef.ts` | Delt `cabinMovableRoots` ref-array (alle flytbare objekter) |
| `src/three/cabin/cabinDoorRef.ts` | Delt ref for dør-hit-target |
| `src/components/hud/CabinFurnitureBar.tsx` | Bund-HUD: toggle mode, nulstil, nudge rotation/højde, hints |
| `src/three/environments/FishingCabin.tsx` | Bygger hytten, tagger movables med `userData`, genopbygger movable-liste, anvender gemte positioner |

### 5.3 Aktivering / deaktivering

- **Aktivér:** Spilleren trykker "🛋 Arranger møbler" i `CabinFurnitureBar`
- **Deaktivér:** "✅ Færdig" (samme knap), ELLER automatisk ved location-skift
- Ved deaktivering: `persistMovables()` → gemmer alle positioner, synker skildpaddens `_savedY`, nulstiller `selectedFurniture`

### 5.4 Interaktionsflow (pointer down)

Præbetingelser: `gameState === 'idle'` og `currentLocation === 'fishing_cabin'`

1. **Raycast mod dør** (`cabinDoorHitRef`) → hit? → åbn rejsemenu → **return** (dør prioriteres ALTID)
2. **Ikke i furniture mode + raycast mod skildpadde** → hit? → åbn turtle modal → **return**
3. **Ikke i furniture mode** → **return** (ingen yderligere interaktion)
4. **I furniture mode:** raycast mod `cabinMovableRoots` med `intersectObjects(objs, true)`
   - Intet hit → `setSelectedFurniture(null)` (deselect)
   - Hit → `findMovableRoot()`: vandrer op i parent-hierarkiet til `userData.isMovable === true`
   - Start drag: gem root-ref, opret horizontal drag-plane ved objektets Y, sæt `selectedFurniture` til `movableType`, kald `persistMovables()`, cursor → `grabbing`

### 5.5 Drag (pointer move)

- Raycast mod den horisontale drag-plane (normal `(0,1,0)`, constant = `-root.position.y`)
- Opdaterer **kun X og Z** (Y forbliver uændret under drag)
- **Clamp-bounds:**
  - `x ∈ [-5.4, 5.4]`
  - `z ∈ [-4.6, 3.5]`
- Disse bounds svarer omtrent til rummets indvendige vægge

### 5.6 Rotation

To metoder:

1. **Musehjul (wheel):** `rotation.y += deltaY * 0.003` — virker på det objekt der drages, eller det valgte objekt
2. **HUD-knapper:** ↩ og ↪ i `CabinFurnitureBar` → `nudgeSelected(0, ±π/8)` (22.5° per tryk)

### 5.7 Højde-justering

Kun via HUD-knapper: ↑ og ↓ → `nudgeSelected(±0.12, 0)` — ændrer `position.y` med 0.12 enheder per tryk.

Højde ændres ALDRIG ved horizontal drag.

### 5.8 Nulstilling

"↺ Nulstil"-knap i `CabinFurnitureBar` → `resetFurnitureToDefaults(movables)`:
- Sætter alle movables til deres `FURNITURE_RESET_DEFAULTS` (x, z, rot)
- Y sættes til `Y_DEFAULTS[type]` eller 0
- Persisterer derefter

### 5.9 Cursor-adfærd

| Kontekst | Cursor |
|----------|--------|
| Over dør | `pointer` |
| I furniture mode (ikke drager) | `grab` |
| Drager objekt | `grabbing` |
| Alt andet | `default` |

### 5.10 HUD (`CabinFurnitureBar`)

Placeret `fixed`, centreret i bunden (~1.5rem fra bund), `z-index: 9990`.

Kun synlig når `currentLocation === 'fishing_cabin'`.

**Tilstande:**

1. **Furniture mode OFF:** Viser "🛋 Arranger møbler"-knap (mørk brun baggrund, gul tekst)
2. **Furniture mode ON, intet valgt:** Viser "✅ Færdig" + "↺ Nulstil" + hint-tekst "Klik på et møbel for at vælge det — træk for at flytte"
3. **Furniture mode ON, møbel valgt:** Viser ↩↪↑↓ kontrolknapper + "✅ Færdig" + "↺ Nulstil" + hints om scroll/pilknapper

---

## 6. Persistering

### 6.1 Furniture positions

`furniturePositions` i `usePlayerStore` er et `Record<string, { x, y, z, rot? }>` nøglet af `movableType`.

**Snapshot** (`snapshotFurniturePositions`): læser `position.x/y/z` og `rotation.y` fra hvert movable roots `userData.movableType`.

**Apply** (`applyFurniturePositions`): ved load/layout-ændring → sætter `position.x`, `position.z`, `rotation.y` fra gemte data. Y bruger gemt værdi hvis tilgængelig, ellers `Y_DEFAULTS[type]` (ellers 0).

**Hvornår persist kører:**
- Drag start (snapshot ved onDown)
- Drag slut (onUp)
- Wheel-rotation
- HUD nudge (rotation/højde)
- Exit furniture mode
- Reset

**Game save:** `game-persistence.ts` inkluderer `furniturePositions` i `buildGameSave` og gendanner den i `applyGameSave`. Gemmes i localStorage under `regnefisken_save`.

### 6.2 Y-defaults (fallback ved manglende Y-data)

```
turtle: 0.19
axolotl: 1.33
aquarium: -0.2
table_vase: 1.215
rod_wall: 2.091
rug: 0
cheese: 0.08
golden_frog: 0
```

### 6.3 Reset-defaults

```
fireplace:   x=-3.6,  z=-4.5,  rot=0
table:       x=0.22,  z=-1.0,  rot=0
rug:         x=0.3,   z=-1.0,  rot=0
chair:       x=1.34,  z=-1.0,  rot=270° (3π/2)
aquarium:    x=4.15,  z=-4.2,  rot=0
shelf:       x=5.4,   z=1.5,   rot=-90° (-π/2)
rod_wall:    x=5.4,   z=-1.3,  rot=-90° (-π/2)
turtle:      x=-1.92, z=-1.48, rot≈-27° (-π*0.15)
axolotl:     x=1.0,   z=-1.0,  rot=60° (π/3)
table_vase:  x=0.22,  z=-1.0,  rot=0
cheese:      x=-2.65, z=1.95,  rot=0
golden_frog: x=5.13,  z=0.21,  rot≈-137° (-2.4)
```

### 6.4 Movable-liste genopbygning

`rebuildMovableList()` i `FishingCabin` genopbygges via `useLayoutEffect` når `furniturePositions`, `hasTurtle`, `hasAxolotlInCabin`, `showCheese` eller `hasGoldenFrog` ændres. Den fylder `cabinMovableRoots.current` og kalder `applyFurniturePositions`.

---

## 7. Kompagnoner og oste-system

### 7.1 Kompagnoner i hytten

- **Skildpadde** — kræver `turtle_hatched` i `questItems`. Opnås via turtle-æg-timer/hatch-flow (æg fundet på Den Tropiske Ø).
- **Axolotl** — kræver `has_axolotl` i `questItems`. Opnås fra boss-fangst-flow.
- **Guldfroe** — kræver `hasGoldenFrog` i `useCollectionStore`. Opnås fra fangst/collection-system.

### 7.2 Ost-systemet

`cheeseSources` i `usePlayerStore` er et string-array der tracker forskellige ost-kilder:
- `'shop'` — købt "Gammel Stærk Ost" (legendarisk kategori i butikken)
- `'pirate_chest'` — fundet i piratkiste på Den Forbudte Sø
- `'pingvin'` — givet af pingvin-NPC via collectible-modal

**Ost-møbel synligt når:** `cheeseSources.includes('shop') || cheeseSources.length >= 3`

Tre oste-kilder låser desuden rotte-kompagnonen op (via `GoalProgressSync`).

---

## 8. Samlet dataflow-diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FishingCabin.tsx                         │
│  Bygger R3F-grupper med userData={ isMovable, movableType }    │
│  rebuildMovableList() → fylder cabinMovableRoots               │
│  useLayoutEffect → applyFurniturePositions(roots, positions)   │
└──────────────────────────────┬──────────────────────────────────┘
                               │ refs
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    cabinMovableRoots (ref)                      │
│  Array af Group-objekter der kan interageres med                │
└──────────────────────────────┬──────────────────────────────────┘
                               │ læses af
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CabinFurnitureDrag.tsx                        │
│  pointerdown → raycast dør/turtle/møbler                       │
│  pointermove → drag XZ med clamp                               │
│  pointerup   → persist                                         │
│  wheel       → rotation.y                                      │
│  → snapshotFurniturePositions → setFurniturePositions           │
└──────────────────────────────┬──────────────────────────────────┘
                               │ skriver til
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│           usePlayerStore.furniturePositions                     │
│  Record<movableType, { x, y, z, rot }>                        │
│  Persisteret i localStorage via game-persistence.ts            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   CabinFurnitureBar.tsx                         │
│  Toggle furnitureMode (useGameStore)                           │
│  Reset → resetFurnitureToDefaults + persist                    │
│  Nudge ↑↓↩↪ → direkte position/rotation ændring + persist     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Vigtige filstier (reference)

### Kerne-hyttefiler
- `src/three/environments/FishingCabin.tsx` — hovedscene (alt geometri + animation)
- `src/three/environments/LocationScenery.tsx` — monterer `<FishingCabin />` betinget
- `src/three/Experience.tsx` — monterer `CabinFurnitureDrag`, styrer `isWorldLocation`

### Cabin-undermappe
- `src/three/cabin/CabinFurnitureDrag.tsx` — drag/klik-logik
- `src/three/cabin/cabinFurniturePersistence.ts` — snapshot/apply/reset + defaults
- `src/three/cabin/cabinMovablesRef.ts` — delt movable-liste
- `src/three/cabin/cabinDoorRef.ts` — delt dør-ref
- `src/three/cabin/CabinRodWall.tsx` — fiskestangsholder
- `src/three/cabin/CabinWindowStarfield.tsx` — shader-stjernefelt

### Modeller brugt i hytten
- `src/three/models/GiantLandTurtle.tsx` — skildpadde med `cabinIdle`-prop
- `src/three/models/GoldenFrog.tsx` — guldfroe
- `src/three/models/bossCatchMiniModels.tsx` — `AxolotlCatchModel`

### State stores
- `src/store/useGameStore.ts` — `furnitureMode`, `selectedFurniture`, `currentLocation`
- `src/store/usePlayerStore.ts` — `furniturePositions`, `questItems`, `cheeseSources`
- `src/store/useCollectionStore.ts` — `hasGoldenFrog`, `hasVisitedCabin`

### Data / config
- `src/data/locations.ts` — `LOCATIONS` objekt med `fishing_cabin` config
- `src/logic/travel-unlock.ts` — `getUnlockedAreas`, `isAreaUnlocked`, `canOpenTravelMenu`
- `src/logic/game-persistence.ts` — save/load inkl. furniturePositions

### UI
- `src/components/hud/CabinFurnitureBar.tsx` — møbel-HUD
- `src/components/modals/CabinFirstVisitModal.tsx` — første-besøg overlay
- `src/components/hud/PierCabinHint.tsx` — mole-hints om magnet/nøgle
- `src/components/modals/TravelNavModal.tsx` — rejsemenu (inkl. dør-exit)

### Miljø/effekter der tilpasses for hytten
- `src/three/effects/CameraRig.tsx` — cabin idle position/look-at
- `src/three/effects/NightSky.tsx` — deaktiverer globale stjerner i cabin
- `src/three/effects/WaterSurface.tsx` — skjuler vand i cabin
- `src/three/effects/AmbientLife.tsx` — speciel måge-spawn for cabin
- `src/three/logic/environment.ts` — cabin-specifikke sky/fog/ambient tweaks
- `src/three/logic/backgroundZBounds.ts` — cabin Z-bånd for fugle/skyer

---

## 10. Nøglekoncepter for videre samtale

1. **`movableType`** er den kanoniske nøgle for møbler — en streng på `userData` der bruges til selektion, persistering og reset.
2. **Drag er XZ-only** med hard clamp; Y justeres kun via HUD-knapper.
3. **Ingen grid/snap** — bevægelse er kontinuerlig; ingen kollision mellem møbler.
4. **Dør-klik prioriteres altid** over furniture-interaktion.
5. **Skildpadden har dual-mode:** idle-animation (bob + kamera-tracking) når furniture mode er fra; statisk/flyttelig når furniture mode er til.
6. **Alt er procedurel 3D** — ingen importerede modelfiler; ændringer sker i JSX/TSX-kode.
7. **Betingede møbler** (turtle, axolotl, cheese, golden_frog) tilføjes/fjernes fra movable-listen dynamisk via `rebuildMovableList()` + `useLayoutEffect`.
8. **Session vs. persistent:** `furnitureMode`/`selectedFurniture` er session-only (Zustand, ikke gemt); `furniturePositions` er persistent (localStorage).
