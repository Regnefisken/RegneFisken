import { forwardRef, useMemo, type ComponentPropsWithoutRef } from 'react';
import { CanvasTexture, RepeatWrapping } from 'three';
import type { Group } from 'three';
import { DoubleSide, MeshStandardMaterial } from 'three';

type GroupProps = ComponentPropsWithoutRef<'group'>;

function useBedroomRugMaterial() {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 384;
    const ctx = c.getContext('2d');
    if (!ctx) return new MeshStandardMaterial({ color: 0x6b1c23, roughness: 1 });
    ctx.fillStyle = '#6B1C23';
    ctx.fillRect(0, 0, 512, 384);
    ctx.strokeStyle = '#4a1018';
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, 492, 364);
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3;
    ctx.strokeRect(28, 28, 456, 328);
    const tex = new CanvasTexture(c);
    tex.wrapS = RepeatWrapping;
    tex.wrapT = RepeatWrapping;
    return new MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0 });
  }, []);
}

export const BedroomBedFurniture = forwardRef<Group, GroupProps>(function BedroomBedFurniture(
  props,
  ref,
) {
  const w = 0x5c4033;
  const fabric = 0xf5f0e6;
  const duvet = 0x6b1c23;
  return (
    <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'bedroom_bed' }}>
      <mesh position={[0, 0.55, -0.9]} castShadow>
        <boxGeometry args={[1.8, 1.1, 0.08]} />
        <meshStandardMaterial color={w} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0, 0.25, 0.9]} castShadow>
        <boxGeometry args={[1.8, 0.5, 0.08]} />
        <meshStandardMaterial color={w} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[-0.86, 0.15, 0]} castShadow>
        <boxGeometry args={[0.08, 0.3, 1.72]} />
        <meshStandardMaterial color={w} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0.86, 0.15, 0]} castShadow>
        <boxGeometry args={[0.08, 0.3, 1.72]} />
        <meshStandardMaterial color={w} roughness={0.85} flatShading />
      </mesh>
      {[
        [-0.82, 0.1, -0.82],
        [0.82, 0.1, -0.82],
        [-0.82, 0.1, 0.82],
        [0.82, 0.1, 0.82],
      ].map((p, i) => (
        <mesh key={i} position={[p[0], p[1], p[2]]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.2, 8]} />
          <meshStandardMaterial color={w} roughness={0.85} flatShading />
        </mesh>
      ))}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[1.64, 0.2, 1.72]} />
        <meshStandardMaterial color={fabric} roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0, 0.56, -0.6]} castShadow>
        <boxGeometry args={[0.65, 0.12, 0.35]} />
        <meshStandardMaterial color={fabric} roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0, 0.52, 0.2]} castShadow>
        <boxGeometry args={[1.55, 0.08, 1.0]} />
        <meshStandardMaterial color={duvet} roughness={0.95} flatShading />
      </mesh>
    </group>
  );
});

export const BedroomNightstandFurniture = forwardRef<Group, GroupProps>(
  function BedroomNightstandFurniture(props, ref) {
  const w = 0x5c4033;
  return (
    <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'bedroom_nightstand' }}>
      <mesh position={[0, 0.26, 0]} castShadow>
        <boxGeometry args={[0.55, 0.52, 0.4]} />
        <meshStandardMaterial color={w} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0, 0.52, 0]} castShadow>
        <boxGeometry args={[0.58, 0.04, 0.42]} />
        <meshStandardMaterial color={0x8b6914} roughness={0.8} flatShading />
      </mesh>
      <mesh position={[0, 0.3, 0.185]} castShadow>
        <boxGeometry args={[0.42, 0.12, 0.02]} />
        <meshStandardMaterial color={w} roughness={0.85} flatShading />
      </mesh>
      {[
        [-0.19, 0.06, -0.15],
        [0.19, 0.06, -0.15],
        [-0.19, 0.06, 0.15],
        [0.19, 0.06, 0.15],
      ].map((p, i) => (
        <mesh key={i} position={[p[0], p[1], p[2]]} castShadow>
          <sphereGeometry args={[0.025, 6, 5]} />
          <meshStandardMaterial color={0xb8860b} roughness={0.4} metalness={0.5} flatShading />
        </mesh>
      ))}
    </group>
  );
});

export const BedroomLampFurniture = forwardRef<Group, GroupProps>(function BedroomLampFurniture(
  props,
  ref,
) {
  return (
    <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'bedroom_lamp' }}>
      <mesh position={[0, 0.012, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.16, 0.02, 12]} />
        <meshStandardMaterial color={0xb8860b} roughness={0.3} metalness={0.6} flatShading />
      </mesh>
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 0.22, 10]} />
        <meshStandardMaterial color={0xb8860b} roughness={0.3} metalness={0.6} flatShading />
      </mesh>
      <mesh position={[0, 0.32, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.18, 0.2, 12]} />
        <meshStandardMaterial color={0xf5f0e6} roughness={1} flatShading />
      </mesh>
      <mesh position={[0, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.04, 12]} />
        <meshStandardMaterial color={0xd4c4a8} roughness={0.6} flatShading />
      </mesh>
    </group>
  );
});

export const BedroomDresserFurniture = forwardRef<Group, GroupProps>(function BedroomDresserFurniture(
  props,
  ref,
) {
  const w = 0x5c4033;
  return (
    <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'bedroom_dresser' }}>
      <mesh position={[0, 0.03, 0]} castShadow>
        <boxGeometry args={[1.4, 0.06, 0.55]} />
        <meshStandardMaterial color={0x3e2a1a} roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[1.4, 0.8, 0.55]} />
        <meshStandardMaterial color={w} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0, 0.82, 0]} castShadow>
        <boxGeometry args={[1.42, 0.04, 0.57]} />
        <meshStandardMaterial color={0x8b6914} roughness={0.8} flatShading />
      </mesh>
      {[0.67, 0.44, 0.21].map((y, i) => (
        <mesh key={i} position={[0, y, 0.225]} castShadow>
          <boxGeometry args={[1.2, 0.14, 0.02]} />
          <meshStandardMaterial color={w} roughness={0.85} flatShading />
        </mesh>
      ))}
    </group>
  );
});

export const BedroomRugFurniture = forwardRef<Group, GroupProps>(function BedroomRugFurniture(
  props,
  ref,
) {
  const mat = useBedroomRugMaterial();
  return (
    <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'bedroom_rug' }}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow material={mat}>
        <planeGeometry args={[2.4, 1.8]} />
      </mesh>
    </group>
  );
});

export const BedroomFrameFurniture = forwardRef<Group, GroupProps>(function BedroomFrameFurniture(
  props,
  ref,
) {
  return (
    <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'bedroom_frame' }}>
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[1.1, 0.75, 0.06]} />
        <meshStandardMaterial color={0x3e2a1a} roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 0, 0.035]} castShadow>
        <boxGeometry args={[0.95, 0.62, 0.02]} />
        <meshStandardMaterial color={0x87ceeb} roughness={0.5} flatShading />
      </mesh>
      <mesh position={[0, -0.05, 0.045]}>
        <planeGeometry args={[0.7, 0.35]} />
        <meshStandardMaterial
          color={0x226688}
          roughness={0.6}
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
});

/** Chevalet / gulvspejl — geometri jf. BEDROOM_MIRROR_GUIDE (positions i lokalt rum). */
export const BedroomMirrorFurniture = forwardRef<Group, GroupProps>(function BedroomMirrorFurniture(
  props,
  ref,
) {
  const frameWood = 0x3e2a1a;
  const legWood = 0x5c4033;
  const brass = 0xb8860b;
  const glass = 0xb8c8d8;
  return (
    <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'bedroom_mirror' }}>
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[0.7, 1.3, 0.05]} />
        <meshStandardMaterial color={frameWood} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0, 1.05, 0.025]} castShadow>
        <boxGeometry args={[0.56, 1.16, 0.01]} />
        <meshStandardMaterial
          color={glass}
          roughness={0.05}
          metalness={0.9}
          envMapIntensity={0.6}
          flatShading
        />
      </mesh>
      <mesh position={[0, 1.72, 0]} castShadow>
        <boxGeometry args={[0.62, 0.04, 0.06]} />
        <meshStandardMaterial color={brass} roughness={0.3} metalness={0.6} flatShading />
      </mesh>
      <mesh position={[0, 0.38, 0]} castShadow>
        <boxGeometry args={[0.62, 0.04, 0.06]} />
        <meshStandardMaterial color={brass} roughness={0.3} metalness={0.6} flatShading />
      </mesh>
      <mesh position={[-0.28, 0.19, 0]} castShadow>
        <boxGeometry args={[0.06, 0.38, 0.4]} />
        <meshStandardMaterial color={legWood} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0.28, 0.19, 0]} castShadow>
        <boxGeometry args={[0.06, 0.38, 0.4]} />
        <meshStandardMaterial color={legWood} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0, 0.12, 0]} castShadow>
        <boxGeometry args={[0.5, 0.04, 0.04]} />
        <meshStandardMaterial color={legWood} roughness={0.85} flatShading />
      </mesh>
      {[
        [-0.28, 0.02, 0.17],
        [-0.28, 0.02, -0.17],
        [0.28, 0.02, 0.17],
        [0.28, 0.02, -0.17],
      ].map((p, i) => (
        <mesh key={i} position={[p[0], p[1], p[2]]} castShadow>
          <boxGeometry args={[0.07, 0.04, 0.06]} />
          <meshStandardMaterial color={brass} roughness={0.3} metalness={0.6} flatShading />
        </mesh>
      ))}
    </group>
  );
});
