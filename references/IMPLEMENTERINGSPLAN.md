# Implementeringsplan: AmbientLife + Universal Adaptiv Fade + Lazy Load

> Klar til Cursor Composer · Implementér og test ét trin ad gangen

---

## Overblik

Planen dækker tre sammenhængende forbedringer opdelt i **4 trin**:

- **Trin 1** — Fix fugle i hyttens stue og køkken (AmbientLife #8)
- **Trin 2** — Én samlet adaptiv fade-funktion for *alle* lokationsskift (#6 fade-logik)
- **Trin 3** — Lazy-load alle lokationsmiljøer (code splitting, #6 bundle)
- **Trin 4** — Kobl preloaders til fade-funktionen (afslutter #6)

Hvert trin kan implementeres og testes selvstændigt. Trin 2–4 bygger på hinanden og bør følge rækkefølgen.

---

## Trin 1: Fix AmbientLife — fugle i hyttens stue og køkken

### Berørte filer
- `src/three/effects/AmbientLife.tsx`

### Baggrund
`cabin_living` og `cabin_kitchen` har `hasSeagulls: true` og gyldige z-bounds (`minZ: -25, maxZ: -7`), men `allow`-checket i `useSeagullLocationsActive` blokerer fugle i *alle* hytterum via `!isCabinLocation(locationId)`. Der er endda allerede dead code til cabin-specifik fugle-spawning (x=-28, retning altid mod højre). `cabin_bedroom` har `disabled: true` i z-bounds og skal korrekt forblive uden fugle.

Fuglelyd skal *ikke* aktiveres i nogen af hyttens rum — fugle ses udefra gennem vinduet.

### Ændringer

**`src/three/effects/AmbientLife.tsx`**

1. Tilføj import øverst (sammen med eksisterende imports):
```ts
import { getBackgroundZBounds } from '../logic/backgroundZBounds.js';
```

2. Erstat hele `useSeagullLocationsActive`-funktionen:
```ts
// GAMMEL:
function useSeagullLocationsActive() {
  const locationId = useGameStore((s) => s.currentLocation);
  const weatherType = useGameStore((s) => s.weatherType);
  const w = getWeatherEntry(weatherType);
  const loc = LOCATIONS[locationId as keyof typeof LOCATIONS];
  const rules = loc?.specialRules;
  const allow =
    !w.storm && rules?.hasSeagulls === true && !isCabinLocation(locationId);
  return { locationId, allow };
}

// NY:
function useSeagullLocationsActive() {
  const locationId = useGameStore((s) => s.currentLocation);
  const weatherType = useGameStore((s) => s.weatherType);
  const w = getWeatherEntry(weatherType);
  const loc = LOCATIONS[locationId as keyof typeof LOCATIONS];
  const rules = loc?.specialRules;
  const zBounds = getBackgroundZBounds(locationId);
  // allowBirds: true for lokationer med fugle OG ikke-disabled z-bounds
  // cabin_living + cabin_kitchen: hasSeagulls=true, z-bounds aktive → fugle synlige through vindue
  // cabin_bedroom: z-bounds disabled → ingen fugle (vindue vender ikke ud mod scenen)
  // cave: z-bounds disabled → ingen fugle
  const allowBirds = !w.storm && rules?.hasSeagulls === true && !zBounds.disabled;
  // allowSound: fuglelyd afspilles kun udendørs — ikke i hytterum
  const allowSound = allowBirds && !isCabinLocation(locationId);
  return { locationId, allowBirds, allowSound };
}
```

3. I `AmbientLife`-komponenten — opdater destructuring og alle referencer:
```ts
// GAMMEL:
const { locationId, allow } = useSeagullLocationsActive();

// NY:
const { locationId, allowBirds, allowSound } = useSeagullLocationsActive();
```

4. Erstat `allow` med `allowSound` i lyd-useEffect:
```ts
// GAMMEL:
useEffect(() => {
  if (!hasStarted || isMuted || !allow) return;
  // ...
}, [hasStarted, isMuted, allow, play]);

// NY:
useEffect(() => {
  if (!hasStarted || isMuted || !allowSound) return;
  // ...
}, [hasStarted, isMuted, allowSound, play]);
```

5. Erstat `allow` med `allowBirds` i cleanup-useEffect:
```ts
// GAMMEL:
useEffect(() => {
  if (!allow) startTransition(() => setBirds([]));
}, [allow]);

// NY:
useEffect(() => {
  if (!allowBirds) startTransition(() => setBirds([]));
}, [allowBirds]);
```

6. Erstat `allow` med `allowBirds` i useFrame-guard:
```ts
// GAMMEL:
useFrame(() => {
  if (!allow) return;
  // ...
});

// NY:
useFrame(() => {
  if (!allowBirds) return;
  // ...
});
```

7. Erstat `allow` med `allowBirds` i JSX-render:
```tsx
// GAMMEL:
{allow && birds.map((b) => (
  <FlyingSeagullMesh ... />
))}

// NY:
{allowBirds && birds.map((b) => (
  <FlyingSeagullMesh ... />
))}
```

### Test efter Trin 1

1. **Stuen (`cabin_living`):** Gå ind i stuen. Vent ~30 sekunder. Fugle bør spawne og flyve fra venstre mod højre forbi vinduet. Ingen mågelyd.
2. **Køkkenet (`cabin_kitchen`):** Samme som stuen — fugle flyver forbi vinduet. Ingen lyd.
3. **Soveværelset (`cabin_bedroom`):** Ingen fugle overhovedet. Ingen lyd.
4. **Udendørs (molen, tropisk ø, etc.):** Fugle og fuglelyd virker præcis som før.
5. **Regnvejr:** Ingen fugle i hytten (storm-check blokerer korrekt).
6. **Grotten:** Ingen fugle (z-bounds disabled). Flagermus upåvirket.

---

## Trin 2: Én samlet adaptiv fade-funktion for alle lokationsskift

### Berørte filer
- `src/logic/cabin-room-travel.ts` — tilføj `runLocationTravel`
- `src/components/modals/TravelNavModal.tsx`
- `src/three/cabin/CabinFurnitureDrag.tsx`
- `src/components/fishing/FishingControls.tsx`
- `src/components/hud/TropicalCaveSign.tsx`
- `src/components/modals/JunglePlesioNpcModal.tsx`
- `src/components/modals/MapRevealModal.tsx`
- `src/components/modals/PlesioNpcModal.tsx`

### Baggrund

**Nuværende situation:**
- Hytte→hytte: bruger `runCabinRoomTravel` (300ms fast fade)
- Alle andre: direkte `setCurrentLocation` — ingen fade overhovedet
- Grotten: ingen fade (brugte headlamp-animationen som "naturlig buffer")

**Ny logik — `Promise.all` med minimum:**
```
fade til sort (CSS, ~300ms) + import starter
         ↓
Promise.all([importFærdig, minimum300ms])
         ↓                    ↓
  import var hurtig     import tog lang tid
  → venter minimum      → venter på import
         ↓
   setCurrentLocation (mens sort)
         ↓
   1 ekstra rAF (Three.js shader-kompilering)
         ↓
   fade ind (CSS, ~300ms)
```

Resultatet: faden er præcis så lang som nødvendigt — aldrig kortere end 300ms (CSS-transitionens varighed), aldrig unødigt længere end importen kræver.

`runCabinRoomTravel` og `runCabinOverlayFade` *beholdes uændret* — de bruges stadig af hyttedørens interaktion (`CabinFurnitureDrag`) hhv. spejl/klædeskab-overlays. **Bemærk:** hyttedørens klik i `CabinFurnitureDrag` opdateres *ikke* i dette trin — se note nedenfor.

### Ændringer

**`src/logic/cabin-room-travel.ts`**

Tilføj følgende eksport i bunden af filen (rør ikke eksisterende funktioner):

```ts
/**
 * Adaptiv fade til sort → lokationsskift → fade ind.
 * Venter på Promise.all([importDone, minWait]) så faden aldrig er kortere end
 * CSS-transitionens varighed, men heller ikke unødigt længere end load kræver.
 *
 * Preloader-map tilføjes i Trin 4. Indtil da bruges Promise.resolve() (ingen forskel
 * for allerede-indlæste lokationer).
 */
export const TRAVEL_FADE_MS = 300; // matcher CSS `opacity 300ms ease` i CabinRoomTravelFade

// Udfyldes i Trin 4 — eksporteret her så Trin 4 kun ændrer ét sted
export const locationPreloaders: Partial<Record<string, () => Promise<unknown>>> = {};

export function runLocationTravel(destinationId: string, onMidpoint: () => void): void {
  const ui = useUIStore.getState();
  if (ui.reducedMotion) {
    onMidpoint();
    return;
  }

  const setOp = ui.setCabinRoomFadeOpacity;

  // Start import øjeblikkeligt (noop i Trin 2, fyldes ud i Trin 4)
  const importDone: Promise<unknown> =
    locationPreloaders[destinationId]?.() ?? Promise.resolve();

  // Minimum = CSS-transitionens varighed. Forlænges automatisk hvis import tager længere.
  const minWait = new Promise<void>((r) => setTimeout(r, TRAVEL_FADE_MS));

  // Fade til sort
  setOp(0);
  requestAnimationFrame(() => requestAnimationFrame(() => setOp(1)));

  // Vent på begge: minimum-tid OG import
  void Promise.all([importDone, minWait]).then(() => {
    // Lokationsskift sker mens skærmen er sort
    onMidpoint();
    // Ét ekstra rAF: giver Three.js tid til at kompilere shaders inden fade-in
    requestAnimationFrame(() => requestAnimationFrame(() => setOp(0)));
  });
}
```

---

**`src/components/modals/TravelNavModal.tsx`**

```ts
// GAMMEL import:
import { isTravelBetweenCabinRooms, runCabinRoomTravel } from '../../logic/cabin-room-travel';

// NY import:
import { runLocationTravel } from '../../logic/cabin-room-travel';
```

```ts
// GAMMEL (i travelTo-funktionen, ca. linje 61):
runCabinRoomTravel(from, dest, proceed);

// NY:
runLocationTravel(dest, proceed);
```

Fjern også de nu-ubrugte `from`-variable og `isTravelBetweenCabinRooms`-import hvis de ikke bruges andre steder i filen.

---

**`src/components/fishing/FishingControls.tsx`**

```ts
// Tilføj import øverst:
import { runLocationTravel } from '../../logic/cabin-room-travel.js';
```

```ts
// GAMMEL (i leaveCaveToTropicalIsland):
function leaveCaveToTropicalIsland() {
  play('ui');
  setCurrentLocation('tropical_island');
  resetWeatherForTravel(false);
}

// NY:
function leaveCaveToTropicalIsland() {
  play('ui');
  runLocationTravel('tropical_island', () => {
    setCurrentLocation('tropical_island');
    resetWeatherForTravel(false);
  });
}
```

---

**`src/components/hud/TropicalCaveSign.tsx`**

```ts
// Tilføj import øverst:
import { runLocationTravel } from '../../logic/cabin-room-travel.js';
```

```ts
// GAMMEL (i handleEnterCave / klik-handler):
play('ui');
setCurrentLocation('cave');
setCurrentStreak(0);
setStreakMilestoneToast(null);
resetWeatherForTravel(false);

// NY:
play('ui');
runLocationTravel('cave', () => {
  setCurrentLocation('cave');
  setCurrentStreak(0);
  setStreakMilestoneToast(null);
  resetWeatherForTravel(false);
});
```

---

**`src/components/modals/JunglePlesioNpcModal.tsx`**

```ts
// Tilføj import øverst:
import { runLocationTravel } from '../../logic/cabin-room-travel.js';
```

```ts
// GAMMEL:
setCurrentLocation('pier' as LocationId);

// NY:
runLocationTravel('pier', () => {
  setCurrentLocation('pier' as LocationId);
});
```

---

**`src/components/modals/MapRevealModal.tsx`**

```ts
// Tilføj import øverst:
import { runLocationTravel } from '../../logic/cabin-room-travel.js';
```

```ts
// GAMMEL:
setCurrentLocation('forbidden' as LocationId);

// NY:
runLocationTravel('forbidden', () => {
  setCurrentLocation('forbidden' as LocationId);
});
```

---

**`src/components/modals/PlesioNpcModal.tsx`**

```ts
// Tilføj import øverst:
import { runLocationTravel } from '../../logic/cabin-room-travel.js';
```

```ts
// GAMMEL:
setCurrentLocation('jungle_island' as LocationId);

// NY:
runLocationTravel('jungle_island', () => {
  setCurrentLocation('jungle_island' as LocationId);
});
```

---

> **Note — `CabinFurnitureDrag.tsx` (hyttedøren):**
> Hyttedørens klik bruger `runCabinRoomTravel(from, target, ...)`. Denne beholdes *uændret* i Trin 2 — den bruger allerede korrekt fade. Den vil blive harmoniseret til `runLocationTravel` i Trin 4 når preloaders er på plads, da det er den eneste forskel der ville have praktisk effekt.

### Test efter Trin 2

1. **Rejsemenu → alle destinationer:** Alle lokationsskift har nu sort fade — inkl. grotten, tropisk ø, arktisk hav.
2. **Grotten → Tropisk Ø (via FishingControls-knap i grotten):** Fade til sort → skift → fade ind.
3. **TropicalCaveSign (skilt på tropisk ø til grotten):** Fade til sort → skift → fade ind.
4. **Plesiosaurus-modal → Jungleø:** Fade fungerer.
5. **MapReveal → Forbidden Sea:** Fade fungerer.
6. **Hyttedøren (klik på dør i 3D):** Virker stadig som før (bruger stadig `runCabinRoomTravel`).
7. **Varighed:** Alle skift føles ≈300ms (samme som hytteskift i dag). Ingen unødige pause.
8. **Reduced motion:** Aktivér i indstillinger → ingen fade, direkte skift på alle ruter.

---

## Trin 3: Lazy-load alle lokationsmiljøer (code splitting)

### Berørte filer
- `src/three/environments/LocationScenery.tsx`

### Baggrund
Kun `Cave` er i dag lazy-loaded. Alle andre lokationer (TropicalIsland, ArcticSea, JungleIsland, FishingCabin, etc.) er statiske imports der bundtes med det initielle load. Med fade-systemet fra Trin 2 er der nu en naturlig buffer mod pop-in for alle lokationer.

Pop-in undgås fordi: fade starter → import kickstartes (Trin 4) → `Promise.all` holder skærmen sort til importen er færdig → lokation renderes mens sort → fade ind afslører færdig scene.

### Ændringer

**`src/three/environments/LocationScenery.tsx`**

Erstat hele import-sektionen øverst og komponent-implementeringen:

```tsx
import { lazy, Suspense } from 'react';
import { useGameStore } from '../../store/useGameStore.js';
import { CaveDrips } from '../effects/CaveDrips.js';
import { LocationDock } from './LocationDock.js';

// Alle lokationsmiljøer lazy-loades for code splitting.
// Pop-in undgås via runLocationTravel's adaptive Promise.all-fade (se cabin-room-travel.ts).
// Cave var allerede lazy — nu følger alle samme mønster.
const CaveLazy = lazy(() =>
  import('./Cave.js'),
);
const AbyssMermaidNpcLazy = lazy(() =>
  import('./AbyssMermaidNpc.js').then((m) => ({ default: m.AbyssMermaidNpc })),
);
const ForbiddenSeaNpcsLazy = lazy(() =>
  import('./ForbiddenSeaNpcs.js').then((m) => ({ default: m.ForbiddenSeaNpcs })),
);
const DesertLakeLazy = lazy(() =>
  import('./DesertLake.js').then((m) => ({ default: m.DesertLake })),
);
const ArcticSeaLazy = lazy(() =>
  import('./ArcticSea.js').then((m) => ({ default: m.ArcticSea })),
);
const TropicalIslandLazy = lazy(() =>
  import('./TropicalIsland.js').then((m) => ({ default: m.TropicalIsland })),
);
const FishingCabinLazy = lazy(() =>
  import('./FishingCabin.js').then((m) => ({ default: m.FishingCabin })),
);
const CabinKitchenLazy = lazy(() =>
  import('./CabinKitchen.js').then((m) => ({ default: m.CabinKitchen })),
);
const CabinBedroomLazy = lazy(() =>
  import('./CabinBedroom.js').then((m) => ({ default: m.CabinBedroom })),
);
const JungleIslandLazy = lazy(() =>
  import('./JungleIsland.js').then((m) => ({ default: m.JungleIsland })),
);

/** Bro + lokationsspecifikt underlag. */
export function LocationScenery() {
  const locationId = useGameStore((s) => s.currentLocation);

  return (
    <group>
      <Suspense fallback={null}>
        {locationId === 'forbidden' ? <ForbiddenSeaNpcsLazy /> : null}
        {locationId === 'abyss' ? <AbyssMermaidNpcLazy /> : null}
        {locationId === 'desert_lake' ? <DesertLakeLazy /> : null}
        {locationId === 'arctic_sea' ? <ArcticSeaLazy /> : null}
        {locationId === 'cave' ? (
          <>
            <CaveLazy />
            <CaveDrips />
          </>
        ) : null}
        {locationId === 'tropical_island' ? <TropicalIslandLazy /> : null}
        {locationId === 'cabin_kitchen' ? <CabinKitchenLazy /> : null}
        {locationId === 'cabin_bedroom' ? <CabinBedroomLazy /> : null}
        {locationId === 'cabin_living' ? <FishingCabinLazy /> : null}
        {locationId === 'jungle_island' ? <JungleIslandLazy /> : null}
      </Suspense>
      <LocationDock />
    </group>
  );
}
```

> **Vigtigt:** Én samlet `<Suspense fallback={null}>` wrapper er tilstrækkelig. `LocationDock` er bevidst udenfor Suspense — den er altid aktiv og er lille.

### Test efter Trin 3

1. **Åbn browser DevTools → Network-fanen, filtér på "JS"**
2. **Hård reload** (Ctrl+Shift+R) — bekræft at `TropicalIsland`, `ArcticSea`, `JungleIsland` etc. **ikke** loades ved opstart
3. **Naviger til Tropisk Ø** — se at et separat JS-chunk loades on-demand
4. **Naviger til Arktisk Hav** — separat chunk loades
5. **Naviger til Grotten** — Cave-chunk loades (som før, men nu identisk med alle andre)
6. **Anden gang til Tropisk Ø** — ingen ny network-request (cached)
7. **Visuel check:** Ingen pop-in/spawn-animationer (i Trin 2 bruger vi `Promise.resolve()` som preloader, så Suspense kan kortvarigt vise `null` — det er OK så længe faden dækker. Fuldt fix kommer i Trin 4)

> **Forventet adfærd i Trin 3:** Faden dækker de fleste tilfælde, men ved allerførste besøg til en lokation på langsom forbindelse kan der være et øjeblik sort. Trin 4 løser dette fuldstændigt.

---

## Trin 4: Kobl preloaders — afslut adaptiv fade

### Berørte filer
- `src/logic/cabin-room-travel.ts` — udfyld `locationPreloaders`
- `src/three/cabin/CabinFurnitureDrag.tsx` — harmonisér hyttedør til ny funktion

### Baggrund
`locationPreloaders`-objektet er allerede defineret (tomt) i `cabin-room-travel.ts` fra Trin 2. Nu udfyldes det med de samme dynamiske imports som `LocationScenery` bruger. Vite/Rollup genkender identiske import-stier og deler chunks — så preloaderen og lazy-komponenten trækker fra samme cache.

### Ændringer

**`src/logic/cabin-room-travel.ts`**

Erstat den tomme `locationPreloaders` med:

```ts
// Samme stier som LocationScenery's lazy() — Vite deler chunks automatisk
export const locationPreloaders: Partial<Record<string, () => Promise<unknown>>> = {
  abyss:           () => import('../three/environments/AbyssMermaidNpc.js'),
  forbidden:       () => import('../three/environments/ForbiddenSeaNpcs.js'),
  desert_lake:     () => import('../three/environments/DesertLake.js'),
  arctic_sea:      () => import('../three/environments/ArcticSea.js'),
  cave:            () => import('../three/environments/Cave.js'),
  tropical_island: () => import('../three/environments/TropicalIsland.js'),
  cabin_living:    () => import('../three/environments/FishingCabin.js'),
  cabin_kitchen:   () => import('../three/environments/CabinKitchen.js'),
  cabin_bedroom:   () => import('../three/environments/CabinBedroom.js'),
  jungle_island:   () => import('../three/environments/JungleIsland.js'),
  // pier, smaragd m.fl. har ingen lokationsspecifik komponent → bruger LocationDock som er eager
};
```

---

**`src/three/cabin/CabinFurnitureDrag.tsx`**

Harmonisér hyttedørens klik til den nye fælles funktion:

```ts
// GAMMEL import:
import { runCabinOverlayFade, runCabinRoomTravel } from '../../logic/cabin-room-travel.js';

// NY import:
import { runCabinOverlayFade, runLocationTravel } from '../../logic/cabin-room-travel.js';
```

```ts
// GAMMEL (hyttedør klik, ca. linje 121):
runCabinRoomTravel(from, target, () => {
  useGameStore.getState().setCurrentLocation(target);
});

// NY:
runLocationTravel(target, () => {
  useGameStore.getState().setCurrentLocation(target);
});
```

`runCabinOverlayFade` i samme fil (spejl/klædeskab-overlay) forbliver uændret.

Når ingen steder nu kalder `runCabinRoomTravel`, kan den slettes fra `cabin-room-travel.ts` — eller beholdes som intern hjælpefunktion. `isTravelBetweenCabinRooms` er ligeledes nu ubrugt og kan fjernes.

### Test efter Trin 4

1. **Network-fanen, Slow 3G simulering** (DevTools → Network → throttle)
2. **Klik rejse til Tropisk Ø:** Faden starter **og** netværksrequest starter **samtidig** — bekræft i Network-tab at chunk-download begynder ved klik (ikke efter fade)
3. **Faden holder sort** indtil chunk er downloadet — ingen hvid/sort flimren
4. **Fade-in afslører færdig scene** — ingen pop-in, ingen spawning mens man ser på
5. **Normal forbindelse:** Forskel fra Trin 3 umærkelig (~50-100ms chunk download = under minimum 300ms)
6. **Hyttedøren (klik på dør i 3D):** Fade virker med ny funktion — identisk oplevelse som via rejsemenuen
7. **Grotten via TropicalCaveSign:** Fade → sort → cave-chunk loades → fade ind
8. **Gå til samme lokation to gange:** Anden gang er chunk cached → fade er præcis 300ms (minimum)
9. **Byg til produktion** (`npm run build`) — bekræft at bundleren ikke advarer om cirkullære imports

---

## Sammenfatning af alle berørte filer

| Trin | Fil | Type ændring |
|------|-----|-------------|
| 1 | `src/three/effects/AmbientLife.tsx` | Split `allow` → `allowBirds` + `allowSound` |
| 2 | `src/logic/cabin-room-travel.ts` | Tilføj `runLocationTravel` + tom `locationPreloaders` |
| 2 | `src/components/modals/TravelNavModal.tsx` | Brug `runLocationTravel` |
| 2 | `src/components/fishing/FishingControls.tsx` | Wrap i `runLocationTravel` |
| 2 | `src/components/hud/TropicalCaveSign.tsx` | Wrap i `runLocationTravel` |
| 2 | `src/components/modals/JunglePlesioNpcModal.tsx` | Wrap i `runLocationTravel` |
| 2 | `src/components/modals/MapRevealModal.tsx` | Wrap i `runLocationTravel` |
| 2 | `src/components/modals/PlesioNpcModal.tsx` | Wrap i `runLocationTravel` |
| 3 | `src/three/environments/LocationScenery.tsx` | Alle imports → `React.lazy()` |
| 4 | `src/logic/cabin-room-travel.ts` | Udfyld `locationPreloaders` |
| 4 | `src/three/cabin/CabinFurnitureDrag.tsx` | `runCabinRoomTravel` → `runLocationTravel` |

**Rør ikke:**
- `src/components/effects/CabinRoomTravelFade.tsx` — uændret (genbruges af `runLocationTravel`)
- `src/logic/cabin-room-travel.ts` → `runCabinOverlayFade` — uændret (bruges af spejl/klædeskab)
- `src/components/admin/AdminPanel.tsx` → `setCurrentLocation` — admin-only, fade unødvendig
- `src/logic/game-persistence.ts` → `setCurrentLocation` — restore fra save, fade unødvendig
