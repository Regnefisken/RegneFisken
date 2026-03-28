import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { GoldenFrog } from '../../three/models/GoldenFrog';
import { AxolotlCatchModel } from '../../three/models/bossCatchMiniModels';

function SpinningCompanion({ variant }: { variant: 'golden_frog' | 'axolotl' }) {
  const root = useRef<Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const g = root.current;
    if (!g) return;
    g.rotation.y += 0.01;
    g.position.set(0, 3.5 + Math.sin(t * 2) * 0.2, 4);
  });
  return (
    <group ref={root} position={[0, 3.5, 4]}>
      {variant === 'golden_frog' ? <GoldenFrog /> : <AxolotlCatchModel bucketIdle />}
    </group>
  );
}

/** 3D-model over legendarisk fanget-panel — som legacy `displayFishRef` for frø/axolotl. */
export function CatchLegendaryCompanionPreview({ variant }: { variant: 'golden_frog' | 'axolotl' }) {
  return (
    <div className="pointer-events-none relative -mt-2 mb-1 h-40 w-full md:h-48">
      <Canvas
        className="h-full w-full"
        camera={{ position: [0, 5, 14], fov: 42, near: 0.1, far: 80 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 12, 8]} intensity={1.15} />
        <Suspense fallback={null}>
          <SpinningCompanion variant={variant} />
        </Suspense>
      </Canvas>
    </div>
  );
}
