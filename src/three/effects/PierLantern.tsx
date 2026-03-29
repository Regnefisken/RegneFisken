import { useRef } from 'react';
import { MathUtils, PointLight } from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/useGameStore.js';
import { computeLanternTargetIntensity } from './lanternNightFill.js';
import { DAY_NIGHT_EPOCH_MS } from '../logic/dayNightClock.js';

/** Over spandens åbning — `Bucket` er [1.1, 0.72, 8.8]; hovedlanternen er mere mod stang/bro og rammer cylinder/krog dårligt. */
const BUCKET_LANTERN_POS: [number, number, number] = [1.1, 2.05, 8.8];

/** Varmt fill-lys over mole/fiskeområdet om aften og nat — kompenserer for lav global belysning i dårligt vejr. */
export function PierLantern() {
  const moleRef = useRef<PointLight>(null);
  const bucketRef = useRef<PointLight>(null);

  useFrame((_, delta) => {
    const mole = moleRef.current;
    const bucket = bucketRef.current;
    if (!mole || !bucket) return;

    const { currentLocation: locationId, weatherType } = useGameStore.getState();
    const k = 1 - Math.exp(-delta * 3);

    if (locationId === 'cave') {
      mole.intensity = MathUtils.lerp(mole.intensity, 0, k);
      bucket.intensity = MathUtils.lerp(bucket.intensity, 0, k);
      return;
    }

    const targetIntensity = computeLanternTargetIntensity(Date.now() - DAY_NIGHT_EPOCH_MS, weatherType);

    mole.intensity = MathUtils.lerp(mole.intensity, targetIntensity, k);
    const bucketTarget = targetIntensity * 0.85;
    bucket.intensity = MathUtils.lerp(bucket.intensity, bucketTarget, k);
  });

  return (
    <>
      <pointLight
        ref={moleRef}
        color={0xffeedd}
        position={[1.8, 3.2, 8.5]}
        distance={28}
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
    </>
  );
}
