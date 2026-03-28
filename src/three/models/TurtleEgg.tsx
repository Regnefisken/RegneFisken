import { useRef } from 'react';
import type { Mesh } from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import { useFrame } from '@react-three/fiber';

const mat = {
  color: 0xf0ead6,
  roughness: 0.55,
  emissive: 0x442200,
  emissiveIntensity: 0.15,
  flatShading: false as const,
};

/** Legacy: SphereGeometry(0.3,12,8), scale (1,1.35,1), pulse — tropical island æg */
export function TurtleEgg({ onInteract }: { onInteract: (e: ThreeEvent<PointerEvent>) => void }) {
  const meshRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    const m = meshRef.current;
    if (!m) return;
    const pulse = 1 + Math.sin(clock.elapsedTime * 2) * 0.03;
    m.scale.set(pulse, 1.35 * pulse, pulse);
  });

  return (
    <mesh
      ref={meshRef}
      position={[4.2, 0.23, 4.8]}
      castShadow
      userData={{ isTurtleEgg: true }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onInteract(e);
      }}
    >
      <sphereGeometry args={[0.3, 12, 8]} />
      <meshStandardMaterial {...mat} />
    </mesh>
  );
}
