import { useEffect, useMemo, useRef } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { useFrame } from '@react-three/fiber';
import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  PointLight,
} from 'three';

import { useAudio } from '../../audio/useAudio.js';
import { useGameStore } from '../../store/useGameStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import { buildPirateMesh } from '../meshes/pirate-mesh.js';
import { TreasureChestModel } from '../models/junkAndTreasureModels.js';
import { AmbientJunglePlesiosaurus } from './AmbientJunglePlesiosaurus.js';
import { JungleFishingSwimPlesio } from './JungleFishingSwimPlesio.js';
import { JungleFishingBucket } from './JungleFishingBucket.js';
import { JunglePier } from './JunglePier.js';
import { JunglePlayerController } from './JunglePlayerController.js';
import {
  HILL_TOP_Y,
  ISLAND_Z,
  JUNGLE_FISH_BUCKET_X,
  JUNGLE_FISH_BUCKET_Z,
  SHORE_R,
  SHORE_Y,
  smoothstep,
  terrainColorAtDistance,
  jungleFishingBucketLocalY,
  terrainSurfaceYAt,
  terrainYAt,
} from './jungleTerrain.js';

const COAL_COLORS = [0xff4500, 0xff8c00, 0xffd700, 0xb22222];
const FLAME_COLORS = [0xff4500, 0xff8c00, 0xffd700];

function ffHash01(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const SEG = 48;

type LeafMatProps = { color: number; roughness: number; flatShading: boolean };

type JungleTreeProps = {
  seed: number;
  height: number;
  position: [number, number, number];
  trunkMat: { color: number; roughness: number; flatShading: boolean };
  leafMats: [LeafMatProps, LeafMatProps, LeafMatProps];
};

/** TRIN 3: procedurale jungletræer — stablet stamme + 4 icosahedron-kroner. */
function JungleTree({ seed, height, position, trunkMat, leafMats }: JungleTreeProps) {
  const trunkSegments = 9;
  const trunkHeight = height * 0.44;
  const segH = trunkHeight / trunkSegments;
  const baseR = 0.11 + (height / 13) * 0.28;

  const leafVariant = Math.abs(Math.floor(seed * 1000)) % 3;
  const leafMat = leafMats[leafVariant];

  const crownRadii = useMemo(() => {
    const h = height;
    return [h * 0.34, h * 0.26, h * 0.19, h * 0.13] as const;
  }, [height]);

  return (
    <group position={position}>
      {Array.from({ length: trunkSegments }, (_, i) => {
        const t0 = i / trunkSegments;
        const t1 = (i + 1) / trunkSegments;
        const rBot = baseR * (1 - t0 * 0.52);
        const rTop = baseR * (1 - t1 * 0.52);
        const y = (i + 0.5) * segH;
        const lean = Math.sin(seed + i * 0.3) * 0.15;
        return (
          <mesh key={i} position={[0, y, 0]} rotation={[0, 0, lean]} castShadow>
            <cylinderGeometry args={[rTop, rBot, segH, 12]} />
            <meshStandardMaterial {...trunkMat} />
          </mesh>
        );
      })}

      {crownRadii.map((rad, k) => {
        let y = trunkHeight;
        for (let j = 0; j < k; j++) {
          y += crownRadii[j] * 0.92;
        }
        y += rad * 0.5;
        return (
          <mesh key={`leaf-${k}`} position={[0, y, 0]} castShadow>
            <icosahedronGeometry args={[rad, 1]} />
            <meshStandardMaterial {...leafMat} />
          </mesh>
        );
      })}
    </group>
  );
}

function buildTreeInstances(
  hillTopY: number,
): { seed: number; height: number; position: [number, number, number] }[] {
  const out: { seed: number; height: number; position: [number, number, number] }[] = [];
  let i = 0;
  const push = (x: number, z: number, height: number) => {
    const y = terrainYAt(x, z, hillTopY);
    out.push({ seed: 42 + i * 7, height, position: [x, y, z] });
    i += 1;
  };

  /* Centrum-cluster — højeste træ ved [0, ?, 26] */
  push(0, 26, 13);
  push(-2, 25, 10.5);
  push(1.5, 27, 9.8);
  push(-1.2, 26.2, 8.5);
  push(2.1, 25.4, 9.2);

  /* Ring (23): radius ~6–9 fra (0, 14) */
  for (let k = 0; k < 23; k++) {
    const golden = k * 2.39996322972865332;
    const r = 6 + (k % 4) * 0.72 + (k % 3) * 0.35;
    const x = Math.cos(golden) * r;
    const z = ISLAND_Z + Math.sin(golden) * r;
    const h = 7 + (k % 9) * 0.58 + (k % 2) * 0.35;
    push(x, z, Math.min(12.4, h));
  }

  /* Ydre (6): radius ~10–11, lavere */
  for (let k = 0; k < 6; k++) {
    const angle = (k / 6) * Math.PI * 2 + 0.72;
    const r = 10.1 + (k % 2) * 0.65;
    const x = Math.cos(angle) * r;
    const z = ISLAND_Z + Math.sin(angle) * r;
    push(x, z, 6.5 + (k % 3) * 0.45);
  }

  return out;
}

type JungleRockProps = {
  position: [number, number, number];
  scale: number | [number, number, number];
  seed: number;
};

/** TRIN 4a: klippe (én dodecahedron). */
function JungleRock({ position, scale, seed }: JungleRockProps) {
  const rockMat = useMemo(
    () => ({ color: 0x4a5040, roughness: 0.9, flatShading: true as const }),
    [],
  );

  const rotation = useMemo((): [number, number, number] => {
    const h = (n: number) => (Math.sin(seed * n + 1.2) * 0.5 + 0.5) * Math.PI * 2;
    return [h(2.1), h(3.7), h(1.9)];
  }, [seed]);

  const s = typeof scale === 'number' ? ([scale, scale, scale] as [number, number, number]) : scale;

  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow scale={s}>
        <dodecahedronGeometry args={[1, 1]} />
        <meshStandardMaterial {...rockMat} />
      </mesh>
    </group>
  );
}

function buildRockInstances(hillTopY: number): { position: [number, number, number]; scale: [number, number, number]; seed: number }[] {
  const out: { position: [number, number, number]; scale: [number, number, number]; seed: number }[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = i * 0.82 * Math.PI + 0.35 + Math.sin(i * 2.1) * 0.2;
    const r = 8.1 + (i % 4) * 0.65 + (i % 2) * 0.4;
    const x = Math.cos(angle) * r;
    const z = ISLAND_Z + Math.sin(angle) * r;
    const y = terrainYAt(x, z, hillTopY) + 0.12;
    const sx = 0.38 + (i % 3) * 0.08 + Math.sin(i * 1.7) * 0.06;
    const sy = 0.32 + (i % 2) * 0.07;
    const sz = 0.36 + (i % 4) * 0.05;
    out.push({
      position: [x, y, z],
      scale: [sx, sy, sz],
      seed: 17.3 + i * 4.17,
    });
  }
  return out;
}

type LianaGroupProps = {
  anchorPosition: [number, number, number];
  seed: number;
};

/** TRIN 4b: lianer der gynger (rotation.x). */
function LianaGroup({ anchorPosition, seed }: LianaGroupProps) {
  const groupRef = useRef<Group>(null);
  const freq = useMemo(() => 0.3 + Math.abs(Math.sin(seed * 1.1)) * 0.5, [seed]);
  const amplitude = useMemo(() => 0.05 + Math.abs(Math.cos(seed * 0.83)) * 0.1, [seed]);

  const segments = useMemo(() => {
    const n = 3 + (Math.floor(Math.abs(seed * 7)) % 3);
    const out: { h: number; r: number }[] = [];
    for (let i = 0; i < n; i++) {
      const h = 2 + (Math.abs(Math.sin(seed * (i + 2.2))) * 2);
      const r = 0.03 + (Math.abs(Math.cos(seed * (i + 0.7))) * 0.03);
      out.push({ h, r });
    }
    return out;
  }, [seed]);

  const vineMat = useMemo(
    () => ({ color: 0x2e4a1a, roughness: 0.92, flatShading: true as const }),
    [],
  );

  useFrame(({ clock }) => {
    const g = groupRef.current;
    if (g) {
      g.rotation.x = Math.sin(clock.elapsedTime * freq + seed) * amplitude;
    }
  });

  return (
    <group ref={groupRef} position={anchorPosition}>
      {segments.map((s, i) => {
        let prev = 0;
        for (let j = 0; j < i; j++) prev += segments[j].h;
        const centerY = -(prev + s.h / 2);
        return (
          <mesh key={i} position={[0, centerY, 0]} castShadow>
            <cylinderGeometry args={[s.r * 0.92, s.r, s.h, 6]} />
            <meshStandardMaterial {...vineMat} />
          </mesh>
        );
      })}
    </group>
  );
}

const FIREFLY_COUNT = 32;
/** Træer: ring ~6–9, ydre ring ~10–11, midter-cluster ~11–13 fra (0, ISLAND_Z). Lidt margen så det føles naturligt. */
const FIREFLY_MIN_R = 5.1;
const FIREFLY_MAX_R = 13.9;

type FireflyParticleCfg = {
  baseX: number;
  baseZ: number;
  baseY: number;
  ampX: number;
  ampZ: number;
  fx: number;
  fz: number;
  fy: number;
  phx: number;
  phz: number;
  phy: number;
  baseEmissive: number;
  pulseSpeed: number;
  pulseOff: number;
  hasLight: boolean;
  lightIntensity: number;
  lightDistance: number;
};

function Fireflies({ hillTopY }: { hillTopY: number }) {
  const groupRefs = useRef<(Group | null)[]>([]);
  const particles = useMemo((): FireflyParticleCfg[] => {
    return Array.from({ length: FIREFLY_COUNT }, (_, i) => {
      const ang = ffHash01(i * 2.17) * Math.PI * 2;
      const r = FIREFLY_MIN_R + ffHash01(i * 3.41) * (FIREFLY_MAX_R - FIREFLY_MIN_R);
      const baseX = Math.cos(ang) * r;
      const baseZ = ISLAND_Z + Math.sin(ang) * r;
      const terrY = terrainYAt(baseX, baseZ, hillTopY);
      const baseY = terrY + 0.3 + ffHash01(i * 5.03) * 3.7;
      return {
        baseX,
        baseZ,
        baseY,
        ampX: 0.1 + ffHash01(i * 7.1) * 0.25,
        ampZ: 0.1 + ffHash01(i * 7.2) * 0.25,
        fx: 0.12 + ffHash01(i * 8.1) * 0.35,
        fz: 0.11 + ffHash01(i * 8.2) * 0.33,
        fy: 0.25 + ffHash01(i * 9.1) * 0.4,
        phx: ffHash01(i * 11) * Math.PI * 2,
        phz: ffHash01(i * 12) * Math.PI * 2,
        phy: ffHash01(i * 13) * Math.PI * 2,
        baseEmissive: 1.5 + ffHash01(i * 14) * 1.0,
        pulseSpeed: 1.8 + ffHash01(i * 15) * 2.2,
        pulseOff: ffHash01(i * 16) * Math.PI * 2,
        hasLight: i % 4 === 0,
        lightIntensity: 0.06 + ffHash01(i * 17) * 0.06,
        lightDistance: 4 + ffHash01(i * 18) * 2,
      };
    });
  }, [hillTopY]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    particles.forEach((cfg, i) => {
      const g = groupRefs.current[i];
      if (!g) return;
      let x = cfg.baseX + Math.sin(t * cfg.fx + cfg.phx) * cfg.ampX;
      let z = cfg.baseZ + Math.cos(t * cfg.fz + cfg.phz) * cfg.ampZ;
      const dx = x;
      const dz = z - ISLAND_Z;
      const dist = Math.hypot(dx, dz);
      if (dist > FIREFLY_MAX_R && dist > 1e-6) {
        const s = FIREFLY_MAX_R / dist;
        x = dx * s;
        z = ISLAND_Z + dz * s;
      } else if (dist < FIREFLY_MIN_R && dist > 1e-6) {
        const s = FIREFLY_MIN_R / dist;
        x = dx * s;
        z = ISLAND_Z + dz * s;
      }
      const y = cfg.baseY + Math.sin(t * cfg.fy + cfg.phy) * 0.35;
      g.position.set(x, y, z);
      const mesh = g.children[0];
      if (mesh instanceof Mesh && mesh.material instanceof MeshStandardMaterial) {
        mesh.material.emissiveIntensity =
          cfg.baseEmissive + Math.sin(t * cfg.pulseSpeed + cfg.pulseOff) * 0.4;
      }
    });
  });

  return (
    <>
      {particles.map((cfg, i) => (
        <group
          key={i}
          ref={(el) => {
            groupRefs.current[i] = el;
          }}
        >
          <mesh>
            <sphereGeometry args={[0.03, 6, 4]} />
            <meshStandardMaterial
              color={0xffaa33}
              emissive={0xffaa33}
              emissiveIntensity={cfg.baseEmissive}
              roughness={0.4}
            />
          </mesh>
          {cfg.hasLight && (
            <pointLight
              color={0xffaa33}
              intensity={cfg.lightIntensity}
              distance={cfg.lightDistance}
              decay={2}
            />
          )}
        </group>
      ))}
    </>
  );
}

/** Bålplads-centrum matcher `JungleCampfire` (xz omkring øens midte). */
const CAMPFIRE_XZ: [number, number] = [0, ISLAND_Z];

function JunglePirateNpc({ hillTopY }: { hillTopY: number }) {
  const pirateObj = useMemo(() => {
    const p = buildPirateMesh();
    p.userData.hoverScale = p.userData.originalScale;
    return p;
  }, []);
  const pirateRef = useRef<Group>(null);
  const { play } = useAudio();
  const setShowJunglePirateDialog = useUIStore((s) => s.setShowJunglePirateDialog);
  const pirateX = 2.61;
  const pirateZ = 16.29;
  const terrainY = terrainSurfaceYAt(pirateX, pirateZ, hillTopY);
  /** Modellens +Z er frem — peg på bålet (0, 14). */
  const yawToCampfire = Math.atan2(CAMPFIRE_XZ[0] - pirateX, CAMPFIRE_XZ[1] - pirateZ);

  useFrame(({ clock }) => {
    const root = pirateRef.current;
    if (!root?.userData?.torso) return;
    const d = root.userData;
    const t = clock.elapsedTime + (d.timeOffset ?? 0);
    d.torso.position.y = 2.2 + Math.sin(t * 1.8) * 0.028;
    d.headGroup.position.y = 3.4 + Math.sin(t * 1.8) * 0.022;
    d.headGroup.rotation.y = Math.sin(t * 0.55) * 0.15;
    d.hatGroup.position.y = 0.85 + Math.sin(t * 2.6) * 0.006;
    d.armR.rotation.x = -0.7 + Math.sin(t * 1.5) * 0.04;
    d.armL.rotation.x = -0.2 + Math.sin(t * 1.5 + 1.0) * 0.04;
  });

  return (
    <group
      position={[pirateX, terrainY, pirateZ]}
      rotation={[0, yawToCampfire, 0]}
      userData={{ jungleNpcClick: 'pirate' }}
    >
      <primitive
        ref={pirateRef}
        object={pirateObj}
        onPointerDown={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          play('ui');
          setShowJunglePirateDialog(true);
        }}
      />
    </group>
  );
}

function JungleCampfire({ hillTopY }: { hillTopY: number }) {
  const flameGroupRef = useRef<Group>(null);
  const fireLightRef = useRef<PointLight | null>(null);
  const y0 = terrainYAt(0, ISLAND_Z, hillTopY);

  const coalData = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        col: COAL_COLORS[i % COAL_COLORS.length]!,
        x: ((i * 47) % 100) / 100 - 0.5,
        y: 0.08 + ((i * 31) % 14) / 100,
        z: ((i * 53) % 22) / 100 - 0.05,
        s: ((i * 19) % 40) / 100 + 0.28,
      })),
    [],
  );

  const flameData = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        col: FLAME_COLORS[i % 3]!,
        x: ((i * 41) % 110) / 100 - 0.55,
        y: 0.22 + ((i * 29) % 50) / 100,
        z: 0.06,
        sy: ((i * 37) % 120) / 100 + 0.45,
        sx: ((i * 23) % 50) / 100 + 0.22,
        speed: ((i * 13) % 20) / 1000 + 0.008,
        offset: ((i * 17) % 628) / 100,
        ry: ((i * 59) % 314) / 100,
      })),
    [],
  );

  const stones = useMemo(() => {
    const n = 9;
    return Array.from({ length: n }, (_, k) => {
      const a = (k / n) * Math.PI * 2 + ffHash01(k * 3.1) * 0.2;
      const rr = 0.78 + ffHash01(k * 5.2) * 0.12;
      return {
        x: Math.cos(a) * rr,
        z: Math.sin(a) * rr,
        rot: ffHash01(k * 7.1) * Math.PI * 2,
        scale: 0.85 + ffHash01(k * 8.2) * 0.35,
      };
    });
  }, []);

  const logs = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        x: (ffHash01(i * 2.1) - 0.5) * 0.5,
        z: (ffHash01(i * 3.2) - 0.5) * 0.5,
        rotX: (ffHash01(i * 4.1) - 0.5) * 1.1,
        rotZ: (ffHash01(i * 5.1) - 0.5) * 1.2,
        rotY: ffHash01(i * 6.1) * Math.PI * 2,
      })),
    [],
  );

  const logMat = { color: 0x3d2b18, roughness: 0.9, flatShading: true as const };

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    flameGroupRef.current?.traverse((obj) => {
      if (!(obj instanceof Mesh) || !obj.userData?.isFlame) return;
      const ud = obj.userData as { baseY: number; speed: number; offset: number };
      obj.position.y = ud.baseY + Math.sin(time * ud.speed * 100 + ud.offset) * 0.15;
      obj.scale.x = 0.4 + Math.sin(time * ud.speed * 80 + ud.offset) * 0.12;
    });
    const L = fireLightRef.current;
    if (L) L.intensity = 1.8 + Math.sin(time * 3) * 0.5;
  });

  return (
    <group position={[0, y0, ISLAND_Z]}>
      {stones.map((s, i) => (
        <mesh
          key={`cf-stone-${i}`}
          position={[s.x, 0.06, s.z]}
          rotation={[0.2, s.rot, 0.15]}
          scale={s.scale}
          castShadow
        >
          <dodecahedronGeometry args={[0.12, 0]} />
          <meshStandardMaterial color={0x555555} roughness={0.95} flatShading />
        </mesh>
      ))}
      {logs.map((lg, i) => (
        <mesh
          key={`cf-log-${i}`}
          position={[lg.x, 0.12 + i * 0.04, lg.z]}
          rotation={[lg.rotX, lg.rotY, lg.rotZ]}
          castShadow
        >
          <cylinderGeometry args={[0.02, 0.03, 0.5, 6]} />
          <meshStandardMaterial {...logMat} />
        </mesh>
      ))}
      {coalData.map((c, i) => (
        <mesh key={`cf-coal-${i}`} position={[c.x * 0.45, c.y, c.z]} scale={[c.s, c.s, c.s]} castShadow>
          <dodecahedronGeometry args={[0.06, 0]} />
          <meshStandardMaterial
            color={c.col}
            emissive={c.col}
            emissiveIntensity={0.55 + (i % 35) / 100}
            flatShading
          />
        </mesh>
      ))}
      <group ref={flameGroupRef}>
        {flameData.map((f, i) => (
          <mesh
            key={`cf-fl-${i}`}
            position={[f.x * 0.45, f.y, f.z]}
            scale={[f.sx, f.sy, f.sx]}
            rotation={[0, f.ry, 0]}
            userData={{
              isFlame: true,
              baseY: f.y,
              speed: f.speed,
              offset: f.offset,
            }}
            castShadow
          >
            <octahedronGeometry args={[0.08, 0]} />
            <meshStandardMaterial
              color={f.col}
              emissive={f.col}
              emissiveIntensity={0.85 + (i % 40) / 100}
              flatShading
            />
          </mesh>
        ))}
      </group>
      <pointLight ref={fireLightRef} color={0xffaa33} intensity={1.8} distance={8} decay={2} position={[0, 0.35, 0]} />
    </group>
  );
}

/** 12 ankre i trækronernes højde, spredt på øen (+0.58 for hævet bakke vs. gamle absolutte Y). */
const LIANA_ANCHORS: [number, number, number][] = [
  [-5.0, 5.78, 16],
  [4.5, 6.68, 19],
  [-3.0, 5.08, 22],
  [6.0, 7.78, 24],
  [-7.0, 6.38, 12],
  [2.0, 7.08, 26],
  [-2.0, 5.38, 14],
  [5.0, 6.08, 21],
  [-4.0, 7.58, 23],
  [3.0, 4.78, 17],
  [7.0, 6.58, 20],
  [-6.0, 5.58, 18],
];

const RADIAL_SEGS = 64;
/** Indre ringe 0→SHORE_R (terræn); ydre ringe kurver ned under vandet. */
const INNER_RING_COUNT = 24;
const OUTER_RING_COUNT = 4;
const TOTAL_RING_COUNT = INNER_RING_COUNT + OUTER_RING_COUNT;
/** Synlig sand-underside under vandoverfladen — matcher ikke gameplay-terræn. */
const ISLAND_OUTER_R = 32;
const ISLAND_OUTER_Y = -1.2;
const SAND_UNDERWATER_RGB: [number, number, number] = [0.769, 0.635, 0.396];

/** TRIN 2: radial disc + undervandsbase — centrum [0,0,14] */
export function JungleIsland() {
  const subMat = useMemo(
    () => ({ color: 0x2a3a2a, roughness: 0.92, flatShading: true as const }),
    [],
  );
  const trunkMat = useMemo(
    () => ({ color: 0x3d2b18, roughness: 0.9, flatShading: true as const }),
    [],
  );
  const leafMats = useMemo(
    () =>
      [
        { color: 0x1a5c1a, roughness: 0.85, flatShading: true as const },
        { color: 0x144414, roughness: 0.88, flatShading: true as const },
        { color: 0x1e6e20, roughness: 0.85, flatShading: true as const },
      ] as [LeafMatProps, LeafMatProps, LeafMatProps],
    [],
  );

  const islandLift = 0.12;
  const hillTopY = HILL_TOP_Y;
  const jungleFishBucketY = jungleFishingBucketLocalY(hillTopY);

  const islandGeo = useMemo(() => {
    const geo = new BufferGeometry();
    const verts: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    const centerY = terrainYAt(0, ISLAND_Z, hillTopY);
    verts.push(0, centerY, ISLAND_Z);
    const c0 = terrainColorAtDistance(0);
    colors.push(c0[0], c0[1], c0[2]);

    for (let ring = 1; ring <= TOTAL_RING_COUNT; ring++) {
      let r: number;
      if (ring <= INNER_RING_COUNT) {
        r = (ring / INNER_RING_COUNT) * SHORE_R;
      } else {
        const u = (ring - INNER_RING_COUNT) / OUTER_RING_COUNT;
        r = SHORE_R + u * (ISLAND_OUTER_R - SHORE_R);
      }
      for (let seg = 0; seg < RADIAL_SEGS; seg++) {
        const angle = (seg / RADIAL_SEGS) * Math.PI * 2;
        const x = Math.cos(angle) * r;
        const z = ISLAND_Z + Math.sin(angle) * r;
        const y =
          r <= SHORE_R
            ? terrainYAt(x, z, hillTopY)
            : SHORE_Y + (ISLAND_OUTER_Y - SHORE_Y) * smoothstep(SHORE_R, ISLAND_OUTER_R, r);
        verts.push(x, y, z);
        const tc = r <= SHORE_R ? terrainColorAtDistance(r) : SAND_UNDERWATER_RGB;
        colors.push(tc[0], tc[1], tc[2]);
      }
    }

    for (let s = 0; s < RADIAL_SEGS; s++) {
      const next = (s + 1) % RADIAL_SEGS;
      indices.push(0, 1 + next, 1 + s);
    }
    for (let ring = 1; ring < TOTAL_RING_COUNT; ring++) {
      const ringStart = 1 + (ring - 1) * RADIAL_SEGS;
      const nextRingStart = 1 + ring * RADIAL_SEGS;
      for (let s = 0; s < RADIAL_SEGS; s++) {
        const sNext = (s + 1) % RADIAL_SEGS;
        const a = ringStart + s;
        const b = ringStart + sNext;
        const c = nextRingStart + s;
        const d = nextRingStart + sNext;
        indices.push(a, b, c);
        indices.push(b, d, c);
      }
    }

    geo.setIndex(indices);
    geo.setAttribute('position', new Float32BufferAttribute(new Float32Array(verts), 3));
    geo.setAttribute('color', new Float32BufferAttribute(new Float32Array(colors), 3));
    geo.computeVertexNormals();
    return geo;
  }, [hillTopY]);

  useEffect(() => {
    return () => {
      islandGeo.dispose();
    };
  }, [islandGeo]);

  const treeInstances = useMemo(() => buildTreeInstances(hillTopY), [hillTopY]);
  const rockInstances = useMemo(() => buildRockInstances(hillTopY), [hillTopY]);
  const jungleParasolVisible = useGameStore((s) => s.jungleParasolVisible);
  const jungleFishing = useGameStore((s) => s.jungleFishing);

  return (
    <>
      <JunglePier />
      <JunglePlayerController />
      <AmbientJunglePlesiosaurus />
      {jungleFishing ? <JungleFishingSwimPlesio /> : null}
      <group position={[0, islandLift, 0]}>
        {jungleParasolVisible ? (
          <JungleFishingBucket position={[JUNGLE_FISH_BUCKET_X, jungleFishBucketY, JUNGLE_FISH_BUCKET_Z]} />
        ) : null}
        <Fireflies hillTopY={hillTopY} />
        <JungleCampfire hillTopY={hillTopY} />
        <JunglePirateNpc hillTopY={hillTopY} />

        {/* Låst kiste delvist nedgravet på bagsiden af øen. */}
        <group
          position={[-1.5, terrainSurfaceYAt(-1.5, 36, hillTopY) - 0.18, 36]}
          rotation={[0.25, -0.35, 0]}
          scale={1.15}
        >
          <TreasureChestModel />
        </group>

        {/*
          Undervandsbase: flugter med den radiale skives ydre ring (r≈32, y≈-1.2) under vandet.
        */}
        <mesh position={[0, -2.2, ISLAND_Z]} receiveShadow>
          <cylinderGeometry args={[ISLAND_OUTER_R, ISLAND_OUTER_R + 0.6, 2.0, SEG]} />
          <meshStandardMaterial {...subMat} />
        </mesh>

        <mesh geometry={islandGeo} receiveShadow>
          <meshStandardMaterial vertexColors roughness={0.9} flatShading={false} />
        </mesh>

        {rockInstances.map((r, idx) => (
          <JungleRock key={`rock-${idx}`} position={r.position} scale={r.scale} seed={r.seed} />
        ))}

        {treeInstances.map((t, idx) => (
          <JungleTree
            key={idx}
            seed={t.seed}
            height={t.height}
            position={t.position}
            trunkMat={trunkMat}
            leafMats={leafMats}
          />
        ))}

        {LIANA_ANCHORS.map((anchor, idx) => (
          <LianaGroup key={`liana-${idx}`} anchorPosition={anchor} seed={200 + idx * 17} />
        ))}
      </group>
    </>
  );
}
