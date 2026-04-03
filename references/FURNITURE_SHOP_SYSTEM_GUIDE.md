# Møbelbutik-system — Implementeringsguide for Composer

> **Formål:** Denne guide beskriver det komplette design af en ny "🏠 Møbler"-fane i ShopModal, hvor spilleren kan købe møbler til Fiskehytten. Guiden er struktureret i logiske faser med stop-og-tjek-punkter, så Composer kan implementere trinvist.
>
> **Kontekst:** Fiskehytten har allerede et fuldt fungerende furniture mode med drag, rotation, persistering og reset. Denne guide tilføjer et *købssystem* oven på det eksisterende system, samt mulighed for at flytte møbler mellem rum.
>
> **Vigtig note om saves:** Denne opdatering udsendes sammen med et tvunget hard reset af alle spilleres saves. Der er derfor **ingen behov for migration eller backward compatibility**. Alle spillere starter forfra med `unlockedFurniture: []`.
>
> **Relaterede reference-filer (geometri-specifikationer):**
> - `references/FISKEHYTTEN_MOEBLER_IMPLEMENTERING (1).md` — Detaljeret geometri, materialer, positioner og farver for **bølge 1**-møbler (7 køkkenmøbler + 6 soveværelsemøbler). Denne fil er den primære kilde til hvordan hvert møbel skal opbygges i 3D.
> - `references/FISKEHYTTEN_MOEBLER_BOELGE2.md` — Geometri-specifikationer for **bølge 2**-møbler (5 stue + 5 køkken + 5 soveværelse). Disse møbler er endnu ikke i butik-kataloget men kan tilføjes senere.
>
> Nærværende guide dækker **købssystem, state, UI, cross-room flytning og faser**. For den konkrete 3D-opbygning af hvert møbel, se de to geometri-filer ovenfor.

---

## Designoverblik

### Kernekoncept

Alle rum i fiskehytten starter **helt tomme** — kun strukturelle elementer (vægge, gulv, tag, døre, vinduer, lys) er til stede fra start. Spilleren åbner butikken → ser den nye "🏠 Møbler"-fane → vælger et rum (Stue / Køkken / Soveværelse) → køber møbler for coins → møblet spawner straks i hytten på sin default-position. Køb er permanente (ét eksemplar per møbel).

**Frit rum-valg:** Spilleren kan i furniture mode flytte ethvert møbel til et andet rum end dets standard-rum. En pejs købt via "Stue"-fanen kan placeres i soveværelset, en seng kan stå i stuen, osv. Butikkens rum-inddeling er kun til organisering og bestemmer default-positionen — ikke den endelige placering.

### Hvad der IKKE ændres (strukturelle elementer)

Disse er **ikke** møbler og forbliver altid tilstede i deres respektive rum:

- **Stue:** Vægge, gulv, tag, tagbjælker, vindue (inkl. glasplan og ramme), dør med ramme og håndtag, lys (vindues-pointlight, fyld-pointlight), CabinWindowStarfield
- **Køkken:** Vægge, gulv, tag, tagbjælker, vindue, døre (til stue og soveværelse), lys
- **Soveværelse:** Vægge, gulv, tag, tagbjælker, vindue, dør (til køkken), lys

> **Bemærk:** Pejsens dedikerede pointlight (den varme orange-glød) er nu knyttet til pejs-møblet og renderes kun i det rum hvor pejsen befinder sig. Stuens fyld-pointlight og vindues-pointlight forbliver altid aktive.

Alt andet — alle møbler, dekorationer og genstande — kræver køb.

### Hvad kræver køb i butikken

**Alle** møbler i alle tre rum erhverves via butikken. Det inkluderer:

- **Stue (default):** Pejs, bord, gulvtæppe, stol, bogreol, fiskestangsholder, vase, vægfisk, akvarium
- **Køkken (default):** Køkkenbord, komfur, køkkenvask, køkkenstol, hængehylde, køkkentæppe, loftslampe, kikkert
- **Soveværelse (default):** Seng, natbord, natbordslampe, kommode, soveværelsetæppe, billedramme

### Hvad der IKKE er i butikken (quest-baseret)

Kompagnoner erhverves via quests og er **ikke** en del af møbelbutikken:

| Kompagnon | Erhvervelses-metode |
|---|---|
| Skildpadde (`turtle`) | Quest: `questItems.includes('turtle_hatched')` |
| Axolotl (`axolotl`) | Quest: `questItems.includes('has_axolotl')` |
| Ost (`cheese`) | Quest/samling: `cheeseSources.includes('shop') \|\| cheeseSources.length >= 3` |
| Gylden frø (`golden_frog`) | Samling: `hasGoldenFrog` i `useCollectionStore` |

Disse kompagnoner optræder automatisk i hytten når deres betingelse er opfyldt. **Kompagnoner kan også flyttes mellem rum** via furniture modes rum-flyt-funktion, præcis som købte møbler.

---

## Datamodel

### Ny store-state: `unlockedFurniture`

Tilføj til `usePlayerStore`:

```typescript
unlockedFurniture: string[]    // Array af movableType-strenge
unlockFurniture: (type: string) => void
```

Eksempel efter et par køb: `['fireplace', 'table', 'kitchen_stove', 'bedroom_bed']`

### Ny store-state: `furnitureRoomAssignment`

Tilføj til `usePlayerStore`:

```typescript
furnitureRoomAssignment: Record<string, 'living' | 'kitchen' | 'bedroom'>
moveFurnitureToRoom: (type: string, room: 'living' | 'kitchen' | 'bedroom') => void
```

Dette record holder styr på hvilket rum hvert møbel befinder sig i. **Kun møbler der er flyttet væk fra deres default-rum har en entry.** Hvis et møbel ikke findes i `furnitureRoomAssignment`, er det i sit default-rum (fra `FURNITURE_SHOP_ITEMS` eller `QUEST_COMPANION_DEFAULTS`).

```typescript
// Hjælpefunktion til at slå aktuelt rum op
const QUEST_COMPANION_DEFAULTS: Record<string, 'living' | 'kitchen' | 'bedroom'> = {
  turtle: 'living',
  axolotl: 'living',
  cheese: 'living',
  golden_frog: 'living',
}

function getCurrentRoom(
  type: string,
  furnitureRoomAssignment: Record<string, string>,
): 'living' | 'kitchen' | 'bedroom' {
  if (furnitureRoomAssignment[type]) return furnitureRoomAssignment[type] as any
  const shopItem = FURNITURE_SHOP_ITEMS.find(f => f.id === type)
  if (shopItem) return shopItem.room
  return QUEST_COMPANION_DEFAULTS[type] ?? 'living'
}
```

### Ny store-state: `hiddenFurniture`

```typescript
hiddenFurniture: string[]    // movableTypes der er skjult
toggleHiddenFurniture: (type: string) => void
```

### Møbel-katalog: `FURNITURE_SHOP_ITEMS`

Nyt dataobjekt (foreslået placering: `src/data/furnitureShopItems.ts`):

```typescript
export type RoomId = 'living' | 'kitchen' | 'bedroom'

export interface FurnitureShopItem {
  id: string              // Matcher movableType
  name: string            // Dansk visningsnavn
  emoji: string           // Emoji-ikon
  description: string     // Kort beskrivelse (1 linje)
  room: RoomId            // Default-rum (bruges til butiks-kategorisering og initial spawn)
  price: number           // I coins
}

export const FURNITURE_SHOP_ITEMS: FurnitureShopItem[] = [
  // ── STUE ──
  { id: 'fireplace',         name: 'Brændeovn',            emoji: '🔥', description: 'Stenpejs med animerede flammer',           room: 'living',   price: 600  },
  { id: 'table',             name: 'Bord',                 emoji: '🪵', description: 'Stort træbord med fire ben',               room: 'living',   price: 400  },
  { id: 'rug',               name: 'Gulvtæppe',            emoji: '🟫', description: 'Stribet tæppe i varme farver',             room: 'living',   price: 300  },
  { id: 'chair',             name: 'Stol',                 emoji: '🪑', description: 'Trægstol med ryglæn',                     room: 'living',   price: 300  },
  { id: 'shelf',             name: 'Bogreol',              emoji: '📚', description: 'Reol med tre hylder og farvede bøger',    room: 'living',   price: 500  },
  { id: 'rod_wall',          name: 'Fiskestangsholder',    emoji: '🎣', description: 'Vægmonteret holder med fire stænger',     room: 'living',   price: 400  },
  { id: 'table_vase',        name: 'Vase med blomster',    emoji: '💐', description: 'Glasvase med gul og blå blomst',          room: 'living',   price: 200  },
  { id: 'mounted_fish',      name: 'Vægfisk',              emoji: '🐟', description: 'Vægmonteret trofæ-fisk',                 room: 'living',   price: 500  },
  { id: 'aquarium',          name: 'Akvarium',             emoji: '🐠', description: 'Glas-akvarium med guldfisk og bobler',    room: 'living',   price: 800  },

  // ── KØKKEN ──
  { id: 'kitchen_table',     name: 'Køkkenbord',           emoji: '🪵', description: 'Langt træbord langs vinduet',             room: 'kitchen',  price: 500  },
  { id: 'kitchen_stove',     name: 'Komfur',               emoji: '🍳', description: 'Fritstående ovn med fire kogeplader',     room: 'kitchen',  price: 600  },
  { id: 'kitchen_sink',      name: 'Køkkenvask',           emoji: '🚰', description: 'Vask med messinghane og underskab',       room: 'kitchen',  price: 500  },
  { id: 'kitchen_chair',     name: 'Køkkenstol',           emoji: '🪑', description: 'Trægstol til køkkenbordet',               room: 'kitchen',  price: 300  },
  { id: 'kitchen_shelf',     name: 'Hængehylde',           emoji: '🫖', description: 'Vægmonteret hylde med krus og krukker',  room: 'kitchen',  price: 600  },
  { id: 'kitchen_rug',       name: 'Køkkentæppe',          emoji: '🟫', description: 'Varmt gulvtæppe i gyldenbrun',           room: 'kitchen',  price: 500  },
  { id: 'kitchen_lamp',      name: 'Loftslampe',           emoji: '💡', description: 'Messing-hængelampe fra loftet',          room: 'kitchen',  price: 700  },
  { id: 'kitchen_telescope', name: 'Kikkert',              emoji: '🔭', description: 'Kikkert på stativ foran vinduet',        room: 'kitchen',  price: 1200 },

  // ── SOVEVÆRELSE ──
  { id: 'bedroom_bed',        name: 'Seng',                emoji: '🛏️', description: 'Træseng med madras, pude og bordeaux-dyne', room: 'bedroom', price: 1000 },
  { id: 'bedroom_nightstand', name: 'Natbord',             emoji: '🗄️', description: 'Lille natbord med skuffe',                room: 'bedroom', price: 500  },
  { id: 'bedroom_lamp',       name: 'Natbordslampe',       emoji: '🛋️', description: 'Bordlampe med messing-fod og cremé skærm', room: 'bedroom', price: 600  },
  { id: 'bedroom_dresser',    name: 'Kommode',             emoji: '🗃️', description: 'Bred kommode med tre skuffer',             room: 'bedroom', price: 800  },
  { id: 'bedroom_rug',        name: 'Soveværelsetæppe',    emoji: '🟥', description: 'Bordeaux gulvtæppe med dobbelt ramme',     room: 'bedroom', price: 500  },
  { id: 'bedroom_frame',      name: 'Billedramme',         emoji: '🖼️', description: 'Vægmonteret ramme med havmotiv',          room: 'bedroom', price: 600  },
]
```

**Prisfilosofi:** Stuens møbler er billigst (200–800), da de er de første spilleren møder. Køkkenet ligger i mellemklassen (300–1200). Soveværelset har de dyreste enkeltmøbler (seng 1000). Akvariet (800) og kikkerten (1200) er premium pga. interaktive/visuelle features.

> **Bemærk:** `room`-feltet angiver møblets **default-rum** til butik-kategorisering og initial spawn-position. Spilleren kan frit flytte møblet til et andet rum via furniture mode.

---

## Ændring: Køkkenbord (fast → movable)

### Hvad ændres

Det nuværende faste køkkenbord (`CabinKitchen.tsx`, position `[0, 0, ZB + 0.32]`) **fjernes** som fast element. Det erstattes af et nyt movable møbel `kitchen_table` med følgende krav:

- **Højde:** Samme som stuens bord (`table`), dvs. bordplade ca. 0.85 over gulv
- **Udtryk:** Samme mørke træstil som det nuværende køkkenbord (farver `#3d2814` krop, `#5c3a22` plade)
- **Bredde:** Bevares stort set (kan evt. reduceres en smule da det nu er movable og ikke vægmonteret, fx 4.0 i stedet for 5.0)
- **movableType:** `kitchen_table`

### Implementeringsnoter

1. **Fjern** den faste `{/* Fast køkkenbord langs bagvæg */}`-gruppe i `CabinKitchen.tsx`
2. **Opret** det nye movable `kitchen_table` med `userData={{ isMovable: true, movableType: 'kitchen_table' }}`
3. **Geometri:** Brug stuens bord som reference for højden (~0.85 plade), men bevar køkkenbordets mørke træudtryk og bredere proportioner
4. **Default-position:** `(0, 0, -4.0)` — langs bagvæg, foran vinduet (lidt længere fra væggen end det faste bord for at give plads til flytning)

### Foreslået geometri for `kitchen_table`

```
Bordplade:
  boxGeometry args=[4.0, 0.06, 0.62]
  position=[0, 0.85, 0]
  farve: #5c3a22

Krop/forklæde:
  boxGeometry args=[3.95, 0.08, 0.58]
  position=[0, 0.78, 0]
  farve: #3d2814

Ben (4 stk, cylinderGeometry args=[0.05, 0.05, 0.78, 8]):
  position=[-1.85, 0.39, -0.25]
  position=[1.85, 0.39, -0.25]
  position=[-1.85, 0.39, 0.25]
  position=[1.85, 0.39, 0.25]
  farve: #3d2814
```

> **Nøglepunkt:** Pladen er nu på y=0.88 (0.85 + halvdelen af 0.06), hvilket matcher stuens bords pladehøjde. Det nuværende faste køkkenbord har pladen på ca. y=0.96 — det nye bord er altså på standard bordhøjde med ben, i stedet for et lavt skab-agtigt element.

---

## UI-design: Butiksfanen

### Fane-integration i ShopModal

Den eksisterende butik har faner (fishing_gear, bait, travel, legendary). Der tilføjes en ny top-level-fane:

```
🎣 Fiskegrej  |  🪱 Madding  |  🗺️ Rejser  |  ✨ Legendarisk  |  🏠 Møbler
```

### Betinget synlighed

Fanen er **altid synlig**, men har to tilstande:

**Før hytten er unlocked:** Fanen er klikbar men viser et låst-overlay:
```
🔒 Kræver Fiskehytten
Køb Magnet-opgraderingen og find Fiskehyttens Nøgle
for at låse møbler op!
```
Fanen vises med nedtonet/grå styling og et 🔒-ikon.

**Efter hytten er unlocked:** Normal funktionalitet med sub-faner.

### Sub-faner (rum-vælger)

Inden i møbel-fanen vises tre sub-faner:

```
🛋️ Stue  |  🍳 Køkken  |  🛏️ Soveværelse
```

Disse bruger samme visuelle stil som butikkens øvrige faner (rounded-full, emerald aktiv, slate inaktiv), men er lidt mindre for at signalere at de er underordnede.

> **Bemærk:** Butikkens sub-faner organiserer møbler efter deres *default-rum*. Spilleren kan senere flytte møbler mellem rum i furniture mode.

### Item-visning

Hvert møbel vises som et kort i et grid (samme layout som eksisterende shop-items):

```
┌─────────────────────────────┐
│  🍳  Komfur                 │
│  Fritstående ovn med fire   │
│  kogeplader                 │
│                             │
│  ┌─────────────────────┐    │
│  │  💰 600 coins       │    │  ← Gul "Køb"-knap
│  └─────────────────────┘    │
└─────────────────────────────┘
```

**Tre tilstande per item:**

1. **Kan købes:** Emoji + navn + beskrivelse + gul køb-knap med pris
2. **Ikke råd:** Samme layout, men køb-knap er grå/disabled med tekst "Ikke nok coins"
3. **Allerede købt:** Grønt checkmark-badge, knap erstattet med "✅ Købt" (grøn, disabled)

### Købs-flow

1. Spiller klikker "Køb" på et møbel
2. Coins trækkes (`spendCoins(price)`)
3. `unlockFurniture(itemId)` tilføjer til `unlockedFurniture`
4. Kort toast/feedback: "🍳 Komfur tilføjet til køkkenet!"
5. Item-kortet opdateres straks til "✅ Købt"-tilstanden
6. Næste gang spilleren besøger hytten, spawner møblet på sin default-position i sit default-rum

### Coins-visning

Spillerens aktuelle coins vises øverst i møbel-fanen (ligesom i de øvrige faner), f.eks.:
```
💰 Du har 1.340 coins
```

---

## Cross-room møbelflytning

### Koncept

Ethvert flytbart objekt i hytten — både købte møbler og quest-kompagnoner — kan flyttes til et vilkårligt rum. Spilleren vælger et møbel i furniture mode og bruger "Flyt til rum"-knappen til at sende det til stuen, køkkenet eller soveværelset.

### UI i CabinFurnitureBar

Når et møbel er valgt i furniture mode, vises kontrolknapperne i denne rækkefølge:

```
↩  ↪  ↑  ↓  🏠  👁️         ✅ Færdig   ↺ Nulstil
├──────────────┤  └── Skjul    └── Afslut   └── Reset
└── Drej, Højde, Flyt til rum
```

**🏠-knappen ("Flyt til rum"):**

- Placeret i rækken ved siden af ↩ ↪ ↑ ↓ (drej/højde-knapperne)
- Kun synlig når et møbel er valgt
- Ved klik åbnes en kompakt dropdown/popover OVER knappen med de tre rum:

```
┌──────────────────┐
│ 🛋️ Stue          │
│ 🍳 Køkken    ◄── │  ← Nuværende rum markeret (fx med checkmark eller fed skrift)
│ 🛏️ Soveværelse   │
└──────────────────┘
       🏠
```

- Rummet hvor møblet befinder sig lige nu er markeret (checkmark, fed, eller nedtonet/disabled)
- Klik på et andet rum → møblet flyttes dertil
- Dropdown lukker automatisk efter valg

### Flyt-flow (teknisk)

Når spilleren vælger et nyt rum for et møbel:

1. `moveFurnitureToRoom(selectedType, targetRoom)` opdaterer `furnitureRoomAssignment`
2. Møblets gemte `furniturePositions`-entry **ryddes** (slet `furniturePositions[type]`), så det får en frisk start-position i det nye rum
3. `selectedFurniture` nulstilles (deselect)
4. Møblet unmountes fra det aktuelle rum og mountes i det nye rum på en **entry-position** (se nedenfor)
5. `rebuildMovableList()` kører i begge berørte rum

### Entry-positioner ved rum-flytning

Når et møbel flyttes til et nyt rum (ikke sit default-rum), spawner det på en generisk **entry-position** midt i rummet, i stedet for sin default-position (som kun giver mening i det originale rum):

```typescript
const ROOM_ENTRY_POSITIONS: Record<RoomId, { x: number; z: number; y: number }> = {
  living:  { x: 0,   z: 0,    y: 0 },
  kitchen: { x: 0,   z: -1.0, y: 0 },
  bedroom: { x: 0,   z: -1.0, y: 0 },
}
```

**Undtagelse:** Når et møbel flyttes *tilbage* til sit default-rum, og det ikke har en gemt position, bruger det sin `FURNITURE_RESET_DEFAULTS`-position i stedet for entry-positionen.

> **Y-værdi:** Gulv-møbler (Y=0) bruger entry-positionens Y. Vægmonterede/lofts-møbler bevarer deres `Y_DEFAULTS`-værdi ved flytning, da de ellers ville ende på gulvet.

### Nulstil-adfærd ved cross-room møbler

"↺ Nulstil"-knappen sender **alle** møbler tilbage til deres **default-rum** OG default-position. Det vil sige:
- `furnitureRoomAssignment` ryddes helt (alle entries fjernes)
- `hiddenFurniture` ryddes (alt gøres synligt)
- Alle møbler placeres på deres `FURNITURE_RESET_DEFAULTS`-positioner i deres default-rum

### Arkitektur: Rendering af cross-room møbler

Da et møbel kan befinde sig i et vilkårligt rum, skal hvert rum-komponent kunne rendere møbler der ikke "naturligt" hører til der.

**Anbefalet tilgang — delte møbel-komponenter:**

1. Udtræk hvert møbels geometri til en selvstændig komponent (eller funktion) i en delt mappe, fx `src/three/cabin/furniture/`:

```
src/three/cabin/furniture/
  FireplaceFurniture.tsx
  TableFurniture.tsx
  ChairFurniture.tsx
  AquariumFurniture.tsx
  KitchenStoveFurniture.tsx
  ... osv.
```

2. Hver rum-komponent (`FishingCabin.tsx`, `CabinKitchen.tsx`, `CabinBedroom.tsx`) importerer **alle** møbel-komponenter og renderer dem betinget:

```tsx
// Generisk mønster i hvert rum-komponent:
const currentRoomId: RoomId = 'kitchen' // dette rums ID

// For hvert møbel:
const shouldRender = (type: string) => {
  const isUnlocked = unlockedFurniture.includes(type)
  const isInThisRoom = getCurrentRoom(type, furnitureRoomAssignment) === currentRoomId
  const isNotHidden = !hiddenFurniture.includes(type)
  return isUnlocked && isInThisRoom && isNotHidden
}

// Quest-kompagnoner bruger deres egen unlock-logik i stedet for unlockedFurniture:
const shouldRenderCompanion = (type: string, isAvailable: boolean) => {
  const isInThisRoom = getCurrentRoom(type, furnitureRoomAssignment) === currentRoomId
  return isAvailable && isInThisRoom && !hiddenFurniture.includes(type)
}
```

3. **Fordel:** Ethvert møbel kan renderes i ethvert rum uden kode-duplikering. Rum-komponenterne bliver tyndere og mere deklarative.

**Alternativ tilgang — central rendering:** Alle møbler renderes i én central komponent (fx `CabinFurnitureRenderer.tsx`) der wrapper alle tre rum og bruger world-space offsets. Denne tilgang er mere DRY men kræver kendskab til hvert rums world-space koordinater.

---

## Integrationer med eksisterende systemer

### Betinget rendering i rum-komponenter

Hvert rum-komponent læser `unlockedFurniture`, `furnitureRoomAssignment` og `hiddenFurniture` fra store og renderer kun de møbler der:

1. Er unlocked (købt eller quest-opfyldt)
2. Er tildelt dette rum (via `getCurrentRoom()`)
3. Ikke er skjult

```typescript
// I hvert rum-komponent:
const unlockedFurniture = usePlayerStore(s => s.unlockedFurniture)
const furnitureRoomAssignment = usePlayerStore(s => s.furnitureRoomAssignment)
const hiddenFurniture = usePlayerStore(s => s.hiddenFurniture)

const isVisibleInRoom = (type: string, roomId: RoomId) =>
  unlockedFurniture.includes(type) &&
  getCurrentRoom(type, furnitureRoomAssignment) === roomId &&
  !hiddenFurniture.includes(type)
```

### FishingCabin.tsx (stue)

```tsx
{isVisibleInRoom('fireplace', 'living') && (
  <FireplaceFurniture ref={fireplaceRef} />
)}
{isVisibleInRoom('table', 'living') && (
  <TableFurniture ref={tableRef} />
)}
// ... alle andre møbler, inkl. møbler fra køkken/soveværelse der kan være flyttet hertil

// Quest-kompagnoner med separat unlock-logik:
{hasTurtle && getCurrentRoom('turtle', furnitureRoomAssignment) === 'living' && (
  <group ref={turtleRef} userData={{ isMovable: true, movableType: 'turtle' }}>
    <GiantLandTurtle cabinIdle />
  </group>
)}
```

> **Pejs-pointlight:** Renderes i samme rum som pejsen. Hvis pejsen flyttes til soveværelset, følger pejs-lyset med.

### CabinKitchen.tsx (køkken)

1. **Fjern** den faste køkkenbord-gruppe (`{/* Fast køkkenbord langs bagvæg */}`)
2. Rendér alle møbler betinget via `isVisibleInRoom(type, 'kitchen')`
3. Inkludér også møbler fra andre rum der måtte være flyttet hertil

### CabinBedroom.tsx (soveværelse)

Rendér alle møbler betinget via `isVisibleInRoom(type, 'bedroom')`.

### rebuildMovableList() — inkludér kun synlige møbler i dette rum

`rebuildMovableList()` i hvert rum-komponent skal kun inkludere møbler der er:
- Unlocked (eller quest-opfyldt)
- Tildelt dette rum
- Ikke skjult

Afhængighederne for `useLayoutEffect` der kalder `rebuildMovableList()` skal inkludere `unlockedFurniture`, `furnitureRoomAssignment` og `hiddenFurniture`.

### Furniture Mode — skjul/vis

**Skjul-knap:** "👁️" i `CabinFurnitureBar` — synlig når et møbel er valgt. Klik → `toggleHiddenFurniture(selectedType)` → deselect → møblet forsvinder.

**Vis-sektion:** Når der ER skjulte møbler, vis en "👁️‍🗨️ Skjulte møbler"-sektion i `CabinFurnitureBar` med en liste af skjulte møbler og "Vis"-knapper.

**Hvem kan skjules:** Alle møbler og kompagnoner kan skjules. Ingen undtagelser.

### Reset-defaults — udvides

`FURNITURE_RESET_DEFAULTS` og `Y_DEFAULTS` i `cabinFurniturePersistence.ts` skal udvides med `kitchen_table`s default-position. Eksisterende stue-møbler har allerede reset-defaults.

Nulstil-funktionen (`resetFurnitureToDefaults`) skal nu også:
- Rydde `furnitureRoomAssignment` (alle møbler sendes hjem til default-rum)
- Rydde `hiddenFurniture` (alle møbler gøres synlige)

### Game Persistence

`game-persistence.ts` skal opdateres til at inkludere:
- `unlockedFurniture` i `buildGameSave()` og `applyGameSave()`
- `hiddenFurniture` i `buildGameSave()` og `applyGameSave()`
- `furnitureRoomAssignment` i `buildGameSave()` og `applyGameSave()`

Ingen migration nødvendig — alle saves starter forfra efter hard reset. Felter der ikke findes i en save defaulter til `[]` (arrays) eller `{}` (records).

---

## Fase-opdelt implementeringsplan

### FASE 0: Datalag og state (ingen UI endnu)

**Mål:** Etablér al nødvendig state og data uden at ændre noget visuelt.

**Trin:**

0.1. Opret `src/data/furnitureShopItems.ts` med `FURNITURE_SHOP_ITEMS`-arrayet og `RoomId`-typen (kopiér fra denne guide).

0.2. Tilføj til `usePlayerStore.ts`:
  - `unlockedFurniture: string[]` (default: `[]`)
  - `unlockFurniture: (type: string) => void` — tilføjer til arrayet (undgå duplikater)
  - `hiddenFurniture: string[]` (default: `[]`)
  - `toggleHiddenFurniture: (type: string) => void` — toggle ind/ud af arrayet
  - `furnitureRoomAssignment: Record<string, RoomId>` (default: `{}`)
  - `moveFurnitureToRoom: (type: string, room: RoomId) => void` — sætter entry i record (eller sletter den hvis `room` matcher default-rum)

0.3. Opret `getCurrentRoom()`-hjælpefunktionen (foreslået placering: `src/data/furnitureShopItems.ts` eller en ny `src/logic/furnitureHelpers.ts`).

0.4. Opdatér `game-persistence.ts`:
  - `buildGameSave()` — inkludér `unlockedFurniture`, `hiddenFurniture` og `furnitureRoomAssignment`
  - `applyGameSave()` — gendan alle tre felter; default til `[]`/`{}` hvis feltet mangler

**🛑 STOP & TJEK:**
- [ ] `usePlayerStore` har `unlockedFurniture`, `hiddenFurniture` og `furnitureRoomAssignment`
- [ ] `unlockFurniture('test')` tilføjer 'test' til arrayet
- [ ] `toggleHiddenFurniture('test')` toggler korrekt
- [ ] `moveFurnitureToRoom('fireplace', 'kitchen')` sætter `furnitureRoomAssignment.fireplace = 'kitchen'`
- [ ] `moveFurnitureToRoom('fireplace', 'living')` fjerner entry'en (da 'living' er fireplace's default-rum)
- [ ] `getCurrentRoom('fireplace', {})` returnerer `'living'` (default)
- [ ] `getCurrentRoom('fireplace', { fireplace: 'bedroom' })` returnerer `'bedroom'`
- [ ] Game save/load bevarer alle tre felter
- [ ] Spillet fungerer fuldstændigt uændret visuelt

---

### FASE 1: Møbel-fane i butikken (UI)

**Mål:** Tilføj den nye fane i ShopModal med sub-faner og købs-UI.

**Trin:**

1.1. Find `shopTabs`-arrayet i `ShopModal` / `ShopScreen`-komponenten. Tilføj en ny fane:
```typescript
{ id: 'furniture', label: '🏠 Møbler' }
```

1.2. Implementér låst-tilstand: Tjek om hytten er unlocked (`upgrades.includes('magnet') && questItems.includes('cabin_key')`). Hvis ikke, vis låst-overlay i stedet for møbel-indhold.

1.3. Implementér sub-faner inden i furniture-fanen:
```typescript
const furnitureRoomTabs = [
  { id: 'living',  label: '🛋️ Stue' },
  { id: 'kitchen', label: '🍳 Køkken' },
  { id: 'bedroom', label: '🛏️ Soveværelse' },
]
```
Med lokal state `activeFurnitureRoom` der starter på `'living'`.

1.4. Filtrér og vis møbler fra `FURNITURE_SHOP_ITEMS` baseret på valgt rum (`item.room === activeFurnitureRoom`). Brug samme grid-layout som eksisterende shop-items.

1.5. Implementér de tre item-tilstande:
- Kan købes (pris ≤ coins, ikke allerede købt)
- Ikke råd (pris > coins)
- Allerede købt

1.6. Implementér købs-handler:
```typescript
const handleBuyFurniture = (item: FurnitureShopItem) => {
  if (coins < item.price) return
  if (unlockedFurniture.includes(item.id)) return
  spendCoins(item.price)
  unlockFurniture(item.id)
  // Toast feedback
}
```

**🛑 STOP & TJEK:**
- [ ] Ny "🏠 Møbler"-fane er synlig i butikken
- [ ] Før hytten er unlocked: fanen viser låst-besked med nedtonet styling
- [ ] Efter hytten er unlocked: tre sub-faner (Stue, Køkken, Soveværelse) fungerer
- [ ] Stue-fanen viser alle 9 stue-møbler
- [ ] Køkken-fanen viser alle 8 køkkenmøbler (inkl. køkkenbord)
- [ ] Soveværelse-fanen viser alle 6 soveværelsemøbler
- [ ] Hvert møbel vises med emoji, navn, beskrivelse og pris
- [ ] Køb trækker coins og opdaterer knappen til "✅ Købt"
- [ ] Allerede købte møbler vises som "✅ Købt" ved genåbning af butikken
- [ ] Coins-display opdateres live ved køb

---

### FASE 2: Betinget rendering + køkkenbord-ombygning

**Mål:** Alle møbler bag unlock-gate. Fjern fast køkkenbord og tilføj som movable.

**Trin:**

2.1. **Udtræk møbel-geometri til delte komponenter:** Opret `src/three/cabin/furniture/`-mappen. Flyt hvert stue-møbels geometri ud af `FishingCabin.tsx` og ind i sin egen komponent-fil. Gør det samme for køkken- og soveværelsekomponenterne efterhånden som de implementeres.

> Denne opdeling er nødvendig for cross-room flytning (FASE 4) — hvert rum skal kunne rendere ethvert møbel.
>
> **Geometri-kilde:** Stuens eksisterende møbler kopieres direkte fra `FishingCabin.tsx`. For køkken- og soveværelsemøbler, se den detaljerede geometri i `references/FISKEHYTTEN_MOEBLER_IMPLEMENTERING (1).md` (bølge 1). For det nye `kitchen_table`, se "Ændring: Køkkenbord"-sektionen i denne guide.

2.2. I `FishingCabin.tsx`: Brug `isVisibleInRoom(type, 'living')` til at rendere alle stue-møbler betinget.

2.3. **Pejs-pointlight:** Gør pejsens dedikerede pointlight betinget og flyt det med pejs-komponenten (så det følger pejsen til andre rum).

2.4. **Fjern fast køkkenbord:** I `CabinKitchen.tsx`, fjern hele `{/* Fast køkkenbord langs bagvæg */}`-gruppen.

2.5. **Opret movable køkkenbord:** Tilføj `kitchen_table` som movable møbel (se "Ændring: Køkkenbord"-sektionen for geometri).

2.6. I `CabinKitchen.tsx` og `CabinBedroom.tsx`: Rendér alle møbler betinget via `isVisibleInRoom()`.

2.7. Tilføj `kitchen_table` til persistence-defaults:
```typescript
// Y_DEFAULTS
kitchen_table: 0,

// FURNITURE_RESET_DEFAULTS
kitchen_table: { x: 0, z: -4.0, rot: 0 },
```

2.8. Opdatér `rebuildMovableList()` i alle tre rum-komponenter: Inkludér kun møbler der er unlocked, tildelt dette rum, og ikke skjult. Tilføj `unlockedFurniture`, `furnitureRoomAssignment` og `hiddenFurniture` til `useLayoutEffect`-afhængighederne.

**🛑 STOP & TJEK:**
- [ ] Alle tre rum er HELT TOMME uden køb (kun vægge, gulv, tag, dør, vindue, generelt lys)
- [ ] Pejsens pointlight er kun aktivt når pejsen er købt
- [ ] Det faste køkkenbord er FJERNET
- [ ] Købt `kitchen_table` spawner som movable med korrekt højde (~0.85 plade)
- [ ] Køb ét møbel → besøg hytten → kun dét møbel er synligt i sit default-rum
- [ ] Alle købte møbler er flytbare i furniture mode
- [ ] Quest-kompagnoner fungerer som før (optræder i stuen ved quest-opfyldelse)
- [ ] Akvariets interaktioner fungerer efter køb

---

### FASE 3: Skjul/vis-funktion i furniture mode

**Mål:** Giv spilleren mulighed for at skjule møbler.

**Trin:**

3.1. I `CabinFurnitureBar.tsx`: Når et møbel er valgt, vis "👁️"-knappen (skjul/vis).

3.2. Klik på "👁️" → `toggleHiddenFurniture(selectedType)` → deselect → møblet forsvinder fra scenen.

3.3. Tilføj en "👁️‍🗨️ Skjulte møbler"-sektion i `CabinFurnitureBar` (kun synlig når der ER skjulte møbler). Vis en liste af skjulte møbler med "Vis"-knapper.

3.4. Opdatér Nulstil-funktionen: `resetFurnitureToDefaults` rydder også `hiddenFurniture`.

**🛑 STOP & TJEK:**
- [ ] Ethvert møbel (købt eller kompagnon) kan skjules via "👁️"-knap
- [ ] Skjult møbel forsvinder fra scenen
- [ ] Skjulte møbler kan gøres synlige igen via listen
- [ ] Nulstil bringer alle skjulte møbler tilbage (synlige + default-position)
- [ ] `hiddenFurniture` persisteres i game save

---

### FASE 4: Cross-room møbelflytning

**Mål:** Spilleren kan flytte ethvert møbel til et vilkårligt rum.

**Trin:**

4.1. **🏠-knap i CabinFurnitureBar:** Tilføj en ny knap i rækken med ↩ ↪ ↑ ↓ — placeret efter ↓ og før 👁️:

```
↩  ↪  ↑  ↓  🏠  👁️
```

Knappen er kun synlig når et møbel er valgt. Label/tooltip: "Flyt til rum".

4.2. **Dropdown/popover:** Ved klik på 🏠 åbnes en kompakt popover over knappen med tre rum-valg:
```
🛋️ Stue
🍳 Køkken
🛏️ Soveværelse
```
- Det rum møblet befinder sig i lige nu er markeret (checkmark eller fed skrift) og disabled
- Klik på et andet rum udfører flytningen
- Dropdown lukker automatisk efter valg (eller ved klik udenfor)

4.3. **Flyt-handler:**
```typescript
const handleMoveToRoom = (targetRoom: RoomId) => {
  if (!selectedFurniture) return
  const currentRoom = getCurrentRoom(selectedFurniture, furnitureRoomAssignment)
  if (currentRoom === targetRoom) return

  // 1. Opdatér rum-tildeling
  moveFurnitureToRoom(selectedFurniture, targetRoom)

  // 2. Ryd gemt position (møblet får ny position i det nye rum)
  const newPositions = { ...furniturePositions }
  delete newPositions[selectedFurniture]
  setFurniturePositions(newPositions)

  // 3. Deselect
  setSelectedFurniture(null)

  // 4. Toast feedback
  const item = FURNITURE_SHOP_ITEMS.find(f => f.id === selectedFurniture)
  const roomLabels = { living: 'stuen', kitchen: 'køkkenet', bedroom: 'soveværelset' }
  showToast(`${item?.emoji ?? '🏠'} ${item?.name ?? selectedFurniture} flyttet til ${roomLabels[targetRoom]}!`)
}
```

4.4. **Spawn i nyt rum:** Når et møbel renderes i et rum der ikke er dets default-rum, og det ikke har en gemt position, bruges `ROOM_ENTRY_POSITIONS[targetRoom]` (med `Y_DEFAULTS[type]` for Y-værdien).

Når et møbel flyttes *tilbage* til sit default-rum og ikke har gemt position, bruges `FURNITURE_RESET_DEFAULTS[type]` som normalt.

4.5. **Alle tre rum skal rendere alle møbler:** Sørg for at hvert rum-komponent importerer alle delte møbel-komponenter og tjekker `isVisibleInRoom()` for alle `movableType`s.

4.6. **Opdatér nulstil:** `resetFurnitureToDefaults` rydder `furnitureRoomAssignment` (sender alt hjem) og `hiddenFurniture` (gør alt synligt), ud over at nulstille positioner.

**🛑 STOP & TJEK:**
- [ ] 🏠-knap er synlig ved siden af ↩ ↪ ↑ ↓ når et møbel er valgt
- [ ] Klik på 🏠 åbner dropdown med tre rum
- [ ] Nuværende rum er markeret/disabled i dropdown
- [ ] Valg af nyt rum → møbel forsvinder fra nuværende rum
- [ ] Navigér til det nye rum → møblet er synligt på entry-position
- [ ] Møblet kan flyttes/roteres i sit nye rum
- [ ] Møblet kan flyttes videre til et tredje rum
- [ ] Møblet kan flyttes tilbage til sit default-rum (havner på FURNITURE_RESET_DEFAULTS-position)
- [ ] Quest-kompagnoner (skildpadde, axolotl, ost, guldfroe) kan også flyttes mellem rum
- [ ] Pejs-pointlight følger pejsen til det nye rum
- [ ] Nulstil sender ALLE møbler hjem til default-rum + default-position
- [ ] `furnitureRoomAssignment` persisteres i game save
- [ ] Toast vises med korrekt emoji, navn og rumnavn

---

### FASE 5: Toast-feedback og polish

**Mål:** Tilføj feedback og finpuds.

**Trin:**

5.1. Ved køb i butikken — vis en toast/notification:
```
"🔥 Brændeovn tilføjet til stuen!"
"🍳 Komfur tilføjet til køkkenet!"
"🐠 Akvarium tilføjet til stuen!"
```
Brug det eksisterende toast-system i spillet.

5.2. Tilføj et "komplet"-badge på sub-faner når alle møbler i et rum er købt:
```
🍳 Køkken ✓
```

5.3. Overvej at tilføje en samlet progress-indikator i møbel-fanen:
```
🏠 Møbler — 5/23 købt
```

5.4. Tilføj en kort velkomst-tekst øverst i møbel-fanen:
```
"Gør din fiskehytte hyggelig! Køb møbler og placer dem, som du vil."
```

**🛑 STOP & TJEK:**
- [ ] Toast vises ved køb med korrekt emoji og rumnavn
- [ ] Toast vises ved rum-flytning
- [ ] Sub-faner viser ✓ ved komplet rum
- [ ] Alt fungerer på mobil (touch) og desktop
- [ ] Ingen regressioner i butikkens øvrige faner

---

## Komplet liste: Hvad er strukturelt vs. hvad kræver køb

### Altid tilstede (strukturelle elementer, ikke-møbler)

| Element | Rum | Note |
|---|---|---|
| Vægge, gulv, tag, tagbjælker | Alle | Rum-struktur |
| Vinduer (glas + ramme) | Alle | Fast strukturelt element |
| Døre (plade + ramme + håndtag) | Alle | Navigation mellem rum |
| Fyld-pointlight | Stue | Generelt rumlys (IKKE pejs-lys) |
| Rumlys | Køkken, Soveværelse | Generelt rumlys |
| CabinWindowStarfield | Stue | Shader-effekt bag vinduet |

### Betinget (quest-baseret, ikke i butik)

| movableType | Default-rum | Betingelse | Kan flyttes til andet rum? |
|---|---|---|---|
| `turtle` | Stue | `questItems.includes('turtle_hatched')` | Ja |
| `axolotl` | Stue | `questItems.includes('has_axolotl')` | Ja |
| `cheese` | Stue | `cheeseSources.includes('shop') \|\| cheeseSources.length >= 3` | Ja |
| `golden_frog` | Stue | `hasGoldenFrog` i `useCollectionStore` | Ja |

### Kræver køb i butikken

| movableType | Default-rum | Pris | Note |
|---|---|---|---|
| `fireplace` | Stue | 600 | Pejs med animerede flammer + dedikeret pointlight (følger møblet mellem rum) |
| `table` | Stue | 400 | Træbord med fire ben |
| `rug` | Stue | 300 | Stribet gulvtæppe (canvas-tekstur) |
| `chair` | Stue | 300 | Trægstol med ryglæn |
| `shelf` | Stue | 500 | Bogreol med tre hylder og bøger |
| `rod_wall` | Stue | 400 | Vægmonteret fiskestangsholder |
| `table_vase` | Stue | 200 | Glasvase med blomster (står på bordet) |
| `mounted_fish` | Stue | 500 | Vægmonteret trofæ-fisk |
| `aquarium` | Stue | 800 | Akvarium med guldfisk, bobler, interaktivt minispil |
| `kitchen_table` | Køkken | 500 | Langt træbord (erstatter fast køkkenbord, nu med ben, ~0.85 pladehøjde) |
| `kitchen_stove` | Køkken | 600 | Fritstående ovn med fire kogeplader |
| `kitchen_sink` | Køkken | 500 | Vask med messinghane og underskab |
| `kitchen_chair` | Køkken | 300 | Trægstol (kopi af stuens stol) |
| `kitchen_shelf` | Køkken | 600 | Vægmonteret hylde med krus og krukker |
| `kitchen_rug` | Køkken | 500 | Gulvtæppe i gyldenbrun |
| `kitchen_lamp` | Køkken | 700 | Messing-hængelampe fra loftet |
| `kitchen_telescope` | Køkken | 1200 | Kikkert på stativ foran vinduet |
| `bedroom_bed` | Soveværelse | 1000 | Træseng med madras, pude og bordeaux-dyne |
| `bedroom_nightstand` | Soveværelse | 500 | Lille natbord med skuffe |
| `bedroom_lamp` | Soveværelse | 600 | Bordlampe med messing-fod og cremé skærm |
| `bedroom_dresser` | Soveværelse | 800 | Bred kommode med tre skuffer |
| `bedroom_rug` | Soveværelse | 500 | Bordeaux gulvtæppe med dobbelt ramme |
| `bedroom_frame` | Soveværelse | 600 | Vægmonteret ramme med havmotiv |

**Samlet antal møbler:** 23
**Samlet pris for alle møbler:** 12.900 coins

| Rum (default) | Antal | Samlet pris |
|---|---|---|
| Stue | 9 | 4.000 coins |
| Køkken | 8 | 4.900 coins |
| Soveværelse | 6 | 4.000 coins |

---

## Vigtige edge cases

### Pejs-lys i et andet rum

Pejsens pointlight (varm orange-glød, flimrende) er knyttet til pejs-komponenten og renderes i det rum pejsen befinder sig i. Hvis pejsen flyttes til soveværelset, får soveværelset pejs-glød, og stuen mister den. Stuens fyld-pointlight og vindues-pointlight forbliver uberørte.

### Køkkenbord som movable

Det faste køkkenbord fjernes fra `CabinKitchen.tsx`. Det nye movable `kitchen_table` har:
- **Samme visuelle udtryk** (mørke træfarver)
- **Samme bordhøjde som stuens bord** (~0.85 plade)
- **Ben** i stedet for skab-krop (det er nu et fritstående bord, ikke en vægmonteret disk)
- **Lidt smallere** (4.0 bredde i stedet for 5.0) for at passe som movable

### Vase-afhængighed af bord

`table_vase` har default-Y på 1.215 (den "står" på bordet). Hvis spilleren køber vasen men ikke bordet, vil vasen svæve i luften. Dette er acceptabelt — furniture mode tillader at flytte vasen ned. Overvej et hint i butikken: "💡 Tip: Passer perfekt oven på bordet!"

### Cross-room drag-bounds

Hvert rum har sine egne clamp-bounds for drag (x/z). Når et møbel flyttes til et nyt rum, bruger det modtager-rummets bounds — ikke afsender-rummets. `CabinFurnitureDrag.tsx` skal allerede kende rummets bounds baseret på `currentLocation`.

### Vægmonterede møbler i et nyt rum

Møbler med høje Y-defaults (fx `rod_wall` Y=2.091, `kitchen_shelf` Y=2.2, `kitchen_lamp` Y=3.8) bevarer deres Y-værdi ved rum-flytning. De spawner altså på væggen/loftet i det nye rum, ikke på gulvet.

### Furniture mode + skjulte møbler

Når et møbel skjules i furniture mode, forsvinder det umiddelbart. `rebuildMovableList()` skal køre igen (trigger via `hiddenFurniture`-ændring i useLayoutEffect-afhængigheder).

### Shop-fane synlighed ved rejse

Butikken kan åbnes fra alle lokationer. Møbel-fanen skal altid være synlig (men låst hvis hytten ikke er unlocked). Spilleren kan købe møbler fra butikken uden at være i hytten.

### Dropdown-z-index og mobil

🏠-knappens dropdown/popover skal have tilstrækkelig z-index til at ligge over andre HUD-elementer. På mobil skal den være touch-venlig med tilstrækkelig store touch-targets for hvert rum-valg.

---

## Fil-ændrings-oversigt

| Fil | Ændring |
|---|---|
| `src/data/furnitureShopItems.ts` | **NY** — møbelkatalog, `RoomId`-type, `getCurrentRoom()`-hjælper |
| `src/store/usePlayerStore.ts` | Tilføj `unlockedFurniture`, `hiddenFurniture`, `furnitureRoomAssignment` + actions |
| `src/logic/game-persistence.ts` | Persistér nye felter (ingen migration) |
| `src/components/shop/ShopModal.tsx` (el. tilsvarende) | Ny fane + sub-faner + købs-UI |
| `src/three/cabin/furniture/*.tsx` | **NY MAPPE** — delte møbel-komponenter (udtræk fra rum-filer) |
| `src/three/environments/FishingCabin.tsx` | Betinget rendering via `isVisibleInRoom()`, inkl. cross-room møbler |
| `src/three/environments/CabinKitchen.tsx` | Fjern fast køkkenbord + betinget rendering via `isVisibleInRoom()` |
| `src/three/environments/CabinBedroom.tsx` | Betinget rendering via `isVisibleInRoom()` |
| `src/three/cabin/cabinFurniturePersistence.ts` | Tilføj `kitchen_table` + `ROOM_ENTRY_POSITIONS` + reset rydder room-assignment |
| `src/components/hud/CabinFurnitureBar.tsx` | 🏠-knap med dropdown + 👁️ skjul/vis + skjulte-møbler-liste |

---

## Persistence-tilføjelser

### Tilføj til Y_DEFAULTS

```typescript
kitchen_table: 0,
```

### Tilføj til FURNITURE_RESET_DEFAULTS

```typescript
kitchen_table: { x: 0, z: -4.0, rot: 0 },
```

### Nyt: ROOM_ENTRY_POSITIONS

```typescript
export const ROOM_ENTRY_POSITIONS: Record<RoomId, { x: number; z: number; y: number }> = {
  living:  { x: 0,   z: 0,    y: 0 },
  kitchen: { x: 0,   z: -1.0, y: 0 },
  bedroom: { x: 0,   z: -1.0, y: 0 },
}
```

### Nyt: QUEST_COMPANION_DEFAULTS

```typescript
export const QUEST_COMPANION_DEFAULTS: Record<string, RoomId> = {
  turtle: 'living',
  axolotl: 'living',
  cheese: 'living',
  golden_frog: 'living',
}
```
