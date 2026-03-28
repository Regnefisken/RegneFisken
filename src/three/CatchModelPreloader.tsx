import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { buildCatchDataFromFishId, touchLruFishIds, topPreloadFishIds } from '../logic/catch-pool.js';
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
  const { gl, scene, camera } = useThree();

  const topIds = useMemo(
    () => topPreloadFishIds(String(location), upgrades, 12),
    [location, upgradesKey],
  );

  const [lruIds, setLruIds] = useState<string[]>([]);

  useEffect(() => {
    if (!sceneReady) return;
    let cancelled = false;
    (async () => {
      for (const id of topIds) {
        await idle(200);
        if (cancelled) return;
        setLruIds((p) => touchLruFishIds(p, id));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sceneReady, topIds]);

  useLayoutEffect(() => {
    if (!sceneReady || lruIds.length === 0) return;
    try {
      gl.compile(scene, camera);
    } catch {
      /* harmless */
    }
  }, [sceneReady, lruIds, gl, scene, camera]);

  if (!sceneReady || lruIds.length === 0) return null;

  return (
    <group visible={false} position={[999, 999, 999]}>
      {lruIds.map((id) => (
        <group key={id}>
          <HookedCatchModel fish={buildCatchDataFromFishId(id)} bucketIdle />
        </group>
      ))}
    </group>
  );
}
