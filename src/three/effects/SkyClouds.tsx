import { useEffect, useMemo, useRef } from 'react';
import {
  BufferGeometry,
  Color,
  DodecahedronGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
} from 'three';
import { useFrame } from '@react-three/fiber';
import type { GraphicsQuality } from '../../types/game.js';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';
import { useGameStore } from '../../store/useGameStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import {
  computeDayNightPhase,
  effectivePhaseLerpT,
  getWeatherEntry,
} from '../logic/environment.js';
import { DAY_NIGHT_EPOCH_MS } from '../logic/dayNightClock.js';
import { getBackgroundZBounds } from '../logic/backgroundZBounds.js';

function cloudCountForQuality(q: GraphicsQuality): number {
  if (q === 'low') return 3;
  if (q === 'medium') return 5;
  if (q === 'high') return 7;
  return 8;
}

function disposeCloudGroup(group: Group) {
  const seenGeo = new Set<BufferGeometry>();
  group.traverse((ch) => {
    const m = ch as Mesh;
    if (m.isMesh) {
      const g = m.geometry;
      if (!seenGeo.has(g)) {
        seenGeo.add(g);
        g.dispose();
      }
      const mat = m.material;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat.dispose();
    }
  });
}
/** Minimum |x| for initial placement — some may start within viewport for visual variety. */
const CLOUD_X_CENTER_GAP = 22;
/** Minimum |x| when wrapping — must be safely off-screen so clouds never pop in. */
const CLOUD_X_WRAP_MIN = 38;
const CLOUD_X_LIM = 52;

/** Wrap position: always off-screen (|x| = WRAP_MIN … LIM). */
function randomCloudXOnSide(side: 'left' | 'right'): number {
  const span = CLOUD_X_LIM - CLOUD_X_WRAP_MIN;
  if (side === 'left') return -(CLOUD_X_WRAP_MIN + Math.random() * span);
  return CLOUD_X_WRAP_MIN + Math.random() * span;
}

/** Initial placement: allowed closer so sky isn't empty at start. */
function randomCloudXInitial(): number {
  const side = Math.random() < 0.5 ? -1 : 1;
  return side * (CLOUD_X_CENTER_GAP + Math.random() * (CLOUD_X_LIM - CLOUD_X_CENTER_GAP));
}

function createLowPolyCloud(seed: number, quality: GraphicsQuality) {
  const g = new DodecahedronGeometry(1, 0);
  const group = new Group();
  const rnd = (() => {
    let s = seed % 2147483647;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
  })();
  const blobs = quality === 'low' ? 2 : 3 + Math.floor(rnd() * 3);
  for (let i = 0; i < blobs; i++) {
    const mat = new MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.25,
      metalness: 0,
      flatShading: false,
    });
    const m = new Mesh(g, mat);
    m.position.set(rnd() * 2 - 1, rnd() * 0.5, rnd() * 2 - 1);
    m.scale.setScalar(0.5 + rnd() * 0.5);
    group.add(m);
  }
  group.userData.skipGroundSnap = true;
  return group;
}

type CloudUserData = {
  driftSign: number;
  idx: number;
};

/** Lavpoly-skyer som i legacy (`createLowPolyCloud` + horisontal drift). */
export function SkyClouds() {
  const locationId = useGameStore((s) => s.currentLocation);
  const graphicsQuality = useUIStore((s) => s.graphicsQuality);
  const reducedMotion = useReducedMotion();
  const reducedRef = useRef(reducedMotion);
  reducedRef.current = reducedMotion;

  const rootRef = useRef<Group>(null);
  const scratchColor = useRef(new Color());
  const scratchA = useRef(new Color());
  const scratchB = useRef(new Color());
  const scratchC = useRef(new Color());

  const clouds = useMemo(() => {
    const items: Group[] = [];
    const isJungle = String(locationId) === 'jungle_island';
    const JUNGLE_CZ = 14;
    const n = cloudCountForQuality(graphicsQuality);

    if (isJungle) {
      const RING_DIST_MIN = 42;
      const RING_DIST_MAX = 64;
      for (let i = 0; i < n; i++) {
        const c = createLowPolyCloud(1000 + i * 7919, graphicsQuality);
        const angle = (i / n) * Math.PI * 2 + Math.random() * 0.5;
        const dist = RING_DIST_MIN + Math.random() * (RING_DIST_MAX - RING_DIST_MIN);
        const x = Math.cos(angle) * dist;
        const z = JUNGLE_CZ + Math.sin(angle) * dist;
        const y = 5 + Math.random() * 9;
        c.position.set(x, y, z);
        (c.userData as CloudUserData).driftSign = i % 2 === 0 ? 1 : -1;
        (c.userData as CloudUserData).idx = i;
        items.push(c);
      }
    } else {
      const bounds = getBackgroundZBounds(String(locationId));
      const zRange = bounds.maxZ - bounds.minZ;
      for (let i = 0; i < n; i++) {
        const c = createLowPolyCloud(1000 + i * 7919, graphicsQuality);
        const x = randomCloudXInitial();
        const y = 4 + Math.random() * 10;
        const z = bounds.minZ + Math.random() * zRange;
        c.position.set(x, y, z);
        (c.userData as CloudUserData).driftSign = i % 2 === 0 ? 1 : -1;
        (c.userData as CloudUserData).idx = i;
        items.push(c);
      }
    }
    return items;
  }, [locationId, graphicsQuality]);

  useEffect(() => {
    return () => {
      for (const c of clouds) disposeCloudGroup(c);
    };
  }, [clouds]);

  useFrame(() => {
    const wx = useGameStore.getState().weatherType;
    const w = getWeatherEntry(wx);
    const bounds = getBackgroundZBounds(String(useGameStore.getState().currentLocation));
    const group = rootRef.current;
    if (!group) return;

    if (bounds.disabled) {
      group.visible = false;
      return;
    }
    group.visible = true;

    const { cur, nxt, lerpT: segmentLerpT } = computeDayNightPhase(Date.now() - DAY_NIGHT_EPOCH_MS);
    const lerpT = effectivePhaseLerpT(cur.name, nxt.name, segmentLerpT);

    const speed = w.storm ? 0.08 : 0.02;
    const isJungle = String(useGameStore.getState().currentLocation) === 'jungle_island';
    const JUNGLE_CZ = 14;

    if (!reducedRef.current) {
      if (isJungle) {
        for (const c of clouds) {
          const ud = c.userData as CloudUserData;
          const dx = c.position.x;
          const dz = c.position.z - JUNGLE_CZ;
          const angle = Math.atan2(dz, dx);
          const dist = Math.hypot(dx, dz);
          const angularSpeed = speed * 0.015 * ud.driftSign;
          const newAngle = angle + angularSpeed;
          c.position.x = Math.cos(newAngle) * dist;
          c.position.z = JUNGLE_CZ + Math.sin(newAngle) * dist;
        }
      } else {
        for (const c of clouds) {
          const ud = c.userData as CloudUserData;
          c.position.x += speed * ud.driftSign;
          if (c.position.x > CLOUD_X_LIM) c.position.x = randomCloudXOnSide('left');
          if (c.position.x < -CLOUD_X_LIM) c.position.x = randomCloudXOnSide('right');
          if (c.position.z > bounds.maxZ) c.position.z = bounds.maxZ;
          if (c.position.z < bounds.minZ) c.position.z = bounds.minZ;
        }
      }
    }

    scratchA.current.set(cur.lightColor);
    scratchB.current.set(nxt.lightColor);
    const baseLight = scratchColor.current.lerpColors(scratchA.current, scratchB.current, lerpT);
    scratchC.current.copy(baseLight);
    scratchC.current.lerp(scratchA.current.set(0xffffff), 0.7);
    const cCol = scratchC.current;
    if (w.storm || w.rain) cCol.multiplyScalar(0.4);

    for (const c of clouds) {
      c.traverse((ch) => {
        const m = ch as Mesh;
        if (m.isMesh && m.material && 'color' in m.material) {
          (m.material as MeshStandardMaterial).color.lerp(cCol, 0.05);
        }
      });
    }
  });

  return (
    <group ref={rootRef}>
      {clouds.map((c, i) => (
        <primitive key={i} object={c} />
      ))}
    </group>
  );
}
