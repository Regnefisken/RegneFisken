import { useLayoutEffect, useRef } from 'react';
import { MathUtils, PointLight } from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/useGameStore.js';
import { CAVE_ROCK_RECEIVE_LAYER } from '../environments/cave-constants.js';
import { DAY_NIGHT_EPOCH_MS } from '../logic/dayNightClock.js';
import { computeCaveFillTargetIntensity } from './lanternNightFill.js';

const BUCKET_LANTERN_POS: [number, number, number] = [1.1, 2.05, 8.8];

/**
 * Lokal belysning i grotte: bro/spand (standard lag) + klipper (CAVE_ROCK_RECEIVE_LAYER).
 * Klippe-lys rammer ikke vandfladen — undgår spejlpletter fra punktlys.
 */
export function CaveFillLights() {
  const pierRef = useRef<PointLight>(null);
  const bucketRef = useRef<PointLight>(null);
  const backRef = useRef<PointLight>(null);
  const sideLRef = useRef<PointLight>(null);
  const sideRRef = useRef<PointLight>(null);
  const rockLRef = useRef<PointLight>(null);
  const rockRRef = useRef<PointLight>(null);

  useLayoutEffect(() => {
    for (const ref of [backRef, sideLRef, sideRRef, rockLRef, rockRRef]) {
      const L = ref.current;
      if (L) L.layers.set(CAVE_ROCK_RECEIVE_LAYER);
    }
  }, []);

  useFrame((_, delta) => {
    const pier = pierRef.current;
    const bucket = bucketRef.current;
    const back = backRef.current;
    const sideL = sideLRef.current;
    const sideR = sideRRef.current;
    const rockL = rockLRef.current;
    const rockR = rockRRef.current;
    if (!pier || !bucket || !back || !sideL || !sideR || !rockL || !rockR) return;

    const { currentLocation: locationId, weatherType, headlampOn } = useGameStore.getState();
    const k = 1 - Math.exp(-delta * 3);

    if (locationId !== 'cave') {
      const z = 0;
      pier.intensity = MathUtils.lerp(pier.intensity, z, k);
      bucket.intensity = MathUtils.lerp(bucket.intensity, z, k);
      back.intensity = MathUtils.lerp(back.intensity, z, k);
      sideL.intensity = MathUtils.lerp(sideL.intensity, z, k);
      sideR.intensity = MathUtils.lerp(sideR.intensity, z, k);
      rockL.intensity = MathUtils.lerp(rockL.intensity, z, k);
      rockR.intensity = MathUtils.lerp(rockR.intensity, z, k);
      return;
    }

    const timeMs = Date.now() - DAY_NIGHT_EPOCH_MS;
    const base = computeCaveFillTargetIntensity(timeMs, weatherType);
    const headlampDim = headlampOn ? 0.32 : 1;
    const t = base * headlampDim;

    pier.intensity = MathUtils.lerp(pier.intensity, t * 0.95, k);
    bucket.intensity = MathUtils.lerp(bucket.intensity, t * 0.82, k);
    back.intensity = MathUtils.lerp(back.intensity, t * 1.82, k);
    sideL.intensity = MathUtils.lerp(sideL.intensity, t * 1.55, k);
    sideR.intensity = MathUtils.lerp(sideR.intensity, t * 1.55, k);
    rockL.intensity = MathUtils.lerp(rockL.intensity, t * 1.68, k);
    rockR.intensity = MathUtils.lerp(rockR.intensity, t * 1.68, k);
  });

  return (
    <>
      <pointLight
        ref={pierRef}
        color={0xffeedd}
        position={[1.8, 3.2, 8.5]}
        distance={26}
        decay={1}
        intensity={0}
        castShadow={false}
      />
      <pointLight
        ref={bucketRef}
        color={0xfff0e0}
        position={BUCKET_LANTERN_POS}
        distance={14}
        decay={1}
        intensity={0}
        castShadow={false}
      />
      {/* Bagvæg / dybde — Cave.tsx klipper z ≈ -18 … -4 */}
      <pointLight
        ref={backRef}
        color={0xa0b8c8}
        position={[0, 6, -17]}
        distance={48}
        decay={1}
        intensity={0}
        castShadow={false}
      />
      <pointLight
        ref={sideLRef}
        color={0x9eb0c0}
        position={[-17, 4.5, -8]}
        distance={44}
        decay={1}
        intensity={0}
        castShadow={false}
      />
      <pointLight
        ref={sideRRef}
        color={0x9eb0c0}
        position={[17, 4.5, -8]}
        distance={44}
        decay={1}
        intensity={0}
        castShadow={false}
      />
      <pointLight
        ref={rockLRef}
        color={0xb8c4d0}
        position={[-11, 3.2, -15]}
        distance={36}
        decay={1}
        intensity={0}
        castShadow={false}
      />
      <pointLight
        ref={rockRRef}
        color={0xb8c4d0}
        position={[11, 3.2, -15]}
        distance={36}
        decay={1}
        intensity={0}
        castShadow={false}
      />
    </>
  );
}
