import { useRef } from 'react';
import { MathUtils, PointLight } from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/useGameStore.js';

const BRIDGE_LIGHT_POS: [number, number, number] = [-0.33, 8.55, 12.69];
const TARGET_INTENSITY = 12;

const EXCLUDED_LOCATIONS = new Set(['cave', 'jungle_island']);

/** Konstant fill-lys over broen — altid tændt undtagen i grotten og på jungleøen. */
export function BridgeLight() {
  const ref = useRef<PointLight>(null);

  useFrame((_, delta) => {
    const light = ref.current;
    if (!light) return;

    const { currentLocation } = useGameStore.getState();
    const target = EXCLUDED_LOCATIONS.has(currentLocation) ? 0 : TARGET_INTENSITY;
    const k = 1 - Math.exp(-delta * 4);
    light.intensity = MathUtils.lerp(light.intensity, target, k);
  });

  return (
    <pointLight
      ref={ref}
      color={0xffffff}
      position={BRIDGE_LIGHT_POS}
      distance={50}
      decay={1}
      intensity={0}
      castShadow={false}
    />
  );
}
