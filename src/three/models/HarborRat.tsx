import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { useAudio } from '../../audio/useAudio.js';
import { RAT_FACTS } from '../../data/world.js';
import { useCollectionStore } from '../../store/useCollectionStore.js';
import { usePlayerStore } from '../../store/usePlayerStore.js';
import { useUIStore } from '../../store/useUIStore.js';

/** Havne-rotte — geometri og patrol som legacy `buildHarborRat` (pier). */
const PIER_RAT = { sx: -0.88, gy: 0.54, baseZ: 3.0, startZ: 14 } as const;

function updateHarborRat(group: Group, time: number, p: typeof PIER_RAT) {
  const t = time % 16;
  if (t < 5) {
    const raw = t / 5;
    const prog = raw - Math.sin(raw * Math.PI * 4) * 0.04;
    group.position.x = p.sx + Math.sin(t * 2.5) * 0.08;
    group.position.z = p.startZ + (p.baseZ - p.startZ) * prog;
    group.position.y = p.gy + Math.abs(Math.sin(t * 15)) * 0.06;
    group.rotation.y = Math.PI / 2 + Math.sin(t * 10) * 0.12;
  } else if (t < 9) {
    group.position.x = p.sx + Math.sin(t * 1.2) * 0.3;
    group.position.y = p.gy;
    group.position.z = p.baseZ + Math.sin(t * 1.5) * 0.4;
    group.rotation.y = Math.PI / 2 + Math.sin(t * 3) * 0.6 + Math.sin(t * 12) * 0.1;
  } else if (t < 14) {
    const raw2 = (t - 9) / 5;
    const prog2 = raw2 - Math.sin(raw2 * Math.PI * 4) * 0.04;
    group.position.x = p.sx + Math.sin(t * 2.5) * 0.08;
    group.position.z = p.baseZ + (p.startZ - p.baseZ) * prog2;
    group.position.y = p.gy + Math.abs(Math.sin(t * 15)) * 0.06;
    group.rotation.y = -Math.PI / 2 + Math.sin(t * 10) * 0.12;
  } else {
    group.position.set(p.sx, p.gy, p.startZ);
    group.rotation.y = -Math.PI / 2;
  }
}

export function HarborRat() {
  const groupRef = useRef<Group>(null);
  const { play } = useAudio();
  const cheeseSources = usePlayerStore((s) => s.cheeseSources);
  const unlockedCompanions = useCollectionStore((s) => s.unlockedCompanions);
  const setShowRat = useCollectionStore((s) => s.setShowRat);
  const setRatFactIndex = useCollectionStore((s) => s.setRatFactIndex);
  const setToastMessage = useUIStore((s) => s.setToastMessage);

  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;
    updateHarborRat(g, state.clock.elapsedTime, PIER_RAT);
  });

  const bodyMat = { color: 0x7a6a5a, roughness: 0.55, flatShading: true as const };
  const earMat = { color: 0x9a8a7a, roughness: 0.45, flatShading: true as const };
  const tailMat = { color: 0xe8a090, roughness: 0.4, flatShading: true as const };

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
      position={[PIER_RAT.sx, PIER_RAT.gy, PIER_RAT.startZ]}
      onPointerDown={onRatPointerDown}
    >
      <mesh>
        <boxGeometry args={[0.95, 0.35, 0.55]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh castShadow scale={[1.4, 0.9, 1]}>
        <sphereGeometry args={[0.18, 10, 8]} />
        <meshStandardMaterial {...bodyMat} />
      </mesh>
      <mesh position={[0.22, 0.04, 0]} castShadow>
        <sphereGeometry args={[0.12, 10, 8]} />
        <meshStandardMaterial {...bodyMat} />
      </mesh>
      <mesh position={[0.33, 0, 0]} castShadow>
        <sphereGeometry args={[0.055, 8, 6]} />
        <meshStandardMaterial {...bodyMat} />
      </mesh>
      <mesh position={[0.2, 0.14, 0.08]} castShadow>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshStandardMaterial {...earMat} />
      </mesh>
      <mesh position={[0.2, 0.14, -0.08]} castShadow>
        <sphereGeometry args={[0.06, 8, 6]} />
        <meshStandardMaterial {...earMat} />
      </mesh>
      <mesh position={[-0.34, -0.04, 0]} rotation={[0, 0, Math.PI / 2.5]} castShadow>
        <cylinderGeometry args={[0.015, 0.008, 0.45, 8]} />
        <meshStandardMaterial {...tailMat} />
      </mesh>
      <group position={[0.32, 0.06, 0.06]}>
        <mesh castShadow>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshBasicMaterial color={0xffffff} />
        </mesh>
        <mesh position={[0.016, 0, 0.005]}>
          <sphereGeometry args={[0.008, 4, 4]} />
          <meshBasicMaterial color={0x000000} />
        </mesh>
      </group>
      <group position={[0.32, 0.06, -0.06]}>
        <mesh castShadow>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshBasicMaterial color={0xffffff} />
        </mesh>
        <mesh position={[0.016, 0, -0.005]}>
          <sphereGeometry args={[0.008, 4, 4]} />
          <meshBasicMaterial color={0x000000} />
        </mesh>
      </group>
    </group>
  );
}
