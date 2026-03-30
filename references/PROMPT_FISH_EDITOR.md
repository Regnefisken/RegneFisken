# PROMPT: Byg Regnefisken Fish Editor — Visuelt 3D-værktøj

> **Brug dette prompt 1:1 med Claude Opus til at bygge et komplet visuelt**
> **fish editor-værktøj med live 3D-preview, parameter-kontroller og eksport.**

---

## Kontekst

Jeg bygger et separat værktøj til at designe fisk til mit spil **Regnefisken**.
Spillet bruger **procedurale 3D-fisk** via Three.js — der er ingen billedfiler,
ingen GLB/GLTF, kun et TypeScript config-objekt (`FishModelConfig`) pr. fisk.

Den komplette specifikation for fiskeformatet er i:
**`C:\Users\ander\regnefisken\references\FISH_GENERATOR_SPEC.md`**

Læs den fil grundigt — den indeholder alle typer, interfaces, gyldige værdier,
begrænsninger og eksempler.

---

## Opgave

Byg en **standalone Vite + React + TypeScript webapp** kaldet `fish-editor` med:

1. **Live 3D-preview** af fisken der opdateres i realtid
2. **UI-panel med kontroller** (dropdowns, sliders, color pickers, checkboxes)
3. **Eksport** til copy-paste-klar `CatchMasterEntry` TypeScript/JSON
4. **Import** af eksisterende fisk fra spillet + detektion af ID-kollisioner
5. **Galleri** med alle eksisterende fisk fra spillet til sammenligning

---

## Del 1: Projekt-setup

### 1.1 Opret projektet

```bash
cd C:\Users\ander
npm create vite@latest fish-editor -- --template react-ts
cd fish-editor
npm install three @react-three/fiber @react-three/drei zustand
npm install -D @types/three tailwindcss @tailwindcss/vite
```

### 1.2 Vite-config

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

### 1.3 Kopiér disse filer fra spillet (VIGTIGT — brug PRÆCIS disse)

Kopiér disse filer fra `C:\Users\ander\regnefisken\` ind i `fish-editor/src/game/`:

| Kilde (regnefisken) | Destination (fish-editor) |
|---|---|
| `src/types/fish.ts` | `src/game/types.ts` |
| `src/three/models/cuteFishUtils.ts` | `src/game/cuteFishUtils.ts` |
| `src/three/models/CuteFishModel.tsx` | `src/game/CuteFishModel.tsx` |
| `src/data/fish.ts` | `src/game/fishData.ts` |

**Ret imports** i de kopierede filer så de peger på hinanden lokalt (fjern `.js`-extensions, ret stier).

**KRITISK**: `CuteFishModel.tsx` er ~1110 linjer og indeholder mange sub-modeller
(WhiteShark, Spirit, Frog, Crab osv.). Du skal bruge **`StandardFishModel`**-komponenten
fra den fil samt **alle creature-branches i `CuteFishModel`** (frog, crab, octopus,
starfish, lobster, ray, eel osv.) — kopiér HELE filen, ikke kun dele af den.

Fra `cuteFishUtils.ts` skal du bruge:
- `createFishLatheGeometry()` — LatheGeometry med denne profil
- `getScaleTextures()` — CanvasTexture 192x192/256x256 med skæl-mønster
- `resolveBodyColor()` — farvelogik for frøer/gyldne

### 1.4 Tailwind CSS

```css
/* src/index.css */
@import "tailwindcss";
```

---

## Del 2: Applikationsarkitektur

### 2.1 Mappestruktur

```
fish-editor/src/
├── game/                    # Kopieret fra regnefisken
│   ├── types.ts             # FishModelConfig, CatchMasterEntry, etc.
│   ├── cuteFishUtils.ts     # LatheGeometry + CanvasTexture
│   ├── CuteFishModel.tsx    # Hele rendering-komponenten
│   └── fishData.ts          # CATCH_MASTER_DATA (eksisterende fisk)
├── store/
│   └── useEditorStore.ts    # Zustand store for editor-state
├── components/
│   ├── EditorPanel.tsx       # Hoved-UI panel (venstre side)
│   ├── FishPreview3D.tsx     # 3D Canvas med live preview
│   ├── ExportPanel.tsx       # Eksport-output + validering
│   ├── GalleryPanel.tsx      # Galleri med eksisterende fisk
│   ├── MetaFields.tsx        # id, name, rarity, locations, requirements
│   ├── BodyShapeControls.tsx # bodyShape sliders + presets
│   ├── TailSelector.tsx      # Dropdown for TailType
│   ├── ColorControls.tsx     # Color picker + biom-paletter
│   ├── TraitToggles.tsx      # Checkboxes for dekorative flags
│   ├── CreatureTypeSelect.tsx # Dropdown for creature-flags
│   └── MaterialControls.tsx  # metalness, roughness, emissive sliders
├── App.tsx
├── main.tsx
└── index.css
```

### 2.2 Zustand Store

```typescript
// src/store/useEditorStore.ts
import { create } from 'zustand';
import type { FishModelConfig, CatchMasterEntry, TailType, CatchRarity } from '../game/types';

// Alle eksisterende IDs fra spillet (importeret fra fishData.ts)
import { CATCH_MASTER_DATA } from '../game/fishData';

type CreatureType = 'none' | 'isEel' | 'isFrog' | 'isStarfish' | 'isCrab'
  | 'isOctopus' | 'isLobster' | 'isRay' | 'isPiranha' | 'isGoldenCarp';

interface EditorState {
  // ═══ Meta ═══
  id: string;
  name: string;
  rarity: CatchRarity;
  primaryAreas: string[];
  requiredRod: string | null;
  requiredBait: string | null;
  requiredUpgrade: string | null;
  itemType: string;
  lootWeight: number | null;
  weightRange: [number, number] | null;
  value: number | null;
  xpReward: number | null;

  // ═══ FishModelConfig ═══
  color: number;
  bodyShape: [number, number, number];
  tail: TailType;
  speed: number;
  scale: number;
  creatureType: CreatureType;
  flat: boolean;
  spots: number | boolean;
  stripes: boolean;
  redFins: boolean;
  longBeak: boolean;
  spikes: boolean;
  uglyHead: boolean;
  finUp: boolean;
  sword: boolean;
  whiskers: boolean;
  lure: boolean;
  noEyes: boolean;
  emissive: number | null;
  emissiveIntensity: number;
  metalness: number;
  roughness: number;
  maxDisplayScale: number | null;
  thinLegs: boolean;
  bellyColor: number | null;

  // ═══ Editor UI state ═══
  animationPaused: boolean;
  showGrid: boolean;
  showWireframe: boolean;
  galleryOpen: boolean;
  activeTab: 'shape' | 'color' | 'traits' | 'meta' | 'export';

  // ═══ Actions ═══
  setField: <K extends keyof EditorState>(key: K, value: EditorState[K]) => void;
  setBodyShapeAxis: (axis: 0 | 1 | 2, value: number) => void;
  loadFish: (entry: CatchMasterEntry) => void;
  resetToDefaults: () => void;
  buildModelConfig: () => FishModelConfig;
  buildCatchMasterEntry: () => CatchMasterEntry;
  getExistingIds: () => Set<string>;
  isIdConflict: () => boolean;
}
```

**`buildModelConfig()`** skal samle alle relevante felter til et `FishModelConfig`-objekt,
og kun inkludere valgfrie felter der er sat (dvs. ikke `stripes: false`, kun `stripes: true`).

**`buildCatchMasterEntry()`** skal samle hele entry inkl. meta-felter.

**`loadFish(entry)`** skal populere ALLE store-felter fra en eksisterende `CatchMasterEntry`,
så man kan redigere eksisterende fisk.

**`isIdConflict()`** checker om `id` allerede eksisterer i `CATCH_MASTER_DATA`.

---

## Del 3: 3D Preview

### 3.1 FishPreview3D-komponenten

```tsx
// src/components/FishPreview3D.tsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import { useEditorStore } from '../store/useEditorStore';
// Importér CuteFishModel fra game/
```

Krav:
- **OrbitControls** med mus: venstre-klik roterer, scroll zoomer, højreklik panorerer
- **Ambient + directional light** der matcher spillets belysning
- **Valgfri grid** (toggle i UI) til at vurdere størrelse
- **Valgfri wireframe-mode** til at se geometrien
- Fisken skal **animere live** (rotation + bob + hale) med spillets useFrame-logik
- **Pause-knap** der stopper animation og lader fisken stå stille for inspektion
- Kameraet skal starte `position={[0, 1.5, 4]}` med `fov={45}`

### 3.2 Brug CuteFishModel direkte

Fisken renderes med den kopierede `CuteFishModel`-komponent:

```tsx
<CuteFishModel
  config={store.buildModelConfig()}
  fishModelId={store.id || 'editor_preview'}
  instanceId="editor_preview"
  rollColor={store.color}
  bucketIdle={store.animationPaused}
/>
```

`bucketIdle={true}` giver den rolige hale-wiggle (perfekt til inspektion).
`bucketIdle={false}` giver fuld svømme-animation.

### 3.3 Størrelses-reference

Vis en gennemsigtig "reference-fisk" (outline/wireframe af en `scale: 1.0` standard fisk)
så brugeren kan se relativ størrelse.

---

## Del 4: UI-panel (venstre side)

### 4.1 Layout

Appen skal have et **split-layout**:
- **Venstre 380px**: Scrollbar panel med alle kontroller, organiseret i tabs
- **Højre**: 3D preview der fylder resten af vinduet
- **Bund**: Eksport-output panel (kan collapses)

### 4.2 Tabs i panelet

**Tab: Form (Shape)**
- **Arketype-preset dropdown**: Standard rund, Fladfisk, Ål, Stor rovfisk, Krabbe,
  Blæksprutte, Hummer, Dybhavsfisk, Lang tynd, Rokke — vælger fornuftige startværdier
- **bodyShape[0] (sx — Bredde)**: Slider 0.1 – 3.0, step 0.05, med talvisning
- **bodyShape[1] (sy — Højde)**: Slider 0.1 – 3.0, step 0.05
- **bodyShape[2] (sz — Længde)**: Slider 0.3 – 5.0, step 0.05
- **tail**: Dropdown med alle 11 TailType-værdier, med dansk label:
  - standard → "Standard hale"
  - forked → "Gaffelhale"
  - flat → "Flad hale"
  - eel → "Ål-hale"
  - thin → "Tynd hale"
  - chunky → "Bred kraftig hale"
  - shark → "Hajhale"
  - dino → "Dinosaur-hale"
  - whip → "Piskehale"
  - star → "Stjerne (ingen hale)"
  - none → "Ingen hale"
- **scale**: Slider 0.3 – 5.0, step 0.1
- **speed**: Slider 0.1 – 3.5, step 0.1
- **flat**: Checkbox — "Fladtrykt krop"
- **Creature type**: Dropdown:
  - none → "Normal fisk"
  - isEel → "Ål"
  - isFrog → "Frø"
  - isStarfish → "Søstjerne"
  - isCrab → "Krabbe"
  - isOctopus → "Blæksprutte"
  - isLobster → "Hummer"
  - isRay → "Rokke"
  - isPiranha → "Piranha"
  - isGoldenCarp → "Gyldne Karpe"

**Tab: Farve (Color)**
- **Color picker** (hex input + visuelt) for `color`
- **Biom-farvepalet**: Knapper med foreslåede farver grupperet efter biom:
  - Hav/mole: #8B7355, #6B8CAE, #C4A882, #7A8A7A
  - Skov/ferskvand: #5A8A5A, #5A7A5A, #C0B890, #A8B5A0
  - Dybet: #1A1A3A, #1A1210, #2A1A3A, #3A3A4A
  - Tropisk: #FF6A00, #00CED1, #1E90FF, #FFD700
  - Ørken: #D2B48C, #B8944A, #5F9EA0
  - Ishav: #A8C0A8, #5A4A3A, #7A8A9A
  - Forbudt: #C8D8E8, #1A1A1A, #3A4A2A
  - Grotte: #F0E8E0, #E8E8F0, #B0A89A, #4A4A4A
- **bellyColor**: Valgfri farve (kun relevant med isWhiteShark)
- **emissive**: Valgfri hex-farve + intensity slider (0–2)
- **metalness**: Slider 0–1 (default 0.12)
- **roughness**: Slider 0–1 (default 0.2)

**Tab: Detaljer (Traits)**
- Alle dekorative booleans som checkboxes med danske labels:
  - spots → "Pletter" + valgfri farve-picker (hvis number)
  - stripes → "Striber"
  - redFins → "Røde finner"
  - longBeak → "Langt næb"
  - spikes → "Rygpigge"
  - uglyHead → "Klodset hoved"
  - finUp → "Opretstående finne"
  - sword → "Sværdnæb"
  - whiskers → "Skæggevarter"
  - lure → "Lygtefisk-lampe"
  - noEyes → "Ingen øjne"
  - thinLegs → "Tynde ben (med krabbe)"
- **maxDisplayScale**: Valgfri talindtastning
- **Aktivt traits-antal**: Vis en tæller "3/5 traits aktive" med advarsel ved >5

**Tab: Meta**
- **id**: Tekstfelt med auto-generering fra name: `fisk_${slugify(name)}`
  - Vis rød ramme + "ID EKSISTERER ALLEREDE" hvis det kolliderer med CATCH_MASTER_DATA
  - Vis grøn ramme + "Nyt ID — klar til import" hvis unikt
- **name**: Tekstfelt (dansk navn)
- **rarity**: Dropdown: Almindelig, Sjælden, Legendarisk
- **primaryAreas**: Multi-select checkboxes for alle 8 lokationer
  - Vis lokationsnavne + emoji: "🏚 Den Gamle Mole (pier)"
- **requiredRod**: Dropdown: Ingen / Havblå / Mahogni
- **requiredBait**: Dropdown: Ingen / Standard / Hvalbøf / Kødklump
- **requiredUpgrade**: Dropdown: Ingen / golden_hook / biolum_floats / magnet
- **itemType**: Dropdown: fish / piranha (default: fish)
- **lootWeight**: Valgfrit tal (vis default baseret på rarity)
- **weightRange**: To talfelter [min, max] kg (vis rarity-defaults som placeholder)
- **value**: Valgfrit tal (vis rarity-default)
- **xpReward**: Valgfrit tal (vis rarity-default)

**Tab: Eksport**
- Se Del 5 nedenfor

---

## Del 5: Eksport-system

### 5.1 TypeScript-output

Generer korrekt TypeScript-kode der kan copy-pastes direkte ind i `CATCH_MASTER_DATA`:

```typescript
{ id: 'fisk_ny_fisk', name: 'Ny Fisk', type: 'fish', rarity: 'Almindelig',
  primaryAreas: ['pier'], requirements: { requiredRod: null, requiredBait: null },
  itemType: 'fish', model: { color: 0x8B7355, bodyShape: [1, 0.8, 1.2],
  tail: 'standard', speed: 1.0, scale: 1.0 } },
```

Regler for output:
- Udelad alle valgfrie felter der er `false`, `null`, `undefined`, eller default-værdi
- `color` skal formateres som hex-literal: `0x8B7355` (ikke decimal)
- `bodyShape` værdier skal rundes til 1 decimal
- Output skal være på **én linje** (matcher eksisterende format i fish.ts)
- Inkludér trailing komma

### 5.2 JSON-output

Alternativt JSON-format til brug i andre værktøjer.

### 5.3 Validerings-tjek

Kør alle 18 valideringstjek fra spec-rapportens sektion 17 og vis resultater:
- Grønt flueben for bestået
- Rødt kryds for fejl med forklaring
- Gult advarselstegn for anbefalinger (fx "Mange traits aktive")

### 5.4 Import vs. Replace-indikator

Baseret på `id`-feltet, vis tydeligt:

**Hvis ID er NYT** (eksisterer ikke i CATCH_MASTER_DATA):
```
✅ NY FISK — Klar til import
Indsæt denne linje i CATCH_MASTER_DATA i src/data/fish.ts
```

**Hvis ID MATCHER en eksisterende fisk:**
```
⚠️ ERSTATNING — Overskriver eksisterende fisk: "Torsk" (fisk_torsk)
Erstat den eksisterende linje i CATCH_MASTER_DATA
```
Vis desuden en diff: hvad er ændret fra den originale fisk.

### 5.5 Kopier-knap

En knap "Kopiér til clipboard" der kopierer outputtet.

---

## Del 6: Galleri med eksisterende fisk

### 6.1 Galleri-panel

Et panel (kan slides ind fra højre eller åbnes i modal) der viser alle fisk fra
`CATCH_MASTER_DATA` med:
- 3D-thumbnail af hver fisk (lille Canvas pr. fisk, eller én delt Canvas med kamera-shifts)
- Navn, rarity (farvekodet), lokationer
- Klik på en fisk → **`loadFish(entry)`** populerer hele editoren med den fisks data
- Filtrér efter lokation og rarity
- Søg efter navn

### 6.2 Sammenligning

Vis en "Split view"-mulighed: eksisterende fisk til venstre, redigeret fisk til højre,
side om side i 3D.

---

## Del 7: Arketype-presets

Når brugeren vælger en arketype i Form-tabben, sæt disse standardværdier:

| Preset | bodyShape | tail | speed | scale | Extra flags |
|--------|-----------|------|-------|-------|-------------|
| Standard rund | [0.8, 0.9, 1.2] | standard | 1.2 | 0.9 | — |
| Fladfisk | [1.4, 0.3, 1.2] | flat | 0.8 | 0.9 | flat: true |
| Ål/slange | [0.3, 0.3, 2.5] | eel | 0.7 | 1.0 | isEel: true |
| Stor rovfisk | [0.9, 1.0, 2.0] | shark | 1.8 | 2.0 | finUp: true |
| Krabbe | [1.3, 0.5, 1.0] | none | 0.5 | 0.7 | isCrab: true |
| Blæksprutte | [1.0, 1.0, 1.0] | none | 0.5 | 1.0 | isOctopus: true |
| Hummer | [1.2, 0.5, 1.5] | none | 0.6 | 1.2 | isLobster: true |
| Dybhavsfisk | [1.0, 1.0, 0.9] | standard | 0.4 | 0.6 | lure: true, emissive: 0x00CCFF |
| Lang hornfisk | [0.4, 0.4, 2.5] | thin | 1.8 | 1.1 | longBeak: true |
| Rokke | [2.5, 0.2, 2.0] | whip | 1.0 | 1.5 | isRay: true |

Brugeren kan derefter tilpasse alt med sliders/dropdowns.

---

## Del 8: UI/UX-krav

### 8.1 Generelt

- **Mørkt tema** — matcher typisk 3D-editor æstetik
- **Responsiv sliders** der opdaterer 3D-preview LIVE (ingen "Apply"-knap)
- Alle tal-sliders skal have:
  - Slider-bjælke
  - Talvisning til højre
  - Mulighed for at skrive tallet direkte
- Dropdowns skal have **preview-ikon/farve** hvor relevant
- Keyboard shortcut: **Space** pauser/genoptager animation

### 8.2 3D-viewport

- Tag 60%+ af skærmbredden
- Mørk baggrund (gradient `#1a1a2e` → `#16213e`)
- Toolbar i toppen af viewport:
  - Pause/Play animation
  - Toggle grid
  - Toggle wireframe
  - Reset kamera
  - Toggle reference-fisk

### 8.3 Accessibility

- Alle inputs har labels
- Tab-navigation fungerer
- Farvekontrast OK på mørk baggrund

---

## Del 9: Eksisterende fiskedata at inkludere

Hele `CATCH_MASTER_DATA` fra spillet (153 entries, ~84 fisk + junk + bosses) skal
inkluderes via den kopierede `fishData.ts`. Editoren importerer det og bruger det til:

1. **ID-kollisions-check**: `new Set(CATCH_MASTER_DATA.map(c => c.id))`
2. **Galleri**: Alle entries med `model !== null` kan previews
3. **Load existing**: Klik i galleri → populer editor

Eksisterende fisk-IDs (for reference i collision-check):
fisk_torsk, fisk_sild, fisk_skrubbe, fisk_makrel, fisk_hornfisk, fisk_roedspette,
fisk_ising, fisk_fjaesing, fisk_skalle, fisk_aborre, fisk_sej, fisk_brasen,
fisk_rudskalle, fisk_aalekvabbe, fisk_gedde, fisk_ulk, fisk_hork, fisk_frø,
fisk_soestjerne, fisk_klovnefisk, fisk_papegojefisk, fisk_blaa_tang, fisk_muraene,
fisk_kejserfisk, fisk_piratfisk, fisk_laks, fisk_havørred, fisk_pighvar, fisk_aal,
fisk_stør, fisk_krabbe, fisk_havkat, fisk_sandart, fisk_kulmule, fisk_havtaske,
fisk_knurhane, fisk_lange, fisk_multe, fisk_suder, fisk_karpe, fisk_brosme,
fisk_blaeksprutte, fisk_kaempe_tun, fisk_haj, fisk_svaerdfisk, fisk_gyldne_karpe,
fisk_hummer, fisk_klumpfisk, fisk_sildehaj, fisk_rokke, fisk_petersfisk,
fisk_helleflynder, fisk_plesiosaurus, fisk_axolotl, fisk_gnavne_gorm,
fisk_gylden_frø, fisk_hvidhaj, fisk_regnbueørred, fisk_grundling, fisk_løje,
fisk_lygtefisk, fisk_fangtandfisk, fisk_dybhavsål, fisk_havedderkop,
fisk_ørkengrundling, fisk_sandbarbe, fisk_niltilapia, fisk_oase_malle,
fisk_lodde, fisk_hellefisk, fisk_narhval, fisk_spøgelsesål, fisk_skeletfisk,
fisk_sumptorsk, fisk_kaptajnens_karpe, fisk_piratål, fisk_giftig_søslange,
fisk_dødningehaj, fisk_guldtentakel, fisk_blind_grottefisk, fisk_grottekrebs,
fisk_drypstensål, fisk_underjordisk_malle, fisk_soeuhyre

---

## Del 10: Vigtige tekniske noter

### 10.1 Rendering-pipeline i CuteFishModel

`CuteFishModel` dispatcher til subkomponenter baseret på `FishModelConfig` flags:

```
if (isBottle)    → BottleModel
if (isFossil)    → FossilModel
if (isConch)     → ConchModel
if (isOyster)    → OysterModel
if (isKey)       → KeyModel
if (isFrog)      → FrogModel
if (isCrab)      → CrabModel
if (isStarfish)  → StarfishModel
if (isOctopus)   → OctopusModel
if (isLobster)   → LobsterModel
if (isRay)       → RayModel
if (isWhiteShark)→ WhiteSharkCatch
else             → StandardFishModel (← de fleste fisk)
```

For editoren er **StandardFishModel** den vigtigste — det er den der bruger
LatheGeometry + bodyShape + tail + alle dekorative flags.

### 10.2 StandardFishModel geometri

Kroppen er en **LatheGeometry** (rotationslegeme) skaleret med:
```
<group scale={(config.scale || 1) * 0.55}>
  <mesh geometry={latheGeo} scale={[sz * 0.7, sy * 0.7, sx * 0.7]}>
```

Material:
```
meshPhysicalMaterial med:
  color, map (skæl-texture), normalMap,
  metalness (default 0.12), roughness (default 0.2),
  clearcoat: 0.35, clearcoatRoughness: 0.1,
  emissive: svag blå-lerp, emissiveIntensity: 0.06
```

### 10.3 CanvasTexture skæl-mønster

`getScaleTextures(color, quality)` genererer:
- Diffuse map: 192x192 canvas med radial gradient + rækker af skæl-cirkler
- Normal map: Tilsvarende med bump-data
- Cached pr. farve+kvalitet

Editoren bør bruge `'high'` kvalitet (256x256) da brugeren er tæt på fisken.

### 10.4 Creature-flags er indbyrdes eksklusive

I CuteFishModel checkes flags med if/else — kun ét creature-flag ad gangen.
Editoren skal **disabele** alle andre creature-type-felter når ét er valgt.
Brug dropdown i stedet for individuelle checkboxes for creature-types.

### 10.5 Farveformat

Three.js bruger hex-integers: `0xFF6A00` (ikke CSS-strings).
Color picker UI skal konvertere mellem CSS hex `#FF6A00` og integer `0xFF6A00`:
```typescript
const intToHex = (n: number) => '#' + (n >>> 0).toString(16).padStart(6, '0');
const hexToInt = (s: string) => parseInt(s.replace('#', ''), 16);
```

---

## Del 11: Dependencies (præcise versioner)

Brug disse versioner for at matche spillets rendering:

```json
{
  "dependencies": {
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "three": "^0.183.2",
    "@react-three/fiber": "^9.5.0",
    "@react-three/drei": "^10.7.7",
    "zustand": "^5.0.12"
  },
  "devDependencies": {
    "typescript": "~5.9.3",
    "@types/three": "latest",
    "@vitejs/plugin-react": "^6.0.1",
    "@tailwindcss/vite": "^4.2.2",
    "tailwindcss": "^4.2.2",
    "vite": "^8.0.1"
  }
}
```

---

## Del 12: Step-by-step byggeplan

Byg i denne rækkefølge:

1. **Projekt-setup**: Vite + dependencies + Tailwind + kopiér game-filer
2. **Zustand store**: Komplet state + actions + buildModelConfig
3. **FishPreview3D**: Canvas med CuteFishModel + OrbitControls + lys
4. **App layout**: Split-panel med dark theme
5. **BodyShapeControls**: 3 sliders + arketype-presets → verificer at 3D opdaterer live
6. **TailSelector**: Dropdown → verificer hale ændrer sig
7. **ColorControls**: Color picker + paletter → verificer farve opdaterer
8. **CreatureTypeSelect**: Dropdown → verificer creature-skift
9. **TraitToggles**: Checkboxes → verificer spots, stripes osv.
10. **MaterialControls**: metalness/roughness/emissive sliders
11. **MetaFields**: id, name, rarity, locations, requirements
12. **ExportPanel**: TypeScript output + validering + ID-kollision
13. **GalleryPanel**: Grid med alle fisk + load-funktion
14. **Polish**: Keyboard shortcuts, animations, responsivt layout

**Test efter hvert trin** ved at verificere at 3D-preview opdaterer korrekt.

---

## Opsummering

Resultatet skal være en webapp der:
- Lader mig **designe fisk visuelt** med **identisk 3D-rendering** som spillet
- Giver mig **komplet kontrol** over alle FishModelConfig-parametre via UI
- **Eksporterer præcis TypeScript-kode** klar til copy-paste i `src/data/fish.ts`
- **Advarer mig** hvis mit ID kolliderer med eksisterende fisk
- Lader mig **browse og redigere** eksisterende fisk fra spillet
- Kører som en standalone lokal webapp (Vite dev server)

Begynd med Del 1 og Del 2, og byg derefter stribevis fremad. Prioritér at 3D-preview
virker først — derefter UI-kontroller — derefter eksport — derefter galleri.
