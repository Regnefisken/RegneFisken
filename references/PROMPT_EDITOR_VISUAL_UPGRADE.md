# Prompt: Fish Editor — Visual Feature Upgrade

> **Brug:** Paste hele dette dokument som prompt i en ny Composer-chat.
> Implementér fase-for-fase. Sig fx: *"Implementér Fase 1 (Øje-system) fra `references/PROMPT_EDITOR_VISUAL_UPGRADE.md`"*

---

## Kontekst

Projektet har en fungerende dev-only fish-editor (Ctrl+Shift+E) med:
- Zustand store (`src/store/useEditorStore.ts`)
- 3D preview med OrbitControls (`src/three/editor/EditorFishPreview.tsx`)
- Sidepanel med sektioner for krop, farve, features, eksport (`src/components/editor/`)
- PartGroup-baseret klik-selektion + per-del justeringer (position, skala, rotation) — **kun for StandardFishModel**
- Eksport af FishModelConfig som TS-literal / fuld CATCH_MASTER_DATA-entry

### Status for den oprindelige plan (`FISH_EDITOR_PHASES.md`)

| Fase | Status | Beskrivelse |
|------|--------|-------------|
| Fase 1 (trin 1–9) | **Færdig** | Types, store, preview, panel, kontroller, eksport, polish |
| Fase 2 (trin 1–3) | **Færdig** | PartGroup + StandardFishModel wrap + EditorPartAdjuster |
| Fase 3 (trin 1–3) | **MANGLER** | PartGroup-wrap af creature-modeller (hummer, krabbe, blæksprutte, frø, rokke, søstjerne) |

**Fase 0** i dette dokument færdiggør den manglende Fase 3 fra den oprindelige plan. Derefter begynder de nye visuelle features.

Referencefiler du SKAL læse inden implementering:
- `references/PROMPT_FISH_EDITOR_DEVMODE.md` — DEL 8 (Udvidelsesguide) beskriver 3-trins mønsteret og alle feature-kategorier med præcise typer, rendering-detaljer og editor-UI
- `references/FISH_GENERATOR_SPEC.md` — datamodellen og FishModelConfig
- `references/FISH_EDITOR_PHASES.md` — faseplanen for det eksisterende system
- `references/electric monster generator.html` — inspirations-reference for UI-kvalitet og feature-dybde (4-zone gradient, 15 mønstertyper, pupilformer, mund/tænder, gennemsigtighed, bioluminescens, glimmer, pufferfish m.m.)

---

## Ufravigelige regler

1. **3-trins mønster for HVER feature:**
   - Trin 1: Tilføj optional felt(er) til `FishModelConfig` i `src/types/fish.ts`
   - Trin 2: Tilføj rendering i `StandardFishModel` (eller den relevante model) i `CuteFishModel.tsx` — **kun** effekt når feltet er sat; fisk UDEN feltet skal se **pixel-identiske** ud som før
   - Trin 3: Tilføj editor-kontrol i den relevante `Editor*`-komponent under `src/components/editor/`

2. **Pixel-perfect preview:** Editoren bruger spillets FAKTISKE `CuteFishModel`. Det du ser i editoren, er PRÆCIS det der renderes i spillet. Aldrig genimplementér renderingslogik — byg altid ovenpå `CuteFishModel`.

3. **Bagudkompatibilitet:** Alle nye felter er OPTIONAL med defaults der matcher nuværende udseende. `npx tsc --noEmit` skal passere. Eksisterende entries i `src/data/fish.ts` må ALDRIG ændres medmindre eksplicit bedt om det.

4. **DEV-gate:** Nye editor-komponenter indlæses bag `import.meta.env.DEV`. Nye felter i `FishModelConfig` og rendering i `CuteFishModel.tsx` er TILLADT (de er runtime-data og model-logik, ikke editor-kode), men de skal altid have safe defaults.

5. **Eksport opdateres automatisk:** `EditorExport.tsx` (`fishModelConfigToTsLiteral`) skal håndtere nye felter korrekt — hex-farver som `0xRRGGBB`, udelad `undefined`/`false`, formater objekter pænt.

6. **Dansk UI:** Alle labels og tooltips på dansk. Brug eksisterende stil: `text-xs`, `accent-blue-500`, `<details>/<summary>`, dark theme.

7. **Test efter hver fase:** `npx tsc --noEmit` + visuelt i browseren. Bekræft at eksisterende fisk er uændrede med editoren lukket.

---

## Fase 0: Færdiggør PartGroup på creature-modeller (manglende Fase 3 fra `FISH_EDITOR_PHASES.md`)

**Mål:** Alle specialmodeller (ikke kun StandardFishModel) skal have klikbar del-selektion, per-del justeringer og korrekte del-lister i `EditorPartAdjuster.tsx`.

**Filer:**
- `src/three/models/CuteFishModel.tsx` — wrap dele i `<PartGroup>` i hver creature-model
- `src/components/editor/EditorPartAdjuster.tsx` — udvid dropdown med del-lister per creature type
- `src/components/editor/editorConstants.ts` — tilføj del-lister for hver model

### Trin 1: LobsterModel + CrabModel

Wrap logiske dele i `<PartGroup>` (husk at sende `partProps` som i StandardFishModel):
- **LobsterModel:** `body`, `head`, `leftClaw`, `rightClaw`, `legs`, `eyes`
- **CrabModel:** `body`, `leftClaw`, `rightClaw`, `legs`, `eyes`

Tilføj tilsvarende del-lister i `editorConstants.ts` og brug dem i `EditorPartAdjuster.tsx` (skift baseret på aktiv creature type via `detectCreatureKind`).

### Trin 2: OctopusModel + FrogModel

- **OctopusModel:** `head`, `tentacles`, `eyes`
- **FrogModel:** `body`, `eyes`, `legs`

### Trin 3: RayModel + StarfishModel

- **RayModel:** `body`, `leftWing`, `rightWing`, `tail`, `eyes`
- **StarfishModel:** `body`, `arms`, `eyes`

### Test:
1. `npx tsc --noEmit` — ingen fejl
2. Spillet normalt uden editor: alle fisk renderes identisk (PartGroup er pass-through)
3. Editor → sæt creature type til Hummer → dropdown viser hummer-dele → klik klo → highlightes → justér dX → klo flytter
4. Skift til Krabbe → dropdown opdateres til krabbe-dele
5. Blæksprutte → klik tentakler → highlightes
6. Frø → klik ben → highlightes
7. Rokke → klik vinger → highlightes
8. Søstjerne → klik arme → highlightes
9. Skift tilbage til Standard fisk → dropdown viser standard-dele
10. Eksportér config med partAdjustments → keys matcher den aktive creature type

---

## Fase 1: Øje-system (`eyeConfig`)

**Mål:** Fuld kontrol over øjnenes udseende — størrelse, farver, pupilform, placering — som i monster-generatoren.

**Trin 1 — Type** (`src/types/fish.ts`):
```typescript
eyeConfig?: {
  size?: number;           // 0.15–0.48, default nuværende (0.14)
  scleraColor?: number;    // hex, default 0xFFFFFF
  pupilColor?: number;     // hex, default 0x111111
  pupilShape?: 'sphere' | 'round' | 'vertical_slit' | 'horizontal_slit' | 'diamond' | 'star' | 'heart' | 'crescent' | 'cross';
  pupilScale?: number;     // 0.2–2.5, default 1.0
  pupilDepth?: number;     // 0.50–0.98, default 0.85
  offsetX?: number;        // -0.4–0.4
  offsetY?: number;        // -0.5–0.5
};
```

**Trin 2 — Rendering** (`CuteFishModel.tsx`, `StandardFishModel`):
- Erstat de hardcodede øje-meshes i `leftEye`/`rightEye` PartGroups med logik der læser `config.eyeConfig`
- `pupilShape` !== 'sphere': generer ShapeGeometry (se DEL 8 Kategori E i PROMPT_FISH_EDITOR_DEVMODE.md)
- Uden `eyeConfig`: nuværende øjne renderes identisk (same sphere sizes, same colors)

**Trin 3 — Editor** (ny fil `src/components/editor/EditorEyeControls.tsx`):
- Sektion i FishEditorPanel: "Øjne (eyeConfig)"
- Checkbox: "Tilpas øjne" — når slået fra, vises ingen kontroller og `eyeConfig` er `undefined`
- Sliders: størrelse, pupilScale, pupilDepth, offsetX, offsetY
- Color pickers: scleraColor, pupilColor
- Dropdown: pupilShape med alle 9 former

**Test:**
1. Vælg torsk → øjne ser ud som altid (eyeConfig undefined)
2. Slå "Tilpas øjne" til → kontroller vises, default-værdier matcher nuværende look
3. Skift pupilShape til `vertical_slit` → katteøje vises i realtid
4. Skift scleraColor til rød → røde øjenbolde
5. Justér offsetY → øjne flytter op/ned
6. Eksportér → `eyeConfig: { pupilShape: 'vertical_slit', scleraColor: 0xFF0000, ... }` i output

---

## Fase 2: Procedurale mønstre (`bodyPattern` + `patternColor` + `patternDensity`)

**Mål:** 15 procedurale kropsmønstre tegnet som canvas-tekstur på body-materialet, som i monster-generatorens "Skin & Texture"-sektion.

**Trin 1 — Type:**
```typescript
bodyPattern?: 'solid' | 'stripes' | 'hstripes' | 'waves' | 'spots' | 'koi' | 'trout' | 'scales' | 'marble' | 'labyrinth' | 'leopard' | 'net' | 'neon' | 'bicolor' | 'ocellus';
patternColor?: number;     // hex — farven mønstret tegnes med
patternDensity?: number;   // 0.3–4.0, default 1.0
```

**Trin 2 — Rendering:**
- Opret hjælpefunktion i `src/three/models/cuteFishUtils.ts` (eller ny fil `cuteFishPatterns.ts`): `generatePatternTexture(pattern, bodyColor, patternColor, density, width, height): CanvasTexture`
- I `StandardFishModel`: når `config.bodyPattern` && `config.bodyPattern !== 'solid'`, generer canvas-tekstur og sæt som `map` på body-materialet (erstat/supplér den eksisterende `getScaleTextures`)
- Uden `bodyPattern` (eller `'solid'`): nuværende scale-tekstur bruges, pixel-identisk
- Se `references/PROMPT_FISH_EDITOR_DEVMODE.md` DEL 8 Kategori A for præcise beskrivelser af hvert mønster

**Trin 3 — Editor** (ny fil `src/components/editor/EditorPatternControls.tsx`):
- Dropdown med alle 15+1 mønstre (inkl. "Ensfarvet (solid)")
- Color picker for mønsterfarve
- Slider for densitet (0.3–4.0)
- Sektion i FishEditorPanel: "Mønster (bodyPattern)"

**Test:**
1. Torsk uden mønster → ser ud som altid
2. Vælg `stripes` + sort mønsterfarve → vertikale zebrastreger i realtid
3. Skru densitet op → tættere streger
4. Skift til `koi` → store patches
5. Skift til `leopard` → ringformede rosetter
6. Fjern mønster (vælg `solid`) → fisken vender tilbage til normal

---

## Fase 3: 4-zone gradient farve-system (`colorGradient`)

**Mål:** Erstat enkelt-farve med 4-zone ryg-til-bug gradient, regnbue og kamæleon-mode som i monster-generatorens farvesektion.

**Trin 1 — Type:**
```typescript
colorGradient?: { back: number; mid1: number; mid2: number; belly: number };
useRainbow?: boolean;
chameleonMode?: boolean;
```

**Trin 2 — Rendering:**
- `colorGradient` tegner linear gradient (4 stops) på body-canvas-tekstur
- `useRainbow` overskriver med spektral-regnbue
- `chameleonMode` cykler HSL i `useFrame`
- Uden alle tre: nuværende `color`-baseret rendering, pixel-identisk

**Trin 3 — Editor** (ny sektion i `EditorColorControls.tsx`):
- 4 color pickers i vertikal strip (ryg → bug)
- Checkboxes: "Regnbue" og "Kamæleon (animation)"
- Vis/skjul gradient-pickers afhængig af om gradient er slået til

---

## Fase 4: Gennemsigtighed (`bodyOpacity`, `finOpacity`)

**Mål:** Glas/gelé-effekt via meshPhysicalMaterial transmission.

**Trin 1 — Type:**
```typescript
bodyOpacity?: number;  // 0.05–1.0, default 1.0
finOpacity?: number;   // 0.1–1.0, default 0.95
```

**Trin 2 — Rendering:**
- I `StandardFishModel`: når `bodyOpacity < 1`, sæt `transparent: true, opacity, transmission, ior: 1.33, thickness: 0.8` på body-mat
- Tilsvarende for finner med `finOpacity`
- Default (1.0 / 0.95): nuværende rendering, pixel-identisk

**Trin 3 — Editor** (tilføj i `EditorColorControls.tsx` eller ny sektion):
- To sliders: "Krop-gennemsigtighed" og "Fin-gennemsigtighed"

---

## Fase 5: Glimmer / Shimmer (`glimmer`, `finGlimmer`)

**Mål:** Metallisk glitrende overflade via bump maps.

**Trin 1 — Type:**
```typescript
glimmer?: { amount: number; color: number };
finGlimmer?: { amount: number; color: number };
```

**Trin 2 — Rendering:**
- Procedural bump map med tilfældige lysrefleks-prikker + metalness-variation
- `amount = 0`: ingen effekt

**Trin 3 — Editor** (ny sektion eller del af materiale-sektion):
- Slider (amount 0–1) + color picker for krop og finner separat

---

## Fase 6: Mund & Tænder (`teeth`, `mouthType`)

**Mål:** Tilføj tænder-geometrier og mund-varianter til standard fisk.

**Trin 1 — Type:**
```typescript
teeth?: boolean | {
  type: 'shark_double' | 'fangs' | 'tiny' | 'tusks';
  count?: number;
  size?: number;
  color?: number;
  zOffset?: number;
};
mouthType?: 'none' | 'wide_shark' | 'round_sucker' | 'underbite' | 'beak';
mouthOpenness?: number;
mouthColor?: number;
```

**Trin 2 — Rendering:**
- Tænder som cone-geometrier ved mundområdet, wrappet i `<PartGroup name="teeth">`
- Mund via vertex-deformation eller overlay-mesh
- `teeth: false/undefined` + `mouthType: undefined/'none'`: pixel-identisk med nuværende

**Trin 3 — Editor** (ny fil `EditorMouthControls.tsx`):
- Checkbox "Tænder" → type-dropdown, sliders for count/size/zOffset, color picker
- Dropdown "Mundtype" → openness slider, mundfarve

---

## Fase 7: Udvidet hale og finne-system

**Mål:** Nye haleformer, rygfinne-typer, separat finne-farve, pelvic fins.

**Trin 1 — Type:**
- Udvid `TailType` med: `'veil' | 'lyre' | 'scalloped' | 'paddle' | 'ribbon' | 'heart' | 'sail' | 'kraken'`
- Nye optional felter:
```typescript
dorsalFinType?: 'standard' | 'shark' | 'spiked' | 'double' | 'mohawk' | 'crown' | 'tentacles';
dorsalFinEmbed?: number;     // 0–0.35
tailScale?: number;          // 0.6–1.9, default 1.0
sideFinScale?: number;       // 0.6–1.9, default 1.0
showPelvicFins?: boolean;
pelvicFinScale?: number;
finColor?: number;           // separat fin-farve
```

**Trin 2 — Rendering:**
- Nye haleformer genereret som ExtrudeGeometry fra 2D Shape-paths
- `dorsalFinType` varianter (se DEL 8 Kategori G)
- `finColor` bruges som alternativ til `colHex`/`finHex` for alle finner
- Default: nuværende rendering, pixel-identisk

**Trin 3 — Editor** (udvid `EditorBodyControls.tsx` + evt. ny `EditorFinControls.tsx`):
- Dropdown for dorsalFinType
- Slider for dorsalFinEmbed, tailScale, sideFinScale, pelvicFinScale
- Checkbox for showPelvicFins
- Color picker for finColor (separat fra body)

---

## Fase 8: Extreme mutationer

**Mål:** Bioluminescens, elektriske gnister, pufferfish — magiske effekter til sjældne fisk.

**Trin 1 — Type:**
```typescript
bioluminescent?: { enabled: boolean; color: number; intensity: number };
electricSparks?: boolean;
electricBolts?: boolean;
pufferInflation?: { puff: number; spikeDensity: number };
```

**Trin 2 — Rendering:**
- Bioluminescens: emissive side-linje der pulser via useFrame
- Elektriske gnister: PointsMaterial med AdditiveBlending, orbiting partikler
- Elektriske lyn: jagged zigzag-linjer der regenereres hvert ~80ms
- Pufferfish: body-skala + InstancedMesh pigge via Fibonacci-spiral
- Se DEL 8 Kategori I for præcise implementeringsdetaljer
- Default (alle undefined/false): pixel-identisk med nuværende

**Trin 3 — Editor** (ny sektion "Extreme & Magi" i FishEditorPanel):
- Checkboxes + sliders + color pickers som beskrevet

---

## Implementerings-rækkefølge og afhængigheder

Faserne er designet til at kunne implementeres **uafhængigt** i den givne rækkefølge. **Fase 0 skal implementeres først** (den færdiggør den oprindelige plan). Derefter kan Fase 1–8 tages i vilkårlig rækkefølge.

| Prio | Fase | Visuel impact | Kompleksitet | Forudsætning |
|------|------|---------------|--------------|--------------|
| **0** | **Creature PartGroup** | **Nødvendig** | **Mellem** | **Ingen** |
| 1 | Øje-system | Høj (karakter) | Mellem | Fase 0 |
| 2 | Mønstre | Meget høj (variation) | Høj | Ingen |
| 3 | 4-zone gradient | Høj | Lav-Mellem | Ingen |
| 4 | Gennemsigtighed | Høj (wow) | Lav | Ingen |
| 5 | Glimmer | Mellem | Mellem | Ingen |
| 6 | Mund & Tænder | Høj (karakter) | Høj | Ingen |
| 7 | Hale/finne-system | Høj (silhouet) | Høj | Ingen |
| 8 | Extreme mutationer | Meget høj (wow) | Meget høj | Ingen |

---

## Vigtige begrænsninger (gentaget)

- **BRUG `CuteFishModel` DIREKTE** — ALDRIG genimplementér renderingslogik
- **`@react-three/drei`** er allerede installeret — brug derfra
- **`structuredClone`** til config-kopiering
- **Production-safe** — editor-UI bag `import.meta.env.DEV`, nye model-felter er optional
- **Bagudkompatibel** — fisk uden nye felter ser identiske ud
- **Dansk UI** — alle labels, tooltips, sektionstitler
- **Kør `npx tsc --noEmit` efter hver fase** — ingen fejl tilladt
