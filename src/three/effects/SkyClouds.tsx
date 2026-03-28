import { useMemo, useRef } from 'react';
import { Color, DodecahedronGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/useGameStore.js';
import { computeDayNightPhase, getWeatherEntry } from '../logic/environment.js';
import { DAY_NIGHT_EPOCH_MS } from '../logic/dayNightClock.js';
import { getBackgroundZBounds } from '../logic/backgroundZBounds.js';

const CLOUD_COUNT = 8;

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
  const weatherType = useGameStore((s) => s.weatherType);

  const rootRef = useRef<Group>(null);
  const scratchColor = useRef(new Color());

  const clouds = useMemo(() => {
    const bounds = getBackgroundZBounds(String(locationId));
    const zRange = bounds.maxZ - bounds.minZ;
    const items: Group[] = [];
    for (let i = 0; i < CLOUD_COUNT; i++) {
      const c = createLowPolyCloud(1000 + i * 7919);
      const x = Math.random() * 80 - 40;
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
    const w = getWeatherEntry(weatherType);
    const bounds = getBackgroundZBounds(String(locationId));
    const group = rootRef.current;
    if (!group) return;

    if (bounds.disabled) {
      group.visible = false;
      return;
    }
    group.visible = true;

    const { cur, nxt, lerpT } = computeDayNightPhase(Date.now() - DAY_NIGHT_EPOCH_MS);
    const baseLight = scratchColor.current.lerpColors(
      new Color(cur.lightColor),
      new Color(nxt.lightColor),
      lerpT,
    );
    const cCol = baseLight.clone().lerp(new Color(0xffffff), 0.7);
    if (w.storm || w.rain) cCol.multiplyScalar(0.4);

    const speed = w.storm ? 0.08 : 0.02;

    for (const c of clouds) {
      const ud = c.userData as CloudUserData;
      c.position.x += speed * ud.driftSign;
      if (c.position.x > 50) c.position.x = -50;
      if (c.position.x < -50) c.position.x = 50;
      if (c.position.z > bounds.maxZ) c.position.z = bounds.maxZ;
      if (c.position.z < bounds.minZ) c.position.z = bounds.minZ;

      c.traverse((ch) => {
        const m = ch as Mesh;
        if (m.isMesh && m.material && 'color' in m.material) {
          const mat = m.material as MeshStandardMaterial;
          mat.color.lerp(cCol, 0.05);
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
