# Jungleø-fiskeri — Implementeringsprompt v2

> Denne prompt er skrevet ud fra en fungerende implementering. Følg den præcist — der er ingen gætværk eller "prøv dig frem"-trin.

## Overblik

Spilleren skal kunne fiske ved jungleøens strandkant. En strandparasol markerer fiskepladsen. Når spilleren går hen til parasollen og trykker **E**, fader skærmen til sort, og spilleren "teleporteres" til en låst fiskekamera-vinkel med stang, snor, flåd og spand — identisk med den normale fiskeforløb på molen. **Q** afslutter fiskeriet og returnerer til WASD-mode.

## Arkitektur — kerneidé

Hele mole-fiskesetuppet (stang, spand, flåd, snor, fiskepulje) wrappes i en `<group>` i `Experience.tsx`. Til normal fiskeri har gruppen identity-transform. Til jungle-fiskeri sættes en **Y-rotation** (så udstyret vender mod havet) og en **beregnet position** (så spanden lander på det rigtige sted efter rotation). Alle child-komponenter bruger lokale koordinater og behøver ingen ændringer — rotationen klarer orienteringen automatisk.

Kameraet (`CameraRig`) beregner jungle-positioner ved at tage mole-kameravektorerne, beregne deres offset fra mole-spanden, rotere offset'en med samme vinkel, og addere til jungle-spandens world-position. Dermed er den relative kameravinkel (spand/stang til højre, havet foran) identisk med molen.

`FishingLine` renderes **udenfor** gruppen fordi den bygger geometri i world-space via `getWorldPosition()` på stangspids og bobber — begge inde i den roterede gruppe, så deres world-positioner er korrekte.

`BucketCatchFish` bruger `bucket.getWorldPosition()` for at finde fiske-flyvemålet. Da fisken er inde i den roterede gruppe, konverteres world-positionen til lokal via `g.parent.worldToLocal()` inden den bruges til `g.position.set()`.

## Koordinater og konstanter

- **Ø-centrum:** `(0, ISLAND_Z)` hvor `ISLAND_Z = 14`
- **ISLAND_LIFT:** `0.12`
- **Parasol/interaktionspunkt (lokal i ø-gruppen):** `[JUNGLE_FISH_BUCKET_X, jungleFishBucketY, JUNGLE_FISH_BUCKET_Z]` = `[24.35, beregnet, 27.92]`
  - Y beregnes via `jungleFishingBucketLocalY(hillTopY)` = `terrainSurfaceYAt(24.35, 27.92, hillTopY) - 0.09`
- **Mole-spand (pier bucket):** `(1.1, 0.48, 8.8)` — den eksisterende `Bucket`-komponents root-position
- **Hav-retning fra parasollen:** vektor fra ø-centrum til parasol = `(24.35, 0, 27.92 - 14)` = `(24.35, 0, 13.92)`
- **Interaktionsradius:** `3.5`

---

## Nye filer

### 1. `src/three/environments/jungleTerrain.ts` — tilføj konstanter

Tilføj i bunden af den eksisterende fil:

```ts
export const JUNGLE_FISH_BUCKET_X = 24.35;
export const JUNGLE_FISH_BUCKET_Z = 27.92;
export const JUNGLE_FISH_BUCKET_Y_SINK = 0.09;
export const JUNGLE_FISH_INTERACT_R = 3.5;

export function jungleFishingBucketLocalY(hillTopY: number): number {
  return terrainSurfaceYAt(JUNGLE_FISH_BUCKET_X, JUNGLE_FISH_BUCKET_Z, hillTopY) - JUNGLE_FISH_BUCKET_Y_SINK;
}

export function jungleFishingBucketWorldY(hillTopY: number, islandLift: number): number {
  return jungleFishingBucketLocalY(hillTopY) + islandLift;
}
```

### 2. `src/three/logic/jungleFishingGear.ts` — NY FIL: rotation + position + kamera-helper

```ts
import { Vector3 } from 'three';
import {
  HILL_TOP_Y,
  ISLAND_LIFT,
  ISLAND_Z,
  JUNGLE_FISH_BUCKET_X,
  JUNGLE_FISH_BUCKET_Z,
  jungleFishingBucketWorldY,
} from '../environments/jungleTerrain.js';

export const PIER_BUCKET = new Vector3(1.1, 0.48, 8.8);

const seaDir = new Vector3(JUNGLE_FISH_BUCKET_X, 0, JUNGLE_FISH_BUCKET_Z - ISLAND_Z);

/** Y-rotation to turn pier-forward (-Z) toward the jungle sea direction. */
export const JUNGLE_ROT_Y = Math.atan2(-seaDir.x, -seaDir.z);

const cosR = Math.cos(JUNGLE_ROT_Y);
const sinR = Math.sin(JUNGLE_ROT_Y);

const bucketWorldY = jungleFishingBucketWorldY(HILL_TOP_Y, ISLAND_LIFT);
const jungleBucket = new Vector3(JUNGLE_FISH_BUCKET_X, bucketWorldY, JUNGLE_FISH_BUCKET_Z);

/** Group world position so that PIER_BUCKET in local space lands at the jungle bucket after Y-rotation. */
export const JUNGLE_GROUP_POS: [number, number, number] = [
  JUNGLE_FISH_BUCKET_X - (PIER_BUCKET.x * cosR + PIER_BUCKET.z * sinR),
  bucketWorldY - PIER_BUCKET.y,
  JUNGLE_FISH_BUCKET_Z - (-PIER_BUCKET.x * sinR + PIER_BUCKET.z * cosR),
];

/** Rotate a pier camera position around the pier bucket and place it relative to the jungle bucket. */
export function pierToJungle(pierPos: Vector3): Vector3 {
  const dx = pierPos.x - PIER_BUCKET.x;
  const dy = pierPos.y - PIER_BUCKET.y;
  const dz = pierPos.z - PIER_BUCKET.z;
  return new Vector3(
    jungleBucket.x + dx * cosR + dz * sinR,
    jungleBucket.y + dy,
    jungleBucket.z - dx * sinR + dz * cosR,
  );
}
```

**Forklaring af matematikken:**
- `JUNGLE_ROT_Y`: Vinkel der drejer -Z (molens "ud mod havet") hen mod junglens hav-retning. Beregnes som `atan2(-seaDir.x, -seaDir.z)`.
- `JUNGLE_GROUP_POS`: Løser ligningssystemet "efter Y-rotation af gruppen skal child ved lokal-position `PIER_BUCKET` ende på world-position `jungleBucket`". Formlen er: `groupPos = targetWorld - rotateY(localPos, θ)`.
- `pierToJungle()`: Tager en mole-kameravektor, beregner dens offset fra mole-spanden, roterer offset'en (kun xz) med samme θ, og adderer til jungle-spandens world-position. Resultatet er den tilsvarende jungle-kameravektor.

### 3. `src/three/environments/JungleFishingBucket.tsx` — NY FIL: strandparasol

En simpel strandparasol (pæl + kegleformet baldakin + guldknop) der altid er synlig. Bruges som interaktionsmarkør og raycast-target.

```tsx
import { useEffect, useMemo } from 'react';
import { ConeGeometry, CylinderGeometry, DoubleSide, SphereGeometry } from 'three';

type JungleFishingBucketProps = {
  position: [number, number, number];
};

export function JungleFishingBucket({ position }: JungleFishingBucketProps) {
  const { poleGeo, canopyGeo, finialGeo } = useMemo(() => {
    const pole = new CylinderGeometry(0.03, 0.035, 2.2, 8);
    const canopy = new ConeGeometry(1.1, 0.45, 8);
    const finial = new SphereGeometry(0.05, 8, 6);
    return { poleGeo: pole, canopyGeo: canopy, finialGeo: finial };
  }, []);

  useEffect(
    () => () => {
      poleGeo.dispose();
      canopyGeo.dispose();
      finialGeo.dispose();
    },
    [poleGeo, canopyGeo, finialGeo],
  );

  return (
    <group position={position} userData={{ jungleInteract: 'fish' }}>
      <mesh geometry={poleGeo} position={[0, 1.1, 0]} castShadow>
        <meshStandardMaterial color={0x8b6914} roughness={0.75} metalness={0.05} />
      </mesh>
      <mesh geometry={canopyGeo} position={[0, 2.0, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={0xe8443a} roughness={0.6} metalness={0.0} side={DoubleSide} />
      </mesh>
      <mesh geometry={finialGeo} position={[0, 2.25, 0]}>
        <meshStandardMaterial color={0xffd700} roughness={0.3} metalness={0.7} />
      </mesh>
    </group>
  );
}
```

---

## Ændrede filer

### 4. `src/store/useGameStore.ts` — tilføj state

Tilføj til `GameState`-interfacet:

```ts
jungleFishing: boolean;
nearJungleBucket: boolean;
setJungleFishing: (v: boolean) => void;
setNearJungleBucket: (v: boolean) => void;
```

Tilføj i `create<GameState>`:

```ts
jungleFishing: false,
nearJungleBucket: false,
setJungleFishing: (jungleFishing) => set({ jungleFishing }),
setNearJungleBucket: (nearJungleBucket) => set({ nearJungleBucket }),
```

I `setCurrentLocation`: nulstil begge når man forlader `jungle_island`:

```ts
...(id !== 'jungle_island' ? { jungleFishing: false, nearJungleBucket: false } : {}),
```

### 5. `src/three/environments/JungleIsland.tsx` — placer parasol

Importér:
```ts
import { JungleFishingBucket } from './JungleFishingBucket.js';
import {
  JUNGLE_FISH_BUCKET_X,
  JUNGLE_FISH_BUCKET_Z,
  jungleFishingBucketLocalY,
  // ... eksisterende imports
} from './jungleTerrain.js';
```

Beregn Y og placer i den eksisterende `<group position={[0, islandLift, 0]}>`:
```tsx
const jungleFishBucketY = jungleFishingBucketLocalY(hillTopY);
// ...
<JungleFishingBucket position={[JUNGLE_FISH_BUCKET_X, jungleFishBucketY, JUNGLE_FISH_BUCKET_Z]} />
```

### 6. `src/three/environments/JunglePlayerController.tsx` — E/Q-tast, frys, nærhed

#### 6a: Importer

```ts
import { useGameStore } from '../../store/useGameStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import { requestGameCanvasPointerLock } from '../../utils/requestGameCanvasPointerLock.js';
import {
  JUNGLE_FISH_BUCKET_X,
  JUNGLE_FISH_BUCKET_Z,
  JUNGLE_FISH_INTERACT_R,
} from './jungleTerrain.js';
```

#### 6b: Fade-helper (øverst i filen)

```ts
const FADE_MS = 300;

function runJungleFishingFade(onMidpoint: () => void, onFadeInComplete?: () => void): void {
  const ui = useUIStore.getState();
  if (ui.reducedMotion) {
    onMidpoint();
    onFadeInComplete?.();
    return;
  }
  const setOp = ui.setCabinRoomFadeOpacity;
  setOp(0);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => setOp(1));
  });
  window.setTimeout(() => {
    onMidpoint();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setOp(0);
        onFadeInComplete?.();
      });
    });
  }, FADE_MS);
}
```

#### 6c: Refs i komponenten

```ts
const skipNextPointerLockClick = useRef(false);
const savedCamPos = useRef({ x: 0, y: 0, z: 0 });
const savedCamRot = useRef({ x: 0, y: 0 });
const prevNearJungleBucket = useRef(false);
const prevJungleFishing = useRef(false);
```

#### 6d: Mouse move — frys under fiskeri

I `onMouseMove`-handleren, tilføj som allerførste linje:
```ts
if (useGameStore.getState().jungleFishing) return;
```

#### 6e: E-tast handler

```ts
if (k === 'e') {
  if (gs.jungleFishing || gs.gameState !== 'idle') return;
  const dx = camera.position.x - JUNGLE_FISH_BUCKET_X;
  const dz = camera.position.z - JUNGLE_FISH_BUCKET_Z;
  if (Math.hypot(dx, dz) >= JUNGLE_FISH_INTERACT_R) return;
  savedCamPos.current = {
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
  };
  savedCamRot.current = { x: camera.rotation.x, y: camera.rotation.y };
  document.exitPointerLock();
  skipNextPointerLockClick.current = true;
  runJungleFishingFade(() => {
    document.exitPointerLock();
    skipNextPointerLockClick.current = true;
    useGameStore.getState().setJungleFishing(true);
    useGameStore.getState().setGameState('idle');
  });
  e.preventDefault();
  return;
}
```

#### 6f: Q-tast handler

```ts
if (k === 'q') {
  if (!gs.jungleFishing || gs.gameState !== 'idle') return;
  runJungleFishingFade(
    () => {
      useGameStore.getState().setJungleFishing(false);
      useGameStore.getState().setGameState('idle');
      camera.rotation.order = 'YXZ';
      camera.position.set(
        savedCamPos.current.x,
        savedCamPos.current.y,
        savedCamPos.current.z,
      );
      camera.rotation.set(savedCamRot.current.x, savedCamRot.current.y, 0);
    },
    () => {
      requestGameCanvasPointerLock();
    },
  );
  e.preventDefault();
}
```

#### 6g: Pointer lock guards

I `tryLock`-funktionen (click-handler for canvas):
```ts
if (useGameStore.getState().jungleFishing) return;
if (skipNextPointerLockClick.current) {
  skipNextPointerLockClick.current = false;
  return;
}
```

I `onMouseDown`:
```ts
if (useGameStore.getState().jungleFishing) return;
```

#### 6h: useFrame — frys + nærhed

Tilføj i toppen af `useFrame`:
```ts
const gs = useGameStore.getState();

// Pointer lock release ved fishing-transition
if (gs.jungleFishing && !prevJungleFishing.current) {
  document.exitPointerLock();
  skipNextPointerLockClick.current = true;
}
prevJungleFishing.current = gs.jungleFishing;

// Nærhedsstatus til "Tryk E"-prompt
if (!gs.jungleFishing) {
  const near =
    Math.hypot(camera.position.x - JUNGLE_FISH_BUCKET_X, camera.position.z - JUNGLE_FISH_BUCKET_Z) <
    JUNGLE_FISH_INTERACT_R;
  if (near !== prevNearJungleBucket.current) {
    prevNearJungleBucket.current = near;
    useGameStore.getState().setNearJungleBucket(near);
  }
} else if (prevNearJungleBucket.current) {
  prevNearJungleBucket.current = false;
  useGameStore.getState().setNearJungleBucket(false);
}

if (gs.jungleFishing) return; // Frys al bevægelse
```

### 7. `src/three/effects/CameraRig.tsx` — jungle-kameravektorer

Erstat hele filen med følgende struktur:

```ts
import { useRef } from 'react';
import { Vector3 } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { isCabinLocation } from '../../logic/location-helpers.js';
import { useGameStore } from '../../store/useGameStore.js';
import { pierToJungle } from '../logic/jungleFishingGear.js';

const IDLE_PIER = new Vector3(0, 4.6, 13);
const IDLE_CABIN = new Vector3(0, 3.03, 9.67);
const LOOK_CABIN = new Vector3(0, 1.6, -1);
const LOOK_PIER = new Vector3(0, 0.3, 0);
const CAST_WAIT = new Vector3(0, 3, 6);
const BITE = new Vector3(0, 2.5, 5);
const FIGHT = new Vector3(0, 4, 8);
const CATCH = new Vector3(0, 5, 10);

// Jungle-vektorer: rotation af mole-offset'en fra spanden, adderet til jungle-spanden
const JUNGLE_FISH_IDLE = pierToJungle(IDLE_PIER);
const JUNGLE_FISH_LOOK = pierToJungle(LOOK_PIER);
const JUNGLE_FISH_CAST = pierToJungle(CAST_WAIT);
const JUNGLE_FISH_BITE = pierToJungle(BITE);
const JUNGLE_FISH_FIGHT = pierToJungle(FIGHT);
const JUNGLE_FISH_CATCH = pierToJungle(CATCH);
```

Resten af filen (`CAM_POS_LERP`, `applyGameStateToDesiredPier`, `applyGameStateToDesiredJungle`, `CameraRig`-komponenten) er uændret fra den originale prompt. Nøglepunkterne:

- Når `locationId === 'jungle_island'` og `jungleFishing === false`: return tidligt (FPS-mode).
- Når `jungleFishing` skifter til `true`: snap kameraet til `JUNGLE_FISH_IDLE`, sæt `rotation.order = 'XYZ'`, `lookAt(JUNGLE_FISH_LOOK)`. Brug en `wasJungleFishing`-ref til at detektere transitionen.
- Under jungle-fiskeri: lerp mod `JUNGLE_FISH_*`-vektorer baseret på `gameState`, ligesom `applyGameStateToDesiredPier` men med jungle-vektorer.
- Ved afrejse fra jungle (`wasJungle`-ref): snap kamera til `IDLE_PIER`.

### 8. `src/three/Experience.tsx` — group med rotation + position

Importér:
```ts
import { JUNGLE_GROUP_POS, JUNGLE_ROT_Y } from './logic/jungleFishingGear.js';
```

Tilføj konstant:
```ts
const JUNGLE_ROTATION: [number, number, number] = [0, JUNGLE_ROT_Y, 0];
```

Ændr `isWorldLocation`-gating:
```ts
const jungleFishing = useGameStore((s) => s.jungleFishing);
const isWorldLocation =
  isCabinLocation(locationId) || (locationId === 'jungle_island' && !jungleFishing);
const useJungleOffset = locationId === 'jungle_island' && jungleFishing;
```

Wrap fiske-komponenter i en `<group>` med betinget transform. **`FishingLine` UDENFOR gruppen** (den bruger world-space):

```tsx
{!isWorldLocation ? (
  <>
    <CaveFillLights />
    <PierLantern />
    <group
      position={useJungleOffset ? JUNGLE_GROUP_POS : [0, 0, 0]}
      rotation={useJungleOffset ? JUNGLE_ROTATION : [0, 0, 0]}
    >
      <Bucket />
      <BucketCatchFish />
      <SceneFishingRod tipRef={rodTipRef} />
      <Bobber lineAttachmentRef={lineAttachRef} />
      <FishPool />
    </group>
    <FishingLine rodTipRef={rodTipRef} lineEndRef={lineAttachRef} />
  </>
) : null}
```

### 9. `src/three/BucketCatchFish.tsx` — world-to-local konvertering

`BucketCatchFish` bruger `bucket.getWorldPosition()` og sætter resultatet via `g.position.set()`. Da fisken er inde i den roterede gruppe, skal world-positionen konverteres til lokal:

Ved **hver** forekomst af `bucket.getWorldPosition(dest)`, tilføj umiddelbart efter:
```ts
if (g.parent) g.parent.worldToLocal(dest);
```

Der er **tre** steder:

1. **Under flyvning** (flight bezier): efter `bucket.getWorldPosition(dest)` og `dest.y += 0.6`
2. **Ved landing** (t >= 1): efter `bucket.getWorldPosition(dest)`
3. **I bucket/idle mode**: efter `bucket.getWorldPosition(destWorldRef.current)`

> **Vigtigt:** `START_WORLD = new Vector3(0, 2, -2)` er en lokal position og skal IKKE konverteres. Den angiver startpunktet for fiskens flyvebane i gruppens lokale rum.

### 10. `src/components/fishing/FishingControls.tsx` — crosshair + prompts

Importér `jungleFishing` og `nearJungleBucket` fra `useGameStore` (ubetinget, i toppen af komponenten).

Tilføj tidlig return for jungle WASD-mode (`jungle_island && !jungleFishing`):

```tsx
if (currentLocation === 'jungle_island' && !jungleFishing) {
  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center">
      <div className="relative h-5 w-5 opacity-50">
        <div className="absolute left-1/2 top-1/2 h-[2px] w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60" />
        <div className="absolute left-1/2 top-1/2 h-5 w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60" />
      </div>
      {nearJungleBucket && (
        <div className="pointer-events-none absolute bottom-32 text-lg font-bold text-white/80">
          Tryk E for at fiske
        </div>
      )}
    </div>
  );
}
```

Når `jungleFishing === true` falder det igennem til den normale fishing UI. Tilføj "Tryk Q for at gå"-prompt i det eksisterende `gameState === 'idle'`-UI, gated bag `jungleFishing`:

```tsx
{jungleFishing && gameState === 'idle' && (
  <div className="pointer-events-none fixed bottom-8 left-1/2 -translate-x-1/2 z-30 text-sm font-bold text-white/60">
    Tryk Q for at gå
  </div>
)}
```

---

## Filer der IKKE ændres

- `Bobber.tsx` — bruger `g.position.set(x, y, z)` med lokale koordinater. Rotationen af gruppen klarer alt automatisk.
- `FishingLine.tsx` — renderes udenfor den roterede gruppe. Bruger `getWorldPosition()` på stangspids og bobber (begge inde i gruppen), så world-positionerne er korrekte. Geometrien bygges i world-space og meshet har ingen parent-transform.
- `FishingRod.tsx` — lokale koordinater, uændret.
- `Bucket.tsx` — lokale koordinater, uændret.
- `FishPool.tsx` — inde i gruppen, uændret.

## Edge cases

1. **Q kun i idle:** `gameState === 'idle'` tjekkes inden Q-exit tillades.
2. **Pointer lock:** Frigives ved E-tast. Genaktiveres efter Q-fade via `requestGameCanvasPointerLock()`. Forhindres under fiskeri i `tryLock` og `onMouseDown`.
3. **Kamera rotation order:** FPS bruger `'YXZ'`; CameraRig bruger `'XYZ'` med `lookAt`. Skiftes i fade-midpunkterne.
4. **`setCurrentLocation`:** Nulstiller `jungleFishing` og `nearJungleBucket` ved afrejse fra `jungle_island`.
5. **`reducedMotion`:** Fade-funktionen springer animation over ved `reducedMotion`.
