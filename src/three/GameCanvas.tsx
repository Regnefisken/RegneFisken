import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { ACESFilmicToneMapping, PCFSoftShadowMap } from 'three';
import { useGameStore } from '../store/useGameStore.js';
import { Experience } from './Experience.js';

/** Fylder `game-root`; initialiserer WebGL med legacy-lignende indstillinger. */
export function GameCanvas() {
  const setSceneReady = useGameStore((s) => s.setSceneReady);

  useEffect(() => {
    return () => setSceneReady(false);
  }, [setSceneReady]);

  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      <Canvas
        shadows
        camera={{ position: [0, 5, 12], fov: 60, near: 0.1, far: 100 }}
        gl={{
          antialias: true,
          toneMapping: ACESFilmicToneMapping,
          toneMappingExposure: 0.65,
        }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = PCFSoftShadowMap;
          setSceneReady(true);
        }}
      >
        <Suspense fallback={null}>
          <Experience />
        </Suspense>
      </Canvas>
    </div>
  );
}
