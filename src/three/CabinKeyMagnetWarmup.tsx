import { useLayoutEffect, useMemo, useRef } from 'react';
import { Group } from 'three';
import { useThree } from '@react-three/fiber';
import { buildCatchDataFromFishId } from '../logic/catch-pool.js';
import { useFishingStore } from '../store/useFishingStore.js';
import { useGameStore } from '../store/useGameStore.js';
import { usePlayerStore } from '../store/usePlayerStore.js';
import { HookedCatchModel } from './models/HookedCatchModel.js';

const OFFMAP: [number, number, number] = [999, 999, 999];

/**
 * Målrettet warm-up: samme nøgle-mesh som fangst (`HookedCatchModel` + extrude) mountes
 * usynligt og `gl.compile` køres én gang når `cabinKeyMagnetWarmup` sættes fra molen
 * (første magnet-tryk). Dækker hakkende første frame hvis `CatchModelPreloader` ikke
 * når at LRU-/idle-rottere nøglen ind i `gl.compile` tids nok.
 * Kører kun når `canWarmup` (magnet, ikke allerede nøgle) — fanger evt. hængende flag.
 */
export function CabinKeyMagnetWarmup() {
  const cabinKeyMagnetWarmup = useFishingStore((s) => s.cabinKeyMagnetWarmup);
  const setCabinKeyMagnetWarmup = useFishingStore((s) => s.setCabinKeyMagnetWarmup);
  const canWarmup = usePlayerStore(
    (s) => s.upgrades.includes('magnet') && !s.questItems.includes('cabin_key'),
  );
  const sceneReady = useGameStore((s) => s.sceneReady);
  const { gl, camera } = useThree();
  const groupRef = useRef<Group>(null);

  const keyFish = useMemo(() => buildCatchDataFromFishId('cabin_key'), []);

  useLayoutEffect(() => {
    if (!cabinKeyMagnetWarmup) return;
    if (!canWarmup) {
      setCabinKeyMagnetWarmup(false);
      return;
    }
    if (!sceneReady || !groupRef.current) return;
    try {
      gl.compile(groupRef.current, camera);
    } catch {
      /* harmless */
    } finally {
      setCabinKeyMagnetWarmup(false);
    }
  }, [cabinKeyMagnetWarmup, canWarmup, sceneReady, gl, camera, setCabinKeyMagnetWarmup]);

  if (!cabinKeyMagnetWarmup) return null;
  if (!canWarmup) return null;
  if (!sceneReady) return null;

  return (
    <group ref={groupRef} visible={false} position={OFFMAP} frustumCulled={false}>
      <HookedCatchModel fish={keyFish} bucketIdle />
    </group>
  );
}
