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
  BUCKET_CATCH_LIFT_GAIN,
  BUCKET_CATCH_LIFT_MAX,
  BUCKET_CATCH_LIFT_REF_HEIGHT,
  BUCKET_CATCH_LIFT_REF_SCALE,
  BUCKET_CATCH_LIFT_SCALE_GAIN,
  BUCKET_CENTER_MAX_RADIAL_FACTOR,
  BUCKET_CLIP_MAX_XZ_HALF,
  BUCKET_FISH_DRIFT_AMPLITUDE,
  BUCKET_FISH_DRIFT_MAX_R_FACTOR,
  BUCKET_FISH_SURFACE_CLEARANCE,
  BUCKET_FISH_Y_BASE,
  BUCKET_FLOAT_BOB_AMPLITUDE,
  BUCKET_FLOAT_BOB_SPEED,
  BUCKET_INNER_RADIUS,
  BUCKET_STACK_STEP,
  BUCKET_VISUAL_HEIGHT,
  BUCKET_WATER_RADIUS,
  WATER_SURFACE_Y_LOCAL,
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
const BUCKET_SPLASH_COLOR = '#6ec6e6';

const surfaceWorldScratch = new Vector3();

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
        WATER_SURFACE_Y_LOCAL,
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
  const MAX_HEIGHT = BUCKET_VISUAL_HEIGHT * 0.85;

  group.updateMatrixWorld(true);
  const box = new Box3().setFromObject(group);
  const size = new Vector3();
  box.getSize(size);
  const xzHalf = Math.hypot(size.x, size.z) / 2;
  const itemHeight = size.y;

  let scaleFactor = 1;
  if (xzHalf > BUCKET_CLIP_MAX_XZ_HALF) {
    scaleFactor = Math.min(scaleFactor, (BUCKET_CLIP_MAX_XZ_HALF / xzHalf) * 0.92);
  }
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
  /** Ekstra Y efter bbox/skala — små ting løftes op i vandet. */
  const visualLiftYRef = useRef(0);
  /** Halvdel af xz-footprint efter clip — bruges til radial loft mod spandvæg. */
  const xzHalfExtentRef = useRef(0.12);
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
        g.updateMatrixWorld(true);
        const fitBox = new Box3().setFromObject(g);
        const fitSize = new Vector3();
        fitBox.getSize(fitSize);
        xzHalfExtentRef.current = Math.hypot(fitSize.x, fitSize.z) / 2;
        const hWorld = fitBox.max.y - fitBox.min.y;
        const liftH = Math.max(0, BUCKET_CATCH_LIFT_REF_HEIGHT - hWorld) * BUCKET_CATCH_LIFT_GAIN;
        const liftS =
          Math.max(0, BUCKET_CATCH_LIFT_REF_SCALE - targetScale.current) * BUCKET_CATCH_LIFT_SCALE_GAIN;
        const lift = Math.min(BUCKET_CATCH_LIFT_MAX, liftH + liftS);
        visualLiftYRef.current = lift;
        g.position.y += lift;
        baseYRef.current = floorY + lift;
        startBucketShake();
        setFishIdle(true);
        onLanded(row.id);
      }
      return;
    }

    // Brug `landedEmit` (synkron ref), ikke `fishIdle` — ellers springer useFrame bob over indtil React re-render (fisk “låst” i bund).
    if (landedEmit.current && row.mode !== 'exit') {
      if (!bucket) return;
      bucket.getWorldPosition(destWorldRef.current);
      if (g.parent) g.parent.worldToLocal(destWorldRef.current);
      const targetY =
        destWorldRef.current.y +
        BUCKET_FISH_Y_BASE +
        stackIndex * BUCKET_STACK_STEP +
        visualLiftYRef.current;
      const by = baseYRef.current ?? targetY;
      baseYRef.current = by + (targetY - by) * Math.min(1, dt * 5);

      surfaceWorldScratch.set(0, WATER_SURFACE_Y_LOCAL, 0);
      bucket.updateMatrixWorld(true);
      surfaceWorldScratch.applyMatrix4(bucket.matrixWorld);
      if (g.parent) g.parent.worldToLocal(surfaceWorldScratch);
      const maxCenterY = surfaceWorldScratch.y - BUCKET_FISH_SURFACE_CLEARANCE;

      const time = performance.now() * 0.001;
      const phase = wobbleOffset * 6.28318 + stackIndex * 1.7;
      const bob =
        Math.sin(time * BUCKET_FLOAT_BOB_SPEED + phase) * BUCKET_FLOAT_BOB_AMPLITUDE;
      let y = baseYRef.current + bob;
      y = Math.min(y, maxCenterY);
      y = Math.max(y, baseYRef.current - BUCKET_FLOAT_BOB_AMPLITUDE);
      g.position.y = y;

      const ox = destWorldRef.current.x;
      const oz = destWorldRef.current.z;
      const homeX = ox + Math.cos(rnd.angle) * rnd.r;
      const homeZ = oz + Math.sin(rnd.angle) * rnd.r;
      const phx = phase + stackIndex * 0.4;
      const phz = wobbleOffset * 4.1 + stackIndex * 2.3;
      let px =
        homeX +
        Math.sin(time * 0.88 + phx) * BUCKET_FISH_DRIFT_AMPLITUDE +
        Math.sin(time * 0.35 + phz) * (BUCKET_FISH_DRIFT_AMPLITUDE * 0.45);
      let pz =
        homeZ +
        Math.cos(time * 0.82 + phz) * BUCKET_FISH_DRIFT_AMPLITUDE +
        Math.cos(time * 0.39 + phx) * (BUCKET_FISH_DRIFT_AMPLITUDE * 0.45);
      const dx = px - ox;
      const dz = pz - oz;
      const dist = Math.hypot(dx, dz);
      const wallMax =
        BUCKET_INNER_RADIUS * BUCKET_CENTER_MAX_RADIAL_FACTOR - xzHalfExtentRef.current;
      const maxR = Math.max(
        0.025,
        Math.min(BUCKET_WATER_RADIUS * BUCKET_FISH_DRIFT_MAX_R_FACTOR, wallMax),
      );
      if (dist > maxR && dist > 1e-6) {
        const s = maxR / dist;
        px = ox + dx * s;
        pz = oz + dz * s;
      }
      g.position.x = px;
      g.position.z = pz;

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
