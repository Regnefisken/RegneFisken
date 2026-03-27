import { useMemo, useRef } from 'react';
import { BufferAttribute, BufferGeometry, Points } from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/useGameStore.js';
import { getWeatherEntry } from '../logic/environment.js';

/* Partikel-positioner er en muterbar Float32Array buffer (samme som legacy). */
/* eslint-disable react-hooks/immutability -- pos[] opdateres i animation loop */

const COUNT = 2000;

function hash01(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** Regn / storm-partikler — porteret fra legacy `createRainSystem` + `tickScene`. */
export function WeatherParticles() {
  const ref = useRef<Points>(null);
  const weatherType = useGameStore((s) => s.weatherType);

  const geometry = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (hash01(i * 3) - 0.5) * 60;
      pos[i * 3 + 1] = hash01(i * 3 + 1) * 40;
      pos[i * 3 + 2] = (hash01(i * 3 + 2) - 0.5) * 60;
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(pos, 3));
    geo.userData.rainPos = pos;
    return geo;
  }, []);

  useFrame(() => {
    const w = getWeatherEntry(weatherType);
    const pts = ref.current;
    const pos = geometry.userData.rainPos as Float32Array | undefined;
    if (!pts || !pos) return;
    pts.visible = w.rain;
    if (!w.rain) return;

    const fall = w.storm ? 0.8 : 0.4;
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3 + 1] -= fall;
      if (pos[i * 3 + 1] < -2) pos[i * 3 + 1] = 30;
      if (w.storm) {
        pos[i * 3] += 0.1;
        if (pos[i * 3] > 30) pos[i * 3] = -30;
      }
    }
    const attr = pts.geometry.getAttribute('position') as BufferAttribute;
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geometry} visible={false} frustumCulled={false}>
      <pointsMaterial color={0xaaaaaa} size={0.15} transparent opacity={0.55} depthWrite={false} />
    </points>
  );
}
