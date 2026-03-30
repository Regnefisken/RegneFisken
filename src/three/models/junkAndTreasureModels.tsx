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
    // Legacy `visual === 'teddy'`: kugler mave, hoved, ører, arme, ben + øjne mod +Z
    const teddy = bodyColor;
    return (
      <group ref={groupRef} scale={0.5}>
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
