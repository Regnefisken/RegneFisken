import type { RefObject } from 'react';
import { useRef } from 'react';
import { Object3D } from 'three';
import { useGameStore } from '../store/useGameStore.js';
import { usePlayerStore } from '../store/usePlayerStore.js';
import { SceneEnvironment } from './effects/SceneEnvironment.js';
import { AmbientLife } from './effects/AmbientLife.js';
import { GameEffects } from './effects/GameEffects.js';
import { WaterSurface } from './effects/WaterSurface.js';
import { WeatherParticles } from './effects/WeatherParticles.js';
import { LocationScenery } from './environments/LocationScenery.js';
import { Bobber } from './models/Bobber.js';
import { FishingLine } from './models/FishingLine.js';
import { GiantLandTurtle } from './models/GiantLandTurtle.js';
import { FishPool } from './FishPool.js';

function SimpleRodTip({ tipRef }: { tipRef: RefObject<Object3D | null> }) {
  return (
    <group position={[2.5, 1.5, 8.5]} rotation={[0, 0, -0.18]}>
      <group rotation={[0, 0, -Math.PI / 2]}>
        <mesh position={[-2.8, 0, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.09, 5.2, 10]} />
          <meshStandardMaterial color={0x8b6540} roughness={0.75} />
        </mesh>
        <object3D ref={tipRef} position={[-5.05, 0, 0]} />
      </group>
    </group>
  );
}

function CabinTurtle() {
  const locationId = useGameStore((s) => s.currentLocation);
  const questItems = usePlayerStore((s) => s.questItems);
  if (locationId !== 'fishing_cabin' || !questItems.includes('turtle_hatched')) return null;

  return (
    <group position={[-1.92, 0.19, -1.48]} rotation={[0, -Math.PI * 0.15, 0]} scale={0.357}>
      <GiantLandTurtle />
    </group>
  );
}

/** Hovedscene: lys, vand, vejr, mole, flåd, fisk. */
export function Experience() {
  const rodTipRef = useRef<Object3D>(null);
  const lineAttachRef = useRef<Object3D>(null);

  return (
    <>
      <SceneEnvironment />
      <GameEffects />
      <WaterSurface />
      <WeatherParticles />
      <AmbientLife />
      <LocationScenery />
      <SimpleRodTip tipRef={rodTipRef} />
      <Bobber lineAttachmentRef={lineAttachRef} />
      <FishingLine rodTipRef={rodTipRef} lineEndRef={lineAttachRef} />
      <FishPool />
      <CabinTurtle />
    </>
  );
}
