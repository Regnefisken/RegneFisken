import { useRef } from 'react';
import type { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import { useAudio } from '../../audio/useAudio.js';
import { useCollectionStore } from '../../store/useCollectionStore.js';
import { usePlayerStore } from '../../store/usePlayerStore.js';
import { PlesiosaurusCatchModel } from '../models/bossCatchMiniModels.js';

/** Legacy ~8625–8628: verdensskala ~0,44 = indre 0,055 × 8; +20% på molen. */
const WORLD_SCALE = 8 * 1.2;
/** Vandplan ~y=0; stor skala → sænk pivot så krop/flippere ligger i vandet (ikke ovenpå). */
const BASE_Y = -0.28;
/** Samme side-/afstand til bro (x≈−6); lavere z = længere “bagud” langs molen, længere fra papegøjen (+z) uden at rykke mod venstre skærm. */
const NPC_XZ: [number, number] = [-6, -0.95];
const NPC_YAW = -Math.PI * 0.2;

/**
 * Plesiosaurus på Den Gamle Mole efter fangst i Dybet — som legacy `plesio_defeated` + `plesioNPCMesh`
 * (XZ justeret ift. papegøje på molen; Y ift. vandplan + skaleret model).
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
        <PlesiosaurusCatchModel bucketIdle ambientPierNpc />
      </group>
    </group>
  );
}
