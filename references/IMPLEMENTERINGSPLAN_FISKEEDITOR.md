# Implementeringsplan: Fiskeeditor UI-reorganisering, Lås-system & Tilfældig-generator

## Vigtig overordnet regel

**FULD KOMPATIBILITET MED SPILLET SKAL OPRETHOLDES.** Al output fra fisk-editoren (eksport-funktionen) skal generere nøjagtigt samme TypeScript-literal og JSON som før. Ingen felter i `FishModelConfig` må omdøbes, fjernes eller ændre semantik. Alt arbejde foregår udelukkende i editor-UI-laget (`src/components/editor/`) og editor-store (`src/store/useEditorStore.ts`). Spil-koden (`src/three/`, `src/data/`, `src/types/`) røres IKKE i trin 1–3.

---

## Filoversigt — hvad ændres

```
src/
├── store/
│   └── useEditorStore.ts              ← ÆNDRES (lås-state, randomize, mutationDegree)
├── components/editor/
│   ├── FishEditorPanel.tsx            ← ÆNDRES MARKANT (ny sektionsrækkefølge, layout)
│   ├── EditorFishSelector.tsx         ← ÆNDRES (nested fold for områder)
│   ├── EditorBodyControls.tsx         ← ÆNDRES (split i primær + avanceret fold)
│   ├── EditorColorControls.tsx        ← ÆNDRES (nested folds for gradient, opacity, emissive)
│   ├── EditorFinControls.tsx          ← ÆNDRES (split i Finner + Hale som to eksport-komponenter)
│   ├── EditorEyeControls.tsx          ← UÆNDRET (indhold bevares, kun wrapping i panel ændres)
│   ├── EditorPatternControls.tsx      ← UÆNDRET (indhold bevares)
│   ├── EditorMouthControls.tsx        ← UÆNDRET (indhold bevares)
│   ├── EditorExtremeControls.tsx      ← UÆNDRET (indhold bevares)
│   ├── EditorPartAdjuster.tsx         ← UÆNDRET (bevares fuldt med alle dele inkl. dorsalFin/tail)
│   ├── EditorExport.tsx               ← UÆNDRET
│   ├── editorConstants.ts             ← ÆNDRES (tilføj RANDOMIZE_RANGES)
│   ├── LockToggle.tsx                 ← NY FIL
│   └── EditorRandomizeBar.tsx         ← NY FIL
└── three/
    └── models/
        └── CuteFishModel.tsx          ← ÆNDRES KUN I TRIN 4 (rygfinne-skalering)
```

---

## Trin 1: UI-reorganisering af FishEditorPanel

### 1.1 Ændr sektionsrækkefølge og default-tilstand i `FishEditorPanel.tsx`

Erstat den nuværende `<div className="flex flex-col gap-1 p-2">` blok (linje 100–195) med ny struktur. Alle sektioner bruger fortsat `<details>` med `<summary>`, men de fleste starter **lukket** (uden `open`-attributten).

**Ny rækkefølge og åben/lukket-status:**

```tsx
<div className="flex flex-col gap-1 p-2">
  {/* 1. IDENTITET — altid åben */}
  <details open className="rounded border border-gray-700/80 p-2">
    <summary className="cursor-pointer text-sm font-medium text-gray-200">
      Fisk &amp; tilstand
    </summary>
    <EditorFishSelector />
  </details>

  {/* 2. FORM & KROP — åben som default */}
  <details open className="rounded border border-gray-700/80 p-2">
    <summary className="cursor-pointer text-sm font-medium text-gray-200">
      Form &amp; krop
    </summary>
    <EditorBodyControls />
  </details>

  {/* 3. FARVER — åben som default */}
  <details open className="rounded border border-gray-700/80 p-2">
    <summary className="cursor-pointer text-sm font-medium text-gray-200">
      Farver
    </summary>
    <EditorColorControls />
  </details>

  {/* 4. FINNER — LUKKET som default */}
  <details className="rounded border border-gray-700/80 p-2">
    <summary className="cursor-pointer text-sm font-medium text-gray-200">
      Finner
    </summary>
    <EditorFinControls mode="fins" />
  </details>

  {/* 5. HALE — LUKKET som default */}
  <details className="rounded border border-gray-700/80 p-2">
    <summary className="cursor-pointer text-sm font-medium text-gray-200">
      Hale &amp; animation
    </summary>
    <EditorFinControls mode="tail" />
  </details>

  {/* 6. ØJNE — LUKKET, INGEN DEV-gate i create-mode */}
  {(mode === 'create' || import.meta.env.DEV) && (
    <details className="rounded border border-gray-700/80 p-2">
      <summary className="cursor-pointer text-sm font-medium text-gray-200">
        Øjne
      </summary>
      <EditorEyeControls />
    </details>
  )}

  {/* 7. MUND & TÆNDER — LUKKET */}
  {(mode === 'create' || import.meta.env.DEV) && (
    <details className="rounded border border-gray-700/80 p-2">
      <summary className="cursor-pointer text-sm font-medium text-gray-200">
        Mund &amp; tænder
      </summary>
      <EditorMouthControls />
    </details>
  )}

  {/* 8. MØNSTER — LUKKET */}
  {(mode === 'create' || import.meta.env.DEV) && (
    <details className="rounded border border-gray-700/80 p-2">
      <summary className="cursor-pointer text-sm font-medium text-gray-200">
        Mønster
      </summary>
      <EditorPatternControls />
    </details>
  )}

  {/* 9. SPECIAL-EFFEKTER — LUKKET */}
  {(mode === 'create' || import.meta.env.DEV) && (
    <details className="rounded border border-gray-700/80 p-2">
      <summary className="cursor-pointer text-sm font-medium text-gray-200">
        Special-effekter
      </summary>
      <EditorExtremeControls />
    </details>
  )}

  {/* 10. PER-DEL JUSTERING — LUKKET, bevares fuldt */}
  <details className="rounded border border-gray-700/80 p-2">
    <summary className="cursor-pointer text-sm font-medium text-gray-200">
      Per-del justering
    </summary>
    <EditorPartAdjuster />
  </details>

  {/* 11. EKSPORT — åben */}
  <details open className="rounded border border-gray-700/80 p-2">
    <summary className="cursor-pointer text-sm font-medium text-gray-200">
      Eksport
    </summary>
    <EditorExport />
  </details>
</div>
```

**Bemærk:**
- `mode` er allerede tilgængelig i `FishEditorPanel` (linje 18).
- DEV-gating ændres fra `import.meta.env.DEV &&` til `(mode === 'create' || import.meta.env.DEV) &&` — dvs. i create-mode vises alt, i edit-mode kun i DEV.
- `EditorPartAdjuster` bevares fuldstændig uændret med alle dele inkl. dorsalFin og tail.
- `EditorFinControls` skal opdeles til at acceptere en `mode`-prop (se 1.3).

### 1.2 Nested folds i EditorFishSelector.tsx

I create-mode-sektionen (linje 102–181), wrap `<fieldset>` med områder i en nested `<details>`:

**Find** (linje 165–179):
```tsx
<fieldset className="border border-gray-700 p-1">
  <legend className="px-1 text-xs text-gray-400">Områder (primaryAreas)</legend>
  ...
</fieldset>
```

**Erstat med:**
```tsx
<details className="rounded border border-gray-700/60">
  <summary className="cursor-pointer px-1 py-0.5 text-xs text-gray-400">
    ▸ Områder (primaryAreas)
  </summary>
  <div className="flex flex-col gap-0.5 p-1">
    {PRIMARY_AREA_OPTIONS.map(({ id, label }) => (
      <label key={id} className="flex cursor-pointer items-center gap-1 text-xs">
        <input
          type="checkbox"
          checked={newFishMeta.primaryAreas.includes(id)}
          onChange={() => toggleArea(id)}
        />
        {label}
      </label>
    ))}
  </div>
</details>
```

### 1.3 Split EditorFinControls i to modes

`EditorFinControls.tsx` indeholder i dag BÅDE finner OG hale. Tilføj en `mode`-prop der styrer hvilken del der vises:

**Tilføj prop til komponenten:**
```tsx
export function EditorFinControls({ mode: displayMode = 'all' }: { mode?: 'fins' | 'tail' | 'all' }) {
```

**Wrap fin-sektionen** (rygfinne-type, rygfinne-dybde, rygfinne-finjustering, sidefinner, bughfinner, fin-farve) i:
```tsx
{(displayMode === 'fins' || displayMode === 'all') && (
  <>
    {/* ... al fin-kode ... */}
  </>
)}
```

**Wrap hale-sektionen** (hale-skala, hale-animation, hale-finjustering) i:
```tsx
{(displayMode === 'tail' || displayMode === 'all') && (
  <>
    {/* ... al hale-kode ... */}
  </>
)}
```

**Specifikt hvad der hører til "fins" vs "tail":**

**Finner (`mode="fins"`)** — disse dele af den nuværende kode:
- Rygfinne-type dropdown (linje 67–87)
- Rygfinne dybde-slider (linje 95–103)
- Rygfinne ved kroppen / finjustering (linje 105–184) — position/rotation-sliders
- Sidefinner-skala slider (linje 316–324)
- Sidevejs-finner checkbox (linje 326–363)
- Vis bughfinner checkbox + skala (linje 365–390)
- Separat fin-farve (linje 392–423)

**Hale (`mode="tail"`)** — disse dele:
- Hale-skala slider (linje 186–194)
- Animation-sektion (linje 196–242): hale-sving, halefinnens bevægelse, svømmehastighed
- Hale ved kroppen / finjustering (linje 244–313) — position/rotation-sliders

### 1.4 Nested folds i EditorBodyControls.tsx

I `EditorBodyControls.tsx`, flyt de avancerede kontroller bag en nested fold:

**Primære kontroller (altid synlige):**
- Bredde (bodyShape[0])
- Højde (bodyShape[1])
- Længde (bodyShape[2])
- Skala
- Haleform dropdown
- Kropsfacon dropdown

**Bag nested `<details>` ("▸ Avanceret krop"):**
- Hastighed (speed)
- Normaler dropdown (bodyShadingStyle)
- Clearcoat slider
- Clearcoat ruhed slider
- Krop-segmenter (DEV)

**Implementering:** Tilføj efter Kropsfacon-dropdown (efter linje 132):
```tsx
<details className="mt-1 rounded border border-gray-600/50">
  <summary className="cursor-pointer px-1 py-0.5 text-[11px] text-gray-400">
    ▸ Avanceret krop
  </summary>
  <div className="flex flex-col gap-2 p-1">
    {/* Hastighed-slider flyttes hertil */}
    {/* Normaler dropdown flyttes hertil */}
    {/* Clearcoat slider flyttes hertil */}
    {/* Clearcoat ruhed slider flyttes hertil */}
    {/* Krop-segmenter (DEV) flyttes hertil */}
  </div>
</details>
```

### 1.5 Nested folds i EditorColorControls.tsx

**Primære kontroller (altid synlige):**
- Hovedfarve (color) med picker og null-checkbox

**Bag nested folds:**
- `▸ Gradient & farvespil` (lukket): 4-zone gradient, regnbue, kamæleon, bug/ryg halvkugler
- `▸ Gennemsigtighed` (lukket): krop-opacity, fin-opacity
- `▸ Emissive / glød` (lukket): on/off + farve + intensitet

**Implementering:** Wrap de tre sektioner der allerede er adskilt af `border-t` i `<details>`-elementer:

```tsx
{/* Gradient-sektionen (nuværende linje 76-257) */}
<details className="mt-1 rounded border border-gray-600/50">
  <summary className="cursor-pointer px-1 py-0.5 text-[11px] text-gray-400">
    ▸ Gradient &amp; farvespil
  </summary>
  <div className="flex flex-col gap-2 p-1">
    {/* Hele gradient + rainbow + chameleon + hemi-tint blokken */}
  </div>
</details>

{/* Gennemsigtighed-sektionen (nuværende linje 260-294) */}
<details className="mt-1 rounded border border-gray-600/50">
  <summary className="cursor-pointer px-1 py-0.5 text-[11px] text-gray-400">
    ▸ Gennemsigtighed
  </summary>
  <div className="flex flex-col gap-2 p-1">
    {/* bodyOpacity + finOpacity sliders */}
  </div>
</details>

{/* Emissive-sektionen (nuværende linje 296-337) */}
<details className="mt-1 rounded border border-gray-600/50">
  <summary className="cursor-pointer px-1 py-0.5 text-[11px] text-gray-400">
    ▸ Emissive (glød)
  </summary>
  <div className="flex flex-col gap-2 p-1">
    {/* emissive checkbox + farve + intensitet */}
  </div>
</details>
```

### 1.6 Nested folds i fin-sektionen af EditorFinControls

Inden for `mode="fins"`-delen, skjul rygfinne-finjustering bag en fold:

```tsx
{standardFish && hasDorsalFin && (
  <details className="mt-1 rounded border border-gray-600/50">
    <summary className="cursor-pointer px-1 py-0.5 text-[11px] text-gray-400">
      ▸ Rygfinne finjustering (position/rotation)
    </summary>
    <div className="flex flex-col gap-2 p-1">
      {/* De eksisterende dX, dY, dZ + rX, rY, rZ sliders + markér/nulstil knapper */}
    </div>
  </details>
)}
```

Tilsvarende i `mode="tail"`-delen for hale-finjustering:

```tsx
{standardFish && hasTailMesh && (
  <details className="mt-1 rounded border border-gray-600/50">
    <summary className="cursor-pointer px-1 py-0.5 text-[11px] text-gray-400">
      ▸ Hale finjustering (position/rotation)
    </summary>
    <div className="flex flex-col gap-2 p-1">
      {/* De eksisterende hale dX, dY, dZ + rX, rY, rZ + markér/nulstil */}
    </div>
  </details>
)}
```

---

## Trin 2: Lås-system

### 2.1 Opret `LockToggle.tsx`

Ny fil: `src/components/editor/LockToggle.tsx`

```tsx
import { useEditorStore } from '../../store/useEditorStore.js';

/**
 * Lille lås-knap til at beskytte en parameter mod tilfældig-funktionen.
 * Bruges ved siden af sliders, dropdowns og andre kontroller.
 */
export function LockToggle({ paramKey }: { paramKey: string }) {
  const locked = useEditorStore((s) => s.lockedParams.has(paramKey));
  const toggleLock = useEditorStore((s) => s.toggleLock);

  return (
    <button
      type="button"
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] transition-colors ${
        locked
          ? 'bg-amber-900/60 text-amber-300 hover:bg-amber-800/70'
          : 'bg-gray-800 text-gray-600 hover:text-gray-400'
      }`}
      onClick={() => toggleLock(paramKey)}
      title={locked ? `Låst — "${paramKey}" beskyttes ved tilfældig` : `Ulåst — "${paramKey}" kan ændres ved tilfældig`}
    >
      {locked ? '🔒' : '🔓'}
    </button>
  );
}

/**
 * Lås-knap til en hel sektion. Toggler alle parametre i sektionen.
 * Bruges i <summary>-linjen på en <details>-sektion.
 */
export function SectionLockToggle({
  paramKeys,
  className = '',
}: {
  paramKeys: string[];
  className?: string;
}) {
  const lockedParams = useEditorStore((s) => s.lockedParams);
  const toggleLock = useEditorStore((s) => s.toggleLock);

  const allLocked = paramKeys.every((k) => lockedParams.has(k));

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Forhindrer at <details> toggler
    e.stopPropagation();
    for (const key of paramKeys) {
      const isLocked = lockedParams.has(key);
      if (allLocked && isLocked) {
        toggleLock(key); // Unlock alle
      } else if (!allLocked && !isLocked) {
        toggleLock(key); // Lock de resterende
      }
    }
  };

  return (
    <button
      type="button"
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] transition-colors ${
        allLocked
          ? 'bg-amber-900/60 text-amber-300 hover:bg-amber-800/70'
          : 'bg-gray-800 text-gray-600 hover:text-gray-400'
      } ${className}`}
      onClick={handleClick}
      title={allLocked ? 'Alle parametre i sektionen er låst' : 'Lås/lås op for alle parametre i sektionen'}
    >
      {allLocked ? '🔒' : '🔓'}
    </button>
  );
}
```

### 2.2 Udvid `useEditorStore.ts`

Tilføj nye felter til `EditorState` interface:

```typescript
interface EditorState {
  // ... eksisterende felter ...

  /** Sæt af låste parameter-nøgler — beskyttes mod randomize */
  lockedParams: Set<string>;
  toggleLock: (paramKey: string) => void;
  lockAll: () => void;
  unlockAll: () => void;
}
```

Tilføj implementeringer i `create<EditorState>(...)`:

```typescript
lockedParams: new Set<string>(),

toggleLock: (paramKey) =>
  set((s) => {
    const next = new Set(s.lockedParams);
    if (next.has(paramKey)) next.delete(paramKey);
    else next.add(paramKey);
    return { lockedParams: next };
  }),

lockAll: () =>
  set({ lockedParams: new Set(ALL_LOCKABLE_PARAM_KEYS) }),

unlockAll: () =>
  set({ lockedParams: new Set() }),
```

### 2.3 Definér alle lås-nøgler i `editorConstants.ts`

Tilføj i bunden af `editorConstants.ts`:

```typescript
/**
 * Alle parameter-nøgler der kan låses i editoren.
 * Matches felterne i FishModelConfig + sub-felter for bodyShape.
 * Bruges af lås-systemet og tilfældig-generatoren.
 */
export const ALL_LOCKABLE_PARAM_KEYS: readonly string[] = [
  // Krop
  'bodyShape.0',
  'bodyShape.1',
  'bodyShape.2',
  'scale',
  'speed',
  'tail',
  'bodyProfile',
  'bodyShadingStyle',
  'bodyClearcoat',
  'bodyClearcoatRoughness',
  // Farver
  'color',
  'colorGradient',
  'useRainbow',
  'chameleonMode',
  'bodyHemisphereTint',
  'bodyOpacity',
  'finOpacity',
  'emissive',
  // Finner
  'dorsalFinType',
  'dorsalFinEmbed',
  'sideFinScale',
  'sideFinPlacement',
  'showPelvicFins',
  'pelvicFinScale',
  'finColor',
  // Hale
  'tailScale',
  'tailSwingAmplitude',
  'tailFinMovement',
  // Øjne
  'eyeConfig',
  // Mund
  'teeth',
  'mouthType',
  // Mønster
  'bodyPattern',
  'patternColor',
  'patternDensity',
  // Special
  'bioluminescent',
  'electricSparks',
  'electricBolts',
  'pufferInflation',
] as const;
```

### 2.4 Tilføj LockToggle til kontroller

For HVER slider, dropdown og checkbox i editor-komponenterne, tilføj en `<LockToggle>` ved siden af. Eksempel for en slider i `EditorBodyControls.tsx`:

**Nuværende:**
```tsx
<SliderRow
  label="Bredde (bodyShape[0])"
  ...
/>
```

**Nyt — wrap i flex-row med LockToggle:**
```tsx
<div className="flex items-start gap-1">
  <div className="flex-1">
    <SliderRow
      label="Bredde (bodyShape[0])"
      ...
    />
  </div>
  <LockToggle paramKey="bodyShape.0" />
</div>
```

Gør dette systematisk for alle kontroller. Brug paramKey-navnene fra `ALL_LOCKABLE_PARAM_KEYS`.

For dropdowns og checkboxes, wrap tilsvarende:
```tsx
<div className="flex items-center gap-1">
  <label className="flex-1 ...">
    {/* dropdown/checkbox indhold */}
  </label>
  <LockToggle paramKey="tail" />
</div>
```

### 2.5 Tilføj SectionLockToggle i `<summary>` linjer

I `FishEditorPanel.tsx`, tilføj `SectionLockToggle` i hver sektions summary:

```tsx
<summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-gray-200">
  <span>Form &amp; krop</span>
  <SectionLockToggle
    paramKeys={['bodyShape.0', 'bodyShape.1', 'bodyShape.2', 'scale', 'speed', 'tail', 'bodyProfile', 'bodyShadingStyle', 'bodyClearcoat', 'bodyClearcoatRoughness']}
  />
</summary>
```

---

## Trin 3: Tilfældig-generator

### 3.1 Opret `EditorRandomizeBar.tsx`

Ny fil: `src/components/editor/EditorRandomizeBar.tsx`

```tsx
import { useEditorStore } from '../../store/useEditorStore.js';

/**
 * Toolbar med tilfældig-knap, mutation-slider og globale lås-knapper.
 * Placeres i header-området af FishEditorPanel.
 */
export function EditorRandomizeBar() {
  const mode = useEditorStore((s) => s.mode);
  const configOverride = useEditorStore((s) => s.configOverride);
  const mutationDegree = useEditorStore((s) => s.mutationDegree);
  const setMutationDegree = useEditorStore((s) => s.setMutationDegree);
  const randomizeFish = useEditorStore((s) => s.randomizeFish);
  const lockAll = useEditorStore((s) => s.lockAll);
  const unlockAll = useEditorStore((s) => s.unlockAll);

  if (!configOverride) return null;

  return (
    <div className="flex flex-col gap-1.5 border-t border-gray-700 pt-2">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="shrink-0 rounded bg-purple-700 px-2.5 py-1 text-xs font-medium hover:bg-purple-600"
          onClick={randomizeFish}
          title="Generér tilfældige værdier for alle ulåste parametre"
        >
          Tilfældig fisk
        </button>
        <label className="flex flex-1 items-center gap-1 text-[11px] text-gray-400" title="Hvor stor del af parametrene der ændres ved hvert tryk (0% = ingen, 100% = alle ulåste)">
          <span className="shrink-0 whitespace-nowrap">Mutation:</span>
          <input
            type="range"
            className="flex-1 accent-purple-500"
            min={0}
            max={1}
            step={0.05}
            value={mutationDegree}
            onChange={(e) => setMutationDegree(Number(e.target.value))}
          />
          <span className="w-8 text-right text-gray-300">{Math.round(mutationDegree * 100)}%</span>
        </label>
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          className="flex-1 rounded bg-gray-700 px-2 py-0.5 text-[11px] text-gray-300 hover:bg-gray-600"
          onClick={lockAll}
          title="Lås alle parametre — ingen ændres ved tilfældig"
        >
          Lås alle
        </button>
        <button
          type="button"
          className="flex-1 rounded bg-gray-700 px-2 py-0.5 text-[11px] text-gray-300 hover:bg-gray-600"
          onClick={unlockAll}
          title="Lås alle parametre op — alle kan ændres ved tilfældig"
        >
          Lås ingen op
        </button>
      </div>
    </div>
  );
}
```

### 3.2 Indsæt `EditorRandomizeBar` i `FishEditorPanel.tsx` header

I `FishEditorPanel.tsx`, tilføj lige efter svømme-animation checkboxen (efter linje 97), men stadig inde i `<header>`:

```tsx
<EditorRandomizeBar />
```

Importér:
```tsx
import { EditorRandomizeBar } from './EditorRandomizeBar.js';
```

### 3.3 Definer randomize-ranges i `editorConstants.ts`

Tilføj i bunden af `editorConstants.ts`:

```typescript
/**
 * Fornuftige min/max-intervaller for tilfældig-generering.
 * Snævrere end editorens fulde range for at undgå monstrøse resultater.
 * Dækker kun parametre der giver visuelt rimelige fisk.
 */
export const RANDOMIZE_RANGES: Record<string, { min: number; max: number }> = {
  'bodyShape.0': { min: 0.5, max: 1.8 },
  'bodyShape.1': { min: 0.5, max: 1.8 },
  'bodyShape.2': { min: 0.7, max: 2.0 },
  scale:         { min: 0.6, max: 1.6 },
  speed:         { min: 0.5, max: 2.5 },
  tailScale:     { min: 0.7, max: 1.5 },
  sideFinScale:  { min: 0.7, max: 1.4 },
  pelvicFinScale:{ min: 0.7, max: 1.3 },
  dorsalFinEmbed:{ min: 0, max: 0.2 },
  bodyOpacity:   { min: 0.3, max: 1.0 },
  finOpacity:    { min: 0.4, max: 1.0 },
  tailSwingAmplitude: { min: 0.1, max: 0.6 },
  bodyClearcoat: { min: 0, max: 1 },
  bodyClearcoatRoughness: { min: 0, max: 0.5 },
  patternDensity: { min: 0.5, max: 2.5 },
};

/**
 * Arrays at vælge tilfældigt fra (selects/dropdowns).
 * Kun de mest "gyldige" værdier inkluderes.
 */
export const RANDOMIZE_SELECT_OPTIONS = {
  tail: EDITOR_HALEFORM_TAIL_TYPES,
  dorsalFinType: [undefined, ...DORSAL_FIN_TYPES] as (DorsalFinType | undefined)[],
  bodyProfile: BODY_PROFILE_OPTIONS,
  bodyPattern: ['solid', 'stripes', 'hstripes', 'waves', 'spots', 'koi', 'trout', 'scales', 'marble', 'leopard', 'neon', 'bicolor', 'ocellus'] as const,
  mouthType: ['none', 'wide_shark', 'round_sucker', 'underbite', 'beak'] as const,
  tailFinMovement: ['normal', 'paddle'] as const,
} as const;

/** Tand-type options til randomize */
export const RANDOMIZE_TEETH_TYPES = ['shark_double', 'fangs', 'tiny', 'tusks'] as const;
```

### 3.4 Implementér `randomizeFish()` i `useEditorStore.ts`

Tilføj nye felter til interface:

```typescript
interface EditorState {
  // ... eksisterende felter ...

  mutationDegree: number;
  setMutationDegree: (v: number) => void;
  randomizeFish: () => void;
}
```

Tilføj initial state:
```typescript
mutationDegree: 0.7,
```

Tilføj setMutationDegree:
```typescript
setMutationDegree: (v) => set({ mutationDegree: v }),
```

Importér nødvendige konstanter:
```typescript
import {
  ALL_LOCKABLE_PARAM_KEYS,
  RANDOMIZE_RANGES,
  RANDOMIZE_SELECT_OPTIONS,
  RANDOMIZE_TEETH_TYPES,
  EDITOR_HALEFORM_TAIL_TYPES,
  DORSAL_FIN_TYPES,
  tailRequiresNormalSideFinMovement,
} from '../components/editor/editorConstants.js';
```

Implementér `randomizeFish`:

```typescript
randomizeFish: () => {
  const { configOverride, lockedParams, mutationDegree } = get();
  if (!configOverride) return;

  // Hjælpefunktioner
  const shouldMutate = (key: string) =>
    !lockedParams.has(key) && Math.random() < mutationDegree;

  const randRange = (key: string) => {
    const r = RANDOMIZE_RANGES[key];
    if (!r) return 0;
    return r.min + Math.random() * (r.max - r.min);
  };

  const randFrom = <T,>(arr: readonly T[]): T =>
    arr[Math.floor(Math.random() * arr.length)];

  const randColor = () => Math.floor(Math.random() * 0xffffff);

  const randBool = (chance = 0.3) => Math.random() < chance;

  // Klon nuværende config
  const cfg = structuredClone(configOverride);

  // ── Krop ──
  if (shouldMutate('bodyShape.0')) {
    cfg.bodyShape = [...cfg.bodyShape] as [number, number, number];
    cfg.bodyShape[0] = parseFloat(randRange('bodyShape.0').toFixed(2));
  }
  if (shouldMutate('bodyShape.1')) {
    cfg.bodyShape = [...cfg.bodyShape] as [number, number, number];
    cfg.bodyShape[1] = parseFloat(randRange('bodyShape.1').toFixed(2));
  }
  if (shouldMutate('bodyShape.2')) {
    cfg.bodyShape = [...cfg.bodyShape] as [number, number, number];
    cfg.bodyShape[2] = parseFloat(randRange('bodyShape.2').toFixed(2));
  }
  if (shouldMutate('scale')) {
    cfg.scale = parseFloat(randRange('scale').toFixed(2));
  }
  if (shouldMutate('speed')) {
    cfg.speed = parseFloat(randRange('speed').toFixed(1));
  }
  if (shouldMutate('tail')) {
    cfg.tail = randFrom(RANDOMIZE_SELECT_OPTIONS.tail);
  }
  if (shouldMutate('bodyProfile')) {
    const p = randFrom(RANDOMIZE_SELECT_OPTIONS.bodyProfile);
    cfg.bodyProfile = p === 'standard' ? undefined : p;
  }

  // ── Farver ──
  if (shouldMutate('color')) {
    cfg.color = randBool(0.05) ? null : randColor(); // 5% chance for null/tilfældig
  }
  if (shouldMutate('colorGradient')) {
    if (randBool(0.35)) {
      cfg.colorGradient = {
        back: randColor(),
        mid1: randColor(),
        mid2: randColor(),
        belly: randColor(),
      };
    } else {
      cfg.colorGradient = undefined;
    }
  }
  if (shouldMutate('useRainbow')) {
    cfg.useRainbow = randBool(0.08) ? true : undefined; // Sjælden
  }
  if (shouldMutate('chameleonMode')) {
    cfg.chameleonMode = randBool(0.08) ? true : undefined;
  }
  if (shouldMutate('bodyHemisphereTint')) {
    if (randBool(0.25)) {
      cfg.bodyHemisphereTint = {
        ventral: randColor(),
        dorsal: randColor(),
        softness: parseFloat((0.05 + Math.random() * 0.4).toFixed(2)),
      };
    } else {
      cfg.bodyHemisphereTint = undefined;
    }
  }
  if (shouldMutate('bodyOpacity')) {
    const op = parseFloat(randRange('bodyOpacity').toFixed(2));
    cfg.bodyOpacity = op >= 1 ? undefined : op;
  }
  if (shouldMutate('finOpacity')) {
    const op = parseFloat(randRange('finOpacity').toFixed(2));
    cfg.finOpacity = op >= 0.95 ? undefined : op;
  }
  if (shouldMutate('emissive')) {
    if (randBool(0.15)) {
      cfg.emissive = randColor();
      cfg.emissiveIntensity = parseFloat((0.1 + Math.random() * 0.8).toFixed(2));
    } else {
      cfg.emissive = undefined;
      cfg.emissiveIntensity = undefined;
    }
  }

  // ── Finner ──
  if (shouldMutate('dorsalFinType')) {
    const dt = randFrom(RANDOMIZE_SELECT_OPTIONS.dorsalFinType);
    cfg.dorsalFinType = dt;
  }
  if (shouldMutate('dorsalFinEmbed')) {
    const embed = parseFloat(randRange('dorsalFinEmbed').toFixed(2));
    cfg.dorsalFinEmbed = embed === 0 ? undefined : embed;
  }
  if (shouldMutate('sideFinScale')) {
    const s = parseFloat(randRange('sideFinScale').toFixed(2));
    cfg.sideFinScale = s === 1 ? undefined : s;
  }
  if (shouldMutate('sideFinPlacement')) {
    cfg.sideFinPlacement = randBool(0.2) ? 'sidevejs' : undefined;
  }
  if (shouldMutate('showPelvicFins')) {
    cfg.showPelvicFins = randBool(0.5) ? true : undefined;
  }
  if (shouldMutate('pelvicFinScale')) {
    if (cfg.showPelvicFins) {
      const s = parseFloat(randRange('pelvicFinScale').toFixed(2));
      cfg.pelvicFinScale = s === 1 ? undefined : s;
    }
  }
  if (shouldMutate('finColor')) {
    if (randBool(0.3)) {
      cfg.finColor = randColor();
    } else {
      cfg.finColor = undefined;
    }
  }

  // ── Hale ──
  if (shouldMutate('tailScale')) {
    const s = parseFloat(randRange('tailScale').toFixed(2));
    cfg.tailScale = s === 1 ? undefined : s;
  }
  if (shouldMutate('tailSwingAmplitude')) {
    const a = parseFloat(randRange('tailSwingAmplitude').toFixed(2));
    cfg.tailSwingAmplitude = Math.abs(a - 0.33) < 0.02 ? undefined : a;
  }
  if (shouldMutate('tailFinMovement')) {
    // Respektér kompatibilitetsregler
    if (!tailRequiresNormalSideFinMovement(cfg.tail)) {
      cfg.tailFinMovement = randBool(0.15) ? 'paddle' : undefined;
    } else {
      cfg.tailFinMovement = undefined;
    }
  }

  // ── Øjne ──
  if (shouldMutate('eyeConfig')) {
    if (randBool(0.5)) {
      cfg.eyeConfig = {
        size: parseFloat((0.15 + Math.random() * 0.3).toFixed(2)),
        scleraColor: randBool(0.7) ? 0xffffff : randColor(),
        pupilColor: randBool(0.7) ? 0x111111 : randColor(),
        pupilScale: parseFloat((0.4 + Math.random() * 1.6).toFixed(2)),
        pupilDepth: parseFloat((0.6 + Math.random() * 0.35).toFixed(2)),
        offsetX: parseFloat((-0.15 + Math.random() * 0.3).toFixed(2)),
        offsetY: parseFloat((-0.2 + Math.random() * 0.4).toFixed(2)),
      };
    } else {
      cfg.eyeConfig = undefined;
    }
  }

  // ── Mund & tænder ──
  if (shouldMutate('teeth')) {
    if (randBool(0.3)) {
      cfg.teeth = {
        type: randFrom(RANDOMIZE_TEETH_TYPES),
        count: Math.floor(4 + Math.random() * 20),
        size: parseFloat((0.02 + Math.random() * 0.06).toFixed(3)),
        color: randBool(0.8) ? 0xffffff : randColor(),
        zOffset: 0,
      };
    } else {
      cfg.teeth = undefined;
    }
  }
  if (shouldMutate('mouthType')) {
    const mt = randFrom(RANDOMIZE_SELECT_OPTIONS.mouthType);
    cfg.mouthType = mt === 'none' ? undefined : mt;
    if (cfg.mouthType) {
      cfg.mouthOpenness = parseFloat((0.2 + Math.random() * 0.7).toFixed(2));
      cfg.mouthColor = randBool(0.7) ? 0x2a0808 : randColor();
    } else {
      cfg.mouthOpenness = undefined;
      cfg.mouthColor = undefined;
    }
  }

  // ── Mønster ──
  if (shouldMutate('bodyPattern')) {
    const pat = randFrom(RANDOMIZE_SELECT_OPTIONS.bodyPattern);
    cfg.bodyPattern = pat === 'solid' ? undefined : (pat as any);
    if (cfg.bodyPattern) {
      cfg.patternColor = randColor();
      cfg.patternDensity = parseFloat(randRange('patternDensity').toFixed(2));
    } else {
      cfg.patternColor = undefined;
      cfg.patternDensity = undefined;
    }
  }

  // ── Special-effekter ──
  if (shouldMutate('bioluminescent')) {
    if (randBool(0.12)) {
      cfg.bioluminescent = {
        enabled: true,
        color: randColor(),
        intensity: parseFloat((0.5 + Math.random() * 2).toFixed(2)),
      };
    } else {
      cfg.bioluminescent = undefined;
    }
  }
  if (shouldMutate('electricSparks')) {
    cfg.electricSparks = randBool(0.08) ? true : undefined;
  }
  if (shouldMutate('electricBolts')) {
    cfg.electricBolts = randBool(0.08) ? true : undefined;
  }
  if (shouldMutate('pufferInflation')) {
    if (randBool(0.08)) {
      cfg.pufferInflation = {
        puff: parseFloat((0.1 + Math.random() * 0.7).toFixed(2)),
        spikeDensity: parseFloat((0.4 + Math.random() * 0.8).toFixed(2)),
      };
    } else {
      cfg.pufferInflation = undefined;
    }
  }

  // ── Clearcoat ──
  if (shouldMutate('bodyClearcoat')) {
    const c = parseFloat(randRange('bodyClearcoat').toFixed(2));
    cfg.bodyClearcoat = Math.abs(c - 0.5) < 0.03 ? undefined : c;
  }
  if (shouldMutate('bodyClearcoatRoughness')) {
    const r = parseFloat(randRange('bodyClearcoatRoughness').toFixed(2));
    cfg.bodyClearcoatRoughness = Math.abs(r - 0.08) < 0.015 ? undefined : r;
  }

  set({ configOverride: cfg });
},
```

### 3.5 Nulstil lockedParams ved mode-skift

I `setMode`, `startNewFish`, og `cloneFromExisting` — tilføj `lockedParams: new Set()` til `set()`-kaldet, så låse nulstilles når man skifter fisk.

---

## Trin 4: Rygfinne-skalering (UAFHÆNGIGT)

> **ADVARSEL**: Dette trin ændrer 3D-rendering-koden og kan påvirke eksisterende fisk visuelt. Skal testes grundigt med alle 14 dorsalFinType-varianter + kegle-default. Anbefales som sidste trin og på en separat branch.

### 4.1 Problem

I `src/three/models/CuteFishModel.tsx`, linje 1573–1577:

```typescript
const dorsalZScale = sz * 0.45 * (config.dorsalFinType ? 1 : 0.6);
const dorsalAutoEmbed = (config.dorsalFinType ? 1 : 0.6) * 0.04;
const dorsalY = sy * (0.85 - dorsalAutoEmbed - (config.dorsalFinEmbed ?? 0) * 0.95);
```

Og placering (linje 2076–2078):
```tsx
position={[sz * 0.15, dorsalY, 0]}
rotation={[-dorsalExtraTilt, 0, 0]}
scale={[1, 1, dorsalZScale]}
```

Kun Z-aksen (sidebevægelse/tykkelse) skaleres med kroppens dimensioner. X (frem/tilbage) og Y (højde) forbliver faste. Resultatet er at rygfinnen:
- Ikke vokser i højden når fisken bliver højere (`sy` stor)
- Ikke strækkes langs kroppen når fisken bliver længere (`sz` stor)
- Ser forkoblet ud ved andre kropsformer end standard

### 4.2 Løsning

**Erstat linje 1575 med:**

```typescript
const isDorsalExtrude = config.dorsalFinType != null;
const dorsalZScale = sz * 0.45 * (isDorsalExtrude ? 1 : 0.6);
const dorsalYScale = sy * (isDorsalExtrude ? 0.75 : 0.65);   // NY: højde følger krop
const dorsalXScale = sz * (isDorsalExtrude ? 0.55 : 0.5);     // NY: tykkelse følger krop-længde
```

**Opdatér mesh-placeringen (linje 2076–2078) for extruderet rygfinne:**

```tsx
// Nuværende:
scale={[1, 1, dorsalZScale]}

// Nyt:
scale={[dorsalXScale, dorsalYScale, dorsalZScale]}
```

**Tilsvarende for kegle-finnen (linje 2090–2092):**

```tsx
// Nuværende:
scale={[1, 1, dorsalZScale]}

// Nyt:
scale={[dorsalXScale, dorsalYScale, dorsalZScale]}
```

### 4.3 Konsekvensanalyse

Denne ændring påvirker den **visuelle rendering** af ALLE fisk der har rygfinner — dvs. de fleste fisk i spillet. Det ændrer IKKE `FishModelConfig` — den genererede kode er stadig identisk. Men fiskene vil SE lidt anderledes ud fordi finnen nu skalerer med kroppen.

**Risikoreduktion:**
1. Implementér på separat branch
2. Test med alle dorsalFinType: `standard`, `standardVersion2`, `spiked`, `spikedVersion2`, `double`, `doubleVersion2`, `mohawk`, `mohawkVersion2`, `almindelig`, `shark`, `crown`, `sailDorsal`, `ragged`, `wave`
3. Test med kegle-fallback (ingen dorsalFinType sat)
4. Test med extreme bodyShape-værdier (0.3, 1.0, 2.5 for sy og sz)
5. Justér konstanterne (0.75, 0.65, 0.55, 0.5) baseret på visuelt resultat
6. Overvej at gøre skalering valgfri via en `dorsalFinAutoScale?: boolean` config-felt, så eksisterende fisk kan beholde gammel adfærd

### 4.4 Alternativ: dorsalFinScale-slider i editoren

En mere konservativ tilgang: tilføj en `dorsalFinScale`-slider (ligesom `tailScale` og `sideFinScale`) der giver designeren manuel kontrol i stedet for automatisk skalering.

**I `FishModelConfig` (types/fish.ts):**
```typescript
dorsalFinScale?: number; // 0.6–1.9, default 1
```

**I CuteFishModel.tsx:**
```typescript
const dorsalUserScale = config.dorsalFinScale ?? 1;
// Brug dorsalUserScale som multiplikator på alle tre akser
scale={[dorsalUserScale, dorsalUserScale, dorsalZScale * dorsalUserScale]}
```

**I EditorFinControls.tsx (fins-mode):**
```tsx
<SliderRow
  label="Rygfinne-skala"
  title="0.6–1.9: samlet rygfinne-størrelse (dorsalFinScale)"
  min={0.6}
  max={1.9}
  step={0.05}
  value={config.dorsalFinScale ?? 1}
  onChange={(v) => updateConfig({ dorsalFinScale: v === 1 ? undefined : v })}
/>
```

Denne tilgang kræver også opdatering af `EditorExport.tsx` for at inkludere `dorsalFinScale`.

---

## Opsummering af implementeringsrækkefølge

| Trin | Beskrivelse | Filer | Risiko |
|------|------------|-------|--------|
| 1 | UI-reorganisering (sektioner, folds, rækkefølge) | FishEditorPanel, EditorFishSelector, EditorBodyControls, EditorColorControls, EditorFinControls | Lav — kun layout |
| 2 | Lås-system (store + LockToggle-komponent) | useEditorStore, editorConstants, LockToggle (ny), alle Editor*Controls | Lav — additivt |
| 3 | Tilfældig-generator (store + EditorRandomizeBar) | useEditorStore, editorConstants, EditorRandomizeBar (ny), FishEditorPanel | Medium — ny logik |
| 4 | Rygfinne-skalering | CuteFishModel.tsx, evt. types/fish.ts | Høj — ændrer rendering |

Hvert trin kan committes og testes uafhængigt. Trin 1–3 ændrer KUN editor-UI og har ingen effekt på spillet. Trin 4 ændrer 3D-rendering og skal testes separat.
