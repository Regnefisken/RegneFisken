import { useRef } from 'react';
import type { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import { useAudio } from '../../audio/useAudio.js';
import { useCollectionStore } from '../../store/useCollectionStore.js';
import { usePlayerStore } from '../../store/usePlayerStore.js';
import { PlesiosaurusCatchModel } from '../models/bossCatchMiniModels.js';

/** Legacy ~8625–8628: verdensskala ~0,44 = indre 0,055 × 8. */
const WORLD_SCALE = 8;
const BASE_Y = 0.05;
const NPC_XZ: [number, number] = [-6, 1.2];
const NPC_YAW = -Math.PI * 0.2;

/**
 * Plesiosaurus på Den Gamle Mole efter fangst i Dybet — som legacy `plesio_defeated` + `plesioNPCMesh`
 * (position ~(-6, 0.15, 1.2) i verden, bob/hæld i tickScene).
 */
export function AmbientPierPlesiosaurus() {
  const hasPlesio = usePlayerStore((s) => s.questItems.includes('plesio_defeated'));
  const root = useRef<Group>(null);
  const timeOffset = useRef(Math.random() * 10);
  const { play } = useAudio();
  const setShowPlesioNPC = useCollectionStore((s) => s.setShowPlesioNPC);

  useFrame(({ clock }) => {
    const g = root.current;
    if (!g) return;
    const t = clock.elapsedTime + timeOffset.current;
    g.position.y = BASE_Y + Math.sin(t * 1.2) * 0.06;
    g.rotation.z = Math.sin(t * 0.8) * 0.02;
  });

  if (!hasPlesio) return null;

  return (
    <group ref={root} position={[NPC_XZ[0], BASE_Y, NPC_XZ[1]]} rotation={[0, NPC_YAW, 0]} scale={WORLD_SCALE}>
      <group
        onPointerDown={(e) => {
          e.stopPropagation();
          play('ui');
          setShowPlesioNPC(true);
        }}
      >
        <PlesiosaurusCatchModel bucketIdle />
      </group>
    </group>
  );
}
