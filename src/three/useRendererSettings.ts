import { useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Mesh } from 'three';
import type { MeshStandardMaterial } from 'three';
import { useGameStore } from '../store/useGameStore';
import { useUIStore } from '../store/useUIStore';

function effectivePmremExposure(pmrem: number, locationId: string): number {
  if (locationId === 'cave') return 0.95;
  return pmrem;
}

/** Inde i `<Canvas>`: DPR, skygger, tone mapping og fish-mesh `envMapIntensity`. */
export function useRendererSettings() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const graphicsQuality = useUIStore((s) => s.graphicsQuality);

  useEffect(() => {
    const qualityDpr =
      graphicsQuality === 'low'
        ? 0.75
        : graphicsQuality === 'medium'
          ? 1.0
          : Math.min(window.devicePixelRatio, graphicsQuality === 'ultra' ? 2.5 : 2.0);
    gl.setPixelRatio(Math.min(qualityDpr, window.devicePixelRatio));
    gl.shadowMap.enabled = graphicsQuality !== 'low';
  }, [graphicsQuality, gl]);

  useFrame(() => {
    const pmrem = useUIStore.getState().pmremExposure;
    const locationId = useGameStore.getState().currentLocation;
    const exposure = effectivePmremExposure(pmrem, locationId);
    gl.toneMappingExposure = exposure;

    scene.traverse((obj) => {
      if (!(obj instanceof Mesh)) return;
      const mat = obj.material;
      const list = Array.isArray(mat) ? mat : [mat];
      for (const m of list) {
        if (m && typeof m === 'object' && 'envMapIntensity' in m) {
          const std = m as MeshStandardMaterial;
          if (typeof std.envMapIntensity === 'number') {
            std.envMapIntensity = exposure;
          }
        }
      }
    });
  });
}

export function RendererSettings() {
  useRendererSettings();
  return null;
}
