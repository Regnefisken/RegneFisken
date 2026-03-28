import { useMemo, useRef, type ReactNode } from 'react';
import {
  CanvasTexture,
  CylinderGeometry,
  RepeatWrapping,
  type Group,
  type Mesh,
} from 'three';
import type { ThreeElements } from '@react-three/fiber';
import { useFrame } from '@react-three/fiber';

function createCamoTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0a1f0a';
  ctx.fillRect(0, 0, 512, 512);
  const colors = ['#143314', '#1f4c1f', '#296629', '#0d260d'];
  for (let i = 0; i < 800; i++) {
    ctx.beginPath();
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const radiusX = 8 + Math.random() * 15;
    const radiusY = 5 + Math.random() * 10;
    ctx.ellipse(x, y, radiusX, radiusY, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)]!;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#050f05';
    ctx.stroke();
  }
  const tex = new CanvasTexture(canvas);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

/** Ønske-ånd / helleflynder — legacy `createSpirit` + fin/krone animation. */
export function Spirit({ children, ...props }: { children?: ReactNode } & ThreeElements['group']) {
  const finRef = useRef<Mesh>(null);
  const crownRef = useRef<Group>(null);
  const offset = useMemo(() => Math.PI, []);

  const camoTex = useMemo(() => {
    if (typeof document === 'undefined') return null;
    return createCamoTexture();
  }, []);

  const camoMat = useMemo(
    () => ({
      color: 0x113311,
      map: camoTex ?? undefined,
      roughness: 0.7,
      metalness: 0.1,
      clearcoat: 0.3,
      side: 2 as const,
    }),
    [camoTex],
  );

  const bodyGeo = useMemo(() => {
    const g = new CylinderGeometry(0.5, 0.5, 1.4, 24);
    g.rotateZ(-Math.PI / 2);
    return g;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const fin = finRef.current;
    const crown = crownRef.current;
    if (fin) fin.scale.y = 1.0 + Math.sin(t * 5 + offset) * 0.2;
    /** Vertikal bob køres på `FishPool`-wrapper (legacy `spiritFish.position.y`). */
    if (crown) {
      crown.rotation.y = t * 0.5;
      crown.position.y = 0.35 + Math.sin(t * 3) * 0.05;
    }
  });

  return (
    <group scale={1.2} {...props}>
      <mesh geometry={bodyGeo} scale={[1, 0.25, 1]} castShadow>
        <meshPhysicalMaterial {...camoMat} />
      </mesh>
      <mesh ref={finRef} rotation={[Math.PI / 2, 0, 0]} scale={[1.2, 1.0, 1.0]}>
        <torusGeometry args={[1.5, 0.05, 8, 20]} />
        <meshPhysicalMaterial color={0x0d260d} transparent opacity={0.9} side={2} />
      </mesh>
      <group position={[0.5, 0.12, 0.25]}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.1, 10, 8]} />
          <meshBasicMaterial color={0xffd700} />
        </mesh>
        <mesh position={[0.05, 0, 0.03]}>
          <sphereGeometry args={[0.05, 8, 6]} />
          <meshBasicMaterial color={0x000000} />
        </mesh>
      </group>
      <group position={[0.5, 0.12, -0.25]}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.1, 10, 8]} />
          <meshBasicMaterial color={0xffd700} />
        </mesh>
        <mesh position={[0.05, 0, -0.03]}>
          <sphereGeometry args={[0.05, 8, 6]} />
          <meshBasicMaterial color={0x000000} />
        </mesh>
      </group>
      <group ref={crownRef} position={[0.7, 0.3, 0]}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.1, 16]} />
          <meshStandardMaterial color={0xffd700} metalness={1} roughness={0.15} />
        </mesh>
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * 0.18, 0.12, Math.sin(angle) * 0.18]}
              rotation={[Math.sin(angle) * 0.3, 0, -Math.cos(angle) * 0.3]}
            >
              <coneGeometry args={[0.04, 0.25, 4]} />
              <meshStandardMaterial color={0xffd700} metalness={1} roughness={0.15} />
            </mesh>
          );
        })}
        <pointLight color={0xffd700} intensity={1} distance={5} position={[0, 0.3, 0]} />
      </group>
      {children}
    </group>
  );
}
