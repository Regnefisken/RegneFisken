# PROMPT: Opgradér finner til at matche electric monster generator

## Kontekst

Regnefisken — Vite/React, Three.js (v0.183), @react-three/fiber v9.
Reference-inspiration: `C:\Users\ander\regnefisken\references\electric monster generator.html`

### Baggrund — hvad der er galt

Fiskens finner i spillet bruger simple `coneGeometry`-meshes, som giver runde, tykke, livløse finner. Referencen bruger flade `CylinderGeometry(0, r, h, 3)`-former (3-sidede kegler) med X-skala ~0.1, som giver tynde, naturlige fin-silhuetter. Derudover mangler animation af sidefinner og bugfinner, fin-teksturer/mønstre, og korrekt positionering relativt til kroppen.

## Scope: KUN `StandardFishModel` og relaterede utils

**Følgende modeller/funktioner MÅ IKKE røres overhovedet:**
- `StarfishModel`, `FrogModel`, `CrabModel`, `OctopusModel`, `LobsterModel`, `RayModel`
- `WhiteSharkCatch`, `GoldenCarpCatch`, `BottleModel`, `OysterModel`, `ConchModel`, `FossilModel`
- Alle modeller i `bossCatchMiniModels.tsx`
- `Kraken`, `Soeuhyre`, `Brandmand`, `Spirit`, `GoldenFrog` (separate filer)
- `GiantLandTurtle`, `ArcticPenguin`, `SoeuhyreAmbient`, `HarborRat` (miljø-modeller)
- `Bobber.tsx` (flåd)

## Afgrænsning (SKAL overholdes)

- Rør **IKKE** `src/data/fish.ts` eller `CATCH_MASTER_DATA`.
- Rør **IKKE** nogen af specialmodellerne listet ovenfor.
- `FishModelConfig`-ændringer: kun optional felter, bagudkompatibel.
- Editor-UI: dansk, `import.meta.env.DEV` for avancerede controls.
- Kør `tsc --noEmit` efter hvert trin (brug `Set-Location c:\Users\ander\regnefisken; npx tsc --noEmit` — **ikke** `&&` i PowerShell).

## Trinvis plan — gennemfør ét trin ad gangen

### Trin 1: Opgradér pectoral (side) fin geometri og position

Fil: `src/three/models/CuteFishModel.tsx` → `StandardFishModel` (PartGroup `leftFin` og `rightFin`)

**FØR** (nuværende):
```tsx
<mesh position={[sz * 0.12, -sy * 0.28, sx * 0.7]} rotation={[0.5, 0, 0.6]}>
  <coneGeometry args={[0.15, 0.55, 7]} />
```

**EFTER** (som referencen):
- Erstat `coneGeometry` med `cylinderGeometry args={[0, 0.42, 0.85, 3]}` (3-sidet kegle = trekantet finne).
- **Skala**: `scale={[0.1 * sideFinScale, sideFinScale, sideFinScale]}` — X flad (0.1), Y/Z = sideFinScale.
- **Position**: `[sz * 0.28, -sy * 0.15, ±sx * 0.68]` — sidder på kroppens overflade (Z = bodyScaleZ * 0.28 fra referencen matcher sz-aksen her, da vi har rotateY(π/2) i sphere-geometrien; vores mesh-X = referencens Z).
- **Rotation** (højre): `[-Math.PI/2, 0, Math.PI/2]`, (venstre): `[-Math.PI/2, 0, -Math.PI/2]`.
- Ret op i begge PartGroups (leftFin og rightFin).

Kør `tsc --noEmit`.

### Trin 2: Opgradér pelvic (bug) fin geometri og position

Fil: `src/three/models/CuteFishModel.tsx` → `StandardFishModel` (PartGroup `pelvicFins`)

- Erstat `coneGeometry args={[0.1, 0.38, 6]}` med `cylinderGeometry args={[0, 0.38, 0.78, 3]}`.
- **Skala**: `scale={[0.09 * pelvicFinScale, pelvicFinScale * 0.82, pelvicFinScale * 0.95]}`.
- **Position**: `[sz * 0.08, -sy * 0.42 * pelvicYFactor, ±sx * 0.4]` (Z = bodyScaleZ * 0.08 i referencen).
- **Rotation** (højre): `[Math.PI/2 - 0.65, 0, -0.2]`, (venstre): `[Math.PI/2 - 0.65, 0, 0.2]`.

Kør `tsc --noEmit`.

### Trin 3: Tilføj fin-animation (pectoral + pelvic)

Fil: `src/three/models/CuteFishModel.tsx` → `StandardFishModel`

- Tilføj `useRef` for venstre/højre pectoral fin mesh og venstre/højre pelvic fin mesh.
- I den eksisterende `useFrame`:

```tsx
// Pectoral fin flapping (som reference: sin(t*freq + 0.5) * 0.5)
const flap = Math.sin(t * speed * 2 + 0.5) * 0.5;
if (rightFinRef.current) rightFinRef.current.rotation.z = Math.PI / 2 + flap;
if (leftFinRef.current) leftFinRef.current.rotation.z = -Math.PI / 2 - flap;

// Pelvic fin sway (som reference: wave * 0.16)
const wave = Math.sin(t * speed * 2) * 0.35; // genbruger tail wave
if (rightPelvicRef.current) rightPelvicRef.current.rotation.z = -0.2 + wave * 0.16;
if (leftPelvicRef.current) leftPelvicRef.current.rotation.z = 0.2 - wave * 0.16;
```

- Animationen skal respektere `swimPreview` / `bucketIdle` (samme guard som hale-animation).
- Animation skal IKKE ske i `editorMode` medmindre `editorSwimAnimation` er true.

Kør `tsc --noEmit`.

### Trin 4: Opgradér dorsal fin positionering

Fil: `src/three/models/CuteFishModel.tsx` → `StandardFishModel`

Nuværende dorsal position er `[sz * 0.15, sy * 0.68, 0]`. Opdatér til referencens logik:

```tsx
// Dorsal Z-skala proportional med kropslængde (som reference: bodyScaleZ * 0.45 * scale)
const dorsalZScale = sz * 0.45 * (dorsalFinType ? 1 : 0.6);

// Position med auto-embed (som reference)
const autoEmbed = (dorsalFinType ? 1 : 0.6) * 0.04;
const dorsalY = sy * (0.85 - autoEmbed - (config.dorsalFinEmbed ?? 0) * 0.95);
```

Opdatér mesh position og tilføj `scale` der inkluderer `dorsalZScale` i Z-retningen.

Bevar den eksisterende `dorsalExtraTilt` logik (tapered: 0.04, tadpole: 0.06).

Kør `tsc --noEmit`.

### Trin 5: Opgradér `StandardFinMaterial` med `DoubleSide` og `clearcoat`

Fil: `src/three/models/CuteFishModel.tsx` → `StandardFinMaterial`

- I opak-mode: skift fra `meshStandardMaterial` til `meshPhysicalMaterial` med `clearcoat={0.6}` og `side={DoubleSide}`.
- Tilføj `renderOrder={10}` på alle fin-meshes (sidefinner, bugfinner, dorsal, hale) for korrekt depth-clipping mod kroppen.
- Bevar den eksisterende glas-mode (finOpacity < 0.95) uændret.

Kør `tsc --noEmit`.

### Trin 6: Tilføj fin-textur/mønster-system (valgfrit, avanceret)

Filer:
- `src/three/models/cuteFishUtils.ts` (eller ny `cuteFishFinTexture.ts`)
- `src/types/fish.ts`
- `src/components/editor/EditorFinControls.tsx`

Tilføj optional felter til `FishModelConfig`:
```ts
finPattern?: 'solid' | 'stripes' | 'hstripes' | 'spots' | 'waves';
finPatternColor?: number;
finPatternScale?: number;
```

Opret `generateFinTexture(color, pattern, patternColor, patternScale)` der returnerer en `CanvasTexture` (512×256) som bruges i `StandardFinMaterial` via `map` prop.

Editor: tilføj dropdown for finPattern og color-picker for finPatternColor i `EditorFinControls.tsx` (dansk labels).

**Udelad dette trin hvis det bliver for stort** — det er en nice-to-have.

Kør `tsc --noEmit`.

### Trin 7: Verifikation og oprydning

- Kør `tsc --noEmit` en sidste gang.
- Beskriv hvad der er ændret og hvad der bør visuelt verificeres:
  - Sidefinner: tynde, flade, flapper op/ned
  - Bugfinner: tynde, flade, svajende
  - Dorsal: proportional med kropslængde
  - Fin-materiale: clearcoat-glans, dobbeltsidet, korrekt depth-ordering
  - Alle body-profiles (tapered, tadpole, flatBelly, boxfish, ray): finner sidder korrekt
  - Bucket-idle vs. svøm-animation: finner animeres korrekt

## Filer der berøres (forventet)

| Fil | Ændring |
|---|---|
| `src/three/models/CuteFishModel.tsx` | Fin geometri, position, animation, material, renderOrder |
| `src/types/fish.ts` | Evt. nye optional felter (finPattern m.m.) |
| `src/components/editor/EditorFinControls.tsx` | Evt. nye editor controls |

## Filer der IKKE skal røres

- `src/data/fish.ts`, `CATCH_MASTER_DATA`
- `src/three/models/Bobber.tsx`
- `src/three/models/bossCatchMiniModels.tsx`
- `src/three/models/Kraken.tsx`, `Soeuhyre.tsx`, `SoeuhyreAmbient.tsx`, `Brandmand.tsx`
- `src/three/models/Spirit.tsx`, `GoldenFrog.tsx`, `GiantLandTurtle.tsx`
- `src/three/models/HarborRat.tsx`, `ArcticPenguin.tsx`, `SeagullFeather.tsx`
- `src/three/models/junkAndTreasureModels.tsx`
- `src/three/models/FishModel.tsx`
- `src/three/effects/*`, `src/three/environments/*`
- `App.tsx`, `Experience.tsx`, `GameCanvas.tsx`
- Specialmodel-funktionerne **inden i** `CuteFishModel.tsx`
