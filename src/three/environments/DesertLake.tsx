import { useMemo, useRef } from 'react';
import { AdditiveBlending, type Points } from 'three';
import { useFrame } from '@react-three/fiber';

function det(i: number, j: number) {
  const x = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Ørkensø: sand, stenring, kaktusser, solskive, støv — fra legacy `buildDesertLake`. */
export function DesertLake() {
  const dustRef = useRef<Points>(null);
  const dustPos = useMemo(() => {
    const a = new Float32Array(300 * 3);
    for (let i = 0; i < 300; i++) {
      a[i * 3] = (det(i, 0) - 0.5) * 60;
      a[i * 3 + 1] = det(i, 1) * 2;
      a[i * 3 + 2] = (det(i, 2) - 0.5) * 60;
    }
    return a;
  }, []);

  const rocks = useMemo(() => {
    const STONE_RING_CENTER_Z = -7.0;
    const STONE_RING_RX = 15.5;
    const STONE_RING_RZ = 8.0;
    const STONE_COUNT = 12;
    const list: { x: number; y: number; z: number; s: number; rx: number; ry: number; rz: number }[] = [];
    for (let i = 0; i < STONE_COUNT; i++) {
      const s = 0.8 + det(i, 3) * 1.6;
      const t = i / (STONE_COUNT - 1);
      const angle = Math.PI + Math.PI * t;
      const x = Math.cos(angle) * STONE_RING_RX + (det(i, 4) - 0.5) * 1.9;
      const z = STONE_RING_CENTER_Z + Math.sin(angle) * STONE_RING_RZ + (det(i, 5) - 0.5) * 1.4;
      list.push({
        x,
        y: s * 0.38,
        z,
        s,
        rx: det(i, 6) * Math.PI,
        ry: det(i, 7) * Math.PI,
        rz: det(i, 8) * Math.PI,
      });
    }
    [-1, 1].forEach((side, si) => {
      for (let i = 0; i < 2; i++) {
        const s = 0.9 + det(si * 4 + i, 9) * 1.2;
        list.push({
          x: side * (9.5 + i * 1.8 + det(si * 4 + i, 10) * 0.8),
          y: s * 0.36,
          z: -1.8 - i * 1.6 + (det(si * 4 + i, 11) - 0.5) * 0.6,
          s,
          rx: det(si * 4 + i, 12) * Math.PI,
          ry: det(si * 4 + i, 13) * Math.PI,
          rz: det(si * 4 + i, 14) * Math.PI,
        });
      }
    });
    return list;
  }, []);

  useFrame(() => {
    const geo = dustRef.current?.geometry;
    if (!geo?.attributes.position) return;
    const arr = geo.attributes.position.array as Float32Array;
    const n = 300;
    for (let i = 0; i < n; i++) {
      const iz = i * 3 + 2;
      arr[iz] += 0.12;
      arr[i * 3 + 1] += 0.015;
      if (arr[iz] > 20) {
        arr[iz] = -40;
        arr[i * 3 + 1] = (det(i, 20) - 0.5) * 30;
        arr[i * 3] = (det(i, 21) - 0.5) * 40;
      }
    }
    geo.attributes.position.needsUpdate = true;
  });

  const saguaro = useMemo(
    () => ({
      trunk: { color: 0x4caf50, roughness: 0.82, flatShading: true as const },
      flower: { color: 0xd93829, roughness: 0.7, flatShading: true as const },
    }),
    [],
  );

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color={0xe8c97a} roughness={1} flatShading />
      </mesh>
      {rocks.map((r, i) => (
        <mesh
          key={i}
          position={[r.x, r.y, r.z]}
          rotation={[r.rx, r.ry, r.rz]}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[r.s, 0]} />
          <meshStandardMaterial color={0xc4a35a} roughness={0.9} flatShading />
        </mesh>
      ))}
      {/* Saguaro */}
      <group position={[3.8, 0, 4.9]} rotation={[0, (-35 * Math.PI) / 180, 0]} scale={0.9}>
        <mesh position={[0, 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.5, 0.5, 4, 8]} />
          <meshStandardMaterial {...saguaro.trunk} />
        </mesh>
        <mesh position={[-0.8, 2.5, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.4, 0.4, 1.5, 8]} />
          <meshStandardMaterial {...saguaro.trunk} />
        </mesh>
        <mesh position={[-1.35, 3.05, 0]} castShadow>
          <cylinderGeometry args={[0.4, 0.4, 1.5, 8]} />
          <meshStandardMaterial {...saguaro.trunk} />
        </mesh>
        <mesh position={[0.8, 1.5, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.4, 0.4, 1.5, 8]} />
          <meshStandardMaterial {...saguaro.trunk} />
        </mesh>
        <mesh position={[1.35, 2.05, 0]} castShadow>
          <cylinderGeometry args={[0.4, 0.4, 1.5, 8]} />
          <meshStandardMaterial {...saguaro.trunk} />
        </mesh>
      </group>
      {/* Barrel cactus */}
      <group position={[-10, 0, 0.9]} scale={1.15}>
        <mesh position={[0, 1, 0]} castShadow receiveShadow>
          <icosahedronGeometry args={[1.5, 1]} />
          <meshStandardMaterial color={0x1a5624} roughness={0.85} flatShading />
        </mesh>
        <mesh position={[0, 2.4, 0]} rotation={[Math.PI, 0, 0]} castShadow>
          <coneGeometry args={[0.8, 1, 5]} />
          <meshStandardMaterial {...saguaro.flower} />
        </mesh>
      </group>
      {/* Prickly pear */}
      <group position={[-4.4, 0, 4.8]} rotation={[0, Math.PI, 0]} scale={0.88}>
        {[
          [0, 0.8, 0, 0, 1.0],
          [-0.6, 2.0, 0, -0.4, 0.8],
          [0.8, 1.8, 0.2, 0.3, 0.9],
          [-1.2, 3.0, 0.1, -0.6, 0.7],
          [0.2, 3.2, -0.1, 0.1, 0.8],
          [1.2, 2.8, -0.1, 0.5, 0.6],
        ].map((pad, i) => (
          <mesh
            key={i}
            position={[pad[0]!, pad[1]!, pad[2]!]}
            rotation={[0, 0, pad[3]!]}
            scale={[pad[4]!, pad[4]! * 1.2, pad[4]! * 0.4]}
            castShadow
          >
            <dodecahedronGeometry args={[0.8, 0]} />
            <meshStandardMaterial color={0x7cb31b} roughness={0.84} flatShading />
          </mesh>
        ))}
        <mesh position={[-1.6, 3.6, 0.1]} castShadow>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
          <meshStandardMaterial {...saguaro.flower} />
        </mesh>
        <mesh position={[1.6, 3.3, -0.1]} castShadow>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
          <meshStandardMaterial {...saguaro.flower} />
        </mesh>
      </group>
      {/* Organ pipe */}
      <group position={[20.5, 0, -15.5]} scale={1.35}>
        {[
          [0, 0, 5],
          [0.6, 0.2, 4],
          [-0.6, -0.1, 3.5],
          [0.3, 0.6, 2.5],
          [-0.4, 0.5, 4.5],
          [0.8, -0.4, 2.0],
        ].map(([x, z, h], i) => (
          <mesh key={i} position={[x!, h! / 2, z!]} scale={[1, h!, 1]} castShadow receiveShadow>
            <cylinderGeometry args={[0.35, 0.35, 1, 6]} />
            <meshStandardMaterial color={0x24756c} roughness={0.8} flatShading />
          </mesh>
        ))}
      </group>
      <mesh position={[-20, 18, -35]}>
        <sphereGeometry args={[3, 12, 8]} />
        <meshBasicMaterial color={0xffd700} />
      </mesh>
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustPos, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={0xffaa55}
          size={0.18}
          transparent
          opacity={0.35}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
    </group>
  );
}
