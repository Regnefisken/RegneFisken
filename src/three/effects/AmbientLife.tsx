import { startTransition, useCallback, useEffect, useRef, useState } from 'react';
import type { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import { useAudio } from '../../audio/useAudio.js';
import { consumeSeagullSpawn } from '../../audio/audioEngine.js';
import { LOCATIONS } from '../../data/locations.js';
import { getWeatherEntry } from '../logic/environment.js';
import { useGameStore } from '../../store/useGameStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import { getBackgroundZBounds } from '../logic/backgroundZBounds.js';
import type { SeagullPalette } from '../models/Seagull.js';

const SEAGULL_EXIT_X = 40;
const BAT_EXIT_X = 22;
/** Grotte dybde + ruin-bro (RuinPier planker z ≈ 1–11). */
const CAVE_BAT_Z_MIN = -18;
const CAVE_BAT_Z_MAX = 11;

function seagullPalette(locationId: string, formation: 'single' | 'pair'): SeagullPalette {
  if (locationId === 'desert_lake') return { body: 0x1a1a1a, wing: 0x101010 };
  if (locationId === 'tropical_island') {
    return formation === 'single'
      ? { body: 0xcc2b2b, wing: 0x9a1f1f }
      : { body: 0x2e8b57, wing: 0x1f6b41 };
  }
  return { body: 0xf5f5f0, wing: 0xe8e8e0 };
}

type BirdConfig = {
  id: string;
  dir: number;
  vx: number;
  vz?: number;
  startY: number;
  phase: number;
  maxLife: number;
  x: number;
  y: number;
  z: number;
  zMin: number;
  zMax: number;
  formation: 'single' | 'pair';
  isJungle?: boolean;
};

function randomId() {
  return `sg-${Math.random().toString(36).slice(2, 11)}`;
}

/** Flyvende måge — flap og bane som legacy `tickScene` (seagulls). */
function FlyingSeagullMesh({
  config,
  palette,
  onExpire,
}: {
  config: BirdConfig;
  palette: SeagullPalette;
  onExpire: (id: string) => void;
}) {
  const groupRef = useRef<Group>(null);
  const wingL = useRef<Group>(null);
  const wingR = useRef<Group>(null);
  const life = useRef(0);

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    life.current++;
    const L = life.current;
    const flap = Math.sin(L * 0.18 + config.phase) * 0.35;
    if (wingL.current) wingL.current.rotation.z = flap;
    if (wingR.current) wingR.current.rotation.z = -flap;
    g.position.x += config.vx;
    if (config.vz !== undefined) g.position.z += config.vz;
    g.position.y = config.startY + Math.sin(L * 0.03) * 1.2;
    if (config.isJungle) {
      g.rotation.y = Math.atan2(config.vx, config.vz ?? 0) + Math.sin(L * 0.01) * 0.3;
    } else {
      g.rotation.y = (config.dir * Math.PI) / 2 + Math.sin(L * 0.01) * 0.3;
    }
    if (g.position.z > config.zMax) g.position.z = config.zMax;
    if (g.position.z < config.zMin) g.position.z = config.zMin;
    const expired = L >= config.maxLife;
    let out: boolean;
    if (config.isJungle) {
      const dx = g.position.x;
      const dz = g.position.z - 14;
      out = Math.hypot(dx, dz) > 52;
    } else {
      out = config.dir === 1 ? g.position.x > SEAGULL_EXIT_X : g.position.x < -SEAGULL_EXIT_X;
    }
    if (expired || out) onExpire(config.id);
  });

  return (
    <group ref={groupRef} position={[config.x, config.y, config.z]} scale={0.7}>
      <group ref={wingL} position={[-0.6, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.2, 0.06, 0.35]} />
          <meshStandardMaterial color={palette.wing} roughness={0.55} flatShading={false} />
        </mesh>
      </group>
      <group ref={wingR} position={[0.6, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.2, 0.06, 0.35]} />
          <meshStandardMaterial color={palette.wing} roughness={0.55} flatShading={false} />
        </mesh>
      </group>
      <mesh castShadow>
        <sphereGeometry args={[0.25, 10, 6]} />
        <meshStandardMaterial color={palette.body} roughness={0.5} flatShading={false} />
      </mesh>
      <mesh position={[0, 0.2, 0.3]} castShadow>
        <sphereGeometry args={[0.14, 8, 6]} />
        <meshStandardMaterial color={palette.body} roughness={0.5} flatShading={false} />
      </mesh>
      <mesh position={[0, 0.18, 0.52]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.04, 0.18, 6]} />
        <meshStandardMaterial color={0xffcc40} roughness={0.4} flatShading={false} />
      </mesh>
    </group>
  );
}

/** Flagermus i hulen — samme silhuet som mågen, men sort, lavere poly og meshBasic. */
function FlyingBatMesh({
  config,
  onExpire,
}: {
  config: BirdConfig;
  onExpire: (id: string) => void;
}) {
  const groupRef = useRef<Group>(null);
  const wingL = useRef<Group>(null);
  const wingR = useRef<Group>(null);
  const life = useRef(0);
  const body = 0x080808;
  const wing = 0x0a0a0a;

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    life.current++;
    const L = life.current;
    const flap = Math.sin(L * 0.54 + config.phase) * 0.5;
    if (wingL.current) wingL.current.rotation.z = flap;
    if (wingR.current) wingR.current.rotation.z = -flap;
    g.position.x += config.vx;
    g.position.y = config.startY + Math.sin(L * 0.09) * 0.6;
    g.rotation.y = (config.dir * Math.PI) / 2 + Math.sin(L * 0.03) * 0.5;
    if (g.position.z > config.zMax) g.position.z = config.zMax;
    if (g.position.z < config.zMin) g.position.z = config.zMin;
    const expired = L >= config.maxLife;
    const out =
      config.dir === 1 ? g.position.x > BAT_EXIT_X : g.position.x < -BAT_EXIT_X;
    if (expired || out) onExpire(config.id);
  });

  return (
    <group ref={groupRef} position={[config.x, config.y, config.z]} scale={0.35}>
      <group ref={wingL} position={[-0.6, 0, 0]}>
        <mesh>
          <boxGeometry args={[1.2, 0.06, 0.35]} />
          <meshBasicMaterial color={wing} />
        </mesh>
      </group>
      <group ref={wingR} position={[0.6, 0, 0]}>
        <mesh>
          <boxGeometry args={[1.2, 0.06, 0.35]} />
          <meshBasicMaterial color={wing} />
        </mesh>
      </group>
      <mesh>
        <sphereGeometry args={[0.25, 6, 4]} />
        <meshBasicMaterial color={body} />
      </mesh>
      <mesh position={[0, 0.2, 0.3]}>
        <sphereGeometry args={[0.14, 6, 4]} />
        <meshBasicMaterial color={body} />
      </mesh>
      <mesh position={[0, 0.18, 0.52]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.04, 0.12, 4]} />
        <meshBasicMaterial color={body} />
      </mesh>
    </group>
  );
}

function CaveBats() {
  const currentLocation = useGameStore((s) => s.currentLocation);
  const [bats, setBats] = useState<BirdConfig[]>([]);
  const spawnTimer = useRef(0);
  const nextSpawnFrames = useRef(150 + Math.floor(Math.random() * 111));

  const removeBat = useCallback((id: string) => {
    setBats((b) => b.filter((x) => x.id !== id));
  }, []);

  useEffect(() => {
    setBats([]);
  }, [currentLocation]);

  useFrame(() => {
    if (currentLocation !== 'cave') return;
    spawnTimer.current++;
    if (spawnTimer.current < nextSpawnFrames.current) return;
    spawnTimer.current = 0;
    nextSpawnFrames.current = 150 + Math.floor(Math.random() * 111);

    setBats((prev) => {
      const maxBats = 7;
      if (prev.length >= maxBats) return prev;
      // 2/3 right→left (dir -1), 1/3 left→right (dir 1)
      const dir = Math.random() < 2 / 3 ? -1 : 1;
      const count = 1 + Math.floor(Math.random() * 3);
      const next: BirdConfig[] = [];
      for (let i = 0; i < count && prev.length + next.length < maxBats; i++) {
        const x = -dir * (18 + Math.random() * 3);
        const nearBridge = Math.random() < 0.28;
        const y = nearBridge
          ? 3 + Math.random() * 3.8
          : 4 + Math.random() * 3.5;
        const z = nearBridge
          ? 1 + Math.random() * 10
          : CAVE_BAT_Z_MIN + Math.random() * (2 - CAVE_BAT_Z_MIN);
        const vx = (0.36 + Math.random() * 0.18) * 0.8 * dir;
        const exitX = dir === 1 ? BAT_EXIT_X : -BAT_EXIT_X;
        const maxLife = Math.ceil(Math.abs(exitX - x) / Math.abs(vx)) + 60;
        next.push({
          id: `bat-${Math.random().toString(36).slice(2, 11)}`,
          dir,
          vx,
          startY: y,
          phase: Math.random() * Math.PI * 2,
          maxLife,
          x,
          y,
          z,
          zMin: CAVE_BAT_Z_MIN,
          zMax: CAVE_BAT_Z_MAX,
          formation: 'single',
        });
      }
      return [...prev, ...next];
    });
  });

  if (currentLocation !== 'cave') return null;

  return (
    <group>
      {bats.map((b) => (
        <FlyingBatMesh key={b.id} config={b} onExpire={removeBat} />
      ))}
    </group>
  );
}

function useSeagullLocationsActive() {
  const locationId = useGameStore((s) => s.currentLocation);
  const weatherType = useGameStore((s) => s.weatherType);
  const w = getWeatherEntry(weatherType);
  const loc = LOCATIONS[locationId as keyof typeof LOCATIONS];
  const rules = loc?.specialRules;
  const allow = !w.storm && rules?.hasSeagulls === true;
  return { locationId, allow };
}

/** Måger i luften + ekstra pingviner på isen — som legacy ambient. */
export function AmbientLife() {
  const { play } = useAudio();
  const hasStarted = useUIStore((s) => s.hasStarted);
  const isMuted = useUIStore((s) => s.isMuted);
  const { locationId, allow } = useSeagullLocationsActive();

  const [birds, setBirds] = useState<BirdConfig[]>([]);
  const patternMirrored = useRef(false);
  const patternCycle = useRef(0);
  const [patternFlipSeed] = useState(() => 2 + Math.floor(Math.random() * 2));
  const patternFlipAfter = useRef(patternFlipSeed);

  const removeBird = useCallback((id: string) => {
    setBirds((b) => b.filter((x) => x.id !== id));
  }, []);

  useEffect(() => {
    if (!hasStarted || isMuted) return;
    const id = window.setInterval(() => {
      const gs = useGameStore.getState().gameState;
      if (Math.random() > 0.7 && (gs === 'idle' || gs === 'waiting')) {
        play('seagull');
      }
    }, 8000);
    return () => window.clearInterval(id);
  }, [hasStarted, isMuted, play]);

  useEffect(() => {
    if (!allow) startTransition(() => setBirds([]));
  }, [allow]);

  useFrame(() => {
    if (!allow) return;
    if (!consumeSeagullSpawn()) return;
    const maxSeagulls = 4;
    const lid = useGameStore.getState().currentLocation;
    setBirds((prev) => {
      if (prev.length >= maxSeagulls) return prev;
      const isJungle = lid === 'jungle_island';
      if (isJungle) {
        const JUNGLE_CZ = 14;
        const count = 1 + Math.floor(Math.random() * 3);
        const next = [...prev];
        for (let k = 0; k < count && next.length < maxSeagulls; k++) {
          const SPAWN_DIST = 36 + Math.random() * 6;
          const angle = Math.random() * Math.PI * 2;
          const sx = Math.cos(angle) * SPAWN_DIST;
          const sz = JUNGLE_CZ + Math.sin(angle) * SPAWN_DIST;
          const sy = 4 + Math.random() * 6;
          const targetAngle = angle + Math.PI + (Math.random() - 0.5) * 0.6;
          const spd = 0.12 + Math.random() * 0.06;
          const vx = Math.cos(targetAngle) * spd;
          const vz = Math.sin(targetAngle) * spd;
          next.push({
            id: randomId(),
            dir: 1,
            vx,
            vz,
            startY: sy,
            phase: Math.random() * Math.PI * 2,
            maxLife: 900 + Math.floor(Math.random() * 300),
            x: sx,
            y: sy,
            z: sz,
            zMin: -999,
            zMax: 999,
            formation: 'single',
            isJungle: true,
          });
        }
        return next;
      }
      const isCabin = lid === 'fishing_cabin';
      const zBounds = getBackgroundZBounds(lid);
      if (zBounds.disabled) return prev;
      const zSpan = zBounds.maxZ - zBounds.minZ;
      const singleDir = patternMirrored.current ? -1 : 1;
      const pairDir = -singleDir;
      const spawnX = (dir: number) =>
        isCabin ? -28 - Math.random() * 3 : -dir * (34 + Math.random() * 4);
      const baseY = isCabin ? 5 + Math.random() * 3 : 3.2 + Math.random() * 5;
      const spawnZ = () => zBounds.minZ + Math.random() * zSpan;

      const add = (
        x: number,
        y: number,
        z: number,
        dir: number,
        formation: 'single' | 'pair',
      ): BirdConfig => {
        const actualDir = isCabin ? 1 : dir;
        const vx = (0.12 + Math.random() * 0.06) * actualDir;
        const exitX = actualDir === 1 ? SEAGULL_EXIT_X : -SEAGULL_EXIT_X;
        const maxLife = Math.ceil(Math.abs(exitX - x) / Math.abs(vx)) + 120;
        return {
          id: randomId(),
          dir: actualDir,
          vx,
          startY: y,
          phase: Math.random() * Math.PI * 2,
          maxLife,
          x, y, z,
          zMin: zBounds.minZ,
          zMax: zBounds.maxZ,
          formation,
        };
      };

      const next = [...prev];
      next.push(add(spawnX(singleDir), baseY, spawnZ(), singleDir, 'single'));
      if (next.length <= maxSeagulls - 2) {
        next.push(
          add(spawnX(pairDir), baseY - (0.6 + Math.random() * 0.6), spawnZ(), pairDir, 'pair'),
        );
        next.push(
          add(
            spawnX(pairDir),
            baseY - (1.1 + Math.random() * 0.7),
            spawnZ(),
            pairDir,
            'pair',
          ),
        );
      }

      patternCycle.current++;
      if (patternCycle.current >= patternFlipAfter.current) {
        patternMirrored.current = !patternMirrored.current;
        patternCycle.current = 0;
        patternFlipAfter.current = 2 + Math.floor(Math.random() * 2);
      }

      return next.slice(0, maxSeagulls);
    });
  });

  useEffect(() => {
    startTransition(() => setBirds([]));
    patternMirrored.current = false;
    patternCycle.current = 0;
  }, [locationId]);

  return (
    <group>
      {allow &&
        birds.map((b) => (
          <FlyingSeagullMesh
            key={b.id}
            config={b}
            palette={seagullPalette(locationId, b.formation)}
            onExpire={removeBird}
          />
        ))}
      <CaveBats />
    </group>
  );
}
