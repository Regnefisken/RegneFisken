import type { RefObject } from 'react';
import { useMemo, useRef } from 'react';
import {
  CylinderGeometry,
  Group,
  LatheGeometry,
  Object3D,
  Vector2,
} from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/useGameStore.js';
import { getWeatherEntry } from '../logic/environment.js';

const S = 0.055;
const BASE_ROT_Z = -Math.PI / 5;

function makeRedLathe(): LatheGeometry {
  const redPoints: Vector2[] = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    redPoints.push(
      new Vector2(
        Math.sin((Math.PI / 2) * t) * 1.68 * S,
        Math.cos((Math.PI / 2) * t) * 1.45 * S - 0.1 * S,
      ),
    );
  }
  return new LatheGeometry(redPoints, 24);
}

function makeWhiteLathe(): LatheGeometry {
  const whitePoints: Vector2[] = [];
  for (let i = 0; i <= 26; i++) {
    const t = i / 26;
    const radius = (1.72 * Math.pow(1 - t, 0.67) + 0.14 * t) * S;
    const y = -4.25 * t * S;
    whitePoints.push(new Vector2(radius, y));
  }
  return new LatheGeometry(whitePoints, 24);
}

/** Klassisk flåd — porteret fra legacy `buildBobber`. */
export function Bobber({
  lineAttachmentRef,
}: {
  lineAttachmentRef: RefObject<Object3D | null>;
}) {
  const groupRef = useRef<Group>(null);
  const gameState = useGameStore((s) => s.gameState);
  const weatherType = useGameStore((s) => s.weatherType);

  const stickGeo = useMemo(
    () => new CylinderGeometry(0.11 * S, 0.11 * S, 4.0 * S, 14),
    [],
  );
  const redGeo = useMemo(() => makeRedLathe(), []);
  const whiteGeo = useMemo(() => makeWhiteLathe(), []);

  useFrame(({ clock }) => {
    const g = groupRef.current;
    if (!g) return;

    const wData = getWeatherEntry(weatherType);
    const t = clock.elapsedTime;
    const inWater =
      gameState === 'waiting' || gameState === 'biting' || gameState === 'fighting';
    const show = gameState === 'casting' || inWater;

    g.visible = show;

    if (!show) {
      g.position.set(0, -10, 0);
      g.rotation.set(0, 0, BASE_ROT_Z);
      return;
    }

    if (gameState === 'casting') {
      g.position.set(0, 2.5, 4);
      g.rotation.set(0, 0, BASE_ROT_Z);
    } else {
      g.position.set(0, 0.12, -2.8);
      const wAmp = Math.max(0.2, wData.waveAmp ?? 0.2);
      const wSpeed = wData.storm ? 2.2 : 1.0;
      g.position.y +=
        Math.sin(t * 1.8 * wSpeed) * 0.13 * wAmp * 5 +
        Math.sin(t * 3.1 * wSpeed + 1.3) * 0.055 * wAmp * 5;
      g.rotation.z =
        BASE_ROT_Z +
        Math.cos(t * 1.4 * wSpeed) * 0.09 * wAmp * 4 +
        Math.cos(t * 2.6 * wSpeed + 0.8) * 0.035 * wAmp * 4;
      g.rotation.x = Math.sin(t * 1.1 * wSpeed + 0.5) * 0.04 * wAmp * 4;
    }
  });

  return (
    <group ref={groupRef} rotation={[0, 0, BASE_ROT_Z]}>
      <mesh position={[0, 3.35 * S, 0]} geometry={stickGeo} castShadow>
        <meshStandardMaterial color={0x1a1a1a} roughness={0.6} metalness={0.12} />
      </mesh>
      <object3D ref={lineAttachmentRef} position={[0, 3.35 * S + 2.0 * S, 0]} />
      <mesh position={[0, -6.25 * S, 0]} geometry={stickGeo} castShadow>
        <meshStandardMaterial color={0x1a1a1a} roughness={0.6} metalness={0.12} />
      </mesh>
      <mesh geometry={redGeo} castShadow receiveShadow>
        <meshStandardMaterial color={0xe02828} roughness={0.45} metalness={0.05} />
      </mesh>
      <mesh geometry={whiteGeo} castShadow receiveShadow>
        <meshStandardMaterial color={0xf8f8f8} roughness={0.7} />
      </mesh>
    </group>
  );
}
