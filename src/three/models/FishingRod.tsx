import type { ReactNode } from 'react';
import type { ThreeElements } from '@react-three/fiber';

export function FishingRod({ children, ...props }: { children?: ReactNode } & ThreeElements['group']) {
  return (
    <group {...props}>
      <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.07, 4.2, 10]} />
        <meshStandardMaterial color="#6b4a2e" roughness={0.8} />
      </mesh>
      {children}
    </group>
  );
}
