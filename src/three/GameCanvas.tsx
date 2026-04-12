import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { ACESFilmicToneMapping, PCFShadowMap } from 'three';
import { useGameStore } from '../store/useGameStore.js';
import { useUIStore } from '../store/useUIStore.js';
import { Experience } from './Experience.js';
import { UltraPostProcessing } from './effects/UltraPostProcessing.js';
import { RendererSettings } from './useRendererSettings.js';
import { WebGlContextLostHandler } from './WebGlContextLostHandler.js';

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
        /* Low: shadow map helt fra — sparer fillrate; castShadow er allerede false på solen. */
        shadows={quality === 'low' ? false : { type: PCFShadowMap }}
        dpr={quality === 'ultra' ? [1, 2] : quality === 'high' ? [1, 1.5] : [1, 1]}
        camera={{ position: [0, 4.6, 13], fov: 50, near: 0.1, far: 220 }}
        gl={{
          antialias: true,
          toneMapping: ACESFilmicToneMapping,
        }}
        onCreated={({ gl }) => {
          if (quality !== 'low') {
            gl.shadowMap.type = PCFShadowMap;
          }
          setSceneReady(true);
        }}
      >
        <RendererSettings />
        <WebGlContextLostHandler />
        <Suspense fallback={null}>
          <Experience />
        </Suspense>
        <UltraPostProcessing />
      </Canvas>
    </div>
  );
}
