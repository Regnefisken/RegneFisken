import { useMemo, useRef } from 'react';
import { AdditiveBlending, type Points } from 'three';
import { useFrame } from '@react-three/fiber';

function det(i: number, j: number) {
  const x = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const CRYSTAL_COLORS = [0x00ff88, 0x00ffcc, 0x44ff44, 0x88ffcc];

/** Mørk grotte: vægge, drypsten, krystaller, biolum-sporer — fra legacy `buildCave`. */
export function Cave() {
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
    <group>
      {rocks.map(([x, y, z], i) => {
        const size = 6 + det(i, 3) * 8;
        return (
          <mesh
            key={i}
            position={[x, y - 4, z]}
            rotation={[det(i, 4) * Math.PI, det(i, 5) * Math.PI, det(i, 6) * Math.PI]}
            castShadow
          >
            <dodecahedronGeometry args={[size, 0]} />
            <meshStandardMaterial color={0x111111} roughness={1} metalness={0.1} flatShading />
          </mesh>
        );
      })}
      {Array.from({ length: 8 }, (_, i) => {
        const h = 1.5 + det(i, 7) * 3;
        return (
          <mesh
            key={`s-${i}`}
            position={[-8 + i * 2.3 + (det(i, 8) - 0.5), 10 - h / 2, -8 + det(i, 9) * 6]}
            rotation={[Math.PI, 0, 0]}
          >
            <coneGeometry args={[0.15 + det(i, 10) * 0.2, h, 5]} />
            <meshStandardMaterial color={0x1a1a1a} roughness={0.9} flatShading />
          </mesh>
        );
      })}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh
          key={`c-${i}`}
          position={[-10 + i * 4 + (det(i, 11) - 0.5) * 2, -0.5 + det(i, 12) * 2, -10 + det(i, 13) * 4]}
        >
          <octahedronGeometry args={[0.3 + det(i, 14) * 0.2, 0]} />
          <meshStandardMaterial
            color={CRYSTAL_COLORS[i % CRYSTAL_COLORS.length]}
            emissive={CRYSTAL_COLORS[i % CRYSTAL_COLORS.length]}
            emissiveIntensity={0.8}
            roughness={0.1}
            flatShading
          />
        </mesh>
      ))}
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
      <pointLight color={0x00ff88} intensity={0.4} distance={30} position={[0, 3, -5]} />
    </group>
  );
}
