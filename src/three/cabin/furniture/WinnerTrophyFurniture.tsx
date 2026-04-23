import { forwardRef, useEffect, useMemo, type ComponentPropsWithoutRef } from 'react';
import { BufferAttribute, BufferGeometry } from 'three';
import type { Group } from 'three';
import type { PodiumTrophyFurnitureId } from '../../../data/competitionPrizeCodes.js';

type GroupProps = ComponentPropsWithoutRef<'group'>;

export type WinnerTrophyFurnitureProps = Omit<GroupProps, 'userData'> & {
  movableId: PodiumTrophyFurnitureId;
};

const PALETTES: Record<
  PodiumTrophyFurnitureId,
  {
    body: number;
    fin: number;
    plaque: number;
    trim: number;
    emissive: number;
    emissiveIntensity: number;
    light: number;
  }
> = {
  winner_trophy_gold: {
    body: 0xffd700,
    fin: 0xdaa520,
    plaque: 0x8b7332,
    trim: 0xffc125,
    emissive: 0xffa500,
    emissiveIntensity: 0.08,
    light: 0xffd700,
  },
  winner_trophy_silver: {
    body: 0xd4d4dc,
    fin: 0xaeb0bc,
    plaque: 0x5c5c68,
    trim: 0xeeeef4,
    emissive: 0xaabbcc,
    emissiveIntensity: 0.04,
    light: 0xdde5ff,
  },
  winner_trophy_bronze: {
    body: 0xcd7f32,
    fin: 0xa8702d,
    plaque: 0x4a3020,
    trim: 0xdaa06d,
    emissive: 0x6b3a0f,
    emissiveIntensity: 0.06,
    light: 0xdaa06d,
  },
};

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

/** Vindertrofæ — podie (guld / sølv / bronze), samme form, forskellig materiale. */
export const WinnerTrophyFurniture = forwardRef<Group, WinnerTrophyFurnitureProps>(
  function WinnerTrophyFurniture({ movableId, ...rest }, ref) {
    const tailGeo = useWinnerTailGeometry();
    const col = PALETTES[movableId];
    const S = 1.6;

    return (
      <group
        ref={ref}
        {...rest}
        userData={{ isMovable: true, movableType: movableId }}
      >
        <mesh position={[0, 0, 0.04 * S]} castShadow>
          <boxGeometry args={[0.95 * S, 0.55 * S, 0.06 * S]} />
          <meshStandardMaterial color={col.plaque} roughness={0.7} metalness={0.3} flatShading />
        </mesh>

        <mesh position={[0, 0.275 * S + 0.015, 0.07 * S]} castShadow>
          <boxGeometry args={[1.0 * S, 0.03, 0.03]} />
          <meshStandardMaterial color={col.trim} metalness={0.7} roughness={0.25} />
        </mesh>
        <mesh position={[0, -0.275 * S - 0.015, 0.07 * S]} castShadow>
          <boxGeometry args={[1.0 * S, 0.03, 0.03]} />
          <meshStandardMaterial color={col.trim} metalness={0.7} roughness={0.25} />
        </mesh>
        <mesh position={[-0.475 * S - 0.015, 0, 0.07 * S]} castShadow>
          <boxGeometry args={[0.03, 0.55 * S + 0.06, 0.03]} />
          <meshStandardMaterial color={col.trim} metalness={0.7} roughness={0.25} />
        </mesh>
        <mesh position={[0.475 * S + 0.015, 0, 0.07 * S]} castShadow>
          <boxGeometry args={[0.03, 0.55 * S + 0.06, 0.03]} />
          <meshStandardMaterial color={col.trim} metalness={0.7} roughness={0.25} />
        </mesh>

        <mesh
          position={[-0.1, 0.01, 0.14 * S]}
          castShadow
          scale={[1.8 * S, 0.9 * S, S]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.14, 0.14, 0.08, 16]} />
          <meshStandardMaterial
            color={col.body}
            metalness={movableId === 'winner_trophy_silver' ? 0.75 : 0.6}
            roughness={movableId === 'winner_trophy_silver' ? 0.22 : 0.3}
            emissive={col.emissive}
            emissiveIntensity={col.emissiveIntensity}
          />
        </mesh>

        <mesh position={[0.15, 0.01, 0.14 * S]} castShadow geometry={tailGeo} scale={S}>
          <meshStandardMaterial color={col.fin} metalness={0.5} roughness={0.35} flatShading />
        </mesh>

        <mesh
          position={[-0.1, 0.02, 0.19 * S]}
          castShadow
          rotation={[0.3, 0, 0.8]}
          scale={[S, S, 0.25 * S]}
        >
          <coneGeometry args={[0.06, 0.12, 3]} />
          <meshStandardMaterial color={col.fin} metalness={0.5} roughness={0.35} flatShading />
        </mesh>

        <mesh position={[-0.25, 0.03, 0.185 * S]}>
          <sphereGeometry args={[0.022, 8, 6]} />
          <meshBasicMaterial color={0x1a1a1a} />
        </mesh>

        <pointLight
          color={col.light}
          position={[0, 0, 0.2]}
          intensity={movableId === 'winner_trophy_silver' ? 0.25 : 0.4}
          distance={3}
          decay={2}
        />
      </group>
    );
  },
);
