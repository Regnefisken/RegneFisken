import { useRef } from 'react';
import { Object3D } from 'three';
import { useGameStore } from '../store/useGameStore.js';
import { CameraRig } from './effects/CameraRig.js';
import { SceneEnvironment } from './effects/SceneEnvironment.js';
import { SkyClouds } from './effects/SkyClouds.js';
import { NightSky } from './effects/NightSky.js';
import { AmbientLife } from './effects/AmbientLife.js';
import { GameEffects } from './effects/GameEffects.js';
import { WaterSplashParticles } from './effects/WaterSplashParticles.js';
import { WaterSurface } from './effects/WaterSurface.js';
import { WeatherParticles } from './effects/WeatherParticles.js';
import { LocationScenery } from './environments/LocationScenery.js';
import { PierMoleInteractives } from './environments/PierMoleInteractives.js';
import { Bobber } from './models/Bobber.js';
import { BucketCatchFish } from './BucketCatchFish.js';
import { CaveFillLights } from './effects/CaveFillLights.js';
import { PierLantern } from './effects/PierLantern.js';
import { Bucket } from './models/Bucket.js';
import { FishingLine } from './models/FishingLine.js';
import { SceneFishingRod } from './models/FishingRod.js';
import { AmbientKraken } from './AmbientKraken.js';
import { SoeuhyreAmbient } from './models/SoeuhyreAmbient.js';
import { CatchModelPreloader } from './CatchModelPreloader.js';
import { FishPool } from './FishPool.js';
import { CabinFurnitureDrag } from './cabin/CabinFurnitureDrag.js';

/** Hovedscene: lys, vand, vejr, mole, flåd, fisk. */
export function Experience() {
  const rodTipRef = useRef<Object3D>(null);
  const lineAttachRef = useRef<Object3D>(null);
  const locationId = useGameStore((s) => s.currentLocation);
  const isCabin = locationId === 'fishing_cabin';

  return (
    <>
      <CameraRig />
      <SceneEnvironment />
      <SkyClouds />
      <GameEffects />
      <WaterSplashParticles />
      <WaterSurface />
      <NightSky />
      <WeatherParticles />
      <AmbientLife />
      <AmbientKraken />
      <SoeuhyreAmbient />
      <CatchModelPreloader />
      <LocationScenery />
      <PierMoleInteractives />
      {!isCabin ? (
        <>
          <CaveFillLights />
          <PierLantern />
          <Bucket />
          <BucketCatchFish />
          <SceneFishingRod tipRef={rodTipRef} />
          <Bobber lineAttachmentRef={lineAttachRef} />
          <FishingLine rodTipRef={rodTipRef} lineEndRef={lineAttachRef} />
        </>
      ) : null}
      <FishPool />
      {isCabin ? <CabinFurnitureDrag /> : null}
    </>
  );
}
