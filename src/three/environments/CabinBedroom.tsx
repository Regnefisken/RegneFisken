import { useLayoutEffect, useMemo, useRef } from 'react';
import { DoubleSide, MeshStandardMaterial, PointLight } from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/useGameStore.js';
import { cabinDoorHitRef } from '../cabin/cabinDoorRef.js';
import { CabinRoomFurniture } from '../cabin/CabinRoomFurniture.js';

/** Soveværelse: sidevindue (glas + træramme), naturligt lys; flytbare møbler i `CabinRoomFurniture`. */
export function CabinBedroom() {
  const locationId = useGameStore((s) => s.currentLocation);
  const fillLightRef = useRef<PointLight>(null);

  const W = 12;
  const D = 10;
  const H = 5.5;
  const H_BACK = 9.0;
  const ZF = 5;
  const ZB = -5;
  const ROOM_Z_DEPTH = ZF - ZB;
  const FLOOR_DEPTH_Z = (D + 4) * (4 / 3);
  const FLOOR_Z_CENTER = (D + 4) / 6;
  const WALL_Z_FRONT = 4.6 + ROOM_Z_DEPTH / 3;
  const WALL_D = WALL_Z_FRONT - ZB;

  const WIN_W = 1.8;
  const WIN_H = 1.6;
  const winZCenter = -1.05;
  const WIN_Y = H / 2;
  const winY0 = WIN_Y - WIN_H / 2;
  const winY1 = WIN_Y + WIN_H / 2;
  const winZ0 = winZCenter - WIN_W / 2;
  const winZ1 = winZCenter + WIN_W / 2;

  const FRAME_T = 0.068;
  const FRAME_D = 0.28;
  const MULLION_T = 0.03;
  const MULLION_D = 0.04;
  const FRAME_SIDE_LAP = 0.028;
  const FRAME_INNER_H = WIN_H - 2 * FRAME_T;
  const FRAME_SIDE_H = FRAME_INNER_H + 2 * FRAME_SIDE_LAP;

  const frameWoodMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: 0x3e2208,
        roughness: 1,
        metalness: 0,
        flatShading: true,
        polygonOffset: true,
        polygonOffsetFactor: 2,
        polygonOffsetUnits: 2,
      }),
    [],
  );

  useFrame(() => {
    if (locationId !== 'cabin_bedroom') return;
    const phaseName = useGameStore.getState().timePhase.name;
    let fillIntensity = 0.62;
    if (phaseName === 'Nat') fillIntensity = 0.32;
    else if (phaseName === 'Morgen' || phaseName === 'Aften') fillIntensity = 0.48;
    const fillL = fillLightRef.current;
    if (fillL) fillL.intensity = fillIntensity;
  });

  useLayoutEffect(() => {
    return () => {
      frameWoodMat.dispose();
    };
  }, [frameWoodMat]);

  if (locationId !== 'cabin_bedroom') return null;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, FLOOR_Z_CENTER]} receiveShadow>
        <planeGeometry args={[W, FLOOR_DEPTH_Z]} />
        <meshStandardMaterial color={0x5c4033} roughness={0.92} />
      </mesh>

      <mesh position={[0, H_BACK / 2, ZB]} castShadow>
        <boxGeometry args={[W, H_BACK, 0.3]} />
        <meshStandardMaterial color={0x7a5230} roughness={0.88} flatShading />
      </mesh>

      <mesh position={[W / 2, H / 2, (WALL_Z_FRONT + ZB) / 2]} castShadow>
        <boxGeometry args={[0.3, H, WALL_D]} />
        <meshStandardMaterial color={0x7a5230} roughness={0.88} flatShading />
      </mesh>

      <mesh position={[-W / 2, H / 2, (ZB + winZ0) / 2]} castShadow>
        <boxGeometry args={[0.3, H, winZ0 - ZB]} />
        <meshStandardMaterial color={0x7a5230} roughness={0.88} flatShading />
      </mesh>
      <mesh position={[-W / 2, H / 2, (winZ1 + WALL_Z_FRONT) / 2]} castShadow>
        <boxGeometry args={[0.3, H, WALL_Z_FRONT - winZ1]} />
        <meshStandardMaterial color={0x7a5230} roughness={0.88} flatShading />
      </mesh>
      <mesh position={[-W / 2, winY0 / 2, winZCenter]} castShadow>
        <boxGeometry args={[0.3, winY0, WIN_W]} />
        <meshStandardMaterial color={0x7a5230} roughness={0.88} flatShading />
      </mesh>
      <mesh position={[-W / 2, (winY1 + H) / 2, winZCenter]} castShadow>
        <boxGeometry args={[0.3, H - winY1, WIN_W]} />
        <meshStandardMaterial color={0x7a5230} roughness={0.88} flatShading />
      </mesh>

      <pointLight
        color={0xb0d8f0}
        intensity={0.6}
        distance={10}
        decay={2}
        position={[-W / 2 - 0.95, WIN_Y + 0.35, winZCenter]}
      />

      <pointLight
        ref={fillLightRef}
        color={0xffe8d0}
        intensity={0.62}
        distance={16}
        decay={1.6}
        position={[0.8, H - 0.4, FLOOR_Z_CENTER]}
      />

      <pointLight
        color={0xffffff}
        intensity={12}
        distance={50}
        decay={1}
        position={[0.04, 5.27, 10.19]}
        castShadow={false}
      />

      <group
        position={[-W / 2 + 0.02, 0, winZCenter]}
        rotation={[0, Math.PI / 2, 0]}
        userData={{ isMovable: false, movableType: 'window' }}
      >
        <mesh position={[0, WIN_Y, 0.02]}>
          <planeGeometry args={[WIN_W, WIN_H]} />
          <meshStandardMaterial
            color={0x99ccee}
            transparent
            opacity={0.22}
            roughness={0.05}
            depthWrite={false}
            side={DoubleSide}
          />
        </mesh>
        <mesh position={[0, winY1 - FRAME_T / 2, 0]} castShadow material={frameWoodMat}>
          <boxGeometry args={[WIN_W, FRAME_T, FRAME_D]} />
        </mesh>
        <mesh position={[0, winY0 + FRAME_T / 2, 0]} castShadow material={frameWoodMat}>
          <boxGeometry args={[WIN_W, FRAME_T, FRAME_D]} />
        </mesh>
        <mesh position={[-WIN_W / 2 + FRAME_T / 2, WIN_Y, 0]} castShadow material={frameWoodMat}>
          <boxGeometry args={[FRAME_T, FRAME_SIDE_H, FRAME_D]} />
        </mesh>
        <mesh position={[WIN_W / 2 - FRAME_T / 2, WIN_Y, 0]} castShadow material={frameWoodMat}>
          <boxGeometry args={[FRAME_T, FRAME_SIDE_H, FRAME_D]} />
        </mesh>
        <mesh position={[0, WIN_Y, 0]} castShadow material={frameWoodMat}>
          <boxGeometry args={[MULLION_T, FRAME_INNER_H, MULLION_D]} />
        </mesh>
        <mesh position={[0, WIN_Y, 0]} castShadow material={frameWoodMat}>
          <boxGeometry args={[WIN_W - 2 * FRAME_T, MULLION_T, MULLION_D]} />
        </mesh>
      </group>

      <CabinRoomFurniture roomId="bedroom" />

      <mesh
        position={[-3.2, H + 0.8, FLOOR_Z_CENTER]}
        rotation={[0, 0, 0.4]}
        castShadow
        userData={{ skipGroundSnap: true, cabinRoofDecor: true }}
      >
        <boxGeometry args={[8.5, 0.2, FLOOR_DEPTH_Z]} />
        <meshStandardMaterial color={0x4a2f12} roughness={1} flatShading />
      </mesh>
      <mesh
        position={[3.2, H + 0.8, FLOOR_Z_CENTER]}
        rotation={[0, 0, -0.4]}
        castShadow
        userData={{ skipGroundSnap: true, cabinRoofDecor: true }}
      >
        <boxGeometry args={[8.5, 0.2, FLOOR_DEPTH_Z]} />
        <meshStandardMaterial color={0x4a2f12} roughness={1} flatShading />
      </mesh>

      <group
        ref={(node) => {
          cabinDoorHitRef.current = node;
        }}
      >
        <group position={[W / 2 - 0.1, 1.8, 1.5]} scale={[-1, 1, 1]} userData={{ doorTarget: 'cabin_kitchen' }}>
          <mesh position={[-0.05, 0.2, 0]} castShadow>
            <boxGeometry args={[0.35, 4.0, 2.4]} />
            <meshStandardMaterial color={0x3a2010} roughness={0.9} flatShading />
          </mesh>
          <mesh userData={{ isExitDoor: true }} castShadow>
            <boxGeometry args={[0.2, 3.6, 2.0]} />
            <meshStandardMaterial color={0x5a3518} roughness={0.8} flatShading />
          </mesh>
          <mesh position={[0.12, 0, -0.85]} castShadow>
            <sphereGeometry args={[0.1, 8, 6]} />
            <meshStandardMaterial color={0xd4b896} metalness={0.35} roughness={0.55} flatShading />
          </mesh>
        </group>
      </group>
    </group>
  );
}
