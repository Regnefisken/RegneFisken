# Dynamisk Vand — Implementeringsplan

## Baggrund

Vandoverfladen føles "flad som et silketæppe". Den er i dag:

- **Geometri:** `PlaneGeometry(120, 120, 40, 40)` — 1.681 vertices, altid samme opløsning uanset grafik-setting
- **Bølger:** 2 simple sin/cos-funktioner i CPU (`waterWaves.ts` linje 49-51), drevet af `waveAmp` + `storm` fra vejrdata
- **Materiale:** `MeshStandardMaterial` med fast `roughness: 0.42`, `metalness: 0.02` — ingen Fresnel, ingen animerede normals, ingen specular "glitter"
- **Ingen refleksion** af himmel/omgivelser
- **`GRAPHICS_CONFIG`** i `src/data/graphics.ts` definerer allerede `segments`, `clearcoat`, `shimmer` felter per tier — men de bruges **ikke** af nogen kode under `src/`

Målet er tre forbedringsniveauer styret af den eksisterende `graphicsQuality`-setting (`low` | `medium` | `high` | `ultra`), som allerede auto-detekteres via `src/logic/auto-detect-graphics.ts`.

---

## Tier-oversigt

| Grafik-tier | Plane segments | Bølge-oktaver | Shader-effekter | Refleksion |
|------------|---------------|---------------|-----------------|------------|
| `low` | 20×20 | 2 (som nu) | Ingen (ren `MeshStandardMaterial`) | Nej |
| `medium` | 40×40 (som nu) | 3 | Fresnel-kanter | Nej |
| `high` | 60×60 | 4 | Fresnel + animerede normal-ripples + specular glitter | Nej |
| `ultra` | 80×80 | 4 | Alt fra high | Simpel planar refleksion |

---

## Trin 1: Forbind `GRAPHICS_CONFIG` til `WaterSurface`

### Filer der ændres
- `src/data/graphics.ts` — opdater `segments`-værdier og tilføj `waterOctaves`-felt
- `src/types/game.ts` — udvid `GraphicsTierConfig` med `waterOctaves: number`
- `src/three/effects/WaterSurface.tsx` — læs `graphicsQuality` fra `useUIStore`, slå config op, brug `segments` til `PlaneGeometry`

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

**`src/three/effects/WaterSurface.tsx`** — brug `segments` fra config:
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

Husk at `geometry` skal genopbygges når `graphicsQuality` ændres — `useMemo` med `cfg.segments` som dependency sikrer dette. Den gamle `geometry` skal disposes — tilføj en `useEffect` cleanup der kalder `geometry.dispose()`.

### Test-instruks (Trin 1)
1. Start spillet, åbn Skærmindstillinger
2. Skift mellem Lav/Mellem/Høj/Ultra
3. Verificer: vandoverfladen ændrer subdivisioner (lavere = grovere bølger, højere = glattere). Brug browser DevTools → Three.js inspector eller kig visuelt. Ingen crash ved skift.

---

## Trin 2: Flere bølge-oktaver (CPU vertex displacement)

### Filer der ændres
- `src/three/logic/waterWaves.ts` — parametriser `updateWaterGeometry` med `octaves`-count, tilføj ekstra bølgelag
- `src/three/effects/WaterSurface.tsx` — send `cfg.waterOctaves` til `updateWaterGeometry`

### Detaljer

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
- **Oktav 3:** Diagonal bølge der bryder den ensrettede sin/cos-monotoni
- **Oktav 4:** Hurtigere, finere krusning der giver "choppiness"

Amplituderne aftager (0.25, 0.15) så de ikke overskygger base-bølgen.

**VIGTIGT:** De location-specifikke masker (tropical_island, desert_lake, arctic_sea) skal **ikke** ændres — de anvender stadig `wave` som før, bare med rikere indhold.

**`src/three/effects/WaterSurface.tsx`** — opdater kaldet:
```typescript
updateWaterGeometry(mesh.geometry as PlaneGeometry, state.clock.elapsedTime, locationId, weatherType, cfg.waterOctaves);
```

Husk også at opdatere alle andre steder der kalder `updateWaterGeometry` (søg efter alle call-sites — der burde kun være denne ene).

### Test-instruks (Trin 2)
1. Sæt grafik til **Lav** → vandet skal se ud som før (2 oktaver, grøvere geometri)
2. Skift til **Høj** → vandet skal have synligt mere variation — bølgerne bevæger sig i flere retninger, ikke bare lineært langs X
3. Prøv under **Storm** vejr → ekstra oktaver skal forstærkes (de skalerer alle med `amp`)
4. Besøg **ørken-søen** → søen skal stadig have sine rolige ripples med `DESERT_RIPPLE_FACTOR`, men med mere detalje
5. FPS-tjek: åbn DevTools Performance-tab, verificer at `useFrame` ikke stiger markant i ms

---

## Trin 3: Shader-baseret Fresnel + animerede normals (GPU)

### Filer der ændres
- `src/three/effects/WaterSurface.tsx` — udvid `onBeforeCompile` med fragment shader patches

### Detaljer

Dette er den vigtigste visuelle forbedring. Vi patcher `MeshStandardMaterial`'s shader via `onBeforeCompile` (som vi allerede gør for shadow-vertex). Nu tilføjer vi **fragment shader** patches.

Effekterne betinges af `graphicsQuality`:
- `medium`: Fresnel-baseret kantmørkfarvning
- `high`/`ultra`: Fresnel + animerede normal-perturbationer + specular glitter

**Tilgangen:**

1. Tilføj uniforms til shaderen: `uTime` (float), `uWaterTier` (int: 0=low, 1=medium, 2=high/ultra)
2. Opdater `uTime` i `useFrame` via en `useRef` til shader-objeketet
3. Patch fragment shader:

**Fresnel (medium+):**
Indsæt efter `#include <normal_fragment_maps>`:
```glsl
// Fresnel darkening/brightening at glancing angles
float fresnelFactor = pow(1.0 - abs(dot(geometry.normal, geometry.viewDir)), 3.0);
diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.4, fresnelFactor * 0.6);
```

**Animerede normal-perturbationer (high+):**
Indsæt efter `#include <normal_fragment_maps>`:
```glsl
if (uWaterTier >= 2) {
  vec3 wp = vWorldPosition;
  float t = uTime;
  float nx = sin(wp.x * 3.0 + t * 1.2) * cos(wp.z * 2.5 + t * 0.9) * 0.08;
  float nz = cos(wp.x * 2.1 + t * 0.7) * sin(wp.z * 3.3 + t * 1.4) * 0.08;
  normal = normalize(normal + vec3(nx, 0.0, nz));
}
```

**Specular glitter (high+):**
Patchet forstærker specular via roughness-modulation:
```glsl
if (uWaterTier >= 2) {
  float glitter = sin(wp.x * 12.0 + t * 3.0) * cos(wp.z * 15.0 + t * 2.5);
  roughnessFactor *= mix(1.0, 0.3, max(0.0, glitter) * 0.5);
}
```

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

### Test-instruks (Trin 3)
1. **Low** → vandet skal se uændret ud (ingen shader patches udover shadow)
2. **Medium** → kanterne af vandet (hvor du kigger under lav vinkel) skal være mørkere/dybere — Fresnel-effekt synlig
3. **High** → overfladen skal have fine, levende krusninger der flytter sig. Solens refleksion skal "danse" og glimre i stedet for at være en diffus plet
4. Verificer: skift location til **grotte** → ingen Fresnel/normals (grotten har sit eget look)
5. Skift mellem vejrtyper → effekten skal fungere med alle vejr, storm giver mere dramatisk glitter
6. FPS-tjek: Fresnel og noise i fragment shader er billige operationer — FPS bør ikke falde mærkbart

---

## Trin 4: Planar refleksion (kun Ultra)

### Filer der ændres
- `src/three/effects/WaterSurface.tsx` — betinget rendering af refleksionsopsætning
- Eventuelt ny fil `src/three/effects/WaterReflector.tsx` hvis det bliver komplekst

### Detaljer

**Tilgang:** Brug en simpel `CubeCamera` (`three`) eller Drei's `<MeshReflectorMaterial>` til at skabe en lav-opløsning miljørefleksion.

**Anbefalet: Lav-cost CubeCamera-tilgang:**

Drei har `<MeshReflectorMaterial>` der laver planar reflection, men den renderer hele scenen fra vandoverfladen. Det kan være dyrt.

**Alternativ (billigere):** Brug en `CubeCamera` med lav opløsning (128×128 eller 256×256) der kun opdateres hvert 3.-5. frame, og anvend den som `envMap` på vandmaterialet.

```typescript
if (graphicsQuality === 'ultra') {
  // Opret CubeCamera med lav opløsning
  const cubeRenderTarget = new WebGLCubeRenderTarget(128);
  const cubeCamera = new CubeCamera(0.1, 100, cubeRenderTarget);
  // Placer ved vandoverfladen, Y=0
  // Opdater hvert N'te frame
  // Sæt material.envMap = cubeRenderTarget.texture
  // Sæt material.envMapIntensity til en subtil værdi (0.3-0.5)
}
```

**Alternativ med `<MeshReflectorMaterial>` fra Drei:**
```tsx
{graphicsQuality === 'ultra' ? (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
    <planeGeometry args={[120, 120]} />
    <MeshReflectorMaterial
      blur={[256, 256]}
      resolution={512}
      mixBlur={0.8}
      mixStrength={0.4}
      color={waterColorHex}
      metalness={0.05}
      roughness={0.5}
      mirror={0.3}
    />
  </mesh>
) : (
  // Normal WaterSurface mesh
)}
```

**VIGTIG BESLUTNING:** `MeshReflectorMaterial` erstatter hele materialet og kræver et separat mesh. Det betyder at de shader-patches fra Trin 3 skal integreres anderledes på ultra. **Enkleste løsning:** Brug `CubeCamera`-tilgangen, som blot sætter `envMap` på det eksisterende materiale, så alle Trin 3 patches stadig virker.

**Performance-hensyn:**
- `CubeCamera` render: kun hvert 4. frame → ~25% ekstra GPU-cost pr. aktiv frame
- Opløsning 128px = meget billigt
- Sæt `cubeCamera.layers` så den IKKE renderer partikler, UI-elementer, fisk under vand etc.
- Skjul vandmeshen selv under CubeCamera-render for at undgå infinite reflection

**Cleanup:** Dispose `cubeRenderTarget` ved unmount eller quality-skift.

### Test-instruks (Trin 4)
1. Sæt grafik til **Ultra** → vandoverfladen skal have en svag refleksion af himlen/omgivelser
2. Sæt grafik til **High** → ingen refleksion (kun Fresnel + normals)
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
- [ ] **`cave` location:** Ingen Fresnel/normal patches (grotten har sin egen `onBeforeCompile` path med `if (cave) return`). Verificer dette stadig fungerer
- [ ] **`reducedMotion` setting:** Hvis brugeren har slået animationer fra, bør de animerede normal-perturbationer og specular-glitter nok reduceres/slås fra. Tjek `useUIStore.getState().reducedMotion` og skip de tidsdrevne shader-effekter
- [ ] **Geometry dispose:** Når `graphicsQuality` ændres og `PlaneGeometry` genopbygges, skal den gamle geometry disposes for at undgå memory leaks
- [ ] **Shadow vertex patch:** Skal stadig fungere med den nye geometry (den opererer på `transformed` coordinates, uafhængigt af segment count — bør virke)
- [ ] **`Bobber.tsx` og `FishingLine.tsx`:** Disse bruger `waveAmp` direkte fra weather data — de kalder **ikke** `updateWaterGeometry`, så de påvirkes ikke af oktav-ændringer. Bobberens bevægelse vil stadig matche base-bølgen, ikke de fine oktaver. Det er acceptabelt.

### Test-instruks (Trin 6 — Final)
1. Gennemgå alle locations: pier, tropical_island, desert_lake, arctic_sea, cave, fishing_cabin
2. For hver: skift mellem alle 4 grafik-tiers
3. Verificer: ingen crashes, ingen shader-fejl i console, ingen memory leaks (DevTools → Memory tab)
4. Verificer: `reducedMotion = true` → animerede shader-effekter stoppet
5. Performance baseline: noter FPS for hver tier på din maskine

---

## Filændringer (opsummering)

| Fil | Ændring |
|-----|---------|
| `src/types/game.ts` | Tilføj `waterOctaves` til `GraphicsTierConfig` |
| `src/data/graphics.ts` | Opdater alle tiers med korrekte `segments` + `waterOctaves` |
| `src/three/logic/waterWaves.ts` | Tilføj `octaves` parameter, implementer ekstra bølgelag |
| `src/three/effects/WaterSurface.tsx` | Læs `graphicsQuality`, brug `segments` fra config, udvid `onBeforeCompile` med Fresnel + normals + specular, tilføj CubeCamera refleksion for ultra, opdater uniforms i `useFrame` |

---

## Vigtige principper

1. **Bagudkompatibilitet:** `low` tier skal producere **præcis** det samme visuelle output som nu (minus de 20 færre segments, som giver marginalt grovere bølger)
2. **Progressive enhancement:** Hver tier tilføjer ovenpå den forrige, aldrig fjerner
3. **Performance budget:** Fragment shader tilføjer max 3-4 `sin()`/`cos()` operationer — ubetydelig GPU cost. CubeCamera er den eneste "dyre" feature og begrænses til ultra
4. **Ingen nye dependencies:** Alt bygger på Three.js' eksisterende `onBeforeCompile`, `CubeCamera`, og standard uniforms
