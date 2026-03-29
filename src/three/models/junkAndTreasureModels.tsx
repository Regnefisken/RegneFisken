import { useMemo, useRef } from 'react';
import { Group, Mesh, QuadraticBezierCurve3, TubeGeometry, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import type { RollCatchResult } from '../../types/fish.js';

function hex(c: number) {
  return `#${(c >>> 0).toString(16).padStart(6, '0')}`;
}

function HavtangJunk({ bucketIdle }: { bucketIdle?: boolean }) {
  const groupRef = useRef<Group>(null);
  const leafRefs = useRef<(Mesh | null)[]>([]);
  const geos = useMemo(() => {
    const curves = [0, 1, 2].map((k) => {
      const o = k * 0.4;
      return new QuadraticBezierCurve3(
        new Vector3(-0.2 + o, 0.5, 0),
        new Vector3(-0.9 + o * 0.5, 1.2, 0.3 * (k - 1)),
        new Vector3(-1.4 + o, 0.2, 0)
      );
    });
    return curves.map((c) => new TubeGeometry(c, 16, 0.06, 6, false));
  }, []);
  const D = bucketIdle ? 0.35 : 1;
  useFrame(({ clock }) => {
    const g = groupRef.current;
    if (!g) return;
    const t = clock.elapsedTime;
    g.rotation.y += 0.01 * D;
    g.position.y = Math.sin(t * 1.2) * 0.08 * D;
    leafRefs.current.forEach((leaf, i) => {
      if (leaf?.geometry?.type === 'TubeGeometry') {
        const base = (leaf.userData.baseRotZ as number) ?? 0;
        leaf.rotation.z = base + Math.sin(t * 2 + i) * 0.15 * D;
      }
    });
  });
  return (
    <group ref={groupRef} scale={0.55}>
      {geos.map((geo, i) => (
        <mesh
          key={i}
          ref={(el) => {
            leafRefs.current[i] = el;
            if (el && el.userData.baseRotZ === undefined) el.userData.baseRotZ = el.rotation.z;
          }}
          geometry={geo}
          castShadow
        >
          <meshStandardMaterial color="#228b22" roughness={0.65} />
        </mesh>
      ))}
    </group>
  );
}

/** Fallback-støvle + 6 themed junk-varianter (legacy createCatchModel junk-gren). */
export function JunkCatchModel({
  fish,
  bucketIdle,
}: {
  fish: RollCatchResult;
  bucketIdle?: boolean;
}) {
  const groupRef = useRef<Group>(null);
  const v = fish.visual ?? 'boot';
  const bodyColor = hex(fish.color);

  useFrame(({ clock }) => {
    const g = groupRef.current;
    if (!g) return;
    const t = clock.elapsedTime;
    const D = bucketIdle ? 0.35 : 1;
    g.rotation.y = Math.sin(t * 0.8) * 0.3 * D;
    g.rotation.z = Math.cos(t * 0.6) * 0.1 * D;
    g.position.y = Math.sin(t * 1.2) * 0.08 * D;
  });

  if (v === 'tire') {
    return (
      <group ref={groupRef} scale={0.45}>
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.95, 0.32, 12, 28]} />
          <meshStandardMaterial color={bodyColor} roughness={0.85} metalness={0.15} />
        </mesh>
      </group>
    );
  }
  if (v === 'wheel') {
    return (
      <group ref={groupRef} scale={0.42}>
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.7, 0.06, 8, 24]} />
          <meshStandardMaterial color="#6b7280" roughness={0.7} metalness={0.4} />
        </mesh>
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.35, Math.sin(a) * 0.35, 0]} castShadow>
              <boxGeometry args={[0.12, 0.45, 0.06]} />
              <meshStandardMaterial color="#5c4033" roughness={0.9} />
            </mesh>
          );
        })}
      </group>
    );
  }
  if (v === 'glove') {
    return (
      <group ref={groupRef} scale={0.55}>
        <mesh castShadow position={[0, 0, 0]}>
          <sphereGeometry args={[0.35, 10, 8]} />
          <meshStandardMaterial color={bodyColor} roughness={0.55} />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} castShadow position={[0.45, -0.05, -0.12 + i * 0.08]}>
            <cylinderGeometry args={[0.05, 0.045, 0.22, 6]} />
            <meshStandardMaterial color={bodyColor} roughness={0.55} />
          </mesh>
        ))}
        <mesh castShadow position={[0.52, 0.08, 0.22]} rotation={[0, 0, 0.4]}>
          <cylinderGeometry args={[0.055, 0.05, 0.18, 6]} />
          <meshStandardMaterial color={bodyColor} roughness={0.55} />
        </mesh>
      </group>
    );
  }
  if (v === 'bottle') {
    return (
      <group ref={groupRef} scale={0.5}>
        <mesh castShadow position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.75, 12]} />
          <meshPhysicalMaterial
            color={bodyColor}
            transmission={0.65}
            thickness={0.2}
            roughness={0.2}
            transparent
            opacity={0.92}
          />
        </mesh>
        <mesh castShadow position={[0, 0.82, 0]}>
          <cylinderGeometry args={[0.1, 0.2, 0.2, 10]} />
          <meshStandardMaterial color={bodyColor} roughness={0.35} />
        </mesh>
        <mesh castShadow position={[0, 0.98, 0]}>
          <cylinderGeometry args={[0.11, 0.11, 0.12, 8]} />
          <meshStandardMaterial color="#3d2817" roughness={0.8} />
        </mesh>
      </group>
    );
  }
  if (v === 'teddy') {
    return (
      <group ref={groupRef} scale={0.5}>
        <mesh castShadow>
          <sphereGeometry args={[0.4, 12, 10]} />
          <meshStandardMaterial color={bodyColor} roughness={0.95} />
        </mesh>
        <mesh castShadow position={[0.35, 0.35, 0]}>
          <sphereGeometry args={[0.22, 10, 8]} />
          <meshStandardMaterial color={bodyColor} roughness={0.95} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} castShadow position={[s * 0.38, 0.42, 0]}>
            <sphereGeometry args={[0.12, 8, 6]} />
            <meshStandardMaterial color={bodyColor} roughness={0.95} />
          </mesh>
        ))}
        <mesh castShadow position={[0.12, 0.38, 0.28]}>
          <sphereGeometry args={[0.05, 6, 4]} />
          <meshBasicMaterial color="#111" />
        </mesh>
        <mesh castShadow position={[0.12, 0.38, -0.28]}>
          <sphereGeometry args={[0.05, 6, 4]} />
          <meshBasicMaterial color="#111" />
        </mesh>
      </group>
    );
  }
  if (v === 'havtang') {
    return <HavtangJunk bucketIdle={bucketIdle} />;
  }

  return (
    <group ref={groupRef} scale={0.5}>
      <mesh castShadow position={[0, 0.35, 0]}>
        <boxGeometry args={[0.35, 0.85, 0.42]} />
        <meshStandardMaterial color={bodyColor} roughness={0.75} />
      </mesh>
      <mesh castShadow position={[0.22, -0.15, 0]} rotation={[0, 0, -0.2]}>
        <boxGeometry args={[0.55, 0.2, 0.38]} />
        <meshStandardMaterial color="#3d2817" roughness={0.8} />
      </mesh>
    </group>
  );
}

/**
 * Legacy `createCatchModel` → `itemType === 'treasure'` (sunket kiste).
 * Skala: kun forældre (`displayScaleForCatch` / `computeBucketScalar`) — ikke dobbelt med `visualScale`.
 */
export function TreasureChestModel() {
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[1.2, 0.8, 0.8]} />
        <meshStandardMaterial color={0x8b4513} roughness={0.7} flatShading />
      </mesh>
      <mesh castShadow position={[0, 0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.4, 0.4, 1.2, 16, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color={0xffd700} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh castShadow position={[0, 0.3, 0.4]}>
        <boxGeometry args={[0.2, 0.3, 0.1]} />
        <meshStandardMaterial color={0xffd700} metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

export function CrystalJunkModel({ bucketIdle }: { bucketIdle?: boolean }) {
  const groupRef = useRef<Group>(null);
  useFrame(({ clock }) => {
    const g = groupRef.current;
    if (!g) return;
    const t = clock.elapsedTime;
    const D = bucketIdle ? 0.35 : 1;
    g.rotation.y += (bucketIdle ? 0.006 : 0.012) * D;
    g.position.y = Math.sin(t * 2) * (bucketIdle ? 0.02 : 0.06) * D;
  });
  return (
    <group ref={groupRef} scale={0.38}>
      <pointLight color={0x00ffff} intensity={1.2} distance={4} position={[0, 0.3, 0]} />
      <mesh castShadow>
        <octahedronGeometry args={[0.8, 2]} />
        <meshPhysicalMaterial
          color={0x00ddff}
          emissive={0x004466}
          emissiveIntensity={0.4}
          metalness={0.85}
          roughness={0.15}
          transparent
          opacity={0.88}
          transmission={0.25}
        />
      </mesh>
      <mesh scale={0.55}>
        <octahedronGeometry args={[0.45, 1]} />
        <meshPhysicalMaterial
          color={0x00aaff}
          emissive={0x00aaff}
          emissiveIntensity={0.5}
          transparent
          opacity={0.55}
        />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          rotation={[0.5 + i, 0.3 * i, 0.2]}
          position={[0.35 * Math.sin(i * 2), 0.2 * i, 0.35 * Math.cos(i * 2)]}
        >
          <tetrahedronGeometry args={[0.22, 0]} />
          <meshPhysicalMaterial color={0x88ccff} emissive={0x226688} roughness={0.2} metalness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

export function CabinKeyModel({ bucketIdle }: { bucketIdle?: boolean }) {
  const groupRef = useRef<Group>(null);
  useFrame(() => {
    const g = groupRef.current;
    if (g) g.rotation.y += bucketIdle ? 0.005 : 0.01;
  });
  return (
    <group ref={groupRef} rotation={[0, 0, 0.15]} scale={0.32}>
      <pointLight color={0xffd700} intensity={0.9} distance={3} position={[0, 0.2, 0.5]} />
      <mesh castShadow>
        <boxGeometry args={[0.35, 0.08, 1.2]} />
        <meshStandardMaterial color={0xeedd88} metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh castShadow position={[-0.32, 0, 0.35]}>
        <cylinderGeometry args={[0.22, 0.22, 0.08, 16]} />
        <meshStandardMaterial color={0xeedd88} metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh castShadow position={[-0.32, 0, -0.45]}>
        <boxGeometry args={[0.2, 0.08, 0.35]} />
        <meshStandardMaterial color={0xeedd88} metalness={0.85} roughness={0.25} />
      </mesh>
    </group>
  );
}
