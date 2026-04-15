# Havnemågen Haps — Cursor Composer Instruktion

> **Mål:** Tilføj NPC "Havnemågen Haps" til Skovsøen + sardine quest-item + kæledyr #10 + achievement #100.
> **Kør `npm run build` efter alle trin for at verificere.**

### VIGTIGE REGLER

- **Companion-id for Haps er `'haps'`** — IKKE `'seagull'`. Strengen `'seagull'` bruges allerede i `featherSources`-arrayet for måge-fjeren på molen. Brug `'haps'` overalt for at undgå forveksling.
- **Emoji/ikon for Haps er `🐦`** — IKKE `🪶`. Fjer-emojien `🪶` bruges allerede af fjer-samle-systemet (3 fjer → Papegøj-kæledyr). Brug `🐦` i alle Haps-relaterede steder (npcIcon, companion icon/emoji, toasts, achievement).
- **`wardrobeItems.generated.ts` skal IGNORERES** — klædeskabet er et lukket system der ikke er integreret med hovedspillets kæledyrslogik. Rør det ikke.

---

## TRIN 1 — Types

### 1a. `src/types/collectibles.ts`

Tilføj `'sardine'` til `CollectibleId`:

```typescript
export type CollectibleId = 'fossil' | 'conch' | 'pearl' | 'sardine';
```

Tilføj `'haps_pet'` til `MilestoneRewardType`:

```typescript
| 'haps_pet';
```

### 1b. `src/types/fish.ts`

Tilføj til `FishModelConfig` interface:

```typescript
isSardine?: boolean;
```

### 1c. `src/types/progression.ts`

Tilføj til `GoalStats` interface:

```typescript
sardineDelivered: number;
hapsUnlocked: boolean;
```

### 1d. `src/types/game.ts`

Tilføj til `SpecialRules` (eller tilsvarende interface der indeholder `fossilBonus`):

```typescript
sardineBonus?: number;
```

---

## TRIN 2 — Store

### 2a. `src/store/useCollectionStore.ts`

Tilføj `sardineCount` til `CollectibleCounts` interface:

```typescript
sardineCount: number;
```

Tilføj `sardine` til `CollectibleDelivered` interface:

```typescript
sardine: number;
```

Tilføj defaults i create-state: `sardineCount: 0` og `sardine: 0`.

---

## TRIN 3 — Data-filer

### 3a. `src/data/seagull-quotes.ts` — NY FIL

Opret denne fil:

```typescript
/** Tilfældige måge-citater når alle sardine-milepæle er nået (leveret > 10). */
export const SEAGULL_QUOTES = [
  'Sardiner, sardiner, sardiner... har jeg nævnt sardiner?',
  'Vidste du at sardiner smager bedst ved solopgang? Det gør de ikke. De smager altid godt.',
  'Jeg sad engang på en fiskekutter i tre dage. Bedste ferie nogensinde. Sardiner overalt.',
  'De andre måger er jaloux. De har ikke en sardinfisker som dig.',
  'Min bedstemor sagde altid: "Stol aldrig på en pelikan." Klog måge.',
  '*kigger ud over søen* ...Jeg tænker på sardiner. Hvad ellers?',
  'Hvis jeg var en fisk, ville jeg være en sardin. Så kunne jeg spise mig selv. Genialt.',
  'Du lugter lidt af sardiner. Det er det pæneste jeg nogensinde har sagt til nogen.',
] as const;
```

### 3b. `src/data/collectibles.ts`

**Tilføj import øverst:**

```typescript
export { SEAGULL_QUOTES } from './seagull-quotes.js';
```

**Tilføj `sardine` entry i `COLLECTIBLES` objektet** (efter `pearl`):

```typescript
sardine: {
  id: 'sardine',
  invKey: 'sardineCount',
  icon: '🐟',
  name: 'Sardin',
  namePlural: 'Sardiner',
  npcId: 'haps',
  npcName: 'Havnemågen Haps',
  npcIcon: '🐦',
  color: '#7A9AB5',
  bgColor: 'rgba(15,25,40,0.85)',
  borderColor: 'rgba(122,154,181,0.4)',
  modalBg: 'rgba(10,20,30,0.97)',
  modalBorder: 'rgba(122,154,181,0.5)',
  btnBg: '#2a4a60',
  btnBorder: '#1a3040',
  btnColor: '#c8e0f0',
  milestoneRewards: {
    1:  {
      type: 'xp_coins' as const,
      xp: 50,
      coins: 75,
      toast: '🐦 "Tak... jeg kan måske lidt godt lide dig." Haps nikker anerkendende!',
      particles: 30,
    },
    5:  {
      type: 'xp_coins' as const,
      xp: 150,
      coins: 200,
      toast: '🐦 "Du er måske slet ikke så dum." Haps basker begejstret med vingerne!',
      particles: 50,
    },
    10: {
      type: 'haps_pet',
      toast: '🐦 "Okay så... jeg vil gerne være din ven!" Havnemågen Haps er nu dit kæledyr!',
      particles: 80,
    },
  },
  dialogs: (d: number) => {
    if (d === 0)  return '"*snapper med næbbet* ...Har du sardiner? Jeg kan lugte dem. Giv mig sardiner."';
    if (d === 1)  return '"Tak... jeg kan måske lidt godt lide dig. Måske. Kom igen med flere sardiner."';
    if (d < 5)    return `"${d} sardiner! Du er en rimelig god sardinfisker. For et menneske."`;
    if (d === 5)  return '"FEM sardiner!! Du er måske slet ikke så dum. *basker med vingerne*"';
    if (d < 10)   return `"${d} sardiner! Jeg begynder at vænne mig til dig. Bliv nu ikke for glad."`;
    if (d === 10) return '"TI SARDINER!! Okay så... jeg vil gerne være din ven! *lander på din skulder* 🐦"';
    return `"${d} sardiner — du er min yndlingsfisker. Sig det ikke til de andre måger."`;
  },
  emptyText: 'Ingen sardiner? De svømmer i Skovsøen! Skynd dig, jeg er sulten!',
  returnText: '*Haps stirrer intenst på dig med store måge-øjne*',
},
```

**Tilføj Haps til `COMPANIONS_DATABASE`** (som 10. entry i bunden af arrayet):

```typescript
{ id: 'haps', name: 'Havnemågen Haps', icon: '🐦', emoji: '🐦', color: '#7A9AB5', description: 'Elsker sardiner og sidder på din skulder. Stjæler gerne sardiner.', unlockType: 'haps_sardine_milestone' },
```

### 3c. `src/data/fish.ts`

Tilføj sardine entry i `CATCH_MASTER_DATA` arrayet (ved siden af fossil/konkylie entries):

```typescript
{ id: 'sardine', name: 'Lille Sardin', type: 'quest', rarity: 'Sjælden', primaryAreas: ['smaragd'], requirements: { requiredRod: null, requiredBait: null }, itemType: 'sardine', model: { color: 0x7A9AB5, bodyShape: [0.4, 0.5, 1.0], tail: 'forked', speed: 2.5, scale: 0.35, isSardine: true, stripes: true, bellyColor: 0xE8E8E0, metalness: 0.4, roughness: 0.25 }, visual: 'sardine' },
```

### 3d. `src/data/locations.ts`

Tilføj `sardineBonus: 0.04` til smaragd-lokationens `specialRules`:

```typescript
// FØR:
specialRules: { nothingChance: 0, fossilBonus: 0.006, hasSeagulls: true },

// EFTER:
specialRules: { nothingChance: 0, fossilBonus: 0.006, sardineBonus: 0.04, hasSeagulls: true },
```

### 3e. `src/data/progression.ts`

Tilføj achievement #100 i bunden af `GOALS` arrayet:

```typescript
{ id: 'haps_friend', title: 'Mågeven', description: 'Bliv venner med Havnemågen Haps ved at give ham 10 sardiner.', icon: '🐦', category: 'samling', condition: (s) => s.hapsUnlocked, reward: { xp: 500, coins: 500 }, secret: true },
```

---

## TRIN 4 — Logik

### 4a. `src/logic/catch-pool.ts`

Find det sted der roller fossil-bonus (søg efter `fossilBonus`). Tilføj sardine-roll **lige ved siden af**, med samme mønster:

```typescript
// Sardine-roll (kun i Skovsøen)
if (rules?.sardineBonus && Math.random() < rules.sardineBonus) {
  const sardineEntry = enrichedData.find((e) => e.id === 'sardine');
  if (sardineEntry) return sardineEntry;
}
```

**Vigtigt:** Sardine-roll skal ske FØR den normale fiske-roll, ligesom fossil-roll gør.

### 4b. `src/logic/save-load.ts`

Filen hedder sandsynligvis `src/logic/game-persistence.ts` (der gemmer `collectibleInventory` og `collectibleDelivered`). Tilføj `sardineCount` og `sardine` felterne med default `0` i load-fallback, så eksisterende saves ikke crasher.

Find `GoalStats` snapshot-builder (sandsynligvis i `src/logic/goal-progress.ts`). Tilføj:

```typescript
sardineDelivered: collectibleDelivered.sardine ?? 0,
hapsUnlocked: unlockedCompanions.includes('haps'),
```

---

## TRIN 5 — UI-komponenter

### 5a. `src/components/modals/CollectibleModal.tsx`

**Opdater de tre helper-funktioner** (de er hardcodede og skal kende til sardine):

```typescript
// invKeyFor — tilføj sardineCount til union type
function invKeyFor(id: CollectibleId): 'fossilCount' | 'conchCount' | 'pearlCount' | 'sardineCount' {
  return COLLECTIBLES[id].invKey as 'fossilCount' | 'conchCount' | 'pearlCount' | 'sardineCount';
}

// deliveredKeyFor — tilføj sardine case
function deliveredKeyFor(id: CollectibleId): 'fossil' | 'conch' | 'pearl' | 'sardine' {
  if (id === 'fossil') return 'fossil';
  if (id === 'conch') return 'conch';
  if (id === 'sardine') return 'sardine';
  return 'pearl';
}

// itemTypeFor — tilføj sardine case
function itemTypeFor(id: CollectibleId): string {
  if (id === 'fossil') return 'fossil';
  if (id === 'conch') return 'conch';
  if (id === 'sardine') return 'sardine';
  return 'pearl';
}
```

**Tilføj import:**

```typescript
import { SEAGULL_QUOTES } from '../../data/seagull-quotes';
```

**Tilføj SEAGULL_QUOTES logik** i modal-komponentens body, ved siden af den eksisterende `usePirateQuotes` logik:

```typescript
const useSeagullQuotes = kind === 'sardine' && delivered > 10 && onHand > 0;
const seagullQuoteIdx = Math.floor(Math.random() * SEAGULL_QUOTES.length);
```

Brug det i dialog-teksten ligesom piraten gør (se `usePirateQuotes` mønsteret og kopier det).

**Tilføj `haps_pet` case i `applyReward` funktionen** (ved siden af `pirate_cat` casen):

```typescript
if (r.type === 'haps_pet') {
  useCollectionStore.getState().setUnlockedCompanions((prev) =>
    prev.includes('haps') ? prev : [...prev, 'haps'],
  );
}
```

### 5b. `src/components/fishing/CatchResult.tsx`

Find fossil/conch catch-overlay logikken. Tilføj sardine-blok (følg det eksisterende mønster for fossil):

```tsx
if (lastCatch.itemType === 'sardine') {
  return (
    <div className={CATCH_OVERLAY_SHELL}>
      <div style={{
        borderColor: '#7A9AB5',
        background: 'rgba(15,25,35,0.97)',
        borderWidth: 2,
      }}>
        <h2 style={{ color: '#A8C8E0' }}>🐟 Lille Sardin!</h2>
        <p style={{ color: '#8ab0cc' }}>
          En lille sølvblå sardin! Mon der er nogen der kan lide dem...
        </p>
        <p style={{ color: '#6a90a8' }}>
          Du har nu {collectibleInventory.sardineCount} sardiner.
        </p>
        <button
          onClick={dismissSardine}
          style={{
            background: '#2a4a60',
            border: '1px solid #4a7a98',
            color: '#c8e0f0',
          }}
        >
          Læg i lommen 🐟
        </button>
      </div>
    </div>
  );
}
```

Tilføj `dismissSardine` handler der matcher det eksisterende mønster for `dismissFossil` — den skal incrementere `sardineCount` i `collectibleInventory`.

---

## TRIN 6 — 3D-modeller

### 6a. `src/three/models/CuteFishModel.tsx`

**Tilføj dispatch** i hovedkomponenten, ved siden af `isFossil` og `isConch` checks (ca. linje 540-555):

```tsx
if (config.isSardine)
  return (
    <SardineModel
      scale={config.scale ?? 1}
      bucketIdle={bucketIdle}
      editorMode={editorMode}
      onPartClick={onPartClick}
    />
  );
```

**Tilføj `SardineModel` komponent** i bunden af filen (ved siden af `FossilModel` og `ConchModel`):

```tsx
function SardineModel({ scale, bucketIdle }: { scale: number; bucketIdle?: boolean } & EditorModelProps) {
  const g = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!g.current) return;
    const t = clock.elapsedTime;
    g.current.rotation.y += bucketIdle ? 0.006 : 0.015;
    g.current.position.y = Math.sin(t * 3.0) * (bucketIdle ? 0.02 : 0.05);
    g.current.rotation.z = Math.sin(t * 4.5) * 0.08;
  });

  return (
    <group ref={g} scale={scale * 0.45}>
      {/* Krop — aflang */}
      <mesh castShadow scale={[0.7, 0.8, 1.6]}>
        <sphereGeometry args={[0.2, 10, 8]} />
        <meshPhysicalMaterial color="#7A9AB5" metalness={0.4} roughness={0.25} clearcoat={0.6} clearcoatRoughness={0.15} />
      </mesh>
      {/* Bug — sølv-hvid underside */}
      <mesh position={[0, -0.06, 0]} scale={[0.6, 0.4, 1.4]}>
        <sphereGeometry args={[0.18, 8, 6]} />
        <meshPhysicalMaterial color="#E8E8E0" metalness={0.3} roughness={0.3} />
      </mesh>
      {/* Sølvstribe langs siden */}
      <mesh position={[0, 0.02, 0]} scale={[0.72, 0.15, 1.5]}>
        <sphereGeometry args={[0.18, 8, 4]} />
        <meshPhysicalMaterial color="#C8D8E8" metalness={0.6} roughness={0.15} emissive="#C8D8E8" emissiveIntensity={0.1} />
      </mesh>
      {/* Øjne */}
      <mesh position={[0.12, 0.06, 0.2]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[-0.12, 0.06, 0.2]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Gaffelhale */}
      <group position={[0, 0, -0.38]}>
        <mesh castShadow rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.02, 0.18, 0.12]} />
          <meshPhysicalMaterial color="#6889A0" metalness={0.3} roughness={0.3} />
        </mesh>
        <mesh castShadow rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.02, 0.18, 0.12]} />
          <meshPhysicalMaterial color="#6889A0" metalness={0.3} roughness={0.3} />
        </mesh>
      </group>
      {/* Rygfinne */}
      <mesh position={[0, 0.18, -0.05]} rotation={[0.2, 0, 0]} castShadow>
        <coneGeometry args={[0.04, 0.1, 4]} />
        <meshPhysicalMaterial color="#6889A0" metalness={0.3} roughness={0.3} />
      </mesh>
    </group>
  );
}
```

### 6b. `src/three/models/SeagullNPC.tsx` — NY FIL

Opret denne fil. Den genbruger den eksisterende `Seagull`-komponent fra `Seagull.tsx`:

```tsx
import { useRef, useState } from 'react';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import { Seagull } from './Seagull.js';

/**
 * Havnemågen Haps — NPC der sidder på brostolpe ved Skovsøen.
 * Idle: basker let, kigger rundt, vipper med hoved.
 * Klik: åbner CollectibleModal for sardiner.
 */
export function SeagullNPC({
  position = [-1.8, 0.85, 5.9],
  onInteract,
}: {
  position?: [number, number, number];
  onInteract: () => void;
}) {
  const g = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const baseY = position[1];

  useFrame(({ clock }) => {
    if (!g.current) return;
    const t = clock.elapsedTime;
    g.current.rotation.y = Math.sin(t * 0.5) * 0.3;
    g.current.position.y = baseY + Math.sin(t * 1.2) * 0.015;
  });

  return (
    <group
      ref={g}
      position={position}
      onClick={(e) => { e.stopPropagation(); onInteract(); }}
      onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = ''; }}
    >
      <Seagull
        palette={{ body: 0xf0f0ee, wing: 0xe0e0de }}
        scale={hovered ? 1.1 : 1.0}
      />
      {hovered && (
        <mesh position={[0, 0.55, 0]}>
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshStandardMaterial color="#ffcc40" emissive="#ffcc40" emissiveIntensity={0.8} />
        </mesh>
      )}
    </group>
  );
}
```

### 6c. Skovsøen environment — tilføj SeagullNPC

Find den environment-komponent der renderer Skovsøen (location id `smaragd`). Den bruger Pier-baseret dock. Tilføj:

```tsx
import { SeagullNPC } from '../models/SeagullNPC.js';
```

Og i JSX, kun når `locationId === 'smaragd'`:

```tsx
{locationId === 'smaragd' && (
  <SeagullNPC
    position={[-1.8, 0.85, 5.9]}
    onInteract={() => openCollectibleModal('sardine')}
  />
)}
```

> **Position-detaljer:** Bropillerne i `Pier.tsx` er cylindre (radius 0.18, højde 3.5) placeret ved `y = -1` inde i en gruppe med `position={[0, 0.1, 0]}`. Pylon index 4 (venstre side, midtfor broen) har position `[-1.8, -1, 5.9]`. Toppen af cylinderen er ved `y = -1 + 1.75 = 0.75`, plus gruppe-offset `0.1` = **`0.85` i world-space**. Positionen `[-1.8, 0.85, 5.9]` placerer Haps præcis ovenpå den markerede bropille. Finjustér `y` med ±0.05 hvis Seagull-modellen skal sidde lidt højere.

---

## TRIN 7 — Verificering

Kør `npm run build` og ret eventuelle type-fejl.

Tjek derefter disse ting:

1. **GOALS.length === 100** — tilføj `console.log(GOALS.length)` midlertidigt
2. **COMPANIONS_DATABASE.length === 10** — tilføj `console.log(COMPANIONS_DATABASE.length)` midlertidigt
3. **CollectibleId union** har 4 members: `fossil | conch | pearl | sardine`
4. **Smaragd specialRules** har `sardineBonus: 0.04`
5. **Save/load** håndterer `sardineCount: 0` og `sardine: 0` som defaults for eksisterende saves
6. **Ingen brug af `'seagull'` som companion-id** — søg hele src/ for `'seagull'` og verificer at det KUN refererer til feather-systemet, aldrig til Haps. Haps bruger `'haps'` overalt.
7. **Ingen brug af 🪶 i Haps-kontekst** — den emoji tilhører fjer-systemet

---

## Fil-oversigt

| # | Fil | Handling |
|---|-----|---------|
| 1 | `src/types/collectibles.ts` | ÆNDR — tilføj `sardine` + `haps_pet` |
| 2 | `src/types/fish.ts` | ÆNDR — tilføj `isSardine` |
| 3 | `src/types/progression.ts` | ÆNDR — tilføj `sardineDelivered` + `hapsUnlocked` |
| 4 | `src/types/game.ts` | ÆNDR — tilføj `sardineBonus` |
| 5 | `src/store/useCollectionStore.ts` | ÆNDR — tilføj sardine til interfaces + defaults |
| 6 | `src/data/seagull-quotes.ts` | **OPRET** — 8 citater |
| 7 | `src/data/collectibles.ts` | ÆNDR — sardine config + Haps companion + export |
| 8 | `src/data/fish.ts` | ÆNDR — sardine i CATCH_MASTER_DATA |
| 9 | `src/data/locations.ts` | ÆNDR — sardineBonus i smaragd |
| 10 | `src/data/progression.ts` | ÆNDR — achievement #100 |
| 11 | `src/logic/catch-pool.ts` | ÆNDR — sardine-roll |
| 12 | `src/logic/game-persistence.ts` | ÆNDR — sardine i save/load |
| 13 | `src/logic/goal-progress.ts` | ÆNDR — sardine i GoalStats snapshot |
| 14 | `src/components/modals/CollectibleModal.tsx` | ÆNDR — helpers + quotes + reward |
| 15 | `src/components/fishing/CatchResult.tsx` | ÆNDR — sardine overlay |
| 16 | `src/three/models/CuteFishModel.tsx` | ÆNDR — SardineModel + dispatch |
| 17 | `src/three/models/SeagullNPC.tsx` | **OPRET** — Haps NPC |
| 18 | `src/three/environments/` (smaragd) | ÆNDR — placer SeagullNPC |
| — | `src/data/wardrobeItems.generated.ts` | ⛔ RØR IKKE — lukket system, ikke integreret |
