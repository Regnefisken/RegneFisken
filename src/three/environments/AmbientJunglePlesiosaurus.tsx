import { useRef } from 'react';
import type { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import { useAudio } from '../../audio/useAudio.js';
import { useCollectionStore } from '../../store/useCollectionStore.js';
import { PlesiosaurusCatchModel } from '../models/bossCatchMiniModels.js';

const WORLD_SCALE = 8;
/** Vandplan ~y=0; ligger som ved molen delvist i vandet. */
const BASE_Y = -0.3;
/** Verdenskoordinater (uden for ø-lift-gruppen) — tættere på bro og ø-centrum. */
const NPC_XZ: [number, number] = [-2.75, -16.26];
const NPC_YAW = Math.PI * 0.4;

/**
 * Plesiosaurus ved jungleøens vandkant — transport tilbage til Den Gamle Mole.
 * Placeret i verdensrum som sibling til ø-gruppen.
 */
export function AmbientJunglePlesiosaurus() {
  const root = useRef<Group>(null);
  const timeOffset = useRef(Math.random() * 10);
  const { play } = useAudio();
  const setShowJunglePlesioNPC = useCollectionStore((s) => s.setShowJunglePlesioNPC);

  useFrame(({ clock }) => {
    const g = root.current;
    if (!g) return;
    const t = clock.elapsedTime + timeOffset.current;
    g.position.y = BASE_Y + Math.sin(t * 1.2) * 0.06;
    g.rotation.z = Math.sin(t * 0.8) * 0.02;
  });

  return (
    <group
      ref={root}
      position={[NPC_XZ[0], BASE_Y, NPC_XZ[1]]}
      rotation={[0, NPC_YAW, 0]}
      scale={WORLD_SCALE}
      userData={{ jungleNpcClick: 'plesio' }}
    >
      <group
        onPointerDown={(e) => {
          e.stopPropagation();
          play('ui');
          setShowJunglePlesioNPC(true);
        }}
      >
        <PlesiosaurusCatchModel bucketIdle ambientPierNpc />
      </group>
    </group>
  );
}
