import type { ReactNode } from 'react';
import type { ThreeElements } from '@react-three/fiber';

export function Bridge({ children, ...props }: { children?: ReactNode } & ThreeElements['group']) {
  return (
    <group {...props}>
      <mesh receiveShadow>
        <boxGeometry args={[3.5, 0.12, 10]} />
        <meshStandardMaterial color="#5d4037" roughness={0.95} flatShading />
      </mesh>
      {children}
    </group>
  );
}
