import { useRef } from 'react';
import { Vector3 } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { isCabinLocation } from '../../logic/location-helpers.js';
import { useGameStore } from '../../store/useGameStore.js';
import { pierToJungle } from '../logic/jungleFishingGear.js';

const IDLE_PIER = new Vector3(0, 4.6, 13);
const IDLE_CABIN = new Vector3(0, 3.03, 9.67);
const LOOK_CABIN = new Vector3(0, 1.6, -1);
const LOOK_PIER = new Vector3(0, 0.3, 0);
const CAST_WAIT = new Vector3(0, 3, 6);
const BITE = new Vector3(0, 2.5, 5);
const FIGHT = new Vector3(0, 4, 8);
const CATCH = new Vector3(0, 5, 10);

const JUNGLE_FISH_IDLE = pierToJungle(IDLE_PIER);
const JUNGLE_FISH_LOOK = pierToJungle(LOOK_PIER);
const JUNGLE_FISH_CAST = pierToJungle(CAST_WAIT);
const JUNGLE_FISH_BITE = pierToJungle(BITE);
const JUNGLE_FISH_FIGHT = pierToJungle(FIGHT);
const JUNGLE_FISH_CATCH = pierToJungle(CATCH);

/**
 * ~0.025 pr. "frame" @ 60 Hz — langsommere end legacy (0.05), så zoom ved kast/vent føles blød.
 * Framerate-uafhængig: samme som lerp(factor) hvert frame med factor 0.975 @ 60 Hz.
 */
const CAM_POS_LERP = 0.025;

function applyGameStateToDesiredJungle(
  gameState: string,
  desiredPos: Vector3,
  desiredLook: Vector3,
): void {
  desiredLook.copy(JUNGLE_FISH_LOOK);
  switch (gameState) {
    case 'idle':
      desiredPos.copy(JUNGLE_FISH_IDLE);
      break;
    case 'casting':
    case 'waiting':
      desiredPos.copy(JUNGLE_FISH_CAST);
      break;
    case 'biting':
      desiredPos.copy(JUNGLE_FISH_BITE);
      break;
    case 'fighting':
      desiredPos.copy(JUNGLE_FISH_FIGHT);
      break;
    case 'catch':
      desiredPos.copy(JUNGLE_FISH_CATCH);
      break;
    case 'lost':
    case 'kraken_lost':
      desiredPos.copy(JUNGLE_FISH_FIGHT);
      break;
    default:
      desiredPos.copy(JUNGLE_FISH_IDLE);
      break;
  }
}

/** Glidende kamera som legacy (`cameraTargetRef` + lerp hvert frame). */
export function CameraRig() {
  const gameState = useGameStore((s) => s.gameState);
  const locationId = useGameStore((s) => s.currentLocation);
  const jungleFishing = useGameStore((s) => s.jungleFishing);

  const { camera } = useThree();
  const lookCurrent = useRef(new Vector3().copy(LOOK_PIER));
  const desiredPos = useRef(new Vector3().copy(IDLE_PIER));
  const desiredLook = useRef(new Vector3().copy(LOOK_PIER));
  const wasJungle = useRef(false);
  const wasJungleFishing = useRef(false);
  const prevLocation = useRef(locationId);

  useFrame((_, delta) => {
    if (locationId === 'jungle_island' && !jungleFishing) {
      wasJungle.current = true;
      prevLocation.current = locationId;
      wasJungleFishing.current = false;
      return;
    }

    if (wasJungle.current && locationId !== 'jungle_island') {
      camera.rotation.order = 'XYZ';
      camera.position.copy(IDLE_PIER);
      camera.lookAt(LOOK_PIER);
      lookCurrent.current.copy(LOOK_PIER);
      desiredPos.current.copy(IDLE_PIER);
      desiredLook.current.copy(LOOK_PIER);
      wasJungle.current = false;
      wasJungleFishing.current = false;
      prevLocation.current = locationId;
      return;
    }

    if (locationId === 'jungle_island' && jungleFishing) {
      if (!wasJungleFishing.current) {
        camera.rotation.order = 'XYZ';
        camera.position.copy(JUNGLE_FISH_IDLE);
        camera.lookAt(JUNGLE_FISH_LOOK);
        lookCurrent.current.copy(JUNGLE_FISH_LOOK);
        desiredPos.current.copy(JUNGLE_FISH_IDLE);
        desiredLook.current.copy(JUNGLE_FISH_LOOK);
        wasJungleFishing.current = true;
      }

      applyGameStateToDesiredJungle(gameState, desiredPos.current, desiredLook.current);

      const k = 1 - Math.pow(1 - CAM_POS_LERP, delta * 60);
      camera.position.lerp(desiredPos.current, k);
      lookCurrent.current.lerp(desiredLook.current, k);
      camera.lookAt(lookCurrent.current);
      prevLocation.current = locationId;
      return;
    }

    wasJungleFishing.current = false;

    if (
      isCabinLocation(locationId) &&
      !isCabinLocation(prevLocation.current)
    ) {
      camera.position.copy(IDLE_CABIN);
      camera.lookAt(LOOK_CABIN);
      lookCurrent.current.copy(LOOK_CABIN);
      desiredPos.current.copy(IDLE_CABIN);
      desiredLook.current.copy(LOOK_CABIN);
      prevLocation.current = locationId;
      return;
    }
    prevLocation.current = locationId;

    const cabin = isCabinLocation(locationId);
    const lookBase = cabin ? LOOK_CABIN : LOOK_PIER;

    switch (gameState) {
      case 'idle':
        desiredPos.current.copy(cabin ? IDLE_CABIN : IDLE_PIER);
        break;
      case 'casting':
      case 'waiting':
        desiredPos.current.copy(CAST_WAIT);
        break;
      case 'biting':
        desiredPos.current.copy(BITE);
        break;
      case 'fighting':
        desiredPos.current.copy(FIGHT);
        break;
      case 'catch':
        desiredPos.current.copy(CATCH);
        break;
      case 'lost':
      case 'kraken_lost':
        desiredPos.current.copy(FIGHT);
        break;
      default:
        desiredPos.current.copy(cabin ? IDLE_CABIN : IDLE_PIER);
        break;
    }
    desiredLook.current.copy(lookBase);

    const k = 1 - Math.pow(1 - CAM_POS_LERP, delta * 60);
    camera.position.lerp(desiredPos.current, k);
    lookCurrent.current.lerp(desiredLook.current, k);
    camera.lookAt(lookCurrent.current);
  });

  return null;
}
