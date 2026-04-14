import { forwardRef, useRef, useMemo, type ComponentPropsWithoutRef } from 'react';
import { CanvasTexture, ExtrudeGeometry, RepeatWrapping, Shape } from 'three';
import type { Group } from 'three';
import { MeshStandardMaterial } from 'three';
import { useFrame } from '@react-three/fiber';

type GroupProps = ComponentPropsWithoutRef<'group'>;

const ROOM_FURNITURE_SCALE = 2 as const;

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
      <group scale={ROOM_FURNITURE_SCALE}>
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
    </group>
  );
});

export const BedroomNightstandFurniture = forwardRef<Group, GroupProps>(
  function BedroomNightstandFurniture(props, ref) {
  const w = 0x5c4033;
  return (
    <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'bedroom_nightstand' }}>
      <group scale={ROOM_FURNITURE_SCALE}>
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
    </group>
  );
});

export const BedroomLampFurniture = forwardRef<Group, GroupProps>(function BedroomLampFurniture(
  props,
  ref,
) {
  return (
    <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'bedroom_lamp' }}>
      <group scale={ROOM_FURNITURE_SCALE}>
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
      <group scale={ROOM_FURNITURE_SCALE}>
      <mesh position={[0, 0.03, 0]} castShadow>
        <boxGeometry args={[1.4, 0.06, 0.55]} />
        <meshStandardMaterial color={0x3e2a1a} roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 0.46, 0]} castShadow>
        <boxGeometry args={[1.4, 0.8, 0.55]} />
        <meshStandardMaterial color={w} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0, 0.88, 0]} castShadow>
        <boxGeometry args={[1.42, 0.04, 0.57]} />
        <meshStandardMaterial color={0x8b6914} roughness={0.8} flatShading />
      </mesh>
      {[0.73, 0.50, 0.27].map((y, i) => (
        <mesh key={i} position={[0, y, 0.225]} castShadow>
          <boxGeometry args={[1.2, 0.14, 0.02]} />
          <meshStandardMaterial color={w} roughness={0.85} flatShading />
        </mesh>
      ))}
      </group>
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
      <group scale={ROOM_FURNITURE_SCALE}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow material={mat}>
        <planeGeometry args={[2.4, 1.8]} />
      </mesh>
      </group>
    </group>
  );
});

function useFrameArtMaterial() {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 320;
    const ctx = c.getContext('2d');
    if (!ctx) return new MeshStandardMaterial({ color: 0xd2b48c, roughness: 0.6 });
    ctx.fillStyle = '#f0e6d4';
    ctx.fillRect(0, 0, 512, 320);
    const palette = [
      '#c0392b', '#2980b9', '#f39c12', '#27ae60',
      '#8e44ad', '#e67e22', '#1abc9c', '#d35400',
    ];
    const hash = (n: number) => {
      const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
      return v - Math.floor(v);
    };
    for (let i = 0; i < 15; i++) {
      const x = hash(i * 3) * 432 + 40;
      const y = hash(i * 3 + 1) * 240 + 40;
      const sz = 50 + hash(i * 3 + 2) * 110;
      ctx.fillStyle = palette[i % palette.length]!;
      ctx.globalAlpha = 0.55 + hash(i * 7) * 0.45;
      const shape = Math.floor(hash(i * 5) * 3);
      if (shape === 0) {
        ctx.beginPath();
        ctx.arc(x, y, sz / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (shape === 1) {
        const angle = hash(i * 11) * 0.5 - 0.25;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillRect(-sz / 2, -sz * 0.4, sz, sz * 0.8);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.moveTo(x, y - sz / 2);
        ctx.lineTo(x + sz / 2, y + sz / 2);
        ctx.lineTo(x - sz / 2, y + sz / 2);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    const tex = new CanvasTexture(c);
    return new MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0 });
  }, []);
}

export const BedroomFrameFurniture = forwardRef<Group, GroupProps>(function BedroomFrameFurniture(
  props,
  ref,
) {
  const artMat = useFrameArtMaterial();
  return (
    <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'bedroom_frame' }}>
      <group scale={ROOM_FURNITURE_SCALE}>
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[1.21, 0.825, 0.06]} />
        <meshStandardMaterial color={0x3e2a1a} roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 0, 0.032]} material={artMat}>
        <planeGeometry args={[1.04, 0.68]} />
      </mesh>
      </group>
    </group>
  );
});

function makeArchShape(halfW: number, rectH: number, archH: number) {
  const s = new Shape();
  s.moveTo(-halfW, 0);
  s.lineTo(-halfW, rectH);
  s.absellipse(0, rectH, halfW, archH, Math.PI, 0, true);
  s.lineTo(halfW, 0);
  s.closePath();
  return s;
}

/** Chevalet / gulvspejl — dresser-spejl-form med buet top. */
export const BedroomMirrorFurniture = forwardRef<Group, GroupProps>(function BedroomMirrorFurniture(
  props,
  ref,
) {
  const frameWood = 0x3e2a1a;
  const legWood = 0x5c4033;
  const brass = 0xb8860b;
  const glass = 0xb8c8d8;

  const frameGeo = useMemo(
    () =>
      new ExtrudeGeometry(makeArchShape(0.35, 0.85, 0.45), {
        depth: 0.05,
        bevelEnabled: false,
        curveSegments: 32,
      }),
    [],
  );

  const glassGeo = useMemo(
    () =>
      new ExtrudeGeometry(makeArchShape(0.28, 0.78, 0.38), {
        depth: 0.01,
        bevelEnabled: false,
        curveSegments: 32,
      }),
    [],
  );

  return (
    <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'bedroom_mirror' }}>
      <group scale={ROOM_FURNITURE_SCALE}>
      <mesh position={[0, 0.4, -0.025]} geometry={frameGeo} castShadow>
        <meshStandardMaterial color={frameWood} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0, 0.47, 0.02]} geometry={glassGeo} castShadow>
        <meshStandardMaterial
          color={glass}
          roughness={0.05}
          metalness={0.9}
          envMapIntensity={0.6}
          flatShading
        />
      </mesh>
      <mesh position={[0, 0.38, 0]} castShadow>
        <boxGeometry args={[0.62, 0.04, 0.06]} />
        <meshStandardMaterial color={brass} roughness={0.3} metalness={0.6} flatShading />
      </mesh>
      {/* Ben starter over messingfødder — undgår overlap i samme y-interval (z-fighting) */}
      <mesh position={[-0.28, 0.21, 0]} castShadow>
        <boxGeometry args={[0.06, 0.34, 0.4]} />
        <meshStandardMaterial color={legWood} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0.28, 0.21, 0]} castShadow>
        <boxGeometry args={[0.06, 0.34, 0.4]} />
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
          <boxGeometry args={[0.082, 0.04, 0.068]} />
          <meshStandardMaterial color={brass} roughness={0.3} metalness={0.6} flatShading />
        </mesh>
      ))}
      </group>
    </group>
  );
});

/** Højt klædeskab med to låger, fire dekorative paneler og messingknapper. */
export const BedroomWardrobeFurniture = forwardRef<Group, GroupProps>(
  function BedroomWardrobeFurniture(props, ref) {
    const wood = 0x5c4033;
    const darkWood = 0x3e2a1a;
    const brass = 0xb8860b;
    const trim = 0x8b6914;
    return (
      <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'bedroom_wardrobe' }}>
        <group scale={ROOM_FURNITURE_SCALE}>
        <mesh position={[0, 0.04, 0]} castShadow>
          <boxGeometry args={[1.26, 0.08, 0.60]} />
          <meshStandardMaterial color={darkWood} roughness={0.9} flatShading />
        </mesh>
        <mesh position={[0, 1.10, 0]} castShadow>
          <boxGeometry args={[1.2, 2.04, 0.55]} />
          <meshStandardMaterial color={wood} roughness={0.85} flatShading />
        </mesh>
        <mesh position={[0, 2.15, 0]} castShadow>
          <boxGeometry args={[1.28, 0.06, 0.62]} />
          <meshStandardMaterial color={trim} roughness={0.8} flatShading />
        </mesh>
        <mesh position={[0, 1.10, 0.275]} castShadow>
          <boxGeometry args={[0.02, 1.94, 0.02]} />
          <meshStandardMaterial color={darkWood} roughness={0.9} flatShading />
        </mesh>
        {[
          [-0.30, 1.48],
          [-0.30, 0.62],
          [0.30, 1.48],
          [0.30, 0.62],
        ].map(([x, y], i) => (
          <mesh key={`p${i}`} position={[x!, y!, 0.285]} castShadow>
            <boxGeometry args={[0.40, 0.68, 0.02]} />
            <meshStandardMaterial color={darkWood} roughness={0.85} flatShading />
          </mesh>
        ))}
        {[-0.08, 0.08].map((x, i) => (
          <mesh key={`k${i}`} position={[x, 1.10, 0.30]} castShadow>
            <sphereGeometry args={[0.03, 8, 6]} />
            <meshStandardMaterial color={brass} roughness={0.3} metalness={0.6} flatShading />
          </mesh>
        ))}
        </group>
      </group>
    );
  },
);

/** Ur-Krystal som møbel — genbruger CrystalJunkModel-geometrien men i kabine-skala med langsom rotation. */
export const CrystalFurniture = forwardRef<Group, GroupProps>(function CrystalFurniture(props, ref) {
  const innerRef = useRef<Group>(null);
  useFrame(({ clock }) => {
    const g = innerRef.current;
    if (!g) return;
    const t = clock.elapsedTime;
    g.rotation.y += 0.004;
    g.position.y = Math.sin(t * 1.5) * 0.015;
  });
  return (
    <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'ur_krystal' }}>
      <group scale={ROOM_FURNITURE_SCALE}>
        <group ref={innerRef} position={[0, 0.35, 0]} scale={0.32}>
          <pointLight color={0x00ffff} intensity={1.2} distance={3} />
          {/* Ydre oktaeder */}
          <mesh castShadow scale={[1, 1.6, 1]}>
            <octahedronGeometry args={[0.8, 2]} />
            <meshStandardMaterial
              color={0x00ffff}
              emissive={0x0066aa}
              emissiveIntensity={0.6}
              roughness={0.05}
              metalness={0.9}
              flatShading
              transparent
              opacity={0.88}
            />
          </mesh>
          {/* Indre kerne */}
          <mesh scale={[1, 1.6, 1]}>
            <octahedronGeometry args={[0.45, 1]} />
            <meshStandardMaterial
              color={0x88ffff}
              emissive={0x00aaff}
              emissiveIntensity={0.8}
              roughness={0}
              metalness={1}
              flatShading
              transparent
              opacity={0.55}
            />
          </mesh>
          {/* Tetraeder-skår */}
          <mesh castShadow position={[0.55, -0.25, 0.3]} rotation={[0.4, 0.2, 0.8]}>
            <tetrahedronGeometry args={[0.5, 1]} />
            <meshStandardMaterial color={0x00ffff} emissive={0x0066aa} emissiveIntensity={0.6} roughness={0.05} metalness={0.9} flatShading transparent opacity={0.88} />
          </mesh>
          <mesh castShadow position={[-0.45, 0.3, -0.4]} rotation={[-0.2, 0.7, -0.5]}>
            <tetrahedronGeometry args={[0.6, 1]} />
            <meshStandardMaterial color={0x00ffff} emissive={0x0066aa} emissiveIntensity={0.6} roughness={0.05} metalness={0.9} flatShading transparent opacity={0.88} />
          </mesh>
          <mesh castShadow position={[0.2, -0.5, -0.5]} rotation={[0.8, -0.3, 0.4]}>
            <tetrahedronGeometry args={[0.35, 1]} />
            <meshStandardMaterial color={0x00ffff} emissive={0x0066aa} emissiveIntensity={0.6} roughness={0.05} metalness={0.9} flatShading transparent opacity={0.88} />
          </mesh>
        </group>
      </group>
    </group>
  );
});
