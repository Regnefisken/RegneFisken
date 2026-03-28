import { useMemo, useRef } from 'react';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import { displayScaleForCatch } from '../logic/display-scale.js';
import { useGameStore } from '../store/useGameStore.js';
import { useFishingStore } from '../store/useFishingStore.js';
import { HookedCatchModel } from './models/HookedCatchModel.js';

const DISPLAY_Y = 2.5;
const BOB_AMP = 0.2;
const BOB_AMP_SPIRIT = 0.3;
const BOB_FREQ = 2;
/** ~legacy `rotation.y += 0.01` pr. frame @ ~60 Hz */
const SPIN_RAD_S = 0.65;

function bobPhaseOffset(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (h % 628) / 100;
}

/**
 * Vises efter fangst (`lastCatch`) — som legacy, først synlig i `catch`-state.
 * Legacy display-loop: y-bob + langsom y-rotation (undtagen Spirit/halibut med egen `customUpdate`).
 */
export function FishPool() {
  const animRef = useRef<Group>(null);
  const gameState = useGameStore((s) => s.gameState);
  const lastCatch = useFishingStore((s) => s.lastCatch);

  const fish =
    gameState === 'catch' && lastCatch && lastCatch.itemType !== 'cabin_key'
      ? lastCatch
      : null;

  const displayScale = useMemo(
    () => (fish ? displayScaleForCatch(fish) : 1),
    [fish],
  );

  const bobOffset = useMemo(() => (fish ? bobPhaseOffset(fish.id) : 0), [fish]);

  useFrame(({ clock }, dt) => {
    const g = animRef.current;
    if (!g || !fish) return;
    const t = clock.elapsedTime;
    const amp = fish.itemType === 'halibut' ? BOB_AMP_SPIRIT : BOB_AMP;
    g.position.y = DISPLAY_Y + Math.sin(t * BOB_FREQ + bobOffset) * amp;
    if (fish.itemType !== 'halibut') {
      g.rotation.y += SPIN_RAD_S * dt;
    }
  });

  if (!fish) return null;

  return (
    <group position={[0, 0, -0.5]}>
      <group ref={animRef} position={[0, DISPLAY_Y, 0]} scale={displayScale}>
        <HookedCatchModel fish={fish} />
      </group>
    </group>
  );
}
