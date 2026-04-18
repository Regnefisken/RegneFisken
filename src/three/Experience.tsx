import { lazy, Suspense, useRef } from 'react';
import { Object3D } from 'three';
import { useGameStore } from '../store/useGameStore.js';
import { useEditorStore } from '../store/useEditorStore.js';
import { useAdminStore } from '../store/useAdminStore.js';
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
import { BridgeLight } from './effects/BridgeLight.js';
import { Bucket } from './models/Bucket.js';
import { FishingLine } from './models/FishingLine.js';
import { SceneFishingRod } from './models/FishingRod.js';
import { AmbientKraken } from './AmbientKraken.js';
import { SoeuhyreAmbient } from './models/SoeuhyreAmbient.js';
import { CatchModelPreloader } from './CatchModelPreloader.js';
import { FishPool } from './FishPool.js';
import { isCabinLocation } from '../logic/location-helpers.js';
import { JUNGLE_GROUP_POS, JUNGLE_ROT_Y } from './logic/jungleFishingGear.js';
import { CabinFurnitureDrag } from './cabin/CabinFurnitureDrag.js';
const EditorFishPreviewLazy = import.meta.env.DEV
  ? lazy(() =>
      import('./editor/EditorFishPreview.js').then((m) => ({ default: m.EditorFishPreview })),
    )
  : null;

const AdminFreeRoamCameraLazy = import.meta.env.DEV
  ? lazy(() =>
      import('./admin/AdminFreeRoamCamera.js').then((m) => ({ default: m.AdminFreeRoamCamera })),
    )
  : null;

const AdminClickPickLazy = import.meta.env.DEV
  ? lazy(() =>
      import('./admin/AdminClickPick.js').then((m) => ({ default: m.AdminClickPick })),
    )
  : null;

const JUNGLE_ROTATION: [number, number, number] = [0, JUNGLE_ROT_Y, 0];

/** Hovedscene: lys, vand, vejr, mole, flåd, fisk. */
export function Experience() {
  const rodTipRef = useRef<Object3D>(null);
  const lineAttachRef = useRef<Object3D>(null);
  const locationId = useGameStore((s) => s.currentLocation);
  const jungleFishing = useGameStore((s) => s.jungleFishing);
  const isCabin = isCabinLocation(locationId);
  const isWorldLocation =
    isCabinLocation(locationId) || (locationId === 'jungle_island' && !jungleFishing);
  const useJungleOffset = locationId === 'jungle_island' && jungleFishing;
  const editorOpen = import.meta.env.DEV ? useEditorStore((s) => s.isOpen) : false;
  const adminFreeRoam = useAdminStore((s) => (import.meta.env.DEV ? s.freeRoamActive : false));

  return (
    <>
      {editorOpen && EditorFishPreviewLazy ? (
        <Suspense fallback={null}>
          <EditorFishPreviewLazy />
        </Suspense>
      ) : null}

      {!editorOpen && (
        <>
          {adminFreeRoam && AdminFreeRoamCameraLazy ? (
            <Suspense fallback={null}>
              <AdminFreeRoamCameraLazy />
            </Suspense>
          ) : (
            <CameraRig />
          )}
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
          {!isWorldLocation ? (
            <>
              <CaveFillLights />
              <PierLantern />
              <BridgeLight />
              <group
                position={useJungleOffset ? JUNGLE_GROUP_POS : [0, 0, 0]}
                rotation={useJungleOffset ? JUNGLE_ROTATION : [0, 0, 0]}
              >
                <Bucket />
                <BucketCatchFish />
                <SceneFishingRod tipRef={rodTipRef} />
                <Bobber lineAttachmentRef={lineAttachRef} />
                <FishPool />
              </group>
              <FishingLine rodTipRef={rodTipRef} lineEndRef={lineAttachRef} />
            </>
          ) : null}
          {isCabin ? <CabinFurnitureDrag /> : null}
          {import.meta.env.DEV && AdminClickPickLazy ? (
            <Suspense fallback={null}>
              <AdminClickPickLazy />
            </Suspense>
          ) : null}
        </>
      )}
    </>
  );
}
