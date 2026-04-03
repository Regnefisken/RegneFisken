import { forwardRef, useMemo, type ComponentPropsWithoutRef } from 'react';
import { CanvasTexture, RepeatWrapping } from 'three';
import type { Group } from 'three';
import { MeshStandardMaterial } from 'three';

type GroupProps = ComponentPropsWithoutRef<'group'>;

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
  );
});

export const KitchenStoveFurniture = forwardRef<Group, GroupProps>(function KitchenStoveFurniture(
  props,
  ref,
) {
  const steel = 0x4a4a4a;
  return (
    <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'kitchen_stove' }}>
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
  );
});

export const KitchenSinkFurniture = forwardRef<Group, GroupProps>(function KitchenSinkFurniture(
  props,
  ref,
) {
  return (
    <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'kitchen_sink' }}>
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
  );
});

export const KitchenChairFurniture = forwardRef<Group, GroupProps>(function KitchenChairFurniture(
  props,
  ref,
) {
  return (
    <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'kitchen_chair' }}>
      <mesh position={[0, 0.792, 0]} castShadow>
        <boxGeometry args={[0.72, 0.09, 0.72]} />
        <meshStandardMaterial color={0x7a5230} roughness={0.8} flatShading />
      </mesh>
      <mesh position={[0, 1.21, -0.34]} castShadow>
        <boxGeometry args={[0.72, 0.72, 0.08]} />
        <meshStandardMaterial color={0x7a5230} roughness={0.8} flatShading />
      </mesh>
      {[
        [0.3, 0.385, 0.3],
        [-0.3, 0.385, 0.3],
        [0.3, 0.385, -0.3],
        [-0.3, 0.385, -0.3],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.77, 6]} />
          <meshStandardMaterial color={0x7a5230} roughness={0.8} flatShading />
        </mesh>
      ))}
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
  );
});

export const KitchenRugFurniture = forwardRef<Group, GroupProps>(function KitchenRugFurniture(
  props,
  ref,
) {
  const mat = useKitchenRugMaterial();
  return (
    <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'kitchen_rug' }}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow material={mat}>
        <planeGeometry args={[2.0, 2.8]} />
      </mesh>
    </group>
  );
});

export const KitchenLampFurniture = forwardRef<Group, GroupProps>(function KitchenLampFurniture(
  props,
  ref,
) {
  return (
    <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'kitchen_lamp' }}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 1.2, 6]} />
        <meshStandardMaterial color={0x4a4a4a} roughness={0.6} flatShading />
      </mesh>
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.25, 0.2, 12]} />
        <meshStandardMaterial color={0xb8860b} roughness={0.3} metalness={0.6} flatShading />
      </mesh>
      <mesh position={[0, 0.05, 0]} castShadow>
        <sphereGeometry args={[0.06, 10, 10]} />
        <meshStandardMaterial
          color={0xfff5d6}
          emissive={0xfff5d6}
          emissiveIntensity={0.3}
          roughness={0.5}
        />
      </mesh>
    </group>
  );
});

export const KitchenTelescopeFurniture = forwardRef<Group, GroupProps>(
  function KitchenTelescopeFurniture(props, ref) {
  const wood = 0x5c4033;
  const metal = 0x4a4a4a;
  return (
    <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'kitchen_telescope' }}>
      <mesh position={[-0.25, 0.02, 0.22]} castShadow>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial color={0x2a2a2a} roughness={0.8} flatShading />
      </mesh>
      <mesh position={[0.25, 0.02, 0.22]} castShadow>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial color={0x2a2a2a} roughness={0.8} flatShading />
      </mesh>
      <mesh position={[0, 0.02, -0.28]} castShadow>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial color={0x2a2a2a} roughness={0.8} flatShading />
      </mesh>
      <mesh position={[-0.22, 0.7, 0.15]} rotation={[0, 0, Math.PI * 0.05]} castShadow>
        <cylinderGeometry args={[0.025, 0.02, 1.4, 6]} />
        <meshStandardMaterial color={wood} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0.22, 0.7, 0.15]} rotation={[0, 0, -Math.PI * 0.05]} castShadow>
        <cylinderGeometry args={[0.025, 0.02, 1.4, 6]} />
        <meshStandardMaterial color={wood} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0, 0.7, -0.2]} rotation={[Math.PI * 0.05, 0, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.02, 1.4, 6]} />
        <meshStandardMaterial color={wood} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0, 1.2, 0]} castShadow>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color={wood} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0, 1.3, -0.1]} rotation={[Math.PI * 0.15, 0, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.06, 0.7, 12]} />
        <meshStandardMaterial color={metal} roughness={0.4} metalness={0.5} flatShading />
      </mesh>
      <mesh position={[0, 1.38, -0.42]} rotation={[Math.PI * 0.15, 0, 0]} castShadow>
        <cylinderGeometry args={[0.065, 0.065, 0.02, 12]} />
        <meshStandardMaterial color={0x2a2a2a} roughness={0.5} flatShading />
      </mesh>
      <mesh position={[0, 1.385, -0.43]} rotation={[Math.PI * 0.15, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.005, 12]} />
        <meshStandardMaterial color={0x88ccee} transparent opacity={0.4} metalness={0.3} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.22, 0.2]} rotation={[Math.PI * 0.15, 0, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.04, 0.08, 10]} />
        <meshStandardMaterial color={0x2a2a2a} roughness={0.5} flatShading />
      </mesh>
      <mesh position={[0, 1.3, -0.1]} rotation={[Math.PI * 0.15, 0, 0]} castShadow>
        <cylinderGeometry args={[0.065, 0.065, 0.02, 12]} />
        <meshStandardMaterial color={0xb8860b} roughness={0.3} metalness={0.6} flatShading />
      </mesh>
    </group>
  );
});
