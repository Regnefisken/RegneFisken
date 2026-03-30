# PROMPT: Byg in-game Fish Editor (dev-mode) v2

## Mål

Byg en **fish editor dev-mode** direkte ind i regnefisken-spillet. Editoren skal:

1. **3D Preview** — rendere enhver fisk med spillets **faktiske** `CuteFishModel` i game-canvasen, med OrbitControls til fri rotation/zoom
2. **Parameter-kontrol** — sliders, dropdowns, color pickers og checkboxes for alle `FishModelConfig`-parametre
3. **Drag-and-drop af kropsdele** — klikbar selektion af individuelle kropsdele (øjne, finner, hale, klør osv.) med TransformControls-gizmo til positionering + per-del skalering
4. **Opret nye fisk** — byg fisk fra bunden med id, navn, rarity, areas, og eksportér komplet `CatchMasterEntry`
5. **Erstat eksisterende fisk** — vælg en fisk, rediger dens model, eksportér opdateret config klar til indsætning i `fish.ts`
6. **Udvidelsesvenlig arkitektur** — let at tilføje nye features (tænder, finnetyper, gennemsigtighed, svømmemønstre, skælmønstre osv.) efter editoren er bygget
7. **Fuldstændig isoleret** — al editor-kode lever i dedikerede mapper, gates bag `import.meta.env.DEV`, og kan fjernes ved at slette 3 mapper + revertere 3 linjer

**KRITISK REGEL:** Editoren SKAL bruge spillets eksisterende `CuteFishModel`-komponent direkte — **INGEN genimplementering** af fiskemodeller. 1:1-rendering opnås KUN ved at bruge de faktiske spilkomponenter.

---

## Referencefiler du SKAL læse og forstå

Læs disse filer GRUNDIGT inden du begynder at kode:

| Fil | Hvorfor |
|-----|---------|
| `src/types/fish.ts` | `FishModelConfig` interface — alle parametre, `TailType`, `CatchMasterEntry` |
| `src/data/fish.ts` | `CATCH_MASTER_DATA` — alle fisk, `CUTE_FISH_CONFIG` map |
| `src/three/models/CuteFishModel.tsx` | Den faktiske renderingskomponent — forstå ALLE sub-modeller og `StandardFishModel` |
| `src/three/models/cuteFishUtils.ts` | `createFishLatheGeometry()`, `getScaleTextures()`, `resolveBodyColor()` |
| `src/three/Experience.tsx` | Hovedscenen |
| `src/three/GameCanvas.tsx` | Canvas-opsætning |
| `src/App.tsx` | App-layout og overlay-lag |
| `src/store/useUIStore.ts` | Zustand store-mønster (brug som skabelon) |

Se også specifikationen: `references/FISH_GENERATOR_SPEC.md`

---

## Arkitektur — oversigt

### Nye filer (3 mapper):

```
src/
  store/
    useEditorStore.ts          ← Zustand store
  components/
    editor/
      FishEditorPanel.tsx      ← Hoved-overlay panel
      EditorFishSelector.tsx   ← Fisk-vælger (dropdown + create new)
      EditorBodyControls.tsx   ← Body shape + scale sliders
      EditorColorControls.tsx  ← Farve-pickers
      EditorFeatureToggles.tsx ← Boolean-flag checkboxes
      EditorPartAdjuster.tsx   ← Per-del position/skala sliders
      EditorExport.tsx         ← Export-knapper + preview
  three/
    editor/
      EditorFishPreview.tsx    ← R3F preview-komponent med OrbitControls + TransformControls
```

### Ændringer i eksisterende filer:

| Fil | Ændring |
|-----|---------|
| `src/types/fish.ts` | Tilføj `partAdjustments` felt til `FishModelConfig` |
| `src/three/models/CuteFishModel.tsx` | Tilføj `editorMode` prop + wrap dele i navngivne grupper + `onPartClick` callback |
| `src/App.tsx` | Keyboard listener + mount `FishEditorPanel` (bag `import.meta.env.DEV`) |
| `src/three/Experience.tsx` | Mount `EditorFishPreview` + skjul normal scene i editor-mode |

---

## DEL 1: Typeudvidelse — `src/types/fish.ts`

Tilføj dette til `FishModelConfig`-interfacet:

```typescript
/** Per-kropsdel position/skala-justeringer (bruges af editoren og respekteres af modellen). */
partAdjustments?: {
  [partName: string]: {
    dx?: number; dy?: number; dz?: number;
    sx?: number; sy?: number; sz?: number;  // scale-multiplikatorer, default 1
  };
};
```

`partName` keys er definerede strings som `'leftEye'`, `'rightEye'`, `'tail'`, `'dorsalFin'`, `'leftFin'`, `'rightFin'`, `'beak'`, `'jaw'`, `'lure'`, `'whiskers'`, `'body'`, `'leftClaw'`, `'rightClaw'`, `'legs'`, `'tentacles'`, `'head'`, etc.

Dette felt er **100% optional** — eksisterende fisk uden `partAdjustments` renderes identisk som før.

---

## DEL 2: CuteFishModel-ændringer — `src/three/models/CuteFishModel.tsx`

### 2a. Hjælpekomponent: `PartGroup`

Tilføj øverst i filen (efter imports):

```tsx
interface PartGroupProps {
  name: string;
  adjustments?: FishModelConfig['partAdjustments'];
  editorMode?: boolean;
  selectedPart?: string | null;
  onPartClick?: (name: string) => void;
  children: React.ReactNode;
}

function PartGroup({ name, adjustments, editorMode, selectedPart, onPartClick, children }: PartGroupProps) {
  const adj = adjustments?.[name];
  const isSelected = editorMode && selectedPart === name;

  return (
    <group
      position={[adj?.dx ?? 0, adj?.dy ?? 0, adj?.dz ?? 0]}
      scale={[adj?.sx ?? 1, adj?.sy ?? 1, adj?.sz ?? 1]}
      onClick={editorMode ? (e) => { e.stopPropagation(); onPartClick?.(name); } : undefined}
      userData={{ editorPartName: name }}
    >
      {children}
      {isSelected && (
        <mesh scale={1.15}>
          <sphereGeometry args={[0.2, 8, 6]} />
          <meshBasicMaterial color="#00ff88" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}
```

### 2b. Udvid `CuteFishModel` props

Tilføj `editorMode`, `selectedPart`, og `onPartClick` som **optional** props:

```tsx
export function CuteFishModel({
  config,
  fishModelId,
  instanceId,
  rollColor,
  bucketIdle,
  editorMode,       // ← NYT (optional)
  selectedPart,     // ← NYT (optional)
  onPartClick,      // ← NYT (optional)
}: {
  config: FishModelConfig;
  fishModelId: string;
  instanceId: string;
  rollColor: number;
  bucketIdle?: boolean;
  editorMode?: boolean;
  selectedPart?: string | null;
  onPartClick?: (name: string) => void;
}) {
```

Send `editorMode`, `selectedPart`, og `onPartClick` videre til alle sub-modeller (`StandardFishModel`, `LobsterModel`, `CrabModel`, osv.) som **optional** props.

### 2c. Wrap kropsdele i `PartGroup` i `StandardFishModel`

I `StandardFishModel`, wrap HVER logisk kropsdel i `<PartGroup>`:

**Eksempel — øjne:**
```tsx
<PartGroup name="leftEye" adjustments={config.partAdjustments} editorMode={editorMode} selectedPart={selectedPart} onPartClick={onPartClick}>
  <mesh position={[sz * 0.65, sy * 0.15, sx * 0.55]}>
    <sphereGeometry args={[0.14, 10, 8]} />
    <meshBasicMaterial color="#ffffff" />
  </mesh>
  <mesh position={[sz * 0.73, sy * 0.16, sx * 0.57]}>
    <sphereGeometry args={[0.08, 8, 6]} />
    <meshBasicMaterial color="#111111" />
  </mesh>
  <mesh position={[sz * 0.76, sy * 0.21, sx * 0.59]}>
    <sphereGeometry args={[0.035, 5, 4]} />
    <meshBasicMaterial color="#ffffff" />
  </mesh>
</PartGroup>
```

**Samme mønster for:** `rightEye`, `tail` (wrap `<group ref={tailGroup}>...</group>`), `dorsalFin` (finUp/spikes blokken), `leftFin`, `rightFin`, `beak` (longBeak), `sword`, `whiskers`, `jaw` (isPiranha), `lure`, `dinoHead` (isDino), `dinoLegs`.

### 2d. Samme mønster i creature-modeller

I `LobsterModel`, `CrabModel`, `OctopusModel`, `FrogModel`, `RayModel`, `StarfishModel` — wrap logiske dele i `PartGroup` med relevante navne.

**LobsterModel dele:** `body`, `head`, `leftClaw`, `rightClaw`, `legs`, `eyes`
**CrabModel dele:** `body`, `leftClaw`, `rightClaw`, `legs`, `eyes`
**OctopusModel dele:** `head`, `tentacles`, `eyes`
**FrogModel dele:** `body`, `eyes`, `legs`
**RayModel dele:** `body`, `leftWing`, `rightWing`, `tail`, `eyes`

### VIGTIGT

- Alle nye props er **optional** med default `undefined` — eksisterende kaldsteder (HookedCatchModel, etc.) behøver INGEN ændringer
- Når `editorMode` er `undefined`/`false`, er adfærden 100% identisk med nuværende kode
- `PartGroup` uden adjustments er en ren pass-through `<group>` med position `[0,0,0]` og scale `[1,1,1]`

---

## DEL 3: `src/store/useEditorStore.ts`

```typescript
import { create } from 'zustand';
import type { FishModelConfig, CatchMasterEntry } from '../types/fish.js';
import { CATCH_MASTER_DATA } from '../data/fish.js';

export type EditorMode = 'edit' | 'create';

interface NewFishMeta {
  id: string;
  name: string;
  rarity: string;
  type: string;
  primaryAreas: string[];
  itemType: string;
}

interface EditorState {
  isOpen: boolean;
  mode: EditorMode;

  // Valgt fisk (edit mode)
  selectedFishId: string | null;
  originalConfig: FishModelConfig | null;  // uændret kopi til diff

  // Live config (begge modes)
  configOverride: FishModelConfig | null;

  // Ny fisk metadata (create mode)
  newFishMeta: NewFishMeta;

  // Part selection for drag/adjust
  selectedPart: string | null;

  // Actions
  toggle: () => void;
  close: () => void;
  setMode: (mode: EditorMode) => void;
  selectFish: (id: string) => void;
  updateConfig: (partial: Partial<FishModelConfig>) => void;
  updatePartAdjustment: (partName: string, adj: { dx?: number; dy?: number; dz?: number; sx?: number; sy?: number; sz?: number }) => void;
  selectPart: (name: string | null) => void;
  resetConfig: () => void;
  setNewFishMeta: (partial: Partial<NewFishMeta>) => void;
  startNewFish: () => void;
  cloneFromExisting: (id: string) => void;
}

const DEFAULT_CONFIG: FishModelConfig = {
  color: 0x6699AA,
  bodyShape: [1.0, 1.0, 1.2],
  tail: 'standard',
  speed: 1.0,
  scale: 1.0,
};

const DEFAULT_META: NewFishMeta = {
  id: 'fisk_ny_',
  name: '',
  rarity: 'Almindelig',
  type: 'fish',
  primaryAreas: ['pier'],
  itemType: 'fish',
};

export const useEditorStore = create<EditorState>((set, get) => ({
  isOpen: false,
  mode: 'edit',
  selectedFishId: null,
  originalConfig: null,
  configOverride: null,
  newFishMeta: { ...DEFAULT_META },
  selectedPart: null,

  toggle: () => set((s) => {
    if (s.isOpen) return { isOpen: false, selectedPart: null };
    return { isOpen: true };
  }),
  close: () => set({ isOpen: false, selectedPart: null }),

  setMode: (mode) => set({
    mode,
    selectedFishId: null,
    originalConfig: null,
    configOverride: mode === 'create' ? structuredClone(DEFAULT_CONFIG) : null,
    newFishMeta: { ...DEFAULT_META },
    selectedPart: null,
  }),

  selectFish: (id) => {
    const entry = CATCH_MASTER_DATA.find((c) => c.id === id);
    if (!entry?.model) return;
    set({
      selectedFishId: id,
      originalConfig: structuredClone(entry.model),
      configOverride: structuredClone(entry.model),
      selectedPart: null,
    });
  },

  updateConfig: (partial) =>
    set((s) => {
      if (!s.configOverride) return s;
      return { configOverride: { ...s.configOverride, ...partial } };
    }),

  updatePartAdjustment: (partName, adj) =>
    set((s) => {
      if (!s.configOverride) return s;
      const current = s.configOverride.partAdjustments ?? {};
      return {
        configOverride: {
          ...s.configOverride,
          partAdjustments: {
            ...current,
            [partName]: { ...(current[partName] ?? {}), ...adj },
          },
        },
      };
    }),

  selectPart: (name) => set({ selectedPart: name }),

  resetConfig: () => {
    const { mode, selectedFishId, originalConfig } = get();
    if (mode === 'edit' && originalConfig) {
      set({ configOverride: structuredClone(originalConfig), selectedPart: null });
    } else {
      set({ configOverride: structuredClone(DEFAULT_CONFIG), selectedPart: null });
    }
  },

  setNewFishMeta: (partial) =>
    set((s) => ({ newFishMeta: { ...s.newFishMeta, ...partial } })),

  startNewFish: () =>
    set({
      mode: 'create',
      selectedFishId: null,
      originalConfig: null,
      configOverride: structuredClone(DEFAULT_CONFIG),
      newFishMeta: { ...DEFAULT_META },
      selectedPart: null,
    }),

  cloneFromExisting: (id) => {
    const entry = CATCH_MASTER_DATA.find((c) => c.id === id);
    if (!entry?.model) return;
    set({
      mode: 'create',
      selectedFishId: null,
      originalConfig: null,
      configOverride: structuredClone(entry.model),
      newFishMeta: {
        id: entry.id + '_klon',
        name: entry.name + ' (klon)',
        rarity: entry.rarity,
        type: entry.type,
        primaryAreas: [...entry.primaryAreas],
        itemType: entry.itemType,
      },
      selectedPart: null,
    });
  },
}));
```

---

## DEL 4: `src/three/editor/EditorFishPreview.tsx`

Denne komponent renders **inde i** den eksisterende R3F `<Canvas>` via `Experience.tsx`.

```tsx
import { useRef, useEffect } from 'react';
import { OrbitControls, Grid, TransformControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEditorStore } from '../../store/useEditorStore.js';
import { CuteFishModel } from '../models/CuteFishModel.js';

export function EditorFishPreview() {
  const isOpen = useEditorStore((s) => s.isOpen);
  const selectedFishId = useEditorStore((s) => s.selectedFishId);
  const config = useEditorStore((s) => s.configOverride);
  const mode = useEditorStore((s) => s.mode);
  const selectedPart = useEditorStore((s) => s.selectedPart);
  const selectPart = useEditorStore((s) => s.selectPart);
  const updatePartAdjustment = useEditorStore((s) => s.updatePartAdjustment);

  const { camera } = useThree();

  // Sæt kamera til en god editor-position
  useEffect(() => {
    if (isOpen) {
      camera.position.set(0, 1.5, 4);
      camera.lookAt(0, 0, 0);
    }
  }, [isOpen, camera]);

  if (!isOpen || !config) return null;
  // I create-mode vises fisken altid, i edit-mode kun når en fisk er valgt
  if (mode === 'edit' && !selectedFishId) return null;

  const fishId = mode === 'edit' ? selectedFishId! : 'editor-new-fish';

  return (
    <>
      <OrbitControls makeDefault enablePan enableZoom enableRotate target={[0, 0, 0]} />

      {/* Neutral, stabil belysning til editor (uafhængig af spil-scene) */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow={false} />
      <directionalLight position={[-3, 4, -5]} intensity={0.4} />

      {/* Referencegrid */}
      <Grid
        args={[10, 10]}
        position={[0, -1.5, 0]}
        cellSize={0.5}
        cellColor="#6e6e6e"
        sectionSize={2}
        sectionColor="#9e9e9e"
        fadeDistance={12}
        infiniteGrid
      />

      {/* Baggrund */}
      <color attach="background" args={['#1a1a2e']} />

      {/* Selve fisken — spillets FAKTISKE CuteFishModel med editorMode */}
      <group position={[0, 0, 0]} onClick={(e) => {
        // Klik på tom plads deselekterer
        if (e.object.userData?.editorPartName == null) selectPart(null);
      }}>
        <CuteFishModel
          config={config}
          fishModelId={fishId}
          instanceId="editor-preview"
          rollColor={config.color ?? 0x888888}
          bucketIdle={false}
          editorMode={true}
          selectedPart={selectedPart}
          onPartClick={(name) => selectPart(name)}
        />
      </group>
    </>
  );
}
```

**Bemærk:** `CuteFishModel` bruges med de nye `editorMode`-props. Ingen ny renderingslogik.

---

## DEL 5: `src/components/editor/FishEditorPanel.tsx` — Hovedpanel

### Layout

- **Position:** `fixed right-0 top-0 bottom-0`, bredde `w-96` (384px)
- **Stil:** `bg-gray-900/90 backdrop-blur-md text-white z-[99999] overflow-y-auto`
- **Header:** Fiskenavn, id, mode-toggle, luk-knap
- **Indhold:** Sammenklappelige sektioner via `<details open>/<summary>`

### Sektioner i panelet

Opbyg panelet med følgende sektioner. Brug separate sub-komponenter for overskuelighed.

---

### Sektion 1: Mode & Fisk-vælger (`EditorFishSelector.tsx`)

**Mode toggle:** To knapper øverst: "Redigér eksisterende" / "Opret ny"

**Edit-mode:**
- `<select>` dropdown med alle entries fra `CATCH_MASTER_DATA` der har `model !== null`
- Gruppér med `<optgroup>` efter rarity (`Almindelig`, `Sjælden`, `Legendarisk`, `Mystisk`, etc.)
- Option-tekst: `"name (id)"` f.eks. `"Torsk (fisk_torsk)"`
- Ved valg → `useEditorStore.selectFish(id)`
- En "Klonér til ny" knap der kalder `cloneFromExisting(selectedFishId)` → skifter til create-mode med kopi

**Create-mode:**
- Input-felter for ny fisk metadata:
  - `id` — text input, prefilled med `fisk_ny_`
  - `name` — text input
  - `rarity` — dropdown: `Almindelig`, `Sjælden`, `Legendarisk`, `Mystisk`, `Forhistorisk`
  - `type` — dropdown: `fish`, `special`
  - `itemType` — dropdown: `fish`, `piranha`, `frog`, `starfish`, `halibut`, etc. (alle fra `CatchItemType`)
  - `primaryAreas` — multi-select checkboxes: `pier`, `smaragd`, `tropical_island`, `abyss`, `cave`, `forbidden`, `arctic_sea`, `desert_lake`
- Arketyp-presets: knapper der sætter rimelige default-configs:
  - "Standard fisk" → `{ bodyShape: [1,1,1.2], tail: 'standard', scale: 1, speed: 1 }`
  - "Ål" → `{ bodyShape: [0.4,0.4,2.5], tail: 'eel', isEel: true, scale: 1, speed: 0.8 }`
  - "Fladfisk" → `{ bodyShape: [1.4,0.3,1.2], tail: 'flat', flat: true, scale: 0.9, speed: 0.7 }`
  - "Krabbe" → `{ bodyShape: [1.3,0.5,1.0], tail: 'none', isCrab: true, scale: 0.7, speed: 0.5 }`
  - "Blæksprutte" → `{ bodyShape: [1,1,1], tail: 'none', isOctopus: true, scale: 1, speed: 0.5 }`

---

### Sektion 2: Body Shape (`EditorBodyControls.tsx`)

- **`bodyShape[0]`** (Bredde/X) — range slider `0.1` til `3.0`, step `0.05`, vis værdi
- **`bodyShape[1]`** (Højde/Y) — range slider `0.1` til `3.0`, step `0.05`, vis værdi
- **`bodyShape[2]`** (Længde/Z) — range slider `0.1` til `3.0`, step `0.05`, vis værdi
- **`scale`** — range slider `0.1` til `3.0`, step `0.05`, vis værdi
- **`speed`** — range slider `0.1` til `5.0`, step `0.1`, vis værdi (påvirker animation)

Husk: `bodyShape` er et tuple `[number, number, number]` — opdatér hele arrayet:
```tsx
const updateBodyShape = (index: 0 | 1 | 2, value: number) => {
  const current = [...config.bodyShape] as [number, number, number];
  current[index] = value;
  updateConfig({ bodyShape: current });
};
```

---

### Sektion 3: Farve (`EditorColorControls.tsx`)

- **`color`** — color picker (`<input type="color">`) + hex-tekst + checkbox for `null` (random, bruges af frø)
- **`bellyColor`** — optional color picker med enable-checkbox
- **`emissive`** — optional color picker med enable-checkbox
- **`emissiveIntensity`** — slider `0` til `2`, step `0.05` (kun synlig når emissive er sat)

Konvertering:
```typescript
function numToHex(n: number | null): string {
  if (n === null) return '#888888';
  return '#' + (n >>> 0).toString(16).padStart(6, '0');
}
function hexToNum(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}
```

---

### Sektion 4: Hale

Dropdown for `tail` med alle `TailType` values:
`standard`, `forked`, `flat`, `eel`, `thin`, `chunky`, `star`, `none`, `shark`, `dino`, `whip`

---

### Sektion 5: Materiale

- **`metalness`** — slider `0` til `1`, step `0.01` (default `0.12`)
- **`roughness`** — slider `0` til `1`, step `0.01` (default `0.2`)

---

### Sektion 6: Creature Type

**Eksklusiv vælger** — kun ÉN creature type ad gangen, eller "Standard fisk":

| Label | Flag |
|-------|------|
| Standard fisk | *(ingen creature flags)* |
| Frø | `isFrog: true` |
| Søstjerne | `isStarfish: true` |
| Krabbe | `isCrab: true` |
| Blæksprutte | `isOctopus: true` |
| Hummer | `isLobster: true` |
| Rokke | `isRay: true` |
| Hvidhaj | `isWhiteShark: true` |
| Guldkarpe | `isGoldenCarp: true` |
| Flaske | `isBottle: true` |
| Østers | `isOyster: true` |
| Konkylie | `isConch: true` |
| Fossil | `isFossil: true` |

Implementér som radio buttons. Når creature type ændres:
1. Sæt ALLE creature flags til `false`/`undefined`
2. Sæt det valgte til `true`

---

### Sektion 7: Standard Fish Features (boolean flags)

Checkbox for HVER — kun relevante for StandardFishModel:
`flat`, `stripes`, `redFins`, `isEel`, `longBeak`, `spikes`, `uglyHead`, `isPiranha`, `finUp`, `sword`, `whiskers`, `lure`, `noEyes`, `isDino`, `isBossGorm`

---

### Sektion 8: Spots

- Checkbox: spots on/off
- Når on: radio valg mellem `spots: true` (default sort) og `spots: <number>` (custom farve med color picker)

---

### Sektion 9: Avanceret

- `maxDisplayScale` — slider `0` til `5`, step `0.1`
- `scaleCurve` — slider `0` til `5`, step `0.1`
- `openAngle` — slider `0` til `180`, step `1` (for østers)
- `hasPearl` — checkbox (for østers)
- `thinLegs` — checkbox (for krabbe)
- `isGoldenFrog` — checkbox (for frø)

---

### Sektion 10: Per-del justering (`EditorPartAdjuster.tsx`)

Denne sektion viser controls for den **aktuelt valgte kropsdel** (fra 3D-klik eller dropdown-valg).

**Dropdown** med tilgængelige kropsdele for den aktuelle fisketype:

For StandardFishModel:
`body`, `leftEye`, `rightEye`, `tail`, `dorsalFin`, `leftFin`, `rightFin`, `beak`, `jaw`, `lure`, `whiskers`

For LobsterModel:
`body`, `head`, `leftClaw`, `rightClaw`, `legs`, `eyes`

For CrabModel:
`body`, `leftClaw`, `rightClaw`, `legs`, `eyes`

*(osv. for hver creature type)*

**For den valgte del, vis 6 sliders:**
- **Position:** dX (-2 til 2, step 0.01), dY (-2 til 2, step 0.01), dZ (-2 til 2, step 0.01)
- **Skalering:** sX (0.1 til 3, step 0.05), sY (0.1 til 3, step 0.05), sZ (0.1 til 3, step 0.05)

Sliders kalder `useEditorStore.updatePartAdjustment(partName, { dx, dy, ... })`.

**"Nulstil del" knap** — sætter den valgte dels adjustment til `{}`.

---

### Sektion 11: Eksport (`EditorExport.tsx`)

#### Knap 1: "Kopiér Model Config"

Kopierer `configOverride` som en TypeScript `FishModelConfig` one-liner til clipboard:

```
{ color: 0xFF5533, bodyShape: [1.0, 0.8, 1.2], tail: 'standard', speed: 1.0, scale: 1.0, stripes: true }
```

Regler:
- `color` formateres som `0xRRGGBB` (hex number literal), IKKE string
- `color: null` skrives som `null`
- Udelad properties der er `undefined` eller `false` (for boolean flags)
- Udelad `partAdjustments` hvis den er tom `{}`
- Inkludér `partAdjustments` hvis den har indhold (formatér pænt)

#### Knap 2: "Kopiér Fuld Entry" (kun relevant med metadata)

I edit-mode: kopierer en komplet erstatningslinje for `fish.ts`:
```
{ id: 'fisk_torsk', name: 'Torsk', type: 'fish', rarity: 'Almindelig', primaryAreas: ['pier', 'arctic_sea'], requirements: { requiredRod: null, requiredBait: null }, itemType: 'fish', model: { color: 0x8B7355, bodyShape: [1,0.8,1.2], tail: 'standard', speed: 1.0, scale: 1.0 } },
```

I create-mode: kopierer en NY entry baseret på `newFishMeta`:
```
{ id: 'fisk_ny_havgus', name: 'Havgus', type: 'fish', rarity: 'Sjælden', primaryAreas: ['abyss'], requirements: { requiredRod: null, requiredBait: null }, itemType: 'fish', model: { ... } },
```

#### Knap 3: "Kopiér som JSON"

Kopierer `configOverride` som JSON (til eventuel brug udenfor TypeScript).

#### Feedback

- Vis "Kopieret!" toast i 2 sekunder efter kopiering
- Vis en diff-preview i et `<pre>` felt: venstrestil original config, højrestil ændret config, fremhæv forskelle med farve (grøn=tilføjet, rød=fjernet, gul=ændret)

---

### Knapper

- **"Nulstil"** — gendanner original config (edit) eller default config (create)
- **"Luk" / X-knap** — lukker editoren
- **"Skift mode"** — toggle mellem edit/create

---

## DEL 6: Ændringer i `src/App.tsx`

### Import (bag DEV-check)

```tsx
import { useEffect } from 'react';
// ... eksisterende imports ...

// DEV-only: lazy import af editor
const FishEditorPanel = import.meta.env.DEV
  ? require('./components/editor/FishEditorPanel.js').FishEditorPanel
  : null;
```

**Alternativt** (hvis ESM-only): brug en simpel conditional component:
```tsx
import { FishEditorPanel } from './components/editor/FishEditorPanel.js';
```
Og i JSX:
```tsx
{import.meta.env.DEV && <FishEditorPanel />}
```

### Keyboard listener

I `App()` funktionen (efter `useWeatherEngine()`):

```tsx
useEffect(() => {
  if (!import.meta.env.DEV) return;
  const handler = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'E') {
      e.preventDefault();
      // Dynamic import to keep editor fully tree-shakeable
      import('./store/useEditorStore.js').then(({ useEditorStore }) => {
        useEditorStore.getState().toggle();
      });
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []);
```

### Mount i JSX

I return-blokken for `hasStarted`-grenen, efter `<ModalLayer />`:

```tsx
<ModalLayer />
{import.meta.env.DEV && <FishEditorPanel />}
<Toast />
```

---

## DEL 7: Ændringer i `src/three/Experience.tsx`

### Import

```tsx
import { EditorFishPreview } from './editor/EditorFishPreview.js';
import { useEditorStore } from '../store/useEditorStore.js';
```

### Conditional rendering

```tsx
export function Experience() {
  const rodTipRef = useRef<Object3D>(null);
  const lineAttachRef = useRef<Object3D>(null);
  const locationId = useGameStore((s) => s.currentLocation);
  const isCabin = locationId === 'fishing_cabin';
  const editorOpen = import.meta.env.DEV ? useEditorStore((s) => s.isOpen) : false;

  return (
    <>
      {/* Editor preview — vises KUN i dev-mode når editor er åben */}
      {editorOpen && <EditorFishPreview />}

      {/* Normal scene — skjules helt når editor er åben */}
      {!editorOpen && (
        <>
          <CameraRig />
          <SceneEnvironment />
          {/* ... ALT eksisterende scene-indhold, uændret ... */}
          <SkyClouds />
          <GameEffects />
          <WaterSplashParticles />
          <WaterSurface />
          <NightSky />
          <WeatherParticles />
          <AmbientLife />
          <AmbientKraken />
          <SoeuhyreAmbient />
          <CatchModelPreloader />
          <LocationScenery />
          <PierMoleInteractives />
          {!isCabin ? (
            <>
              <CaveFillLights />
              <PierLantern />
              <Bucket />
              <BucketCatchFish />
              <SceneFishingRod tipRef={rodTipRef} />
              <Bobber lineAttachmentRef={lineAttachRef} />
              <FishingLine rodTipRef={rodTipRef} lineEndRef={lineAttachRef} />
            </>
          ) : null}
          <FishPool />
          {isCabin ? <CabinFurnitureDrag /> : null}
        </>
      )}
    </>
  );
}
```

---

## DEL 8: Udvidelsesguide — Tilføj nye features senere

Systemet er designet til at være let at udvide. Nedenstående er en **inspirationskatalog** over visuelle features, organiseret i kategorier. Alle følger samme 3-trins mønster og er 100% bagudkompatible (optional fields i `FishModelConfig`).

### Opskrift: 3-trins mønster for enhver ny feature

**Trin 1 — Tilføj til `FishModelConfig` i `src/types/fish.ts`** (altid optional)
**Trin 2 — Tilføj rendering i den relevante model-komponent i `CuteFishModel.tsx`** (wrap i `<PartGroup>`)
**Trin 3 — Tilføj editor-control** i den passende `Editor*`-komponent

---

### Kategori A: Krops-mønstre & Teksturer

Procedurale mønstre tegnet på kroppens tekstur via canvas. Generatoren har 15 distinkte mønstre — her er de mest relevante for regnefisken:

| Feature | Type i FishModelConfig | Rendering | Editor UI |
|---------|----------------------|-----------|-----------|
| `bodyPattern` | `'solid' \| 'stripes' \| 'hstripes' \| 'waves' \| 'spots' \| 'koi' \| 'trout' \| 'scales' \| 'marble' \| 'labyrinth' \| 'leopard' \| 'net' \| 'neon' \| 'bicolor' \| 'ocellus'` | Procedural canvas-tegnet tekstur på body-materialet. `stripes` = vertikale zebrastreger, `hstripes` = horisontale (tuna), `waves` = bølget tiger/makrel, `koi` = store pletter/patches, `trout` = fregner, `scales` = overlappende skæl-buer, `marble` = radial gradient blobs, `labyrinth` = organiske snoede linjer, `leopard` = ringformede rosetter, `net` = diamant-gitter, `neon` = glødende enkelt sinuskurve, `bicolor` = todelt, `ocellus` = bullseye-øjeplet | Dropdown + color picker for mønsterfarve + slider for `patternDensity` (0.3–4.0) |
| `patternColor` | `number` (hex) | Farven mønstret tegnes med oven på body-gradient | Color picker |
| `patternDensity` | `number` (0.3–4.0, default 1.0) | Skalerer mønsterets tæthed/størrelse — lavere = færre/større, højere = flere/tættere | Slider |
| `finPattern` | Samme enum som `bodyPattern` (subset) | Separat procedural tekstur KUN på finner — tillader f.eks. stribet krop med prikkede finner | Dropdown + color picker for `finPatternColor` |

**Nøgle-idé:** Krop og finner har uafhængige mønstre og farver, hvilket giver ekstrem variation med få parametre.

---

### Kategori B: Glimmer & Shimmer-effekter

Metallisk glitrende overflade via bump maps og metalness-variation:

| Feature | Type i FishModelConfig | Rendering | Editor UI |
|---------|----------------------|-----------|-----------|
| `glimmer` | `{ amount: number; color: number }` | `amount` (0–1) styrer bump map med tilfældige lysrefleks-prikker + metalness op til 0.8. `color` bestemmer glimmer-prik-farve (typisk hvid/guld/sølv). Bump map genereres proceduralt med tilfældige forøgede pixels | Slider (amount) + color picker |
| `finGlimmer` | `{ amount: number; color: number }` | Samme som body-glimmer, men kun på finner — tillader glinsende gennemsigtige finner med shimmer | Slider + color picker |

**Nøgle-idé:** Glimmer adskiller sig fra emissive ved at være reflektionsbaseret (bumps + metalness) fremfor lysudstrålende.

---

### Kategori C: Gennemsigtighed & Glas-effekt

Fysisk-baseret gennemsigtighed med refraktion via `meshPhysicalMaterial`:

| Feature | Type i FishModelConfig | Rendering | Editor UI |
|---------|----------------------|-----------|-----------|
| `bodyOpacity` | `number` (0.05–1.0, default 1.0) | `transparent: true, opacity: X, transmission: (1-X)*0.92, ior: 1.33, thickness: 0.8` — ved lave værdier fremstår fisken som glasagtig/geléagtig med realistisk lysbrydning | Slider |
| `finOpacity` | `number` (0.1–1.0, default 0.95) | Samme princip for finner: `transmission: (1-X)*0.75` — tillader halvgennemsigtige, ætheriske finner som på guldfisk-slør eller vandmænd | Slider |

**Nøgle-idé:** Lav `bodyOpacity` (0.3) + høj `finOpacity` (0.9) = glasagtig krop med synlige finner. Omvendt (1.0 body + 0.3 fin) = solide fisk med gennemsigtige flyvende finner.

---

### Kategori D: Avanceret farve-system

Gradient-baserede farver med 4 zoner i stedet for én enkelt farve:

| Feature | Type i FishModelConfig | Rendering | Editor UI |
|---------|----------------------|-----------|-----------|
| `colorGradient` | `{ back: number; mid1: number; mid2: number; belly: number }` | Linear gradient fra ryg til bug med 4 color stops (0%, 33%, 66%, 100%) tegnet på body-tekstur. Erstatter/supplerer simpel `color` | 4 color pickers i en vertikal strip |
| `useRainbow` | `boolean` | Overskriver gradient med spektral-regnbue (rød→orange→gul→grøn→cyan→blå→violet) | Checkbox |
| `chameleonMode` | `boolean` | Animeret HSL-farvecykling via `useFrame`: `bodyMaterial.color.setHSL((t * 0.05) % 1, 1, 0.6)` — langsom regnbue-animation i realtid | Checkbox |

**Nøgle-idé:** `chameleonMode` er perfekt til mystiske/magiske fisk — billig at implementere da det bare er en `useFrame`-HSL-rotation.

---

### Kategori E: Øje-tilpasning

Detaljeret kontrol over øjnenes udseende og placering:

| Feature | Type i FishModelConfig | Rendering | Editor UI |
|---------|----------------------|-----------|-----------|
| `eyeConfig.size` | `number` (0.15–0.48) | Radius på øjenboldene | Slider |
| `eyeConfig.scleraColor` | `number` (hex, default 0xffffff) | Farve på øjenbolden — hvid for standard, gul/rød for monstre | Color picker |
| `eyeConfig.pupilColor` | `number` (hex, default 0x111111) | Pupilfarve | Color picker |
| `eyeConfig.pupilShape` | `'sphere' \| 'round' \| 'vertical_slit' \| 'horizontal_slit' \| 'diamond' \| 'star' \| 'heart' \| 'crescent' \| 'cross'` | Forskellige pupilgeometrier: `vertical_slit` = katteøje (ShapeGeometry med smal vertikal ellipse), `star` = 5-takket stjerne, `heart` = hjerteform, `diamond` = rudeform, `crescent` = halvmåne, `cross` = korsformet. Alle genereret som ShapeGeometry | Dropdown |
| `eyeConfig.pupilScale` | `number` (0.2–2.5, default 1.0) | Pupilstørrelse relativt til øjet — stor = søde tegneserieøjne, lille = rovdyr | Slider |
| `eyeConfig.pupilDepth` | `number` (0.50–0.98) | Hvor "dybt" pupillen sidder i øjenbolden | Slider |
| `eyeConfig.offsetX` | `number` (-0.4–0.4) | Øjnenes sideforskydning på kroppen | Slider |
| `eyeConfig.offsetY` | `number` (-0.5–0.5) | Øjnenes vertikale forskydning | Slider |

**Nøgle-idé:** `pupilShape` alene giver massiv karakter-variation. `vertical_slit` = uhyggelig nattedyr, `star` = magisk væsen, `heart` = sjov barnlig fisk. Kombineret med `pupilScale` og `scleraColor` (f.eks. blodrødt + lille vertikal spalte = dybt-havs-rovfisk).

---

### Kategori F: Mund & Tænder

Mund skåret direkte ind i body-geometrien + procedurale tænder:

| Feature | Type i FishModelConfig | Rendering | Editor UI |
|---------|----------------------|-----------|-----------|
| `teeth` | `boolean \| { type: TeethType; count: number; size: number; color: number; zOffset: number }` | Cone-geometrier ved mundområdet. `type` vælger tandform-preset (f.eks. `'shark_double'` = dobbelt række haj-tænder, `'fangs'` = to store hjørnetænder, `'tiny'` = mange små tænder, `'tusks'` = opadvendte stødtænder). `zOffset` flytter tænderne frem/tilbage | Checkbox + dropdown (type) + sliders (count, size, offset) + color picker |
| `mouthType` | `'none' \| 'wide_shark' \| 'round_sucker' \| 'underbite' \| 'beak'` | Mund-form skåret ind i body-sfærens mesh via vertex-deformation. Hver type deformerer vertices i et defineret område af kroppens forside | Dropdown |
| `mouthOpenness` | `number` (0.3–1.8, default 1.0) | Styrker munddeformationen — højere = mere åben kæbe | Slider |
| `mouthColor` | `number` (hex, default 0x2a0000) | Mund-hullets farve via vertex colors på de deformerede faces | Color picker |

**Nøgle-idé:** Mund-systemet bruger vertex-deformation + vertex colors direkte på body-geometrien (ikke separate meshes), hvilket holder polygon-count lavt men giver flot resultat.

---

### Kategori G: Fin-varianter (dorsal, hale, sidefinner)

Bred vifte af fin-typer og hale-former genereret som ExtrudeGeometry fra 2D-shapes:

| Feature | Type i FishModelConfig | Rendering | Editor UI |
|---------|----------------------|-----------|-----------|
| `dorsalFinType` | `'standard' \| 'shark' \| 'spiked' \| 'double' \| 'mohawk' \| 'crown' \| 'tentacles'` | Dorsal fin genereret fra en 2D Shape → ExtrudeGeometry. `spiked` = zik-zak takket, `double` = to separate spidser, `mohawk` = aggressiv kam, `crown` = kongelig bølgeform, `tentacles` = organiske krøllede tentakel-former | Dropdown |
| `dorsalFinEmbed` | `number` (0–0.35) | Sænker dorsal finnen ned i kroppen — effekten af at finnen "gror" ud af ryggen fremfor at sidde ovenpå | Slider |
| `tailType` (udvidet) | Eksisterende `TailType` + `'veil' \| 'lyre' \| 'scalloped' \| 'paddle' \| 'ribbon' \| 'heart' \| 'sail' \| 'kraken'` | `veil` = lang flydende slørfin (tyndt extruderet), `lyre` = dobbelt-buet lyra-form, `scalloped` = muslingeskal-takket, `paddle` = rund paddelformet, `ribbon` = ultra-lang tynd båndhale, `heart` = hjerteformet, `sail` = kæmpestort sejl, `kraken` = 5 buede tentakler som én samlet shape | Dropdown |
| `tailScale` | `number` (0.6–1.9, default 1.0) | Proportionel skalering af hele hale-finnen | Slider |
| `sideFinScale` | `number` (0.6–1.9, default 1.0) | Størrelse af side/pectoral finner | Slider |
| `showPelvicFins` | `boolean` | Ekstra par bughfinner (pelvic fins) placeret under kroppen | Checkbox + slider for `pelvicFinScale` |
| `finColor` | `number` (hex) | Separat farve for alle finner, uafhængig af kropsfarve | Color picker |

**Nøgle-idé:** `kraken`-hale genereres ved at tegne 5 bezier-tentakler med varierende curl og længde som én samlet ExtrudeGeometry — visuelt komplekst men geometrisk simpelt. `ribbon`-hale bruger tyndere extrude for æterisk effekt.

---

### Kategori H: Svømme-animation & Bevægelsesmønstre

Forskellige animationsmodi styret via `useFrame`:

| Feature | Type i FishModelConfig | Rendering | Editor UI |
|---------|----------------------|-----------|-----------|
| `swimPattern` | `'standard' \| 'eel' \| 'dolphin' \| 'dart' \| 'glide' \| 'paddle'` | `standard` = hale-swing sidelæns (sinus). `eel` = hele kroppens vertices undulerer i X-aksen (`sin(t*freq + z*3.5) * 0.15` per vertex z-position), simulerer ål-slange-bevægelse. `dolphin` = samme undulation men i Y-aksen (op/ned som hval/delfin). `dart` = hurtige bursts med pauser. `glide` = langsom svæv med minimal bevægelse. `paddle` = halefinne drejet 90° og flapper op/ned (rokke/fugl-stil) | Dropdown |
| `tailSwing` | `number` (0.05–0.8, default 0.33) | Amplitude af haleslag — lille = forsigtig/elegant, stor = aggressiv/hurtig | Slider |
| `finPaddleMode` | `'normal' \| 'paddle'` | Halefinnens bevægelsesmåde: `normal` = sidelæns vip, `paddle` = finne roteret 90° og flapper vertikalt (rokke-stil) | Radio buttons |

**Nøgle-idé:** `eel`-mode deformerer body-geometrien per-vertex i `useFrame` — kræver at `originalPos` gemmes som reference. Vertex `z`-position bruges som faseforskydning, så bølgen propagerer fra hoved til hale naturligt.

---

### Kategori I: Extreme mutationer & Magiske effekter

Visuelle specialeffekter til sjældne/legendariske fisk:

| Feature | Type i FishModelConfig | Rendering | Editor UI |
|---------|----------------------|-----------|-----------|
| `bioluminescent` | `{ enabled: boolean; color: number; intensity: number }` | Emissive side-linje via procedurel emissiveMap (canvas: lysende cirkel-prikker langs kroppens midterlinje). Pulserer via `useFrame`: `emissiveIntensity = intensity * (0.5 + sin(t*4) * 0.5)`. Farve typisk neongrøn (0x00ffcc), cyan eller lilla | Checkbox + color picker + intensity-slider (0–3) |
| `electricSparks` | `boolean` | Partikel-effekt med orbiting gnister (PointsMaterial + AdditiveBlending, ~24 punkter der kredser om kroppen) + hvide kerne-gnister (40% af spark count, mindre/lysere). Animation: gnister bevæger sig i spherical coordinates med individuel hastighed og fase. `sparkPoints.material.opacity` pulser med `sin(t*30)` for flimren | Checkbox |
| `electricBolts` | `boolean` | Lightning bolt-linjer (6–10 stk) fra kroppens overflade udad. Jagged zigzag-punkter genereret med retning udad + tilfældig lateral offset (±0.35). Bolts regenereres hvert ~80ms med tilfældig synlighed (35% chance for at være slukket) = kaotisk flimmer. Hvid kerne-bolt oveni cyan-bolt for dybde | Checkbox (typisk kombineret med `electricSparks`) |
| `pufferInflation` | `{ puff: number; spikeDensity: number }` | `puff` (0–1) skalerer body X/Y med `1 + puff * 0.82`. Pigge via InstancedMesh (ConeGeometry, ~180 stk) jævnt fordelt på sfæren via Fibonacci-spiral. Piggenes scale animeres med `puff`: `scale = puff * 1.65` (usynlige ved puff=0). Piggenes positioner deformeres til at matche body shape | Slider (puff) + slider (spike density 0.3–1.5) |

**Nøgle-idé:** Elektricitets-effekten kombinerer 3 lag: (1) cyan gnister der orbiter, (2) hvide kerne-punkter, (3) zigzag-lyn-linjer. Tilsammen med emissive body-glow (`emissiveIntensity` pulser med `sin(t*25)`) giver det en overbevisende elektrisk fisk. Alt bruger AdditiveBlending og `depthWrite: false` så det glør korrekt.

---

### Kategori J: Overflademateriale & Shading

| Feature | Type i FishModelConfig | Rendering | Editor UI |
|---------|----------------------|-----------|-----------|
| `shadingStyle` | `'smooth' \| 'lowpoly'` | `flatShading: true/false` på body + fin materialer. Low-poly giver charmerende facetteret look | Radio buttons |
| `normalMapPattern` | `boolean` (default true) | Genererer normal map fra mønster-kanvasen → 3D-dybde i teksturens mønster (striber føles hævede, skæl har kant-relief). Beregnes via Sobel-lignende kernel over mønster-billedet | Checkbox |
| `bodyMetalness` | `number` (0–1) | Udover shimmer — fuld kontrol over metallic-look. Kombination med lav roughness → spejlblank robotfisk | Slider |
| `bodyRoughness` | `number` (0–1) | Overfladens ruhed — lav = våd/glinsende, høj = tør/mat | Slider |

---

### Komplet overblik — feature-katalog samlet

| # | Feature | Type | Rendering (kort) | Editor |
|---|---------|------|-------------------|--------|
| 1 | `bodyPattern` | enum (15 typer) | Procedural canvas-tekstur | Dropdown |
| 2 | `patternColor` | hex | Mønsterfarve | Color picker |
| 3 | `patternDensity` | number | Mønster-skalering | Slider |
| 4 | `finPattern` | enum (subset) | Separat fin-tekstur | Dropdown |
| 5 | `glimmer` | { amount, color } | Bump map + metalness shimmer | Slider + picker |
| 6 | `finGlimmer` | { amount, color } | Fin-specifik shimmer | Slider + picker |
| 7 | `bodyOpacity` | number | Glas-transmission | Slider |
| 8 | `finOpacity` | number | Fin-gennemsigtighed | Slider |
| 9 | `colorGradient` | { back, mid1, mid2, belly } | 4-zone gradient | 4 color pickers |
| 10 | `useRainbow` | boolean | Spektral-regnbue | Checkbox |
| 11 | `chameleonMode` | boolean | HSL-cykling useFrame | Checkbox |
| 12 | `eyeConfig` | objekt (9 felter) | Custom øjne + pupilformer | Sektion med sliders |
| 13 | `teeth` | boolean/objekt | Cone-geometri tænder | Checkbox + sliders |
| 14 | `mouthType` | enum | Vertex-deformation mund | Dropdown |
| 15 | `dorsalFinType` | enum (7 typer) | ExtrudeGeometry-baseret | Dropdown |
| 16 | `dorsalFinEmbed` | number | Fin sænkes i krop | Slider |
| 17 | `tailType` (udvidet) | enum (+8 nye) | Nye hale-shapes | Dropdown |
| 18 | `showPelvicFins` | boolean + scale | Ekstra fin-par under bug | Checkbox + slider |
| 19 | `finColor` | hex | Separat fin-farve | Color picker |
| 20 | `swimPattern` | enum (6 typer) | Forskellige useFrame-anim | Dropdown |
| 21 | `tailSwing` | number | Haleslag-amplitude | Slider |
| 22 | `bioluminescent` | objekt | Emissive puls-glow | Checkbox + sliders |
| 23 | `electricSparks` | boolean | Orbiting gnist-partikler | Checkbox |
| 24 | `electricBolts` | boolean | Lightning-lyn linjer | Checkbox |
| 25 | `pufferInflation` | objekt | Oppustning + InstancedMesh pigge | 2 sliders |
| 26 | `shadingStyle` | enum | flatShading toggle | Radio |
| 27 | `normalMapPattern` | boolean | 3D-relief i tekstur | Checkbox |

Alle nye fields er optional i `FishModelConfig` → 100% bagudkompatibel. Prioritér implementering efter visuel impact-per-kompleksitet — `bodyPattern`, `pupilShape`, `chameleonMode` og `bioluminescent` giver mest wow for færrest linjer kode.

---

## DEL 9: Isolerings- og fjernelsesguide

### Hvorfor editoren er isoleret:

1. **Dedikerede mapper:** `src/components/editor/`, `src/three/editor/`, `src/store/useEditorStore.ts`
2. **DEV-gating:** Alle imports og mounts bag `import.meta.env.DEV` — fjernes automatisk i production build
3. **Optional props:** `editorMode`, `selectedPart`, `onPartClick` i `CuteFishModel` er optional — ingen effekt i production
4. **Optional type-felt:** `partAdjustments` i `FishModelConfig` er optional — eksisterende fisk upåvirkede

### Komplet fjernelse (5 min):

1. Slet mapper:
   ```
   src/components/editor/
   src/three/editor/
   src/store/useEditorStore.ts
   ```

2. I `src/App.tsx`: Fjern import af `FishEditorPanel` og `{import.meta.env.DEV && <FishEditorPanel />}` linjen

3. I `src/three/Experience.tsx`: Fjern import af `EditorFishPreview` og `useEditorStore`, fjern `editorOpen` variabel, fjern `{editorOpen && <EditorFishPreview />}`, fjern `{!editorOpen &&` wrapperen (behold scene-indholdet)

4. **Optional cleanup** (kan beholdes uden effekt):
   - `editorMode`/`selectedPart`/`onPartClick` props i CuteFishModel (harmløs — aldrig kaldt)
   - `partAdjustments` i FishModelConfig (harmløs — aldrig sat)
   - `PartGroup` helper (harmløs — ren pass-through med defaults)

---

## UI/UX krav

- **Alle labels på dansk** (Bredde, Højde, Længde, Hale, Farve, Hastighed, Skala, etc.)
- **Dark theme** — `bg-gray-900/90` med `text-white`, Tailwind utility classes
- **Kompakt layout** — `text-xs` / `text-sm`, `gap-1`, `py-1`
- **Scrollbar** — `overflow-y-auto` på panelet
- **Sammenklappelig** — `<details>/<summary>` for hver sektion (default `open` for de vigtigste)
- **Real-time** — alle ændringer reflekteres STRAKS i 3D-preview
- **Diff-indikator** — i edit-mode, vis en farveprik ved ændrede felter (sammenlign med `originalConfig`)
- **Responsive sliders** — `<input type="range">` med `className="w-full accent-blue-500"`
- **Tooltips** — titel-attributter på alle labels med kort forklaring
- **Tastatur:** `Ctrl+Shift+E` toggler, `Escape` lukker
- **Ingen påvirkning af gameplay** — editor ændrer KUN det visuelle preview

---

## VIGTIGE BEGRÆNSNINGER (gentages for klarhed)

1. **BRUG `CuteFishModel` DIREKTE** fra `src/three/models/CuteFishModel.tsx` — ALDRIG genimplentér renderingslogik
2. `@react-three/drei` er allerede installeret (v10.7.7) — brug `OrbitControls`, `Grid`, `TransformControls` derfra
3. **`structuredClone`** til config-kopiering — undgå reference-deling
4. **Production-safe** — al editor-kode bag `import.meta.env.DEV`
5. **Bagudkompatibel** — nye optional props/fields har INGEN effekt på eksisterende kode
