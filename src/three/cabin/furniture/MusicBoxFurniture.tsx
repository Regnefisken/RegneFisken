import { forwardRef, useRef, type ComponentPropsWithoutRef } from 'react';
import type { Group, Mesh } from 'three';
import { useFrame } from '@react-three/fiber';
import { useUIStore } from '../../../store/useUIStore.js';
import { startAmbience, fadeOutStopAmbience } from '../../../audio/audioEngine.js';

type GroupProps = ComponentPropsWithoutRef<'group'>;

/**
 * Smuk Spilledåse — havfruens gave.
 * Ved klik spilles havets ambient-lyd i ~10 sekunder.
 * Perlemor-farvet låg med dekorative snirkler.
 */
export const MusicBoxFurniture = forwardRef<Group, GroupProps>(function MusicBoxFurniture(
  props,
  ref,
) {
  const lidRef = useRef<Mesh>(null);
  const playingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFrame(({ clock }) => {
    const lid = lidRef.current;
    if (!lid) return;
    if (playingRef.current) {
      lid.rotation.x = -0.3 + Math.sin(clock.elapsedTime * 2) * 0.03;
    } else {
      lid.rotation.x = 0;
    }
  });

  function handleClick(e: { stopPropagation: () => void }) {
    e.stopPropagation();
    if (playingRef.current) return;

    playingRef.current = true;
    useUIStore.getState().setToastMessage('🎵 Spilledåsen spiller havets melodi...');
    startAmbience(1.5);

    timerRef.current = setTimeout(() => {
      fadeOutStopAmbience(2);
      playingRef.current = false;
      timerRef.current = null;
    }, 10_000);
  }

  const pearl = 0xf0e6d4;
  const gold = 0xc8a86e;
  const darkWood = 0x5a3018;

  return (
    <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'music_box' }}>
      <mesh castShadow position={[0, 0.15, 0]} onClick={handleClick}>
        <boxGeometry args={[0.55, 0.3, 0.4]} />
        <meshStandardMaterial color={darkWood} roughness={0.85} flatShading />
      </mesh>

      <mesh castShadow position={[0, 0.3, 0]}>
        <boxGeometry args={[0.57, 0.03, 0.42]} />
        <meshStandardMaterial color={gold} metalness={0.7} roughness={0.3} flatShading />
      </mesh>

      <mesh
        ref={lidRef}
        castShadow
        position={[0, 0.32, -0.19]}
        onClick={handleClick}
      >
        <boxGeometry args={[0.53, 0.04, 0.38]} />
        <meshStandardMaterial
          color={pearl}
          metalness={0.3}
          roughness={0.15}
        />
      </mesh>

      <mesh position={[0, 0.34, -0.19]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.08, 0.012, 8, 16]} />
        <meshStandardMaterial color={gold} metalness={0.7} roughness={0.3} />
      </mesh>

      <mesh castShadow position={[0, 0.3, -0.2]}>
        <boxGeometry args={[0.08, 0.04, 0.06]} />
        <meshStandardMaterial color={gold} metalness={0.6} roughness={0.4} flatShading />
      </mesh>
    </group>
  );
});
