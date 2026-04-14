import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import type { Group } from 'three';

type GroupProps = ComponentPropsWithoutRef<'group'>;

/**
 * Piratens Skattekiste — genbruger samme geometri som TreasureChestModel
 * men integreret som flytbart møbel i fiskehytten.
 * Brun kiste (0x8b4513) + guld-cylinderlåg (0xffd700) + guldlås.
 */
export const PirateChestFurniture = forwardRef<Group, GroupProps>(function PirateChestFurniture(
  props,
  ref,
) {
  return (
    <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'pirate_chest' }}>
      <mesh castShadow position={[0, 0.4, 0]}>
        <boxGeometry args={[1.2, 0.8, 0.8]} />
        <meshStandardMaterial color={0x8b4513} roughness={0.7} flatShading />
      </mesh>
      <mesh castShadow position={[0, 0.8, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.4, 0.4, 1.2, 16, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color={0xffd700} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh castShadow position={[0, 0.7, 0.4]}>
        <boxGeometry args={[0.2, 0.3, 0.1]} />
        <meshStandardMaterial color={0xffd700} metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
});
