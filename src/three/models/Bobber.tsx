import type { RefObject } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import {
  ConeGeometry,
  CylinderGeometry,
  Group,
  LatheGeometry,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
} from 'three';
import type { Mesh as ThreeMesh } from 'three';
import { useFrame } from '@react-three/fiber';
import { useAudio } from '../../audio/useAudio.js';
import { useGameStore } from '../../store/useGameStore.js';
import { usePlayerStore } from '../../store/usePlayerStore.js';
import { queueWaterSplash } from '../effects/waterSplashFx.js';
import { getWeatherEntry } from '../logic/environment.js';

const S = 0.055;
const BASE_ROT_Z = -Math.PI / 5;
const CAST_MS = 650;
const BIOLUM_SEG = 12;

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

/** Geometrier til legacy `buildSteampunkDeepSeaBobber` (én instans, deles af alle frames). */
function useSteampunkBobberGeometries() {
  const geo = useMemo(
    () => ({
      core: new SphereGeometry(0.35, BIOLUM_SEG, BIOLUM_SEG),
      body: new SphereGeometry(0.6, BIOLUM_SEG, BIOLUM_SEG),
      ring1: new TorusGeometry(0.62, 0.04, 16, BIOLUM_SEG),
      ring2: new TorusGeometry(0.62, 0.03, 16, BIOLUM_SEG),
      topGlass: new CylinderGeometry(0.15, 0.25, 0.4, BIOLUM_SEG),
      topCore: new CylinderGeometry(0.04, 0.04, 0.25, BIOLUM_SEG),
      tip: new ConeGeometry(0.18, 0.3, BIOLUM_SEG),
      gearRing: new TorusGeometry(0.25, 0.05, 16, 16),
      stem: new CylinderGeometry(0.05, 0.05, 0.4, 8),
    }),
    [],
  );
  useEffect(
    () => () => {
      Object.values(geo).forEach((g) => g.dispose());
    },
    [geo],
  );
  return geo;
}

/**
 * Klassisk flåd + Selvlysende Prop i grotten når `biolum_floats` er købt — matcher legacy
 * `shouldUseBiolum` / `buildSteampunkDeepSeaBobber` og tickScene-puls.
 */
export function Bobber({ lineAttachmentRef }: { lineAttachmentRef: RefObject<Object3D | null> }) {
  const { play } = useAudio();
  const groupRef = useRef<Group>(null);
  const gameState = useGameStore((s) => s.gameState);
  const weatherType = useGameStore((s) => s.weatherType);
  const currentLocation = useGameStore((s) => s.currentLocation);
  const upgrades = usePlayerStore((s) => s.upgrades);
  const useBiolum = currentLocation === 'cave' && upgrades.includes('biolum_floats');

  const castStartMsRef = useRef(0);
  const wasCastingRef = useRef(false);
  const castSplashPlayedRef = useRef(false);
  const biteMsAccRef = useRef(0);
  const biolumCoreRef = useRef<ThreeMesh | null>(null);
  const biolumTopCoreRef = useRef<ThreeMesh | null>(null);

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
  const steamGeo = useSteampunkBobberGeometries();

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

    const caveBiolum =
      useGameStore.getState().currentLocation === 'cave' &&
      usePlayerStore.getState().upgrades.includes('biolum_floats');
    if (caveBiolum) {
      const pulse = Math.sin(t * 2.5) * 0.5 + Math.sin(t * 5.0) * 0.25;
      const emissiveIntensity = 1.8 + pulse;
      const sc = 1.0 + Math.sin(t * 3.0) * 0.08;
      const cores = [biolumCoreRef.current, biolumTopCoreRef.current];
      for (const mesh of cores) {
        if (!mesh) continue;
        const mat = mesh.material;
        if (!(mat instanceof MeshStandardMaterial)) continue;
        mat.emissiveIntensity = emissiveIntensity;
        mat.emissive.setHex(0x00ffaa);
        mesh.scale.setScalar(sc);
      }
    }
  });

  if (useBiolum) {
    return (
      <group ref={groupRef}>
        <group scale={0.32}>
          <mesh
            ref={biolumCoreRef}
            geometry={steamGeo.core}
            castShadow
            userData={{ isBiolumCore: true }}
          >
            <meshStandardMaterial
              color={0x00ffcc}
              emissive={0x00ffaa}
              emissiveIntensity={2.5}
              roughness={0.35}
              metalness={0.15}
            />
            <pointLight color={0x00ffaa} intensity={0.35} distance={2.8} decay={2} />
          </mesh>
          <mesh geometry={steamGeo.body} castShadow receiveShadow>
            <meshStandardMaterial
              color={0x88ccff}
              transparent
              opacity={0.25}
              emissive={0x88ccff}
              emissiveIntensity={0.6}
              depthWrite={false}
              roughness={0.05}
              metalness={0}
            />
          </mesh>
          <mesh geometry={steamGeo.ring1} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <meshStandardMaterial color={0xd4af37} metalness={0.9} roughness={0.3} />
          </mesh>
          <mesh geometry={steamGeo.ring2} rotation={[Math.PI / 2, Math.PI / 2, 0]} castShadow>
            <meshStandardMaterial color={0xd4af37} metalness={0.9} roughness={0.3} />
          </mesh>
          <mesh geometry={steamGeo.topGlass} position={[0, 0.7, 0]} castShadow>
            <meshStandardMaterial
              color={0x88ccff}
              transparent
              opacity={0.25}
              emissive={0x88ccff}
              emissiveIntensity={0.6}
              depthWrite={false}
              roughness={0.05}
              metalness={0}
            />
          </mesh>
          <mesh
            ref={biolumTopCoreRef}
            geometry={steamGeo.topCore}
            position={[0, 0.7, 0]}
            castShadow
            userData={{ isBiolumCore: true }}
          >
            <meshStandardMaterial
              color={0x00ffcc}
              emissive={0x00ffaa}
              emissiveIntensity={2.5}
              roughness={0.35}
              metalness={0.15}
            />
          </mesh>
          <mesh geometry={steamGeo.tip} position={[0, 1.05, 0]} castShadow>
            <meshStandardMaterial color={0xd4af37} metalness={0.9} roughness={0.3} />
          </mesh>
          <mesh geometry={steamGeo.gearRing} position={[0, -0.9, 0]} castShadow>
            <meshStandardMaterial color={0xd4af37} metalness={0.9} roughness={0.3} />
          </mesh>
          <mesh geometry={steamGeo.stem} position={[0, -0.6, 0]} castShadow>
            <meshStandardMaterial color={0xd4af37} metalness={0.9} roughness={0.3} />
          </mesh>
          <object3D ref={lineAttachmentRef} position={[0, 1.05 + 0.15, 0]} />
        </group>
      </group>
    );
  }

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
