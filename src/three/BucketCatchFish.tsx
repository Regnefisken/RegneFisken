import type { Dispatch, SetStateAction } from 'react';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
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

const LIVING_CATCH_ITEM_TYPES = new Set<string>([
  'fish',
  'piranha',
  'boss',
  'frog',
  'starfish',
  'halibut',
  'axolotl',
  'golden_frog',
  'boss_hvidhaj',
  'jellyfish',
  'kraken',
  'soeuhyre',
  'gnavne_gorm',
  'oyster',
]);

/** Levende fangster i spanden kan trigge periodisk vip; ukendte typer tælles som ikke-levende. */
export function isLivingCatch(itemType: string): boolean {
  return LIVING_CATCH_ITEM_TYPES.has(itemType);
}

let fishFlopActive = false;

/** Ét roligt vip på spanden (dæmpet sinusbue), max ét ad gangen. */
export function startBucketFishFlop() {
  if (fishFlopActive) return;
  fishFlopActive = true;
  const t0 = performance.now();
  const durationMs = 420 + Math.random() * 80;
  const amplitude = 0.06;
  const flopId = window.setInterval(() => {
    const b = bucketSceneAnchorRef.current;
    const t = (performance.now() - t0) / durationMs;
    if (!b || t >= 1) {
      window.clearInterval(flopId);
      if (bucketSceneAnchorRef.current) bucketSceneAnchorRef.current.rotation.z = 0;
      fishFlopActive = false;
      return;
    }
    b.rotation.z = amplitude * Math.sin(Math.PI * t) * (1 - t * 0.15);
  }, 16);
}

const START_WORLD = new Vector3(0, 2, -2);

/** Synlige fisk i spanden; ved > denne antal sættes ældste i exit-mode (FIFO). */
const BUCKET_CAPACITY = 6;
/** Vertikal afstand mellem lag (ældst nederst). 5 gaps × 0.10 = 0.50, fra bund til ~72% af spanden. */
const BUCKET_STACK_STEP = 0.10;
/** Y-offset fra spand-origin til bunden af fiske-stakken (lokal 0.15 ≈ 17% oppe i spanden). */
const BUCKET_FISH_Y_BASE = 0.15;

const BUCKET_SPLASH_COLOR = '#6ec6e6';

type SplashParticle = {
  id: string;
  position: Vector3;
  velocity: Vector3;
  age: number;
  maxAge: number;
};

export type BucketSplashParticlesHandle = {
  spawn: () => void;
};

/** Små vandpartikler ved spand-kant; spawn via ref. */
export const BucketSplashParticles = forwardRef<BucketSplashParticlesHandle>(function BucketSplashParticles(
  _props,
  ref,
) {
  const [particles, setParticles] = useState<SplashParticle[]>([]);

  const spawn = useCallback(() => {
    const b = bucketSceneAnchorRef.current;
    if (!b) return;
    b.updateMatrixWorld(true);
    const n = 3 + Math.floor(Math.random() * 3);
    const next: SplashParticle[] = [];
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2;
      const rad = Math.random() * 0.3;
      const local = new Vector3(
        Math.cos(angle) * rad,
        BUCKET_VISUAL_HEIGHT,
        Math.sin(angle) * rad,
      );
      local.applyMatrix4(b.matrixWorld);
      const vx = (Math.random() - 0.5) * 0.6;
      const vz = (Math.random() - 0.5) * 0.6;
      const vy = 1.5 + Math.random() * 1.0;
      next.push({
        id: `${performance.now()}-${i}-${Math.random().toString(36).slice(2, 9)}`,
        position: local.clone(),
        velocity: new Vector3(vx, vy, vz),
        age: 0,
        maxAge: 0.5 + Math.random() * 0.3,
      });
    }
    setParticles((p) => [...p, ...next]);
  }, []);

  useImperativeHandle(ref, () => ({ spawn }), [spawn]);

  useFrame((_, dt) => {
    setParticles((prev) => {
      if (prev.length === 0) return prev;
      return prev
        .map((p) => {
          const vy = p.velocity.y - 5 * dt;
          const pos = new Vector3(
            p.position.x + p.velocity.x * dt,
            p.position.y + p.velocity.y * dt,
            p.position.z + p.velocity.z * dt,
          );
          return {
            ...p,
            position: pos,
            velocity: new Vector3(p.velocity.x, vy, p.velocity.z),
            age: p.age + dt,
          };
        })
        .filter((p) => p.age < p.maxAge);
    });
  });

  return (
    <>
      {particles.map((p) => {
        const opacity = 0.7 * (1 - p.age / p.maxAge);
        return (
          <mesh key={p.id} position={[p.position.x, p.position.y, p.position.z]}>
            <boxGeometry args={[0.04, 0.04, 0.04]} />
            <meshStandardMaterial
              color={BUCKET_SPLASH_COLOR}
              transparent
              opacity={Math.max(0, opacity)}
            />
          </mesh>
        );
      })}
    </>
  );
});

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

  return bucketScalar * scaleFactor;
}

function BucketFishRow({
  row,
  stackIndex,
  wobbleOffset,
  setRows,
}: {
  row: FishRow;
  /** Indeks i køen af fisk i `bucket`-mode (0 = nederst). For `flying`: antal i spanden før landing. */
  stackIndex: number;
  wobbleOffset: number;
  setRows: Dispatch<SetStateAction<FishRow[]>>;
}) {
  const groupRef = useRef<Group>(null);
  const destWorldRef = useRef(new Vector3());
  const baseYRef = useRef<number | null>(null);
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
        if (inBucket.length <= BUCKET_CAPACITY) return next;
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
      const destWorld = destWorldRef.current;
      bucket.getWorldPosition(destWorld);
      if (g.parent) g.parent.worldToLocal(destWorld);
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
        bucket.getWorldPosition(destWorld);
        if (g.parent) g.parent.worldToLocal(destWorld);
        const floorY = destWorld.y + BUCKET_FISH_Y_BASE + stackIndex * BUCKET_STACK_STEP;
        const angle = rnd.angle;
        const r = rnd.r;
        g.position.set(destWorld.x + Math.cos(angle) * r, floorY, destWorld.z + Math.sin(angle) * r);
        g.rotation.set(
          Math.PI / 2 + (Math.random() - 0.5) * 0.5,
          Math.random() * Math.PI * 2,
          (Math.random() - 0.5) * 0.5,
        );
        g.scale.setScalar(bucketScalar);
        targetScale.current = applyBucketClipping(g, bucketScalar);
        baseYRef.current = floorY;
        startBucketShake();
        setFishIdle(true);
        onLanded(row.id);
      }
      return;
    }

    if (fishIdle && row.mode === 'bucket') {
      if (!bucket) return;
      bucket.getWorldPosition(destWorldRef.current);
      if (g.parent) g.parent.worldToLocal(destWorldRef.current);
      const targetY =
        destWorldRef.current.y + BUCKET_FISH_Y_BASE + stackIndex * BUCKET_STACK_STEP;
      const by = baseYRef.current ?? targetY;
      baseYRef.current = by + (targetY - by) * Math.min(1, dt * 5);
      const time = performance.now() * 0.001;
      g.position.y =
        baseYRef.current + Math.sin(time * bucketWobbleSpeed + wobbleOffset) * 0.003;
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

/** Legacy `animateFishToBucket` + max synlige fisk + ældste glider ud under spanden (FIFO). */
export function BucketCatchFish() {
  const [rows, setRows] = useState<FishRow[]>([]);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const splashRef = useRef<BucketSplashParticlesHandle>(null);
  const seq = useBucketDropStore((s) => s.seq);
  const clearVisualSeq = useBucketDropStore((s) => s.clearVisualSeq);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const tick = () => {
      const r = rowsRef.current;
      const hasLiving = r.some(
        (row) => row.mode === 'bucket' && isLivingCatch(row.fish.itemType),
      );
      if (hasLiving) {
        startBucketFishFlop();
        splashRef.current?.spawn();
      }
      const delay = 12000 + Math.random() * 6000;
      timeoutId = window.setTimeout(tick, delay);
    };
    const delay = 12000 + Math.random() * 6000;
    timeoutId = window.setTimeout(tick, delay);
    return () => clearTimeout(timeoutId);
  }, []);

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
      <BucketSplashParticles ref={splashRef} />
      {rows.map((row) => {
        const inBucketRows = rows.filter((x) => x.mode === 'bucket');
        const stackIndex =
          row.mode === 'bucket'
            ? inBucketRows.findIndex((x) => x.id === row.id)
            : row.mode === 'flying'
              ? inBucketRows.length
              : 0;
        return (
          <BucketFishRow
            key={row.id}
            row={row}
            stackIndex={stackIndex}
            wobbleOffset={wobblePhaseForRowId(row.id)}
            setRows={setRows}
          />
        );
      })}
    </>
  );
}
