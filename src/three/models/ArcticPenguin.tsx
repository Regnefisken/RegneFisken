import { useMemo, useRef, useState } from 'react';
import { Group } from 'three';
import type { ThreeElements } from '@react-three/fiber';
import { useFrame } from '@react-three/fiber';
import { useAudio } from '../../audio/useAudio';
import { useUIStore } from '../../store/useUIStore';

const P_SEGS = 10;

/** Arktisk pingvin — legacy `buildArcticSea` NPC-geometri (PBR-lignende StandardMaterial). */
export function ArcticPenguin({
  animate = true,
  isNpc = false,
  position,
  userData,
  ...rest
}: { animate?: boolean; isNpc?: boolean } & ThreeElements['group']) {
  const { play } = useAudio();
  const setShowCollectibleModal = useUIStore((s) => s.setShowCollectibleModal);
  const root = useRef<Group>(null);
  const wingL = useRef<Group>(null);
  const wingR = useRef<Group>(null);
  const [phaseInit] = useState(() => Math.random() * Math.PI * 2);
  const phaseRef = useRef(phaseInit);
  const baseY = Array.isArray(position) ? (position[1] ?? 0) : 0;
  const baseX = Array.isArray(position) ? (position[0] ?? 0) : 0;
  const baseZ = Array.isArray(position) ? (position[2] ?? 0) : 0;

  const mats = useMemo(
    () => ({
      body: { color: 0x111111, roughness: 0.35, metalness: 0.05, flatShading: false as const },
      belly: { color: 0xfafafa, roughness: 0.5, flatShading: false as const },
      beak: { color: 0xff8c00, roughness: 0.35, flatShading: false as const },
      eye: { color: 0x000000, roughness: 0.05, metalness: 0.5, flatShading: false as const },
      eyeWhite: { color: 0xffffff, roughness: 0.3, flatShading: false as const },
    }),
    [],
  );

  useFrame(({ clock }) => {
    if (!animate || !root.current) return;
    const t = clock.elapsedTime;
    const phase = phaseRef.current;
    if (isNpc) {
      root.current.position.set(baseX, baseY + Math.sin(t * 2 + phase) * 0.012, baseZ);
      root.current.rotation.z = Math.sin(t * 1.2 + phase) * 0.022;
    } else {
      root.current.position.x = baseX + Math.sin(t * 0.9 + phase) * 0.035;
      root.current.position.y = baseY + Math.sin(t * 2.2 + phase) * 0.018;
      root.current.position.z = baseZ + Math.cos(t * 0.85 + phase) * 0.03;
      root.current.rotation.z = Math.sin(t * 1.4 + phase) * 0.04;
    }
    if (wingL.current && wingR.current) {
      const w = Math.sin(t * 3.5 + phase) * 0.12;
      wingL.current.rotation.x = w;
      wingR.current.rotation.x = -w;
      wingL.current.rotation.z = 0.3 + Math.sin(t * 2 + phase) * 0.06;
      wingR.current.rotation.z = -0.3 - Math.sin(t * 2 + phase) * 0.06;
    }
  });

  return (
    <group
      ref={root}
      position={position}
      {...rest}
      userData={
        isNpc
          ? { id: 'np_penguin', interactable: true, type: 'npc', isPenguinNPC: true }
          : userData
      }
      onPointerDown={
        isNpc
          ? (e) => {
              e.stopPropagation();
              play('ui');
              setShowCollectibleModal('conch');
            }
          : undefined
      }
    >
      <mesh position={[0, 0.56, 0]} scale={[1, 1.25, 1]} castShadow>
        <sphereGeometry args={[0.45, P_SEGS, Math.max(8, P_SEGS >> 1)]} />
        <meshStandardMaterial {...mats.body} />
      </mesh>
      <mesh position={[0, 0.5, 0.32]} scale={[0.85, 1.1, 0.5]} castShadow>
        <sphereGeometry args={[0.3, Math.max(8, P_SEGS - 2), Math.max(6, P_SEGS >> 1)]} />
        <meshStandardMaterial {...mats.belly} />
      </mesh>
      <mesh position={[0, 1.12, 0.04]} castShadow>
        <sphereGeometry args={[0.27, Math.max(8, P_SEGS - 2), Math.max(6, P_SEGS >> 1)]} />
        <meshStandardMaterial {...mats.body} />
      </mesh>
      <mesh position={[-0.12, 1.17, 0.22]} castShadow>
        <sphereGeometry args={[0.075, Math.max(6, P_SEGS >> 1), Math.max(6, P_SEGS >> 1)]} />
        <meshStandardMaterial {...mats.eyeWhite} />
      </mesh>
      <mesh position={[0.12, 1.17, 0.22]} castShadow>
        <sphereGeometry args={[0.075, Math.max(6, P_SEGS >> 1), Math.max(6, P_SEGS >> 1)]} />
        <meshStandardMaterial {...mats.eyeWhite} />
      </mesh>
      <mesh position={[-0.12, 1.17, 0.285]} castShadow>
        <sphereGeometry args={[0.055, Math.max(6, P_SEGS >> 1), Math.max(6, P_SEGS >> 1)]} />
        <meshStandardMaterial {...mats.eye} />
      </mesh>
      <mesh position={[0.12, 1.17, 0.285]} castShadow>
        <sphereGeometry args={[0.055, Math.max(6, P_SEGS >> 1), Math.max(6, P_SEGS >> 1)]} />
        <meshStandardMaterial {...mats.eye} />
      </mesh>
      <mesh position={[0, 1.1, 0.38]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.065, 0.16, Math.max(6, P_SEGS >> 1)]} />
        <meshStandardMaterial {...mats.beak} />
      </mesh>
      <group ref={wingL} position={[-0.46, 0.62, 0.1]} rotation={[0, 0, 0.3]}>
        <mesh scale={[0.5, 0.9, 1]} castShadow>
          <sphereGeometry args={[0.18, Math.max(6, P_SEGS >> 1), Math.max(5, P_SEGS >> 2)]} />
          <meshStandardMaterial {...mats.body} />
        </mesh>
      </group>
      <group ref={wingR} position={[0.46, 0.62, 0.1]} rotation={[0, 0, -0.3]}>
        <mesh scale={[0.5, 0.9, 1]} castShadow>
          <sphereGeometry args={[0.18, Math.max(6, P_SEGS >> 1), Math.max(5, P_SEGS >> 2)]} />
          <meshStandardMaterial {...mats.body} />
        </mesh>
      </group>
      <mesh position={[-0.16, 0.08, 0.14]} scale={[1.4, 0.4, 1.6]} castShadow>
        <sphereGeometry args={[0.1, Math.max(6, P_SEGS >> 1), Math.max(4, P_SEGS >> 2)]} />
        <meshStandardMaterial {...mats.beak} />
      </mesh>
      <mesh position={[0.16, 0.08, 0.14]} scale={[1.4, 0.4, 1.6]} castShadow>
        <sphereGeometry args={[0.1, Math.max(6, P_SEGS >> 1), Math.max(4, P_SEGS >> 2)]} />
        <meshStandardMaterial {...mats.beak} />
      </mesh>
    </group>
  );
}
