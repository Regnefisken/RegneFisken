# Implementeringsplan 2: De øvrige 8 optimeringsrettelser

> Klar til Cursor Composer · Implementér og test ét trin ad gangen  
> Dækker optimeringspoint #1, #2, #3, #4, #5, #7, #9, #10

---

## Overblik og rækkefølge

Trinene er sorteret fra lavest til højest risiko. Implementér og test i denne rækkefølge.

**Fase 1 — Hurtige gevinster (lav risiko, ingen visuel effekt)**
- Trin 1: #10 · WaterSurface shader-recompile guard
- Trin 2: #7 · Save-filter for PlayerStore og CollectionStore
- Trin 3: #9 · Vite chunk-splitting (drei adskilles)

**Fase 2 — Mellemkomplekse refaktoreringer**
- Trin 4: #5 · GoalProgressSync → Zustand-subscription med debounce
- Trin 5: #3 · WaterSplashParticles → InstancedMesh
- Trin 6: #1 · scene.traverse envMapIntensity → change-only opdatering

**Fase 3 — GPU-arbejde (højest kompleksitet)**
- Trin 7: #4 · WeatherParticles JS-loop → GPU ShaderMaterial
- Trin 8: #2 · Vandgeometri CPU-animation → GLSL vertex shader

---

## Fase 1 — Hurtige gevinster

---

### Trin 1: #10 — WaterSurface shader recompiler unødigt ved lokationsskift

**Berørt fil:** `src/three/effects/WaterSurface.tsx`

**Problem:** `useLayoutEffect([locationId])` sætter altid `mat.needsUpdate = true`, hvilket tvinger Three.js til at genkompilere vandets shadow-shader ved *hvert eneste* lokationsskift — selv når shaderkoden er identisk. `customProgramCacheKey` returnerer kun tre distinkte værdier: `'water-cave'`, `'water-shadow-flatten-jflat'` (jungle) og `'water-shadow-flatten'` (alle andre). Skifter man mellem to "almindelige" lokationer (pier → arctic_sea → smaragd osv.) er nøglen identisk og recompile er spildt.

**Ændring:** Tilføj en `prevShaderKey` ref og returner tidligt hvis nøglen ikke er ændret.

```ts
// Tilføj øverst i WaterSurface-komponenten (sammen med eksisterende refs):
const prevShaderKey = useRef('');

// Erstat det eksisterende useLayoutEffect([locationId]) for shader-patchning:
useLayoutEffect(() => {
  const mat = matRef.current;
  if (!mat) return;

  const cave = locationId === 'cave';
  const newKey = cave
    ? 'water-cave'
    : `water-shadow-flatten${locationId === 'jungle_island' ? '-jflat' : ''}`;

  // Tidlig exit: shader er identisk, ingen recompile nødvendig
  if (newKey === prevShaderKey.current) return;
  prevShaderKey.current = newKey;

  mat.onBeforeCompile = (shader) => {
    if (cave) return;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <shadowmap_vertex>',
      // ... behold den eksisterende lange shader-patch uændret her
    );
  };
  mat.customProgramCacheKey = () => newKey;
  mat.needsUpdate = true;
}, [locationId]);
```

> **Vigtigt:** Rør ikke indholdet af `onBeforeCompile` — kun wrapperen ændres.

### Test efter Trin 1

1. Åbn browser DevTools → Performance-fanen
2. Naviger hurtigt mellem pier → arctic_sea → smaragd → tropical_island → pier
3. Bekræft at ingen shader-kompilering sker ved disse skift (ingen GPU-stutter)
4. Naviger til grotten → bekræft shader skifter (cave-mode)
5. Naviger til jungleøen → bekræft shader skifter (jflat-mode)
6. Vandets udseende er visuelt identisk på alle lokationer

---

### Trin 2: #7 — PlayerStore og CollectionStore gemmer uden filter

**Berørt fil:** `src/logic/game-persistence.ts`

**Problem:** `usePlayerStore` og `useCollectionStore` abonneres uden nogen `shallowSame`-guard, i modsætning til math, UI og game-stores. For `useCollectionStore` er dette særligt problematisk: transiente UI-felter som `showRat`, `ratFactIndex`, `showParrot`, `parrotTypedText`, `parrotFullText`, `parrotJokePhase`, `showMonkeyBubble`, `showCabinInfo`, `showPlesioNPC`, `showWildTurtleModal` m.fl. trigger save-debounce ved enhver ændring — selv om de ikke persistes.

**Ændring:** Tilføj `pickPlayer()` og `pickCollection()` svarende til de eksisterende `pickMath()` og `pickUi()`, og tilføj `shallowSame`-guards på de to subscriptions.

```ts
// Tilføj disse to funktioner i game-persistence.ts
// Feltlisten er direkte afledt af buildGameSave() — opdatér listen hvis nye felter persistes

function pickPlayer(s: ReturnType<typeof usePlayerStore.getState>) {
  return {
    inventory: s.inventory,
    coins: s.coins,
    upgrades: s.upgrades,
    questItems: s.questItems,
    progression: s.progression,
    stats: s.stats,
    completedGoals: s.completedGoals,
    cheeseSources: s.cheeseSources,
    featherSources: s.featherSources,
    activeBait: s.activeBait,
    furniturePositions: s.furniturePositions,
    unlockedFurniture: s.unlockedFurniture,
    hiddenFurniture: s.hiddenFurniture,
    furnitureRoomAssignment: s.furnitureRoomAssignment,
    koedklumpActive: s.koedklumpActive,
    soeuhyreDefeated: s.soeuhyreDefeated,
    hvalbofActive: s.hvalbofActive,
    krakenDefeated: s.krakenDefeated,
    jungleDiscovered: s.jungleDiscovered,
    krakenLoss: s.krakenLoss,
    ownedWardrobeItemIds: s.ownedWardrobeItemIds,
    avatar: s.avatar,
    hasSeenWardrobeIntro: s.hasSeenWardrobeIntro,
    totalSuccessfulCatches: s.totalSuccessfulCatches,
    baitExpiry: s.baitExpiry,
    conchBaitExpiry: s.conchBaitExpiry,
    fossilBaitExpiry: s.fossilBaitExpiry,
    flyBaitExpiry: s.flyBaitExpiry,
    hajBloodExpiry: s.hajBloodExpiry,
    perleLimExpiry: s.perleLimExpiry,
    eggHatchAt: s.eggHatchAt,
    eggCountdown: s.eggCountdown,
    eggLeftTimestamp: s.eggLeftTimestamp,
    wildTurtleSpawned: s.wildTurtleSpawned,
  } as Record<string, unknown>;
}

function pickCollection(s: ReturnType<typeof useCollectionStore.getState>) {
  return {
    // Kun felter der faktisk persistes i buildGameSave()
    hasVisitedCabin: s.hasVisitedCabin,
    hasVisitedCabinKitchen: s.hasVisitedCabinKitchen,
    hasVisitedCabinBedroom: s.hasVisitedCabinBedroom,
    hasGoldenFrog: s.hasGoldenFrog,
    goldenFrogCount: s.goldenFrogCount,
    unlockedCompanions: s.unlockedCompanions,
    helleflynderCaught: s.helleflynderCaught,
    collectibleInventory: s.collectibleInventory,
    collectibleDelivered: s.collectibleDelivered,
    usedWishes: s.usedWishes,
    hasMonkeyOnPier: s.hasMonkeyOnPier,
    hasHeartBalloon: s.hasHeartBalloon,
    balloonPopped: s.balloonPopped,
    balloonCurrentHideout: s.balloonCurrentHideout,
  } as Record<string, unknown>;
}
```

Erstat derefter de to ukonditionelle subscriptions i `startPersistenceSubscription()`:

```ts
// GAMMEL:
const u1 = usePlayerStore.subscribe(schedule);
const u1b = useCollectionStore.subscribe(schedule);

// NY:
let prevP = pickPlayer(usePlayerStore.getState());
let prevC = pickCollection(useCollectionStore.getState());

const u1 = usePlayerStore.subscribe((s) => {
  const next = pickPlayer(s);
  if (shallowSame(prevP, next)) return;
  prevP = next;
  schedule();
});
const u1b = useCollectionStore.subscribe((s) => {
  const next = pickCollection(s);
  if (shallowSame(prevC, next)) return;
  prevC = next;
  schedule();
});
```

### Test efter Trin 2

1. Spil normalt i 2 minutter — fang fisk, navigér rundt
2. Åbn DevTools → Application → Local Storage → tjek at `regnefisken_save` stadig opdateres efter catches, level-ups, mål osv.
3. Åbn en Rotte-dialog eller Papegøje-dialog: disse bør **ikke** trigge save (tjek at `savedAt` i localStorage ikke ændrer sig)
4. Reload siden — bekræft at progression, mønter og items er bevaret
5. Sluk og tænd musikken — bør ikke trigge save (isMuted er i UIStore som allerede er filtreret)

> **Vigtig note:** Hvis du tilføjer nye persisterede felter til PlayerStore eller CollectionStore i fremtiden, skal `pickPlayer()`/`pickCollection()` opdateres tilsvarende.

---

### Trin 3: #9 — Vite chunk-splitting: drei adskilles fra Three.js

**Berørt fil:** `vite.config.ts`

**Problem:** `@react-three/drei` bundtes i dag sammen med Three.js og R3F i én `three-vendor`-chunk. Drei indeholder mange utilities der ikke bruges i spillet, og det blokerer for effektiv tree-shaking af de faktisk brugte dele.

**Ændring:** Opdel `three-vendor` i tre separate chunks og sænk warning-grænsen tilbage til en mere realistisk værdi:

```ts
// vite.config.ts — erstat hele rollupOptions-blokken:
rollupOptions: {
  output: {
    manualChunks(id) {
      if (!id.includes('node_modules')) return;

      // Three.js core — store, men stable og cacheable separat
      if (/node_modules[/\\]three[/\\]/.test(id)) {
        return 'three-core';
      }

      // R3F — bruger Three.js men er sin egen pakke
      if (id.includes('@react-three/fiber')) {
        return 'three-fiber';
      }

      // Drei + three-stdlib — hjælpekomponenter, adskilt for tree-shaking
      if (id.includes('@react-three/drei') || id.includes('three-stdlib')) {
        return 'three-drei';
      }

      // React-familien + Zustand
      if (
        /node_modules[/\\]react[/\\]/.test(id) ||
        /node_modules[/\\]react-dom[/\\]/.test(id) ||
        /node_modules[/\\]zustand[/\\]/.test(id)
      ) {
        return 'react-vendor';
      }
    },
  },
},
```

Tilpas også `chunkSizeWarningLimit` efter den nye opdeling:

```ts
build: {
  chunkSizeWarningLimit: 700, // Tre.js core alene er ~500 kB — warning ved alt over 700 kB
  // ...
}
```

### Test efter Trin 3

1. Kør `npm run build` — bekræft ingen build-fejl
2. Inspicér `dist/assets/`-mappen: du bør se separate chunks ved navn `three-core-[hash].js`, `three-fiber-[hash].js`, `three-drei-[hash].js`
3. Ingen af de tre chunks bør overskride 700 kB (minificeret)
4. Kør `npm run preview` og bekræft spillet loader og virker normalt
5. DevTools Network: bekræft at de tre chunks loades parallelt (HTTP/2 multiplexing)

---

## Fase 2 — Mellemkomplekse refaktoreringer

---

### Trin 4: #5 — GoalProgressSync useEffect → Zustand-subscription med debounce

**Berørte filer:**
- `src/logic/goal-progress.ts`
- `src/components/sync/GoalProgressSync.tsx`
- `src/logic/game-persistence.ts` (eller `src/main.tsx`)

**Problem:** Et `useEffect` med 11 dependencies kalder `tryCompleteNextGoal()` ved enhver ændring i stats, progression, questItems, cheeseSources, upgrades, collectibleInventory, collectibleDelivered, unlockedCompanions og usedWishes. `tryCompleteNextGoal` bygger et fuldt snapshot og kører `GOALS.find()` — ved hvert burst af state-ændringer (fx catch der giver XP + stats + coins på én gang) kaldes det flere gange unødigt.

**Ændring del 1:** Tilføj subscription-funktion i `src/logic/goal-progress.ts`:

```ts
// Tilføj i bunden af goal-progress.ts
import { useCollectionStore } from '../store/useCollectionStore.js';

let goalCheckTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleGoalCheck(): void {
  if (goalCheckTimer) clearTimeout(goalCheckTimer);
  goalCheckTimer = setTimeout(() => {
    goalCheckTimer = null;
    tryCompleteNextGoal();
  }, 250); // batch bursts (catch + XP + level-up sker inden for ~50 ms)
}

/** Start goal-subscription — kald én gang ved app-opstart (samme mønster som startPersistenceSubscription). */
export function startGoalProgressSubscription(): () => void {
  const u1 = usePlayerStore.subscribe(scheduleGoalCheck);
  const u2 = useCollectionStore.subscribe(scheduleGoalCheck);
  return () => {
    u1();
    u2();
    if (goalCheckTimer) clearTimeout(goalCheckTimer);
    goalCheckTimer = null;
  };
}
```

**Ændring del 2:** Kald `startGoalProgressSubscription()` fra `src/logic/game-persistence.ts` — tilføj i bunden af `bootstrapPersistence()`:

```ts
// I game-persistence.ts — tilføj import øverst:
import { startGoalProgressSubscription } from './goal-progress.js';

// I bootstrapPersistence() — tilføj som den sidste linje inden return:
startGoalProgressSubscription();
```

**Ændring del 3:** Fjern det tunge useEffect fra `src/components/sync/GoalProgressSync.tsx`:

```tsx
// SLET dette useEffect helt (de ~12 linjer der kalder tryCompleteNextGoal):
useEffect(() => {
  tryCompleteNextGoal();
}, [
  stats, progression, completedGoals, questItems, cheeseSources,
  featherSources, upgrades, collectibleInventory, collectibleDelivered,
  unlockedCompanions, usedWishes,
]);

// Fjern også disse nu-ubrugte imports fra GoalProgressSync.tsx hvis ingen andre bruger dem:
// - tryCompleteNextGoal (fra goal-progress)
// - upgrades, collectibleInventory, collectibleDelivered (fra store-selectors)
```

De øvrige useEffects i `GoalProgressSync` (monkey-pier, balloon-hideout, companion auto-unlock) forbliver uændret — de er React-specifikke og ikke en del af denne optimering.

### Test efter Trin 4

1. Fang en fisk: mål der opfyldes (XP, stats, coins) bør stadig trigge notification og belønning korrekt
2. Åbn mål-skærmen og verificér at eksisterende completede mål vises korrekt
3. Brug en ønske (wish) og bekræft at companion-unlock stadig virker
4. Klæk æg → bekræft turtle-mål trigger
5. Opgrader til et nyt level → bekræft level-baserede mål trigger
6. Ingen konsolfejl

---

### Trin 5: #3 — WaterSplashParticles: material-kloning → InstancedMesh

**Berørt fil:** `src/three/effects/WaterSplashParticles.tsx`

**Problem:** For hvert partikel ved vandstænk klones `baseMat` individuelt (`baseMat.clone()`). Det giver ét unikt GPU-materiale-objekt per partikel, ingen GPU-batching, og et GC-pres fra `.dispose()` ved partikel-død. Maks ~30 partikler ad gangen, men effekten kan forekomme hyppigt.

**Ændring:** Erstat clone+dispose-mønsteret med `InstancedMesh`. Alle partikler deler ét materiale og én geometri. Position og skalering styres via `setMatrixAt`.

Erstat hele indholdet af `WaterSplashParticles.tsx` med:

```tsx
import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import {
  InstancedMesh,
  MeshBasicMaterial,
  Matrix4,
  Object3D,
  TetrahedronGeometry,
  Vector3,
} from 'three';
import { useGameStore } from '../../store/useGameStore.js';
import { drainWaterSplashSpawns } from './waterSplashFx.js';

const MAX_PARTICLES = 48;
const GEO = new TetrahedronGeometry(0.15);
const MAT = new MeshBasicMaterial({ color: 0x87ceeb });

type Particle = {
  slot: number;
  position: Vector3;
  velocity: Vector3;
  life: number;
  decay: number;
  rotX: number;
  rotY: number;
};

const _dummy = new Object3D();
const _hidden = new Matrix4().makeScale(0, 0, 0);

export function WaterSplashParticles() {
  const meshRef = useRef<InstancedMesh>(null);
  const particles = useRef<Particle[]>([]);
  const usedSlots = useRef(new Set<number>());
  const prevGs = useRef(useGameStore.getState().gameState);

  function nextFreeSlot(): number | null {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (!usedSlots.current.has(i)) return i;
    }
    return null;
  }

  function spawnParticles(origin: Vector3, count: number) {
    for (let i = 0; i < count; i++) {
      const slot = nextFreeSlot();
      if (slot === null) return;
      usedSlots.current.add(slot);
      particles.current.push({
        slot,
        position: origin.clone().add(
          new Vector3((Math.random() - 0.5) * 0.5, 0, (Math.random() - 0.5) * 0.5),
        ),
        velocity: new Vector3(
          (Math.random() - 0.5) * 0.3,
          Math.random() * 0.5 + 0.1,
          (Math.random() - 0.5) * 0.3,
        ),
        life: 1,
        decay: 0.025 + Math.random() * 0.01,
        rotX: Math.random() * Math.PI * 2,
        rotY: Math.random() * Math.PI * 2,
      });
    }
  }

  // Spawn ved cast
  useRef(() => {
    return useGameStore.subscribe((s) => {
      const now = s.gameState;
      const was = prevGs.current;
      if (was === 'casting' && now === 'waiting') {
        spawnParticles(new Vector3(0, 0, -2.8), 15);
      }
      prevGs.current = now;
    });
  });

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // Spawn fra eksterne triggers
    for (const batch of drainWaterSplashSpawns()) {
      spawnParticles(batch.origin, batch.count);
    }

    const list = particles.current;

    // Opdatér aktive partikler
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.life -= p.decay;
      p.position.add(p.velocity);
      p.velocity.y -= 0.02;
      p.rotX += 0.1;
      p.rotY += 0.1;

      if (p.life <= 0 || p.position.y < -2) {
        // Skjul slot
        mesh.setMatrixAt(p.slot, _hidden);
        usedSlots.current.delete(p.slot);
        list.splice(i, 1);
      } else {
        // Opdatér matrix
        _dummy.position.copy(p.position);
        _dummy.rotation.set(p.rotX, p.rotY, 0);
        const s = p.life * 0.5;
        _dummy.scale.setScalar(s);
        _dummy.updateMatrix();
        mesh.setMatrixAt(p.slot, _dummy.matrix);
      }
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[GEO, MAT, MAX_PARTICLES]} frustumCulled={false} />
  );
}
```

> **Note:** `useRef(() => { return useGameStore.subscribe(...) })` i ovenstående er en forenklet illustration. I praksis skal subscription-logikken ligge i et `useEffect` med tom dependency array. Cursor bør rette dette korrekt.

### Test efter Trin 5

1. Kast fiskestangen: vandstænk-animation bør se identisk ud som før
2. Kast hurtigt 5-6 gange i træk: bekræft at mange partikler ikke forårsager fejl
3. DevTools Performance: bekræft færre draw calls under splash-events (brug `Renderer.info.render.calls` i konsollen)
4. Ingen konsoladvarsler om manglende `.dispose()`

---

### Trin 6: #1 — scene.traverse envMapIntensity: kør kun ved faktisk ændring

**Berørt fil:** `src/three/useRendererSettings.ts`

**Problem:** `useRendererSettings` kører `scene.traverse()` inde i `useFrame()` — dvs. ~60 gange i sekundet. Den gennemgår hele scenegraf'en for at sætte `envMapIntensity` på alle mesh-materialer. `pmremExposure` og `locationId` ændrer sig kun sjældent (ved indstillingsskift eller lokationsskift), men traverse kører uanset.

**Ændring:** Tilføj en `prevExposure` ref og returner tidligt fra traverse-logikken hvis exposure-værdien ikke har ændret sig. `gl.toneMappingExposure` sættes stadig hvert frame (billig operation):

```ts
// Erstat hele useRendererSettings-kroppen:
export function useRendererSettings() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const graphicsQuality = useUIStore((s) => s.graphicsQuality);
  const prevExposure = useRef(-1); // -1 = aldrig sat endnu

  useEffect(() => {
    const qualityDpr =
      graphicsQuality === 'low'
        ? 0.75
        : graphicsQuality === 'medium'
          ? 1.0
          : Math.min(window.devicePixelRatio, graphicsQuality === 'ultra' ? 2.5 : 2.0);
    gl.setPixelRatio(Math.min(qualityDpr, window.devicePixelRatio));
  }, [graphicsQuality, gl]);

  useFrame(() => {
    const pmrem = useUIStore.getState().pmremExposure;
    const locationId = useGameStore.getState().currentLocation;
    const exposure = effectivePmremExposure(pmrem, locationId);

    // Sæt tone mapping hvert frame (billig GPU-uniform opdatering)
    gl.toneMappingExposure = exposure;

    // Traverse KUN når exposure rent faktisk ændrer sig
    if (exposure === prevExposure.current) return;
    prevExposure.current = exposure;

    scene.traverse((obj) => {
      if (!(obj instanceof Mesh)) return;
      const mat = obj.material;
      const list = Array.isArray(mat) ? mat : [mat];
      for (const m of list) {
        if (m && typeof m === 'object' && 'envMapIntensity' in m) {
          const std = m as MeshStandardMaterial;
          if (typeof std.envMapIntensity === 'number') {
            const o = (std.userData as { envMapIntensityOverride?: number })
              .envMapIntensityOverride;
            std.envMapIntensity = o !== undefined ? o : exposure;
          }
        }
      }
    });
  });
}
```

### Test efter Trin 6

1. Naviger mellem 5-6 lokationer hurtigt: fiskenes `envMapIntensity` bør opdateres korrekt (blank/metallisk look bibeholdes)
2. Justér "PMREM Eksponering" i grafik-indstillinger: bekræft at scene opdateres korrekt
3. Gå ind i grotten: bekræft at `effectivePmremExposure` stadig returnerer 0.95 (grotte-override)
4. DevTools Performance: traverse bør ikke forekomme i flammerne under normalt gameplay (kun ved indstillingsskift/lokationsskift)

---

## Fase 3 — GPU-arbejde

> Trin 7 og 8 kræver GLSL-shader-kendskab. Test grundigt på flere enheder — særligt mobil og integreret grafik.

---

### Trin 7: #4 — WeatherParticles: JS-loop → GPU ShaderMaterial

**Berørte filer:**
- `src/three/effects/WeatherParticles.tsx`

**Problem:** Regnanimationen opdaterer 2 000 partikelpositioner i en JavaScript-loop hvert frame. GPU'en kan beregne disse positioner med modulus-matematik i en vertex shader uden nogen CPU-loop.

**Ændring:** Erstat det CPU-baserede system med et `ShaderMaterial` på en `THREE.Points`-geometri med 2000 tomme vertices. Positionen beregnes udelukkende i vertex shaderen via `u_time`, `u_fall` og `u_drift` uniforms.

Erstat hele indholdet af `WeatherParticles.tsx`:

```tsx
import { useMemo, useRef } from 'react';
import { BufferAttribute, BufferGeometry, Points, ShaderMaterial } from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/useGameStore.js';
import { getWeatherEntry } from '../logic/environment.js';

const COUNT = 2000;

// Vertex shader: al partikellogik på GPU
const VERT = /* glsl */ `
  uniform float u_time;
  uniform float u_fall;
  uniform float u_drift;

  float hash01(float n) {
    return fract(sin(n * 12.9898) * 43758.5453);
  }

  void main() {
    float i = float(gl_VertexID);

    // Deterministiske startpositioner per partikel (identiske med JS-versionen)
    float baseX = (hash01(i * 3.0) - 0.5) * 60.0;
    float baseY = hash01(i * 3.0 + 1.0) * 40.0;
    float baseZ = (hash01(i * 3.0 + 2.0) - 0.5) * 60.0;

    // Fald med wrapping
    float y = mod(baseY - u_time * u_fall * 10.0, 42.0) - 2.0;

    // Storm-drift i X
    float x = mod(baseX + u_time * u_drift * 10.0 + 30.0, 60.0) - 30.0;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(x, y, baseZ, 1.0);
    gl_PointSize = 2.0;
  }
`;

const FRAG = /* glsl */ `
  uniform float u_opacity;
  void main() {
    gl_FragColor = vec4(0.667, 0.667, 0.667, u_opacity);
  }
`;

export function WeatherParticles() {
  const ref = useRef<Points>(null);

  // Tom geometri — kun en placeholder for vertex count
  const geometry = useMemo(() => {
    const geo = new BufferGeometry();
    // gl_VertexID virker med et dummy-attribut der definerer vertex count
    const dummy = new Float32Array(COUNT);
    geo.setAttribute('position', new BufferAttribute(dummy, 1));
    return geo;
  }, []);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms: {
          u_time:    { value: 0 },
          u_fall:    { value: 0 },
          u_drift:   { value: 0 },
          u_opacity: { value: 0.6 },
        },
        transparent: true,
        depthWrite: false,
      }),
    [],
  );

  useFrame((state) => {
    const { weatherType: wx, currentLocation } = useGameStore.getState();
    const w = getWeatherEntry(wx);
    const pts = ref.current;
    if (!pts) return;

    const outdoors = currentLocation !== 'cave';
    pts.visible = w.rain && outdoors;
    if (!pts.visible) return;

    const unis = (pts.material as ShaderMaterial).uniforms;
    unis.u_time.value = state.clock.elapsedTime;
    unis.u_fall.value = w.storm ? 0.8 : 0.4;
    unis.u_drift.value = w.storm ? 0.1 : 0;
  });

  return (
    <points ref={ref} geometry={geometry} material={material} visible={false} frustumCulled={false} />
  );
}
```

> **Note om `gl_VertexID`:** Denne GLSL built-in variabel er tilgængelig i WebGL2, som Three.js (r125+) bruger som default. Bekræft at `renderer.capabilities.isWebGL2` er `true` i konsollen hvis der opstår shader-fejl.

### Test efter Trin 7

1. Skift vejr til regn (via admin-panel eller naturlig vejrskift): regnanimation bør se identisk ud
2. Skift til storm: drift i X-aksen bør forekomme som før
3. Gå ind i grotten: regn bør forsvinde
4. DevTools Performance: CPU-usage bør falde mærkbart under regnvejr
5. Test på mobil: bekræft WebGL2 understøttelse og korrekt visuel output
6. Konsollen: ingen shader-kompileringsfejl

---

### Trin 8: #2 — Vandgeometri: CPU vertex-animation → GLSL vertex shader

**Berørte filer:**
- `src/three/effects/WaterSurface.tsx`
- `src/three/logic/waterWaves.ts` (kan ophøre med at eksportere `updateWaterGeometry`)

**Problem:** `updateWaterGeometry()` opdaterer 1 681 vertices (40×40 PlaneGeometry) i JavaScript hvert frame med `sin`, `cos`, `sqrt` og lokationsspecifikke masker. `computeVertexNormals()` kører efterfølgende som et ekstra CPU-pass. Alt dette kan flyttes til GPU'en.

**Ændring:** Konvertér `WaterSurface` til at bruge et `ShaderMaterial` der beregner bølgedisplacement og normaler analytisk i GLSL. Lokationstilstanden sendes som en integer uniform `u_mode`.

**Del A — Erstat geometry-update i `WaterSurface.tsx`:**

Fjern kaldet til `updateWaterGeometry` fra `useFrame`, og tilføj ShaderMaterial med uniforms:

```ts
// Lokationstilstande som integers
const WATER_MODE: Record<string, number> = {
  tropical_island: 1,
  jungle_island:   2,
  desert_lake:     3,
  arctic_sea:      4,
  cave:            5,
};
```

Erstat `<meshStandardMaterial>` med `<shaderMaterial>` og tilhørende uniforms:

```tsx
const waterUniforms = useMemo(() => ({
  u_time:      { value: 0 },
  u_amp:       { value: 0.3 },
  u_speed:     { value: 1.0 },
  u_mode:      { value: 0 },
  u_color:     { value: new Color(waterColor) },
}), [waterColor]);

// I useFrame (forenklet — erstatter updateWaterGeometry-kaldet):
useFrame((state) => {
  const mesh = meshRef.current;
  if (!mesh || isCabinLocation(locationId)) return;
  const mat = mesh.material as ShaderMaterial;
  const w = getWeatherEntry(weatherType);
  mat.uniforms.u_time.value = state.clock.elapsedTime;
  mat.uniforms.u_speed.value = w.storm ? 2.5 : 1.0;
  mat.uniforms.u_amp.value = w.waveAmp;
  mat.uniforms.u_mode.value = WATER_MODE[locationId] ?? 0;
  mat.uniforms.u_color.value.setHex(waterColor);
});
```

**Del B — GLSL vertex shader:**

Dette er den centrale ændring. Shaderen implementerer samtlige lokationsspecifikke masker fra `waterWaves.ts` i GLSL:

```glsl
// Vertex shader (u_mode styrer lokationsspecifik maskning)
uniform float u_time;
uniform float u_amp;
uniform float u_speed;
uniform int u_mode;

void main() {
  vec3 pos = position; // PlaneGeometry er i XY-planet, roteret -90° i verden

  float wave = u_amp * sin(pos.x * 0.5 + u_time * u_speed)
             + u_amp * 0.5 * cos(pos.y * 0.3 + u_time * u_speed * 1.5);

  float mask = 1.0;

  if (u_mode == 1) {
    // Tropical island — cirkulær maske (lagune er flad)
    float dx = pos.x - 0.0;
    float dy = pos.y + 11.5;
    float dist = sqrt((dx / 1.32) * (dx / 1.32) + dy * dy);
    mask = clamp((dist - 15.0) / 2.0, 0.0, 1.0);
    pos.z = wave * mask;

  } else if (u_mode == 2) {
    // Jungle island
    float dx = pos.x;
    float dy = pos.y + 14.0;
    float dist = sqrt((dx / 1.32) * (dx / 1.32) + dy * dy);
    mask = clamp((dist - 22.0) / 4.0, 0.0, 1.0);
    float underIsland = -0.42 * (1.0 - mask);
    pos.z = wave * mask + underIsland;

  } else if (u_mode == 3) {
    // Desert lake
    float nx = (pos.x - 0.0) / 15.7;
    float nz = (-pos.y - (-7.0)) / 9.1;
    float normDist = sqrt(nx * nx + nz * nz);
    float rawMask = clamp((1.0 - normDist) / (1.0 - 0.96), 0.0, 1.0);
    float shoreMask = rawMask * rawMask * (3.0 - 2.0 * rawMask);
    // Bridge exclusion
    bool inBridge = pos.x >= -1.65 && pos.x <= 1.65 && (-pos.y) >= 0.05 && (-pos.y) <= 11.2;
    float finalMask = inBridge ? 0.0 : shoreMask;
    pos.z = -1.25 * (1.0 - finalMask) + (0.11 + wave * 0.12 * finalMask) * finalMask;

  } else if (u_mode == 4) {
    // Arctic sea
    float wz = -pos.y;
    float seaFrontMask = clamp((-0.9 - wz) / 2.1, 0.0, 1.0);
    bool inBridge = pos.x >= -2.05 && pos.x <= 2.05 && wz >= -1.2 && wz <= 11.4;
    float finalMask = inBridge ? 0.0 : seaFrontMask;
    pos.z = wave * finalMask + -1.2 * (1.0 - finalMask);

  } else if (u_mode == 5) {
    // Cave — ingen bølger
    pos.z = 0.0;

  } else {
    // Default — pier, smaragd, forbidden, abyss
    pos.z = wave;
  }

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
```

Fragment shader og normal-beregning:

```glsl
// Fragment shader
uniform vec3 u_color;
uniform float u_roughness;

void main() {
  // Analytisk normal baseret på bølgegradient (undgår computeVertexNormals)
  // Simpel approksimation — tilstrækkelig for vandoverfladen
  gl_FragColor = vec4(u_color, 1.0);
}
```

> **Note om normals:** Den fulde analytiske normal-beregning i GLSL kræver at `dFdx`/`dFdy` benyttes i fragment shaderen, eller at gradienten udregnes analytisk i vertex shaderen via de afledede af `sin`/`cos`. For en simpel vandoverflade med `roughness ≈ 0.42` er effekten af præcise normals begrænset. Test visuelt og tilpas om nødvendigt.

> **Skyggerne:** Det eksisterende shadow-patch fra `onBeforeCompile` (Trin 1) er ikke relevant for ShaderMaterial — ShaderMaterial har sin egen shadow-logik. Verificér at `receiveShadow` stadig fungerer korrekt eller deaktivér det hvis det ikke er nødvendigt for ShaderMaterial.

**Del C — Ryd op i `waterWaves.ts`:**

`updateWaterGeometry()` bruges ikke længere. Filen kan reduceres til kun at eksportere `getWaterColorHex()`, eller slettes helt hvis farvelogikken flyttes til WaterSurface direkte.

### Test efter Trin 8

1. **Visuel check alle lokationer:**
   - Pier/smaragd/forbidden/abyss: normale bølger
   - Tropisk ø: flad lagune, bølger kun i yderkanten
   - Jungleø: flad indre del med underø-sænkning
   - Ørkensø: stille vand i oval, tørt rundt om, ingen bølger under broen
   - Arktisk hav: bølger kun i front-delen, flat under broen
   - Grotten: helt fladt vand
2. **Vejrcheck:** Storm → kraftigere bølger på alle relevante lokationer
3. **Skygger:** Bekræft at vandets skygge-modtagelse ikke er defekt (særligt vigtig på pier med sol)
4. **Performance:** DevTools → CPU-usage bør falde mærkbart under vandanimation
5. **Mobil:** Test på mindst én mobil-enhed — WebGL2 shader-kompilering første gang kan give et kort hak
6. **Konsol:** Ingen GLSL-kompileringsfejl

---

## Sammenfatning: alle berørte filer

| Trin | Fil | Type ændring | Risiko |
|------|-----|-------------|--------|
| 1 | `src/three/effects/WaterSurface.tsx` | Tilføj `prevShaderKey` ref guard | 🟢 Lav |
| 2 | `src/logic/game-persistence.ts` | Tilføj `pickPlayer` + `pickCollection` med guards | 🟢 Lav |
| 3 | `vite.config.ts` | Opdel `three-vendor` i tre chunks | 🟢 Lav |
| 4 | `src/logic/goal-progress.ts` | Tilføj `startGoalProgressSubscription` | 🟡 Middel |
| 4 | `src/components/sync/GoalProgressSync.tsx` | Fjern 11-dep useEffect | 🟡 Middel |
| 4 | `src/logic/game-persistence.ts` | Kald `startGoalProgressSubscription()` ved bootstrap | 🟡 Middel |
| 5 | `src/three/effects/WaterSplashParticles.tsx` | Rewrite til InstancedMesh | 🟡 Middel |
| 6 | `src/three/useRendererSettings.ts` | Tilføj `prevExposure` guard i useFrame | 🟡 Middel |
| 7 | `src/three/effects/WeatherParticles.tsx` | Rewrite til GPU ShaderMaterial | 🟠 Høj |
| 8 | `src/three/effects/WaterSurface.tsx` | Konvertér til ShaderMaterial med GLSL | 🔴 Meget høj |
| 8 | `src/three/logic/waterWaves.ts` | Reducer/slet `updateWaterGeometry` | 🔴 Meget høj |

**Rør ikke:**
- `src/components/sync/GoalProgressSync.tsx` → companion-unlock og balloon/monkey useEffects (beholdes)
- `src/three/effects/WaterSurface.tsx` → `useLayoutEffect` for synlighed og `receiveShadow` (beholdes)
- `src/three/effects/GameEffects.tsx` — upåvirket
- Alle store-filer — upåvirket
