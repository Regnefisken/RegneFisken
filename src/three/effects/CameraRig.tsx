import { useRef } from 'react';
import { Vector3 } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore } from '../../store/useGameStore.js';

const IDLE_PIER = new Vector3(0, 4.6, 13);
/** `jungle_island`: CameraRig kører ikke — statisk kamera i `JungleIsland`. */
const IDLE_CABIN = new Vector3(0, 3.03, 9.67);
const LOOK_CABIN = new Vector3(0, 1.6, -1);
const LOOK_PIER = new Vector3(0, 0.3, 0);
const CAST_WAIT = new Vector3(0, 3, 6);
const BITE = new Vector3(0, 2.5, 5);
const FIGHT = new Vector3(0, 4, 8);
const CATCH = new Vector3(0, 5, 10);

/**
 * ~0.025 pr. "frame" @ 60 Hz — langsommere end legacy (0.05), så zoom ved kast/vent føles blød.
 * Framerate-uafhængig: samme som lerp(factor) hvert frame med factor 0.975 @ 60 Hz.
 */
const CAM_POS_LERP = 0.025;

/** Glidende kamera som legacy (`cameraTargetRef` + lerp hvert frame). */
export function CameraRig() {
  const gameState = useGameStore((s) => s.gameState);
  const locationId = useGameStore((s) => s.currentLocation);

  const { camera } = useThree();
  const lookCurrent = useRef(new Vector3().copy(LOOK_PIER));
  const desiredPos = useRef(new Vector3().copy(IDLE_PIER));
  const desiredLook = useRef(new Vector3().copy(LOOK_PIER));
  const wasJungle = useRef(false);
  const prevLocation = useRef(locationId);

  useFrame((_, delta) => {
    if (locationId === 'jungle_island') {
      wasJungle.current = true;
      prevLocation.current = locationId;
      return;
    }

    if (wasJungle.current) {
      camera.rotation.order = 'XYZ';
      camera.position.copy(IDLE_PIER);
      camera.lookAt(LOOK_PIER);
      lookCurrent.current.copy(LOOK_PIER);
      desiredPos.current.copy(IDLE_PIER);
      desiredLook.current.copy(LOOK_PIER);
      wasJungle.current = false;
      prevLocation.current = locationId;
      return;
    }

    if (locationId === 'fishing_cabin' && prevLocation.current !== 'fishing_cabin') {
      camera.position.copy(IDLE_CABIN);
      camera.lookAt(LOOK_CABIN);
      lookCurrent.current.copy(LOOK_CABIN);
      desiredPos.current.copy(IDLE_CABIN);
      desiredLook.current.copy(LOOK_CABIN);
      prevLocation.current = locationId;
      return;
    }
    prevLocation.current = locationId;

    const cabin = locationId === 'fishing_cabin';
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
