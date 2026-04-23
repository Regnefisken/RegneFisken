import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Group } from 'three';
import { useThree } from '@react-three/fiber';
import { buildCatchDataFromFishId, touchLruFishIds, topPreloadFishIds } from '../logic/catch-pool.js';
import { useFishingStore } from '../store/useFishingStore.js';
import { useGameStore } from '../store/useGameStore.js';
import { usePlayerStore } from '../store/usePlayerStore.js';
import { HookedCatchModel } from './models/HookedCatchModel.js';

function idle(ms: number): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => resolve(), { timeout: ms });
    } else {
      setTimeout(resolve, 0);
    }
  });
}

/**
 * Idle-preload af catch-modeller for aktuel lokation + LRU (~40), usynlig gruppe.
 * Kalder `gl.compile` efter batch for shader warm (som legacy `FishPool.warmShaders`).
 */
export function CatchModelPreloader() {
  const location = useGameStore((s) => s.currentLocation);
  const sceneReady = useGameStore((s) => s.sceneReady);
  const upgrades = usePlayerStore((s) => s.upgrades);
  const upgradesKey = upgrades.join('|');
  const hasCabinKeyInQuest = usePlayerStore((s) => s.questItems.includes('cabin_key'));
  const urgentId = useFishingStore((s) => s.urgentPreloadId);
  const { gl, camera } = useThree();

  const preloadGroupRef = useRef<Group>(null);
  const warmedRef = useRef(new Set<string>());

  const topIds = useMemo(
    () => topPreloadFishIds(String(location), upgrades, 12, hasCabinKeyInQuest),
    [location, upgradesKey, hasCabinKeyInQuest],
  );

  const [lruIds, setLruIds] = useState<string[]>([]);

  useEffect(() => {
    if (!urgentId || !sceneReady) return;
    setLruIds((p) => touchLruFishIds(p, urgentId));
    useFishingStore.getState().setUrgentPreload(null);
  }, [urgentId, sceneReady]);

  useEffect(() => {
    if (!sceneReady) return;
    let cancelled = false;
    (async () => {
      for (let i = 0; i < topIds.length; i++) {
        if (i > 0) await idle(200);
        if (cancelled) return;
        setLruIds((p) => touchLruFishIds(p, topIds[i]!));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sceneReady, topIds]);

  useLayoutEffect(() => {
    if (!sceneReady || lruIds.length === 0 || !preloadGroupRef.current) return;
    const newIds = lruIds.filter((id) => !warmedRef.current.has(id));
    if (newIds.length === 0) return;
    try {
      gl.compile(preloadGroupRef.current, camera);
      for (const id of newIds) warmedRef.current.add(id);
    } catch {
      /* harmless */
    }
  }, [sceneReady, lruIds, gl, camera]);

  if (!sceneReady || lruIds.length === 0) return null;

  return (
    <group ref={preloadGroupRef} visible={false} position={[999, 999, 999]}>
      {lruIds.map((id) => (
        <group key={id}>
          <HookedCatchModel fish={buildCatchDataFromFishId(id)} bucketIdle />
        </group>
      ))}
    </group>
  );
}
