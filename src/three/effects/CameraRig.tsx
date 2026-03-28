import { useRef } from 'react';
import { Vector3 } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore } from '../../store/useGameStore.js';

const IDLE_PIER = new Vector3(0, 5.5, 13.5);
const IDLE_CABIN = new Vector3(0, 2.8, 9.5);
const LOOK_CABIN = new Vector3(0, 1.6, -1);
const LOOK_PIER = new Vector3(0, 0, 0);
const CAST_WAIT = new Vector3(0, 3, 6);
const BITE = new Vector3(0, 2.5, 5);
const FIGHT = new Vector3(0, 4, 8);
const CATCH = new Vector3(0, 5, 10);

/** Glidende kamera som legacy (`cameraTargetRef` + lerp hvert frame). */
export function CameraRig() {
  const gameState = useGameStore((s) => s.gameState);
  const locationId = useGameStore((s) => s.currentLocation);

  const { camera } = useThree();
  const lookCurrent = useRef(new Vector3().copy(LOOK_PIER));
  const desiredPos = useRef(new Vector3().copy(IDLE_PIER));
  const desiredLook = useRef(new Vector3().copy(LOOK_PIER));

  useFrame((_, delta) => {
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

    const k = 1 - Math.exp(-delta * 10);
    camera.position.lerp(desiredPos.current, k);
    lookCurrent.current.lerp(desiredLook.current, k);
    camera.lookAt(lookCurrent.current);
  });

  return null;
}
