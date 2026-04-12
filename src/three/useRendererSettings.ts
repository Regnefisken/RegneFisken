import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Mesh, PCFShadowMap } from 'three';
import type { MeshStandardMaterial } from 'three';
import type { GraphicsQuality } from '../types/game.js';
import { tickDynamicQuality } from '../logic/dynamic-quality.js';
import { fpsMon } from '../logic/fps-monitor.js';
import { useGameStore } from '../store/useGameStore';
import { useUIStore } from '../store/useUIStore';

function effectivePmremExposure(pmrem: number, locationId: string): number {
  if (locationId === 'cave') return 0.95;
  return pmrem;
}

function applyCanvasPixelRatio(gl: { setPixelRatio: (v: number) => void }, quality: GraphicsQuality): void {
  const qualityDpr =
    quality === 'low'
      ? 0.75
      : quality === 'medium'
        ? 1.0
        : Math.min(window.devicePixelRatio, quality === 'ultra' ? 2.5 : 2.0);
  gl.setPixelRatio(Math.min(qualityDpr, window.devicePixelRatio));
}

/** Inde i `<Canvas>`: DPR, skygger, tone mapping og fish-mesh `envMapIntensity`. */
export function useRendererSettings() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const graphicsQuality = useUIStore((s) => s.graphicsQuality);
  const prevExposure = useRef(-1);
  const prevLocationId = useRef<string | null>(null);

  useEffect(() => {
    gl.shadowMap.enabled = graphicsQuality !== 'low';
    if (graphicsQuality !== 'low') {
      gl.shadowMap.type = PCFShadowMap;
    }
  }, [graphicsQuality, gl]);

  useEffect(() => {
    function updateDpr() {
      applyCanvasPixelRatio(gl, useUIStore.getState().graphicsQuality);
    }
    updateDpr();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(updateDpr, 300);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      if (timeout) clearTimeout(timeout);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [graphicsQuality, gl]);

  useFrame((state, delta) => {
    fpsMon.sample(delta * 1000);
    tickDynamicQuality(state.clock.elapsedTime);

    const pmrem = useUIStore.getState().pmremExposure;
    const locationId = useGameStore.getState().currentLocation;
    const exposure = effectivePmremExposure(pmrem, locationId);

    gl.toneMappingExposure = exposure;

    if (exposure === prevExposure.current && locationId === prevLocationId.current) return;
    prevExposure.current = exposure;
    prevLocationId.current = locationId;

    scene.traverse((obj) => {
      if (!(obj instanceof Mesh)) return;
      const mat = obj.material;
      const list = Array.isArray(mat) ? mat : [mat];
      for (const m of list) {
        if (m && typeof m === 'object' && 'envMapIntensity' in m) {
          const std = m as MeshStandardMaterial;
          if (typeof std.envMapIntensity === 'number') {
            const o = (std.userData as { envMapIntensityOverride?: number }).envMapIntensityOverride;
            std.envMapIntensity = o !== undefined ? o : exposure;
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
