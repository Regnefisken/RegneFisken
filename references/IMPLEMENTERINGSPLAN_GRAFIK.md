# Implementeringsplan: Grafik-settings — Top 10

> **Formål:** Optimér grafikpipelinen så spillet kører godt på alle enheder, fra budget-telefoner til ultra-desktop.  
> **Arkitektur:** Vite + React + Three.js (R3F) + Zustand + custom shaders  
> **Nuværende tiers:** Low / Medium / High / Ultra (defineret i `src/data/graphics.ts`)

---

## Fase 1 — Partikler og effekter: kvalitetsskalering (VÆSENTLIG)

> Pt. renderes weather-partikler (2000 stk) og skyer (8 stk) med faste antal uanset tier. Det er den mest oplagte performance-gevinst for low-end enheder.

### 1.1 Skalér `WeatherParticles` med grafikqualitet

**Fil:** `src/three/effects/WeatherParticles.tsx`

**Nuværende (linje 7):**
```ts
const COUNT = 2000; // Fast — aldrig skaleret
```

**Ændring:**
```ts
// Erstat fast COUNT med en funktion:
function particleCountForQuality(q: GraphicsQuality): number {
  if (q === 'low') return 400;
  if (q === 'medium') return 1000;
  if (q === 'high') return 1600;
  return 2000; // ultra
}
```

**Implementation:**
- Importér `useUIStore` og læs `graphicsQuality`
- Geometry og material skal genopbygges (via `useMemo` dependency) når quality ændres
- Alternativt: Alloker altid 2000 vertices, men brug en uniform `u_count` i vertex shader til at skjule overskydende (`if (float(gl_VertexID) >= u_count) { gl_Position = vec4(0.0); return; }`)
- Shader-tilgangen undgår geometry-reallokering og er den mest performante

### 1.2 Skalér `SkyClouds` med grafikqualitet

**Fil:** `src/three/effects/SkyClouds.tsx`

**Nuværende (linje 13):**
```ts
const CLOUD_COUNT = 8; // Fast
```

**Ændring:**
```ts
function cloudCountForQuality(q: GraphicsQuality): number {
  if (q === 'low') return 3;
  if (q === 'medium') return 5;
  if (q === 'high') return 7;
  return 8; // ultra
}
```

**Implementation:**
- Importér `useUIStore` og læs `graphicsQuality`
- `clouds` er allerede i `useMemo` (linje 68) — tilføj `graphicsQuality` som dependency
- Reducer også blob-count pr. sky på low: `const blobs = q === 'low' ? 2 : 3 + Math.floor(rnd() * 3);` (linje 41)
- Dispose gamle geometrier/materialer ved quality-skift for at undgå memory leaks

### 1.3 Skalér `GameEffects` (sparkles) med grafikqualitet

**Fil:** `src/three/effects/GameEffects.tsx`

**Nuværende:** Sparkles renderes altid med faste counts (24, 18, 48, 36, 32, 55, 40 partikler).

**Ændring:**
- Tilføj `graphicsQuality` check:
  ```ts
  const graphicsQuality = useUIStore((s) => s.graphicsQuality);
  const skipSparkles = graphicsQuality === 'low';
  ```
- Wrap alle `<Sparkles>` i `skipSparkles ? null : <Sparkles ... />`
- For medium: halvér alle counts (`count={Math.ceil(24 * 0.5)}` osv.)
- For high/ultra: behold nuværende values

---

## Fase 2 — Runtime FPS-monitoring og dynamisk kvalitet

> Systemet detekterer GPU én gang og cacher i 30 dage. Ingen reaktion på thermal throttling eller faktisk gameplay-performance.

### 2.1 Opret FPS-sampler utility

**Ny fil:** `src/logic/fps-monitor.ts`

```ts
// Simpelt ring-buffer der sampler frame-tider:
//
// interface FpsMonitor {
//   sample(deltaMs: number): void;
//   getAverageFps(): number;
//   isUnderPerforming(): boolean; // < 24 FPS i gennemsnit over 3 sek
// }
//
// - Ring-buffer: 180 samples (3 sekunder ved 60fps)
// - sample() kaldes fra useFrame i Experience.tsx eller GameCanvas
// - isUnderPerforming(): true når avg < 24 FPS over hele bufferen
// - getAverageFps(): glidende gennemsnit
```

**Krav:**
- Ingen heap-allokationer i `sample()` (performance-kritisk hot path)
- Brug `Float32Array` for ring-buffer
- Eksportér singleton-instans

### 2.2 Integrér FPS-sampler i render-loop

**Fil:** `src/three/useRendererSettings.ts`

**Tilføjelse i `useFrame` (efter linje 31):**
```ts
// Import fpsMon fra fps-monitor.ts
// fpsMon.sample(delta * 1000);
```

### 2.3 Tilføj automatisk kvalitets-nedgradering

**Ny fil:** `src/logic/dynamic-quality.ts`

```ts
// Strategi:
// - Tjek hvert 5. sekund: if fpsMon.isUnderPerforming() → sænk kvalitet ét trin
// - Minimum: 'low' (kan ikke sænkes yderligere)
// - Vis toast: "Grafik sænket for bedre ydelse"
// - Cooldown: Min 30 sek mellem nedgraderinger
// - Ingen automatisk opgradering (brugeren kan manuelt skifte op)
```

**Integration:**
- Kald fra `useRendererSettings.ts` eller `Experience.tsx`
- Opdatér `useUIStore.graphicsQuality` via `setGraphicsQuality`
- Respektér brugerens manuelle valg: flag `autoQualityEnabled` i UIStore
  - Default: `true` efter auto-detect, `false` efter manuelt valg i ScreenSettings

### 2.4 Tilføj FPS-counter i ScreenSettings (valgfrit)

**Fil:** `src/components/screens/ScreenSettings.tsx`

**Tilføjelse:**
- Vis aktuelt FPS-gennemsnit i grafik-sektionen: `⚡ 54 FPS`
- Hjælper brugeren med at vælge korrekt tier
- Brug `fpsMon.getAverageFps()` med 500ms polling (`useEffect` + `setInterval`)

---

## Fase 3 — `useReducedMotion` implementering

> Stub der altid returnerer `false`. Settings-UI har toggle men den bruges ikke i effekter.

### 3.1 Implementér hooket

**Fil:** `src/hooks/useReducedMotion.ts`

**Nuværende (komplet fil):**
```ts
/** Skeleton — prefers-reduced-motion (Fase 4). */
export function useReducedMotion(): boolean {
  return false;
}
```

**Erstat med:**
```ts
// 1. Læs useUIStore.reducedMotion (brugerens toggle i ScreenSettings)
// 2. Læs window.matchMedia('(prefers-reduced-motion: reduce)')
// 3. Returner true hvis ENTEN er aktiv
// 4. Abonnér på MediaQueryList 'change' event + Zustand subscribe
// 5. Returner reaktiv boolean via useState
```

### 3.2 Tilslut til effekt-komponenter

| Fil | Hvad der disables/reduceres |
|---|---|
| `src/three/effects/GameEffects.tsx` | Skip alle `<Sparkles>` |
| `src/three/effects/WeatherParticles.tsx` | Sæt `visible = false` |
| `src/three/effects/SkyClouds.tsx` | Stop sky-drift (speed = 0) |
| `src/three/effects/WaterSurface.tsx` | Reducer wave amplitude til 0.1× |
| `src/components/effects/LightningOverlay.tsx` | Skip flash-animation |
| `src/components/fishing/MathChallenge.tsx` | Skip boss shake-effekt |
| `src/three/effects/WaterSplashParticles.tsx` | Skip splash-partikler |

**Pattern for hver fil:**
```ts
// Import: import { useUIStore } from '../../store/useUIStore';
// I component body:
// const reducedMotion = useUIStore((s) => s.reducedMotion);
// Betinget: if (reducedMotion) return null; // eller reducer effect
```

**Note:** Brug `useUIStore.reducedMotion` direkte (allerede reaktiv via Zustand) i stedet for hooket — hooket er primært for OS-level `prefers-reduced-motion` integration.

---

## Fase 4 — GPU-benchmark forbedringer

### 4.1 Reducer cache-varighed og tilføj versions-invalidering

**Fil:** `src/logic/auto-detect-graphics.ts`

**Nuværende (linje 12):**
```ts
const CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 dage
```

**Ændringer:**
```ts
import { APP_VERSION } from '../data/version.js';

const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 dage

// I readCache() — tilføj versionscheck (efter linje 36):
// if (o.appVersion !== APP_VERSION) return null;

// I GpuBenchResult interface — tilføj:
// appVersion: string;

// I writeCache() result object:
// appVersion: APP_VERSION,
```

### 4.2 Gør benchmark mere repræsentativ

**Fil:** `src/logic/auto-detect-graphics.ts`, funktion `benchGpuMs()` (linje 66-131)

**Nuværende:** 256×256 canvas, 30 sfærer, 20 frames.

**Forbedringer:**
```ts
// 1. Øg canvas til 512×512 (tættere på gameplay)
renderer.setSize(512, 512, false);

// 2. Tilføj en PlaneGeometry med custom shader (simulér vand)
//    - Brug samme wave-displacement shader som WaterSurface
//    - Giver mere realistisk GPU-load

// 3. Øg frame count til 30 (mere stabil måling)
const frames = 30;

// 4. Tilføj warm-up frames (allerede 5 — behold)

// 5. Tilføj timeout: Hvis benchmark tager > 5 sek, afbryd og returnér 'low'
const deadline = performance.now() + 5000;
for (let f = 0; f < frames; f++) {
  if (performance.now() > deadline) return 32; // worst case
  // ... render
}
```

### 4.3 Tilføj mobile sustained-performance penalty

**Fil:** `src/logic/auto-detect-graphics.ts`, funktion `autoDetectGraphics()` (linje 149-196)

**Nuværende:** Mobil med `dpr >= 3` får `-10` penalty. Men sustained performance er typisk 30-50% lavere end peak.

**Tilføjelse efter linje 176:**
```ts
// Mobil-enheder har typisk 30-50% sustained performance drop
// pga. thermal throttling. Tilføj ekstra penalty:
if (isMobile) hwScore -= 8; // Generel mobil-penalty for sustained perf

// Budget-enheder (lav memory + få cores) er mest udsatte:
if (isMobile && memory <= 4 && cores <= 4) hwScore -= 5;
```

---

## Fase 5 — Skygger: korrekt deaktivering på Low tier

> Koden aktiverer `PCFShadowMap` på alle tiers. `castShadow` disables kun på sol-lyset, men shadow map beregningen kører stadig.

### 5.1 Deaktivér shadow map helt på Low tier

**Fil:** `src/three/GameCanvas.tsx`

**Nuværende (linje 24-25):**
```tsx
shadows={{ type: PCFShadowMap }}
dpr={quality === 'ultra' ? [1, 2] : quality === 'high' ? [1, 1.5] : [1, 1]}
```

**Ændring:**
```tsx
shadows={quality === 'low' ? false : { type: PCFShadowMap }}
dpr={quality === 'ultra' ? [1, 2] : quality === 'high' ? [1, 1.5] : [1, 1]}
```

**Bemærk:** Kommentaren i koden (linje 22-23) nævner at shadow map holdes enabled for at undgå "defekt skygge-shader på visse GPU'er". Test grundigt på:
- iOS Safari (iPhone SE, iPad)
- Chrome Android (Samsung, Xiaomi budget)
- Firefox desktop

Hvis der opstår shader-fejl uden shadow map, behold i stedet den nuværende tilgang og brug kun `castShadow = false` som allerede implementeret.

### 5.2 Skalér shadow map resolution per tier

**Fil:** `src/three/effects/SceneEnvironment.tsx`, funktion `configureSunShadow()` (linje 61-81)

**Nuværende (linje 62):**
```ts
const mapSize = quality === 'low' ? 1024 : quality === 'medium' ? 2048 : 4096;
```

**Ændring:**
```ts
const mapSize = quality === 'low' ? 512 : quality === 'medium' ? 1024 : quality === 'high' ? 2048 : 4096;
```

Rationale: Low-tier bruger nu `castShadow = false` (fase 5.1), men hvis shadow map beholdes som fallback, bør den være 512 i stedet for 1024. Medium reduceres fra 2048 til 1024 — stadig acceptabel kvalitet.

---

## Fase 6 — DPR-håndtering: resize og orientationsskift

### 6.1 Tilføj resize-listener i `useRendererSettings`

**Fil:** `src/three/useRendererSettings.ts`

**Nuværende (linje 21-29):** DPR sættes i `useEffect` med `[graphicsQuality, gl]` som deps — kører kun ved mount eller quality-ændring.

**Ændring:**
```ts
useEffect(() => {
  function updateDpr() {
    const qualityDpr =
      graphicsQuality === 'low'
        ? 0.75
        : graphicsQuality === 'medium'
          ? 1.0
          : Math.min(window.devicePixelRatio, graphicsQuality === 'ultra' ? 2.5 : 2.0);
    gl.setPixelRatio(Math.min(qualityDpr, window.devicePixelRatio));
  }

  updateDpr();

  // Debounced resize handler
  let timeout: ReturnType<typeof setTimeout>;
  const onResize = () => {
    clearTimeout(timeout);
    timeout = setTimeout(updateDpr, 300);
  };

  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);
  return () => {
    clearTimeout(timeout);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('orientationchange', onResize);
  };
}, [graphicsQuality, gl]);
```

---

## Fase 7 — PMREM Exposure: tier-begrænsning

> Bruger på Low-tier kan manuelt sætte exposure til 1.2, hvilket koster unødvendig shader-tid.

### 7.1 Tilføj tier-anbefalet max-exposure i ScreenSettings

**Fil:** `src/components/screens/ScreenSettings.tsx`

**Tilføjelse ved PMREM-slider (efter linje 306):**
```tsx
// Beregn anbefalet max baseret på tier:
const recommendedMaxPmrem =
  graphicsQuality === 'low' ? 0.7
  : graphicsQuality === 'medium' ? 0.9
  : 1.2; // high/ultra

// Vis advarsel hvis over anbefalet:
{pmremExposure > recommendedMaxPmrem && (
  <p style={{
    color: '#f59e0b', fontSize: '0.7rem', marginTop: '0.3rem'
  }}>
    ⚠️ Høj exposure kan påvirke ydelsen på din valgte grafikkvalitet
  </p>
)}
```

**Bemærk:** Bloker IKKE slideren — vis kun en advarsel. Brugeren skal stadig kunne overstyre.

---

## Fase 8 — Post-processing: bloom på Ultra (valgfrit)

> Nuværende pipeline har kun tone mapping + native AA. Ultra-tier kan forbedres visuelt.

### 8.1 Tilføj subtil bloom-effekt på Ultra tier

**Fil:** `src/three/GameCanvas.tsx` eller ny fil `src/three/effects/PostProcessing.tsx`

**Implementering:**
```ts
// Brug @react-three/postprocessing:
// npm install @react-three/postprocessing postprocessing
//
// import { EffectComposer, Bloom } from '@react-three/postprocessing';
//
// Render kun på ultra:
// {graphicsQuality === 'ultra' && (
//   <EffectComposer>
//     <Bloom
//       luminanceThreshold={0.85}
//       luminanceSmoothing={0.3}
//       intensity={0.25}
//       mipmapBlur
//     />
//   </EffectComposer>
// )}
```

**Parametre (konservative):**
- `luminanceThreshold: 0.85` — kun meget lyse pixels (sol-refleksioner, lanterner)
- `intensity: 0.25` — subtilt, ikke overdrevet
- `mipmapBlur: true` — performant blur-metode
- Deaktiver helt for low/medium/high

**Risiko:** Post-processing kan koste 2-4ms per frame. Test på target Ultra-hardware (desktop GPU, iPad Pro).

---

## Fase 9 — GPU-blacklist (simpel heuristik)

> Ingen device-specifikke profiler. Benchmark kan være misvisende for kendte problematiske GPU'er.

### 9.1 Tilføj WebGL renderer-info tjek

**Fil:** `src/logic/auto-detect-graphics.ts`

**Tilføjelse i `autoDetectGraphics()` efter benchmark (linje 169):**
```ts
// Læs GPU-renderer-streng:
const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
const renderer = debugInfo
  ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
  : '';

// Kendte problematiske GPU'er — force max tier:
const GPU_CAPS: Record<string, GraphicsQuality> = {
  'Mali-400': 'low',
  'Mali-T6': 'low',
  'Adreno (TM) 3': 'low',      // Adreno 300-serien
  'Adreno (TM) 4': 'medium',   // Adreno 400-serien
  'PowerVR SGX': 'low',
  'Intel HD Graphics 4': 'medium', // Intel HD 4000/4600
  'SwiftShader': 'low',         // Software renderer
};

let gpuCap: GraphicsQuality | null = null;
for (const [pattern, maxQ] of Object.entries(GPU_CAPS)) {
  if (renderer.includes(pattern)) {
    gpuCap = maxQ;
    break;
  }
}

// Clamp quality til GPU-cap:
// if (gpuCap && QUALITY_ORDER.indexOf(quality) > QUALITY_ORDER.indexOf(gpuCap)) {
//   quality = gpuCap;
// }
```

**Bemærk:** `WEBGL_debug_renderer_info` er deprecated i nogle browsere (Firefox skjuler den). Brug som best-effort — fallback til benchmark-score.

### 9.2 Tilføj WebGL-context-lost håndtering

**Fil:** `src/three/GameCanvas.tsx`

**Tilføjelse i `onCreated` callback (linje 31-34):**
```ts
onCreated={({ gl }) => {
  gl.shadowMap.type = PCFShadowMap;
  setSceneReady(true);

  // Håndter GPU context lost (thermal throttling, tab switch, etc.)
  gl.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    console.warn('WebGL context lost');
    useUIStore.getState().setToastMessage('⚠️ Grafik-fejl — genindlæser...');
    // Overvej: automatisk sænk kvalitet + reload scene
  });
}}
```

---

## Fase 10 — Benchmark-cache invalidering ved versionsskift

> Allerede delvist dækket i 4.1, men beskrives her som selvstændigt trin.

### 10.1 Invalider cache ved app-version ændring

**Fil:** `src/logic/auto-detect-graphics.ts`

**Allerede beskrevet i 4.1.** Tilføj `appVersion` felt til `GpuBenchResult` og valider i `readCache()`.

### 10.2 Tilføj "Re-test grafik" knap i ScreenSettings

**Fil:** `src/components/screens/ScreenSettings.tsx`

**Tilføjelse efter grafik-knapperne (efter linje 279):**
```tsx
<button
  type="button"
  onClick={() => {
    play('ui');
    // Slet cache og kør benchmark igen:
    localStorage.removeItem('regnefisken_gpu_bench');
    const result = autoDetectGraphics();
    setGraphicsQuality(result.quality);
    setPmremExposure(result.exposure);
    setToastMessage(`Grafik testet: ${result.quality} (score: ${result.hwScore})`);
  }}
  style={{
    width: '100%',
    padding: '0.55rem',
    borderRadius: '0.875rem',
    border: '1px solid rgba(51,65,85,0.6)',
    background: 'rgba(30,41,59,0.5)',
    color: '#94a3b8',
    fontWeight: 600,
    fontSize: '0.75rem',
    cursor: 'pointer',
    marginBottom: '1.25rem',
  }}
>
  🔄 Test grafik igen
</button>
```

---

## Prioriteret rækkefølge

| Prio | Fase | Beskrivelse | Estimat |
|------|------|-------------|---------|
| 🔴 P0 | 1 | Skalér partikler/skyer/sparkles med kvalitetsniveau | 2-3 timer |
| 🔴 P0 | 5 | Deaktiver shadows korrekt på Low + skalér shadow maps | 1 time |
| 🟡 P1 | 3 | `useReducedMotion` implementering + tilslut effekter | 2-3 timer |
| 🟡 P1 | 4 | Benchmark-forbedring: cache 7d, versionscheck, mobile penalty | 1-2 timer |
| 🟡 P1 | 6 | DPR resize-listener | 30 min |
| 🟢 P2 | 2 | Runtime FPS-monitor + dynamisk kvalitetsnedgradering | 3-4 timer |
| 🟢 P2 | 7 | PMREM exposure tier-advarsel | 30 min |
| 🟢 P2 | 10 | "Re-test grafik" knap i settings | 30 min |
| 🟢 P2 | 9 | GPU-blacklist + context-lost | 1-2 timer |
| 🟣 P3 | 8 | Bloom post-processing på Ultra | 2-3 timer |

---

## Filnøgle — Alle berørte filer

```
EKSISTERENDE FILER:
src/data/graphics.ts                              ← Reference (tier-definitioner)
src/data/version.ts                               ← Fase 4.1 (APP_VERSION)
src/logic/auto-detect-graphics.ts                 ← Fase 4.1, 4.2, 4.3, 9.1
src/three/GameCanvas.tsx                           ← Fase 5.1, 8.1, 9.2
src/three/useRendererSettings.ts                   ← Fase 2.2, 6.1
src/three/effects/WeatherParticles.tsx             ← Fase 1.1
src/three/effects/SkyClouds.tsx                    ← Fase 1.2
src/three/effects/GameEffects.tsx                  ← Fase 1.3, 3.2
src/three/effects/NightSky.tsx                     ← Reference (allerede skaleret)
src/three/effects/SceneEnvironment.tsx             ← Fase 5.2
src/three/effects/WaterSurface.tsx                 ← Fase 3.2
src/three/effects/WaterSplashParticles.tsx         ← Fase 3.2
src/components/effects/LightningOverlay.tsx        ← Fase 3.2
src/components/fishing/MathChallenge.tsx           ← Fase 3.2
src/components/screens/ScreenSettings.tsx          ← Fase 7.1, 10.2, 2.4
src/hooks/useReducedMotion.ts                      ← Fase 3.1
src/store/useUIStore.ts                            ← Fase 2.3 (autoQualityEnabled)

NYE FILER:
src/logic/fps-monitor.ts                           ← Fase 2.1
src/logic/dynamic-quality.ts                       ← Fase 2.3
src/three/effects/PostProcessing.tsx               ← Fase 8.1 (valgfrit)
```

---

## Afhængigheder mellem faser

```
Fase 1 (partikler)          ← Ingen afhængigheder — start her
Fase 3 (reducedMotion)      ← Ingen afhængigheder
Fase 4 (benchmark)          ← Ingen afhængigheder
Fase 5 (shadows)            ← Ingen afhængigheder
Fase 6 (DPR resize)         ← Ingen afhængigheder
Fase 2 (FPS-monitor)        ← Afhænger af Fase 1 (for at måle effekt)
Fase 7 (exposure-advarsel)  ← Ingen afhængigheder
Fase 9 (GPU-blacklist)      ← Afhænger af Fase 4 (benchmark-refactor)
Fase 10 (re-test knap)      ← Afhænger af Fase 4 (cache-invalidering)
Fase 8 (bloom)              ← Afhænger af Fase 2 (FPS-monitor til at verificere perf)
```
