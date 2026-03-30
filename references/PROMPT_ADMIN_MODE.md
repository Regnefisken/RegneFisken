# PROMPT: Implementér Developer Admin Mode

## Kontekst

Regnefisken er et React + Three.js (R3F) fiskespil med Zustand state management og Vite som bundler. Spillet har allerede et dev-only Fish Editor system (Ctrl+Shift+E) der bruges som referencearkitektur for denne opgave. Admin Mode skal følge **nøjagtig samme mønster** for dev-gating, lazy loading og integration.

## Opgave

Implementér et **Developer Admin Panel** der kun eksisterer i development builds (`import.meta.env.DEV`). Panelet åbnes/lukkes med **Ctrl+Shift+A** og giver hurtig adgang til at manipulere spiltilstand under udvikling.

---

## Arkitektur & Konventioner (følg eksisterende mønstre)

### Fil-placering

| Fil | Formål |
|-----|--------|
| `src/store/useAdminStore.ts` | Zustand store for admin panel state |
| `src/components/admin/AdminPanel.tsx` | Hoved-UI-komponent (React overlay) |
| `src/three/admin/AdminFreeRoamCamera.tsx` | R3F free-roam kamera-komponent |

### Dev-gating (kopiér mønster fra Fish Editor)

- **`App.tsx`**: Registrér Ctrl+Shift+A keyboard shortcut i en `useEffect` gated bag `if (!import.meta.env.DEV) return;` — dynamisk `import('./store/useAdminStore.js')` og kald `toggle()`, præcis som den eksisterende Ctrl+Shift+E handler.
- **`App.tsx`**: Lazy-load `AdminPanel` med samme ternary-mønster:
  ```typescript
  const AdminPanelLazy = import.meta.env.DEV
    ? lazy(() => import('./components/admin/AdminPanel.js').then((m) => ({ default: m.AdminPanel })))
    : null;
  ```
  Rendér det med `{import.meta.env.DEV && AdminPanelLazy ? <Suspense fallback={null}><AdminPanelLazy /></Suspense> : null}` nederst i game-root (ved siden af `FishEditorPanelLazy`).
- **`Experience.tsx`**: Lazy-load `AdminFreeRoamCamera` med samme mønster som `EditorFishPreviewLazy`. Når admin store har `freeRoamActive === true`, skal `AdminFreeRoamCamera` renderes **i stedet for** `CameraRig` (men resten af scenen forbliver synlig — i modsætning til fish editor, der erstatter hele scenen). Dvs. den normale `CameraRig` udelades, men alle andre scene-elementer (vand, scenery, fisk, etc.) forbliver.

### Store: `useAdminStore.ts`

```typescript
interface AdminState {
  isOpen: boolean;           // panel synlighed
  freeRoamActive: boolean;   // free-roam kamera til/fra
  toggle: () => void;
  close: () => void;
  setFreeRoamActive: (v: boolean) => void;
}
```

---

## Feature A: Lokationsskifter (dropdown)

### Krav

- En `<select>` dropdown i AdminPanel med **alle 10 lokationer** sorteret efter display-navn.
- Viser den aktuelle lokation som selected value.
- Ved valg: kald `useGameStore.getState().setCurrentLocation(id)` direkte — **ingen unlock-check**, **ingen streak reset**, **ingen weather reset**. Admin skal kunne teleportere frit.

### Data-kilde

- Importér `LOCATION_DISPLAY` fra `src/data/locations.ts` — det er et objekt `{ pier: 'Den Gamle Mole', smaragd: 'Skovsøen', ... }`.
- Byg dropdown-options fra `Object.entries(LOCATION_DISPLAY)` sorteret alfabetisk efter display-navn (value).
- Brug `useGameStore((s) => s.currentLocation)` som controlled value.

### Lokations-IDs (reference)

```
pier, smaragd, abyss, forbidden, desert_lake, arctic_sea, fishing_cabin, tropical_island, cave, jungle_island
```

---

## Feature B: Tvungen fangst (dropdown)

### Krav

- En `<select>` dropdown med **ALLE entries** fra `CATCH_MASTER_DATA` (fisk, junk, bosser, quest-items, skatte — alt), sorteret **alfabetisk efter `name`**.
- Dropdown viser: `"{name} ({rarity})"` for hvert entry — f.eks. `"Torsk (Almindelig)"`, `"Kraken (Legendarisk)"`, `"Flaskepost (Quest)"`.
- En "Fang!" knap ved siden af dropdown'en.
- Ved klik: opret et `RollCatchResult` objekt fra det valgte `CatchMasterEntry` og indsæt det direkte i catch-flowet.

### Implementering af tvungen fangst

Når brugeren trykker "Fang!":

1. Find det valgte `CatchMasterEntry` fra `CATCH_MASTER_DATA` via dets `id`.
2. Importér `ENRICHED_CATCH_DATA` fra `src/data/enrichment.ts` og find den berigede entry for fallback-værdier (weight, value, xp).
3. Opret et `RollCatchResult`:
   ```typescript
   const result: RollCatchResult = {
     id: makeId(),                              // fra catch-engine.ts
     fishModelId: entry.id,
     species: entry.name,
     weight: entry.weightRange
       ? Number((entry.weightRange[0] + Math.random() * (entry.weightRange[1] - entry.weightRange[0])).toFixed(1))
       : Number((0.5 + Math.random() * 5).toFixed(1)),
     value: entry.value ?? enriched?.baseValue ?? 10,
     rarity: entry.rarity,
     color: entry.model?.color ?? 0x888888,
     itemType: entry.itemType,
     visual: entry.visual,
     visualScale: entry.visualScale,
     xpReward: entry.xpReward ?? enriched?.baseXP ?? 5,
   };
   ```
4. Sæt `useFishingStore.getState().setLastCatch(result)` og `useGameStore.getState().setGameState('catch')` for at trigge catch-overlay'et.

### Data-kilde

- `CATCH_MASTER_DATA` fra `src/data/fish.ts` (~111 entries inkl. fisk, junk, bosser, quests, skatte).
- `ENRICHED_CATCH_DATA` fra `src/data/enrichment.ts` for fallback weight/value/xp.
- `makeId()` fra `src/logic/catch-engine.ts`.
- `RollCatchResult` type fra `src/types/fish.ts`.

---

## Feature C: Level & Penge knapper

### Krav

To knapper side om side i admin-panelet:

1. **"+1 Level"** — Øger spillerens level med 1.
2. **"+1.000 kr"** — Giver spilleren 1.000 kroner.

### Implementering

**+1 Level:**
```typescript
const { progression, setProgression } = usePlayerStore.getState();
setProgression({ ...progression, level: progression.level + 1, xp: 0 });
```

**+1.000 kr:**
```typescript
usePlayerStore.getState().setCoins((c) => c + 1000);
```

Vis aktuel level og coins i panelet som kontekst, f.eks.:
```
Level: 5  |  Kroner: 2.340
[+1 Level]  [+1.000 kr]
```

---

## Feature D: Free-Roam Kamera

### Krav

- En toggle-knap i AdminPanel: "Free-Roam Kamera" (til/fra).
- Når aktiveret: erstat `CameraRig` med et nyt `AdminFreeRoamCamera` i `Experience.tsx`.
- WASD bevæger kameraet i XZ-planet (relativ til kameraets retning).
- Shift gør bevægelsen hurtigere, Space bevæger opad (Y+), Q bevæger nedad (Y−).
- Mus-bevægelse styrer kameraets rotation (yaw/pitch) — **kun når Pointer Lock er aktiv** (klik på canvas for at aktivere, Escape for at frigive).
- Et overlay i hjørnet viser de aktuelle kamera-koordinater:
  ```
  X: 12.34  Y: 5.67  Z: -8.90
  ```
- En "Kopiér koordinater" knap der kopierer `[12.34, 5.67, -8.90]` til clipboard (præcis det format, klar til paste i kode).
- Koordinaterne opdateres i real-time (brug `useFrame` i R3F-komponenten og gem i en ref/store).

### Implementering: `AdminFreeRoamCamera.tsx`

Placeres i `src/three/admin/AdminFreeRoamCamera.tsx`.

```typescript
// Pseudo-kode for R3F-komponent:
export function AdminFreeRoamCamera() {
  const { camera, gl } = useThree();
  const keys = useRef<Set<string>>(new Set());
  const euler = useRef(new Euler(0, 0, 0, 'YXZ'));
  const coordRef = useRef({ x: 0, y: 0, z: 0 });

  // Keyboard listeners (keydown/keyup → keys.current add/delete)
  // Pointerlockchange listener → gl.domElement.requestPointerLock()
  // Mousemove listener → euler yaw/pitch opdatering (kun under pointer lock)

  useFrame((_, delta) => {
    const speed = keys.current.has('Shift') ? 30 : 10;
    const forward = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const right = new Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    forward.y = 0; forward.normalize();
    right.y = 0; right.normalize();

    if (keys.current.has('w')) camera.position.addScaledVector(forward, speed * delta);
    if (keys.current.has('s')) camera.position.addScaledVector(forward, -speed * delta);
    if (keys.current.has('a')) camera.position.addScaledVector(right, -speed * delta);
    if (keys.current.has('d')) camera.position.addScaledVector(right, speed * delta);
    if (keys.current.has(' ')) camera.position.y += speed * delta;
    if (keys.current.has('q')) camera.position.y -= speed * delta;

    camera.quaternion.setFromEuler(euler.current);
    // Opdatér coordRef for UI-display
    coordRef.current = {
      x: Number(camera.position.x.toFixed(2)),
      y: Number(camera.position.y.toFixed(2)),
      z: Number(camera.position.z.toFixed(2)),
    };
  });

  return null;
}
```

**Koordinat-overlay i AdminPanel:**
- Brug en shared ref eller en lille Zustand-slice i `useAdminStore` (f.eks. `coords: { x: number, y: number, z: number }` med en `setCoords` action).
- `AdminFreeRoamCamera` opdaterer `useAdminStore.getState().setCoords(...)` i `useFrame` (throttle til f.eks. hver 100ms for performance).
- `AdminPanel` abonnerer på `coords` og viser dem + kopiér-knappen.
- Kopiér-knap: `navigator.clipboard.writeText(\`[\${x}, \${y}, \${z}]\`)`.

### Integration i `Experience.tsx`

I `Experience.tsx` skal `CameraRig` erstattes betinget:

```tsx
const adminFreeRoam = import.meta.env.DEV ? useAdminStore((s) => s.freeRoamActive) : false;

// I JSX:
{!editorOpen && (
  <>
    {adminFreeRoam && AdminFreeRoamCameraLazy ? (
      <Suspense fallback={null}><AdminFreeRoamCameraLazy /></Suspense>
    ) : (
      <CameraRig />
    )}
    {/* ... resten af scenen uændret ... */}
  </>
)}
```

---

## UI Design for AdminPanel

### Layout

Panelet skal renderes som et **fixed overlay** i øverste venstre hjørne, semi-transparent mørk baggrund, kompakt design. Brug Tailwind CSS (projektet bruger Tailwind 4).

```
┌─────────────────────────────────────┐
│  🔧 ADMIN PANEL          [✕ Luk]   │
│─────────────────────────────────────│
│  LOKATION                           │
│  [▼ Den Gamle Mole_____________]    │
│                                     │
│  TVUNGEN FANGST                     │
│  [▼ Vælg fangst_______________]    │
│  [🎣 Fang!]                         │
│                                     │
│  PROGRESSION                        │
│  Level: 5  |  Kroner: 2.340         │
│  [+1 Level]  [+1.000 kr]            │
│                                     │
│  KAMERA                             │
│  [☐ Free-Roam Kamera]               │
│  X: 0.00  Y: 4.60  Z: 13.00        │
│  [📋 Kopiér koordinater]            │
│                                     │
│  Ctrl+Shift+A for at lukke          │
└─────────────────────────────────────┘
```

### Styling-retningslinjer

- Baggrund: `bg-black/80 backdrop-blur-sm`
- Tekst: `text-white text-sm`
- Knapper: `bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-sm font-medium`
- Selects: `bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 text-sm w-full`
- Sektioner adskilt med `border-t border-gray-700 pt-2 mt-2`
- Panel bredde: `w-80` (320px)
- Padding: `p-4`
- Z-index: `z-[99998]` (under ScreenSettings som er `z-[99999]`, men over alt andet)
- Panelet skal kunne scrolles hvis det er for højt til viewporten.
- Luk med Escape-tast (registrér i panelet).

---

## Vigtige Implementeringsdetaljer

### 1. Undgå konflikter med Fish Editor

Admin Mode og Fish Editor kan være åbne samtidigt (de betjener forskellige formål). Men free-roam kamera bør **ikke** aktiveres når fish editor er åben (da fish editor erstatter hele scenen). Tilføj en check:

```typescript
// I AdminPanel — disable free-roam toggle når fish editor er åben
const fishEditorOpen = import.meta.env.DEV ? useEditorStore((s) => s.isOpen) : false;
```

### 2. Keyboard shortcuts skal ikke konflikte

- Admin: Ctrl+Shift+A
- Fish Editor: Ctrl+Shift+E
- Free-roam WASD: kun aktiv når `freeRoamActive === true` og pointer lock er engaged. WASD skal **ikke** fanges når brugeren skriver i input-felter.

### 3. Free-roam cleanup

Når free-roam deaktiveres, skal kameraet glide tilbage til sin normale position (sæt `freeRoamActive = false` — `CameraRig` tager over og lerper kameraet tilbage automatisk).

### 4. Pointer Lock UX

- Klik på 3D-canvas for at engagere pointer lock (cursor forsvinder, mus styrer kamera).
- Tryk Escape for at frigive pointer lock (cursor vises igen, men free-roam er stadig aktivt — WASD virker stadig).
- Vis en lille tekst i admin-panelet: "Klik på canvas for muselook" når free-roam er aktiv men pointer lock ikke er engaged.

### 5. GameState guard

Tvungen fangst bør sætte `gameState` til `'idle'` først (via `setGameState('idle')`) inden den sætter `lastCatch` og `gameState = 'catch'`, for at undgå konflikter med igangværende fishing/math flows.

### 6. Koordinater i adminStore

Tilføj til `useAdminStore`:
```typescript
coords: { x: number; y: number; z: number };
setCoords: (c: { x: number; y: number; z: number }) => void;
```
Default: `{ x: 0, y: 4.6, z: 13 }` (spillets standard-kameraposition).

---

## Opsummering af filer der skal oprettes/ændres

### Nye filer (opret)
1. `src/store/useAdminStore.ts`
2. `src/components/admin/AdminPanel.tsx`
3. `src/three/admin/AdminFreeRoamCamera.tsx`

### Eksisterende filer (ændres)
4. `src/App.tsx` — tilføj Ctrl+Shift+A handler + lazy AdminPanel rendering
5. `src/three/Experience.tsx` — tilføj lazy AdminFreeRoamCamera + betinget CameraRig-erstatning

### Ingen andre filer skal ændres

Systemet er helt additiv — det læser fra eksisterende stores og data, men ændrer ikke eksisterende logik.

---

## Implementeringsrækkefølge

1. **Opret `useAdminStore.ts`** — simpel Zustand store med `isOpen`, `freeRoamActive`, `coords`, `toggle`, `close`, `setFreeRoamActive`, `setCoords`.
2. **Opret `AdminPanel.tsx`** — UI med alle fire features (A–D). Start med lokation og progression, tilføj fangst og kamera.
3. **Integrer i `App.tsx`** — keyboard shortcut + lazy rendering (kopiér fish editor-mønsteret).
4. **Opret `AdminFreeRoamCamera.tsx`** — R3F komponent med WASD/mus-kontrol + koordinat-opdatering.
5. **Integrer i `Experience.tsx`** — lazy load + betinget CameraRig-erstatning.
6. **Test** — verificér at alt er dev-only (tjek at `import.meta.env.DEV` gates alle entry points).
