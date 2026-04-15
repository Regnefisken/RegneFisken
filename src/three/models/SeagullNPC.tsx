import { useRef, useState } from 'react';
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
  const [hovered, setHovered] = useState(false);
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
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = '';
      }}
    >
      <Seagull palette={{ body: 0xf0f0ee, wing: 0xe0e0de }} scale={hovered ? 1.1 : 1.0} />
      {hovered && (
        <mesh position={[0, 0.55, 0]}>
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshStandardMaterial color="#ffcc40" emissive="#ffcc40" emissiveIntensity={0.8} />
        </mesh>
      )}
    </group>
  );
}
