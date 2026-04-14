import { forwardRef, useRef, type ComponentPropsWithoutRef } from 'react';
import { DoubleSide, type Group, type Mesh } from 'three';
import { useFrame } from '@react-three/fiber';
import { useUIStore } from '../../../store/useUIStore.js';

type GroupProps = ComponentPropsWithoutRef<'group'>;

/**
 * Mystisk Isterning — teaser til fremtidigt indhold (håndtag kan ikke løsnes endnu).
 */
export const IceCubeFurniture = forwardRef<Group, GroupProps>(function IceCubeFurniture(
  props,
  ref,
) {
  const innerRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    const m = innerRef.current;
    if (!m) return;
    m.rotation.y = clock.elapsedTime * 0.15;
  });

  function handleClick(e: { stopPropagation: () => void }) {
    e.stopPropagation();
    useUIStore.getState().setToastMessage(
      '❄️ Der sidder noget fast i isen… Isen er isnende kold og smelter ikke. Endnu.',
    );
  }

  return (
    <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'ice_cube' }}>
      <mesh castShadow position={[0, 0.45, 0]} onClick={handleClick}>
        <boxGeometry args={[0.7, 0.7, 0.7]} />
        <meshPhysicalMaterial
          color={0xb0d4e8}
          transparent
          opacity={0.35}
          roughness={0.05}
          metalness={0.1}
          transmission={0.6}
          thickness={0.5}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <group ref={innerRef} position={[0, 0.42, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.28, 8]} />
          <meshStandardMaterial color={0xd4b896} metalness={0.6} roughness={0.35} flatShading />
        </mesh>
        <mesh castShadow position={[0, 0.16, 0]}>
          <sphereGeometry args={[0.06, 8, 6]} />
          <meshStandardMaterial color={0xd4b896} metalness={0.6} roughness={0.35} flatShading />
        </mesh>
        <mesh castShadow position={[0, -0.14, 0]}>
          <cylinderGeometry args={[0.08, 0.1, 0.04, 8]} />
          <meshStandardMaterial color={0xd4b896} metalness={0.6} roughness={0.35} flatShading />
        </mesh>
      </group>

      {[
        [0.12, 0.55, 0.1],
        [-0.1, 0.35, -0.12],
        [0.08, 0.5, -0.15],
        [-0.15, 0.4, 0.08],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <sphereGeometry args={[0.025, 6, 4]} />
          <meshStandardMaterial
            color={0xffffff}
            transparent
            opacity={0.5}
            roughness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
});
