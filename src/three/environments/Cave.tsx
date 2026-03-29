import { useLayoutEffect, useMemo, useRef } from 'react';
import { AdditiveBlending, Group, Mesh, Points } from 'three';
import { useFrame } from '@react-three/fiber';

function det(i: number, j: number) {
  const x = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const CRYSTAL_COLORS = [0x00ff88, 0x00ffcc, 0x44ff44, 0x88ffcc];

/**
 * Glødende oktaeder (diamantformede) — statiske meshes, til forskel fra de små bevægelige punkt-sporer.
 * Placeret mod sider og dybde, væk fra ruin-bro (z ≈ 1–11).
 */
const CRYSTAL_BASE: readonly [number, number, number][] = [
  [-17, 2.2, -15],
  [17, 2.0, -14],
  [-12, 5.0, -19],
  [12, 4.8, -18],
  [-21, 1.4, -9],
  [21, 1.5, -8],
];

/** Lag 1: klippe-punktlys i `CaveFillLights` rammer kun dette (vand er kun lag 0 — ingen spejlpletter). */
export const CAVE_ROCK_RECEIVE_LAYER = 1;

/** Mørk grotte: vægge, drypsten, krystaller, biolum-sporer — fra legacy `buildCave`. */
export function Cave() {
  const rootRef = useRef<Group>(null);
  const sporeRef = useRef<Points>(null);
  const sporePos = useMemo(() => {
    const a = new Float32Array(400 * 3);
    for (let i = 0; i < 400; i++) {
      a[i * 3] = (det(i, 0) - 0.5) * 50;
      a[i * 3 + 1] = -2 + det(i, 1) * 22;
      a[i * 3 + 2] = (det(i, 2) - 0.5) * 50;
    }
    return a;
  }, []);

  const rocks = useMemo(
    () =>
      [
        [0, 2, -18],
        [-12, 0, -14],
        [12, 0, -14],
        [-18, -2, -4],
        [18, -2, -4],
        [-16, 1, 8],
        [16, 1, 8],
        [-8, 4, -20],
        [8, 4, -20],
        [0, 8, -22],
      ] as const,
    [],
  );

  useLayoutEffect(() => {
    rootRef.current?.traverse((obj) => {
      if (obj instanceof Mesh || obj instanceof Points) {
        obj.layers.enable(CAVE_ROCK_RECEIVE_LAYER);
      }
    });
  }, []);

  useFrame(({ clock }) => {
    const geo = sporeRef.current?.geometry;
    if (!geo?.attributes.position) return;
    const t = clock.elapsedTime;
    const arr = geo.attributes.position.array as Float32Array;
    for (let i = 0; i < 400; i++) {
      arr[i * 3 + 1] += Math.sin(t + i * 0.1) * 0.002;
    }
    geo.attributes.position.needsUpdate = true;
  });

  return (
    <group ref={rootRef}>
      {rocks.map(([x, y, z], i) => {
        const size = 6 + det(i, 3) * 8;
        return (
          <mesh
            key={i}
            position={[x, y - 4, z]}
            rotation={[det(i, 4) * Math.PI, det(i, 5) * Math.PI, det(i, 6) * Math.PI]}
          >
            <dodecahedronGeometry args={[size, 0]} />
            <meshStandardMaterial
              color={0x2d3640}
              roughness={0.93}
              metalness={0.12}
              emissive={0x0d1116}
              emissiveIntensity={0.08}
              flatShading
            />
          </mesh>
        );
      })}
      {Array.from({ length: 8 }, (_, i) => {
        const h = 1.85 + det(i, 7) * 3.4;
        const r = 0.2 + det(i, 10) * 0.28;
        return (
          <mesh
            key={`s-${i}`}
            position={[-8 + i * 2.3 + (det(i, 8) - 0.5), 8.5 - h / 2, -8 + det(i, 9) * 6]}
            rotation={[Math.PI, 0, 0]}
          >
            <coneGeometry args={[r, h, 6]} />
            <meshStandardMaterial
              color={0x323a44}
              roughness={0.86}
              metalness={0.05}
              emissive={0x0b1016}
              emissiveIntensity={0.065}
              flatShading
            />
          </mesh>
        );
      })}
      {Array.from({ length: 6 }, (_, i) => {
        const [bx, by, bz] = CRYSTAL_BASE[i]!;
        const cx = bx + (det(i, 11) - 0.5) * 2.2;
        const cy = by + (det(i, 12) - 0.5) * 1.6;
        const cz = bz + (det(i, 13) - 0.5) * 2.2;
        const ccol = CRYSTAL_COLORS[i % CRYSTAL_COLORS.length]!;
        return (
          <group key={`c-${i}`} position={[cx, cy, cz]}>
            <pointLight
              color={ccol}
              intensity={0.58}
              distance={36}
              decay={1}
              castShadow={false}
            />
            <mesh>
              <octahedronGeometry args={[0.3 + det(i, 14) * 0.2, 0]} />
              <meshStandardMaterial
                color={ccol}
                emissive={ccol}
                emissiveIntensity={0.8}
                roughness={0.1}
                flatShading
              />
            </mesh>
          </group>
        );
      })}
      <points ref={sporeRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sporePos, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={0x4ade80}
          size={0.22}
          transparent
          opacity={0.85}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
    </group>
  );
}
