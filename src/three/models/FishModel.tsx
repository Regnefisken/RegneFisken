import { useMemo, useRef } from 'react';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';

function hexToColor(hex: number): string {
  return `#${(hex >>> 0).toString(16).padStart(6, '0')}`;
}

/** Simpel stiliseret fisk med `useFrame`-svømning — basis for senere fuld model-pipeline. */
export function FishModel({ color, bucketIdle }: { color: number; bucketIdle?: boolean }) {
  const groupRef = useRef<Group>(null);
  const bodyColor = useMemo(() => hexToColor(color), [color]);

  useFrame(({ clock }) => {
    const g = groupRef.current;
    if (!g) return;
    const t = clock.elapsedTime;
    const tail = g.getObjectByName('tail');
    if (bucketIdle) {
      if (tail) tail.rotation.y = Math.sin(t * 8) * 0.2;
      return;
    }
    g.rotation.y = t * 0.85;
    g.position.y = Math.sin(t * 2) * 0.18;
    if (tail) tail.rotation.y = Math.sin(t * 12) * 0.35;
  });

  return (
    <group ref={groupRef} scale={0.55}>
      <mesh castShadow name="body" scale={[1.6, 0.85, 1]}>
        <sphereGeometry args={[0.9, 16, 12]} />
        <meshStandardMaterial color={bodyColor} roughness={0.35} metalness={0.08} />
      </mesh>
      <group name="tail" position={[-1.35, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <coneGeometry args={[0.45, 0.95, 8]} />
          <meshStandardMaterial color={bodyColor} roughness={0.4} />
        </mesh>
      </group>
      <mesh position={[0.75, 0.12, 0.28]} castShadow>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color={0x111111} />
      </mesh>
      <mesh position={[0.75, 0.12, -0.28]} castShadow>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color={0x111111} />
      </mesh>
    </group>
  );
}
