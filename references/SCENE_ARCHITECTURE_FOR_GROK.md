# Regnefisken — Scene Architecture Guide

> Kontekst-dokument til brug med Grok AI for at bygge Jungleøen (`jungle_island`).

---

## 1. Tech Stack

- **React 19** + **Vite 8** + **TypeScript** + **Tailwind CSS 4**
- **Three.js** via **React Three Fiber** (`@react-three/fiber`) og **Drei** (`@react-three/drei`)
- **State management:** Zustand stores (`useGameStore`, `usePlayerStore`, `useUIStore`, `useCollectionStore`, etc.)
- **Alt 3D er procedurelt** — ingen glTF/OBJ-filer, ingen sprites. Alt er Three.js-geometri i TSX-komponenter.

---

## 2. Overordnet Scene-arkitektur

Der er **ingen scene-klasser** eller scene-registry. Hele spillet kører i **én R3F-scene** (`Experience`). "Lokationer" skiftes ved at ændre `useGameStore.currentLocation` (en `LocationId`-string), og React-komponenter viser/skjuler sig betinget.

### Kompositions-hierarki

```
App.tsx
└── GameCanvas.tsx          ← R3F <Canvas>
    └── Experience.tsx      ← Hovedscene
        ├── CameraRig           (fixed kamerapositioner)
        ├── SceneEnvironment    (himmel, tåge, lys — styret af location-farver)
        ├── SkyClouds           (skyer)
        ├── WaterSurface        (vandplan med bølger)
        ├── NightSky            (stjerner om natten)
        ├── WeatherParticles    (regn/sne)
        ├── AmbientLife         (måger, flagermus)
        ├── LocationScenery     ← LOKATIONS-SPECIFIK 3D-geometri
        │   ├── LocationDock    (pier-type pr. lokation)
        │   └── <Komponent>     (f.eks. TropicalIsland, DesertLake, Cave...)
        ├── PierMoleInteractives (NPC'er KUN på pier)
        ├── Bucket / FishingRod / Bobber / FishingLine
        └── FishPool
```

### Nøgleprincip

Det delte "shell" (himmel, vand, tåge, lys, fiskegrej) er ALTID aktivt. En lokation tilføjer kun:
1. **Farver/atmosfære** via `locations.ts` data (baggrund, vand, tåge)
2. **Dock-type** via `LocationDock.tsx` (træ, sten, pirat, ruin, marina)
3. **Lokations-specifik geometri** via `LocationScenery.tsx` (øer, grotter, NPC'er)

---

## 3. Sådan defineres en lokation (data)

### `src/types/locations.ts` — LocationId type

```typescript
export type LocationId =
  | 'pier'
  | 'smaragd'
  | 'abyss'
  | 'forbidden'
  | 'desert_lake'
  | 'arctic_sea'
  | 'fishing_cabin'
  | 'tropical_island'
  | 'cave'
  | 'jungle_island';
```

### `src/data/locations.ts` — Location config

Hver lokation har: id, navn, emoji, farver, tåge, specialregler, unlock-krav.

**Eksempel — Den Gamle Mole (pier):**
```typescript
pier: {
  id: 'pier', name: 'Den Gamle Mole', emoji: '🏚', unlockLevel: 1, requiresItem: null,
  type: 'fishing', description: '',
  bgColor: 0x87CEEB, waterColor: 0x0099cc, fogColor: 0x87CEEB,
  fogNear: 20, fogFar: 60,
  specialRules: { nothingChance: 0, hasSeagulls: true },
  collectibleTypes: ['cheese', 'feather'],
  lockReason: null
},
```

**Eksisterende jungle_island data:**
```typescript
jungle_island: {
  id: 'jungle_island', name: 'Jungleøen', emoji: '🦕', unlockLevel: 1,
  requiresItem: '__jungle_discovered__',
  type: 'world', description: 'En forhistorisk jungleø — opdaget med Plesiosaurus',
  bgColor: 0x1a4a1a, waterColor: 0x228855, fogColor: 0x1a3a1a,
  fogNear: 15, fogFar: 50,
  specialRules: { nothingChance: 0, hasSeagulls: true },
  collectibleTypes: [],
  lockReason: 'Opdag øen via Plesiosaurus'
},
```

Farverne styrer automatisk: `scene.background`, `scene.fog`, vandoverflade-farve, himmeltemning.

---

## 4. Dock-systemet (`LocationDock.tsx`)

Hver lokation får en bro/pier-variant. Jungle bruger allerede den standard træmole:

```typescript
const WOOD_IDS = new Set([
  'pier', 'smaragd', 'jungle_island', 'tropical_island', 'forbidden', 'abyss',
]);

export function LocationDock() {
  const locationId = useGameStore((s) => s.currentLocation);
  if (locationId === 'fishing_cabin') return null;
  if (locationId === 'desert_lake') return <StonePier />;
  if (locationId === 'forbidden') return <PiratePier />;
  if (locationId === 'arctic_sea') return <MarinaPier />;
  if (locationId === 'cave') return <RuinPier />;
  if (WOOD_IDS.has(locationId)) return <Pier />;
  return <Pier />;
}
```

---

## 5. Lokations-sceneri (`LocationScenery.tsx`)

Her tilføjes den lokations-specifikke 3D-geometri. **Jungle har INGEN entry endnu** — det er det der skal bygges:

```typescript
export function LocationScenery() {
  const locationId = useGameStore((s) => s.currentLocation);
  return (
    <group>
      {locationId === 'forbidden' ? <ForbiddenSeaNpcs /> : null}
      {locationId === 'abyss' ? <AbyssMermaidNpc /> : null}
      {locationId === 'desert_lake' ? <DesertLake /> : null}
      {locationId === 'arctic_sea' ? <ArcticSea /> : null}
      {locationId === 'cave' ? (
        <Suspense fallback={null}><CaveLazy /><CaveDrips /></Suspense>
      ) : null}
      {locationId === 'tropical_island' ? <TropicalIsland /> : null}
      {locationId === 'fishing_cabin' ? <FishingCabin /> : null}
      {/* TODO: jungle_island branch her */}
      <LocationDock />
    </group>
  );
}
```

---

## 6. Referenceimplementering: TropicalIsland

Den bedste reference for Jungleøen, da den er en komplet ø med terræn, palmer, dyr og interaktion:

```tsx
import { useMemo, useRef } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { type Group, Quaternion, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { useAudio } from '../../audio/useAudio.js';
import { usePlayerStore } from '../../store/usePlayerStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import { GiantLandTurtle } from '../models/GiantLandTurtle.js';
import { TurtleEgg } from '../models/TurtleEgg.js';

const trunkMat = { color: 0x6b4a31, roughness: 0.9, flatShading: false as const };
const leafMat = { color: 0x2e8b57, roughness: 0.8, flatShading: false as const };
const nutMat = { color: 0x3e2723, roughness: 1, flatShading: false as const };

function PalmLeaf({ mat, sx, sy, sz }: { mat: typeof leafMat; sx: number; sy: number; sz: number }) {
  return (
    <mesh scale={[sx, sy, sz]}>
      <sphereGeometry args={[1, 10, 6]} />
      <meshStandardMaterial {...mat} />
    </mesh>
  );
}

function Palm1() {
  let yPos = 0;
  let radius = 0.42;
  const segs: { y: number; r: number; i: number }[] = [];
  for (let i = 0; i < 12; i++) {
    segs.push({ y: yPos, r: radius, i });
    yPos += 0.29;
    radius *= 0.96;
  }
  const last = segs[11]!;
  return (
    <group>
      {segs.map((s) => (
        <mesh
          key={s.i}
          position={[Math.sin(s.i * 0.12) * 0.28, s.y, Math.cos(s.i * 0.12) * 0.14]}
          rotation={[0, 0, Math.sin(s.i * 0.12) * 0.08]}
          castShadow receiveShadow
        >
          <cylinderGeometry args={[s.r * 0.9, s.r, 0.33, 8]} />
          <meshStandardMaterial {...trunkMat} />
        </mesh>
      ))}
      <group position={[Math.sin(11 * 0.12) * 0.28, last.y + 0.29, Math.cos(11 * 0.12) * 0.14]}>
        {Array.from({ length: 7 }, (_, i) => (
          <group key={i} rotation={[0, (i / 7) * Math.PI * 2, 0.38 + (i % 4) * 0.07]}>
            <group position={[1.4, 0, 0]}>
              <PalmLeaf mat={leafMat} sx={2.2} sy={0.14} sz={0.55} />
            </group>
          </group>
        ))}
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[Math.cos(i * 2.1) * 0.28, -0.18, Math.sin(i * 2.1) * 0.28]}>
            <dodecahedronGeometry args={[0.25, 1]} />
            <meshStandardMaterial {...nutMat} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function SharkFin({ radius, speed, startAngle }: { radius: number; speed: number; startAngle: number }) {
  const ref = useRef<Group>(null);
  const angleRef = useRef(startAngle);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    angleRef.current += speed;
    const ang = angleRef.current;
    const islandZ = 11.5;
    const t = clock.elapsedTime;
    const finBaseY = 0.12 + Math.sin(t * 2.2 + ang) * 0.045;
    g.position.set(Math.cos(ang) * radius, finBaseY, islandZ + Math.sin(ang) * radius);
    g.rotation.y = speed > 0 ? -ang + Math.PI : -ang;
    g.rotation.z = Math.sin(t * 1.8 + ang * 1.5) * 0.1;
  });
  return (
    <group ref={ref}>
      <mesh rotation={[0.18, 0, 0]} scale={[0.28, 1, 1]} castShadow>
        <coneGeometry args={[0.45, 1.4, 5]} />
        <meshStandardMaterial color={0x556b7d} flatShading />
      </mesh>
    </group>
  );
}

export function TropicalIsland() {
  const { play } = useAudio();
  const questItems = usePlayerStore((s) => s.questItems);
  // ... (quest-gating for turtle egg/wild turtle)
  const sandMat = useMemo(() => ({ color: 0xf5deb3, roughness: 0.85, metalness: 0.05 }), []);
  const grassMat = useMemo(() => ({ color: 0x3d8c40, roughness: 0.85 }), []);
  const rockMat = useMemo(() => ({ color: 0x555555, roughness: 1, flatShading: false as const }), []);

  const palmPlaces = useMemo(() => [
    { x: -5.5, z: 4.5, scale: 1.15, rot: 0.35 },
    { x: -2.8, z: 1.8, scale: 0.95, rot: -0.2 },
    { x: 3.2, z: 2.1, scale: 1.25, rot: 0.6 },
    { x: 7.5, z: 5.8, scale: 1.05, rot: -0.45 },
    { x: -8.0, z: 8.2, scale: 0.85, rot: 1.1 },
  ], []);

  return (
    <group>
      {/* Sand-base: stacked cylinders for island shape */}
      <mesh position={[0, -0.8, 11.5]} scale={[1.32, 1, 1]} castShadow receiveShadow>
        <cylinderGeometry args={[12.5, 13.5, 0.8, 48]} />
        <meshStandardMaterial {...sandMat} />
      </mesh>
      {/* ... flere lag sand + græs */}
      {/* Palmer placeret via data-array */}
      {palmPlaces.map((p, i) => (
        <group key={i} position={[p.x, 0.15, p.z]} rotation={[0, p.rot, 0]} scale={p.scale}>
          <Palm1 />
        </group>
      ))}
      {/* Animerede hajfinner rundt om øen */}
      <SharkFin radius={26} speed={0.0036} startAngle={0} />
      <SharkFin radius={33} speed={0.0048} startAngle={Math.PI * 0.8} />
      {/* Sten/klipper */}
      {/* Interaktive elementer (æg, skildpadde) */}
    </group>
  );
}
```

### Nøglemønstre fra TropicalIsland:

1. **Ø-form:** Stablede `cylinderGeometry`-lag for sand + græs-disk ovenpå
2. **Ø-position:** Centreret omkring `z: 11.5` (bag molen/broen)
3. **Materialer:** `useMemo` for alle materialer (undgå re-allokering)
4. **Træer:** Data-drevet placering via array af `{ x, z, scale, rot }`
5. **Animerede dyr:** Separate komponenter med `useFrame` til bevægelse
6. **Interaktion:** `onPointerDown` → `e.stopPropagation()` → Zustand store → modal
7. **Quest-gating:** Læs `usePlayerStore.questItems` for at vise/skjule elementer

---

## 7. Referenceimplementering: Pier (Den Gamle Mole)

Træbroen der bruges på molen (og jungle_island):

```tsx
import { useMemo } from 'react';
import { mulberry32 } from '../utils/legacyRng.js';

export function Pier() {
  const wMat = useMemo(() => ({ color: 0x5d4037, roughness: 0.9, flatShading: true as const }), []);
  const dMat = useMemo(() => ({ color: 0x3e2723, roughness: 1, flatShading: true as const }), []);

  const planks = useMemo(() => {
    const rows: { z: number; x: number; rotY: number; rotZ: number }[] = [];
    let pi = 0;
    for (let z = -1; z <= 11.2; z += 0.28) {
      const next = mulberry32(0x5d40370 ^ (pi * 0x9e3779b9));
      const rx = next(); const ry = next(); const rz = next();
      rows.push({ z, x: (rx - 0.5) * 0.05, rotY: (ry - 0.5) * 0.04, rotZ: (rz - 0.5) * 0.02 });
      pi++;
    }
    return rows;
  }, []);

  return (
    <group position={[0, 0.1, 0]}>
      {/* Planker */}
      {planks.map((row, i) => (
        <mesh key={i} position={[row.x, 0.3, row.z]} rotation={[0, row.rotY, row.rotZ]} castShadow receiveShadow>
          <boxGeometry args={[4.0, 0.15, 0.25]} />
          <meshStandardMaterial {...wMat} />
        </mesh>
      ))}
      {/* Side-bjælker */}
      <mesh position={[-1.5, 0.05, 5]} castShadow receiveShadow>
        <boxGeometry args={[0.3, 0.4, 12.5]} />
        <meshStandardMaterial {...dMat} />
      </mesh>
      <mesh position={[1.5, 0.05, 5]} castShadow receiveShadow>
        <boxGeometry args={[0.3, 0.4, 12.5]} />
        <meshStandardMaterial {...dMat} />
      </mesh>
      {/* Pæle ned i vandet */}
      {Array.from({ length: 8 }, (_, i) => {
        const zP = -0.5 + i * 1.6;
        const xP = i % 2 === 0 ? -1.8 : 1.8;
        return (
          <mesh key={`p-${i}`} position={[xP, -1, zP]} castShadow>
            <cylinderGeometry args={[0.18, 0.18, 3.5, 12]} />
            <meshStandardMaterial {...dMat} />
          </mesh>
        );
      })}
    </group>
  );
}
```

---

## 8. Referenceimplementering: NPC med interaktion (AmbientPierPlesiosaurus)

Eksempel på en klikbar NPC med animation:

```tsx
import { useRef } from 'react';
import type { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import { useAudio } from '../../audio/useAudio.js';
import { useCollectionStore } from '../../store/useCollectionStore.js';
import { usePlayerStore } from '../../store/usePlayerStore.js';
import { PlesiosaurusCatchModel } from '../models/bossCatchMiniModels.js';

const WORLD_SCALE = 8;
const BASE_Y = -0.28;
const NPC_XZ: [number, number] = [-6, 1.2];
const NPC_YAW = -Math.PI * 0.2;

export function AmbientPierPlesiosaurus() {
  const hasPlesio = usePlayerStore((s) => s.questItems.includes('plesio_defeated'));
  const root = useRef<Group>(null);
  const timeOffset = useRef(Math.random() * 10);
  const { play } = useAudio();
  const setShowPlesioNPC = useCollectionStore((s) => s.setShowPlesioNPC);

  useFrame(({ clock }) => {
    const g = root.current;
    if (!g) return;
    const t = clock.elapsedTime + timeOffset.current;
    g.position.y = BASE_Y + Math.sin(t * 1.2) * 0.06;  // blid op/ned-bob
    g.rotation.z = Math.sin(t * 0.8) * 0.02;            // lille vip
  });

  if (!hasPlesio) return null;  // gated bag quest-item

  return (
    <group ref={root} position={[NPC_XZ[0], BASE_Y, NPC_XZ[1]]} rotation={[0, NPC_YAW, 0]} scale={WORLD_SCALE}>
      <group
        onPointerDown={(e) => {
          e.stopPropagation();
          play('ui');
          setShowPlesioNPC(true);  // åbner React-modal
        }}
      >
        <PlesiosaurusCatchModel bucketIdle ambientPierNpc />
      </group>
    </group>
  );
}
```

---

## 9. PierMoleInteractives — location-gated NPC-gruppe

Eksempel på at begrænse interaktive elementer til én lokation:

```tsx
export function PierMoleInteractives() {
  const locationId = useGameStore((s) => s.currentLocation);
  const showParrot = useCollectionStore((s) => s.unlockedCompanions.includes('parrot'));
  if (locationId !== 'pier') return null;  // early return = KUN synlig på molen

  return (
    <group position={[0, 0.1, 0]}>
      <AmbientPierPlesiosaurus />
      <HarborRat />
      <SeagullFeather />
      {showParrot ? <ParrotCompanion /> : null}
    </group>
  );
}
```

---

## 10. Legacy jungle-builder (fra prototype)

Den gamle `legacy-game.html` havde en procedural jungleø. Kan bruges som inspiration for den nye React-version:

```javascript
function buildJungleIsland(refs) {
  clearLocationObjects(refs);
  refs.water.material.color.setHex(0x228855);

  // Materialer
  const trunkMat = { color: 0x4A3520, roughness: 0.9, flatShading: true };
  const leafMat = { color: 0x228B22, roughness: 0.8, flatShading: true };
  const darkLeafMat = { color: 0x1a6b1a, roughness: 0.8, flatShading: true };

  // Jungle-træer rundt om scenen
  const treePositions = [
    [-10, 0, -12], [10, 0, -14], [-14, 0, -4], [14, 0, -6],
    [-12, 0, 6], [12, 0, 4], [-8, 0, -16], [8, 0, -18],
    [0, 0, -20], [-6, 0, -14], [6, 0, -12],
  ];
  treePositions.forEach(([x, , z]) => {
    const tH = 4 + Math.random() * 6;
    // CylinderGeometry for trunk
    // IcosahedronGeometry for bladkroner (2-3 kugler pr. træ)
  });

  // Klipper (DodecahedronGeometry, 6 stk)
  // Jordstykke/strand (BoxGeometry 30×0.5×20 ved y=-1.5, z=-10)
  // Lianer/vines (tynde cylindre hængende fra oven)
  // Grønt ambient pointlight (0x88cc44, intensity 0.6, range 40)
}
```

---

## 11. Koordinatsystem og spatial layout

- **Vandplanet** ligger ved `y ≈ 0`
- **Broen** starter ved `z ≈ -1` og strækker til `z ≈ 11.2`, centreret på `x = 0`
- **Ø-geometri** (som TropicalIsland) er typisk centreret ved `z ≈ 11.5` (bag broen)
- **Bucket/spand** sidder ved ca. `x: 1.1, z: 8.8`
- **Fiskestang** rager ud over vandet fra bro-enden
- **Kameraet** kigger ned ad broen mod vandet (ca. `z = -2` → `z = 12`)
- **backgroundZBounds** for jungle: `{ minZ: -48, maxZ: -9 }` (hvor baggrundselementer som skyer kan spawne)

---

## 12. Vigtige stores/hooks

| Store | Relevante felter |
|-------|-----------------|
| `useGameStore` | `currentLocation`, `setCurrentLocation`, `gameState`, `headlampOn`, `weatherType` |
| `usePlayerStore` | `questItems`, `upgrades`, `jungleDiscovered`, `setJungleDiscovered` |
| `useUIStore` | `setToastMessage`, `setShowXxxModal` (diverse modals) |
| `useCollectionStore` | `unlockedCompanions`, `setShowPlesioNPC` |
| `useAudio()` | `play('ui')`, `play('unlock')`, `play('error')` |

---

## 13. Hvad Jungleøen allerede har (data-lag)

Allerede implementeret:
- [x] `LocationId` type inkluderer `'jungle_island'`
- [x] `LOCATIONS.jungle_island` med grønne farver (bg: `0x1a4a1a`, vand: `0x228855`, tåge: `0x1a3a1a`)
- [x] Unlock-logik via `questItems.includes('jungle_discovered')` i `travel-unlock.ts`
- [x] Rejse-UI i `TravelNavModal` ("Nye Verdener" tab)
- [x] Plesiosaurus → Jungle rejseflow i `PlesioNpcModal`
- [x] Træ-mole (standard `Pier`) i `LocationDock`
- [x] Persistence (`jungleDiscovered` gemmes/loades)
- [x] `backgroundZBounds` entry

Mangler (skal bygges):
- [ ] **`JungleIsland.tsx`** — 3D-sceneri-komponent (træer, jord, klipper, lianer, dyr)
- [ ] **Branch i `LocationScenery.tsx`** — `{locationId === 'jungle_island' ? <JungleIsland /> : null}`
- [ ] **Jungle-specifikke NPC'er/interaktive elementer** (evt. dinosaurer, eksotiske dyr)
- [ ] **Fisk** — ingen fisk har `primaryAreas: ['jungle_island']` i `fish.ts` endnu
- [ ] **Evt. jungle-specifik dock** (eller behold standard træmole)

---

## 14. Checklist: Opret ny scene (generelt)

1. Tilføj `LocationId` i `src/types/locations.ts`
2. Tilføj `LOCATIONS[id]` i `src/data/locations.ts` (farver, tåge, regler)
3. Tilføj unlock-logik i `src/logic/travel-unlock.ts`
4. Opret `<SceneComponent>` i `src/three/environments/` (procedural geometri)
5. Tilføj branch i `LocationScenery.tsx`: `{locationId === 'xxx' ? <SceneComponent /> : null}`
6. Evt. tilpas dock i `LocationDock.tsx`
7. Evt. tilføj entry i `src/three/logic/backgroundZBounds.ts`
8. Evt. tilføj fisk med `primaryAreas` i `src/data/fish.ts`
9. Evt. tilføj NPC-interaktive i separat komponent (gated bag `currentLocation`)

---

## 15. Stilguide for 3D-geometri

- **Materialer:** Brug `meshStandardMaterial` med `roughness`/`flatShading`. Wrap i `useMemo`.
- **Geometri:** Brug Three.js primitiver (`boxGeometry`, `cylinderGeometry`, `sphereGeometry`, `dodecahedronGeometry`, `icosahedronGeometry`, `coneGeometry`).
- **Shadows:** Brug `castShadow` og `receiveShadow` på synlige meshes.
- **Animation:** Brug `useFrame` med `useRef` for per-frame opdatering.
- **Interaktion:** `onPointerDown={(e) => { e.stopPropagation(); ... }}` på en `<group>`.
- **Farvepalette:** Hex-farver direkte som numbers (`0x228B22`), ikke strings.
- **Ingen loader:** Alt er inline JSX-geometri, ingen eksterne 3D-filer.
