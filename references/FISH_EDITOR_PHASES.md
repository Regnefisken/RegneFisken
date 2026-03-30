# Fish Editor — Faseplan med testinstruktioner

> Denne guide beskriver implementeringen af Fish Editor (dev-mode) opdelt i **3 faser** med **logiske trin** og **konkrete test-instruktioner** for hvert trin.
>
> **Henvisning:** Fuld spec → `references/PROMPT_FISH_EDITOR_DEVMODE.md`
>
> **Brug:** Start en ny chat og sig f.eks. *"Implementér Fase 1, Trin 3 fra `references/FISH_EDITOR_PHASES.md`"*

---

## Fase 1: Fungerende editor-shell (preview + controls + export)

Målet er en **brugbar editor** der kan vise enhver fisk i 3D, justere alle config-felter, og eksportere klar-til-brug TypeScript. Ingen per-del klik/drag endnu.

---

### Fase 1 · Trin 1: Typeudvidelse

**Filer:**
- `src/types/fish.ts`

**Opgave:**
Tilføj `partAdjustments` som optional felt til `FishModelConfig`:

```typescript
partAdjustments?: {
  [partName: string]: {
    dx?: number; dy?: number; dz?: number;
    sx?: number; sy?: number; sz?: number;
  };
};
```

**Test:**
1. Kør `npx tsc --noEmit` — ingen fejl
2. Åbn `src/data/fish.ts` og bekræft at eksisterende fisk-entries IKKE klager over manglende `partAdjustments` (feltet er optional)
3. Prøv midlertidigt at tilføje `partAdjustments: {}` til én fisk i `fish.ts` — ingen fejl. Fjern igen

---

### Fase 1 · Trin 2: Zustand editor-store

**Filer:**
- `src/store/useEditorStore.ts` *(ny fil)*

**Opgave:**
Opret store med state og actions som beskrevet i specens DEL 3. Nøgle-elementer:
- `isOpen`, `mode` ('edit' | 'create'), `selectedFishId`, `originalConfig`, `configOverride`
- `newFishMeta` (id, name, rarity, type, primaryAreas, itemType)
- `selectedPart` (string | null)
- Actions: `toggle`, `close`, `setMode`, `selectFish`, `updateConfig`, `updatePartAdjustment`, `selectPart`, `resetConfig`, `setNewFishMeta`, `startNewFish`, `cloneFromExisting`

**Test:**
1. `npx tsc --noEmit` — ingen fejl
2. Åbn browser-konsollen og kør:
   ```js
   // Importér store (Vite hot-module)
   const { useEditorStore } = await import('/src/store/useEditorStore.ts');
   const s = useEditorStore.getState();
   console.log(s.isOpen); // false
   s.toggle();
   console.log(useEditorStore.getState().isOpen); // true
   s.selectFish('fisk_torsk');
   console.log(useEditorStore.getState().configOverride); // torsk-config
   s.resetConfig();
   s.toggle();
   ```
3. Bekræft at `selectFish` med et ugyldigt id ikke crasher (returnerer tidligt)

---

### Fase 1 · Trin 3: Editor 3D preview-komponent

**Filer:**
- `src/three/editor/EditorFishPreview.tsx` *(ny fil)*

**Opgave:**
Opret R3F-komponent som beskrevet i specens DEL 4:
- Aflæser `useEditorStore` state (isOpen, selectedFishId, config, mode, selectedPart)
- Renderer `CuteFishModel` med den aktuelle `configOverride`
- OrbitControls til fri rotation/zoom
- Grid-gulv som reference
- Mørk baggrund (`#1a1a2e`)
- Neutral belysning (ambient + 2 directional)

**Bemærk:** Send `editorMode`, `selectedPart`, `onPartClick` som props allerede nu — de ignoreres af `CuteFishModel` indtil Fase 2, men gør det nemt at tilkoble senere.

**Test:**
Kan ikke testes isoleret endnu — kræver Trin 4 (mounting). Gå videre.

---

### Fase 1 · Trin 4: Mount i App.tsx og Experience.tsx

**Filer:**
- `src/App.tsx` *(ændring)*
- `src/three/Experience.tsx` *(ændring)*

**Opgave i `App.tsx`:**
1. Tilføj `useEffect` med `Ctrl+Shift+E` keyboard listener (bag `import.meta.env.DEV`)
2. Mount `<FishEditorPanel />` (fra Trin 5) bag `import.meta.env.DEV` efter `<ModalLayer />`
   - Panelet eksisterer ikke endnu — opret en minimal placeholder: `export function FishEditorPanel() { return null; }` i `src/components/editor/FishEditorPanel.tsx`

**Opgave i `Experience.tsx`:**
1. Importér `EditorFishPreview` og `useEditorStore`
2. Tilføj `editorOpen` variabel: `const editorOpen = import.meta.env.DEV ? useEditorStore((s) => s.isOpen) : false;`
3. Wrap hele den eksisterende scene i `{!editorOpen && (<>...</>)}`
4. Tilføj `{editorOpen && <EditorFishPreview />}` øverst i returnblokken

**Test:**
1. Start dev-server (`npm run dev`)
2. Åbn spillet i browseren — alt skal fungere **præcis** som før
3. Tryk `Ctrl+Shift+E` — scenen forsvinder, erstattet af mørk baggrund + grid
4. Tryk `Ctrl+Shift+E` igen — spillet er tilbage, uændret
5. I konsollen: `useEditorStore.getState().selectFish('fisk_torsk')` → Intet visuelt endnu (panelet er placeholder)
6. Bekræft: **Ingen** konsoladvarsler eller fejl under toggle

---

### Fase 1 · Trin 5: FishEditorPanel — hovedpanel med fisk-vælger

**Filer:**
- `src/components/editor/FishEditorPanel.tsx` *(erstat placeholder)*
- `src/components/editor/EditorFishSelector.tsx` *(ny fil)*

**Opgave — `FishEditorPanel.tsx`:**
- `fixed right-0 top-0 bottom-0 w-96` panel, mørk glasmorfisme (`bg-gray-900/90 backdrop-blur-md`), `z-[99999]`, `overflow-y-auto`
- Header med titel, mode-toggle, luk-knap (Escape lukker også)
- Indeholder `<EditorFishSelector />` + placeholder-sektioner for de næste trin
- Vises kun når `useEditorStore.isOpen === true`

**Opgave — `EditorFishSelector.tsx`:**
- Edit-mode: `<select>` dropdown med alle `CATCH_MASTER_DATA` entries der har `model !== null`, grupperet i `<optgroup>` efter rarity
- Option-tekst: `"name (id)"`
- Ved valg → `selectFish(id)` + fisken vises i 3D preview
- "Klonér til ny" knap → `cloneFromExisting(id)`
- Create-mode: Input-felter for `id`, `name`, rarity-dropdown, type-dropdown, `itemType`-dropdown, `primaryAreas` checkboxes
- Arketyp-preset-knapper ("Standard fisk", "Ål", "Fladfisk", "Krabbe", "Blæksprutte")

**Test:**
1. `Ctrl+Shift+E` — panelet vises til højre
2. Vælg "Torsk (fisk_torsk)" i dropdown → **fisken renderes i 3D** med OrbitControls
3. Mus-drag i 3D-viewporten → orbit rotation virker
4. Scroll-hjul → zoom ind/ud
5. Skift til en anden fisk (f.eks. en krabbe eller blæksprutte) → modellen skifter
6. Klik "Opret ny" → create-mode med tomme felter
7. Klik preset "Ål" → en lang, tynd fisk vises i preview
8. Klik "Klonér til ny" (i edit-mode med torsk valgt) → skifter til create med torsk-kopi
9. `Escape` → panelet lukker

---

### Fase 1 · Trin 6: Body, farve og hale-kontroller

**Filer:**
- `src/components/editor/EditorBodyControls.tsx` *(ny fil)*
- `src/components/editor/EditorColorControls.tsx` *(ny fil)*
- `src/components/editor/FishEditorPanel.tsx` *(tilføj sektioner)*

**Opgave — `EditorBodyControls.tsx`:**
- Sliders: `bodyShape[0]` (Bredde), `bodyShape[1]` (Højde), `bodyShape[2]` (Længde) — range 0.1–3.0, step 0.05
- Sliders: `scale` (0.1–3.0), `speed` (0.1–5.0)
- Dropdown: `tail` med alle `TailType` values

**Opgave — `EditorColorControls.tsx`:**
- `color`: color picker + hex-tekst + "null (random)"-checkbox
- `bellyColor`: optional color picker med enable-checkbox
- `emissive` + `emissiveIntensity`: optional color picker + slider

**Opgave — tilføj til `FishEditorPanel`:**
- Monter `<EditorBodyControls />` og `<EditorColorControls />` i sammenklappelige `<details>/<summary>`-sektioner

**Test:**
1. Vælg en fisk → 3D preview vises
2. Flyt `bodyShape[0]` slider til 2.5 → fisken bliver **tydeligt** bredere i realtid
3. Flyt `bodyShape[2]` slider til 0.5 → fisken bliver kort
4. Ændr `color` til rød → fisken skifter farve i realtid
5. Skift `tail` til `forked` → haleformen ændres
6. Slå `emissive` til + sæt grøn → fisken glør grønt
7. Klik "Nulstil" → fisken vender tilbage til sin originale config
8. Sammenklap en sektion (klik `<summary>`) → sektionen folder

---

### Fase 1 · Trin 7: Feature-flags og creature-type

**Filer:**
- `src/components/editor/EditorFeatureToggles.tsx` *(ny fil)*
- `src/components/editor/FishEditorPanel.tsx` *(tilføj sektion)*

**Opgave — `EditorFeatureToggles.tsx`:**
- **Creature Type** radio buttons (eksklusiv): Standard fisk, Frø, Søstjerne, Krabbe, Blæksprutte, Hummer, Rokke, Hvidhaj, Guldkarpe, Flaske, Østers, Konkylie, Fossil
  - Ved skift: sæt ALLE creature-flags til `undefined`, sæt det valgte til `true`
- **Standard Fish Features** checkboxes: `flat`, `stripes`, `redFins`, `isEel`, `longBeak`, `spikes`, `uglyHead`, `isPiranha`, `finUp`, `sword`, `whiskers`, `lure`, `noEyes`, `isDino`, `isBossGorm`
- **Spots**: checkbox on/off + radio for `spots: true` vs `spots: <number>` med color picker
- **Materiale**: `metalness` slider (0–1), `roughness` slider (0–1)
- **Avanceret**: `maxDisplayScale`, `scaleCurve`, `openAngle`, `hasPearl`, `thinLegs`, `isGoldenFrog`

**Test:**
1. Vælg "fisk_torsk" → standard fisk
2. Klik creature type "Krabbe" → modellen skifter til krabbe-rendering
3. Klik "Standard fisk" igen → modellen er fisk igen
4. Slå `stripes` til → streger vises på fisken
5. Slå `spikes` til → pigge vises på ryggen
6. Slå `lure` til → lystfisker-lampe vises på hovedet
7. Skift creature type til "Hummer" → `stripes`/`spikes`/`lure` har ingen visuel effekt (korrekt, de er StandardFishModel-specifikke)
8. Sæt `metalness` til 1.0, `roughness` til 0.0 → fisken ser spejlblank/metallisk ud

---

### Fase 1 · Trin 8: Eksport-funktionalitet

**Filer:**
- `src/components/editor/EditorExport.tsx` *(ny fil)*
- `src/components/editor/FishEditorPanel.tsx` *(tilføj sektion)*

**Opgave — `EditorExport.tsx`:**
- **"Kopiér Model Config"** — kopierer `configOverride` som TypeScript `FishModelConfig` one-liner
  - `color` som `0xRRGGBB`, `null` som `null`
  - Udelad `undefined`/`false` felter
  - Udelad tom `partAdjustments`
- **"Kopiér Fuld Entry"** — kopierer komplet `CatchMasterEntry`-linje klar til `fish.ts`
  - Edit-mode: bruger original fisk-metadata
  - Create-mode: bruger `newFishMeta`
- **"Kopiér som JSON"** — ren JSON af config
- Toast "Kopieret!" i 2 sekunder efter kopiering
- Diff-preview: `<pre>` der viser ændringer (grøn=tilføjet, rød=fjernet, gul=ændret) sammenlignet med `originalConfig`

**Test:**
1. Vælg "fisk_torsk" → ændr farve til rød (0xFF0000) + slå `stripes` til
2. Klik "Kopiér Model Config" → `Ctrl+V` i en editor:
   - Bekræft: `color: 0xFF0000` (hex literal, IKKE string)
   - Bekræft: `stripes: true` er inkluderet
   - Bekræft: `partAdjustments` er IKKE inkluderet (tom)
3. Klik "Kopiér Fuld Entry" → paste:
   - Bekræft: `id: 'fisk_torsk'`, `name: 'Torsk'`, osv. er korrekt
   - Bekræft: `model: { color: 0xFF0000, ... stripes: true }` er inkluderet
4. Skift til create-mode → udfyld id "fisk_test", name "Testfisk"
5. Klik "Kopiér Fuld Entry" → paste:
   - Bekræft: `id: 'fisk_test'`, `name: 'Testfisk'`
6. Diff-preview: i edit-mode med ændringer, bekræft at ændrede felter er fremhævet

---

### Fase 1 · Trin 9: Polish og UX

**Filer:**
- Alle editor-komponenter

**Opgave:**
- Alle labels på **dansk** (Bredde, Højde, Længde, Hale, Farve, Hastighed, Skala, osv.)
- Tooltips (`title`-attributter) på alle labels
- `Escape` lukker panelet
- Diff-indikator: farveprik ved ændrede felter (sammenlign med `originalConfig`)
- Kompakt layout: `text-xs`/`text-sm`, `gap-1`, `py-1`
- Responsive sliders: `accent-blue-500`
- Nulstil-knap i header

**Test:**
1. Alle labels er på dansk — ingen engelske labels i panelet
2. Hover over en label → tooltip vises med kort forklaring
3. Ændr en slider → en farveprik/indikator vises ved det ændrede felt
4. Klik "Nulstil" → alle indikatorer forsvinder, config = original
5. `Escape` → panelet lukker
6. Panelet kan scrolles når indholdet er længere end skærmen
7. Production build (`npm run build`) → ingen editor-kode er inkluderet (check bundle-størrelse)

---

## Fase 2: PartGroup i StandardFishModel

Målet er **klikbar selektion** af individuelle kropsdele på den mest brugte model-type, med per-del position/skala-sliders.

---

### Fase 2 · Trin 1: PartGroup-hjælpekomponent + CuteFishModel-props

**Filer:**
- `src/three/models/CuteFishModel.tsx` *(ændring)*

**Opgave:**
1. Tilføj `PartGroup`-komponenten øverst i filen (se specens DEL 2a)
2. Tilføj `editorMode?`, `selectedPart?`, `onPartClick?` som optional props til `CuteFishModel` (se specens DEL 2b)
3. Send props videre til `StandardFishModel` og alle creature-modeller

**Test:**
1. `npx tsc --noEmit` — ingen fejl
2. Start spillet normalt (uden editor) — alt fungerer identisk som før
3. Fang en fisk → den renderes korrekt i spand og catch-result
4. Åbn editoren → fisk vises (men endnu ingen PartGroup-wrapping, så klik gør intet)

---

### Fase 2 · Trin 2: Wrap StandardFishModel-dele i PartGroup

**Filer:**
- `src/three/models/CuteFishModel.tsx` *(ændring — `StandardFishModel`-funktionen)*

**Opgave:**
Wrap ALLE logiske kropsdele i `<PartGroup>` med korrekte navne:
- `body` — hele body-meshet
- `leftEye`, `rightEye` — øjne (hvid + pupil + glint)
- `tail` — hele tail-gruppen (wrap `<group ref={tailGroup}>`)
- `dorsalFin` — finUp/spikes-blokken
- `leftFin`, `rightFin` — side-finner
- `beak` — longBeak-mesh
- `sword` — sværd-mesh
- `whiskers` — whiskers-meshes
- `jaw` — isPiranha underkæbe
- `lure` — lystfisker-lampe
- `dinoHead`, `dinoLegs` — isDino-dele

**Test:**
1. Start spillet normalt — fisk renderes identisk (PartGroup med defaults er pass-through)
2. Åbn editoren, vælg en standard-fisk (f.eks. torsk)
3. **Klik** på fiskens venstre øje → `selectedPart` sættes til `'leftEye'` (bekræft i konsol: `useEditorStore.getState().selectedPart`)
4. Grøn wireframe-kugle vises rundt om det valgte øje
5. Klik et andet sted → selektion forsvinder
6. Klik på halen → `'tail'` vælges
7. Klik på kroppen → `'body'` vælges

---

### Fase 2 · Trin 3: Per-del justeringssliders

**Filer:**
- `src/components/editor/EditorPartAdjuster.tsx` *(ny fil)*
- `src/components/editor/FishEditorPanel.tsx` *(tilføj sektion)*

**Opgave — `EditorPartAdjuster.tsx`:**
- Dropdown med tilgængelige dele for StandardFishModel: `body`, `leftEye`, `rightEye`, `tail`, `dorsalFin`, `leftFin`, `rightFin`, `beak`, `jaw`, `lure`, `whiskers`
- Synkroniseret med 3D-klik (dropdown og 3D-klik opdaterer begge `selectedPart`)
- 6 sliders for valgt del: dX, dY, dZ (±2, step 0.01), sX, sY, sZ (0.1–3, step 0.05)
- "Nulstil del" knap → sætter valgte dels adjustment til `{}`
- Sliders kalder `updatePartAdjustment(partName, { dx, ... })`

**Test:**
1. Vælg torsk → klik på venstre øje i 3D
2. Flyt dY-slider op → øjet flytter opad i realtid
3. Flyt sX-slider til 2.0 → øjet strækkes horisontalt
4. Klik "Nulstil del" → øjet vender tilbage til original position/størrelse
5. Vælg del fra dropdown (f.eks. "tail") → halen highlightes med grøn wireframe
6. Justér dZ → halen flytter sig langs fisken
7. Klik "Kopiér Model Config" → bekræft at `partAdjustments` er inkluderet med de rigtige værdier
8. Nulstil alle dele → `partAdjustments` udelades fra export (tom)

---

## Fase 3: PartGroup i creature-modeller

Målet er **fuld del-selektion** på alle specialmodeller — samme kvalitet som StandardFishModel.

---

### Fase 3 · Trin 1: LobsterModel + CrabModel

**Filer:**
- `src/three/models/CuteFishModel.tsx` *(ændring — `LobsterModel` + `CrabModel`)*

**Opgave:**
Wrap logiske dele i `<PartGroup>`:
- **LobsterModel:** `body`, `head`, `leftClaw`, `rightClaw`, `legs`, `eyes`
- **CrabModel:** `body`, `leftClaw`, `rightClaw`, `legs`, `eyes`

Tilføj tilsvarende del-lister i `EditorPartAdjuster.tsx` dropdown (skift baseret på aktiv creature type).

**Test:**
1. Vælg en hummer-fisk (f.eks. sæt creature type til Hummer i editoren)
2. Klik på venstre klo → `'leftClaw'` highlightes
3. Justér dX/sX → kloen flytter/skaleres i realtid
4. Bekræft at dropdown viser hummer-specifikke dele (ikke standardfisk-dele)
5. Gør det samme med krabbe — klik klo, justér, eksportér
6. Skift creature type fra Hummer til Standard fisk → dropdown opdateres til standardfisk-dele
7. Normalt gameplay uberørt (fang en hummer/krabbe → korrekt rendering)

---

### Fase 3 · Trin 2: OctopusModel + FrogModel

**Filer:**
- `src/three/models/CuteFishModel.tsx` *(ændring — `OctopusModel` + `FrogModel`)*

**Opgave:**
- **OctopusModel:** `head`, `tentacles`, `eyes`
- **FrogModel:** `body`, `eyes`, `legs`

Opdatér `EditorPartAdjuster.tsx` dropdown.

**Test:**
1. Creature type → Blæksprutte → klik tentakler → highlightes
2. Justér tentakler-dY → de flytter op/ned
3. Creature type → Frø → klik ben → highlightes
4. Eksportér config med partAdjustments → bekræft korrekte keys

---

### Fase 3 · Trin 3: RayModel + StarfishModel + resterende

**Filer:**
- `src/three/models/CuteFishModel.tsx` *(ændring)*

**Opgave:**
- **RayModel:** `body`, `leftWing`, `rightWing`, `tail`, `eyes`
- **StarfishModel:** relevante dele afhængig af implementation

Opdatér `EditorPartAdjuster.tsx` dropdown.

**Test:**
1. Creature type → Rokke → klik vinger, hale, øjne → alle highlightes korrekt
2. Justér rokke-vinge-skala → visuelt korrekt
3. Bekræft at ALLE creature types har fungerende del-selektion:
   - [ ] Standard fisk
   - [ ] Hummer
   - [ ] Krabbe
   - [ ] Blæksprutte
   - [ ] Frø
   - [ ] Rokke
   - [ ] Søstjerne
4. Eksportér en config med justeringer på en exotisk fisk → indsæt i `fish.ts` → bekræft at fisken renderes korrekt med justeringerne i det rigtige spil

---

## Samlet tjekliste — efter alle faser

| # | Krav | Status |
|---|------|--------|
| 1 | `Ctrl+Shift+E` åbner/lukker editor | ☐ |
| 2 | 3D preview med OrbitControls + Grid | ☐ |
| 3 | Fisk-vælger med gruppering efter rarity | ☐ |
| 4 | Edit-mode: vælg eksisterende fisk, ændr, eksportér | ☐ |
| 5 | Create-mode: opret fra bunden eller klonér | ☐ |
| 6 | Body shape, scale, speed sliders virker i realtid | ☐ |
| 7 | Farve-pickers (color, bellyColor, emissive) virker | ☐ |
| 8 | Hale-dropdown virker | ☐ |
| 9 | Creature type radio buttons skifter model | ☐ |
| 10 | Boolean feature-flags toggler korrekt | ☐ |
| 11 | Materiale-sliders (metalness, roughness) virker | ☐ |
| 12 | Export: Model Config kopieres korrekt til clipboard | ☐ |
| 13 | Export: Fuld Entry kopieres korrekt | ☐ |
| 14 | Export: JSON kopieres korrekt | ☐ |
| 15 | Diff-preview viser ændringer | ☐ |
| 16 | Per-del klik-selektion (StandardFishModel) | ☐ |
| 17 | Per-del sliders (position + skala) virker i realtid | ☐ |
| 18 | Per-del selektion på alle creature-modeller | ☐ |
| 19 | Normalt gameplay uberørt med editor lukket | ☐ |
| 20 | Production build ekskluderer al editor-kode | ☐ |
| 21 | Alle labels på dansk | ☐ |
| 22 | Nulstil-knap virker | ☐ |

---

## Hurtig-reference: Filstruktur

```
src/
  types/fish.ts                          ← Fase 1.1 (partAdjustments)
  store/useEditorStore.ts                ← Fase 1.2
  three/editor/EditorFishPreview.tsx     ← Fase 1.3
  three/Experience.tsx                   ← Fase 1.4 (ændring)
  App.tsx                                ← Fase 1.4 (ændring)
  components/editor/
    FishEditorPanel.tsx                  ← Fase 1.5
    EditorFishSelector.tsx              ← Fase 1.5
    EditorBodyControls.tsx              ← Fase 1.6
    EditorColorControls.tsx             ← Fase 1.6
    EditorFeatureToggles.tsx            ← Fase 1.7
    EditorExport.tsx                    ← Fase 1.8
    EditorPartAdjuster.tsx              ← Fase 2.3
  three/models/CuteFishModel.tsx         ← Fase 2.1–2.2, Fase 3.1–3.3 (ændring)
```
