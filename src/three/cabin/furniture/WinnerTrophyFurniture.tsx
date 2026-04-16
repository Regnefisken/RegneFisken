import { forwardRef, useEffect, useMemo, type ComponentPropsWithoutRef } from 'react';
import { BufferAttribute, BufferGeometry } from 'three';
import type { Group } from 'three';

type GroupProps = ComponentPropsWithoutRef<'group'>;

function useWinnerTailGeometry() {
  const geo = useMemo(() => {
    const g = new BufferGeometry();
    const v = new Float32Array([
      0, 0, 0, 0.2, 0.15, 0, 0.2, -0.15, 0, 0, 0, 0, 0.2, -0.15, 0, 0.2, 0.15, 0,
    ]);
    g.setAttribute('position', new BufferAttribute(v, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  return geo;
}

/** Vindertrofæ — forstørret, spejlvendt, guldfarvet fiskemontage. */
export const WinnerTrophyFurniture = forwardRef<Group, GroupProps>(function WinnerTrophyFurniture(
  props,
  ref,
) {
  const tailGeo = useWinnerTailGeometry();

  const goldBody = 0xffd700;
  const goldFin = 0xdaa520;
  const goldPlaque = 0x8b7332;
  const goldTrim = 0xffc125;

  const S = 1.6;

  return (
    <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'winner_trophy' }}>
      <mesh position={[0, 0, 0.04 * S]} castShadow>
        <boxGeometry args={[0.95 * S, 0.55 * S, 0.06 * S]} />
        <meshStandardMaterial color={goldPlaque} roughness={0.7} metalness={0.3} flatShading />
      </mesh>

      <mesh position={[0, 0.275 * S + 0.015, 0.07 * S]} castShadow>
        <boxGeometry args={[1.0 * S, 0.03, 0.03]} />
        <meshStandardMaterial color={goldTrim} metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh position={[0, -0.275 * S - 0.015, 0.07 * S]} castShadow>
        <boxGeometry args={[1.0 * S, 0.03, 0.03]} />
        <meshStandardMaterial color={goldTrim} metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh position={[-0.475 * S - 0.015, 0, 0.07 * S]} castShadow>
        <boxGeometry args={[0.03, 0.55 * S + 0.06, 0.03]} />
        <meshStandardMaterial color={goldTrim} metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh position={[0.475 * S + 0.015, 0, 0.07 * S]} castShadow>
        <boxGeometry args={[0.03, 0.55 * S + 0.06, 0.03]} />
        <meshStandardMaterial color={goldTrim} metalness={0.7} roughness={0.25} />
      </mesh>

      <mesh
        position={[-0.1, 0.01, 0.14 * S]}
        castShadow
        scale={[1.8 * S, 0.9 * S, S]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.14, 0.14, 0.08, 16]} />
        <meshStandardMaterial
          color={goldBody}
          metalness={0.6}
          roughness={0.3}
          emissive={0xffa500}
          emissiveIntensity={0.08}
        />
      </mesh>

      <mesh position={[0.15, 0.01, 0.14 * S]} castShadow geometry={tailGeo} scale={S}>
        <meshStandardMaterial color={goldFin} metalness={0.5} roughness={0.35} flatShading />
      </mesh>

      <mesh
        position={[-0.1, 0.02, 0.19 * S]}
        castShadow
        rotation={[0.3, 0, 0.8]}
        scale={[S, S, 0.25 * S]}
      >
        <coneGeometry args={[0.06, 0.12, 3]} />
        <meshStandardMaterial color={goldFin} metalness={0.5} roughness={0.35} flatShading />
      </mesh>

      <mesh position={[-0.25, 0.03, 0.185 * S]}>
        <sphereGeometry args={[0.022, 8, 6]} />
        <meshBasicMaterial color={0x1a1a1a} />
      </mesh>

      <pointLight color={0xffd700} position={[0, 0, 0.2]} intensity={0.4} distance={3} decay={2} />
    </group>
  );
});
