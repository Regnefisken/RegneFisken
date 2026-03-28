import type { RefObject } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import {
  CylinderGeometry,
  Group,
  LatheGeometry,
  Object3D,
  Vector2,
  Vector3,
} from 'three';
import { useFrame } from '@react-three/fiber';
import { useAudio } from '../../audio/useAudio.js';
import { useGameStore } from '../../store/useGameStore.js';
import { queueWaterSplash } from '../effects/waterSplashFx.js';
import { getWeatherEntry } from '../logic/environment.js';

const S = 0.055;
const BASE_ROT_Z = -Math.PI / 5;
const CAST_MS = 650;

/** Samme Bézier som legacy `animateCast` (fast punkter, ikke dynamisk fra stangspids). */
const LEGACY_P_START = new Vector3(0, 4, 6);
const LEGACY_P_CONTROL = new Vector3(0, 6, 1.5);
const LEGACY_P_END = new Vector3(0, 0, -2.8);

const pStart = new Vector3();
const pControl = new Vector3();
const pEnd = new Vector3();

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
export function Bobber({ lineAttachmentRef }: { lineAttachmentRef: RefObject<Object3D | null> }) {
  const { play } = useAudio();
  const groupRef = useRef<Group>(null);
  const gameState = useGameStore((s) => s.gameState);
  const weatherType = useGameStore((s) => s.weatherType);
  const castStartMsRef = useRef(0);
  const wasCastingRef = useRef(false);
  const castSplashPlayedRef = useRef(false);
  const biteMsAccRef = useRef(0);

  useEffect(() => {
    if (gameState !== 'biting') {
      biteMsAccRef.current = 0;
    }
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'biting') return;
    const g = groupRef.current;
    if (!g) return;
    g.position.set((Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.5, -2.8);
  }, [gameState]);

  const stickGeo = useMemo(
    () => new CylinderGeometry(0.11 * S, 0.11 * S, 4.0 * S, 14),
    [],
  );
  const redGeo = useMemo(() => makeRedLathe(), []);
  const whiteGeo = useMemo(() => makeWhiteLathe(), []);

  useFrame(({ clock }, delta) => {
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
      if (!wasCastingRef.current) {
        castStartMsRef.current = performance.now();
        wasCastingRef.current = true;
        castSplashPlayedRef.current = false;
      }
      pStart.copy(LEGACY_P_START);
      pControl.copy(LEGACY_P_CONTROL);
      pEnd.copy(LEGACY_P_END);
      const elapsed = performance.now() - castStartMsRef.current;
      const progress = Math.min(1, elapsed / CAST_MS);
      const u = 1 - progress;
      const tt = progress * progress;
      const uu = u * u;
      const x = uu * pStart.x + 2 * u * progress * pControl.x + tt * pEnd.x;
      const y = uu * pStart.y + 2 * u * progress * pControl.y + tt * pEnd.y;
      const z = uu * pStart.z + 2 * u * progress * pControl.z + tt * pEnd.z;
      g.position.set(x, y, z);
      /* Legacy roterer ikke proppen under kast — kun statisk z fra buildBobber */
      g.rotation.set(0, 0, BASE_ROT_Z);
      if (progress >= 0.8 && !castSplashPlayedRef.current) {
        castSplashPlayedRef.current = true;
        play('splash');
      }
    } else {
      wasCastingRef.current = false;
    }

    if (gameState === 'waiting') {
      g.position.set(
        0,
        Math.sin(t * 1.8 * (wData.storm ? 2.2 : 1.0)) * 0.13 * Math.max(0.2, wData.waveAmp ?? 0.2) * 5 +
          Math.sin(t * 3.1 * (wData.storm ? 2.2 : 1.0) + 1.3) *
            0.055 *
            Math.max(0.2, wData.waveAmp ?? 0.2) *
            5,
        -2.8,
      );
      const wAmp = Math.max(0.2, wData.waveAmp ?? 0.2);
      const wSpeed = wData.storm ? 2.2 : 1.0;
      g.rotation.set(
        Math.sin(t * 1.1 * wSpeed + 0.5) * 0.04 * wAmp * 4,
        0,
        BASE_ROT_Z +
          Math.cos(t * 1.4 * wSpeed) * 0.09 * wAmp * 4 +
          Math.cos(t * 2.6 * wSpeed + 0.8) * 0.035 * wAmp * 4,
      );
    } else if (gameState === 'biting') {
      biteMsAccRef.current += delta * 1000;
      if (biteMsAccRef.current >= 50) {
        biteMsAccRef.current = 0;
        g.position.set((Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.5, -2.8);
        if (Math.random() > 0.5) {
          const wp = new Vector3();
          g.getWorldPosition(wp);
          queueWaterSplash(wp, 2);
        }
      }
    }
    /* fighting: ingen tickScene-opdatering i legacy — flåden står stille */
  });

  return (
    <group ref={groupRef}>
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
