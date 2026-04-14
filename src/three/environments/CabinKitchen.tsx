import { useRef } from 'react';
import { DoubleSide, PointLight } from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/useGameStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import { CabinWindowStarfield } from '../cabin/CabinWindowStarfield.js';
import { cabinDoorHitRef } from '../cabin/cabinDoorRef.js';
import { BACKGROUND_Z_BOUNDS } from '../logic/backgroundZBounds.js';
import { CabinRoomFurniture } from '../cabin/CabinRoomFurniture.js';

/** Køkken: samme rum-mål som stuen; langt bagvindue; to døråbninger; flytbare møbler i `CabinRoomFurniture`. */
export function CabinKitchen() {
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
  const WIN_W = 5.75;
  const WIN_H = 2.0;
  const WIN_Y = 3.05;
  const WALL_Z_FRONT = 4.6 + ROOM_Z_DEPTH / 3;
  const WALL_D = WALL_Z_FRONT - ZB;
  const sideW = (W - WIN_W) / 2;
  const topH = H_BACK - (WIN_Y + WIN_H / 2);

  const cabinBg = BACKGROUND_Z_BOUNDS.cabin_kitchen;
  const STAR_PLANE_Z = cabinBg.minZ - 1.5;
  const CAB_REF_Z = 8;
  const WIN_REF_Z = ZB + 0.02;
  const starPlaneScale = (CAB_REF_Z - STAR_PLANE_Z) / (CAB_REF_Z - WIN_REF_Z);

  /** Kælderlem: højre side af gulvet, lidt til venstre for midten af højre tredjedel. */
  const CELLAR_HATCH_X = W / 4;

  useFrame(() => {
    if (locationId !== 'cabin_kitchen') return;
    const phaseName = useGameStore.getState().timePhase.name;
    let fillIntensity = 1.2;
    if (phaseName === 'Nat') fillIntensity = 0.5;
    else if (phaseName === 'Morgen' || phaseName === 'Aften') fillIntensity = 0.9;
    const fillL = fillLightRef.current;
    if (fillL) fillL.intensity = fillIntensity;
  });

  if (locationId !== 'cabin_kitchen') return null;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, FLOOR_Z_CENTER]} receiveShadow>
        <planeGeometry args={[W, FLOOR_DEPTH_Z]} />
        <meshStandardMaterial color={0x5c4033} roughness={0.92} />
      </mesh>

      <mesh position={[-W / 2, H / 2, (WALL_Z_FRONT + ZB) / 2]} castShadow>
        <boxGeometry args={[0.3, H, WALL_D]} />
        <meshStandardMaterial color={0x7a5230} roughness={0.88} flatShading />
      </mesh>
      <mesh position={[W / 2, H / 2, (WALL_Z_FRONT + ZB) / 2]} castShadow>
        <boxGeometry args={[0.3, H, WALL_D]} />
        <meshStandardMaterial color={0x7a5230} roughness={0.88} flatShading />
      </mesh>

      <mesh position={[-(WIN_W / 2 + sideW / 2), H_BACK / 2, ZB]} castShadow>
        <boxGeometry args={[sideW, H_BACK, 0.3]} />
        <meshStandardMaterial color={0x7a5230} roughness={0.88} flatShading />
      </mesh>
      <mesh position={[WIN_W / 2 + sideW / 2, H_BACK / 2, ZB]} castShadow>
        <boxGeometry args={[sideW, H_BACK, 0.3]} />
        <meshStandardMaterial color={0x7a5230} roughness={0.88} flatShading />
      </mesh>
      <mesh position={[0, WIN_Y + WIN_H / 2 + topH / 2, ZB]} castShadow>
        <boxGeometry args={[WIN_W, topH, 0.3]} />
        <meshStandardMaterial color={0x7a5230} roughness={0.88} flatShading />
      </mesh>
      <mesh position={[0, (WIN_Y - WIN_H / 2) / 2, ZB]} castShadow>
        <boxGeometry args={[WIN_W, WIN_Y - WIN_H / 2, 0.3]} />
        <meshStandardMaterial color={0x7a5230} roughness={0.88} flatShading />
      </mesh>

      {/* Lodret midterpille (træ) */}
      <mesh position={[0, WIN_Y, ZB + 0.04]} castShadow>
        <boxGeometry args={[0.14, WIN_H + 0.12, 0.08]} />
        <meshStandardMaterial color={0x3e2208} roughness={1} metalness={0} flatShading />
      </mesh>

      <pointLight
        color={0xa8d8ff}
        intensity={0.78}
        distance={14}
        decay={2}
        position={[0, WIN_Y + 0.35, ZB + 1.05]}
      />

      <pointLight
        ref={fillLightRef}
        color={0xfff0d8}
        intensity={1.2}
        distance={18}
        decay={1.5}
        position={[0, H - 0.3, FLOOR_Z_CENTER]}
      />

      <pointLight
        color={0xffffff}
        intensity={12}
        distance={50}
        decay={1}
        position={[0.04, 5.27, 10.19]}
        castShadow={false}
      />

      <CabinWindowStarfield
        winW={WIN_W * 1.04 * starPlaneScale}
        winH={WIN_H * 1.04 * starPlaneScale}
        winY={WIN_Y}
        planeZ={STAR_PLANE_Z}
      />

      <group position={[0, 0, ZB + 0.02]} userData={{ isMovable: false, movableType: 'window' }}>
        <mesh position={[0, WIN_Y, 0]}>
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
        {[-0.18, 0.18].map((zo) => (
          <group key={zo}>
            <mesh position={[0, WIN_Y, zo]} castShadow>
              <boxGeometry args={[WIN_W + 0.1, 0.1, 0.06]} />
              <meshStandardMaterial color={0x3e2208} roughness={1} metalness={0} flatShading />
            </mesh>
            <mesh position={[0, WIN_Y, zo]} castShadow>
              <boxGeometry args={[0.1, WIN_H + 0.1, 0.06]} />
              <meshStandardMaterial color={0x3e2208} roughness={1} metalness={0} flatShading />
            </mesh>
            <mesh position={[0, WIN_Y + WIN_H / 2 + 0.07, zo]} castShadow>
              <boxGeometry args={[WIN_W + 0.25, 0.1, 0.06]} />
              <meshStandardMaterial color={0x3e2208} roughness={1} metalness={0} flatShading />
            </mesh>
            <mesh position={[0, WIN_Y - WIN_H / 2 - 0.07, zo]} castShadow>
              <boxGeometry args={[WIN_W + 0.25, 0.1, 0.06]} />
              <meshStandardMaterial color={0x3e2208} roughness={1} metalness={0} flatShading />
            </mesh>
            <mesh position={[-WIN_W / 2 - 0.07, WIN_Y, zo]} castShadow>
              <boxGeometry args={[0.1, WIN_H + 0.25, 0.06]} />
              <meshStandardMaterial color={0x3e2208} roughness={1} metalness={0} flatShading />
            </mesh>
            <mesh position={[WIN_W / 2 + 0.07, WIN_Y, zo]} castShadow>
              <boxGeometry args={[0.1, WIN_H + 0.25, 0.06]} />
              <meshStandardMaterial color={0x3e2208} roughness={1} metalness={0} flatShading />
            </mesh>
          </group>
        ))}
      </group>

      <CabinRoomFurniture roomId="kitchen" />

      {/* Kælderlem — synlig fra dag 1, låst (mangler håndtag) */}
      <group
        position={[CELLAR_HATCH_X, 0.025, FLOOR_Z_CENTER]}
        onClick={(e) => {
          e.stopPropagation();
          useUIStore.getState().setToastMessage('🔒 Kælderlemmen sidder fast — der mangler et håndtag!');
        }}
        userData={{ isMovable: false }}
      >
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[1.5, 1.0]} />
          <meshStandardMaterial color={0x3a2010} roughness={0.92} />
        </mesh>
        {[
          { pos: [0, 0, -0.5] as [number, number, number], args: [1.54, 0.04, 0.04] as [number, number, number] },
          { pos: [0, 0, 0.5] as [number, number, number], args: [1.54, 0.04, 0.04] as [number, number, number] },
          { pos: [-0.75, 0, 0] as [number, number, number], args: [0.04, 0.04, 1.04] as [number, number, number] },
          { pos: [0.75, 0, 0] as [number, number, number], args: [0.04, 0.04, 1.04] as [number, number, number] },
        ].map((edge, i) => (
          <mesh key={i} position={edge.pos} castShadow>
            <boxGeometry args={edge.args} />
            <meshStandardMaterial color={0x1a1008} roughness={0.95} metalness={0.1} flatShading />
          </mesh>
        ))}
        {[-0.5, 0.5].map((xOff) => (
          <mesh key={xOff} position={[xOff, 0.01, -0.5]} castShadow>
            <boxGeometry args={[0.12, 0.02, 0.08]} />
            <meshStandardMaterial color={0x555555} metalness={0.7} roughness={0.4} flatShading />
          </mesh>
        ))}
        <mesh position={[0, 0.015, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.04, 0.07, 12]} />
          <meshStandardMaterial color={0x1a0a05} roughness={1} />
        </mesh>
      </group>

      <mesh position={[-3.2, H + 0.8, FLOOR_Z_CENTER]} rotation={[0, 0, 0.4]} castShadow>
        <boxGeometry args={[8.5, 0.2, FLOOR_DEPTH_Z]} />
        <meshStandardMaterial color={0x4a2f12} roughness={1} flatShading />
      </mesh>
      <mesh position={[3.2, H + 0.8, FLOOR_Z_CENTER]} rotation={[0, 0, -0.4]} castShadow>
        <boxGeometry args={[8.5, 0.2, FLOOR_DEPTH_Z]} />
        <meshStandardMaterial color={0x4a2f12} roughness={1} flatShading />
      </mesh>

      <group
        ref={(node) => {
          cabinDoorHitRef.current = node;
        }}
      >
        {/* Venstre væg → soveværelse */}
        <group position={[-W / 2 + 0.1, 1.8, 1.5]} userData={{ doorTarget: 'cabin_bedroom' }}>
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
        {/* Højre væg → stue (spejlvendt) */}
        <group position={[W / 2 - 0.1, 1.8, 1.5]} scale={[-1, 1, 1]} userData={{ doorTarget: 'cabin_living' }}>
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
