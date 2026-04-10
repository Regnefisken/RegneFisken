import { useRef } from 'react';
import type { Group, Mesh } from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import { useFrame } from '@react-three/fiber';
import { useAudio } from '../../audio/useAudio.js';
import { useCollectionStore } from '../../store/useCollectionStore.js';

const body = { color: 0xe11d48, roughness: 0.35, flatShading: false as const };
const wing = { color: 0x059669, roughness: 0.35, flatShading: false as const };
const tail = { color: 0x2563eb, roughness: 0.35, flatShading: false as const };
const beak = { color: 0xfbbf24, roughness: 0.3, flatShading: false as const };
const pole = { color: 0x5c4033, roughness: 0.7, flatShading: false as const };
const eyeWhite = { color: 0xffffff, roughness: 0.4, flatShading: false as const };

/** Radius 0.06 → pupiller opr. ⅔ af øje; derefter −40% ⇒ 0,6×. */
const EYE_R = 0.06;
const PUPIL_R = (EYE_R / 3) * 2 * 0.6;
const EYE_Z = 0.22;
/** Lidt længere frem (+Z) så pupillerne lægger sig tydeligere på øjets overflade. */
const PUPIL_FORWARD = 0.018;
const PUPIL_Z = EYE_Z + EYE_R - PUPIL_R + PUPIL_FORWARD;

/** +Z mod kamera (IDLE_PIER z≈13); ikke mod plesiosaurus (z≈1.2). */
const PARROT_TOWARD_CAMERA_Z = 0.72;
/** Broens dæk ~x≈0; papegøje var x≈−4.2 — +X nærmere midten af broen. */
const PARROT_TOWARD_BRIDGE_X = 0.42;

/** Legacy `createParrotCompanion` — papegøje på molen, klik → dialog. */
export function ParrotCompanion() {
  const gRef = useRef<Group>(null);
  const wingLRef = useRef<Mesh>(null);
  const wingRRef = useRef<Mesh>(null);
  const { play } = useAudio();
  const setShowParrot = useCollectionStore((s) => s.setShowParrot);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const wL = wingLRef.current;
    const wR = wingRRef.current;
    if (wL) wL.rotation.z = -0.2 + Math.sin(t * 6) * 0.12;
    if (wR) wR.rotation.z = 0.2 - Math.sin(t * 6) * 0.12;
  });

  function onPointerDown(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
    play('ui');
    setShowParrot(true);
  }

  return (
    <group
      ref={gRef}
      position={[-4.2 + PARROT_TOWARD_BRIDGE_X, 1.1, 5.5 + PARROT_TOWARD_CAMERA_Z]}
      rotation={[0, Math.PI * 0.15, 0]}
      scale={0.95}
      userData={{ type: 'parrotCompanion', clickable: true }}
    >
      <mesh position={[0, 0, 0]} scale={[0.8, 1.5, 0.8]} castShadow onPointerDown={onPointerDown}>
        <sphereGeometry args={[0.4, 20, 20]} />
        <meshStandardMaterial {...body} />
      </mesh>
      <mesh position={[0, 0.4, 0.35]} rotation={[-Math.PI / 2.5, 0, 0]} castShadow onPointerDown={onPointerDown}>
        <coneGeometry args={[0.15, 0.4, 12]} />
        <meshStandardMaterial {...beak} />
      </mesh>
      <mesh
        ref={wingLRef}
        position={[-0.35, 0, 0]}
        rotation={[-0.35, 0, -0.15]}
        scale={[0.2, 1, 0.6]}
        castShadow
        onPointerDown={onPointerDown}
      >
        <sphereGeometry args={[0.3, 14, 14]} />
        <meshStandardMaterial {...wing} />
      </mesh>
      <mesh
        ref={wingRRef}
        position={[0.35, 0, 0]}
        rotation={[-0.35, 0, 0.15]}
        scale={[0.2, 1, 0.6]}
        castShadow
        onPointerDown={onPointerDown}
      >
        <sphereGeometry args={[0.3, 14, 14]} />
        <meshStandardMaterial {...wing} />
      </mesh>
      <mesh
        position={[0, -0.6, -0.3]}
        rotation={[-0.5, 0, 0]}
        scale={0.8}
        castShadow
        onPointerDown={onPointerDown}
      >
        <coneGeometry args={[0.15, 1, 10]} />
        <meshStandardMaterial {...tail} />
      </mesh>
      <mesh position={[-0.15, 0.5, EYE_Z]} castShadow onPointerDown={onPointerDown}>
        <sphereGeometry args={[EYE_R, 10, 10]} />
        <meshStandardMaterial color={0x111111} roughness={0.1} metalness={0.3} />
      </mesh>
      <mesh position={[0.15, 0.5, EYE_Z]} castShadow onPointerDown={onPointerDown}>
        <sphereGeometry args={[EYE_R, 10, 10]} />
        <meshStandardMaterial color={0x111111} roughness={0.1} metalness={0.3} />
      </mesh>
      <mesh position={[-0.15, 0.5, PUPIL_Z]} castShadow onPointerDown={onPointerDown}>
        <sphereGeometry args={[PUPIL_R, 10, 10]} />
        <meshStandardMaterial {...eyeWhite} />
      </mesh>
      <mesh position={[0.15, 0.5, PUPIL_Z]} castShadow onPointerDown={onPointerDown}>
        <sphereGeometry args={[PUPIL_R, 10, 10]} />
        <meshStandardMaterial {...eyeWhite} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, -0.55, 0]} castShadow onPointerDown={onPointerDown}>
        <cylinderGeometry args={[0.04, 0.04, 1.1, 10]} />
        <meshStandardMaterial {...pole} />
      </mesh>
      <mesh position={[0, -1.45, 0]} castShadow onPointerDown={onPointerDown}>
        <cylinderGeometry args={[0.035, 0.045, 1.8, 10]} />
        <meshStandardMaterial {...pole} />
      </mesh>
    </group>
  );
}
