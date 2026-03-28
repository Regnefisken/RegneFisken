import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { ACESFilmicToneMapping, PCFShadowMap } from 'three';
import { useGameStore } from '../store/useGameStore.js';
import { useUIStore } from '../store/useUIStore.js';
import { Experience } from './Experience.js';
import { RendererSettings } from './useRendererSettings.js';

/** Fylder `game-root`; initialiserer WebGL med legacy-lignende indstillinger. */
export function GameCanvas() {
  const setSceneReady = useGameStore((s) => s.setSceneReady);
  const quality = useUIStore((s) => s.graphicsQuality);

  useEffect(() => {
    return () => setSceneReady(false);
  }, [setSceneReady]);

  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      <Canvas
        className="pointer-events-auto h-full w-full touch-none"
        shadows={quality !== 'low' ? { type: PCFShadowMap } : false}
        dpr={quality === 'ultra' ? [1, 2] : quality === 'high' ? [1, 1.5] : [1, 1]}
        camera={{ position: [0, 5, 12], fov: 50, near: 0.1, far: 220 }}
        gl={{
          antialias: true,
          toneMapping: ACESFilmicToneMapping,
        }}
        onCreated={({ gl }) => {
          const q = useUIStore.getState().graphicsQuality;
          gl.shadowMap.enabled = q !== 'low';
          gl.shadowMap.type = PCFShadowMap;
          setSceneReady(true);
        }}
      >
        <RendererSettings />
        <Suspense fallback={null}>
          <Experience />
        </Suspense>
      </Canvas>
    </div>
  );
}
