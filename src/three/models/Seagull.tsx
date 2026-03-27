import { useMemo, useRef, type ReactNode } from 'react';
import { Group } from 'three';
import type { ThreeElements } from '@react-three/fiber';
import { useFrame } from '@react-three/fiber';

export type SeagullPalette = { body: number; wing: number };

const DEFAULT_PALETTE: SeagullPalette = { body: 0xf5f5f0, wing: 0xe8e8e0 };

/** Måge — legacy `buildSeagull` med let vinge-flap. */
export function Seagull({
  palette = DEFAULT_PALETTE,
  children,
  ...props
}: {
  palette?: SeagullPalette;
  children?: ReactNode;
} & ThreeElements['group']) {
  const wingL = useRef<Group>(null);
  const wingR = useRef<Group>(null);

  const bodyMat = useMemo(
    () => ({ color: palette.body, roughness: 0.5, flatShading: false as const }),
    [palette.body],
  );
  const wingMat = useMemo(
    () => ({ color: palette.wing, roughness: 0.55, flatShading: false as const }),
    [palette.wing],
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const flap = Math.sin(t * 14) * 0.35;
    if (wingL.current) wingL.current.rotation.z = flap;
    if (wingR.current) wingR.current.rotation.z = -flap;
  });

  return (
    <group scale={0.7} {...props}>
      <mesh castShadow>
        <sphereGeometry args={[0.25, 10, 6]} />
        <meshStandardMaterial {...bodyMat} />
      </mesh>
      <group ref={wingL} position={[-0.6, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.2, 0.06, 0.35]} />
          <meshStandardMaterial {...wingMat} />
        </mesh>
      </group>
      <group ref={wingR} position={[0.6, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.2, 0.06, 0.35]} />
          <meshStandardMaterial {...wingMat} />
        </mesh>
      </group>
      <mesh position={[0, 0.2, 0.3]} castShadow>
        <sphereGeometry args={[0.14, 8, 6]} />
        <meshStandardMaterial {...bodyMat} />
      </mesh>
      <mesh position={[0, 0.18, 0.52]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.04, 0.18, 6]} />
        <meshStandardMaterial color={0xffcc40} roughness={0.4} flatShading={false} />
      </mesh>
      {children}
    </group>
  );
}
