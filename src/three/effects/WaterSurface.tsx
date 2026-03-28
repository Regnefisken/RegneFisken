import { useEffect, useMemo, useRef } from 'react';
import { Color, DoubleSide, MathUtils, Mesh, MeshStandardMaterial, PlaneGeometry } from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/useGameStore.js';
import { DAY_NIGHT_EPOCH_MS } from '../logic/dayNightClock.js';
import { computeDayNightPhase } from '../logic/environment.js';
import { getWaterColorHex, updateWaterGeometry } from '../logic/waterWaves.js';

/** Mørkere vand om aften/nat på mole — som legacy-reference (teal → dyb blågrøn). */
function pierWaterBrightness(phaseIdx: number, lerpT: number, nxtName: string): number {
  if (phaseIdx === 3) return 0.5;
  if (phaseIdx === 2) {
    return nxtName === 'Nat' ? MathUtils.lerp(0.8, 0.5, lerpT) : 0.8;
  }
  if (phaseIdx === 1) {
    return nxtName === 'Aften' ? MathUtils.lerp(1, 0.8, lerpT) : 1;
  }
  if (phaseIdx === 0 && nxtName === 'Dag') {
    return MathUtils.lerp(0.94, 1, lerpT);
  }
  return 1;
}

export function WaterSurface() {
  const meshRef = useRef<Mesh>(null);
  const colorScratch = useRef(new Color());
  const locationId = useGameStore((s) => s.currentLocation);
  const weatherType = useGameStore((s) => s.weatherType);

  const geometry = useMemo(() => new PlaneGeometry(120, 120, 40, 40), []);
  const waterColor = useMemo(() => getWaterColorHex(locationId), [locationId]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (mesh) mesh.visible = locationId !== 'fishing_cabin';
  }, [locationId]);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    if (locationId === 'fishing_cabin') return;
    updateWaterGeometry(mesh.geometry as PlaneGeometry, state.clock.elapsedTime, locationId, weatherType);

    const mat = mesh.material as MeshStandardMaterial;
    colorScratch.current.setHex(waterColor);
    if (locationId === 'pier') {
      const { phaseIdx, lerpT, nxt } = computeDayNightPhase(Date.now() - DAY_NIGHT_EPOCH_MS);
      const b = pierWaterBrightness(phaseIdx, lerpT, nxt.name);
      colorScratch.current.multiplyScalar(b);
    }
    mat.color.copy(colorScratch.current);
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      geometry={geometry}
    >
      <meshStandardMaterial
        color={waterColor}
        roughness={0.42}
        metalness={0.02}
        flatShading
        side={DoubleSide}
      />
    </mesh>
  );
}
