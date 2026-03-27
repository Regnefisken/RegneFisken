import { useMemo, useRef, type ReactNode } from 'react';
import { Group, QuadraticBezierCurve3, TubeGeometry, Vector3, type Mesh } from 'three';
import type { ThreeElements } from '@react-three/fiber';
import { useFrame } from '@react-three/fiber';

const eyeMatW = { color: 0xffffff, roughness: 0.5, flatShading: false as const };
const eyeMatP = { color: 0x111111, roughness: 0.3, flatShading: false as const };

/** Kraken — legacy ambient + boss `kraken` (tentakler `useFrame`). */
export function Kraken({
  catchMode = false,
  children,
  ...props
}: {
  catchMode?: boolean;
  children?: ReactNode;
} & ThreeElements['group']) {
  const krakenRef = useRef<Group>(null);
  const tentaclesRef = useRef<(Mesh | null)[]>([]);

  const kMat = useMemo(
    () => ({ color: 0x4a0404, roughness: 0.7, flatShading: true as const }),
    [],
  );

  const tentacleGeos = useMemo(() => {
    const geos: TubeGeometry[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const curve = new QuadraticBezierCurve3(
        new Vector3(Math.cos(angle) * 1.0, -0.5, Math.sin(angle) * 1.0),
        new Vector3(Math.cos(angle) * 3.0, 1.5, Math.sin(angle) * 3.0),
        new Vector3(Math.cos(angle) * 1.5, 3.5, Math.sin(angle) * 1.5),
      );
      geos.push(new TubeGeometry(curve, 10, 0.25, 6, false));
    }
    return geos;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const k = krakenRef.current;
    if (!k) return;
    k.rotation.y -= 0.005;
    tentaclesRef.current.forEach((mesh, idx) => {
      if (mesh) mesh.rotation.z = Math.sin(t * 1.5 + idx) * 0.15;
    });
    if (catchMode) {
      k.position.y = -1.0 + Math.sin(t * 2) * 0.2;
    } else {
      k.position.y = 0;
    }
  });

  const outerScale = catchMode ? 0.65 : 1.8;

  return (
    <group scale={outerScale} {...props}>
      <group ref={krakenRef}>
        {[
          [1.0, 1.2, 0.5],
          [1.0, 1.2, -0.5],
        ].map(([x, y, z], i) => (
          <group key={i} position={[x, y, z]}>
            <mesh>
              <sphereGeometry args={[0.08, 12, 12]} />
              <meshStandardMaterial {...eyeMatW} />
            </mesh>
            <mesh position={[0.04, 0, z > 0 ? 0.04 : -0.04]}>
              <sphereGeometry args={[0.04, 12, 12]} />
              <meshStandardMaterial {...eyeMatP} />
            </mesh>
          </group>
        ))}
        {tentacleGeos.map((g, i) => (
          <mesh
            key={i}
            ref={(el) => {
              tentaclesRef.current[i] = el;
            }}
            geometry={g}
            castShadow
          >
            <meshStandardMaterial {...kMat} />
          </mesh>
        ))}
        <mesh position={[0, 1.5, 0]} scale={[1, 1.4, 1]} castShadow>
          <sphereGeometry args={[1.2, 16, 16]} />
          <meshStandardMaterial {...kMat} />
        </mesh>
        {children}
      </group>
    </group>
  );
}
