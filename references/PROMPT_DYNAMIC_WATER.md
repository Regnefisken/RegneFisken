# Dynamisk Vand — Implementeringsplan (Flat Shading)

## Baggrund

Vandoverfladen føles "flad som et silketæppe". Den er i dag:

- **Geometri:** `PlaneGeometry(120, 120, 40, 40)` — 1.681 vertices, altid samme opløsning uanset grafik-setting
- **Bølger:** 2 simple sin/cos-funktioner i CPU (`waterWaves.ts` linje 49-51), drevet af `waveAmp` + `storm` fra vejrdata
- **Materiale:** `MeshStandardMaterial` med smooth shading (standard), fast `roughness: 0.42`, `metalness: 0.02` — ingen Fresnel, ingen specular variation
- **Ingen refleksion** af himmel/omgivelser
- **`GRAPHICS_CONFIG`** i `src/data/graphics.ts` definerer allerede `segments`, `clearcoat`, `shimmer` felter per tier — men de bruges **ikke** af nogen kode under `src/`

### Designfilosofi: Flat Shading

Kerneproblemet med smooth shading er at Three.js interpolerer normals på tværs af hvert triangle-face. Selv med mange bølge-oktaver ser resultatet "blødt" og livløst ud — normaler udvaskes.

Med **flat shading** (`flatShading: true`) får hvert triangle-face sin egen uniform normal baseret på dets faktiske orientering. Når vertices forskydes af bølger, vipper hvert face i sin egen retning og fanger lys uafhængigt. Det giver:

- **Naturlig skimren** — individuelle faces blinker specular refleksioner uden shader-tricks
- **Synlig bølgedetalje** — oktavforskelle mellem tiers er tydeligt synlige
- **Stiliseret low-poly vandæstetik** der passer til spillets visuelle stil

Strategien er derfor: **lad geometrien gøre det visuelle arbejde** (vertex displacement + flat faces) i stedet for at simulere detalje i shader patches.

---

## Tier-oversigt

| Grafik-tier | Plane segments | Bølge-oktaver | Shader-effekter | Refleksion |
|------------|---------------|---------------|-----------------|------------|
| `low` | 20×20 | 2 (som nu) | Ingen ekstra | Nej |
| `medium` | 40×40 (som nu) | 3 | Subtil Fresnel | Nej |
| `high` | 60×60 | 4 | Fresnel + roughness-variation | Nej |
| `ultra` | 80×80 | 4 | Alt fra high | Simpel planar refleksion |

Med flat shading giver flere segments finere facetter (mere shimmering detalje), mens færre segments giver en grovere, mere stiliseret look. Bølge-oktaverne er den primære visuelle driver — de tipper hvert face i forskellige retninger.

---

## Trin 1: Flat Shading + forbind `GRAPHICS_CONFIG` til `WaterSurface`

### Filer der ændres
- `src/data/graphics.ts` — opdater `segments`-værdier og tilføj `waterOctaves`-felt
- `src/types/game.ts` — udvid `GraphicsTierConfig` med `waterOctaves: number`
- `src/three/effects/WaterSurface.tsx` — aktiver `flatShading`, læs `graphicsQuality` fra `useUIStore`, slå config op, brug `segments` til `PlaneGeometry`

### Detaljer

**`src/types/game.ts`** — tilføj felt til `GraphicsTierConfig`:
```typescript
export interface GraphicsTierConfig {
  segments: number;
  texSize: number;
  material: string;
  clearcoat: number;
  shimmer: number;
  waterOctaves: number;  // NY — antal bølge-lag i CPU-displacement
}
```

**`src/data/graphics.ts`** — opdater med vandrelevante værdier:
```typescript
export const GRAPHICS_CONFIG = {
  low:    { segments: 20, texSize: 0,   material: 'Standard', clearcoat: 0,   shimmer: 0,   waterOctaves: 2 },
  medium: { segments: 40, texSize: 256, material: 'Physical', clearcoat: 0.5, shimmer: 0,   waterOctaves: 3 },
  high:   { segments: 60, texSize: 512, material: 'Physical', clearcoat: 0.8, shimmer: 0,   waterOctaves: 4 },
  ultra:  { segments: 80, texSize: 512, material: 'Physical', clearcoat: 1.0, shimmer: 0.6, waterOctaves: 4 },
} as const satisfies GraphicsConfigMap;
```

**`src/three/effects/WaterSurface.tsx`** — aktiver flat shading og brug `segments` fra config:
```typescript
import { GRAPHICS_CONFIG } from '../../data/graphics.js';
// ...
const graphicsQuality = useUIStore((s) => s.graphicsQuality);
const cfg = GRAPHICS_CONFIG[graphicsQuality];
const geometry = useMemo(
  () => new PlaneGeometry(120, 120, cfg.segments, cfg.segments),
  [cfg.segments],
);
```

Materialet ændres til:
```tsx
<meshStandardMaterial
  ref={matRef}
  color={waterColor}
  roughness={0.42}
  metalness={0.02}
  flatShading       // <— CENTRAL ÆNDRING
  side={DoubleSide}
/>
```

Husk at `geometry` skal genopbygges når `graphicsQuality` ændres — `useMemo` med `cfg.segments` som dependency sikrer dette. Den gamle `geometry` skal disposes — tilføj en `useEffect` cleanup der kalder `geometry.dispose()`.

### Test-instruks (Trin 1)
1. Start spillet, åbn Skærmindstillinger
2. Skift mellem Lav/Mellem/Høj/Ultra
3. Verificer: vandoverfladen har tydelige facetter — hvert triangle-face er synligt som en flad flade der fanger lys individuelt
4. Lavere tier = grovere, mere kantet vand. Højere tier = finere facetter, mere shimmer
5. Ingen crash ved skift

---

## Trin 2: Flere bølge-oktaver (CPU vertex displacement)

### Filer der ændres
- `src/three/logic/waterWaves.ts` — parametriser `updateWaterGeometry` med `octaves`-count, tilføj ekstra bølgelag, fjern `computeVertexNormals()`
- `src/three/effects/WaterSurface.tsx` — send `cfg.waterOctaves` til `updateWaterGeometry`

### Detaljer

Med flat shading er bølge-oktaverne den **primære visuelle driver**. Hver ekstra oktav tipper faces i nye retninger, hvilket skaber mere variation i hvordan lyset fanges. Dette er langt vigtigere end med smooth shading, hvor oktaverne blev udvaskede.

**`src/three/logic/waterWaves.ts`** — tilføj `octaves` parameter og nye bølgelag.

Funktionssignatur ændres:
```typescript
export function updateWaterGeometry(
  waterGeo: BufferGeometry,
  time: number,
  locationId: string,
  weatherType: string,
  octaves: number,   // NY
): void {
```

Erstat den nuværende simple bølgeberegning (linje 49-51):
```typescript
const wave =
  amp * Math.sin(pos.getX(i) * 0.5 + time * speed) +
  amp * 0.5 * Math.cos(pos.getY(i) * 0.3 + time * (speed * 1.5));
```

Med en oktav-baseret version:
```typescript
const x = pos.getX(i);
const y = pos.getY(i);
let wave = amp * Math.sin(x * 0.5 + time * speed)
         + amp * 0.5 * Math.cos(y * 0.3 + time * speed * 1.5);

if (octaves >= 3) {
  wave += amp * 0.25 * Math.sin(x * 1.1 + y * 0.7 + time * speed * 0.8);
}
if (octaves >= 4) {
  wave += amp * 0.15 * Math.cos(x * 2.3 - y * 1.1 + time * speed * 1.9);
}
```

De ekstra oktaver tilføjer:
- **Oktav 3:** Diagonal bølge der bryder den ensrettede sin/cos-monotoni — med flat shading giver dette faces der vipper diagonalt og bryder den lineære bølgemønster
- **Oktav 4:** Hurtigere, finere krusning — skaber "choppiness" hvor mange små faces vipper i forskellige retninger og glimter

Amplituderne aftager (0.25, 0.15) så de ikke overskygger base-bølgen.

**VIGTIGT:** De location-specifikke masker (tropical_island, desert_lake, arctic_sea) skal **ikke** ændres — de anvender stadig `wave` som før, bare med rigere indhold.

**Fjern `computeVertexNormals()` (linje 93):**

Med `flatShading: true` beregner Three.js face-normals i fragment shaderen via screen-space derivatives (`dFdx`/`dFdy` af view position). Vertex-normals bruges ikke til lighting. Fjern kaldet for at spare CPU:

```typescript
// FJERN DENNE LINJE:
// waterGeo.computeVertexNormals();
```

`pos.needsUpdate = true` skal stadig bevares — Three.js skal vide at vertex-positionerne er ændret.

**`src/three/effects/WaterSurface.tsx`** — opdater kaldet:
```typescript
updateWaterGeometry(mesh.geometry as PlaneGeometry, state.clock.elapsedTime, locationId, weatherType, cfg.waterOctaves);
```

Husk også at opdatere alle andre steder der kalder `updateWaterGeometry` (søg efter alle call-sites — der burde kun være denne ene).

### Test-instruks (Trin 2)
1. Sæt grafik til **Lav** → vandet skal have grove facetter med 2 oktavers bølgemønster — tydeligt low-poly, men levende
2. Skift til **Høj** → vandet skal have synligt mere variation — faces tipper i mange retninger, lyset danser over overfladen
3. Prøv under **Storm** vejr → ekstra oktaver forstærkes (de skalerer alle med `amp`), facetterne bevæger sig hurtigere
4. Besøg **ørken-søen** → søen skal stadig have sine rolige ripples med `DESERT_RIPPLE_FACTOR`, men med facetteret look
5. FPS-tjek: fjernelse af `computeVertexNormals()` bør give et mærkbart FPS-boost da det var en dyr per-frame operation

---

## Trin 3: Subtil Fresnel + roughness-variation (GPU)

### Filer der ændres
- `src/three/effects/WaterSurface.tsx` — udvid `onBeforeCompile` med fragment shader patches

### Detaljer

Med flat shading gør geometrien allerede det tunge visuelle løft. Shader-effekterne i dette trin er derfor **subtile forbedringer**, ikke det primære visuelle. Holdes simple.

Effekterne betinges af `graphicsQuality`:
- `medium`: Subtil Fresnel-baseret kantmørkfarvning
- `high`/`ultra`: Fresnel + roughness-variation for specular-kontrol

**Tilgangen:**

1. Tilføj uniforms til shaderen: `uTime` (float), `uWaterTier` (int: 0=low, 1=medium, 2=high/ultra)
2. Opdater `uTime` i `useFrame` via en `useRef` til shader-objektet
3. Patch fragment shader

**Fresnel (medium+):**

Med flat shading er Fresnel-effekten mere "stepped" — hvert face har sin egen vinkel til kameraet. Hold styrken lav for at undgå et båndet look.

Indsæt efter `#include <normal_fragment_maps>`:
```glsl
if (uWaterTier >= 1) {
  float fresnelFactor = pow(1.0 - abs(dot(normal, geometry.viewDir)), 3.0);
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.5, fresnelFactor * 0.3);
}
```

Bemærk den lavere styrke (`0.3` vs `0.6` i smooth-versionen) — flat shadings per-face beregning gør effekten allerede markant nok.

**Roughness-variation (high+):**

I stedet for animerede normal-perturbationer (som er redundante med flat shading — geometrien giver allerede varierede face-normals), modulerer vi roughness subtilt baseret på world position. Dette giver nogle faces en mere blank refleksion end andre:

```glsl
if (uWaterTier >= 2) {
  vec3 wp = vWorldPosition;
  float t = uTime;
  float roughVar = sin(wp.x * 4.0 + t * 0.8) * cos(wp.z * 5.0 + t * 0.6) * 0.15;
  roughnessFactor = max(0.1, roughnessFactor + roughVar);
}
```

Dette skaber en subtil "våd/tør" variation over overfladen der supplerer den geometriske shimmer. Bemærk at vi **ikke** perturber normals — flat shading håndterer det via geometrien.

**For at få `vWorldPosition` tilgængelig i fragment shader** — tilføj i vertex shader:
```glsl
varying vec3 vWorldPosition;
// i main(): vWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
```

Og tilsvarende `varying vec3 vWorldPosition;` i fragment shader.

**`customProgramCacheKey`** skal opdateres til at inkludere tier, så shaderen recompiles ved skift:
```typescript
mat.customProgramCacheKey = () => `water-${locationId}-tier${waterTier}`;
```

**Uniform-opdatering i `useFrame`:**
```typescript
const shaderRef = useRef<{ uniforms: Record<string, { value: unknown }> } | null>(null);

// I onBeforeCompile:
shaderRef.current = shader;
shader.uniforms.uTime = { value: 0 };
shader.uniforms.uWaterTier = { value: waterTier };

// I useFrame:
if (shaderRef.current) {
  shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime;
}
```

### Hvad vi IKKE gør (og hvorfor)

- **Animerede normal-perturbationer:** Redundant. Flat shading beregner face-normals via `dFdx`/`dFdy` i fragment shaderen. At perturbe `normal` bagefter skaber kaotiske, urealistiske resultater — faces der lyser op selvom de vender væk fra lyset.
- **Specular glitter shader:** Redundant. Flat shadings facetter + vertex displacement skaber allerede naturlig glitter via geometri. En shader-baseret glitter ovenpå ville se overgjort ud.

### Test-instruks (Trin 3)
1. **Low** → vandet skal se uændret ud (ingen shader patches udover shadow)
2. **Medium** → kanterne af vandet (lav vinkel) skal være lidt mørkere — subtil Fresnel synlig per face
3. **High** → overfladen skal have variation i blankheden — nogle faces mere spejlende end andre, langsomt skiftende over tid
4. Verificer: skift location til **grotte** → ingen Fresnel/roughness-variation (grotten har sit eget look)
5. Skift mellem vejrtyper → effekten skal fungere med alle vejr
6. FPS-tjek: effekterne er billige — 2-3 ekstra `sin()`/`cos()` i fragment shader

---

## Trin 4: Planar refleksion (kun Ultra)

### Filer der ændres
- `src/three/effects/WaterSurface.tsx` — betinget rendering af refleksionsopsætning
- Eventuelt ny fil `src/three/effects/WaterReflector.tsx` hvis det bliver komplekst

### Detaljer

**Tilgang:** Brug en simpel `CubeCamera` der sætter `envMap` på det eksisterende materiale. Denne tilgang bevarer flat shading og alle Trin 3 patches — den tilføjer bare en miljørefleksion ovenpå.

**Anbefalet: Lav-cost CubeCamera-tilgang:**

```typescript
if (graphicsQuality === 'ultra') {
  const cubeRenderTarget = new WebGLCubeRenderTarget(128);
  const cubeCamera = new CubeCamera(0.1, 100, cubeRenderTarget);
  // Placer ved vandoverfladen, Y=0
  // Opdater hvert 4. frame
  // Sæt material.envMap = cubeRenderTarget.texture
  // Sæt material.envMapIntensity til en subtil værdi (0.3-0.5)
}
```

Med flat shading ser envMap-refleksionen ekstra interessant ud — hvert face reflekterer en lidt anderledes del af himlen baseret på dets orientering, hvilket giver en facetteret spejleffekt.

**Performance-hensyn:**
- `CubeCamera` render: kun hvert 4. frame → ~25% ekstra GPU-cost pr. aktiv frame
- Opløsning 128px = meget billigt
- Sæt `cubeCamera.layers` så den IKKE renderer partikler, UI-elementer, fisk under vand etc.
- Skjul vandmeshen selv under CubeCamera-render for at undgå infinite reflection

**Cleanup:** Dispose `cubeRenderTarget` ved unmount eller quality-skift.

### Test-instruks (Trin 4)
1. Sæt grafik til **Ultra** → vandoverfladen skal have en svag, facetteret refleksion af himlen/omgivelser
2. Sæt grafik til **High** → ingen refleksion (kun Fresnel + roughness-variation)
3. Skift location → refleksion skal opdatere til ny lokation
4. FPS-tjek: verificer at Ultra ikke dropper under 30fps. Hvis det gør, reducer CubeCamera opløsning til 64px eller opdater sjældnere
5. Dag/nat-cyklus → refleksionen skal afspejle himlens farve korrekt

---

## Trin 5: Integration med auto-detect og settings UI

### Filer der ændres
- Ingen nye filer — systemet er allerede på plads

### Detaljer

Auto-detect er allerede implementeret i `src/logic/auto-detect-graphics.ts`. Den kører en GPU-benchmark ved første spilstart, scorer hardwaren, og sætter `graphicsQuality` i `useUIStore`. Resultatet caches i `localStorage` i 30 dage.

Brugeren kan manuelt overstyre via Skærmindstillinger (`ScreenSettings.tsx`), hvor Low/Mellem/Høj/Ultra-knapper allerede eksisterer.

**Ingen ændringer nødvendige her** — alt vand-logik læser allerede `graphicsQuality` fra store, og auto-detect sætter den korrekt baseret på hardware.

### Test-instruks (Trin 5)
1. Ryd localStorage (`localStorage.removeItem('regnefisken_gpu_bench')`)
2. Genindlæs spillet → auto-detect skal køre og vælge en tier
3. Verificer at vandkvaliteten matcher den auto-detekterede tier
4. Åbn Skærmindstillinger → skift manuelt → vandet opdaterer live

---

## Trin 6: Oprydning og edge cases

### Tjekliste
- [ ] **`fishing_cabin` location:** `WaterSurface` sætter `mesh.visible = false` her — ingen ændringer nødvendige, men verificer at CubeCamera (ultra) ikke renderes/opdateres når vand er usynligt
- [ ] **`cave` location:** Ingen Fresnel/roughness-variation patches (grotten har sin egen `onBeforeCompile` path med `if (cave) return`). Verificer dette stadig fungerer. Flat shading gælder stadig for grotte-vand — det er en materiale-egenskab og bør se fint ud
- [ ] **`reducedMotion` setting:** Hvis brugeren har slået animationer fra, bør roughness-variationen (tidsbaseret) nok fryses. Tjek `useUIStore.getState().reducedMotion` og stop tidsopdatering af `uTime` i shader
- [ ] **Geometry dispose:** Når `graphicsQuality` ændres og `PlaneGeometry` genopbygges, skal den gamle geometry disposes for at undgå memory leaks
- [ ] **Shadow vertex patch:** Skal stadig fungere med flat shading og den nye geometry. Shadow-patchen opererer på `transformed` coordinates i vertex shader, uafhængigt af face-normal beregning — bør virke
- [ ] **`computeVertexNormals()` fjernet:** Verificer at shadow-beregningen ikke afhænger af vertex-normals. Shadow-patchen bruger `transformedNormal` som kommer fra `#include <defaultnormal_vertex>` — dette er den vertex-normal fra attributten. Med flat shading bruges den ikke til lighting, men shadow-koden kan stadig bruge den til `shadowNormalBias`. Hvis skygger ser forkerte ud, genaktiver `computeVertexNormals()` — den er billig nok
- [ ] **`Bobber.tsx` og `FishingLine.tsx`:** Disse bruger `waveAmp` direkte fra weather data — de kalder **ikke** `updateWaterGeometry`, så de påvirkes ikke af oktav-ændringer. Bobberens bevægelse vil stadig matche base-bølgen, ikke de fine oktaver. Det er acceptabelt

### Test-instruks (Trin 6 — Final)
1. Gennemgå alle locations: pier, tropical_island, desert_lake, arctic_sea, cave, fishing_cabin
2. For hver: skift mellem alle 4 grafik-tiers
3. Verificer: ingen crashes, ingen shader-fejl i console, ingen memory leaks (DevTools → Memory tab)
4. Verificer: `reducedMotion = true` → tidsbaserede shader-effekter stoppet/frosset
5. Performance baseline: noter FPS for hver tier på din maskine

---

## Filændringer (opsummering)

| Fil | Ændring |
|-----|---------|
| `src/types/game.ts` | Tilføj `waterOctaves` til `GraphicsTierConfig` |
| `src/data/graphics.ts` | Opdater alle tiers med korrekte `segments` + `waterOctaves` |
| `src/three/logic/waterWaves.ts` | Tilføj `octaves` parameter, implementer ekstra bølgelag, fjern `computeVertexNormals()` |
| `src/three/effects/WaterSurface.tsx` | Aktiver `flatShading: true`, læs `graphicsQuality`, brug `segments` fra config, udvid `onBeforeCompile` med subtil Fresnel + roughness-variation, tilføj CubeCamera refleksion for ultra, opdater uniforms i `useFrame` |

---

## Vigtige principper

1. **Flat shading er fundamentet:** Al visuel forbedring bygger på at geometriens facetter fanger lys individuelt. Shader-effekter er supplerende, ikke primære
2. **Bagudkompatibilitet:** `low` tier med flat shading vil se anderledes ud end det nuværende smooth-shading vand — det er en bevidst stilændring. Geometrien er grovere (20 segments vs 40), men mere levende
3. **Progressive enhancement:** Hver tier tilføjer ovenpå den forrige — flere segments (finere facetter), flere oktaver (mere variation), subtile shader-effekter, refleksion
4. **Simplere shader = bedre:** Med flat shading behøver vi ikke de komplekse normal-perturbation og glitter-patches fra smooth-versionen. Geometrien gør arbejdet
5. **Performance budget:** Fjernelse af `computeVertexNormals()` sparer CPU. Fragment shader tilføjer max 2-3 `sin()`/`cos()` for roughness-variation. CubeCamera er den eneste "dyre" feature og begrænses til ultra
6. **Ingen nye dependencies:** Alt bygger på Three.js' eksisterende `flatShading`, `onBeforeCompile`, `CubeCamera`, og standard uniforms
