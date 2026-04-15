import { useRef } from 'react';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import { Seagull } from './Seagull.js';

/**
 * Havnemågen Haps — NPC der sidder på brostolpe ved Skovsøen.
 * Idle: basker let, kigger rundt, vipper med hoved.
 * Klik: åbner CollectibleModal for sardiner.
 */
export function SeagullNPC({
  position = [-1.8, 0.85, 5.9],
  onInteract,
}: {
  position?: [number, number, number];
  onInteract: () => void;
}) {
  const g = useRef<Group>(null);
  const baseY = position[1];

  useFrame(({ clock }) => {
    if (!g.current) return;
    const t = clock.elapsedTime;
    g.current.rotation.y = Math.sin(t * 0.5) * 0.3;
    g.current.position.y = baseY + Math.sin(t * 1.2) * 0.015;
  });

  return (
    <group
      ref={g}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onInteract();
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = '';
      }}
    >
      <Seagull palette={{ body: 0xf0f0ee, wing: 0xe0e0de }} wingFlapMoodCycle />
    </group>
  );
}
