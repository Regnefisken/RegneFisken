import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import type { Group } from 'three';

type GroupProps = ComponentPropsWithoutRef<'group'>;

/** Vægfisk trofæ — default monteres på venstre væg (rotation sættes af parent). */
export const MountedFishFurniture = forwardRef<Group, GroupProps>(function MountedFishFurniture(
  props,
  ref,
) {
  return (
    <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'mounted_fish' }}>
      <mesh position={[0, 0, 0.05]} castShadow>
        <boxGeometry args={[0.95, 0.55, 0.08]} />
        <meshStandardMaterial color={0x4a3520} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0.05, 0.06, 0.12]} rotation={[0.25, 0, -0.15]} castShadow>
        <boxGeometry args={[0.62, 0.2, 0.14]} />
        <meshStandardMaterial color={0xc49a6c} roughness={0.75} flatShading />
      </mesh>
      <mesh position={[-0.28, 0.1, 0.12]} castShadow>
        <coneGeometry args={[0.08, 0.22, 4]} />
        <meshStandardMaterial color={0xa0522d} flatShading />
      </mesh>
    </group>
  );
});
