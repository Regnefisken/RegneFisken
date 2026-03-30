# Lazy Loading & Asset Pooling — Migrationsrapport

> **Formål:** Sammenholde legacy-rapportens lazy-loading/pooling-koncepter med det nuværende Vite + React + R3F-setup. Identificere hvad der er fulgt med, hvad der mangler, og — vigtigst — hvad det nye setup *faktisk har brug for*.

---

## Indholdsfortegnelse

1. [Oversigt: Legacy vs. Nuværende](#1-oversigt-legacy-vs-nuværende)
2. [Del 1: Asset Pool / FishPoolManager](#2-del-1-asset-pool--fishpoolmanager)
3. [Del 2: Trigger-punkter i spilflowet](#3-del-2-trigger-punkter-i-spilflowet)
4. [Del 3: Code-splitting af miljøer](#4-del-3-code-splitting-af-miljøer)
5. [Del 4: Model-fabrikken (createCatchModel)](#5-del-4-model-fabrikken-createcatchmodel)
6. [Del 5: R3F-integration & SceneManager](#6-del-5-r3f-integration--scenemanager)
7. [Del 6: Materialer (createCompanionPBR)](#7-del-6-materialer-createcompanionpbr)
8. [Samlet anbefalingsoversigt](#8-samlet-anbefalingsoversigt)
9. [Prioriteret handlingsplan](#9-prioriteret-handlingsplan)

---

## 1. Oversigt: Legacy vs. Nuværende

### Arkitekturskift

| Aspekt | Legacy (14k-linjers monolit) | Nuværende (Vite + R3F) |
|--------|------------------------------|------------------------|
| **Rendering** | Imperativ Three.js (`new THREE.Mesh(...)`) | Deklarativ R3F (`<mesh>`, `<meshStandardMaterial>`) |
| **Asset-livscyklus** | Manuel: pool → acquire → release → dispose | React-drevet: mount → unmount → GC |
| **Bundling** | Én stor HTML-fil, nul code-splitting | Vite med vendor-chunks (`three-vendor`, `react-vendor`) |
| **State** | Globale variabler, IIFE-singletons | Zustand stores med React-subscriptions |
| **Preloading** | `FishPool` singleton med `Map<id, Group>` | `CatchModelPreloader` komponent med usynlige React-mounts |

### Hvad dette betyder i praksis

Det nye setup har en **fundamentalt anderledes tilgang** til 3D-objekters livscyklus. I legacy var det nødvendigt at have en imperativ pool-manager fordi Three.js-objekter var dyre at oprette og GPU-resourcer krævede eksplicit cleanup. I R3F styres mount/unmount af React selv, og Three.js-objekter ryddes op via Reacts lifecycle.

**Det betyder at mange af legacy-rapportens koncepter skal genfortolkes, ikke kopieres 1:1.**

---

## 2. Del 1: Asset Pool / FishPoolManager

### 2.1 De fem legacy-mekanikker — status

| # | Mekanik | Status | Implementering | Vurdering |
|---|---------|--------|----------------|-----------|
| 1 | **LRU-eviction (max 40)** | ✅ Porteret (anderledes form) | `catch-pool.ts`: `touchLruFishIds()` — LRU over id-strenge, max 40. `CatchModelPreloader` renderer usynlige `<HookedCatchModel>` for hvert LRU-id. Eviction = React unmount. | Fungerer for formålet. React-unmount trigger Three.js dispose internt via R3F. |
| 2 | **Deferred build (rAF)** | ❌ Ikke porteret | Ingen `requestAnimationFrame`-baseret scheduling i `src/`. | Se anbefaling nedenfor. |
| 3 | **Idle-preloading (rIC)** | ✅ Porteret | `CatchModelPreloader.tsx` linje 8–16: `idle()` med `requestIdleCallback` + fallback, 200ms timeout. Loop med `await idle(200)` mellem hvert id. | Matcher legacy-mønstret præcist. |
| 4 | **Shader pre-warming** | ✅ Porteret (variant) | `CatchModelPreloader.tsx` linje 51–58: `gl.compile(scene, camera)` på hele scenen ved LRU-ændring. Legacy brugte per-fish temp-scene + `_warmed` set. | Mere grovkornet men funktionelt. Se anbefaling. |
| 5 | **In-flight deduplication** | ❌ Ikke porteret | Ingen `_inFlight` Map eller lignende dedup. `CatchModelPreloader`, `FishPool` (display) og `BucketCatchFish` kan alle have separate React-subtræer for samme fishId. | Se anbefaling nedenfor. |

### 2.2 Anbefalinger

#### ✅ BEHOLD: LRU over ids + usynlige mounts (mekanik 1)

Det nuværende mønster er **idiomatisk R3F**: `CatchModelPreloader` renderer usynlige `<HookedCatchModel>` komponenter, og eviction sker naturligt via React-unmount. Dette er det rigtige design for det nye setup.

**Én forbedring:** Overvej at tilføje eksplicit dispose-logik i en `useEffect`-cleanup i `HookedCatchModel` eller en wrapper, der kalder `traverse()` med `geometry.dispose()` + `material.dispose()`. R3F's standard unmount håndterer det meste, men custom geometrier (lathe bodies i `CuteFishModel`, boss-meshes) kan lække hvis R3F ikke fanger dem alle. En `useDisposable`-lignende guard ville lukke det hul.

```typescript
// Eksempel: dispose-guard som useEffect cleanup i preloader-wrapperen
useEffect(() => {
  return () => {
    groupRef.current?.traverse((child) => {
      if ('geometry' in child && child.geometry) child.geometry.dispose();
      const mat = (child as any).material;
      if (mat) {
        (Array.isArray(mat) ? mat : [mat]).forEach((m) => m.dispose());
      }
    });
  };
}, []);
```

**Prioritet: LAV** — kun relevant hvis du observerer GPU memory leaks ved lange sessioner med mange lokationsskift.

#### ❌ SKIP: Deferred build via requestAnimationFrame (mekanik 2)

Legacy brugte `_nextFrame()` (en `requestAnimationFrame` Promise) for at sprede tung geometri-konstruktion over frames og undgå UI-jank. I R3F er dette **ikke nødvendigt** af to grunde:

1. React fiber-arkitekturen spreder allerede render-arbejde over frames (concurrent features).
2. `CatchModelPreloader` bruger `requestIdleCallback` med 200ms timeout — dette er *bedre* scheduling end bare at vente ét frame, fordi det respekterer browserens idle-perioder.

**Mekanik 2 er erstattet af mekanik 3's idle-scheduling, som er mere avanceret.** Ingen handling nødvendig.

#### ✅ BEHOLD: Idle-preloading (mekanik 3)

Allerede godt implementeret. `idle()` funktionen matcher legacy præcist, og loopet med `await idle(200)` er en solid tilgang.

**Prioritet: INGEN** — done.

#### 🔧 FORBEDRING: Shader pre-warming (mekanik 4)

Det nuværende `gl.compile(scene, camera)` på hele scenen ved *hver* LRU-ændring er potentielt unødigt dyrt. Hele scenen kompileres inklusiv vand, vejr, miljø — ikke kun de nye fiske-meshes.

**Anbefaling:** Skift til scoped compile der kun rammer de nye preload-meshes:

```typescript
// I CatchModelPreloader, efter alle usynlige mounts er renderet:
useLayoutEffect(() => {
  if (!sceneReady || !preloadGroupRef.current || lruIds.length === 0) return;
  try {
    // Kompilér kun preload-gruppen, ikke hele scenen
    gl.compile(preloadGroupRef.current, camera);
  } catch { /* harmless */ }
}, [sceneReady, lruIds, gl, camera]);
```

Alternativt: Tilføj et `_warmed` Set (som legacy) så allerede warmede shaders ikke re-kompileres:

```typescript
const warmedRef = useRef(new Set<string>());

useLayoutEffect(() => {
  const newIds = lruIds.filter(id => !warmedRef.current.has(id));
  if (newIds.length === 0) return;
  try {
    gl.compile(preloadGroupRef.current!, camera);
    newIds.forEach(id => warmedRef.current.add(id));
  } catch { /* harmless */ }
}, [sceneReady, lruIds, gl, camera]);
```

**Prioritet: MEDIUM** — kan mærkes ved lokationsskifte med mange nye kandidater.

#### 🔧 OVERVEJ: In-flight deduplication (mekanik 5)

I legacy forhindrede `_inFlight` Map at to kaldesteder (f.eks. preload + bite-handler) startede dobbelt-builds af samme model. I R3F-verdenen er dette mindre kritisk fordi:

1. React deduplicerer allerede renders af samme komponent-nøgle.
2. `CatchModelPreloader` bruger LRU-ids som keys, og React renderer kun ét `<HookedCatchModel>` per unik key.

**Men der er et edge case:** Hvis en fisk bider mens den stadig er ved at blive preloaded (mounted som usynlig), vil `FishPool`-displayet og preloaderen have *to separate* React-subtræer for samme fisketype. Begge laver fuld geometri-konstruktion.

**Anbefaling:** Lave-prioritet. Overvej kun hvis du ser performance-spikes ved fangst af fisk der lige er begyndt preloading. En mulig løsning er at eksponere en shared geometry cache på komponent-niveau:

```typescript
// En simpel cache i CuteFishModel eller HookedCatchModel:
const geoCache = new Map<string, THREE.BufferGeometry>();
```

**Prioritet: LAV** — React håndterer det meste automatisk.

---

## 3. Del 2: Trigger-punkter i spilflowet

### 3.1 Preload ved lokationsskifte

| Aspekt | Legacy | Nuværende | Status |
|--------|--------|-----------|--------|
| Trigger | `useEffect` med `[currentLocation, upgrades]` | `CatchModelPreloader` reagerer på `useGameStore.currentLocation` + `usePlayerStore.upgrades` via `useMemo` | ✅ Implementeret |
| Timing | `setTimeout(0)` → non-blocking | `requestIdleCallback` med 200ms timeout | ✅ Bedre end legacy |
| Kandidater | Top-12 sorteret efter `lootWeight` desc | `topPreloadFishIds(location, upgrades, 12)` fra `catch-pool.ts` | ✅ Identisk |
| Cancellation | `cancelled` flag + `clearTimeout` | `cancelled` flag i `useEffect` cleanup | ✅ Identisk |
| Hook-placering | Kræver `useThree()` → inde i Canvas | `CatchModelPreloader` er child af `Experience` → inde i Canvas | ✅ Korrekt |

**Vurdering:** Fuldt porteret og faktisk forbedret (idle-scheduling er mere sofistikeret end `setTimeout(0)`).

**Anbefaling: INGEN** — dette er done.

### 3.2 Fire-and-forget ved BID

| Aspekt | Legacy | Nuværende | Status |
|--------|--------|-----------|--------|
| Trigger | Umiddelbart efter `setHookedFish(incoming)` | `startMathFight()` i `FishingControls.tsx` kalder `setHookedFish(fish)` | ⚠️ Halvt |
| Lazy load-kald | `lazyLoadFish(cacheKey, currentLocation).catch(() => {})` | **Mangler** — ingen ekstra preload ved bite | ❌ Ikke porteret |
| Formål | Bygge 3D-model parallelt mens barnet regner | — | — |

**Analyse:** I legacy var dette kritisk fordi `createCatchModel()` tog målbar tid (kompleks geometri-konstruktion). I R3F er situationen anderledes:

1. Hvis fisken allerede er i preloaderens LRU (meget sandsynligt for top-12 kandidater), er dens shaders allerede warmet og React-subtræet eksisterer usynligt.
2. Når `FishPool` (display-komponenten) mounter `<HookedCatchModel>` ved catch-state, vil React genbruge cached fiber-state for samme komponent-type.
3. Det eneste scenarie hvor bite-time preload ville hjælpe, er for sjældne fisk *udenfor* top-12 — f.eks. en Legendarisk fisk med lav `lootWeight`.

**Anbefaling: IMPLEMENTÉR** — men som et simpelt LRU-touch, ikke en fuld imperativ build.

```typescript
// I startMathFight() i FishingControls.tsx, efter setHookedFish(fish):
setHookedFish(fish);

// Sørg for at fiskens model er i preload-LRU'en så den er klar ved catch-display
const cacheKey = fish.fishModelId || fish.itemType;
if (cacheKey) {
  // Touch LRU'en via CatchModelPreloader's state — enten direkte store-update
  // eller en global "urgent preload" funktion
}
```

Konkret implementering: Tilføj et `urgentPreloadId` felt til `useGameStore` (eller `useFishingStore`) som `CatchModelPreloader` abonnerer på. Når det sættes, toucher preloaderen LRU'en for det id med det samme (uden idle-delay):

```typescript
// I CatchModelPreloader:
const urgentId = useFishingStore((s) => s.urgentPreloadId);
useEffect(() => {
  if (!urgentId) return;
  setLruIds((p) => touchLruFishIds(p, urgentId));
  useFishingStore.getState().clearUrgentPreload();
}, [urgentId]);
```

**Prioritet: MEDIUM-HØJ** — dette er den vigtigste manglende feature for UX. Sjældne/uventede fisk kan have mærkbar load-tid ved fangst uden dette.

### 3.3 Wrapper-funktioner (lazyLoadFish, getDisplayFishForCatch)

| Funktion | Legacy | Nuværende | Status |
|----------|--------|-----------|--------|
| `lazyLoadFish(fishId, location)` | Imperativ wrapper der kalder `fishPool.acquire()` | Ikke porteret | ❌ |
| `getDisplayFishForCatch(lastCatch, location)` | Imperativ wrapper for display | Ikke porteret | ❌ |

**Anbefaling: SKIP** — disse funktioner er **imperativ API** til en imperativ pool-manager. I R3F er display-flowet deklarativt:

- `FishPool.tsx` renderer `<HookedCatchModel fish={lastCatch} />` når `gameState === 'catch'`.
- `BucketCatchFish.tsx` renderer `<HookedCatchModel fish={row.fish} />` for bucket-fisk.

Der er ingen behov for imperative wrapper-funktioner. React-komponenterne *er* det display-API.

---

## 4. Del 3: Code-splitting af miljøer

### 4.1 Nuværende tilstand

**Alle miljø-komponenter er statisk importeret** via `LocationScenery.tsx`:

```
LocationScenery.tsx
├── import { DesertLake } from './DesertLake.js'     // Altid i bundlen
├── import { ArcticSea } from './ArcticSea.js'       // Altid i bundlen
├── import { Cave } from './Cave.js'                 // Altid i bundlen
├── import { TropicalIsland } from './TropicalIsland.js'  // Altid i bundlen
├── import { FishingCabin } from './FishingCabin.js'      // Altid i bundlen
├── import { ForbiddenSeaNpcs } from './ForbiddenSeaNpcs.js'
├── import { AbyssMermaidNpc } from './AbyssMermaidNpc.js'
└── import { LocationDock } from './LocationDock.js'
    ├── import { Pier } from './Pier.js'             // Altid i bundlen
    ├── import { StonePier } from './StonePier.js'   // Altid i bundlen
    ├── import { PiratePier } from './PiratePier.js' // Altid i bundlen
    ├── import { MarinaPier } from './MarinaPier.js' // Altid i bundlen
    └── import { RuinPier } from './RuinPier.js'     // Altid i bundlen
```

Alle miljøer ender i én chunk selvom kun ét vises ad gangen.

### 4.2 Er code-splitting af miljøer relevant?

**Ja, men med nuancer:**

- **For:** Hvert miljø er en non-triviel R3F-komponent med mange meshes, materialer og logik. At lazy-loade dem ville reducere initial bundle-størrelse.
- **Imod:** Miljøerne bruger allerede conditional rendering (`locationId === 'x' ? <Component /> : null`), så de mountes kun når de er aktive. Selve *koden* er dog altid downloaded.

**Måling er nødvendig.** Inden du implementerer dette, bør du:

1. Køre `npm run build` og inspicere chunk-størrelser (`dist/assets/`)
2. Måle om den samlede app-chunk (udover vendor) er problematisk stor
3. Vurdere om miljø-komponenterne udgør en væsentlig del

### 4.3 Anbefaling: IMPLEMENTÉR (betinget)

Hvis miljø-koden udgør >50 kB af app-chunken, er det værd at lazy-loade:

**Step 1:** Giv alle miljø-komponenter `default` exports (de har pt. kun named exports).

**Step 2:** Opret lazy-variants i `LocationScenery.tsx`:

```typescript
import { Suspense, lazy } from 'react';

const DesertLake = lazy(() => import('./DesertLake.js'));
const ArcticSea = lazy(() => import('./ArcticSea.js'));
const Cave = lazy(() => import('./Cave.js'));
const TropicalIsland = lazy(() => import('./TropicalIsland.js'));
const FishingCabin = lazy(() => import('./FishingCabin.js'));

export function LocationScenery() {
  const locationId = useGameStore((s) => s.currentLocation);

  return (
    <Suspense fallback={null}>
      <group>
        {locationId === 'desert_lake' ? <DesertLake /> : null}
        {locationId === 'arctic_sea' ? <ArcticSea /> : null}
        {/* ... */}
        <LocationDock />
      </group>
    </Suspense>
  );
}
```

**Step 3:** Brug `Suspense fallback={null}` — i R3F-konteksten er det allerede wrappet i en ydre `<Suspense>` i `GameCanvas.tsx`, og broen + vand + himmel er altid synlig som "baseline scene". En dedikeret fallback-komponent er unødvendig.

**Step 4 (valgfrit):** Tilføj prefetch ved rejse-intention. Når `TravelNavModal` åbnes, kan man preloade den valgte lokations chunk:

```typescript
// I TravelNavModal, on hover/focus over en lokation:
const preload = (loc: string) => {
  switch (loc) {
    case 'desert_lake': import('./environments/DesertLake.js'); break;
    case 'arctic_sea': import('./environments/ArcticSea.js'); break;
    // ...
  }
};
```

**Prioritet: LAV-MEDIUM** — afhænger af faktisk chunk-størrelse. Mål først.

### 4.4 Pier-varianter (LocationDock)

`LocationDock` importerer statisk 5 pier-varianter (`Pier`, `StonePier`, `PiratePier`, `MarinaPier`, `RuinPier`). Disse er typisk mindre end de store miljøer, og spilleren skifter bro langt sjældnere end lokation.

**Anbefaling: SKIP lazy loading af piers** — for lille gevinst til at retfærdiggøre kompleksiteten.

---

## 5. Del 4: Model-fabrikken (createCatchModel)

### 5.1 Nuværende tilstand

Legacy's imperative `createCatchModel()` (1 kæmpe switch/if-else der bygger `THREE.Group`) er **fuldt erstattet** af det deklarative R3F-system:

| Legacy | Nuværende |
|--------|-----------|
| `createCatchModel(catchData)` | `<HookedCatchModel fish={catchData} />` |
| `buildCuteFishModel(catchData)` | `<CuteFishModel config={...} />` + `cuteFishUtils.ts` |
| `createBrandmandMesh()` | `<Brandmand />` |
| `createSoeUhyreMesh()` | `<Soeuhyre />` |
| `createAmbientKrakenMesh()` | `<Kraken />` |
| Junk-varianter | `junkAndTreasureModels.tsx` |
| Boss mini-models | `bossCatchMiniModels.tsx` |
| Spirit/halibut | `<Spirit />` |

**`HookedCatchModel.tsx`** er den centrale dispatcher der matcher `fish.itemType` til den korrekte komponent. Den bruges af:
- `FishPool.tsx` (post-catch display)
- `BucketCatchFish.tsx` (bucket-animation)
- `CatchModelPreloader.tsx` (usynlig preload)

### 5.2 Vurdering

**Denne del er fuldt porteret.** Den deklarative tilgang er korrekt for R3F og giver bedre composability, type-safety, og React DevTools-synlighed end legacy's imperative factory.

### 5.3 userData.customUpdate

Legacy's `userData.customUpdate` (per-mesh animation callbacks kaldt fra render-loopet) er **korrekt erstattet** af `useFrame` hooks inde i de individuelle komponenter:

- `Brandmand.tsx`: Egen `useFrame` for pulsation/emissive flash
- `Kraken.tsx`: Egen `useFrame` for tentakel-bevægelse
- `Soeuhyre.tsx`: Egen `useFrame` for segment-animation
- `Spirit.tsx`: Egen `useFrame` for spirit-hover

`FishPool.tsx` har en special case: den springer y-spin over for `halibut` (Spirit), fordi Spirit har sin egen rotation i `useFrame`. Dette matcher legacy-adfærden.

**Anbefaling: INGEN** — korrekt porteret.

---

## 6. Del 5: R3F-integration & SceneManager

### 6.1 Nuværende arkitektur

```
GameCanvas.tsx
└── <Canvas>
    └── <Suspense fallback={null}>
        └── <Experience />
            ├── <CameraRig />
            ├── <SceneEnvironment />
            ├── <SkyClouds />
            ├── <WaterSurface />
            ├── <WeatherParticles />
            ├── <AmbientLife />
            ├── <AmbientKraken />
            ├── <SoeuhyreAmbient />
            ├── <CatchModelPreloader />     ← Preload-system
            ├── <LocationScenery />          ← Miljø-switcher
            ├── <PierMoleInteractives />
            ├── {!isCabin && <>              ← Fiskeri-props
            │     <Bucket />
            │     <BucketCatchFish />
            │     <SceneFishingRod />
            │     <Bobber />
            │     <FishingLine />
            │   </>}
            ├── <FishPool />                 ← Post-catch display
            └── {isCabin && <CabinFurnitureDrag />}
```

Legacy-rapportens foreslåede `<SceneManager>` mønster er **allerede implementeret** — bare med navnet `Experience`. Den indeholder preload-hook (som `CatchModelPreloader`-komponent), lokationssceneri, og alle scene-elementer.

### 6.2 Vurdering

**Anbefaling: INGEN** — arkitekturen matcher det foreslåede mønster.

---

## 7. Del 6: Materialer (createCompanionPBR)

### 7.1 Nuværende tilstand

Legacy's `createCompanionPBR()` — en centraliseret materiale-factory — er **ikke porteret som en fælles funktion**. I stedet definerer hver komponent sine materialer lokalt:

- `CuteFishModel`: `<meshStandardMaterial>` med inline props
- `Brandmand`: Hardcodede `MeshPhysicalMaterial` instanser (bell, rim, core)
- `Spirit`: `meshPhysicalMaterial` med procedural canvas-texture
- `Kraken`/`Soeuhyre`: `<meshStandardMaterial>` med inline props
- Junk/treasure: Lokale materialer per model

### 7.2 Vurdering

**En centraliseret `materials.ts` er IKKE nødvendig** i det nuværende setup, og her er hvorfor:

1. **R3F-komponenter er selvstændige enheder.** Hvert komponent definerer sine egne materialer, og det er idiomatisk R3F.
2. **Ingen duplikkering.** Fordi fisk-modeller bruger `<meshStandardMaterial>` med props, og props varierer per fisk (farve, roughness, metalness), ville en factory-funktion kun tilføje indirektion uden reel genbrug.
3. **Three.js håndterer materiale-caching internt** for identiske materialer med samme parametre.

**Det eneste scenarie** hvor `createCompanionPBR` ville give værdi, er hvis mange komponenter deler *præcis* de samme materiale-defaults (f.eks. `flatShading: true, roughness: 0.7, metalness: 0.1`). Scan af kodebasen viser at dette **ikke** er tilfældet — materialer varierer fra komponent til komponent.

**Anbefaling: SKIP** — ingen handling nødvendig.

---

## 8. Samlet anbefalingsoversigt

### Fuldt porteret (ingen handling)

| Koncept | Fil(er) | Kommentar |
|---------|---------|-----------|
| Idle-preloading med rIC | `CatchModelPreloader.tsx` | Matcher legacy, med forbedret scheduling |
| LRU-eviction over fish ids | `catch-pool.ts` | Max 40, touch + evict, React-drevet |
| Preload ved lokationsskifte | `CatchModelPreloader.tsx` | Reagerer på `currentLocation` + `upgrades` |
| Top-12 kandidater efter lootWeight | `catch-pool.ts` → `topPreloadFishIds()` | Identisk logik |
| Shader pre-warming | `CatchModelPreloader.tsx` | `gl.compile()` — fungerer, se forbedring |
| createCatchModel → deklarative komponenter | `HookedCatchModel.tsx` + model-filer | Komplet porteret |
| userData.customUpdate → useFrame | Individuelle model-komponenter | Korrekt R3F-idiom |
| Bucket scale clamping | `bucket-visual.ts` + `BucketCatchFish.tsx` | `MAX_BUCKET_SCALE`, `applyBucketClipping` |
| Display scale beregning | `display-scale.ts` | `displayScaleForCatch()` med alle edge cases |
| SceneManager / Experience-mønster | `Experience.tsx` | Allerede implementeret |
| buildCatchDataFromFishId | `catch-pool.ts` | Minimal `RollCatchResult` for preload |
| getPreloadCandidates | `catch-pool.ts` | Matcher legacy-filtre |
| Cancellation i preload | `CatchModelPreloader.tsx` | `cancelled` flag i useEffect cleanup |

### Anbefalet at implementere

| Koncept | Prioritet | Estimat | Begrundelse |
|---------|-----------|---------|-------------|
| **Urgent preload ved bite** | **HØJ** | ~30 min | Sjældne fisk udenfor top-12 har ingen preloaded model. Et LRU-touch ved `setHookedFish()` sikrer at modellen begynder at bygge parallelt med regnestykket. |
| **Scoped shader compile** | **MEDIUM** | ~15 min | Nuværende `gl.compile(scene, camera)` kompilerer hele scenen. Scope til preload-gruppen for at undgå unødigt arbejde. |
| **Lazy-loading af miljøer** | **MEDIUM** | ~45 min | Reducer initial JS-chunk. Kræver `default` exports + `React.lazy()` + `Suspense`. Mål chunk-størrelse først. |

### Bevidst fravalgt (ikke relevant for det nye setup)

| Koncept | Begrundelse |
|---------|-------------|
| **Imperativ FishPoolManager singleton** | R3F bruger deklarativ rendering. En imperativ pool med `acquire()`/`release()` ville kæmpe imod React's model. `CatchModelPreloader` er det idiomatiske alternativ. |
| **Deferred build via rAF** | Erstattet af idle-scheduling (`requestIdleCallback`) som er mere avanceret og allerede implementeret. |
| **`lazyLoadFish()` / `getDisplayFishForCatch()` wrappers** | Imperative API'er til en imperativ pool. I R3F er `<HookedCatchModel>` komponenterne selv display-API'et. |
| **`cloneFromPool()` til bucket-fisk** | Legacy delte geometri+materiale via `clone()`. I R3F renderer `BucketCatchFish` separate `<HookedCatchModel>` instanser — Three.js deler internt identisk geometri-data via shared `BufferAttribute` arrays. |
| **`createCompanionPBR()` materiale-factory** | Materialer varierer per komponent. R3F-idiom: define inline. Ingen reel genbrug at centralisere. |
| **`getFishCacheKey()`** | Cache-nøgle til imperativ pool. React bruger `key={id}` props i stedet. Allerede implicit i `lruIds.map((id) => <group key={id}>...)`. |
| **Route/screen-level React.lazy()** | App'en har ingen URL-routing — navigation er Zustand state + conditional render. Lazy-loading screens som `ShopScreen` ville give minimal gevinst da de er simple UI-komponenter. |

---

## 9. Prioriteret handlingsplan

### Fase 1: Urgent preload ved bite (HØJ prioritet)

**Problem:** Når en sjælden fisk bider (f.eks. Legendarisk, boss), og den ikke er i preloaderens top-12, har `FishPool` ingen pre-mounted model. Barnet svarer rigtigt, og der er potentielt en mærkbar pause mens React mounter `<HookedCatchModel>` og GPU kompilerer shaderen.

**Løsning:**

1. Tilføj `urgentPreloadId: string | null` + `setUrgentPreload(id)` + `clearUrgentPreload()` til `useFishingStore`.
2. I `startMathFight()` i `FishingControls.tsx`, kald `setUrgentPreload(fish.fishModelId || fish.itemType)` lige efter `setHookedFish(fish)`.
3. I `CatchModelPreloader`, abonnér på `urgentPreloadId` og touch LRU'en *straks* (uden idle-delay) + trigger `gl.compile`:

```typescript
const urgentId = useFishingStore((s) => s.urgentPreloadId);
useEffect(() => {
  if (!urgentId || !sceneReady) return;
  setLruIds((p) => touchLruFishIds(p, urgentId));
  useFishingStore.getState().clearUrgentPreload();
}, [urgentId, sceneReady]);
```

4. Fyr-og-glem: Fejl i dette flow må aldrig påvirke spillet.

**Filer der ændres:** `useFishingStore.ts`, `FishingControls.tsx`, `CatchModelPreloader.tsx`.

### Fase 2: Scoped shader compile (MEDIUM prioritet)

**Problem:** `gl.compile(scene, camera)` kompilerer *alle* synlige materialer i scenen, ikke kun de nye preload-meshes.

**Løsning:**

1. Tilføj en `ref` til preload-gruppen i `CatchModelPreloader`.
2. Skift `gl.compile(scene, camera)` til `gl.compile(preloadGroupRef.current, camera)`.
3. Tilføj et `warmedRef = useRef(new Set<string>())` for at undgå re-compile af allerede warmede ids.

**Filer der ændres:** `CatchModelPreloader.tsx`.

### Fase 3: Lazy-load miljøer (MEDIUM prioritet, betinget)

**Forudsætning:** Kør `npm run build` og inspicér output. Hvis app-chunken (udover vendors) er >200 kB, gå videre.

**Løsning:**

1. Tilføj `export default` til `DesertLake`, `ArcticSea`, `Cave`, `TropicalIsland`, `FishingCabin` (behold named export for bagudkompatibilitet).
2. Konvertér imports i `LocationScenery.tsx` til `React.lazy()`.
3. Wrap i `<Suspense fallback={null}>`.
4. (Valgfrit) Tilføj prefetch i `TravelNavModal` ved hover/focus.

**Filer der ændres:** 5-6 environment-filer, `LocationScenery.tsx`, evt. `TravelNavModal.tsx`.

---

## Appendix A: Fil-mapping (legacy-rapport → nuværende kodebase)

| Legacy-rapport foreslår | Eksisterer? | Nuværende ækvivalent |
|------------------------|-------------|---------------------|
| `src/three/FishPoolManager.ts` | ❌ | `CatchModelPreloader.tsx` + `catch-pool.ts` |
| `src/three/LocationScene.tsx` | ❌ | `LocationScenery.tsx` |
| `src/three/materials.ts` | ❌ | Inline materialer per komponent |
| `src/three/bucket-utils.ts` | ❌ (andet navn) | `src/logic/bucket-visual.ts` + `BucketCatchFish.tsx` |
| `src/three/models/CatchModelFactory.ts` | ❌ | `HookedCatchModel.tsx` (deklarativ dispatcher) |
| `src/three/models/CuteFishBuilder.ts` | ❌ (andet navn) | `CuteFishModel.tsx` + `cuteFishUtils.ts` |
| `src/three/models/Brandmand.ts` | ✅ | `Brandmand.tsx` (R3F komponent) |
| `src/three/models/Soeuhyre.ts` | ✅ | `Soeuhyre.tsx` (R3F komponent) |
| `src/three/models/Kraken.ts` | ✅ | `Kraken.tsx` (R3F komponent) |
| `src/logic/catch-candidates.ts` | ❌ (integreret) | `catch-pool.ts` → `getPreloadCandidates()` |
| `src/logic/catch-helpers.ts` | ❌ (integreret) | `catch-pool.ts` → `buildCatchDataFromFishId()` |
| `src/hooks/usePreloadFishForLocation.ts` | ❌ (komponent i stedet) | `CatchModelPreloader.tsx` (komponent, ikke hook) |
| `src/types/fish.ts` | ✅ | `types/fish.ts` med `RollCatchResult`, `EnrichedCatchEntry` m.fl. |

## Appendix B: Bundling-status

Nuværende `vite.config.ts` chunk-strategi:

| Chunk | Indhold |
|-------|---------|
| `three-vendor` | `three`, `@react-three/fiber`, `@react-three/drei`, `three-stdlib` |
| `react-vendor` | `react`, `react-dom`, `zustand` |
| App-chunk | Alt andet: komponenter, logik, data, miljøer, modeller |

**Observation:** Al app-kode ender i én chunk. Miljøer, modeller, og screens er alle statisk importeret. Det er her lazy-loading af miljøer (Fase 3) kunne give gevinst.
