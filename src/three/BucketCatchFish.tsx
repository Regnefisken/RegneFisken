import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box3, Group, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import {
  BUCKET_INNER_RADIUS,
  BUCKET_VISUAL_HEIGHT,
  computeBucketScalar,
} from '../logic/bucket-visual.js';
import { CUTE_FISH_CONFIG } from '../data/fish.js';
import { useBucketDropStore } from '../store/useBucketDropStore.js';
import type { RollCatchResult } from '../types/fish.js';
import { bucketSceneAnchorRef } from './bucket-anchor.js';
import { resolveCuteFishId } from './models/resolveCatchModelId.js';
import { HookedCatchModel } from './models/HookedCatchModel.js';

const START_WORLD = new Vector3(0, 2, -2);

function wobblePhaseForRowId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return ((h % 628) / 100) * 0.6;
}

function makeRowId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type RowMode = 'flying' | 'bucket' | 'exit';

interface FishRow {
  id: string;
  fish: RollCatchResult;
  mode: RowMode;
}

function applyBucketClipping(group: Group, bucketScalar: number): number {
  const MAX_RADIUS = BUCKET_INNER_RADIUS * 1.85;
  const MAX_HEIGHT = BUCKET_VISUAL_HEIGHT * 0.85;

  group.updateMatrixWorld(true);
  const box = new Box3().setFromObject(group);
  const size = new Vector3();
  box.getSize(size);
  const itemWidth = Math.max(size.x, size.z);
  const itemHeight = size.y;

  let scaleFactor = 1;
  if (itemWidth > MAX_RADIUS) scaleFactor = Math.min(scaleFactor, (MAX_RADIUS / itemWidth) * 0.85);
  if (itemHeight > MAX_HEIGHT) scaleFactor = Math.min(scaleFactor, (MAX_HEIGHT / itemHeight) * 0.85);
  if (scaleFactor < 1) group.scale.multiplyScalar(scaleFactor);

  group.position.y -= 0.12;
  return bucketScalar * scaleFactor;
}

function startBucketShake() {
  let shakeT = 0;
  const shakeId = window.setInterval(() => {
    shakeT += 0.3;
    const b = bucketSceneAnchorRef.current;
    if (b) b.rotation.z = Math.sin(shakeT) * 0.08 * (1 - shakeT / (Math.PI * 2));
    if (shakeT > Math.PI * 2) {
      window.clearInterval(shakeId);
      if (bucketSceneAnchorRef.current) bucketSceneAnchorRef.current.rotation.z = 0;
    }
  }, 16);
}

function BucketFishRow({
  row,
  wobbleOffset,
  setRows,
}: {
  row: FishRow;
  wobbleOffset: number;
  setRows: Dispatch<SetStateAction<FishRow[]>>;
}) {
  const groupRef = useRef<Group>(null);
  const flightT = useRef(0);
  const landedEmit = useRef(false);
  const exitShrink = useRef(1);
  const targetScale = useRef(1);
  const [fishIdle, setFishIdle] = useState(false);

  const rnd = useMemo(
    () => ({ angle: Math.random() * Math.PI * 2, r: Math.random() * 0.2 + 0.1 }),
    [],
  );

  const bucketScalar = useMemo(() => computeBucketScalar(row.fish), [row.fish]);

  const bucketWobbleSpeed = useMemo(() => {
    const id = resolveCuteFishId(row.fish);
    const s = id ? CUTE_FISH_CONFIG[id]?.speed : undefined;
    return (typeof s === 'number' ? s : 1) * 2.5;
  }, [row.fish]);

  const onLanded = useCallback(
    (id: string) => {
      setRows((prev) => {
        const next = prev.map((x) => (x.id === id ? { ...x, mode: 'bucket' as const } : x));
        const inBucket = next.filter((x) => x.mode === 'bucket');
        if (inBucket.length <= 3) return next;
        const victimId = inBucket[0]!.id;
        return next.map((x) => (x.id === victimId ? { ...x, mode: 'exit' as const } : x));
      });
    },
    [setRows],
  );

  useFrame((_, dt) => {
    const g = groupRef.current;
    const bucket = bucketSceneAnchorRef.current;
    if (!g) return;

    if (row.mode === 'exit') {
      exitShrink.current -= dt * 9.4;
      const ts = targetScale.current * Math.max(0, exitShrink.current);
      g.scale.setScalar(Math.max(0.02, ts));
      g.position.y -= dt * 1.25;
      if (exitShrink.current <= 0) {
        setRows((p) => p.filter((x) => x.id !== row.id));
      }
      return;
    }

    if (!landedEmit.current) {
      if (!bucket) return;
      const destWorld = new Vector3();
      bucket.getWorldPosition(destWorld);
      destWorld.y += 0.6;

      const midWorld = new Vector3(
        (START_WORLD.x + destWorld.x) / 2,
        Math.max(START_WORLD.y, destWorld.y) + 3.5,
        (START_WORLD.z + destWorld.z) / 2,
      );

      flightT.current += dt * 2.2;
      const t = Math.min(1, flightT.current);
      const u = 1 - t;
      g.position.set(
        u * u * START_WORLD.x + 2 * u * t * midWorld.x + t * t * destWorld.x,
        u * u * START_WORLD.y + 2 * u * t * midWorld.y + t * t * destWorld.y,
        u * u * START_WORLD.z + 2 * u * t * midWorld.z + t * t * destWorld.z,
      );
      g.rotation.y += dt * 9;

      if (t >= 1 && !landedEmit.current) {
        landedEmit.current = true;
        const angle = rnd.angle;
        const r = rnd.r;
        g.position.set(
          destWorld.x + Math.cos(angle) * r,
          destWorld.y - 0.1,
          destWorld.z + Math.sin(angle) * r,
        );
        g.rotation.set(
          Math.PI / 2 + (Math.random() - 0.5) * 0.5,
          Math.random() * Math.PI * 2,
          (Math.random() - 0.5) * 0.5,
        );
        g.scale.setScalar(bucketScalar);
        targetScale.current = applyBucketClipping(g, bucketScalar);
        startBucketShake();
        setFishIdle(true);
        onLanded(row.id);
      }
      return;
    }

    if (fishIdle) {
      const time = performance.now() * 0.001;
      g.position.y += Math.sin(time * bucketWobbleSpeed + wobbleOffset) * 0.003;
      g.rotation.y += Math.sin(time * bucketWobbleSpeed * 1.3 + wobbleOffset) * 0.005;
    }
  });

  useEffect(() => {
    if (row.mode === 'exit') {
      exitShrink.current = 1;
    }
  }, [row.mode]);

  return (
    <group ref={groupRef}>
      <HookedCatchModel fish={row.fish} bucketIdle={fishIdle && row.mode === 'bucket'} />
    </group>
  );
}

/** Legacy `animateFishToBucket` + max 3 synlige + ældste glider ud under spanden. */
export function BucketCatchFish() {
  const [rows, setRows] = useState<FishRow[]>([]);
  const seq = useBucketDropStore((s) => s.seq);
  const clearVisualSeq = useBucketDropStore((s) => s.clearVisualSeq);

  useEffect(() => {
    const batch = useBucketDropStore.getState().drainQueue();
    if (batch.length === 0) return;
    setRows((r) => [...r, ...batch.map((fish) => ({ id: makeRowId(), fish, mode: 'flying' as const }))]);
  }, [seq]);

  useEffect(() => {
    setRows([]);
  }, [clearVisualSeq]);

  return (
    <>
      {rows.map((row) => (
        <BucketFishRow
          key={row.id}
          row={row}
          wobbleOffset={wobblePhaseForRowId(row.id)}
          setRows={setRows}
        />
      ))}
    </>
  );
}
