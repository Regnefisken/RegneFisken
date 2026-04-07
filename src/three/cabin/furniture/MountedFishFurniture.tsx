import { forwardRef, useEffect, useMemo, type ComponentPropsWithoutRef } from 'react';
import { BufferAttribute, BufferGeometry } from 'three';
import type { Group } from 'three';

type GroupProps = ComponentPropsWithoutRef<'group'>;

function useMountedTailGeometry() {
  const geo = useMemo(() => {
    const g = new BufferGeometry();
    const v = new Float32Array([
      0, 0, 0,
      -0.20, 0.15, 0,
      -0.20, -0.15, 0,
      0, 0, 0,
      -0.20, -0.15, 0,
      -0.20, 0.15, 0,
    ]);
    g.setAttribute('position', new BufferAttribute(v, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  return geo;
}

/** Vægfisk trofæ — samme omrids som akvariefisken, neutrale farver, ingen øjne/rygfinne. */
export const MountedFishFurniture = forwardRef<Group, GroupProps>(function MountedFishFurniture(
  props,
  ref,
) {
  const tailGeo = useMountedTailGeometry();
  const body = 0xb09070;
  const fin = 0x8a6848;
  const plaque = 0x4a3520;
  return (
    <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'mounted_fish' }}>
      <mesh position={[0, 0, 0.04]} castShadow>
        <boxGeometry args={[0.95, 0.55, 0.06]} />
        <meshStandardMaterial color={plaque} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0.10, 0.01, 0.14]} castShadow scale={[1.8, 0.9, 1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.08, 16]} />
        <meshStandardMaterial color={body} roughness={0.7} />
      </mesh>
      <mesh position={[-0.15, 0.01, 0.14]} castShadow geometry={tailGeo}>
        <meshStandardMaterial color={fin} roughness={0.75} flatShading />
      </mesh>
      <mesh position={[0.10, 0.02, 0.19]} castShadow rotation={[0.3, 0, -0.8]} scale={[1, 1, 0.25]}>
        <coneGeometry args={[0.06, 0.12, 3]} />
        <meshStandardMaterial color={fin} roughness={0.75} flatShading />
      </mesh>
      <mesh position={[0.25, 0.03, 0.185]}>
        <sphereGeometry args={[0.018, 8, 6]} />
        <meshBasicMaterial color={0x1a1a1a} />
      </mesh>
    </group>
  );
});
