import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { useAudio } from '../../audio/useAudio.js';
import { RAT_FACTS } from '../../data/world.js';
import { useCollectionStore } from '../../store/useCollectionStore.js';
import { usePlayerStore } from '../../store/usePlayerStore.js';
import { useUIStore } from '../../store/useUIStore.js';

/** Som legacy `PIER_RAT.gy` — konstant grundhøjde; X/Z følger din rute (lokalt under [0,0.1,0]). */
const LEGACY_Y = 0.52;

const RAT_A = { x: -0.86, y: LEGACY_Y, z: 2.69 } as const;
const RAT_B = { x: -0.83, y: LEGACY_Y, z: -0.34 } as const;
const RAT_C = { x: -1.27, y: LEGACY_Y, z: 11.17 } as const;

const T_RUN_CA = 5.0;
const T_SNIFF_A = 3.2;
const T_TURN_AB = 0.95;
const T_RUN_AB = 3.6;
const T_SNIFF_B = 3.2;
const T_TURN_BC = 1.15;
const T_RUN_BC = 5.8;
const T_SNIFF_C = 2.0;

const T1 = T_RUN_CA;
const T2 = T1 + T_SNIFF_A;
const T3 = T2 + T_TURN_AB;
const T4 = T3 + T_RUN_AB;
const T5 = T4 + T_SNIFF_B;
const T6 = T5 + T_TURN_BC;
const T7 = T6 + T_RUN_BC;
const CYCLE = T7 + T_SNIFF_C;

/** Kort fade ind/ud af sniff-wobble så position matcher waypoints præcis ved faseskift. */
const SNIFF_ENV_EDGE = 0.42;

const BOB_AMP = 0.028;
const BOB_FREQ = 14.5;

function smoothstep01(edge0: number, edge1: number, x: number): number {
  if (x <= edge0) return 0;
  if (x >= edge1) return 1;
  const t = (x - edge0) / (edge1 - edge0);
  return t * t * (3 - 2 * t);
}

function sniffEnvelope(phaseT: number, duration: number): number {
  const a = smoothstep01(0, SNIFF_ENV_EDGE, phaseT);
  const b = 1 - smoothstep01(duration - SNIFF_ENV_EDGE, duration, phaseT);
  return Math.min(a, b);
}

function yawForMove(dx: number, dz: number): number {
  return Math.atan2(dx, dz) - Math.PI / 2;
}

const INITIAL_RAT_YAW = yawForMove(RAT_A.x - RAT_C.x, RAT_A.z - RAT_C.z);

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpAngle(a: number, b: number, t: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

function applyBobY(group: Group, time: number): void {
  group.position.y = LEGACY_Y + BOB_AMP * Math.abs(Math.sin(time * BOB_FREQ));
}

/** Sniff: wobble kun når envelope > 0, så ingen cm-hop ind/ud af fasen. */
function sniffAt(
  group: Group,
  base: { x: number; y: number; z: number },
  baseYaw: number,
  phaseT: number,
  _duration: number,
  seed: number,
  env: number,
  time: number
): number {
  const w = env;
  group.position.x = base.x + Math.sin(phaseT * 1.15 + seed) * 0.22 * w;
  group.position.z = base.z + Math.sin(phaseT * 1.45 + seed * 1.63) * 0.32 * w;
  applyBobY(group, time);
  return (
    baseYaw + Math.sin(phaseT * 2.9 + seed) * 0.48 * w + Math.sin(phaseT * 11.5 + seed) * 0.09 * w
  );
}

/** Lineært løb (konstant hastighed langs stræk) — undgår easeInOut-stop der føles som små hop. */
function runSegment(
  group: Group,
  from: { x: number; y: number; z: number },
  to: { x: number; y: number; z: number },
  rawProg: number,
  time: number
): number {
  const prog = Math.min(1, Math.max(0, rawProg));
  group.position.x = lerp(from.x, to.x, prog);
  group.position.z = lerp(from.z, to.z, prog);
  applyBobY(group, time);
  return yawForMove(to.x - from.x, to.z - from.z);
}

function updateHarborRat(group: Group, time: number): number {
  const t = time % CYCLE;

  if (t < T1) {
    const prog = t / T_RUN_CA;
    return runSegment(group, RAT_C, RAT_A, prog, time);
  }
  if (t < T2) {
    const phaseT = t - T1;
    const env = sniffEnvelope(phaseT, T_SNIFF_A);
    const yawA = yawForMove(RAT_A.x - RAT_C.x, RAT_A.z - RAT_C.z);
    return sniffAt(group, RAT_A, yawA, phaseT, T_SNIFF_A, 0.3, env, time);
  }
  if (t < T3) {
    const u = (t - T2) / T_TURN_AB;
    const sm = u * u * (3 - 2 * u);
    const yawFrom = yawForMove(RAT_A.x - RAT_C.x, RAT_A.z - RAT_C.z);
    const yawTo = yawForMove(RAT_B.x - RAT_A.x, RAT_B.z - RAT_A.z);
    group.position.set(RAT_A.x, RAT_A.y, RAT_A.z);
    applyBobY(group, time);
    return lerpAngle(yawFrom, yawTo, sm);
  }
  if (t < T4) {
    const u = (t - T3) / T_RUN_AB;
    return runSegment(group, RAT_A, RAT_B, u, time);
  }
  if (t < T5) {
    const phaseT = t - T4;
    const env = sniffEnvelope(phaseT, T_SNIFF_B);
    const yawB = yawForMove(RAT_B.x - RAT_A.x, RAT_B.z - RAT_A.z);
    return sniffAt(group, RAT_B, yawB, phaseT, T_SNIFF_B, 1.05, env, time);
  }
  if (t < T6) {
    const u = (t - T5) / T_TURN_BC;
    const sm = u * u * (3 - 2 * u);
    const yawFrom = yawForMove(RAT_B.x - RAT_A.x, RAT_B.z - RAT_A.z);
    const yawTo = yawForMove(RAT_C.x - RAT_B.x, RAT_C.z - RAT_B.z);
    group.position.set(RAT_B.x, RAT_B.y, RAT_B.z);
    applyBobY(group, time);
    return lerpAngle(yawFrom, yawTo, sm);
  }
  if (t < T7) {
    const u = (t - T6) / T_RUN_BC;
    return runSegment(group, RAT_B, RAT_C, u, time);
  }
  const phaseT = t - T7;
  const env = sniffEnvelope(phaseT, T_SNIFF_C);
  const yawC = yawForMove(RAT_C.x - RAT_B.x, RAT_C.z - RAT_B.z);
  return sniffAt(group, RAT_C, yawC, phaseT, T_SNIFF_C, 2.35, env, time);
}

export function HarborRat() {
  const groupRef = useRef<Group>(null);
  const smoothedYaw = useRef(INITIAL_RAT_YAW);
  const { play } = useAudio();
  const cheeseSources = usePlayerStore((s) => s.cheeseSources);
  const unlockedCompanions = useCollectionStore((s) => s.unlockedCompanions);
  const setShowRat = useCollectionStore((s) => s.setShowRat);
  const setRatFactIndex = useCollectionStore((s) => s.setRatFactIndex);
  const setToastMessage = useUIStore((s) => s.setToastMessage);

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const time = state.clock.elapsedTime;
    const targetYaw = updateHarborRat(g, time);
    const dt = Math.min(delta, 0.05);
    const blend = 1 - Math.exp(-11 * dt);
    smoothedYaw.current = lerpAngle(smoothedYaw.current, targetYaw, blend);
    g.rotation.y = smoothedYaw.current;
  });

  const bodyMat = { color: 0x7a6a5a, roughness: 0.55, flatShading: false as const };
  const earMat = { color: 0x9a8a7a, roughness: 0.45, flatShading: false as const };
  const tailMat = { color: 0xe8a090, roughness: 0.4, flatShading: false as const };

  function onRatPointerDown(e: { stopPropagation: () => void }) {
    e.stopPropagation();
    const allCheesesFound = cheeseSources.length >= 3;
    if (unlockedCompanions.includes('rat') || allCheesesFound) {
      setRatFactIndex(Math.floor(Math.random() * RAT_FACTS.length));
      setShowRat(true);
      play('ui');
    } else {
      setToastMessage('🐀 Rotten ignorerer dig. Måske hvis du finder alle 3 oste...');
      play('error');
    }
  }

  return (
    <group
      ref={groupRef}
      position={[RAT_C.x, RAT_C.y, RAT_C.z]}
      onPointerDown={onRatPointerDown}
    >
      <mesh>
        <boxGeometry args={[0.95, 0.35, 0.55]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh castShadow scale={[1.4, 0.9, 1]}>
        <sphereGeometry args={[0.18, 28, 20]} />
        <meshStandardMaterial {...bodyMat} />
      </mesh>
      <mesh position={[0.22, 0.04, 0]} castShadow>
        <sphereGeometry args={[0.12, 24, 18]} />
        <meshStandardMaterial {...bodyMat} />
      </mesh>
      <mesh position={[0.33, 0, 0]} castShadow>
        <sphereGeometry args={[0.055, 18, 14]} />
        <meshStandardMaterial {...bodyMat} />
      </mesh>
      <mesh position={[0.2, 0.14, 0.08]} castShadow>
        <sphereGeometry args={[0.06, 18, 14]} />
        <meshStandardMaterial {...earMat} />
      </mesh>
      <mesh position={[0.2, 0.14, -0.08]} castShadow>
        <sphereGeometry args={[0.06, 18, 14]} />
        <meshStandardMaterial {...earMat} />
      </mesh>
      <mesh position={[-0.34, -0.04, 0]} rotation={[0, 0, Math.PI / 2.5]} castShadow>
        <cylinderGeometry args={[0.015, 0.008, 0.45, 20]} />
        <meshStandardMaterial {...tailMat} />
      </mesh>
      <group position={[0.32, 0.06, 0.06]}>
        <mesh castShadow>
          <sphereGeometry args={[0.02, 12, 12]} />
          <meshBasicMaterial color={0xffffff} />
        </mesh>
        <mesh position={[0.016, 0, 0.005]}>
          <sphereGeometry args={[0.008, 10, 10]} />
          <meshBasicMaterial color={0x000000} />
        </mesh>
      </group>
      <group position={[0.32, 0.06, -0.06]}>
        <mesh castShadow>
          <sphereGeometry args={[0.02, 12, 12]} />
          <meshBasicMaterial color={0xffffff} />
        </mesh>
        <mesh position={[0.016, 0, -0.005]}>
          <sphereGeometry args={[0.008, 10, 10]} />
          <meshBasicMaterial color={0x000000} />
        </mesh>
      </group>
    </group>
  );
}
