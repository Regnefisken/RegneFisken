import { forwardRef, useMemo, type ComponentPropsWithoutRef } from 'react';
import { CanvasTexture, RepeatWrapping } from 'three';
import type { Group } from 'three';
import { MeshStandardMaterial } from 'three';
import { useGameStore } from '../../../store/useGameStore.js';

type GroupProps = ComponentPropsWithoutRef<'group'>;

const ROOM_FURNITURE_SCALE = 2 as const;

function useKitchenRugMaterial() {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 200;
    c.height = 280;
    const ctx = c.getContext('2d');
    if (!ctx) return new MeshStandardMaterial({ color: 0xb8784e, roughness: 1 });
    ctx.fillStyle = '#B8784E';
    ctx.fillRect(0, 0, 200, 280);
    ctx.strokeStyle = '#6B4226';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, 188, 268);
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 16, 168, 248);
    const tex = new CanvasTexture(c);
    tex.wrapS = RepeatWrapping;
    tex.wrapT = RepeatWrapping;
    return new MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0 });
  }, []);
}

export const KitchenTableFurniture = forwardRef<Group, GroupProps>(function KitchenTableFurniture(
  props,
  ref,
) {
  const wood = 0x3d2814;
  const top = 0x5c3a22;
  return (
    <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'kitchen_table' }}>
      <group scale={ROOM_FURNITURE_SCALE}>
      <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.0, 0.06, 0.62]} />
        <meshStandardMaterial color={top} roughness={0.75} flatShading />
      </mesh>
      <mesh position={[0, 0.78, 0]} castShadow>
        <boxGeometry args={[3.95, 0.08, 0.58]} />
        <meshStandardMaterial color={wood} roughness={0.88} flatShading />
      </mesh>
      {[
        [-1.85, 0.39, -0.25],
        [1.85, 0.39, -0.25],
        [-1.85, 0.39, 0.25],
        [1.85, 0.39, 0.25],
      ].map((p, i) => (
        <mesh key={i} position={[p[0], p[1], p[2]]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.78, 8]} />
          <meshStandardMaterial color={wood} roughness={0.88} flatShading />
        </mesh>
      ))}
      </group>
    </group>
  );
});

export const KitchenStoveFurniture = forwardRef<Group, GroupProps>(function KitchenStoveFurniture(
  props,
  ref,
) {
  const steel = 0x4a4a4a;
  return (
    <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'kitchen_stove' }}>
      <group scale={ROOM_FURNITURE_SCALE}>
      <mesh position={[0, 0.03, 0]} castShadow>
        <boxGeometry args={[0.75, 0.06, 0.6]} />
        <meshStandardMaterial color={0x2a2a2a} roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[0.75, 0.84, 0.6]} />
        <meshStandardMaterial color={steel} roughness={0.4} metalness={0.5} flatShading />
      </mesh>
      <mesh position={[0, 0.86, 0]} castShadow>
        <boxGeometry args={[0.78, 0.04, 0.63]} />
        <meshStandardMaterial color={0x3a3a3a} roughness={0.5} flatShading />
      </mesh>
      {[
        [-0.17, 0.88, -0.14],
        [0.17, 0.88, -0.14],
        [-0.17, 0.88, 0.14],
        [0.17, 0.88, 0.14],
      ].map((p, i) => (
        <mesh key={i} position={[p[0], p[1], p[2]]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.015, 16]} />
          <meshStandardMaterial color={0x2a2a2a} roughness={0.6} flatShading />
        </mesh>
      ))}
      <mesh position={[0, 0.32, 0.305]} castShadow>
        <boxGeometry args={[0.55, 0.45, 0.02]} />
        <meshStandardMaterial color={0x2a2a2a} roughness={0.5} flatShading />
      </mesh>
      <mesh position={[0, 0.32, 0.315]}>
        <boxGeometry args={[0.35, 0.22, 0.01]} />
        <meshStandardMaterial color={0x1a1a1a} transparent opacity={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.58, 0.32]} castShadow>
        <boxGeometry args={[0.3, 0.03, 0.03]} />
        <meshStandardMaterial color={0xb8860b} roughness={0.3} metalness={0.6} flatShading />
      </mesh>
      </group>
    </group>
  );
});

export const KitchenSinkFurniture = forwardRef<Group, GroupProps>(function KitchenSinkFurniture(
  props,
  ref,
) {
  return (
    <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'kitchen_sink' }}>
      <group scale={ROOM_FURNITURE_SCALE}>
      <mesh position={[0, 0.03, 0]} castShadow>
        <boxGeometry args={[0.9, 0.06, 0.5]} />
        <meshStandardMaterial color={0x3e2a1a} roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 0.39, 0]} castShadow>
        <boxGeometry args={[0.9, 0.78, 0.6]} />
        <meshStandardMaterial color={0x5c4033} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[0.93, 0.04, 0.63]} />
        <meshStandardMaterial color={0x6b6b6b} roughness={0.5} flatShading />
      </mesh>
      <mesh position={[0, 0.785, 0]} castShadow>
        <boxGeometry args={[0.5, 0.04, 0.35]} />
        <meshStandardMaterial color={0xd0d0d0} roughness={0.4} flatShading />
      </mesh>
      <mesh position={[0, 0.97, -0.2]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
        <meshStandardMaterial color={0xb8860b} roughness={0.3} metalness={0.6} flatShading />
      </mesh>
      <mesh position={[0, 1.1, -0.12]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.15, 8]} />
        <meshStandardMaterial color={0xb8860b} roughness={0.3} metalness={0.6} flatShading />
      </mesh>
      <mesh position={[0, 0.38, 0.305]} castShadow>
        <boxGeometry args={[0.55, 0.5, 0.02]} />
        <meshStandardMaterial color={0x6b4226} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0, 0.48, 0.32]} castShadow>
        <boxGeometry args={[0.15, 0.03, 0.03]} />
        <meshStandardMaterial color={0xb8860b} roughness={0.3} metalness={0.6} flatShading />
      </mesh>
      </group>
    </group>
  );
});

/** Gulvplante — stor vase med frodig grøn plante (erstatter tidligere køkkenstol). */
export const GulvplanteFurniture = forwardRef<Group, GroupProps>(function GulvplanteFurniture(
  props,
  ref,
) {
  const vaseBody = 0x3d5c52;
  const vaseRim = 0x5a8a7a;
  const vaseBand = 0xc4a35a;
  const soil = 0x3a2818;
  const stem = 0x2d4a28;
  const leaf = 0x3d8f4a;
  const leafTip = 0x6bc96e;

  /* Jord ~y=0.4; hovedstamme til ~0.92 — blade i krone */
  const leaves: { pos: [number, number, number]; rot: [number, number, number]; s: number }[] = [
    { pos: [0, 0.78, 0], rot: [0, 0, 0], s: 1 },
    { pos: [0.14, 0.74, 0.06], rot: [0.4, 0.5, 0.25], s: 0.85 },
    { pos: [-0.12, 0.72, 0.08], rot: [-0.35, -0.6, -0.2], s: 0.8 },
    { pos: [0.08, 0.84, -0.1], rot: [0.5, 0.2, -0.4], s: 0.9 },
    { pos: [-0.1, 0.81, -0.08], rot: [-0.45, -0.3, 0.35], s: 0.82 },
    { pos: [0.18, 0.68, -0.04], rot: [0.25, 1.1, 0.15], s: 0.75 },
    { pos: [-0.16, 0.7, 0.02], rot: [-0.2, -1.0, -0.18], s: 0.78 },
    { pos: [0.06, 0.88, 0.12], rot: [0.55, 0.8, 0.1], s: 0.7 },
    { pos: [-0.06, 0.86, 0.1], rot: [-0.5, -0.9, -0.12], s: 0.72 },
  ];

  return (
    <group
      ref={ref}
      {...props}
      userData={{ isMovable: true, movableType: 'gulvplante', meshName: 'Gulvplante' }}
    >
      <group scale={ROOM_FURNITURE_SCALE}>
        <mesh position={[0, 0.07, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.22, 0.26, 0.14, 20]} />
          <meshStandardMaterial color={vaseBody} roughness={0.88} flatShading />
        </mesh>
        <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.26, 0.22, 0.22, 24]} />
          <meshStandardMaterial color={vaseBody} roughness={0.82} flatShading />
        </mesh>
        <mesh position={[0, 0.345, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.17, 0.08, 20]} />
          <meshStandardMaterial color={vaseRim} roughness={0.65} flatShading />
        </mesh>
        <mesh position={[0, 0.28, 0]} castShadow>
          <cylinderGeometry args={[0.265, 0.265, 0.04, 24]} />
          <meshStandardMaterial color={vaseBand} roughness={0.45} metalness={0.25} flatShading />
        </mesh>
        <mesh position={[0, 0.385, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.16, 0.14, 0.03, 16]} />
          <meshStandardMaterial color={soil} roughness={1} flatShading />
        </mesh>
        <mesh position={[0, 0.66, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.03, 0.52, 8]} />
          <meshStandardMaterial color={stem} roughness={0.9} flatShading />
        </mesh>
        {[
          [0.06, 0.52, 0.05, 0.12],
          [-0.07, 0.5, 0.04, -0.15],
          [0.04, 0.48, -0.06, 0.2],
          [-0.05, 0.49, -0.05, -0.1],
        ].map(([x, y, z, ry], i) => (
          <mesh key={`st${i}`} position={[x, y, z]} rotation={[0.35, ry, 0]} castShadow>
            <cylinderGeometry args={[0.018, 0.014, 0.28, 6]} />
            <meshStandardMaterial color={stem} roughness={0.9} flatShading />
          </mesh>
        ))}
        {leaves.map((L, i) => (
          <mesh
            key={`lf${i}`}
            position={L.pos}
            rotation={L.rot}
            scale={L.s}
            castShadow
          >
            <sphereGeometry args={[0.22, 8, 6]} />
            <meshStandardMaterial
              color={i % 3 === 0 ? leafTip : leaf}
              roughness={0.95}
              flatShading
            />
          </mesh>
        ))}
        {leaves.slice(0, 6).map((L, i) => (
          <mesh
            key={`lb${i}`}
            position={[L.pos[0] * 0.6, L.pos[1] - 0.12, L.pos[2] * 0.6]}
            rotation={[L.rot[0] * 1.2, L.rot[1] + 0.8, L.rot[2]]}
            scale={L.s * 0.55}
            castShadow
          >
            <sphereGeometry args={[0.16, 6, 5]} />
            <meshStandardMaterial color={leaf} roughness={0.95} flatShading />
          </mesh>
        ))}
      </group>
    </group>
  );
});

export const KitchenShelfFurniture = forwardRef<Group, GroupProps>(function KitchenShelfFurniture(
  props,
  ref,
) {
  const w = 0x5c4033;
  const light = 0x8b6914;
  return (
    <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'kitchen_shelf' }}>
      <group scale={ROOM_FURNITURE_SCALE}>
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[1.2, 0.8, 0.04]} />
        <meshStandardMaterial color={w} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0, -0.2, 0.12]} castShadow>
        <boxGeometry args={[1.2, 0.03, 0.25]} />
        <meshStandardMaterial color={light} roughness={0.8} flatShading />
      </mesh>
      <mesh position={[0, 0.2, 0.12]} castShadow>
        <boxGeometry args={[1.2, 0.03, 0.25]} />
        <meshStandardMaterial color={light} roughness={0.8} flatShading />
      </mesh>
      <mesh position={[-0.35, -0.12, 0.12]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.1, 10]} />
        <meshStandardMaterial color={0xf0ede5} roughness={0.9} flatShading />
      </mesh>
      <mesh position={[-0.1, -0.12, 0.12]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.1, 10]} />
        <meshStandardMaterial color={0xc45a3c} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0.2, 0.3, 0.12]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.15, 10]} />
        <meshStandardMaterial color={0xc45a3c} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0.2, 0.39, 0.12]} castShadow>
        <cylinderGeometry args={[0.085, 0.085, 0.025, 10]} />
        <meshStandardMaterial color={w} roughness={0.85} flatShading />
      </mesh>
      </group>
    </group>
  );
});

export const KitchenRugFurniture = forwardRef<Group, GroupProps>(function KitchenRugFurniture(
  props,
  ref,
) {
  const mat = useKitchenRugMaterial();
  return (
    <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'kitchen_rug' }}>
      <group scale={ROOM_FURNITURE_SCALE}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow material={mat}>
        <planeGeometry args={[2.0, 2.8]} />
      </mesh>
      </group>
    </group>
  );
});

export const KitchenLampFurniture = forwardRef<Group, GroupProps>(function KitchenLampFurniture(
  props,
  ref,
) {
  const lampOn = useGameStore((s) => s.cabinKitchenLampOn);
  return (
    <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'kitchen_lamp' }}>
      <group scale={ROOM_FURNITURE_SCALE}>
      {/* Lang ledning mod “loft” — må gerne fortsætte ud over synlig tag (kun hytte-indre vises). */}
      <mesh position={[0, 1.75, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 3.5, 6]} />
        <meshStandardMaterial color={0x4a4a4a} roughness={0.6} flatShading />
      </mesh>
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.25, 0.2, 12]} />
        <meshStandardMaterial color={0xb8860b} roughness={0.3} metalness={0.6} flatShading />
      </mesh>
      {/* Pære centreret i åbningen på undersiden (cylinder bund y ≈ −0.1). */}
      <mesh position={[0, -0.12, 0]} castShadow>
        <sphereGeometry args={[0.056, 12, 12]} />
        <meshStandardMaterial
          color={0xfff5d6}
          emissive={0xfff5d6}
          emissiveIntensity={lampOn ? 1.15 : 0.06}
          roughness={0.45}
        />
      </mesh>
      {/* Punktlys: samme styrke i alle retninger omkring pæren → cirkulært lys på gulv/vægge (ikke én stråle-retning som spot). */}
      <pointLight
        color={0xffe8c8}
        position={[0, -0.12, 0]}
        intensity={lampOn ? 5.2 : 0}
        distance={13}
        decay={2}
      />
      </group>
    </group>
  );
});

export const KitchenTelescopeFurniture = forwardRef<Group, GroupProps>(
  function KitchenTelescopeFurniture(props, ref) {
    const wood = 0x5c4033;
    const metal = 0x4a4a4a;
    const dark = 0x2a2a2a;
    return (
      <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'kitchen_telescope' }}>
        <group scale={ROOM_FURNITURE_SCALE}>
        {[
          [-0.25, 0.02, 0.22],
          [0.25, 0.02, 0.22],
          [0, 0.02, -0.28],
        ].map((p, i) => (
          <mesh key={`f${i}`} position={[p[0]!, p[1]!, p[2]!]} castShadow>
            <sphereGeometry args={[0.03, 6, 6]} />
            <meshStandardMaterial color={dark} roughness={0.8} flatShading />
          </mesh>
        ))}
        <mesh position={[-0.125, 0.61, 0.11]} rotation={[-0.185, 0, -0.209]} castShadow>
          <cylinderGeometry args={[0.025, 0.02, 1.226, 6]} />
          <meshStandardMaterial color={wood} roughness={0.85} flatShading />
        </mesh>
        <mesh position={[0.125, 0.61, 0.11]} rotation={[-0.185, 0, 0.209]} castShadow>
          <cylinderGeometry args={[0.025, 0.02, 1.226, 6]} />
          <meshStandardMaterial color={wood} roughness={0.85} flatShading />
        </mesh>
        <mesh position={[0, 0.61, -0.14]} rotation={[0.233, 0, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.02, 1.213, 6]} />
          <meshStandardMaterial color={wood} roughness={0.85} flatShading />
        </mesh>
        <mesh position={[0, 1.2, 0]} castShadow>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color={wood} roughness={0.85} flatShading />
        </mesh>
        <group position={[0, 1.26, 0]} rotation={[-Math.PI * 0.25, 0, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.06, 0.045, 0.7, 12]} />
            <meshStandardMaterial color={metal} roughness={0.4} metalness={0.5} flatShading />
          </mesh>
          <mesh castShadow>
            <cylinderGeometry args={[0.065, 0.065, 0.02, 12]} />
            <meshStandardMaterial color={0xb8860b} roughness={0.3} metalness={0.6} flatShading />
          </mesh>
          <mesh position={[0, 0.35, 0]} castShadow>
            <cylinderGeometry args={[0.065, 0.065, 0.02, 12]} />
            <meshStandardMaterial color={dark} roughness={0.5} flatShading />
          </mesh>
          <mesh position={[0, 0.36, 0]}>
            <cylinderGeometry args={[0.055, 0.055, 0.005, 12]} />
            <meshStandardMaterial color={0x88ccee} transparent opacity={0.4} metalness={0.3} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.38, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.035, 0.08, 10]} />
            <meshStandardMaterial color={dark} roughness={0.5} flatShading />
          </mesh>
        </group>
        </group>
      </group>
    );
  },
);
