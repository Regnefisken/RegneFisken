import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactElement,
  type RefObject,
} from 'react';
import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  PointLight,
  Quaternion,
  RepeatWrapping,
  Vector3,
} from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore } from '../../store/useGameStore.js';
import { usePlayerStore } from '../../store/usePlayerStore.js';
import { useCollectionStore } from '../../store/useCollectionStore.js';
import { GiantLandTurtle } from '../models/GiantLandTurtle.js';
import { GoldenFrog } from '../models/GoldenFrog.js';
import { AxolotlCatchModel } from '../models/bossCatchMiniModels.js';
import { CabinRodWall } from '../cabin/CabinRodWall.js';
import { cabinMovableRoots } from '../cabin/cabinMovablesRef.js';
import { applyFurniturePositions } from '../cabin/cabinFurniturePersistence.js';
import {
  isCompanionVisibleInRoom,
  isShopFurnitureVisibleInRoom,
} from '../../logic/furnitureVisibility.js';
import { getFurnitureSpawnTransform } from '../../logic/furnitureRoomSpawn.js';
import type { RoomId } from '../../data/furnitureShopItems.js';
import { MountedFishFurniture } from '../cabin/furniture/MountedFishFurniture.js';
import { WinnerTrophyFurniture } from '../cabin/furniture/WinnerTrophyFurniture.js';
import {
  GulvplanteFurniture,
  KitchenLampFurniture,
  KitchenRugFurniture,
  KitchenShelfFurniture,
  KitchenSinkFurniture,
  KitchenStoveFurniture,
  KitchenTableFurniture,
  KitchenTelescopeFurniture,
} from '../cabin/furniture/KitchenFurniture.js';
import {
  BedroomBedFurniture,
  BedroomDresserFurniture,
  BedroomFrameFurniture,
  BedroomLampFurniture,
  BedroomMirrorFurniture,
  BedroomNightstandFurniture,
  BedroomRugFurniture,
  BedroomWardrobeFurniture,
  CrystalFurniture,
} from '../cabin/furniture/BedroomFurniture.js';
import { PirateChestFurniture } from '../cabin/furniture/PirateChestFurniture.js';
import { IceCubeFurniture } from '../cabin/furniture/IceCubeFurniture.js';
import { MusicBoxFurniture } from '../cabin/furniture/MusicBoxFurniture.js';
import { CabinCat } from '../cabin/CabinCat.js';

const COAL_COLORS = [0xff4500, 0xff8c00, 0xffd700, 0xb22222];
const FLAME_COLORS = [0xff4500, 0xff8c00, 0xffd700];

function useRugMaterial() {
  return useMemo(() => {
    const rugCanvas = document.createElement('canvas');
    rugCanvas.width = 512;
    rugCanvas.height = 512;
    const rugCtx = rugCanvas.getContext('2d');
    if (!rugCtx) return new MeshStandardMaterial({ roughness: 1, metalness: 0, color: 0xc8a87a });
    rugCtx.fillStyle = '#c8a87a';
    rugCtx.fillRect(0, 0, 512, 512);
    rugCtx.fillStyle = '#7a0000';
    const sw = 28;
    const sp = 72;
    for (let x = 0; x < 512; x += sp) rugCtx.fillRect(x, 0, sw, 512);
    rugCtx.strokeStyle = '#2e1a0e';
    rugCtx.lineWidth = 52;
    rugCtx.strokeRect(0, 0, 512, 512);
    const tex = new CanvasTexture(rugCanvas);
    tex.wrapS = RepeatWrapping;
    tex.wrapT = RepeatWrapping;
    return new MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0 });
  }, []);
}

function CabinBookshelf() {
  const shelfMat = { color: 0x5a3010, roughness: 0.85, flatShading: true as const };
  const bookColors = [0xcc2222, 0x2244cc, 0x228833, 0xaa6622, 0x882288, 0x336666];
  const counts = [6, 7, 5];
  return (
    <group>
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[2.4, 3.0, 0.12]} />
        <meshStandardMaterial {...shelfMat} />
      </mesh>
      {[0, 1, 2].map((s) => {
        const shelfY = 0.7 + s * 1.1;
        const n = counts[s] ?? 6;
        let xPos = -0.9;
        const books: ReactElement[] = [];
        for (let b = 0; b < n; b++) {
          const bH = 0.5 + ((s * 17 + b * 13) % 30) / 100;
          const bW = 0.12 + ((s * 11 + b * 7) % 10) / 100;
          const col = bookColors[(s * 5 + b) % bookColors.length];
          books.push(
            <mesh
              key={`${s}-${b}`}
              position={[xPos + bW / 2, shelfY + bH / 2 + 0.045, 0.18]}
              castShadow
            >
              <boxGeometry args={[bW, bH, 0.2]} />
              <meshStandardMaterial color={col} roughness={0.9} flatShading />
            </mesh>,
          );
          xPos += bW + 0.06;
        }
        return (
          <group key={s}>
            <mesh position={[0, shelfY, 0.1]} castShadow>
              <boxGeometry args={[2.3, 0.08, 0.3]} />
              <meshStandardMaterial {...shelfMat} />
            </mesh>
            {books}
          </group>
        );
      })}
    </group>
  );
}

/** Flad trekant-halefinne i xy-plan, synlig fra begge sider. */
function useTailFinGeometry() {
  const geo = useMemo(() => {
    const g = new BufferGeometry();
    const v = new Float32Array([
      0, 0, 0,
      -0.08, 0.06, 0,
      -0.08, -0.06, 0,
      0, 0, 0,
      -0.08, -0.06, 0,
      -0.08, 0.06, 0,
    ]);
    g.setAttribute('position', new BufferAttribute(v, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  return geo;
}

/** Retvinklet rygfinne-trekant: lodret forkant, skrå bagkant. Synlig fra begge sider. */
function useDorsalFinGeometry() {
  const geo = useMemo(() => {
    const g = new BufferGeometry();
    const v = new Float32Array([
      -0.03, 0.065, 0,
      -0.03, -0.02, 0.005,
      0.045, -0.02, 0.005,
      -0.03, 0.065, 0,
      0.045, -0.02, -0.005,
      -0.03, -0.02, -0.005,
    ]);
    g.setAttribute('position', new BufferAttribute(v, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  return geo;
}

/** Lavpoly guldfisk — krop, hale, finner, øje (ikke bare ellipsoide). */
function CabinAquariumFish() {
  const root = useRef<Group>(null);
  const dorsalGeo = useDorsalFinGeometry();
  const tailGeo = useTailFinGeometry();
  useFrame(({ clock }) => {
    const g = root.current;
    if (!g) return;
    const t = clock.elapsedTime;
    g.rotation.y = 0.38 + Math.sin(t * 0.75) * 0.14;
    g.position.x = 0.26 + Math.sin(t * 0.45) * 0.035;
    g.position.y = 1.78 + Math.sin(t * 0.9) * 0.018;
  });
  const skin = 0xff6a1a;
  const deep = 0xd94e0a;
  const matRef = (m: MeshStandardMaterial | null) => {
    if (m) m.userData.envMapIntensityOverride = 0;
  };
  return (
    <group ref={root} position={[0.26, 1.78, -0.22]}>
      <mesh castShadow scale={[1.22, 0.74, 0.56]}>
        <sphereGeometry args={[0.088, 10, 8]} />
        <meshStandardMaterial
          color={skin}
          emissive={skin}
          emissiveIntensity={0.6}
          roughness={0.52}
          flatShading
          ref={matRef}
        />
      </mesh>
      <mesh position={[-0.1, 0.005, 0]} castShadow geometry={tailGeo}>
        <meshStandardMaterial color={deep} emissive={deep} emissiveIntensity={0.5} roughness={0.55} flatShading ref={matRef} />
      </mesh>
      <mesh position={[0, 0.055, 0]} castShadow geometry={dorsalGeo}>
        <meshStandardMaterial color={deep} emissive={deep} emissiveIntensity={0.5} roughness={0.55} flatShading ref={matRef} />
      </mesh>
      <mesh position={[0.045, -0.018, 0.055]} castShadow rotation={[0.55, 0.35, 0.25]}>
        <boxGeometry args={[0.038, 0.055, 0.014]} />
        <meshStandardMaterial color={deep} emissive={deep} emissiveIntensity={0.5} roughness={0.55} flatShading ref={matRef} />
      </mesh>
      <mesh position={[0.045, -0.018, -0.055]} castShadow rotation={[-0.55, -0.35, 0.25]}>
        <boxGeometry args={[0.038, 0.055, 0.014]} />
        <meshStandardMaterial color={deep} emissive={deep} emissiveIntensity={0.5} roughness={0.55} flatShading ref={matRef} />
      </mesh>
      {/* Ens øjne: samme radius på +z og −z (undgå perspektiv/“stort nyt øje”). */}
      <mesh position={[0.072, 0.022, 0.042]}>
        <sphereGeometry args={[0.017, 8, 6]} />
        <meshStandardMaterial color={0xfff8f0} roughness={0.35} flatShading ref={matRef} />
      </mesh>
      <mesh position={[0.081, 0.022, 0.047]}>
        <sphereGeometry args={[0.0075, 6, 5]} />
        <meshBasicMaterial color={0x1a1a1a} />
      </mesh>
      <mesh position={[0.072, 0.022, -0.042]}>
        <sphereGeometry args={[0.017, 8, 6]} />
        <meshStandardMaterial color={0xfff8f0} roughness={0.35} flatShading ref={matRef} />
      </mesh>
      <mesh position={[0.081, 0.022, -0.047]}>
        <sphereGeometry args={[0.0075, 6, 5]} />
        <meshBasicMaterial color={0x1a1a1a} />
      </mesh>
    </group>
  );
}

function CabinAquarium() {
  const glass = useMemo(
    () => ({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.1,
      roughness: 0.08,
      metalness: 0,
      depthWrite: false,
    }),
    [],
  );
  /* Ydre sider som roterede planer (yz) ved x=±0,9 — undgår “glas midt i tanken” ved forkert box-akse. */
  const bubPos: { x: number; y: number; z: number }[] = [
    { x: -0.6, y: 1.52, z: -0.2 },
    { x: -0.35, y: 1.68, z: 0.15 },
    { x: 0.5, y: 1.56, z: -0.1 },
    { x: -0.15, y: 1.85, z: 0.25 },
    { x: 0.65, y: 1.74, z: -0.25 },
    { x: -0.55, y: 1.92, z: 0.05 },
  ];
  return (
    <group>
      <mesh position={[0, 1.386, 0]} castShadow>
        <boxGeometry args={[1.8, 0.08, 0.9]} />
        <meshStandardMaterial
          color={0x2255aa}
          roughness={0.5}
          emissive={0x2255aa}
          emissiveIntensity={0.7}
        />
      </mesh>
      <mesh position={[0, 1.815, 0.45]} castShadow>
        <boxGeometry args={[1.8, 0.8, 0.05]} />
        <meshStandardMaterial {...glass} />
      </mesh>
      <mesh position={[0, 1.815, -0.45]} castShadow>
        <boxGeometry args={[1.8, 0.8, 0.05]} />
        <meshStandardMaterial {...glass} />
      </mesh>
      <mesh position={[-0.9, 1.815, 0]} castShadow>
        <boxGeometry args={[0.05, 0.8, 0.9]} />
        <meshStandardMaterial {...glass} />
      </mesh>
      <mesh position={[0.9, 1.815, 0]} castShadow>
        <boxGeometry args={[0.05, 0.8, 0.9]} />
        <meshStandardMaterial {...glass} />
      </mesh>
      <mesh position={[0, 2.24, 0]} castShadow>
        <boxGeometry args={[1.78, 0.05, 0.9]} />
        <meshStandardMaterial {...glass} />
      </mesh>
      <mesh position={[0, 1.8, 0]}>
        <boxGeometry args={[1.75, 0.72, 0.85]} />
        <meshStandardMaterial
          color={0x2266aa}
          transparent
          opacity={0.22}
          roughness={0.35}
          metalness={0}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, 0.682, 0]} castShadow>
        <boxGeometry args={[1.9, 1.25, 1.0]} />
        <meshStandardMaterial color={0x3e2208} roughness={0.9} flatShading />
      </mesh>
      {bubPos.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[0.04, 6, 5]} />
          <meshBasicMaterial color={0xaaddff} transparent opacity={0.7} depthWrite={false} />
        </mesh>
      ))}
      <CabinAquariumFish />
    </group>
  );
}

function CabinTableVase() {
  const vaseMat = {
    color: 0x88ccff,
    transparent: true,
    opacity: 0.5,
    flatShading: true as const,
    side: DoubleSide,
  };
  const stemMat = { color: 0x228b22, flatShading: true as const };
  return (
    <group scale={0.2}>
      <mesh position={[0, 1.25, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.3, 2.5, 6, 1, true]} />
        <meshStandardMaterial {...vaseMat} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <circleGeometry args={[0.3, 6]} />
        <meshStandardMaterial {...vaseMat} />
      </mesh>
      <group position={[0.05, 0.5, 0]} rotation={[0, 0, -0.08]}>
        <mesh position={[0, 1.5, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 3, 4]} />
          <meshStandardMaterial {...stemMat} />
        </mesh>
        <mesh position={[0, 3.3, 0]} rotation={[0, 0, Math.PI]} castShadow>
          <coneGeometry args={[0.35, 0.8, 5]} />
          <meshStandardMaterial color={0xffd700} flatShading />
        </mesh>
      </group>
      <group position={[-0.05, 0.4, 0]} rotation={[0, 0, 0.1]}>
        <mesh position={[0, 1.5, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 3, 4]} />
          <meshStandardMaterial {...stemMat} />
        </mesh>
        <mesh position={[0, 3.3, 0]} castShadow>
          <sphereGeometry args={[0.4, 6, 6]} />
          <meshStandardMaterial color={0x1e90ff} flatShading />
        </mesh>
      </group>
    </group>
  );
}

const _holeZ = new Vector3(0, 0, 1);

/** Position + orientation for a hole circle on a pentagonal frustum face. */
function cheeseSideHolePlacement(
  rTop: number,
  rBot: number,
  cylH: number,
  halfH: number,
  faceTheta: number,
  y: number,
) {
  const dTheta = Math.PI / 5;
  const loA = faceTheta - dTheta;
  const hiA = faceTheta + dTheta;

  const t = (y + halfH) / cylH;
  const rAtY = rBot + (rTop - rBot) * t;

  const lx = rAtY * Math.sin(loA);
  const lz = rAtY * Math.cos(loA);
  const rx = rAtY * Math.sin(hiA);
  const rz = rAtY * Math.cos(hiA);

  const cx = (lx + rx) * 0.5;
  const cz = (lz + rz) * 0.5;

  const tlx = rTop * Math.sin(loA);
  const tlz = rTop * Math.cos(loA);
  const thx = rTop * Math.sin(hiA);
  const thz = rTop * Math.cos(hiA);
  const blx = rBot * Math.sin(loA);
  const blz = rBot * Math.cos(loA);

  const e1x = thx - tlx;
  const e1z = thz - tlz;
  const e2x = blx - tlx;
  const e2y = -cylH;
  const e2z = blz - tlz;

  let nx = -e1z * e2y;
  let ny = e1z * e2x - e1x * e2z;
  let nz = e1x * e2y;
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
  nx /= len;
  ny /= len;
  nz /= len;

  const radLen = Math.sqrt(cx * cx + cz * cz) || 1;
  if (nx * (cx / radLen) + nz * (cz / radLen) < 0) {
    nx = -nx;
    ny = -ny;
    nz = -nz;
  }

  const eps = 0.0004;
  const position = new Vector3(cx + nx * eps, y + ny * eps, cz + nz * eps);
  const normal = new Vector3(nx, ny, nz);
  const quaternion = new Quaternion().setFromUnitVectors(_holeZ, normal);
  return { position, quaternion };
}

function CabinCheese() {
  const holeSegments = 32;
  const holeMaterialProps = {
    color: 0xd4a830 as const,
    roughness: 0.88,
    metalness: 0,
    envMapIntensity: 0,
    polygonOffset: true as const,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  };

  const rTop = 0.18;
  const rLid = rTop * 1.006;
  const rBot = 0.22;
  const cylH = 0.18;
  const halfH = cylH / 2;
  const a = Math.PI / 5;

  const maxHoleCenterY = (r: number) => halfH - r - 0.004;

  const sideHoleDefs = [
    { theta: a, y: 0.032, r: 0.038 },
    { theta: -a, y: 0.045, r: 0.04 },
    { theta: 3 * a, y: -0.016, r: 0.026 },
    { theta: Math.PI, y: 0.026, r: 0.033 },
    { theta: -3 * a, y: 0.008, r: 0.031 },
  ].map((d) => ({ ...d, y: Math.min(d.y, maxHoleCenterY(d.r)) }));

  const topHole = { x: 0.024, z: -0.023, r: 0.034 };

  const cheeseBodyProps = {
    color: 0xf4c842 as const,
    roughness: 0.92,
    metalness: 0,
    envMapIntensity: 0,
  };

  return (
    <group scale={2.5}>
      <mesh castShadow>
        <cylinderGeometry args={[rTop, rBot, cylH, 5, 1, true]} />
        <meshStandardMaterial {...cheeseBodyProps} />
      </mesh>
      <mesh
        castShadow
        position={[0, halfH + 0.00012, 0]}
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
      >
        <circleGeometry args={[rLid, 5]} />
        <meshStandardMaterial {...cheeseBodyProps} />
      </mesh>
      {sideHoleDefs.map((def, i) => {
        const { position, quaternion } = cheeseSideHolePlacement(
          rTop,
          rBot,
          cylH,
          halfH,
          def.theta,
          def.y,
        );
        return (
          <mesh
            key={`side-${i}`}
            position={[position.x, position.y, position.z]}
            quaternion={quaternion}
          >
            <circleGeometry args={[def.r, holeSegments]} />
            <meshStandardMaterial {...holeMaterialProps} />
          </mesh>
        );
      })}
      <mesh
        position={[topHole.x, halfH + 0.00015, topHole.z]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[topHole.r, holeSegments]} />
        <meshStandardMaterial {...holeMaterialProps} />
      </mesh>
    </group>
  );
}

/** Samme mesh som fangst-modellen; skaleret så bord-størrelse matcher tidligere hytte-look. */
function CabinAxolotl() {
  return (
    <group scale={0.292} rotation={[-0.07, Math.PI / 3, 0]}>
      <AxolotlCatchModel animated={false} />
    </group>
  );
}

/** Flytbare møbler for ét hytterum (stue/køkken/soveværelse) — bruges af FishingCabin/CabinKitchen/CabinBedroom. */
export function CabinRoomFurniture({ roomId }: { roomId: RoomId }) {
  const furnitureMode = useGameStore((s) => s.furnitureMode);
  const furniturePositions = usePlayerStore((s) => s.furniturePositions);
  const unlockedFurniture = usePlayerStore((s) => s.unlockedFurniture);
  const furnitureRoomAssignment = usePlayerStore((s) => s.furnitureRoomAssignment);
  const hiddenFurniture = usePlayerStore((s) => s.hiddenFurniture);
  const { camera } = useThree();
  const questItems = usePlayerStore((s) => s.questItems);
  const cheeseSources = usePlayerStore((s) => s.cheeseSources);
  const hasAxolotlInCabin = questItems.includes('has_axolotl');
  const hasGoldenFrog = useCollectionStore((s) => s.hasGoldenFrog);
  const crystalFound = usePlayerStore((s) => s.stats.crystalFound);

  const hasTurtle = questItems.includes('turtle_hatched');
  const showCheese = cheeseSources.includes('shop') || cheeseSources.length >= 3;

  const vis = (type: string) =>
    isShopFurnitureVisibleInRoom(
      type,
      roomId,
      unlockedFurniture,
      furnitureRoomAssignment,
      hiddenFurniture,
    );
  const comp = (type: string, ok: boolean) =>
    isCompanionVisibleInRoom(type, roomId, ok, furnitureRoomAssignment, hiddenFurniture);

  const fireplaceRef = useRef<Group>(null);
  const flameGroupRef = useRef<Group>(null);
  const fireLightRef = useRef<PointLight>(null);
  const rugMat = useRugMaterial();

  const tableRef = useRef<Group>(null);
  const rugRef = useRef<Group>(null);
  const chairRef = useRef<Group>(null);
  const aquariumRef = useRef<Group>(null);
  const shelfRef = useRef<Group>(null);
  const rodWallRef = useRef<Group>(null);
  const turtleRef = useRef<Group>(null);
  const axolotlRef = useRef<Group>(null);
  const vaseRef = useRef<Group>(null);
  const cheeseRef = useRef<Group>(null);
  const frogRef = useRef<Group>(null);
  const mountedFishRef = useRef<Group>(null);
  const winnerTrophyRef = useRef<Group>(null);

  const kitchenTableRef = useRef<Group>(null);
  const gulvplanteRef = useRef<Group>(null);
  const kitchenStoveRef = useRef<Group>(null);
  const kitchenSinkRef = useRef<Group>(null);
  const kitchenShelfRef = useRef<Group>(null);
  const kitchenRugRef = useRef<Group>(null);
  const kitchenLampRef = useRef<Group>(null);
  const kitchenTelescopeRef = useRef<Group>(null);

  const bedroomBedRef = useRef<Group>(null);
  const bedroomNightstandRef = useRef<Group>(null);
  const bedroomDresserRef = useRef<Group>(null);
  const bedroomLampRef = useRef<Group>(null);
  const bedroomRugRef = useRef<Group>(null);
  const bedroomFrameRef = useRef<Group>(null);
  const bedroomMirrorRef = useRef<Group>(null);
  const bedroomWardrobeRef = useRef<Group>(null);

  const pirateChestRef = useRef<Group>(null);
  const iceCubeRef = useRef<Group>(null);
  const musicBoxRef = useRef<Group>(null);
  const pirateCatRef = useRef<Group>(null);
  const crystalRef = useRef<Group>(null);

  const unlockedCompanions = useCollectionStore((s) => s.unlockedCompanions);
  const hasPirateCat = unlockedCompanions.includes('pirate_cat');

  const coalData = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        col: COAL_COLORS[i % COAL_COLORS.length]!,
        x: ((i * 47) % 100) / 100 - 0.5,
        y: 0.2 + ((i * 31) % 14) / 100,
        z: 0.08 + ((i * 53) % 22) / 100,
        s: ((i * 19) % 55) / 100 + 0.45,
      })),
    [],
  );

  const flameData = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        col: FLAME_COLORS[i % 3]!,
        x: ((i * 41) % 110) / 100 - 0.55,
        y: 0.55 + ((i * 29) % 65) / 100,
        z: 0.12,
        sy: ((i * 37) % 150) / 100 + 0.8,
        sx: ((i * 23) % 50) / 100 + 0.4,
        speed: ((i * 13) % 20) / 1000 + 0.008,
        offset: ((i * 17) % 628) / 100,
        ry: ((i * 59) % 314) / 100,
      })),
    [],
  );

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    flameGroupRef.current?.traverse((obj) => {
      if (!(obj instanceof Mesh) || !obj.userData?.isFlame) return;
      const ud = obj.userData as { baseY: number; speed: number; offset: number };
      obj.position.y = ud.baseY + Math.sin(time * ud.speed * 100 + ud.offset) * 0.25;
      obj.scale.x = 0.4 + Math.sin(time * ud.speed * 80 + ud.offset) * 0.15;
    });
    const L = fireLightRef.current;
    if (L) L.intensity = 2.5 + Math.sin(time * 3) * 0.7;

    const ct = turtleRef.current;
    if (hasTurtle && ct && !furnitureMode) {
      const ud = ct.userData as { _savedY?: number };
      const baseY = ud._savedY ?? ct.position.y;
      if (ud._savedY === undefined) ud._savedY = ct.position.y;
      ct.position.y = baseY + Math.sin(Date.now() / 500) * 0.008;
      const camDirX = camera.position.x - ct.position.x;
      const camDirZ = camera.position.z - ct.position.z;
      const targetAngle = Math.atan2(camDirX, camDirZ);
      let diff = targetAngle - ct.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      ct.rotation.y += diff * 0.015;
      const cHead = ct.getObjectByName('turtleHead');
      if (cHead) {
        cHead.rotation.x = Math.sin(time * 0.35) * 0.1 - 0.03;
        cHead.rotation.y = Math.sin(time * 0.2) * 0.12;
        cHead.rotation.z = Math.sin(time * 0.15) * 0.03;
      }
    }
  });

  function rebuildMovableList() {
    const list: Group[] = [];
    const push = (r: RefObject<Group | null>) => {
      if (r.current) list.push(r.current);
    };
    if (vis('fireplace')) push(fireplaceRef);
    if (vis('table')) push(tableRef);
    if (vis('rug')) push(rugRef);
    if (vis('chair')) push(chairRef);
    if (vis('aquarium')) push(aquariumRef);
    if (vis('shelf')) push(shelfRef);
    if (vis('rod_wall')) push(rodWallRef);
    if (vis('mounted_fish')) push(mountedFishRef);
    if (vis('winner_trophy')) push(winnerTrophyRef);
    if (comp('turtle', hasTurtle)) push(turtleRef);
    if (comp('axolotl', hasAxolotlInCabin)) push(axolotlRef);
    if (vis('table_vase')) push(vaseRef);
    if (comp('cheese', showCheese)) push(cheeseRef);
    if (comp('golden_frog', hasGoldenFrog)) push(frogRef);
    if (vis('kitchen_table')) push(kitchenTableRef);
    if (vis('gulvplante')) push(gulvplanteRef);
    if (vis('kitchen_stove')) push(kitchenStoveRef);
    if (vis('kitchen_sink')) push(kitchenSinkRef);
    if (vis('kitchen_shelf')) push(kitchenShelfRef);
    if (vis('kitchen_rug')) push(kitchenRugRef);
    if (vis('kitchen_lamp')) push(kitchenLampRef);
    if (vis('kitchen_telescope')) push(kitchenTelescopeRef);
    if (vis('bedroom_bed')) push(bedroomBedRef);
    if (vis('bedroom_nightstand')) push(bedroomNightstandRef);
    if (vis('bedroom_dresser')) push(bedroomDresserRef);
    if (vis('bedroom_lamp')) push(bedroomLampRef);
    if (vis('bedroom_rug')) push(bedroomRugRef);
    if (vis('bedroom_frame')) push(bedroomFrameRef);
    if (vis('bedroom_mirror')) push(bedroomMirrorRef);
    if (vis('bedroom_wardrobe')) push(bedroomWardrobeRef);
    if (vis('pirate_chest')) push(pirateChestRef);
    if (vis('ice_cube')) push(iceCubeRef);
    if (vis('music_box')) push(musicBoxRef);
    if (comp('pirate_cat', hasPirateCat)) push(pirateCatRef);
    if (comp('ur_krystal', crystalFound)) push(crystalRef);
    cabinMovableRoots.current = list;
  }

  useLayoutEffect(() => {
    rebuildMovableList();
    applyFurniturePositions(cabinMovableRoots.current, furniturePositions);
    return () => {
      cabinMovableRoots.current = [];
    };
  }, [
    roomId,
    furniturePositions,
    hasTurtle,
    hasAxolotlInCabin,
    showCheese,
    hasGoldenFrog,
    hasPirateCat,
    crystalFound,
    unlockedFurniture,
    furnitureRoomAssignment,
    hiddenFurniture,
  ]);

  const sp = (type: string) => getFurnitureSpawnTransform(type, roomId, furniturePositions);

  return (
    <group>
      {vis('fireplace') && (
      <group
        ref={fireplaceRef}
        position={sp('fireplace').pos}
        rotation={[0, sp('fireplace').rotY, 0]}
        userData={{ isMovable: true, movableType: 'fireplace' }}
      >
        {Array.from({ length: 5 }, (_, i) => i - 2).map((i) => (
          <mesh
            key={`fb-${i}`}
            position={[i * 0.55, 0.14, 0.4]}
            rotation={[0, (i * 0.04) % 0.08 - 0.04, (i * 0.02) % 0.04 - 0.02]}
            castShadow
          >
            <boxGeometry args={[0.52, 0.24, 0.36]} />
            <meshStandardMaterial color={0x888888} flatShading roughness={0.9} />
          </mesh>
        ))}
        {Array.from({ length: 7 }, (_, y) => y + 1).flatMap((y) =>
          [-1, 1].map((side) => (
            <mesh
              key={`col-${y}-${side}`}
              position={[side * 1.32, y * 0.26, 0]}
              rotation={[0, ((y + side) * 0.05) % 0.08 - 0.04, ((y + side) * 0.03) % 0.04 - 0.02]}
              castShadow
            >
              <boxGeometry args={[0.52, 0.24, 0.36]} />
              <meshStandardMaterial color={0x888888} flatShading roughness={0.9} />
            </mesh>
          )),
        )}
        {Array.from({ length: 5 }, (_, i) => i - 2).map((i) => (
          <mesh key={`top-${i}`} position={[i * 0.55, 8 * 0.26, 0]} rotation={[0, ((i * 0.07) % 0.08) - 0.04, 0]} castShadow>
            <boxGeometry args={[0.52, 0.24, 0.36]} />
            <meshStandardMaterial color={0x5a4a45} flatShading roughness={0.9} />
          </mesh>
        ))}
        <mesh position={[0, 8 * 0.26 + 0.16, 0.04]} castShadow>
          <boxGeometry args={[3.2, 0.17, 0.48]} />
          <meshStandardMaterial color={0x4a2f12} roughness={0.75} flatShading />
        </mesh>
        <mesh position={[0, 1.1, -0.15]} castShadow>
          <boxGeometry args={[2.6, 2.1, 0.12]} />
          <meshStandardMaterial color={0x1a0d05} roughness={1} flatShading />
        </mesh>
        <mesh position={[0, 0.12, 0.1]} castShadow>
          <boxGeometry args={[2.6, 0.1, 0.7]} />
          <meshStandardMaterial color={0x1a0d05} roughness={1} flatShading />
        </mesh>
        <mesh position={[-1.04, 1.0, 0.22]} rotation={[0, 0.26, 0]} castShadow>
          <boxGeometry args={[0.18, 1.8, 0.7]} />
          <meshStandardMaterial color={0x2a1a10} roughness={1} flatShading />
        </mesh>
        <mesh position={[1.04, 1.0, 0.22]} rotation={[0, -0.26, 0]} castShadow>
          <boxGeometry args={[0.18, 1.8, 0.7]} />
          <meshStandardMaterial color={0x2a1a10} roughness={1} flatShading />
        </mesh>
        {coalData.map((c, i) => (
          <mesh key={`coal-${i}`} position={[c.x * 1.5, c.y, c.z]} scale={[c.s, c.s, c.s]} castShadow>
            <dodecahedronGeometry args={[0.11, 0]} />
            <meshStandardMaterial
              color={c.col}
              emissive={c.col}
              emissiveIntensity={0.55 + (i % 35) / 100}
              flatShading
            />
          </mesh>
        ))}
        <group ref={flameGroupRef}>
          {flameData.map((f, i) => (
            <mesh
              key={`fl-${i}`}
              position={[f.x * 1.1, f.y, f.z]}
              scale={[f.sx, f.sy, f.sx]}
              rotation={[0, f.ry, 0]}
              userData={{
                isFlame: true,
                baseY: f.y,
                speed: f.speed,
                offset: f.offset,
              }}
              castShadow
            >
              <octahedronGeometry args={[0.13, 0]} />
              <meshStandardMaterial
                color={f.col}
                emissive={f.col}
                emissiveIntensity={0.85 + (i % 40) / 100}
                flatShading
              />
            </mesh>
          ))}
        </group>
        <pointLight ref={fireLightRef} color={0xffaa33} intensity={2.5} distance={10} position={[0, 1.6, 0.5]} />
      </group>
      )}

      {vis('table') && (
      <group
        ref={tableRef}
        position={sp('table').pos}
        rotation={[0, sp('table').rotY, 0]}
        userData={{ isMovable: true, movableType: 'table' }}
      >
        <mesh position={[0, 1.155, 0]} castShadow>
          <boxGeometry args={[2.6, 0.12, 1.4]} />
          <meshStandardMaterial
            color={0x5c3a22}
            roughness={0.8}
            metalness={0}
            flatShading
            fog={false}
          />
        </mesh>
        {[
          [1.1, 0.55, 0.6],
          [-1.1, 0.55, 0.6],
          [1.1, 0.55, -0.6],
          [-1.1, 0.55, -0.6],
        ].map(([x, y, z], i) => (
          <mesh key={i} position={[x, y, z]} castShadow>
            <cylinderGeometry args={[0.07, 0.07, 1.1, 6]} />
            <meshStandardMaterial color={0x7a5230} roughness={0.8} flatShading />
          </mesh>
        ))}
      </group>
      )}

      {vis('rug') && (
      <group
        ref={rugRef}
        position={sp('rug').pos}
        rotation={[0, sp('rug').rotY, 0]}
        userData={{ isMovable: true, movableType: 'rug' }}
      >
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.02, 0]}
          receiveShadow
          material={rugMat}
        >
          <planeGeometry args={[2.6 * 1.35, 1.4 * 1.55]} />
        </mesh>
      </group>
      )}

      {vis('chair') && (
      <group
        ref={chairRef}
        position={sp('chair').pos}
        rotation={[0, sp('chair').rotY, 0]}
        userData={{ isMovable: true, movableType: 'chair' }}
      >
        <mesh position={[0, 0.792, 0]} castShadow>
          <boxGeometry args={[0.72, 0.09, 0.72]} />
          <meshStandardMaterial
            color={0x7a5230}
            roughness={0.8}
            flatShading
            ref={(mat) => {
              if (mat) mat.userData.envMapIntensityOverride = 0;
            }}
          />
        </mesh>
        <mesh position={[0, 1.21, -0.34]} castShadow>
          <boxGeometry args={[0.72, 0.72, 0.08]} />
          <meshStandardMaterial color={0x7a5230} roughness={0.8} flatShading />
        </mesh>
        {[
          [0.3, 0.385, 0.3],
          [-0.3, 0.385, 0.3],
          [0.3, 0.385, -0.3],
          [-0.3, 0.385, -0.3],
        ].map(([x, y, z], i) => (
          <mesh key={i} position={[x, y, z]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.77, 6]} />
            <meshStandardMaterial color={0x7a5230} roughness={0.8} flatShading />
          </mesh>
        ))}
      </group>
      )}

      {vis('aquarium') && (
      <group
        ref={aquariumRef}
        position={sp('aquarium').pos}
        rotation={[0, sp('aquarium').rotY, 0]}
        scale={1.05}
        userData={{ isMovable: true, movableType: 'aquarium' }}
      >
        <CabinAquarium />
      </group>
      )}

      {vis('shelf') && (
      <group
        ref={shelfRef}
        position={sp('shelf').pos}
        rotation={[0, sp('shelf').rotY, 0]}
        userData={{ isMovable: true, movableType: 'shelf' }}
      >
        <CabinBookshelf />
      </group>
      )}

      {vis('rod_wall') && (
      <group
        ref={rodWallRef}
        position={sp('rod_wall').pos}
        rotation={[0, sp('rod_wall').rotY, 0]}
        userData={{ isMovable: true, movableType: 'rod_wall' }}
      >
        <CabinRodWall />
      </group>
      )}

      {vis('mounted_fish') && (
        <MountedFishFurniture
          ref={mountedFishRef}
          position={sp('mounted_fish').pos}
          rotation={[0, sp('mounted_fish').rotY, 0]}
        />
      )}

      {vis('winner_trophy') && (
        <WinnerTrophyFurniture
          ref={winnerTrophyRef}
          position={sp('winner_trophy').pos}
          rotation={[0, sp('winner_trophy').rotY, 0]}
        />
      )}

      {comp('turtle', hasTurtle) && (
        <group
          ref={turtleRef}
          position={sp('turtle').pos}
          rotation={[0, sp('turtle').rotY, 0]}
          userData={{ isMovable: true, movableType: 'turtle' }}
        >
          <group scale={0.357}>
            <GiantLandTurtle cabinIdle />
          </group>
        </group>
      )}

      {comp('axolotl', hasAxolotlInCabin) && (
        <group
          ref={axolotlRef}
          position={sp('axolotl').pos}
          rotation={[0, sp('axolotl').rotY, 0]}
          userData={{ isMovable: true, movableType: 'axolotl' }}
        >
          <CabinAxolotl />
        </group>
      )}

      {vis('table_vase') && (
      <group
        ref={vaseRef}
        position={sp('table_vase').pos}
        rotation={[0, sp('table_vase').rotY, 0]}
        userData={{ isMovable: true, movableType: 'table_vase' }}
      >
        <CabinTableVase />
      </group>
      )}

      {comp('cheese', showCheese) && (
        <group
          ref={cheeseRef}
          position={sp('cheese').pos}
          rotation={[0, sp('cheese').rotY, 0]}
          userData={{ isMovable: true, movableType: 'cheese' }}
        >
          <CabinCheese />
        </group>
      )}

      {comp('golden_frog', hasGoldenFrog) && (
        <group
          ref={frogRef}
          position={sp('golden_frog').pos}
          rotation={[0, sp('golden_frog').rotY, 0]}
          userData={{ isMovable: true, movableType: 'golden_frog' }}
        >
          <GoldenFrog />
        </group>
      )}

      {vis('kitchen_table') && (
        <KitchenTableFurniture
          ref={kitchenTableRef}
          position={sp('kitchen_table').pos}
          rotation={[0, sp('kitchen_table').rotY, 0]}
        />
      )}
      {vis('kitchen_stove') && (
        <KitchenStoveFurniture
          ref={kitchenStoveRef}
          position={sp('kitchen_stove').pos}
          rotation={[0, sp('kitchen_stove').rotY, 0]}
        />
      )}
      {vis('kitchen_sink') && (
        <KitchenSinkFurniture
          ref={kitchenSinkRef}
          position={sp('kitchen_sink').pos}
          rotation={[0, sp('kitchen_sink').rotY, 0]}
        />
      )}
      {vis('gulvplante') && (
        <GulvplanteFurniture
          ref={gulvplanteRef}
          position={sp('gulvplante').pos}
          rotation={[0, sp('gulvplante').rotY, 0]}
        />
      )}
      {vis('kitchen_shelf') && (
        <KitchenShelfFurniture
          ref={kitchenShelfRef}
          position={sp('kitchen_shelf').pos}
          rotation={[0, sp('kitchen_shelf').rotY, 0]}
        />
      )}
      {vis('kitchen_rug') && (
        <KitchenRugFurniture
          ref={kitchenRugRef}
          position={sp('kitchen_rug').pos}
          rotation={[0, sp('kitchen_rug').rotY, 0]}
        />
      )}
      {vis('kitchen_lamp') && (
        <KitchenLampFurniture
          ref={kitchenLampRef}
          position={sp('kitchen_lamp').pos}
          rotation={[0, sp('kitchen_lamp').rotY, 0]}
        />
      )}
      {vis('kitchen_telescope') && (
        <KitchenTelescopeFurniture
          ref={kitchenTelescopeRef}
          position={sp('kitchen_telescope').pos}
          rotation={[0, sp('kitchen_telescope').rotY, 0]}
        />
      )}

      {vis('bedroom_bed') && (
        <BedroomBedFurniture
          ref={bedroomBedRef}
          position={sp('bedroom_bed').pos}
          rotation={[0, sp('bedroom_bed').rotY, 0]}
        />
      )}
      {vis('bedroom_nightstand') && (
        <BedroomNightstandFurniture
          ref={bedroomNightstandRef}
          position={sp('bedroom_nightstand').pos}
          rotation={[0, sp('bedroom_nightstand').rotY, 0]}
        />
      )}
      {vis('bedroom_lamp') && (
        <BedroomLampFurniture
          ref={bedroomLampRef}
          position={sp('bedroom_lamp').pos}
          rotation={[0, sp('bedroom_lamp').rotY, 0]}
        />
      )}
      {vis('bedroom_dresser') && (
        <BedroomDresserFurniture
          ref={bedroomDresserRef}
          position={sp('bedroom_dresser').pos}
          rotation={[0, sp('bedroom_dresser').rotY, 0]}
        />
      )}
      {vis('bedroom_rug') && (
        <BedroomRugFurniture
          ref={bedroomRugRef}
          position={sp('bedroom_rug').pos}
          rotation={[0, sp('bedroom_rug').rotY, 0]}
        />
      )}
      {vis('bedroom_frame') && (
        <BedroomFrameFurniture
          ref={bedroomFrameRef}
          position={sp('bedroom_frame').pos}
          rotation={[0, sp('bedroom_frame').rotY, 0]}
        />
      )}
      {vis('bedroom_mirror') && (
        <BedroomMirrorFurniture
          ref={bedroomMirrorRef}
          position={sp('bedroom_mirror').pos}
          rotation={[0, sp('bedroom_mirror').rotY, 0]}
        />
      )}
      {vis('bedroom_wardrobe') && (
        <BedroomWardrobeFurniture
          ref={bedroomWardrobeRef}
          position={sp('bedroom_wardrobe').pos}
          rotation={[0, sp('bedroom_wardrobe').rotY, 0]}
        />
      )}

      {comp('ur_krystal', crystalFound) && (
        <CrystalFurniture
          ref={crystalRef}
          position={sp('ur_krystal').pos}
          rotation={[0, sp('ur_krystal').rotY, 0]}
        />
      )}

      {vis('pirate_chest') && (
        <PirateChestFurniture
          ref={pirateChestRef}
          position={sp('pirate_chest').pos}
          rotation={[0, sp('pirate_chest').rotY, 0]}
          scale={0.6}
        />
      )}
      {vis('ice_cube') && (
        <IceCubeFurniture
          ref={iceCubeRef}
          position={sp('ice_cube').pos}
          rotation={[0, sp('ice_cube').rotY, 0]}
        />
      )}
      {vis('music_box') && (
        <MusicBoxFurniture
          ref={musicBoxRef}
          position={sp('music_box').pos}
          rotation={[0, sp('music_box').rotY, 0]}
        />
      )}
      {comp('pirate_cat', hasPirateCat) && (
        <CabinCat
          ref={pirateCatRef}
          position={sp('pirate_cat').pos}
          rotation={[0, sp('pirate_cat').rotY, 0]}
        />
      )}
    </group>
  );
}
