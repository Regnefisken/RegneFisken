import { useMemo, type ReactNode } from 'react';
import type { ThreeElements } from '@react-three/fiber';

/** Gylden frø (fangst) — legacy `buildGoldenFrogFurniture` / cute frog. */
export function GoldenFrog({ children, ...props }: { children?: ReactNode } & ThreeElements['group']) {
  const bodyMat = useMemo(
    () => ({
      color: 0xffd700,
      roughness: 0.4,
      metalness: 0.15,
      emissive: 0xffaa00,
      emissiveIntensity: 0.45,
      flatShading: false as const,
    }),
    [],
  );
  return (
    <group scale={0.65} {...props}>
      <mesh position={[0, 0.3, 0]} scale={[1.3, 0.75, 1.1]} castShadow>
        <sphereGeometry args={[0.5, 12, 10]} />
        <meshStandardMaterial {...bodyMat} />
      </mesh>
      <mesh position={[0.28, 0.72, 0.3]} castShadow>
        <sphereGeometry args={[0.16, 8, 7]} />
        <meshBasicMaterial color={0xffffff} />
      </mesh>
      <mesh position={[0.28, 0.72, -0.3]} castShadow>
        <sphereGeometry args={[0.16, 8, 7]} />
        <meshBasicMaterial color={0xffffff} />
      </mesh>
      <mesh position={[0.38, 0.74, 0.3]} castShadow>
        <sphereGeometry args={[0.08, 6, 5]} />
        <meshBasicMaterial color={0x111111} />
      </mesh>
      <mesh position={[0.38, 0.74, -0.3]} castShadow>
        <sphereGeometry args={[0.08, 6, 5]} />
        <meshBasicMaterial color={0x111111} />
      </mesh>
      {[
        [-0.3, 0.0, 0.35],
        [-0.3, 0.0, -0.35],
        [0.1, -0.1, 0.38],
        [0.1, -0.1, -0.38],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[0, 0, 0.5]} castShadow>
          <cylinderGeometry args={[0.07, 0.05, 0.38, 6]} />
          <meshStandardMaterial {...bodyMat} />
        </mesh>
      ))}
      <pointLight color={0xffaa00} intensity={0.4} distance={2} position={[0, 0.5, 0]} />
      {children}
    </group>
  );
}
