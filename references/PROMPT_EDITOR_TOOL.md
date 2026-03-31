# PROMPT: Ændringer til dev fish editor (skabelon)

Kopiér blokken nedenfor til nye opgaver om **FishEditorPanel**, **useEditorStore** og editor-preview. Tilpas **Mål**-afsnittet til den konkrete opgave.

---

## Kontekst

**Regnefisken** — Vite/React, Three.js (v0.183), @react-three/fiber v9.

- **Dev editor:** `FishEditorPanel`, `useEditorStore`, preview i `src/three/editor/EditorFishPreview.tsx` (renderer `CuteFishModel` med samme `FishModelConfig` som spillet — **1:1** geometri og materialer; forskel er typisk kun belysning og kamera).

### Runtime-fisk (StandardFishModel) — vigtigt efter sphere-migration

Disse punkter gælder **ikke** specialmodeller (frø, krabbe, søstjerne, osv.), kun **`StandardFishModel`**-stien i `CuteFishModel.tsx`:

1. **Kropsgeometri:** Kroppen er **`SphereGeometry`** (via `createFishBodyGeometry` + `deformFishBody` i `cuteFishUtils.ts`), **ikke** længere `LatheGeometry`. Segment-tæthed styres af **`bodySegments`** (optional; **`bodyLatheSegments`** findes stadig som deprecated alias i `FishModelConfig` og mapper til samme betydning).

2. **Akser:** Krop skaleres som `scale={[sz * 0.7 * puffScale, sy * 0.7 * puffScale, sx * 0.7]}` med `bodyShape` = `[sx, sy, sz]` (bredde, højde, længde). Finner, øjne og hale er placeret relativt til denne sfære — redaktørens labels og sliders skal matche denne model (fx “krop-segmenter”, ikke “lathe”).

3. **Side- og bugfinner (triangulære finner):** Pectoral og pelvic bruger **`cylinderGeometry(0, r, h, 3)`** (3-sidet kegle). Flad profil: **`scale`** med lille X (fx `0.1 * sideFinScale` / `0.09 * pelvicFinScale`). **Spejling af højre side:** samme rotation som venstre, men **negativ `scale.x`** på højre mesh (ikke kun forskellig `rotation.z`), så trekanterne matcher venstre side.

4. **Rygfinne:** `dorsalY` og **`dorsalZScale`** (proportional med `sz` og `dorsalFinType`) styrer placering og dybde; simpel dorsal/cone kan have **`scale`** med Z inkl. `dorsalZScale`.

5. **Fin-materiale (opak):** `StandardFinMaterial` bruger **`meshPhysicalMaterial`** med **`clearcoat`** (ca. 0,6) og **`DoubleSide`** når finnen ikke er i “glas”-tilstand (`finOpacity` lavt). Fin-meshes har ofte **`renderOrder`** sat højere end kroppen for depth/clip.

6. **Animation:** `swimPreview` / `bucketIdle` / `editorSwimAnimation` styrer fin- og hale-animation; i editor er `editorMode` og `editorSwimAnimation` relevante.

Se også: `references/PROMPT_SPHERE_MIGRATION.md` (historisk plan), `references/PROMPT_FIN_UPGRADE.md` (fin-upgrade).

---

## Mål

Tre model/rendering-bugs i **StandardFishModel** (standard ny fisk med default-config) skal fikses:

### 1. Halefinne: forkert orientering (skal "lægges ned")

Halefinnen på en standard ny fisk står lodret op — den skal lægges ned (horisontalt), som om man justerer RZ → 90°.

- Alle hale-varianter i `tailNodes` (`forked`, `shark`, `flat`/`whip`, `eel`, `dino`, extruded-typer **og** default-fallback) skal have deres rotation justeret, så finnen ligger fladt (horisontal) i stedet for at stå lodret.
- For **extruded tails** (`isExtrudedTailType`) med nuværende `rotation={[0, Math.PI/2, 0]}`: tilføj `Math.PI/2` på Z-aksen (dvs. `rotation={[0, Math.PI/2, Math.PI/2]}`).
- For **cone-baserede** tails (default, forked, shark, flat/whip, eel, dino): justér tilsvarende, så keglen ligger ned i stedet for at stå op. Typisk: byt `rotation={[0, 0, Math.PI/2]}` til en rotation der lægger finnen ned.
- **Hale-animation** (`applyTailSwing`) skal justeres tilsvarende, så den svinger i den nye plan (venstre/højre).

### 2. Sidefinner: peger fremad (og er byttet om)

Pectoral-finnerne (leftFin/rightFin) peger fremad med deres spidse vinkel — de skal i stedet stå ud fra fisken (vinkelret på kroppen, spids bagud eller ud).

- Aktuelt: `rotation={[-Math.PI/2, 0, -Math.PI/2]}` med `cylinderGeometry(0, 0.42, 0.85, 3)` — 3-sidet kegle.
- Problemet er at finnerne sidder byttet om: venstre fin ser ud som den burde være højre og omvendt. Derudover peger spidsen fremad i stedet for at stå ud fra kroppen.
- Fix: justér rotation (og/eller byt sidernes position/rotation) så finnerne stikker ud til siderne med spidsen pegende bagud eller udad — **ikke** fremad.
- Bemærk: højre side bruger negativ `scale.x` til spejling (dette er korrekt og skal bevares); problemet ligger i base-rotation.
- Swim-animation (`leftFinRef`/`rightFinRef` rotation.z) skal matche den nye base-rotation.

### 3. Krops-mønster: grim synlig samling (seam) langs fiskens side

Fiskens body-pattern-texture giver en tydelig, grim streg/samling langs den ene side af fisken. Teksturen skal svøbes ("wraps") sømløst, ligesom i referencen `references/electric monster generator.html`.

**Årsager og løsning:**

1. **Canvas-dimensioner**: Skift fra kvadratisk `192×192` til **2:1 format** (fx `256×128` eller `512×256`) — dette matcher `SphereGeometry`s standard equirectangulære UV-mapping (u = longitude 0→1, v = latitude 0→1). Referencen bruger **512×256**.

2. **Seamless pattern-tegning**: Alle mønstre i `drawPatternLayer()` (i `cuteFishPatterns.ts`) skal tegne elementer med **seam-wrapping**: hvert element tegnes ved `x`, `x - w` og `x + w` (for elementer nær kanterne), så mønsteret flyder sømløst rundt om sfæren. Se referencens `drawPattern()` funktion for eksempler:
   - **spots/koi/trout/marble/labyrinth/leopard**: `for (wx = -1; wx <= 1; wx++) { draw(x + wx*w, y, …) }`
   - **stripes/waves/scales/net**: sørg for at spacing deler canvas-bredden eksakt (`N = round(w / rawSpacing); spacing = w / N`)
   - **neon**: sinus-frekvens = `2·π·k/w` så den wrapper perfekt

3. **Opdatér kald-stedet** i `CuteFishModel.tsx`: `generateBodyDiffuseMap({ …, width: 512, height: 256 })` (i stedet for `192, 192`).

4. **Glimmer-mask** (`createGlimmerEmissiveMask`): brug også 2:1 format og seam-wrap glimmerpunkter.

**Bemærk**: `getScaleTextures` (hvid diffuse + normal map) bør ligeledes opdateres til 2:1 format i `drawScaleCanvas`, men dette er sekundært — prioritér body-pattern-seam.

---

## Afgrænsning (SKAL overholdes)

- Ændr kun filer under **`src/components/editor/`**, **`src/three/editor/`**, og evt. **`src/store/useEditorStore.ts`**, **UNLESS** du eksplicit beder om **model** (`src/three/models/…`, `cuteFishUtils.ts`) eller **typer** (`src/types/fish.ts`).

- Rør **IKKE** `src/data/fish.ts` eller **`CATCH_MASTER_DATA`** medmindre du eksplicit beder om det.

- **Nye felter i `FishModelConfig`** (hvis nødvendigt): **optional**, bagudkompatibel, **pixel-identisk** når feltet er `undefined`.

- **Editor-UI:** dansk; **`import.meta.env.DEV`** hvor det giver mening (gating, dev-only features).

- Kør **`tsc --noEmit`** (PowerShell: `Set-Location` til projektroden, derefter `npx tsc --noEmit` — **ikke** `&&` i samme linje) og beskriv kort hvad der er verificeret.

**Undgå:** drive-by refactors i `App.tsx` / `Experience.tsx` undtagen det der **direkte** understøtter opgaven.

---

## Ekstra: hvis opgaven kræver model-ændringer

Hvis du bevidst skal ændre **StandardFishModel** (geometri, materialer, finner), så angiv det eksplicit i prompten og begræns scope til **`CuteFishModel.tsx`** / **`cuteFishUtils.ts`** som i de øvrige `references/PROMPT_*.md` — ikke bland editor- og model-refactors uden grund.
