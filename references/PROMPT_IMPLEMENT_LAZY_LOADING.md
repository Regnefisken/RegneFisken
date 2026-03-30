# Composer Prompt: Implementér 3 Lazy-Loading Forbedringer

## Kontekst

Regnefisken er migreret fra en legacy HTML-monolit til Vite + React + TypeScript + Zustand + R3F. Det meste af legacy's asset-pooling/preloading er allerede porteret i R3F-idiomatisk form. Se `@LAZY_LOADING_MIGRATION_RAPPORT.md` for den fulde analyse.

Denne prompt implementerer de **3 resterende forbedringer** identificeret i rapporten. Læs de releverede filer grundigt før du ændrer dem.

**Hård begrænsning: `npm run build` skal forblive grønt efter hver ændring.** Ingen `any`-casts, ingen ubrugte imports, ingen TypeScript-fejl.

---

## Opgave 1: Urgent Preload ved Bite (HØJ prioritet)

### Problem

Når en sjælden fisk bider (f.eks. Legendarisk, boss) og den ikke er i `CatchModelPreloader`'s top-12 LRU, har `FishPool` (display-komponenten) ingen pre-mounted model klar. Barnet svarer rigtigt → potentiel mærkbar pause mens React mounter `<HookedCatchModel>` og GPU kompilerer shaderen.

Legacy løste dette med et fire-and-forget `lazyLoadFish()` kald umiddelbart efter `setHookedFish()` — modellen bygges parallelt mens barnet regner.

### Løsning

**3 filer ændres:**

#### 1. `@src/store/useFishingStore.ts`

Tilføj et `urgentPreloadId` felt til interfacet og storen:

- `urgentPreloadId: string | null` (initial: `null`)
- `setUrgentPreload: (id: string | null) => void`

Simpel setter, ingen sideeffekter.

#### 2. `@src/components/fishing/FishingControls.tsx`

I `startMathFight()`, lige **efter** `setHookedFish(fish)` (linje 100), tilføj:

```typescript
const preloadKey = fish.fishModelId || fish.itemType;
if (preloadKey) {
  useFishingStore.getState().setUrgentPreload(preloadKey);
}
```

Det skal være fire-and-forget — ingen try/catch nødvendig, det er bare en store-update.

#### 3. `@src/three/CatchModelPreloader.tsx`

Abonnér på `urgentPreloadId` fra `useFishingStore` og touch LRU'en *straks* (uden idle-delay):

```typescript
const urgentId = useFishingStore((s) => s.urgentPreloadId);

useEffect(() => {
  if (!urgentId || !sceneReady) return;
  setLruIds((p) => touchLruFishIds(p, urgentId));
  useFishingStore.getState().setUrgentPreload(null);
}, [urgentId, sceneReady]);
```

Tilføj import af `useFishingStore` øverst.

**Vigtigt:** Denne effect skal være **separat** fra den eksisterende idle-loop effect. Den urgente touch skal ske med det samme — ingen `await idle(200)`.

---

## Opgave 2: Scoped Shader Compile (MEDIUM prioritet)

### Problem

Det nuværende `gl.compile(scene, camera)` i `CatchModelPreloader` kompilerer **hele** scenen (vand, vejr, miljø, alt) ved hver LRU-ændring. Det er unødigt dyrt — kun de nye preload-meshes behøver shader-warming.

### Løsning

**1 fil ændres:** `@src/three/CatchModelPreloader.tsx`

1. Tilføj en `useRef` til preload-gruppens `<group>`:

```typescript
const preloadGroupRef = useRef<THREE.Group>(null);
```

(Tilføj `Group` import fra `three` og `useRef` fra `react`.)

2. Sæt ref'en på den usynlige `<group>`:

```tsx
<group ref={preloadGroupRef} visible={false} position={[999, 999, 999]}>
```

3. Tilføj et `warmedRef` Set der tracker allerede warmede ids:

```typescript
const warmedRef = useRef(new Set<string>());
```

4. Erstat den eksisterende `useLayoutEffect` for `gl.compile` med scoped version:

```typescript
useLayoutEffect(() => {
  if (!sceneReady || lruIds.length === 0 || !preloadGroupRef.current) return;
  const newIds = lruIds.filter((id) => !warmedRef.current.has(id));
  if (newIds.length === 0) return;
  try {
    gl.compile(preloadGroupRef.current, camera);
    for (const id of newIds) warmedRef.current.add(id);
  } catch {
    /* harmless */
  }
}, [sceneReady, lruIds, gl, camera]);
```

**Effekt:** Shader compile rammer kun preload-gruppens meshes, og allerede warmede ids springes over.

**Bemærk:** Fjern `scene` fra dependency-arrayet i den ændrede `useLayoutEffect` — den bruger `preloadGroupRef.current` i stedet, og `scene` som dep var kun relevant da vi kompilerede hele scenen. `scene` kan også fjernes fra `useThree()` destructure hvis den ikke bruges andetsteds i komponenten.

---

## Opgave 3: Lazy-Loading af Miljøer (MEDIUM prioritet)

### Problem

Alle miljø-komponenter (`DesertLake`, `ArcticSea`, `Cave`, `TropicalIsland`, `FishingCabin`, `ForbiddenSeaNpcs`, `AbyssMermaidNpc`) er statisk importeret i `LocationScenery.tsx`. Al miljø-kode ender i app-chunken selvom kun ét miljø vises ad gangen.

### Løsning

**8 filer ændres:**

#### Forudsætning: `CAVE_ROCK_RECEIVE_LAYER`

`Cave.tsx` eksporterer konstanten `CAVE_ROCK_RECEIVE_LAYER` som importeres af `CaveFillLights.tsx`. Denne konstant **kan ikke** lazy-loades. Flyt den til en separat fil:

1. **Opret** `@src/three/environments/cave-constants.ts`:

```typescript
export const CAVE_ROCK_RECEIVE_LAYER = 1;
```

2. **Opdatér** `@src/three/environments/Cave.tsx`: Fjern `export const CAVE_ROCK_RECEIVE_LAYER = 1;` og importér fra den nye fil i stedet:

```typescript
import { CAVE_ROCK_RECEIVE_LAYER } from './cave-constants.js';
```

3. **Opdatér** `@src/three/effects/CaveFillLights.tsx`: Ændr import:

```typescript
import { CAVE_ROCK_RECEIVE_LAYER } from '../environments/cave-constants.js';
```

#### Tilføj default exports til miljø-komponenter

Tilføj `export default` til bunden af disse 7 filer (behold den eksisterende named export uændret):

- `@src/three/environments/DesertLake.tsx` → `export default DesertLake;`
- `@src/three/environments/ArcticSea.tsx` → `export default ArcticSea;`
- `@src/three/environments/Cave.tsx` → `export default Cave;`
- `@src/three/environments/TropicalIsland.tsx` → `export default TropicalIsland;`
- `@src/three/environments/FishingCabin.tsx` → `export default FishingCabin;`
- `@src/three/environments/ForbiddenSeaNpcs.tsx` → `export default ForbiddenSeaNpcs;`
- `@src/three/environments/AbyssMermaidNpc.tsx` → `export default AbyssMermaidNpc;`

#### Konvertér `LocationScenery.tsx` til lazy imports

Erstat hele `@src/three/environments/LocationScenery.tsx` med:

```typescript
import { Suspense, lazy } from 'react';
import { useGameStore } from '../../store/useGameStore.js';
import { LocationDock } from './LocationDock.js';

const DesertLake = lazy(() => import('./DesertLake.js'));
const ArcticSea = lazy(() => import('./ArcticSea.js'));
const Cave = lazy(() => import('./Cave.js'));
const TropicalIsland = lazy(() => import('./TropicalIsland.js'));
const FishingCabin = lazy(() => import('./FishingCabin.js'));
const ForbiddenSeaNpcs = lazy(() => import('./ForbiddenSeaNpcs.js'));
const AbyssMermaidNpc = lazy(() => import('./AbyssMermaidNpc.js'));

/** Bro + lokationsspecifikt underlag — matcher legacy `buildBridgeForLocation` + location builders. */
export function LocationScenery() {
  const locationId = useGameStore((s) => s.currentLocation);

  return (
    <Suspense fallback={null}>
      <group>
        {locationId === 'forbidden' ? <ForbiddenSeaNpcs /> : null}
        {locationId === 'abyss' ? <AbyssMermaidNpc /> : null}
        {locationId === 'desert_lake' ? <DesertLake /> : null}
        {locationId === 'arctic_sea' ? <ArcticSea /> : null}
        {locationId === 'cave' ? <Cave /> : null}
        {locationId === 'tropical_island' ? <TropicalIsland /> : null}
        {locationId === 'fishing_cabin' ? <FishingCabin /> : null}
        <LocationDock />
      </group>
    </Suspense>
  );
}
```

`Suspense fallback={null}` er korrekt — broen, vand og himmel er altid synlige som baseline-scene. `LocationDock` forbliver statisk importeret (pier-varianter er små og skiftes sjældent).

---

## Verifikation

Når alle 3 opgaver er implementeret, verificér:

- [ ] `npm run build` er grønt (nul fejl)
- [ ] `useFishingStore` har `urgentPreloadId` + `setUrgentPreload`
- [ ] `startMathFight()` kalder `setUrgentPreload` efter `setHookedFish`
- [ ] `CatchModelPreloader` reagerer på `urgentPreloadId` med øjeblikkelig LRU-touch
- [ ] `gl.compile` bruger `preloadGroupRef.current` i stedet for `scene`
- [ ] `warmedRef` Set forhindrer re-compile af allerede warmede ids
- [ ] `CAVE_ROCK_RECEIVE_LAYER` er flyttet til `cave-constants.ts` og importeres korrekt af både `Cave.tsx` og `CaveFillLights.tsx`
- [ ] Alle 7 miljø-komponenter har `export default`
- [ ] `LocationScenery.tsx` bruger `React.lazy()` + `Suspense` for alle miljøer
- [ ] `LocationDock` er stadig statisk importeret
- [ ] Ingen ubrugte imports, ingen `any`-casts
