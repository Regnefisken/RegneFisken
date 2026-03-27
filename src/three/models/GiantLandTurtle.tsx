import { useMemo, useRef } from 'react';
import { Group, QuadraticBezierCurve3, TubeGeometry, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';

const skin = { color: 0x8b7355, roughness: 0.65 };
const shell = { color: 0x5c4033, roughness: 0.55, metalness: 0.06, flatShading: true as const };
const mouth = { color: 0x2a1b18, roughness: 0.8 };
const tongue = { color: 0xcd5c5c, roughness: 0.5 };

/** Kæmpe landskildpadde — porteret fra legacy `buildGiantLandTurtle` (medium detalje). */
export function GiantLandTurtle() {
  const groupRef = useRef<Group>(null);

  const neckGeo = useMemo(() => {
    const curve = new QuadraticBezierCurve3(
      new Vector3(0.8, 0.25, 0),
      new Vector3(1.45, 0.25, 0),
      new Vector3(1.72, 0.88, 0),
    );
    return new TubeGeometry(curve, 12, 0.19, 8, false);
  }, []);

  useFrame(({ clock }) => {
    const g = groupRef.current;
    if (!g) return;
    const t = clock.elapsedTime;
    g.rotation.y = Math.sin(t * 0.35) * 0.06;
  });

  return (
    <group ref={groupRef} castShadow>
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <icosahedronGeometry args={[1, 2]} />
        <meshStandardMaterial {...shell} />
      </mesh>
      <mesh position={[0, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.98, 0.12, 8, 24]} />
        <meshStandardMaterial {...shell} />
      </mesh>
      <mesh geometry={neckGeo} castShadow>
        <meshStandardMaterial {...skin} />
      </mesh>
      <mesh position={[1.72, 0.92, 0]} castShadow name="turtleHead">
        <sphereGeometry args={[0.29, 12, 12]} />
        <meshStandardMaterial {...skin} />
      </mesh>
      <mesh position={[1.72 + 0.255, 0.92 - 0.092, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.038, 0.019, 0.135]} />
        <meshStandardMaterial {...mouth} />
      </mesh>
      <mesh position={[1.72 + 0.295, 0.92 - 0.095, 0]} rotation={[0, 0, -0.18]} scale={[1.68, 0.49, 0.87]}>
        <sphereGeometry args={[0.033, 9, 9]} />
        <meshStandardMaterial {...tongue} />
      </mesh>
      {[
        [0.62, -0.18, 0.62],
        [0.62, -0.18, -0.62],
        [-0.72, -0.17, 0.52],
        [-0.72, -0.17, -0.52],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} castShadow>
          <cylinderGeometry args={[0.23, 0.29, 0.72, 10]} />
          <meshStandardMaterial {...skin} />
        </mesh>
      ))}
      <mesh position={[-1.32, 0.09, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <coneGeometry args={[0.09, 0.62, 7]} />
        <meshStandardMaterial {...skin} />
      </mesh>
      <mesh position={[1.88, 1.02, 0.22]} castShadow>
        <sphereGeometry args={[0.08 * 0.82, 10, 10]} />
        <meshStandardMaterial color={0xffffff} roughness={0.4} />
      </mesh>
      <mesh position={[1.88 + 0.04 * 0.82, 1.02, 0.22 + 0.04 * 0.82]}>
        <sphereGeometry args={[0.04 * 0.82, 8, 8]} />
        <meshStandardMaterial color={0x111111} />
      </mesh>
      <mesh position={[1.88, 1.02, -0.22]} castShadow>
        <sphereGeometry args={[0.08 * 0.82, 10, 10]} />
        <meshStandardMaterial color={0xffffff} roughness={0.4} />
      </mesh>
      <mesh position={[1.88 + 0.04 * 0.82, 1.02, -0.22 - 0.04 * 0.82]}>
        <sphereGeometry args={[0.04 * 0.82, 8, 8]} />
        <meshStandardMaterial color={0x111111} />
      </mesh>
    </group>
  );
}
