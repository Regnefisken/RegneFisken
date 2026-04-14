import { useRef, forwardRef, type ComponentPropsWithoutRef } from 'react';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import { useUIStore } from '../../store/useUIStore.js';

type GroupProps = ComponentPropsWithoutRef<'group'>;

/**
 * Skibskatten Kradse — 3D kat med idle-animation (gå, sidde, sove).
 * Farverne matcher wardrobeItems "Havnekatten Kradse": #6a6050 / #4a4030.
 */
export const CabinCat = forwardRef<Group, GroupProps>(function CabinCat(props, ref) {
  const torsoRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const legFLRef = useRef<Group>(null);
  const legFRRef = useRef<Group>(null);
  const legBLRef = useRef<Group>(null);
  const legBRRef = useRef<Group>(null);
  const tailRef = useRef<Group>(null);
  const roamRef = useRef<Group>(null);

  /** Lokalt offset fra møbel-spawn — katten vandrer inden for denne radius (scene-enheder). */
  const WALK_RADIUS = 2.35;

  const stateRef = useRef<{
    mode: 'idle' | 'walk' | 'sit';
    timer: number;
    walkTime: number;
    walkTarget: { x: number; z: number } | null;
  }>({
    mode: 'idle',
    timer: 2 + Math.random() * 3,
    walkTime: 0,
    walkTarget: null,
  });

  function pickWalkTarget(): { x: number; z: number } {
    const t = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * WALK_RADIUS;
    return { x: Math.cos(t) * r, z: Math.sin(t) * r };
  }

  const bodyColor = 0x6a6050;
  const darkColor = 0x4a4030;
  const eyeColor = 0x66ccff;

  useFrame((_, delta) => {
    const st = stateRef.current;
    const torso = torsoRef.current;
    const head = headRef.current;
    const lfl = legFLRef.current;
    const lfr = legFRRef.current;
    const lbl = legBLRef.current;
    const lbr = legBRRef.current;
    const tail = tailRef.current;
    const roam = roamRef.current;
    if (!torso || !head || !lfl || !lfr || !lbl || !lbr || !tail || !roam) return;

    st.timer -= delta;

    if (st.mode === 'idle') {
      torso.position.y = 0.6 + Math.sin(Date.now() * 0.001) * 0.01;
      head.rotation.z = Math.sin(Date.now() * 0.0005) * 0.03;
      tail.rotation.z = Math.sin(Date.now() * 0.002) * 0.15;
      lfl.rotation.x *= 0.92;
      lfr.rotation.x *= 0.92;
      lbl.rotation.x *= 0.92;
      lbr.rotation.x *= 0.92;

      if (st.timer <= 0) {
        const r = Math.random();
        if (r < 0.4) {
          st.mode = 'walk';
          st.timer = 2 + Math.random() * 3;
          st.walkTarget = pickWalkTarget();
        } else if (r < 0.7) {
          st.mode = 'sit';
          st.timer = 3 + Math.random() * 4;
        } else {
          st.timer = 1 + Math.random() * 2;
        }
      }
    } else if (st.mode === 'walk') {
      st.walkTime += delta;
      const speed = 8;
      const walkAngle = 0.4;
      const t = st.walkTime * speed;
      lfl.rotation.x = Math.sin(t) * walkAngle;
      lfr.rotation.x = Math.sin(t + Math.PI) * walkAngle;
      lbl.rotation.x = Math.sin(t + Math.PI) * walkAngle;
      lbr.rotation.x = Math.sin(t) * walkAngle;
      torso.position.y = 0.6 + Math.abs(Math.sin(t)) * 0.04;
      tail.rotation.z = Math.sin(st.walkTime * 12) * 0.2;
      head.rotation.z = Math.sin(st.walkTime * 1.5) * 0.05;

      const tgt = st.walkTarget;
      if (tgt) {
        const dx = tgt.x - roam.position.x;
        const dz = tgt.z - roam.position.z;
        const dist = Math.hypot(dx, dz);
        const moveSpeed = 0.42;
        if (dist > 0.12) {
          const nx = dx / dist;
          const nz = dz / dist;
          roam.position.x += nx * moveSpeed * delta;
          roam.position.z += nz * moveSpeed * delta;
          roam.rotation.y = Math.atan2(nx, nz);
        } else {
          st.walkTarget = pickWalkTarget();
        }
        const rr = Math.hypot(roam.position.x, roam.position.z);
        if (rr > WALK_RADIUS) {
          const s = WALK_RADIUS / rr;
          roam.position.x *= s;
          roam.position.z *= s;
        }
      }

      if (st.timer <= 0) {
        st.mode = 'idle';
        st.timer = 2 + Math.random() * 3;
        st.walkTime = 0;
        st.walkTarget = null;
      }
    } else if (st.mode === 'sit') {
      torso.position.y = 0.45;
      lbl.rotation.x = -0.6;
      lbr.rotation.x = -0.6;
      lfl.rotation.x = 0.1;
      lfr.rotation.x = 0.1;
      tail.rotation.z = Math.sin(Date.now() * 0.0015) * 0.25;
      head.rotation.z = Math.sin(Date.now() * 0.0008) * 0.04;

      if (st.timer <= 0) {
        st.mode = 'idle';
        st.timer = 1 + Math.random() * 2;
      }
    }
  });

  function handleClick(e: { stopPropagation: () => void }) {
    e.stopPropagation();
    useUIStore.getState().setToastMessage('🐱 Prrrrr...');
  }

  return (
    <group ref={ref} {...props} userData={{ isMovable: true, movableType: 'pirate_cat' }}>
      <group ref={roamRef}>
      <group scale={0.85} onClick={handleClick}>
        <group ref={torsoRef} position={[0, 0.6, 0]}>
          <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 1.0, 16]} />
            <meshStandardMaterial color={bodyColor} roughness={0.8} flatShading />
          </mesh>
          <mesh castShadow position={[0, 0, 0.5]}>
            <sphereGeometry args={[0.2, 16, 12]} />
            <meshStandardMaterial color={bodyColor} roughness={0.8} flatShading />
          </mesh>
          <mesh castShadow position={[0, 0, -0.5]}>
            <sphereGeometry args={[0.2, 16, 12]} />
            <meshStandardMaterial color={bodyColor} roughness={0.8} flatShading />
          </mesh>

          <group ref={headRef} position={[0, 0.18, 0.65]}>
            <mesh castShadow>
              <sphereGeometry args={[0.17, 16, 12]} />
              <meshStandardMaterial color={bodyColor} roughness={0.8} flatShading />
            </mesh>
            <mesh position={[0, -0.04, 0.09]}>
              <sphereGeometry args={[0.12, 12, 8]} />
              <meshStandardMaterial color={darkColor} roughness={0.9} flatShading />
            </mesh>
            <mesh castShadow position={[0.1, 0.14, 0]} rotation={[-0.1, 0, -0.4]}>
              <coneGeometry args={[0.05, 0.16, 8]} />
              <meshStandardMaterial color={darkColor} roughness={0.9} flatShading />
            </mesh>
            <mesh castShadow position={[-0.1, 0.14, 0]} rotation={[-0.1, 0, 0.4]}>
              <coneGeometry args={[0.05, 0.16, 8]} />
              <meshStandardMaterial color={darkColor} roughness={0.9} flatShading />
            </mesh>
            <mesh position={[0.05, 0.04, 0.15]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshStandardMaterial color={eyeColor} roughness={0.2} metalness={0.8} />
            </mesh>
            <mesh position={[-0.05, 0.04, 0.15]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshStandardMaterial color={eyeColor} roughness={0.2} metalness={0.8} />
            </mesh>
            <mesh position={[0, -0.01, 0.17]}>
              <sphereGeometry args={[0.015, 6, 4]} />
              <meshStandardMaterial color={0x332222} roughness={0.6} />
            </mesh>
          </group>

          <group ref={legFLRef} position={[0.1, 0, 0.42]}>
            <mesh castShadow position={[0, -0.28, 0]}>
              <cylinderGeometry args={[0.03, 0.022, 0.55, 8]} />
              <meshStandardMaterial color={darkColor} roughness={0.9} flatShading />
            </mesh>
          </group>
          <group ref={legFRRef} position={[-0.1, 0, 0.42]}>
            <mesh castShadow position={[0, -0.28, 0]}>
              <cylinderGeometry args={[0.03, 0.022, 0.55, 8]} />
              <meshStandardMaterial color={darkColor} roughness={0.9} flatShading />
            </mesh>
          </group>
          <group ref={legBLRef} position={[0.1, 0, -0.42]}>
            <mesh castShadow position={[0, -0.28, 0]}>
              <cylinderGeometry args={[0.03, 0.022, 0.55, 8]} />
              <meshStandardMaterial color={darkColor} roughness={0.9} flatShading />
            </mesh>
          </group>
          <group ref={legBRRef} position={[-0.1, 0, -0.42]}>
            <mesh castShadow position={[0, -0.28, 0]}>
              <cylinderGeometry args={[0.03, 0.022, 0.55, 8]} />
              <meshStandardMaterial color={darkColor} roughness={0.9} flatShading />
            </mesh>
          </group>

          <group ref={tailRef} position={[0, 0.08, -0.55]} rotation={[-Math.PI / 3, 0, 0]}>
            <mesh castShadow position={[0, 0.3, 0]}>
              <cylinderGeometry args={[0.018, 0.03, 0.6, 8]} />
              <meshStandardMaterial color={darkColor} roughness={0.9} flatShading />
            </mesh>
          </group>
        </group>
      </group>
      </group>
    </group>
  );
});
