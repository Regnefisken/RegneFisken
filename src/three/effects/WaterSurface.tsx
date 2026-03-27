import { useMemo, useRef } from 'react';
import { DoubleSide, Mesh, PlaneGeometry } from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/useGameStore.js';
import { getWaterColorHex, updateWaterGeometry } from '../logic/waterWaves.js';

export function WaterSurface() {
  const meshRef = useRef<Mesh>(null);
  const locationId = useGameStore((s) => s.currentLocation);
  const weatherType = useGameStore((s) => s.weatherType);

  const geometry = useMemo(() => new PlaneGeometry(120, 120, 40, 40), []);
  const waterColor = useMemo(() => getWaterColorHex(locationId), [locationId]);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    updateWaterGeometry(mesh.geometry as PlaneGeometry, state.clock.elapsedTime, locationId, weatherType);
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
