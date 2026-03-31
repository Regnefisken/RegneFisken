# PROMPT: Migrér fiskekrop fra LatheGeometry til SphereGeometry

## Kontekst

Regnefisken — Vite/React, Three.js (v0.183), @react-three/fiber v9.
Reference-inspiration: `C:\Users\ander\regnefisken\references\electric monster generator.html`
Legacy monolith (identisk krops-arkitektur): `C:\Users\ander\regnefisken\legacy-game.html`

### Baggrund — hvad der er galt

Fiskens krop i spillet bruger `LatheGeometry` med en manuelt defineret profilkurve (`createFishLatheGeometry` i `cuteFishUtils.ts`). Denne tilgang har tre fundamentale problemer:

1. **Flad snude**: Profilens endepunkter lukker ikke til nul (de er 0.015 og 0.01), hvilket skaber en lille flad skive ved snuden. Med 16 segmenter er springet fra næstsidste ring (radius ≈ 0.23) til spidsen (0.01) så brat at snuden ser kegleformet/stump ud.

2. **Farve × tekstur-multiplikation**: Skælteksturen (`drawScaleCanvas`) bager kropsfarven ind i canvas-billedet. Materialet sætter **også** `color` til kropsfarven. I THREE.js ganges `material.color × map.rgb` — resultatet er farve², dvs. fisken er ca. halvt så lys som den burde.

3. **Fejlagtig emissive**: Der tilføjes altid `emissive = bodyColor.lerp(0x4488ff, 0.08)` med `emissiveIntensity = 0.06`, selv for helt normale fisk. Legacy gør dette kun for fisk med eksplicit `config.emissive` eller ultra-kvalitet.

### Referencemodel — electric monster generator

Referencen bruger `SphereGeometry(1, detail, hSegs)` skaleret med `body.scale.set(scaleX, scaleY, scaleZ)`. Deformation sker via `deformBodyGeometry(geometry, shapeType)` direkte på vertices — **efter** skalering, på geometry-niveau. Se linje 2428–2432 og 1991–2034 i referencen.

Kroppen i legacy bruger **identisk** LatheGeometry som den nuværende kode (kopieret ved refactor). For **lav** kvalitet bruger legacy allerede `SphereGeometry(1, segs, segs/2)`.

## Mål

Migrér fiskekroppen fra `LatheGeometry` til `SphereGeometry` i stil med referencen, for **både** spillets runtime-fisk **og** dev fish editor.

## Scope: KUN `StandardFishModel`

I `CuteFishModel.tsx` dispatcher `CuteFishModel()`-funktionen (linje ~330–500) til specialmodeller via early-return `if (config.isX)` guards. **Kun** den allersidste codepath — `<StandardFishModel>` (linje ~490) — bruger LatheGeometry og skal ændres.

**Følgende modeller/funktioner MÅ IKKE røres overhovedet:**
- `StarfishModel` (søstjerne)
- `FrogModel` (frø)
- `CrabModel` (krebs)
- `OctopusModel` (blæksprutte)
- `LobsterModel` (hummer)
- `RayModel` (rokke)
- `WhiteSharkCatch` (hvidhaj)
- `GoldenCarpCatch` (guldkarpe)
- `BottleModel` (flaskepost)
- `OysterModel` (østers)
- `ConchModel` (konkylie)
- `FossilModel` (fossil)
- Alle modeller i `bossCatchMiniModels.tsx` (plesiosaurus, axolotl, gnavne gorm)
- `Kraken`, `Soeuhyre`, `Brandmand`, `Spirit`, `GoldenFrog` (separate filer)
- `GiantLandTurtle`, `ArcticPenguin`, `SoeuhyreAmbient`, `HarborRat` (miljø-modeller)
- `Bobber.tsx` (flåd — har sin egen LatheGeometry)

Disse modeller fungerer **fint** og er ikke berørt af de tre bugs der beskrives herover. Bugs eksisterer kun i `StandardFishModel` (body material + body geometry).

## Afgrænsning (SKAL overholdes)

- Rør **IKKE** `src/data/fish.ts` eller `CATCH_MASTER_DATA` medmindre jeg eksplicit beder om det.
- Rør **IKKE** nogen af specialmodellerne listet ovenfor — hverken kode, import, props eller rendering.
- Rør **IKKE** modeller/3D-objekter der ikke er fisk (skyer, vand, grotte, hytte, scenery, belysning, partikler, etc.).
- `FishModelConfig`-ændringer: kun optional felter, bagudkompatibel, pixel-identisk adfærd når feltet er undefined.
- Editor-UI: dansk, `import.meta.env.DEV` hvor det giver mening.
- Kør `tsc --noEmit` efter hvert trin (brug `Set-Location c:\Users\ander\regnefisken; npx tsc --noEmit` — **ikke** `&&` i PowerShell).
- Undgå drive-by refactors i `App.tsx` / `Experience.tsx`.

## Trinvis plan — gennemfør ét trin ad gangen

### Trin 1: Fix farve-multiplikation (utils)

Fil: `src/three/models/cuteFishUtils.ts`

- I `getScaleTextures`: kald `drawScaleCanvas` med farve `0xffffff` (hvid) for diffuse-map i stedet for kropsfarven. Normal-map skal stadig bruge `#8080ff`. Skældetaljerne (highlights, skygger, outlines) tegnes stadig — men på hvid baggrund, så materialets `color`-felt styrer den faktiske farve.
- **Alternativ**: Behold farve i canvas men sæt `color: 0xffffff` i materialet. Vælg den tilgang der kræver færrest ændringer i kode der **ikke** ejes af dette trin.
- Sørg for at texture-cache-nøgler stadig inkluderer kropsfarven (fordi normal-map og evt. andre ting afhænger af den).

Kør `tsc --noEmit`. Beskriv kort ændringen.

### Trin 2: Fix emissive (CuteFishModel)

Fil: `src/three/models/CuteFishModel.tsx` → `StandardFishModel`

Find body-materialets `<meshPhysicalMaterial>` (ca. linje 1784+). Ændr:

```tsx
// FØR (forkert — tilføjer altid glow):
emissive={new Color(bodyColor).lerp(new Color(0x4488ff), 0.08)}
emissiveIntensity={0.06}

// EFTER (korrekt — kun glow hvis config.emissive er sat):
emissive={config.emissive != null ? new Color(config.emissive) : 0x000000}
emissiveIntensity={config.emissive != null ? (config.emissiveIntensity ?? 0.45) : 0}
```

Bevar `bioOn`-logikken (bioluminescent override) og `bodyGlimmerMat` spread uændret — de skal have prioritet. Bevar `chameleonMode` i `useFrame`.

Kør `tsc --noEmit`. Beskriv kort ændringen.

### Trin 3: Erstat LatheGeometry med SphereGeometry (utils)

Fil: `src/three/models/cuteFishUtils.ts`

- Omdøb `createFishLatheGeometry` → `createFishBodyGeometry` (eller alias — den gamle signatur skal stadig eksistere midlertidigt så `Bobber.tsx` ikke bryder).
- Ny implementation:

```ts
export function createFishBodyGeometry(segments = 16): SphereGeometry {
  const hSegs = Math.max(8, segments >> 1);
  const geo = new SphereGeometry(1, segments, hSegs);
  geo.computeVertexNormals();
  return geo;
}
```

- **VIGTIGT**: `Bobber.tsx` importerer `LatheGeometry` direkte til flådet — den har sin egen lathe og skal **ikke** ændres.
- Omdøb `deformFishLatheBody` → `deformFishBody` og tilpas: den arbejder nu på en enhedskugle i stedet for lathe-koordinater. Deformations-koden skal matche **referencens** `deformBodyGeometry` (linje 1991–2034 i electric monster generator), dvs.:
  - `v.z` er kroppen langs-akse (frem/bagud), **ikke** `v.x`.
  - `v.y` er op/ned.
  - `v.x` er siden.
  - Alternativt: rotér geometrien først med `rotateY(Math.PI/2)` og behold x = længde-akse — men beskriv og begrund valget.
- Omdøb `normalizeBodyLatheSegments` → `normalizeBodySegments` (brug `replace_all`).
- Omdøb `DEFAULT_BODY_LATHE_SEGMENTS` → `DEFAULT_BODY_SEGMENTS`.
- Opdatér al JSDoc/kommentarer så de siger "sphere" i stedet for "lathe".

Kør `tsc --noEmit` — fix alle fejl der opstår pga. rename.

### Trin 4: Opdatér StandardFishModel til SphereGeometry

Fil: `src/three/models/CuteFishModel.tsx` — **KUN** funktionen `StandardFishModel` (ca. linje 1498+) og dens hjælpefunktioner (`StandardFishEyes`, `StandardFishMouthTeeth`, `StandardFinMaterial`).

**Rør IKKE** nogen af specialmodellerne (StarfishModel, FrogModel, CrabModel, OctopusModel, LobsterModel, RayModel, WhiteSharkCatch, GoldenCarpCatch, BottleModel, OysterModel, ConchModel, FossilModel) eller dispatch-logikken i `CuteFishModel()`.

- Importér de nye navne (`createFishBodyGeometry`, `deformFishBody`, `normalizeBodySegments`, `DEFAULT_BODY_SEGMENTS`). Fjern gamle imports.
- I `StandardFishModel`:
  - Erstat `latheGeo` useMemo til at kalde `createFishBodyGeometry(bodySegments)` + `deformFishBody(geo, bodyProfile)`.
  - `body.scale` skal matche legacy: `scale={[sz * 0.7 * puffScale, sy * 0.7 * puffScale, sx * 0.7]}`.
  - Verificér at akserne er korrekte: snude (positiv Z eller positiv X afhængig af rotation-valg i trin 3) peger korrekt i forhold til øjne, hale, finner.
  - Hvis akserne er ændret: opdatér øje-positioner, fin-positioner, hale-positioner tilsvarende **kun inden for StandardFishModel**. Brug referencens `positionEyes` (linje 2143–2165 i referencen) som rettesnor.
- `deformUnitFishBodyDirection` (bruges af `PufferSpikesInstanced` i `cuteFishExtremeEffects.tsx`): opdatér til at matche nye akser.
- `applyBodyProfileToEyePosition`: opdatér til at matche nye akser.
- `pelvicFinYFactor`: bør være uændret (Y er stadig op).

Kør `tsc --noEmit`.

### Trin 5: Opdatér Editor-UI

Filer:
- `src/components/editor/EditorBodyControls.tsx`
- `src/components/editor/EditorExport.tsx`
- `src/types/fish.ts`

- Omdøb `bodyLatheSegments` → `bodySegments` i `FishModelConfig` (optional, bagudkompatibelt — behold `bodyLatheSegments` som deprecated alias midlertidigt eller skriv migration).
- Opdatér `EditorBodyControls.tsx`: labels fra "Lathe-segmenter" til "Krop-segmenter". Importér nye navne.
- Opdatér `EditorExport.tsx`: eksport bruger nye navne.
- Slider i editor: min=8, max=32, step=2 (lige tal for sphere-symmetri, som før).

Kør `tsc --noEmit`.

### Trin 6: Verifikation og oprydning

- Kør `tsc --noEmit` en sidste gang.
- Fjern eventuelt ubrugte imports/funktioner der kun relaterede til LatheGeometry i `cuteFishUtils.ts` (men **ikke** Bobber.tsx's egne lathe-funktioner).
- Beskriv kort hvad der er testet og hvad der bør visuelt verificeres (form, farvemætning, emissive, deformationer).

## Filer der berøres (forventet)

| Fil | Ændring |
|---|---|
| `src/three/models/cuteFishUtils.ts` | Farve-fix, Sphere, renames |
| `src/three/models/CuteFishModel.tsx` | Sphere import, emissive fix, aksejustering |
| `src/three/models/cuteFishExtremeEffects.tsx` | Rename import (deformUnitFishBodyDirection) |
| `src/components/editor/EditorBodyControls.tsx` | Rename imports + labels |
| `src/components/editor/EditorExport.tsx` | Rename imports + eksportlogik |
| `src/types/fish.ts` | `bodyLatheSegments` → `bodySegments` |
| `src/components/editor/editorConstants.ts` | Evt. opdatering af kommentarer |

## Filer der IKKE skal røres

- `src/data/fish.ts`, `CATCH_MASTER_DATA`
- `src/three/models/Bobber.tsx` (egen LatheGeometry til flåd)
- `src/three/models/bossCatchMiniModels.tsx` (plesiosaurus, axolotl, gnavne gorm)
- `src/three/models/Kraken.tsx`, `Soeuhyre.tsx`, `SoeuhyreAmbient.tsx`, `Brandmand.tsx`
- `src/three/models/Spirit.tsx`, `GoldenFrog.tsx`, `GiantLandTurtle.tsx`
- `src/three/models/HarborRat.tsx`, `ArcticPenguin.tsx`, `SeagullFeather.tsx`
- `src/three/models/junkAndTreasureModels.tsx`
- `src/three/models/FishModel.tsx` (simpel fallback-kugle — bruges kun når CUTE_FISH_CONFIG mangler)
- `src/three/effects/*` (vand, skyer, vejr, belysning, partikler)
- `src/three/environments/*` (grotte, pier, ø, hytte, scenery)
- `App.tsx`, `Experience.tsx`, `GameCanvas.tsx`
- `src/store/useEditorStore.ts` (medmindre typer kræver det)
- Specialmodel-funktionerne **inden i** `CuteFishModel.tsx`: StarfishModel, FrogModel, CrabModel, OctopusModel, LobsterModel, RayModel, WhiteSharkCatch, GoldenCarpCatch, BottleModel, OysterModel, ConchModel, FossilModel
