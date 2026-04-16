import { forwardRef, useRef, type ComponentPropsWithoutRef } from 'react';
import type { Group, Mesh, PointLight } from 'three';
import { useFrame } from '@react-three/fiber';
import { useUIStore } from '../../../store/useUIStore.js';
import { startAmbience, fadeOutStopAmbience } from '../../../audio/audioEngine.js';

type GroupProps = ComponentPropsWithoutRef<'group'>;

/**
 * Smuk Spilledåse — havfruens gave.
 * Ved klik spilles havets ambient-lyd i ~10 sekunder.
 * Perlemor-finish med guldbeslag og svag glød når den spiller.
 */
export const MusicBoxFurniture = forwardRef<Group, GroupProps>(function MusicBoxFurniture(
  props,
  ref,
) {
  const lidRef = useRef<Mesh>(null);
  const innerLightRef = useRef<PointLight>(null);
  const playingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFrame(({ clock }) => {
    const lid = lidRef.current;
    const L = innerLightRef.current;
    if (L) L.intensity = playingRef.current ? 0.8 : 0;
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
  const pearlBody = 0xf5e6d0;
  const gold = 0xc8a86e;

  const cornerPos: [number, number, number][] = [
    [-0.26, 0.28, 0.19],
    [0.26, 0.28, 0.19],
    [-0.26, 0.28, -0.19],
    [0.26, 0.28, -0.19],
  ];

  return (
    <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'music_box' }}>
      <pointLight
        ref={innerLightRef}
        color={0xffe8c8}
        position={[0, 0.2, 0]}
        intensity={0}
        distance={2}
        decay={2}
      />

      <mesh castShadow position={[0, 0.15, 0]} onClick={handleClick}>
        <boxGeometry args={[0.55, 0.3, 0.4]} />
        <meshStandardMaterial
          color={pearlBody}
          metalness={0.25}
          roughness={0.2}
          emissive={0xf0d8c0}
          emissiveIntensity={0.05}
        />
      </mesh>

      {/* Guldkant bund */}
      <mesh position={[0, 0.01, 0.2]} castShadow>
        <boxGeometry args={[0.57, 0.02, 0.02]} />
        <meshStandardMaterial color={gold} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.01, -0.2]} castShadow>
        <boxGeometry args={[0.57, 0.02, 0.02]} />
        <meshStandardMaterial color={gold} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[-0.275, 0.01, 0]} castShadow>
        <boxGeometry args={[0.02, 0.02, 0.4]} />
        <meshStandardMaterial color={gold} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0.275, 0.01, 0]} castShadow>
        <boxGeometry args={[0.02, 0.02, 0.4]} />
        <meshStandardMaterial color={gold} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Guldkant top */}
      <mesh position={[0, 0.29, 0.2]} castShadow>
        <boxGeometry args={[0.57, 0.02, 0.02]} />
        <meshStandardMaterial color={gold} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.29, -0.2]} castShadow>
        <boxGeometry args={[0.57, 0.02, 0.02]} />
        <meshStandardMaterial color={gold} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[-0.275, 0.29, 0]} castShadow>
        <boxGeometry args={[0.02, 0.02, 0.4]} />
        <meshStandardMaterial color={gold} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0.275, 0.29, 0]} castShadow>
        <boxGeometry args={[0.02, 0.02, 0.4]} />
        <meshStandardMaterial color={gold} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Snirkler forsiden */}
      <mesh position={[0, 0.15, 0.205]} rotation={[0, 0, Math.PI / 4]} castShadow>
        <torusGeometry args={[0.04, 0.006, 6, 12]} />
        <meshStandardMaterial color={gold} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-0.12, 0.15, 0.205]} rotation={[0, 0, -Math.PI / 6]} castShadow>
        <torusGeometry args={[0.03, 0.005, 6, 10]} />
        <meshStandardMaterial color={gold} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.12, 0.15, 0.205]} rotation={[0, 0, Math.PI / 6]} castShadow>
        <torusGeometry args={[0.03, 0.005, 6, 10]} />
        <meshStandardMaterial color={gold} metalness={0.8} roughness={0.2} />
      </mesh>

      {cornerPos.map((p, i) => (
        <mesh key={`corner${i}`} position={p} castShadow>
          <boxGeometry args={[0.03, 0.03, 0.03]} />
          <meshStandardMaterial color={gold} metalness={0.75} roughness={0.25} flatShading />
        </mesh>
      ))}

      <mesh position={[0.285, 0.15, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.06, 6]} />
        <meshStandardMaterial color={gold} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0.32, 0.15, 0]} castShadow>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color={gold} metalness={0.7} roughness={0.3} />
      </mesh>

      <mesh
        ref={lidRef}
        castShadow
        position={[0, 0.32, -0.19]}
        onClick={handleClick}
      >
        <boxGeometry args={[0.53, 0.04, 0.38]} />
        <meshStandardMaterial color={pearl} metalness={0.3} roughness={0.15} />
        <mesh position={[0, 0.02, 0]} scale={[1, 0.5, 1]}>
          <sphereGeometry args={[0.05, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={gold} metalness={0.6} roughness={0.3} />
        </mesh>
      </mesh>
    </group>
  );
});
