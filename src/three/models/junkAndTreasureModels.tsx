import { useEffect, useMemo, useRef } from 'react';
import {
  DoubleSide,
  ExtrudeGeometry,
  Group,
  Mesh,
  Path,
  QuadraticBezierCurve3,
  Shape,
  TubeGeometry,
  Vector3,
} from 'three';
import { useFrame } from '@react-three/fiber';
import type { RollCatchResult } from '../../types/fish.js';

function hex(c: number) {
  return `#${(c >>> 0).toString(16).padStart(6, '0')}`;
}

/** Gammelt bildæk: let vinkling så hullet i dækket er lettere at se for kameraet. */
const JUNK_TIRE_EXTRA_TILT_RAD = (10 * Math.PI) / 180;

/**
 * Legacy `createCatchModel` havtang: QuadraticBezierCurve3 fra (0,-0.8,0) opad,
 * TubeGeometry(curve, 8, 0.15, 4), scale (1,1,0.2), rotation.y = i * PI/1.5.
 * Kurver er faste (ikke Math.random) så look er stabilt som et typisk legacy-udkast.
 */
function HavtangJunk({ bucketIdle }: { bucketIdle?: boolean }) {
  const groupRef = useRef<Group>(null);
  const leafRefs = useRef<(Mesh | null)[]>([]);
  const geos = useMemo(() => {
    const ctrlEnds: [Vector3, Vector3][] = [
      [new Vector3(0.35, 0, -0.42), new Vector3(0.52, 1.5, -0.38)],
      [new Vector3(-0.48, 0, 0.28), new Vector3(-0.41, 1.5, 0.45)],
      [new Vector3(0.22, 0, 0.55), new Vector3(-0.18, 1.5, 0.24)],
    ];
    return ctrlEnds.map(
      ([ctrl, end]) =>
        new TubeGeometry(
          new QuadraticBezierCurve3(new Vector3(0, -0.8, 0), ctrl, end),
          8,
          0.15,
          4,
          false,
        ),
    );
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
    <group ref={groupRef} scale={1}>
      {geos.map((geo, i) => (
        <mesh
          key={i}
          ref={(el) => {
            leafRefs.current[i] = el;
            if (el && el.userData.baseRotZ === undefined) el.userData.baseRotZ = el.rotation.z;
          }}
          geometry={geo}
          scale={[1, 1, 0.2]}
          rotation={[0, i * (Math.PI / 1.5), 0]}
          castShadow
        >
          <meshStandardMaterial color="#228b22" roughness={0.9} side={DoubleSide} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function FlossettRebJunk({ bodyColor, bucketIdle }: { bodyColor: string; bucketIdle?: boolean }) {
  const groupRef = useRef<Group>(null);
  const geos = useMemo(() => {
    const curves: [Vector3, Vector3, Vector3][] = [
      [new Vector3(-0.3, -0.4, 0), new Vector3(0.3, 0.0, 0.2), new Vector3(-0.2, 0.5, -0.1)],
      [new Vector3(-0.2, 0.5, -0.1), new Vector3(0.1, 0.7, 0.15), new Vector3(0.3, 0.6, -0.2)],
    ];
    return curves.map(
      ([start, ctrl, end]) =>
        new TubeGeometry(new QuadraticBezierCurve3(start, ctrl, end), 10, 0.06, 5, false),
    );
  }, []);
  const D = bucketIdle ? 0.35 : 1;
  useFrame(({ clock }) => {
    const g = groupRef.current;
    if (!g) return;
    const t = clock.elapsedTime;
    g.rotation.y += 0.008 * D;
    g.position.y = Math.sin(t * 1.2) * 0.08 * D;
  });
  return (
    <group ref={groupRef} scale={0.55}>
      {geos.map((geo, i) => (
        <mesh key={i} geometry={geo} castShadow>
          <meshStandardMaterial color={bodyColor} roughness={0.75} metalness={0.05} flatShading />
        </mesh>
      ))}
      <mesh castShadow position={[-0.3, -0.42, 0.02]} rotation={[0.3, 0, 0.4]}>
        <cylinderGeometry args={[0.015, 0.005, 0.2, 3]} />
        <meshStandardMaterial color={bodyColor} roughness={0.8} flatShading />
      </mesh>
      <mesh castShadow position={[-0.28, -0.44, -0.03]} rotation={[-0.2, 0, 0.6]}>
        <cylinderGeometry args={[0.012, 0.004, 0.15, 3]} />
        <meshStandardMaterial color={bodyColor} roughness={0.8} flatShading />
      </mesh>
      <mesh castShadow position={[0.32, 0.58, -0.18]} rotation={[0.4, 0, -0.3]}>
        <cylinderGeometry args={[0.015, 0.005, 0.18, 3]} />
        <meshStandardMaterial color={bodyColor} roughness={0.8} flatShading />
      </mesh>
      <mesh castShadow position={[0.05, 0.15, 0.08]}>
        <octahedronGeometry args={[0.04, 0]} />
        <meshStandardMaterial
          color="#d8c9b4"
          roughness={0.45}
          metalness={0.08}
          flatShading
          transparent
          opacity={0.75}
        />
      </mesh>
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
        <group rotation={[JUNK_TIRE_EXTRA_TILT_RAD, 0, 0]}>
          <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.95, 0.32, 12, 28]} />
            <meshStandardMaterial color={bodyColor} roughness={0.85} metalness={0.15} />
          </mesh>
        </group>
      </group>
    );
  }
  if (v === 'wheel') {
    // Legacy `createCatchModel` wheel: TorusGeometry(0.6, 0.08, 8, 24), rust rim + cylinder spokes
    return (
      <group ref={groupRef} scale={0.42}>
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.6, 0.08, 8, 24]} />
          <meshStandardMaterial color="#b55c2e" roughness={0.9} metalness={0.15} flatShading />
        </mesh>
        {Array.from({ length: 6 }, (_, i) => (
          <mesh
            key={i}
            castShadow
            rotation={[Math.PI / 2, 0, (i / 6) * Math.PI]}
          >
            <cylinderGeometry args={[0.02, 0.02, 1.1, 4]} />
            <meshStandardMaterial color="#9c4a22" roughness={0.85} metalness={0.12} flatShading />
          </mesh>
        ))}
      </group>
    );
  }
  if (v === 'glove') {
    // Legacy `visual === 'glove'`: flad palm (skaleret kugle) + 4 fingre m. spidser + tommelfinger
    return (
      <group ref={groupRef} scale={0.55}>
        <mesh castShadow scale={[1, 1.2, 0.4]}>
          <sphereGeometry args={[0.3, 8, 6]} />
          <meshStandardMaterial color={bodyColor} roughness={0.9} flatShading />
        </mesh>
        {[0, 1, 2, 3].map((i) => {
          const x = -0.15 + i * 0.1;
          return (
            <group key={i}>
              <mesh castShadow position={[x, 0.45, 0]}>
                <cylinderGeometry args={[0.06, 0.06, 0.35, 6]} />
                <meshStandardMaterial color={bodyColor} roughness={0.9} flatShading />
              </mesh>
              <mesh castShadow position={[x, 0.63, 0]}>
                <sphereGeometry args={[0.06, 6, 4]} />
                <meshStandardMaterial color={bodyColor} roughness={0.9} flatShading />
              </mesh>
            </group>
          );
        })}
        <mesh castShadow position={[-0.3, 0.1, 0.08]} rotation={[0, 0, Math.PI / 4]}>
          <cylinderGeometry args={[0.06, 0.06, 0.25, 6]} />
          <meshStandardMaterial color={bodyColor} roughness={0.9} flatShading />
        </mesh>
      </group>
    );
  }
  if (v === 'bottle') {
    // Legacy junk `visual === 'bottle'`: altid 0x88ccff glas + blå låg (ikke junkColor)
    return (
      <group ref={groupRef} scale={0.5}>
        <mesh castShadow position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.7, 10]} />
          <meshStandardMaterial
            color="#88ccff"
            roughness={0.1}
            transparent
            opacity={0.5}
            flatShading
          />
        </mesh>
        <mesh castShadow position={[0, 0.87, 0]}>
          <cylinderGeometry args={[0.08, 0.12, 0.35, 8]} />
          <meshStandardMaterial color="#88ccff" roughness={0.1} transparent opacity={0.5} flatShading />
        </mesh>
        <mesh castShadow position={[0, 1.08, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.08, 8]} />
          <meshStandardMaterial color="#2255ff" roughness={0.5} flatShading />
        </mesh>
      </group>
    );
  }
  if (v === 'teddy') {
    // Legacy `visual === 'teddy'`: kugler mave, hoved, ører, arme, ben + øjne + lille brun næse mod +Z
    const teddy = bodyColor;
    return (
      <group ref={groupRef} scale={0.55}>
        <mesh castShadow>
          <sphereGeometry args={[0.35, 8, 6]} />
          <meshStandardMaterial color={teddy} roughness={0.85} flatShading />
        </mesh>
        <mesh castShadow position={[0, 0.55, 0]}>
          <sphereGeometry args={[0.25, 8, 6]} />
          <meshStandardMaterial color={teddy} roughness={0.85} flatShading />
        </mesh>
        <mesh castShadow position={[-0.2, 0.75, 0]}>
          <sphereGeometry args={[0.1, 6, 4]} />
          <meshStandardMaterial color={teddy} roughness={0.85} flatShading />
        </mesh>
        <mesh castShadow position={[0.2, 0.75, 0]}>
          <sphereGeometry args={[0.1, 6, 4]} />
          <meshStandardMaterial color={teddy} roughness={0.85} flatShading />
        </mesh>
        <mesh castShadow position={[-0.4, 0.15, 0]}>
          <sphereGeometry args={[0.12, 6, 4]} />
          <meshStandardMaterial color={teddy} roughness={0.85} flatShading />
        </mesh>
        <mesh castShadow position={[0.4, 0.15, 0]}>
          <sphereGeometry args={[0.12, 6, 4]} />
          <meshStandardMaterial color={teddy} roughness={0.85} flatShading />
        </mesh>
        <mesh castShadow position={[-0.15, -0.35, 0.05]}>
          <sphereGeometry args={[0.13, 6, 4]} />
          <meshStandardMaterial color={teddy} roughness={0.85} flatShading />
        </mesh>
        <mesh castShadow position={[0.15, -0.35, 0.05]}>
          <sphereGeometry args={[0.13, 6, 4]} />
          <meshStandardMaterial color={teddy} roughness={0.85} flatShading />
        </mesh>
        <mesh castShadow position={[-0.08, 0.6, 0.22]}>
          <sphereGeometry args={[0.04, 6, 4]} />
          <meshBasicMaterial color="#111111" />
        </mesh>
        <mesh castShadow position={[0.08, 0.6, 0.22]}>
          <sphereGeometry args={[0.04, 6, 4]} />
          <meshBasicMaterial color="#111111" />
        </mesh>
        <mesh castShadow position={[0, 0.54, 0.27]}>
          <sphereGeometry args={[0.048, 8, 6]} />
          <meshStandardMaterial color={0x5c3d2e} roughness={0.8} flatShading />
        </mesh>
      </group>
    );
  }
  if (v === 'havtang') {
    return <HavtangJunk bucketIdle={bucketIdle} />;
  }
  if (v === 'undervandskamera') {
    return (
      <group ref={groupRef} scale={0.5}>
        <mesh castShadow>
          <boxGeometry args={[0.6, 0.45, 0.35]} />
          <meshStandardMaterial color={bodyColor} roughness={0.7} metalness={0.2} flatShading />
        </mesh>
        <mesh castShadow position={[0.05, -0.02, 0.25]}>
          <cylinderGeometry args={[0.14, 0.16, 0.2, 8]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.4} flatShading />
        </mesh>
        <mesh castShadow position={[0.05, -0.02, 0.36]}>
          <cylinderGeometry args={[0.12, 0.12, 0.03, 8]} />
          <meshStandardMaterial
            color="#4466aa"
            roughness={0.1}
            metalness={0.6}
            transparent
            opacity={0.5}
            flatShading
          />
        </mesh>
        <mesh castShadow position={[0.18, 0.3, 0.0]}>
          <boxGeometry args={[0.18, 0.1, 0.12]} />
          <meshStandardMaterial color="#333333" roughness={0.6} metalness={0.3} flatShading />
        </mesh>
        <mesh castShadow position={[-0.35, 0.15, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.06, 0.02, 4, 6]} />
          <meshStandardMaterial color="#555555" roughness={0.8} metalness={0.3} flatShading />
        </mesh>
        <mesh castShadow position={[-0.35, -0.08, 0]} rotation={[0.3, 0, 0.1]}>
          <cylinderGeometry args={[0.02, 0.02, 0.4, 4]} />
          <meshStandardMaterial color="#3a3a2a" roughness={0.9} flatShading />
        </mesh>
        <mesh castShadow position={[-0.1, 0.1, 0.18]} rotation={[0, 0, 0.7]}>
          <boxGeometry args={[0.25, 0.03, 0.02]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.9} flatShading />
        </mesh>
      </group>
    );
  }
  if (v === 'ispilk') {
    return (
      <group ref={groupRef} scale={0.5}>
        <mesh castShadow position={[0, -0.25, 0]}>
          <cylinderGeometry args={[0.08, 0.1, 0.35, 6]} />
          <meshStandardMaterial color={bodyColor} roughness={0.85} flatShading />
        </mesh>
        <mesh castShadow position={[0.12, -0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 0.08, 6]} />
          <meshStandardMaterial color="#666655" roughness={0.7} metalness={0.3} flatShading />
        </mesh>
        <mesh castShadow position={[0.18, -0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 0.02, 8]} />
          <meshStandardMaterial color="#888877" roughness={0.6} metalness={0.4} flatShading />
        </mesh>
        <mesh castShadow position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.03, 0.04, 0.5, 5]} />
          <meshStandardMaterial color="#6a5a40" roughness={0.8} flatShading />
        </mesh>
        <mesh castShadow position={[0.08, 0.5, 0.05]} rotation={[0.2, 0, 0.4]}>
          <cylinderGeometry args={[0.02, 0.03, 0.35, 5]} />
          <meshStandardMaterial color="#6a5a40" roughness={0.8} flatShading />
        </mesh>
        <mesh castShadow position={[0.18, 0.35, 0.1]} rotation={[0.5, 0, 0.2]}>
          <cylinderGeometry args={[0.008, 0.008, 0.4, 3]} />
          <meshStandardMaterial color="#cccccc" roughness={0.3} metalness={0.1} flatShading />
        </mesh>
      </group>
    );
  }
  if (v === 'solbrille') {
    return (
      <group ref={groupRef} scale={0.66} position={[0, 0.08, 0]} rotation={[0.52, 0.12, 0]}>
        <mesh castShadow position={[-0.2, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.18, 0.03, 4, 8]} />
          <meshStandardMaterial color={bodyColor} roughness={0.6} metalness={0.2} flatShading />
        </mesh>
        <mesh castShadow position={[0.2, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.18, 0.03, 4, 8]} />
          <meshStandardMaterial color={bodyColor} roughness={0.6} metalness={0.2} flatShading />
        </mesh>
        <mesh castShadow position={[-0.2, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.15, 6]} />
          <meshStandardMaterial
            color="#8899aa"
            roughness={0.1}
            metalness={0.3}
            transparent
            opacity={0.3}
            flatShading
            side={DoubleSide}
          />
        </mesh>
        <mesh castShadow position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.12, 4]} />
          <meshStandardMaterial color={bodyColor} roughness={0.6} metalness={0.2} flatShading />
        </mesh>
        <group position={[-0.41, 0, 0]}>
          <mesh castShadow position={[-0.035, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.019, 0.019, 0.07, 4]} />
            <meshStandardMaterial color={bodyColor} roughness={0.6} metalness={0.2} flatShading />
          </mesh>
          <group position={[-0.07, 0, 0]}>
            <mesh castShadow rotation={[0.06, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.022, 0.021, 0.028, 6]} />
              <meshStandardMaterial color="#3a3530" roughness={0.75} metalness={0.35} flatShading />
            </mesh>
            <group rotation={[-0.48, -0.14, 0.07]}>
              <mesh castShadow position={[0.02, -0.02, 0.14]} rotation={[Math.PI / 2 + 0.07, 0.11, 0.06]}>
                <cylinderGeometry args={[0.017, 0.019, 0.29, 4]} />
                <meshStandardMaterial color={bodyColor} roughness={0.72} metalness={0.22} flatShading />
              </mesh>
            </group>
          </group>
        </group>
        <group position={[0.41, 0, 0]}>
          <mesh castShadow position={[0.035, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.019, 0.019, 0.07, 4]} />
            <meshStandardMaterial color={bodyColor} roughness={0.6} metalness={0.2} flatShading />
          </mesh>
          <group position={[0.072, -0.01, 0.012]}>
            <mesh castShadow rotation={[0, -0.09, Math.PI / 2]}>
              <cylinderGeometry args={[0.021, 0.022, 0.026, 5]} />
              <meshStandardMaterial color="#3a3530" roughness={0.82} metalness={0.3} flatShading />
            </mesh>
            <group rotation={[-0.55, -0.1, -0.06]}>
              <mesh castShadow position={[-0.018, 0.025, -0.11]} rotation={[Math.PI / 2 - 0.12, -0.16, -0.09]}>
                <cylinderGeometry args={[0.02, 0.016, 0.19, 4]} />
                <meshStandardMaterial color={bodyColor} roughness={0.78} metalness={0.24} flatShading />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    );
  }
  if (v === 'rustent_sværd') {
    return (
      <group ref={groupRef} scale={0.45} rotation={[0.05, 0, Math.PI / 2 + 0.03]}>
        <mesh castShadow position={[0, 0.485, 0]}>
          <boxGeometry args={[0.12, 1.0, 0.04]} />
          <meshStandardMaterial color={bodyColor} roughness={0.85} metalness={0.35} flatShading />
        </mesh>
        <mesh castShadow position={[0, 0.978, -0.004]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.08, 0.08, 0.035]} />
          <meshStandardMaterial color={bodyColor} roughness={0.85} metalness={0.35} flatShading />
        </mesh>
        <mesh castShadow position={[0.02, 0.64, 0.022]}>
          <boxGeometry args={[0.06, 0.15, 0.01]} />
          <meshStandardMaterial color="#5a2a0a" roughness={0.95} flatShading />
        </mesh>
        <mesh castShadow position={[-0.03, 0.3, 0.022]}>
          <boxGeometry args={[0.05, 0.1, 0.01]} />
          <meshStandardMaterial color="#4a1a00" roughness={0.95} flatShading />
        </mesh>
        <mesh castShadow position={[0, 0.0, 0]}>
          <boxGeometry args={[0.45, 0.08, 0.07]} />
          <meshStandardMaterial color="#5c4033" roughness={0.75} metalness={0.25} flatShading />
        </mesh>
        <mesh castShadow position={[0, -0.168, 0]}>
          <cylinderGeometry args={[0.052, 0.048, 0.36, 6]} />
          <meshStandardMaterial color="#3d2817" roughness={0.9} flatShading />
        </mesh>
        <mesh castShadow position={[0, -0.378, 0]}>
          <sphereGeometry args={[0.068, 6, 4]} />
          <meshStandardMaterial color="#5c4033" roughness={0.75} metalness={0.25} flatShading />
        </mesh>
      </group>
    );
  }
  if (v === 'dykkermaske') {
    return (
      <group ref={groupRef} scale={0.5}>
        <mesh castShadow scale={[1.1, 0.8, 0.5]}>
          <sphereGeometry args={[0.35, 8, 6]} />
          <meshStandardMaterial color={bodyColor} roughness={0.85} flatShading />
        </mesh>
        <mesh castShadow position={[0, 0.02, 0.16]} scale={[0.85, 0.6, 0.15]}>
          <sphereGeometry args={[0.3, 8, 6]} />
          <meshStandardMaterial
            color="#5588aa"
            roughness={0.05}
            metalness={0.3}
            transparent
            opacity={0.35}
            flatShading
          />
        </mesh>
        <mesh castShadow position={[0, -0.08, 0.2]}>
          <sphereGeometry args={[0.06, 6, 4]} />
          <meshStandardMaterial color={bodyColor} roughness={0.85} flatShading />
        </mesh>
        <mesh castShadow position={[0.3, 0.2, -0.05]} rotation={[0, 0, -0.25]}>
          <cylinderGeometry args={[0.04, 0.05, 0.45, 6]} />
          <meshStandardMaterial color={bodyColor} roughness={0.85} flatShading />
        </mesh>
        <mesh castShadow position={[0.35, 0.45, -0.05]}>
          <cylinderGeometry args={[0.055, 0.04, 0.06, 6]} />
          <meshStandardMaterial color="#3a5a4a" roughness={0.8} flatShading />
        </mesh>
        <mesh castShadow position={[-0.38, 0.0, -0.08]} rotation={[0, 0.5, 0]}>
          <boxGeometry args={[0.15, 0.06, 0.03]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.9} flatShading />
        </mesh>
        <mesh castShadow position={[0.2, 0.0, -0.14]} rotation={[0, -0.3, 0]}>
          <boxGeometry args={[0.12, 0.06, 0.03]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.9} flatShading />
        </mesh>
      </group>
    );
  }
  if (v === 'piratflag') {
    return (
      <group ref={groupRef} scale={0.5}>
        <mesh castShadow position={[-0.2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.04, 1.2, 5]} />
          <meshStandardMaterial color="#5a4030" roughness={0.9} flatShading />
        </mesh>
        <mesh castShadow position={[-0.2, 0.65, 0]}>
          <sphereGeometry args={[0.045, 4, 3]} />
          <meshStandardMaterial color="#5a4030" roughness={0.85} flatShading />
        </mesh>
        <mesh castShadow position={[0.1, 0.3, 0]} rotation={[0, 0, -0.05]}>
          <boxGeometry args={[0.55, 0.38, 0.02]} />
          <meshStandardMaterial color={bodyColor} roughness={0.95} side={DoubleSide} flatShading />
        </mesh>
        <mesh castShadow position={[0.42, 0.2, 0]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.12, 0.15, 0.02]} />
          <meshStandardMaterial color={bodyColor} roughness={0.95} side={DoubleSide} flatShading />
        </mesh>
        <mesh castShadow position={[0.08, 0.34, 0.015]}>
          <sphereGeometry args={[0.07, 6, 4]} />
          <meshStandardMaterial color="#dddddd" roughness={0.8} flatShading />
        </mesh>
        <mesh castShadow position={[0.08, 0.22, 0.02]} rotation={[0, 0, 0.5]}>
          <cylinderGeometry args={[0.015, 0.015, 0.2, 4]} />
          <meshStandardMaterial color="#dddddd" roughness={0.8} flatShading />
        </mesh>
        <mesh castShadow position={[0.08, 0.22, 0.02]} rotation={[0, 0, -0.5]}>
          <cylinderGeometry args={[0.015, 0.015, 0.2, 4]} />
          <meshStandardMaterial color="#dddddd" roughness={0.8} flatShading />
        </mesh>
      </group>
    );
  }
  if (v === 'vandkort') {
    return (
      <group ref={groupRef} scale={0.55} rotation={[-0.38, 0, 0.1]}>
        <mesh castShadow>
          <boxGeometry args={[0.7, 0.5, 0.02]} />
          <meshStandardMaterial color={bodyColor} roughness={0.92} side={DoubleSide} flatShading />
        </mesh>
        <mesh castShadow position={[0, 0.26, -0.04]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.7, 6]} />
          <meshStandardMaterial color="#c4b490" roughness={0.88} flatShading />
        </mesh>
        <mesh castShadow position={[0, -0.26, -0.04]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.65, 6]} />
          <meshStandardMaterial color="#b4a480" roughness={0.88} flatShading />
        </mesh>
        <mesh castShadow position={[0.1, -0.05, 0.015]} rotation={[0, 0, 0.78]}>
          <boxGeometry args={[0.12, 0.02, 0.01]} />
          <meshStandardMaterial color="#aa2222" roughness={0.8} flatShading />
        </mesh>
        <mesh castShadow position={[0.1, -0.05, 0.015]} rotation={[0, 0, -0.78]}>
          <boxGeometry args={[0.12, 0.02, 0.01]} />
          <meshStandardMaterial color="#aa2222" roughness={0.8} flatShading />
        </mesh>
        <mesh castShadow position={[-0.12, 0.08, 0.015]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.3, 0.015, 0.008]} />
          <meshStandardMaterial color="#7a6a50" roughness={0.9} flatShading />
        </mesh>
      </group>
    );
  }
  if (v === 'flagermus_knogle') {
    return (
      <group ref={groupRef} scale={0.55}>
        <mesh castShadow position={[0, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.03, 0.5, 5]} />
          <meshStandardMaterial color={bodyColor} roughness={0.8} flatShading />
        </mesh>
        <mesh castShadow position={[0, 0.27, 0]}>
          <sphereGeometry args={[0.05, 6, 4]} />
          <meshStandardMaterial color={bodyColor} roughness={0.8} flatShading />
        </mesh>
        <mesh castShadow position={[0.25, 0.38, 0]} rotation={[0, 0, -0.9]}>
          <cylinderGeometry args={[0.02, 0.015, 0.45, 4]} />
          <meshStandardMaterial color={bodyColor} roughness={0.8} flatShading />
        </mesh>
        <mesh castShadow position={[0.3, 0.2, 0]} rotation={[0, 0, -1.2]}>
          <cylinderGeometry args={[0.02, 0.012, 0.4, 4]} />
          <meshStandardMaterial color={bodyColor} roughness={0.8} flatShading />
        </mesh>
        <mesh castShadow position={[0.22, 0.05, 0]} rotation={[0, 0, -1.5]}>
          <cylinderGeometry args={[0.018, 0.01, 0.3, 4]} />
          <meshStandardMaterial color={bodyColor} roughness={0.8} flatShading />
        </mesh>
        <mesh castShadow position={[0, -0.27, 0]}>
          <sphereGeometry args={[0.04, 6, 4]} />
          <meshStandardMaterial color={bodyColor} roughness={0.8} flatShading />
        </mesh>
        <mesh castShadow position={[0.35, 0.3, 0]} rotation={[0, 0, -1.05]} scale={[1, 1, 0.3]}>
          <boxGeometry args={[0.2, 0.15, 0.01]} />
          <meshStandardMaterial
            color="#d8d0c0"
            roughness={0.9}
            transparent
            opacity={0.5}
            side={DoubleSide}
            flatShading
          />
        </mesh>
      </group>
    );
  }
  if (v === 'frossent_tov') {
    return <FlossettRebJunk bodyColor={bodyColor} bucketIdle={bucketIdle} />;
  }
  if (v === 'gammel_fakkel') {
    return (
      <group ref={groupRef} scale={0.5}>
        {/* Træskaft — lidt konisk, slidt; top ved y ≈ 0.15 */}
        <mesh castShadow position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.044, 0.054, 0.7, 8]} />
          <meshStandardMaterial color={bodyColor} roughness={0.94} flatShading />
        </mesh>
        {/* Reb om skaftet */}
        <mesh castShadow position={[0, -0.38, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.05, 0.011, 5, 12]} />
          <meshStandardMaterial color="#3a2818" roughness={0.92} flatShading />
        </mesh>
        {/* Udvidet hals: forbinder skaft-top (r ≈ 0.044) med jern/skål — ingen luft mellem */}
        <mesh castShadow position={[0, 0.184, 0]}>
          <cylinderGeometry args={[0.056, 0.045, 0.068, 8]} />
          <meshStandardMaterial color={bodyColor} roughness={0.93} flatShading />
        </mesh>
        {/* Jernring — overlapper hals og skål */}
        <mesh castShadow position={[0, 0.222, 0]}>
          <cylinderGeometry args={[0.058, 0.058, 0.036, 8]} />
          <meshStandardMaterial color="#4a4038" roughness={0.85} metalness={0.28} flatShading />
        </mesh>
        {/* Metalskål — bund møder ring */}
        <mesh castShadow position={[0, 0.268, 0]}>
          <cylinderGeometry args={[0.052, 0.064, 0.1, 8]} />
          <meshStandardMaterial color="#5c5045" roughness={0.82} metalness={0.2} flatShading />
        </mesh>
        {/* Forkullet klud — ligger i / på skål-kant */}
        <mesh castShadow position={[0, 0.332, 0]} scale={[1, 0.55, 1]}>
          <sphereGeometry args={[0.058, 6, 5]} />
          <meshStandardMaterial color="#120a06" roughness={1} flatShading />
        </mesh>
        <mesh castShadow position={[0, 0.402, 0]} scale={[1, 1.25, 1]}>
          <sphereGeometry args={[0.042, 6, 4]} />
          <meshStandardMaterial
            color="#ff6a22"
            emissive="#ff5200"
            emissiveIntensity={0.42}
            roughness={0.88}
            flatShading
          />
        </mesh>
        <mesh castShadow position={[0.02, 0.438, 0.02]} scale={[0.85, 1.1, 0.85]}>
          <sphereGeometry args={[0.022, 5, 4]} />
          <meshStandardMaterial
            color="#ffcc66"
            emissive="#ffaa44"
            emissiveIntensity={0.55}
            roughness={0.75}
            flatShading
          />
        </mesh>
      </group>
    );
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
  /** Legacy `itemType === 'crystal_junk'`: oktaeder + indre kerne + 3 tetraeder-skår + cyan punktlys */
  return (
    <group ref={groupRef} scale={0.38}>
      <pointLight color={0x00ffff} intensity={1.5} distance={4} />
      <mesh castShadow scale={[1, 1.6, 1]}>
        <octahedronGeometry args={[0.8, 2]} />
        <meshStandardMaterial
          color={0x00ffff}
          emissive={0x0066aa}
          emissiveIntensity={0.6}
          roughness={0.05}
          metalness={0.9}
          flatShading
          transparent
          opacity={0.88}
        />
      </mesh>
      <mesh scale={[1, 1.6, 1]}>
        <octahedronGeometry args={[0.45, 1]} />
        <meshStandardMaterial
          color={0x88ffff}
          emissive={0x00aaff}
          emissiveIntensity={0.8}
          roughness={0}
          metalness={1}
          flatShading
          transparent
          opacity={0.55}
        />
      </mesh>
      <mesh castShadow position={[0.55, -0.25, 0.3]} rotation={[0.4, 0.2, 0.8]}>
        <tetrahedronGeometry args={[0.5, 1]} />
        <meshStandardMaterial
          color={0x00ffff}
          emissive={0x0066aa}
          emissiveIntensity={0.6}
          roughness={0.05}
          metalness={0.9}
          flatShading
          transparent
          opacity={0.88}
        />
      </mesh>
      <mesh castShadow position={[-0.45, 0.3, -0.4]} rotation={[-0.2, 0.7, -0.5]}>
        <tetrahedronGeometry args={[0.6, 1]} />
        <meshStandardMaterial
          color={0x00ffff}
          emissive={0x0066aa}
          emissiveIntensity={0.6}
          roughness={0.05}
          metalness={0.9}
          flatShading
          transparent
          opacity={0.88}
        />
      </mesh>
      <mesh castShadow position={[0.2, -0.5, -0.5]} rotation={[0.8, -0.3, 0.4]}>
        <tetrahedronGeometry args={[0.35, 1]} />
        <meshStandardMaterial
          color={0x00ffff}
          emissive={0x0066aa}
          emissiveIntensity={0.6}
          roughness={0.05}
          metalness={0.9}
          flatShading
          transparent
          opacity={0.88}
        />
      </mesh>
    </group>
  );
}

/** Legacy `createCatchModel` → `itemType === 'cabin_key'`: ExtrudeGeometry + hull + guld-PBR + punktlys (legacy-game.html ~3842–3865). */
function useLegacyCabinKeyExtrudeGeometry() {
  const geo = useMemo(() => {
    const keyShape = new Shape();
    keyShape.moveTo(0, 2);
    keyShape.lineTo(1.5, 1);
    keyShape.lineTo(1.5, -1);
    keyShape.lineTo(0.3, -1.5);
    keyShape.lineTo(0.3, -5);
    keyShape.lineTo(1.2, -5);
    keyShape.lineTo(1.2, -5.5);
    keyShape.lineTo(0.6, -5.5);
    keyShape.lineTo(0.6, -6);
    keyShape.lineTo(1.0, -6);
    keyShape.lineTo(1.0, -6.5);
    keyShape.lineTo(0.3, -6.5);
    keyShape.lineTo(0.3, -7);
    keyShape.lineTo(-0.3, -7);
    keyShape.lineTo(-0.3, -1.5);
    keyShape.lineTo(-1.5, -1);
    keyShape.lineTo(-1.5, 1);
    keyShape.lineTo(0, 2);
    const keyHole = new Path();
    keyHole.moveTo(0, 1.2);
    keyHole.lineTo(0.8, 0.5);
    keyHole.lineTo(0.8, -0.5);
    keyHole.lineTo(0, -1.2);
    keyHole.lineTo(-0.8, -0.5);
    keyHole.lineTo(-0.8, 0.5);
    keyHole.closePath();
    keyShape.holes.push(keyHole);
    const keyGeo = new ExtrudeGeometry(keyShape, {
      depth: 0.5,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.08,
      bevelThickness: 0.08,
    });
    keyGeo.center();
    return keyGeo;
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  return geo;
}

export function CabinKeyModel({ bucketIdle }: { bucketIdle?: boolean }) {
  const groupRef = useRef<Group>(null);
  const keyGeo = useLegacyCabinKeyExtrudeGeometry();
  useFrame(() => {
    const g = groupRef.current;
    if (g) g.rotation.y += bucketIdle ? 0.005 : 0.01;
  });
  return (
    <group ref={groupRef} rotation={[0, 0, 0.15]} scale={0.28}>
      <pointLight color={0xffd700} intensity={1.2} distance={5} position={[0, 0.5, 1]} />
      <mesh castShadow geometry={keyGeo}>
        <meshStandardMaterial
          color={0xffd700}
          metalness={0.85}
          roughness={0.18}
          flatShading
        />
      </mesh>
    </group>
  );
}
