import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

import { JunglePlayerController } from './JunglePlayerController.js';
import type { Group } from 'three';

const SEG = 48;
const ISLAND_Z = 14;

type LeafMatProps = { color: number; roughness: number; flatShading: boolean };

/** Afstand fra øens xz-centrum (0, 14) til grov Y på terrænet (local, før islandLift). */
function terrainYAt(x: number, z: number, hillTopY: number): number {
  const dx = x;
  const dz = z - ISLAND_Z;
  const d = Math.sqrt(dx * dx + dz * dz);
  if (d < 5.0) {
    const t = d / 5.0;
    return hillTopY * (1 - t) + 0.08 * t;
  }
  if (d < 8.5) return 0.06;
  if (d < 11) return 0.02;
  return -0.02;
}

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

/** 12 ankre i trækronernes højde (y 4–8), spredt på øen. */
const LIANA_ANCHORS: [number, number, number][] = [
  [-5.0, 5.2, 16],
  [4.5, 6.1, 19],
  [-3.0, 4.5, 22],
  [6.0, 7.2, 24],
  [-7.0, 5.8, 12],
  [2.0, 6.5, 26],
  [-2.0, 4.8, 14],
  [5.0, 5.5, 21],
  [-4.0, 7.0, 23],
  [3.0, 4.2, 17],
  [7.0, 6.0, 20],
  [-6.0, 5.0, 18],
];

/** TRIN 2: koncentriske cylinder-lag — centrum [0,0,14], se JUNGLE_IMPLEMENTATION_GUIDE.md */
export function JungleIsland() {
  const terrainMats = useMemo(
    () => ({
      sub: { color: 0x2a3a2a, roughness: 0.92, flatShading: true as const },
      sand: { color: 0xc4a265, roughness: 0.88, flatShading: true as const },
      transition: { color: 0x8a7a45, roughness: 0.9, flatShading: true as const },
      soil: { color: 0x241a0e, roughness: 0.92, flatShading: true as const },
      forest: { color: 0x2c3824, roughness: 0.94, flatShading: true as const },
      hill: { color: 0x4a3a28, roughness: 0.88, flatShading: true as const },
    }),
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
  const hillTopY = 0.325;

  const treeInstances = useMemo(() => buildTreeInstances(hillTopY), []);
  const rockInstances = useMemo(() => buildRockInstances(hillTopY), []);

  return (
    <>
      <JunglePlayerController />
      <group position={[0, islandLift, 0]}>
        <pointLight position={[-8, 2, 8]} color={0xcc8844} intensity={0.4} distance={20} />
        <pointLight position={[6, 2, 10]} color={0xcc8844} intensity={0.3} distance={18} />

        {/*
          Undervandsbase dybere under vandplan (y=0): top ~-0.55 local så grøn base ikke dominerer ved strand.
          Top-radius 13 — dækkes af sand (bund 13) med skråning.
        */}
        <mesh position={[0, -1.55, ISLAND_Z]} receiveShadow>
          <cylinderGeometry args={[13.0, 14.0, 2.0, SEG]} />
          <meshStandardMaterial {...terrainMats.sub} />
        </mesh>
        <mesh position={[0, -0.4, ISLAND_Z]} receiveShadow>
          <cylinderGeometry args={[12.5, 13.0, 0.8, SEG]} />
          <meshStandardMaterial {...terrainMats.sand} />
        </mesh>
        <mesh position={[0, -0.1, ISLAND_Z]} receiveShadow>
          <cylinderGeometry args={[10.6, 11.2, 0.3, SEG]} />
          <meshStandardMaterial {...terrainMats.transition} />
        </mesh>
        <mesh position={[0, 0.0, ISLAND_Z]} receiveShadow>
          <cylinderGeometry args={[9.8, 10.2, 0.2, SEG]} />
          <meshStandardMaterial {...terrainMats.soil} />
        </mesh>
        <mesh position={[0, 0.05, ISLAND_Z]} receiveShadow>
          <cylinderGeometry args={[7.5, 8.5, 0.15, SEG]} />
          <meshStandardMaterial {...terrainMats.forest} />
        </mesh>
        <mesh position={[0, 0.15, ISLAND_Z]} receiveShadow>
          <cylinderGeometry args={[4.0, 5.0, 0.35, SEG]} />
          <meshStandardMaterial {...terrainMats.hill} />
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
