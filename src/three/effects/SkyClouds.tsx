import { useMemo, useRef } from 'react';
import { Color, DodecahedronGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/useGameStore.js';
import {
  computeDayNightPhase,
  computeNightSkyOpacity,
  effectivePhaseLerpT,
  getWeatherEntry,
} from '../logic/environment.js';
import { DAY_NIGHT_EPOCH_MS } from '../logic/dayNightClock.js';
import { getBackgroundZBounds } from '../logic/backgroundZBounds.js';

const CLOUD_COUNT = 8;
/** Undgå skyer midt i synsfeltet (|x| under denne grænse). */
const CLOUD_X_CENTER_GAP = 22;
const CLOUD_X_LIM = 50;

function randomCloudXOnSide(side: 'left' | 'right'): number {
  const span = CLOUD_X_LIM - CLOUD_X_CENTER_GAP;
  if (side === 'left') return -(CLOUD_X_CENTER_GAP + Math.random() * span);
  return CLOUD_X_CENTER_GAP + Math.random() * span;
}

function randomCloudXInitial(): number {
  return Math.random() < 0.5 ? randomCloudXOnSide('left') : randomCloudXOnSide('right');
}

function createLowPolyCloud(seed: number) {
  const g = new DodecahedronGeometry(1, 0);
  const group = new Group();
  const rnd = (() => {
    let s = seed % 2147483647;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
  })();
  const blobs = 3 + Math.floor(rnd() * 3);
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
  return group;
}

type CloudUserData = {
  driftSign: number;
  idx: number;
};

/** Lavpoly-skyer som i legacy (`createLowPolyCloud` + horisontal drift). */
export function SkyClouds() {
  const locationId = useGameStore((s) => s.currentLocation);

  const rootRef = useRef<Group>(null);
  const scratchColor = useRef(new Color());
  const wasHiddenClearNightRef = useRef(false);

  const clouds = useMemo(() => {
    const bounds = getBackgroundZBounds(String(locationId));
    const zRange = bounds.maxZ - bounds.minZ;
    const items: Group[] = [];
    for (let i = 0; i < CLOUD_COUNT; i++) {
      const c = createLowPolyCloud(1000 + i * 7919);
      const x = randomCloudXInitial();
      const y = 4 + Math.random() * 10;
      const z = bounds.minZ + Math.random() * zRange;
      c.position.set(x, y, z);
      (c.userData as CloudUserData).driftSign = i % 2 === 0 ? 1 : -1;
      (c.userData as CloudUserData).idx = i;
      items.push(c);
    }
    return items;
  }, [locationId]);

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

    const { cur, nxt, lerpT: segmentLerpT } = computeDayNightPhase(Date.now() - DAY_NIGHT_EPOCH_MS);
    const nightOp = computeNightSkyOpacity(cur.name, nxt.name, segmentLerpT);
    /* Samme hold som Drei-himmel — ellers bliver skyer “morgengrå” midt i Nat→Morgen-segmentet. */
    const lerpT = effectivePhaseLerpT(cur.name, nxt.name, segmentLerpT);
    const hiddenClearNight = nightOp > 0.38 && wx === 'clear';

    const speed = w.storm ? 0.08 : 0.02;

    /* Drift også mens gruppen er skjult — ellers “fryser” x og ved morgen kan skyer stå midt i billedet. */
    for (const c of clouds) {
      const ud = c.userData as CloudUserData;
      c.position.x += speed * ud.driftSign;
      if (c.position.x > CLOUD_X_LIM) c.position.x = randomCloudXOnSide('left');
      if (c.position.x < -CLOUD_X_LIM) c.position.x = randomCloudXOnSide('right');
      if (c.position.z > bounds.maxZ) c.position.z = bounds.maxZ;
      if (c.position.z < bounds.minZ) c.position.z = bounds.minZ;
    }

    if (hiddenClearNight) {
      group.visible = false;
      wasHiddenClearNightRef.current = true;
    } else {
      group.visible = true;
      if (wasHiddenClearNightRef.current) {
        wasHiddenClearNightRef.current = false;
        for (const c of clouds) {
          if (Math.abs(c.position.x) < CLOUD_X_CENTER_GAP + 12) {
            c.position.x = randomCloudXOnSide(Math.random() < 0.5 ? 'left' : 'right');
          }
        }
      }

      const baseLight = scratchColor.current.lerpColors(
        new Color(cur.lightColor),
        new Color(nxt.lightColor),
        lerpT,
      );
      const cCol = baseLight.clone().lerp(new Color(0xffffff), 0.7);
      if (w.storm || w.rain) cCol.multiplyScalar(0.4);

      for (const c of clouds) {
        c.traverse((ch) => {
          const m = ch as Mesh;
          if (m.isMesh && m.material && 'color' in m.material) {
            const mat = m.material as MeshStandardMaterial;
            mat.color.lerp(cCol, 0.05);
          }
        });
      }
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
