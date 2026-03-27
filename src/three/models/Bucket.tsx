import type { ReactNode } from 'react';
import type { ThreeElements } from '@react-three/fiber';

export function Bucket({ children, ...props }: { children?: ReactNode } & ThreeElements['group']) {
  return (
    <group {...props}>
      <mesh castShadow position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.42, 0.32, 0.55, 16]} />
        <meshStandardMaterial color="#64748b" metalness={0.35} roughness={0.45} />
      </mesh>
      {children}
    </group>
  );
}
