# Implementeringsguide: Ur-Krystal som møbel i fiskehytten

## Oversigt

Denne guide konverterer Ur-Krystallen fra en salgbar fangst (2.500 kr i spanden) til et **quest-companion møbel** i fiskehytten. Når spilleren fanger krystallen i Den Mørke Grotte, unlocks den som et møbel der automatisk placeres i soveværelset. Den kan flyttes rundt, drejes og flyttes mellem rum — præcis som de øvrige møbler.

### Hovedændringer

1. Registrér `ur_krystal` som quest-companion med default-rum `bedroom`
2. Tilføj positionsdata (Y-default + reset-position) til møbelpersistens
3. Ny `CrystalFurniture`-komponent der genbruger krystal-geometrien
4. Rendér krystallen i `CabinRoomFurniture` med companion-visibility
5. Omskriv fangst-dialogen — fjern al sælg/værdi-logik, erstat med "Tag den med hjem"
6. Fjern `crystal_junk` fra inventory-systemet, bucket og sælg-logik
7. Opdatér progression-mål-tekst
8. Sæt value til 0 i fish-data

### Berørte filer (10 stk)

| # | Fil | Handling |
|---|-----|----------|
| 1 | `src/data/furnitureShopItems.ts` | Tilføj companion-defaults + display |
| 2 | `src/three/cabin/cabinFurniturePersistence.ts` | Tilføj Y-default + reset-position |
| 3 | `src/three/cabin/furniture/BedroomFurniture.tsx` | Ny `CrystalFurniture` komponent |
| 4 | `src/three/cabin/CabinRoomFurniture.tsx` | Import, ref, visibility, render |
| 5 | `src/components/fishing/CatchResult.tsx` | Omskriv fangst-dialog + bucket-exclusion |
| 6 | `src/components/fishing/MathChallenge.tsx` | Fjern fra addToInventory |
| 7 | `src/components/hud/HUD.tsx` | Ekskludér fra sellAll |
| 8 | `src/components/mobile/MobileBag.tsx` | Ekskludér fra sellAll |
| 9 | `src/logic/bucket-inventory.ts` | Ekskludér fra bucket |
| 10 | `src/data/fish.ts` | Sæt value til 0 |
| 11 | `src/data/progression.ts` | Opdatér mål-beskrivelse |

**Ingen nye dependencies.** Ingen nye filer — alt er ændringer i eksisterende filer.

---

## Trin 1: `src/data/furnitureShopItems.ts`

### 1a. Tilføj `ur_krystal` til `QUEST_COMPANION_DEFAULTS`

Find dette objekt:

```ts
export const QUEST_COMPANION_DEFAULTS: Record<string, RoomId> = {
  turtle: 'living',
  axolotl: 'living',
  cheese: 'living',
  golden_frog: 'living',
  pirate_cat: 'living',
  pirate_chest: 'living',
  ice_cube: 'kitchen',
  music_box: 'living',
};
```

**Tilføj** `ur_krystal: 'bedroom',` som sidste entry:

```ts
export const QUEST_COMPANION_DEFAULTS: Record<string, RoomId> = {
  turtle: 'living',
  axolotl: 'living',
  cheese: 'living',
  golden_frog: 'living',
  pirate_cat: 'living',
  pirate_chest: 'living',
  ice_cube: 'kitchen',
  music_box: 'living',
  ur_krystal: 'bedroom',
};
```

### 1b. Tilføj `ur_krystal` til `COMPANION_DISPLAY`

Find dette objekt:

```ts
const COMPANION_DISPLAY: Record<string, { emoji: string; name: string }> = {
  // ... eksisterende entries ...
  music_box: { emoji: '🎵', name: 'Spilledåse' },
};
```

**Tilføj** efter `music_box`:

```ts
  ur_krystal: { emoji: '💠', name: 'Ur-Krystal' },
```

Så det ender med:

```ts
  music_box: { emoji: '🎵', name: 'Spilledåse' },
  ur_krystal: { emoji: '💠', name: 'Ur-Krystal' },
};
```

---

## Trin 2: `src/three/cabin/cabinFurniturePersistence.ts`

### 2a. Tilføj Y-default

Find `Y_DEFAULTS` objektet. **Tilføj** `ur_krystal: 0.35,` **efter** `pirate_cat: 0,` og **før** `mounted_fish: 2.0,`:

```ts
  music_box: 0,
  pirate_cat: 0,
  ur_krystal: 0.35,
  mounted_fish: 2.0,
```

### 2b. Tilføj reset-position

Find `FURNITURE_RESET_DEFAULTS` objektet. **Tilføj** `ur_krystal` **efter** `pirate_cat`:

```ts
  pirate_cat: { x: 1.2, z: 0.6, rot: 0.5 },
  ur_krystal: { x: 3.0, z: 1.5, rot: 0 },
  mounted_fish: { x: -5.4, z: -1.491, rot: Math.PI / 2 },
```

---

## Trin 3: `src/three/cabin/furniture/BedroomFurniture.tsx`

### 3a. Opdatér imports (linje 1)

**Erstat** den eksisterende import-linje:

```ts
import { forwardRef, useMemo, type ComponentPropsWithoutRef } from 'react';
```

**Med:**

```ts
import { forwardRef, useRef, useMemo, type ComponentPropsWithoutRef } from 'react';
```

### 3b. Tilføj `useFrame` import (efter linje 4)

**Tilføj** denne import efter `import { MeshStandardMaterial } from 'three';`:

```ts
import { useFrame } from '@react-three/fiber';
```

Så toppen af filen ser sådan ud:

```ts
import { forwardRef, useRef, useMemo, type ComponentPropsWithoutRef } from 'react';
import { CanvasTexture, ExtrudeGeometry, RepeatWrapping, Shape } from 'three';
import type { Group } from 'three';
import { MeshStandardMaterial } from 'three';
import { useFrame } from '@react-three/fiber';
```

### 3c. Tilføj `CrystalFurniture` komponent

**Tilføj** hele denne komponent **i bunden af filen**, efter den afsluttende `);` for `BedroomWardrobeFurniture`:

```tsx
/** Ur-Krystal som møbel — genbruger CrystalJunkModel-geometrien men i kabine-skala med langsom rotation. */
export const CrystalFurniture = forwardRef<Group, GroupProps>(function CrystalFurniture(props, ref) {
  const innerRef = useRef<Group>(null);
  useFrame(({ clock }) => {
    const g = innerRef.current;
    if (!g) return;
    const t = clock.elapsedTime;
    g.rotation.y += 0.004;
    g.position.y = Math.sin(t * 1.5) * 0.015;
  });
  return (
    <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'ur_krystal' }}>
      <group scale={ROOM_FURNITURE_SCALE}>
        <group ref={innerRef} position={[0, 0.35, 0]} scale={0.32}>
          <pointLight color={0x00ffff} intensity={1.2} distance={3} />
          {/* Ydre oktaeder */}
          <mesh castShadow scale={[1, 1.6, 1]}>
            <octahedronGeometry args={[0.8, 2]} />
            <meshStandardMaterial
              color={0x00ffff}
              emissive={0x0066aa}
              emissiveIntensity={0.6}
              roughness={0.05}
              metalness={0.9}
              flatShading
              transparent
              opacity={0.88}
            />
          </mesh>
          {/* Indre kerne */}
          <mesh scale={[1, 1.6, 1]}>
            <octahedronGeometry args={[0.45, 1]} />
            <meshStandardMaterial
              color={0x88ffff}
              emissive={0x00aaff}
              emissiveIntensity={0.8}
              roughness={0}
              metalness={1}
              flatShading
              transparent
              opacity={0.55}
            />
          </mesh>
          {/* Tetraeder-skår */}
          <mesh castShadow position={[0.55, -0.25, 0.3]} rotation={[0.4, 0.2, 0.8]}>
            <tetrahedronGeometry args={[0.5, 1]} />
            <meshStandardMaterial color={0x00ffff} emissive={0x0066aa} emissiveIntensity={0.6} roughness={0.05} metalness={0.9} flatShading transparent opacity={0.88} />
          </mesh>
          <mesh castShadow position={[-0.45, 0.3, -0.4]} rotation={[-0.2, 0.7, -0.5]}>
            <tetrahedronGeometry args={[0.6, 1]} />
            <meshStandardMaterial color={0x00ffff} emissive={0x0066aa} emissiveIntensity={0.6} roughness={0.05} metalness={0.9} flatShading transparent opacity={0.88} />
          </mesh>
          <mesh castShadow position={[0.2, -0.5, -0.5]} rotation={[0.8, -0.3, 0.4]}>
            <tetrahedronGeometry args={[0.35, 1]} />
            <meshStandardMaterial color={0x00ffff} emissive={0x0066aa} emissiveIntensity={0.6} roughness={0.05} metalness={0.9} flatShading transparent opacity={0.88} />
          </mesh>
        </group>
      </group>
    </group>
  );
});
```

**VIGTIGT:** Komponenten genbruger `ROOM_FURNITURE_SCALE` konstanten (= 2) som allerede er defineret øverst i filen.

---

## Trin 4: `src/three/cabin/CabinRoomFurniture.tsx`

Fire ændringer i denne fil:

### 4a. Tilføj `CrystalFurniture` til import

Find dette import-blok:

```ts
import {
  BedroomBedFurniture,
  BedroomDresserFurniture,
  BedroomFrameFurniture,
  BedroomLampFurniture,
  BedroomMirrorFurniture,
  BedroomNightstandFurniture,
  BedroomRugFurniture,
  BedroomWardrobeFurniture,
} from '../cabin/furniture/BedroomFurniture.js';
```

**Tilføj** `CrystalFurniture,` som sidste entry:

```ts
import {
  BedroomBedFurniture,
  BedroomDresserFurniture,
  BedroomFrameFurniture,
  BedroomLampFurniture,
  BedroomMirrorFurniture,
  BedroomNightstandFurniture,
  BedroomRugFurniture,
  BedroomWardrobeFurniture,
  CrystalFurniture,
} from '../cabin/furniture/BedroomFurniture.js';
```

### 4b. Tilføj `crystalFound` state + ref

Find denne sektion (ca. linje 525–527):

```ts
  const hasGoldenFrog = useCollectionStore((s) => s.hasGoldenFrog);

  const hasTurtle = questItems.includes('turtle_hatched');
```

**Tilføj** `crystalFound` state-read **mellem** `hasGoldenFrog` og `hasTurtle`:

```ts
  const hasGoldenFrog = useCollectionStore((s) => s.hasGoldenFrog);
  const crystalFound = usePlayerStore((s) => s.stats.crystalFound);

  const hasTurtle = questItems.includes('turtle_hatched');
```

Find ref-deklarationerne (ca. linje 578–583):

```ts
  const bedroomWardrobeRef = useRef<Group>(null);

  const pirateChestRef = useRef<Group>(null);
  const iceCubeRef = useRef<Group>(null);
  const musicBoxRef = useRef<Group>(null);
  const pirateCatRef = useRef<Group>(null);
```

**Tilføj** `crystalRef` efter `pirateCatRef`:

```ts
  const pirateCatRef = useRef<Group>(null);
  const crystalRef = useRef<Group>(null);
```

### 4c. Tilføj til movables-listen

Find denne linje i `rebuildMovableList()`:

```ts
    if (comp('pirate_cat', hasPirateCat)) push(pirateCatRef);
    cabinMovableRoots.current = list;
```

**Tilføj** krystal-linjen **mellem** pirate_cat og cabinMovableRoots:

```ts
    if (comp('pirate_cat', hasPirateCat)) push(pirateCatRef);
    if (comp('ur_krystal', crystalFound)) push(crystalRef);
    cabinMovableRoots.current = list;
```

**Tilføj** også `crystalFound,` til useMemo dependencies-arrayet. Find:

```ts
    hasPirateCat,
    unlockedFurniture,
```

**Ændr** til:

```ts
    hasPirateCat,
    crystalFound,
    unlockedFurniture,
```

### 4d. Tilføj JSX-rendering

Find denne sektion i JSX-return (render af bedroom_wardrobe efterfulgt af pirate_chest):

```tsx
      {vis('bedroom_wardrobe') && (
        <BedroomWardrobeFurniture
          ref={bedroomWardrobeRef}
          position={sp('bedroom_wardrobe').pos}
          rotation={[0, sp('bedroom_wardrobe').rotY, 0]}
        />
      )}

      {vis('pirate_chest') && (
```

**Indsæt** krystal-rendering **mellem** bedroom_wardrobe og pirate_chest:

```tsx
      {vis('bedroom_wardrobe') && (
        <BedroomWardrobeFurniture
          ref={bedroomWardrobeRef}
          position={sp('bedroom_wardrobe').pos}
          rotation={[0, sp('bedroom_wardrobe').rotY, 0]}
        />
      )}

      {comp('ur_krystal', crystalFound) && (
        <CrystalFurniture
          ref={crystalRef}
          position={sp('ur_krystal').pos}
          rotation={[0, sp('ur_krystal').rotY, 0]}
        />
      )}

      {vis('pirate_chest') && (
```

---

## Trin 5: `src/components/fishing/CatchResult.tsx`

To ændringer:

### 5a. Tilføj `crystal_junk` til `shouldAnimateFishToBucket`

Find funktionen `shouldAnimateFishToBucket` (ca. linje 17–28). **Tilføj** `fish.itemType !== 'crystal_junk'` som sidste betingelse:

```ts
function shouldAnimateFishToBucket(fish: RollCatchResult): boolean {
  return (
    fish.itemType !== 'bottle' &&
    fish.itemType !== 'plesiosaur' &&
    fish.itemType !== 'halibut' &&
    fish.itemType !== 'golden_frog' &&
    fish.itemType !== 'axolotl' &&
    fish.itemType !== 'fossil' &&
    fish.itemType !== 'conch' &&
    fish.itemType !== 'boss_hvidhaj' &&
    fish.itemType !== 'crystal_junk'
  );
}
```

### 5b. Omskriv hele `crystal_junk` if-blokken

Find denne blok (starter med `if (lastCatch.itemType === 'crystal_junk')`):

```ts
  /** Legacy ~12440–12454 */
  if (lastCatch.itemType === 'crystal_junk') {
    // ... ALT indhold ...
  }
```

**Erstat HELE blokken** (fra kommentaren `/** Legacy` til og med den afsluttende `}`) med:

```tsx
  /** Ur-Krystal — unlocks som møbel i hytten i stedet for at sælges. */
  if (lastCatch.itemType === 'crystal_junk') {
    const CRYSTAL_XP = 200;
    const alreadyFound = usePlayerStore.getState().stats.crystalFound;
    function dismissCrystal() {
      play('legendary');
      /* Krystallen lægges ikke i spanden — den bliver direkte til et møbel i hytten. */
      const prev = usePlayerStore.getState().progression;
      const { level, xp, levelUps } = applyXP(prev.level, prev.xp, CRYSTAL_XP);
      setProgression({ level, xp });
      setStats((st) => ({
        ...st,
        maxLevel: Math.max(st.maxLevel, level),
        crystalFound: true,
      }));
      if (levelUps.length > 0) setShowLevelUp(levelUps[levelUps.length - 1]!);
      setXpToast(`+${CRYSTAL_XP} XP`);
      if (!alreadyFound) {
        setToastMessage(
          '💠 Ur-Krystallen lyser op i soveværelset! Du kan flytte den rundt som de andre møbler.',
        );
      } else {
        setToastMessage(
          '💠 Endnu en Ur-Krystal! Dens energi smelter sammen med den du allerede har.',
        );
      }
      setLastCatch(null);
      setGameState('idle');
    }
    return (
      <div className={CATCH_OVERLAY_SHELL}>
        <div
          className="anim-zoom-in panel-dark pointer-events-auto relative mt-auto mb-2 max-h-[85dvh] w-full max-w-md overflow-y-auto overflow-x-hidden rounded-3xl border-4 p-8 text-center shadow-2xl scrollbar-hide md:mt-80"
          style={{
            borderColor: '#00FFFF',
            background: 'rgba(0,10,20,0.98)',
            boxShadow: '0 0 50px rgba(0,255,255,0.25)',
          }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at top, rgba(0,200,255,0.15), transparent 70%)',
            }}
          />
          <div className="relative z-10">
            <div className="mb-4 text-7xl leading-none" style={{ filter: 'drop-shadow(0 0 20px #00FFFF)' }}>
              💠
            </div>
            <div
              className="mb-4 inline-flex items-center gap-2 rounded-full px-5 py-1 text-xs font-black tracking-wider uppercase"
              style={{ background: '#007799', color: '#00FFFF' }}
            >
              ✨ Mystisk fund!
            </div>
            <h2 className="mb-2 text-4xl font-black" style={{ color: '#00FFFF' }}>
              Ur-Krystal
            </h2>
            <p className="mb-2 text-sm text-slate-400">
              Pulserende og geometrisk perfekt. Rykket fri fra grottebunden. Den summer af en mærkelig, gammel energi.
            </p>
            {!alreadyFound ? (
              <>
                <p className="mb-2 text-sm font-bold" style={{ color: '#00FFFF' }}>
                  🏠 Nyt møbel til hytten!
                </p>
                <p className="mb-6 text-sm text-cyan-200">
                  Krystallen flytter med hjem og stilles op i soveværelset — du kan flytte den rundt som de andre møbler!
                </p>
              </>
            ) : (
              <p className="mb-6 text-sm font-bold leading-relaxed" style={{ color: '#00FFFF' }}>
                Du har allerede en Ur-Krystal i hytten. Dens energi forstærker den eksisterende krystal!
              </p>
            )}
            <button
              type="button"
              onClick={dismissCrystal}
              className="w-full rounded-2xl border-b-4 py-4 text-xl font-bold text-black"
              style={{ background: '#00CCCC', borderColor: '#007788' }}
            >
              💠 Tag den med hjem
            </button>
          </div>
        </div>
      </div>
    );
  }
```

**Hvad der er ændret i detaljer:**
- `useBucketDropStore.getState().enqueue(lastCatch)` er **fjernet** — krystallen lægges IKKE i spanden
- `setInventory`-kald er **fjernet** — krystallen er ikke i inventory
- Badge-tekst: `💎 Skat!` → `✨ Mystisk fund!`
- Beskrivelsestekst: Ny conditional rendering — "Nyt møbel til hytten!" (første gang) vs. "Du har allerede en..." (gentagelse)
- Knap-tekst: `💠 Læg i spanden` → `💠 Tag den med hjem`
- Toast-besked: `'💠 Ur-Krystal lagt i spanden! Værdi 2.500 kr...'` → `'💠 Ur-Krystallen lyser op i soveværelset! Du kan flytte den rundt som de andre møbler.'`
- Al værdi-omtale er fjernet

---

## Trin 6: `src/components/fishing/MathChallenge.tsx`

Find `addToInventory`-definitionen (ca. linje 960–969):

```ts
    const addToInventory =
      resolved.itemType === 'fish' ||
      resolved.itemType === 'treasure' ||
      resolved.itemType === 'junk' ||
      resolved.itemType === 'crystal_junk' ||
      resolved.itemType === 'golden_frog' ||
      resolved.itemType === 'axolotl' ||
      resolved.itemType === 'halibut' ||
      resolved.itemType === 'pearl' ||
      resolved.itemType === 'piranha';
```

**Fjern** linjen `resolved.itemType === 'crystal_junk' ||` så det bliver:

```ts
    const addToInventory =
      resolved.itemType === 'fish' ||
      resolved.itemType === 'treasure' ||
      resolved.itemType === 'junk' ||
      resolved.itemType === 'golden_frog' ||
      resolved.itemType === 'axolotl' ||
      resolved.itemType === 'halibut' ||
      resolved.itemType === 'pearl' ||
      resolved.itemType === 'piranha';
```

---

## Trin 7: `src/components/hud/HUD.tsx`

Find `sellAllFish` funktionen (ca. linje 142–148):

```ts
  function sellAllFish() {
    const keep = inventory.filter(
      (f) => f.itemType === 'plesiosaur' || f.itemType === 'fossil' || f.itemType === 'conch',
    );
    const toSell = inventory.filter(
      (f) => f.itemType !== 'plesiosaur' && f.itemType !== 'fossil' && f.itemType !== 'conch',
    );
```

**Tilføj** `|| f.itemType === 'crystal_junk'` til keep-filteret og `&& f.itemType !== 'crystal_junk'` til toSell-filteret:

```ts
  function sellAllFish() {
    const keep = inventory.filter(
      (f) => f.itemType === 'plesiosaur' || f.itemType === 'fossil' || f.itemType === 'conch' || f.itemType === 'crystal_junk',
    );
    const toSell = inventory.filter(
      (f) => f.itemType !== 'plesiosaur' && f.itemType !== 'fossil' && f.itemType !== 'conch' && f.itemType !== 'crystal_junk',
    );
```

---

## Trin 8: `src/components/mobile/MobileBag.tsx`

Identisk ændring som trin 7. Find `sellAllFish` (ca. linje 78–84):

```ts
  function sellAllFish() {
    const keep = inventory.filter(
      (f) => f.itemType === 'plesiosaur' || f.itemType === 'fossil' || f.itemType === 'conch',
    );
    const toSell = inventory.filter(
      (f) => f.itemType !== 'plesiosaur' && f.itemType !== 'fossil' && f.itemType !== 'conch',
    );
```

**Tilføj** `crystal_junk` til begge filtre:

```ts
  function sellAllFish() {
    const keep = inventory.filter(
      (f) => f.itemType === 'plesiosaur' || f.itemType === 'fossil' || f.itemType === 'conch' || f.itemType === 'crystal_junk',
    );
    const toSell = inventory.filter(
      (f) => f.itemType !== 'plesiosaur' && f.itemType !== 'fossil' && f.itemType !== 'conch' && f.itemType !== 'crystal_junk',
    );
```

---

## Trin 9: `src/logic/bucket-inventory.ts`

Tilføj `f.itemType !== 'crystal_junk'` til **begge** funktioner.

### Før:

```ts
export function countsTowardBucketCapacity(f: Pick<RollCatchResult, 'itemType'>): boolean {
  return (
    f.itemType !== 'plesiosaur' &&
    f.itemType !== 'fossil' &&
    f.itemType !== 'conch'
  );
}

export function isListedInBucketInventory(f: Pick<RollCatchResult, 'itemType'>): boolean {
  return (
    f.itemType !== 'plesiosaur' &&
    f.itemType !== 'fossil' &&
    f.itemType !== 'conch'
  );
}
```

### Efter:

```ts
export function countsTowardBucketCapacity(f: Pick<RollCatchResult, 'itemType'>): boolean {
  return (
    f.itemType !== 'plesiosaur' &&
    f.itemType !== 'fossil' &&
    f.itemType !== 'conch' &&
    f.itemType !== 'crystal_junk'
  );
}

export function isListedInBucketInventory(f: Pick<RollCatchResult, 'itemType'>): boolean {
  return (
    f.itemType !== 'plesiosaur' &&
    f.itemType !== 'fossil' &&
    f.itemType !== 'conch' &&
    f.itemType !== 'crystal_junk'
  );
}
```

---

## Trin 10: `src/data/fish.ts`

Find linjen med `ur_krystal` (ca. linje 2208):

```ts
  { id: 'ur_krystal', name: 'Ur-Krystal', type: 'special', rarity: 'Mystisk', primaryAreas: ['cave'], requirements: { requiredRod: null, requiredBait: null }, itemType: 'crystal_junk', model: null, visual: 'crystal', value: 2500, xpReward: 50 },
```

**Ændr** `value: 2500` til `value: 0`:

```ts
  { id: 'ur_krystal', name: 'Ur-Krystal', type: 'special', rarity: 'Mystisk', primaryAreas: ['cave'], requirements: { requiredRod: null, requiredBait: null }, itemType: 'crystal_junk', model: null, visual: 'crystal', value: 0, xpReward: 50 },
```

---

## Trin 11: `src/data/progression.ts`

Find linjen med `cave_crystal` (ca. linje 48):

```ts
  { id: 'cave_crystal', title: 'Grottens Hjerte', description: 'Find en Ur-Krystal dybt i Den Mørke Grotte.', icon: '💠', category: 'fangst', condition: (s) => s.crystalFound, reward: { xp: 200, coins: 500 }, secret: true },
```

**Ændr** `description` fra:

```
'Find en Ur-Krystal dybt i Den Mørke Grotte.'
```

Til:

```
'Find en Ur-Krystal i Den Mørke Grotte og bring den hjem til hytten.'
```

---

## Tjekliste efter implementering

### TypeScript

- [ ] Kør `npx tsc --noEmit` — ingen type-fejl

### Funktionelle tests

- [ ] **Fang en Ur-Krystal i Den Mørke Grotte:**
  - Fangst-panelet viser "✨ Mystisk fund!" (IKKE "💎 Skat!")
  - Panelet siger "🏠 Nyt møbel til hytten!" og "Krystallen flytter med hjem..."
  - Knappen siger "💠 Tag den med hjem" (IKKE "Læg i spanden")
  - Der nævnes IKKE nogen kr-værdi nogetsteds i panelet
  - Spilleren får +200 XP

- [ ] **Krystallen havner IKKE i spanden:**
  - Spanden indeholder ingen Ur-Krystal efter fangst
  - "Sælg Alt" sælger IKKE krystallen

- [ ] **Krystallen vises i soveværelset:**
  - Gå til fiskehytten → soveværelset
  - Ur-Krystallen er synlig som et glødende cyan oktaeder på gulvet
  - Den roterer langsomt og svæver let

- [ ] **Krystallen kan flyttes:**
  - Aktivér møbel-tilstand
  - Klik og træk krystallen rundt i rummet
  - Drej krystallen
  - Flyt krystallen til et andet rum (stue/køkken)
  - Positioner gemmes korrekt mellem sessioner

- [ ] **Gentagelses-fangst:**
  - Fang krystallen en anden gang
  - Panelet viser "Du har allerede en Ur-Krystal i hytten..."
  - Toast siger "Dens energi smelter sammen med den du allerede har."

- [ ] **Progression-mål:**
  - "Grottens Hjerte"-målet viser opdateret beskrivelse
  - Målet completes stadig korrekt

- [ ] **Nulstil møbler:**
  - "Nulstil møbler" placerer krystallen tilbage på sin default-position i soveværelset

- [ ] **Eksisterende save-data:**
  - Spillere med `stats.crystalFound: true` i deres gem-data ser krystallen i soveværelset uden at behøve fange den igen
  - Spillere uden `crystalFound` ser ingen krystal (korrekt)

### Ting der IKKE skal ske

- [ ] Krystallen skal IKKE dukke op i spand-listen
- [ ] Krystallen skal IKKE have en kr-værdi nogetsteds
- [ ] "Sælg Alt" skal IKKE påvirke krystallen
- [ ] Krystallen skal IKKE animeres ned i spanden efter fangst
