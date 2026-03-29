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
  RepeatWrapping,
} from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore } from '../../store/useGameStore.js';
import { usePlayerStore } from '../../store/usePlayerStore.js';
import { useCollectionStore } from '../../store/useCollectionStore.js';
import { GiantLandTurtle } from '../models/GiantLandTurtle.js';
import { GoldenFrog } from '../models/GoldenFrog.js';
import { AxolotlCatchModel } from '../models/bossCatchMiniModels.js';
import { CabinRodWall } from '../cabin/CabinRodWall.js';
import { CabinWindowStarfield } from '../cabin/CabinWindowStarfield.js';
import { cabinDoorHitRef } from '../cabin/cabinDoorRef.js';
import { cabinMovableRoots } from '../cabin/cabinMovablesRef.js';
import {
  applyFurniturePositions,
} from '../cabin/cabinFurniturePersistence.js';
import { BACKGROUND_Z_BOUNDS } from '../logic/backgroundZBounds.js';

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
        <meshStandardMaterial color={0x2255aa} roughness={0.5} />
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

function CabinCheese() {
  return (
    <group scale={2.5}>
      <mesh castShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.18, 5]} />
        <meshStandardMaterial color={0xf4c842} roughness={0.4} />
      </mesh>
      {[
        [-0.06, 0.06, 0.18],
        [0.08, -0.02, 0.18],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[0, 0, 0]}>
          <circleGeometry args={[0.04, 6]} />
          <meshStandardMaterial color={0xd4a830} roughness={0.5} />
        </mesh>
      ))}
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

/** Legacy `buildFishingCabin` — indendørs rum + flytbare møbler. */
export function FishingCabin() {
  const locationId = useGameStore((s) => s.currentLocation);
  const furnitureMode = useGameStore((s) => s.furnitureMode);
  const furniturePositions = usePlayerStore((s) => s.furniturePositions);
  const { camera } = useThree();
  const questItems = usePlayerStore((s) => s.questItems);
  const cheeseSources = usePlayerStore((s) => s.cheeseSources);
  const hasAxolotlInCabin = questItems.includes('has_axolotl');
  const hasGoldenFrog = useCollectionStore((s) => s.hasGoldenFrog);

  const hasTurtle = questItems.includes('turtle_hatched');
  const showCheese = cheeseSources.includes('shop') || cheeseSources.length >= 3;

  const W = 12;
  const D = 10;
  const H = 5.5;
  const H_BACK = 9.0;
  const ZF = 5;
  const ZB = -5;
  const WIN_W = 2.8;
  const WIN_H = 2.0;
  const WIN_Y = 3.05;
  const WALL_Z_FRONT = 3;
  const WALL_D = WALL_Z_FRONT - ZB;
  const sideW = (W - WIN_W) / 2;
  const topH = H_BACK - (WIN_Y + WIN_H / 2);

  /* Stjerner bag sky/fugle (z i [-25,-7]) — skaler plan så idle-kamera stadig ser fuld rude. */
  const cabinBg = BACKGROUND_Z_BOUNDS.fishing_cabin;
  const STAR_PLANE_Z = cabinBg.minZ - 1.5;
  const CAB_REF_Z = 8;
  const WIN_REF_Z = ZB + 0.02;
  const starPlaneScale = (CAB_REF_Z - STAR_PLANE_Z) / (CAB_REF_Z - WIN_REF_Z);

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
    if (locationId !== 'fishing_cabin') return;
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
    push(fireplaceRef);
    push(tableRef);
    push(rugRef);
    push(chairRef);
    push(aquariumRef);
    push(shelfRef);
    push(rodWallRef);
    if (hasTurtle) push(turtleRef);
    if (hasAxolotlInCabin) push(axolotlRef);
    push(vaseRef);
    if (showCheese) push(cheeseRef);
    if (hasGoldenFrog) push(frogRef);
    cabinMovableRoots.current = list;
  }

  useLayoutEffect(() => {
    rebuildMovableList();
    applyFurniturePositions(cabinMovableRoots.current, furniturePositions);
    return () => {
      cabinMovableRoots.current = [];
    };
  }, [furniturePositions, hasTurtle, hasAxolotlInCabin, showCheese, hasGoldenFrog]);

  if (locationId !== 'fishing_cabin') return null;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, (ZF + ZB) / 2]} receiveShadow>
        <planeGeometry args={[W, D + 4]} />
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

      <pointLight color={0xb0d8f0} intensity={0.6} distance={8} position={[0, WIN_Y, ZB + 0.5]} />

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
              <meshStandardMaterial color={0x3e2208} roughness={0.9} flatShading />
            </mesh>
            <mesh position={[0, WIN_Y, zo]} castShadow>
              <boxGeometry args={[0.1, WIN_H + 0.1, 0.06]} />
              <meshStandardMaterial color={0x3e2208} roughness={0.9} flatShading />
            </mesh>
            <mesh position={[0, WIN_Y + WIN_H / 2 + 0.07, zo]} castShadow>
              <boxGeometry args={[WIN_W + 0.25, 0.1, 0.06]} />
              <meshStandardMaterial color={0x3e2208} roughness={0.9} flatShading />
            </mesh>
            <mesh position={[0, WIN_Y - WIN_H / 2 - 0.07, zo]} castShadow>
              <boxGeometry args={[WIN_W + 0.25, 0.1, 0.06]} />
              <meshStandardMaterial color={0x3e2208} roughness={0.9} flatShading />
            </mesh>
            <mesh position={[-WIN_W / 2 - 0.07, WIN_Y, zo]} castShadow>
              <boxGeometry args={[0.1, WIN_H + 0.25, 0.06]} />
              <meshStandardMaterial color={0x3e2208} roughness={0.9} flatShading />
            </mesh>
            <mesh position={[WIN_W / 2 + 0.07, WIN_Y, zo]} castShadow>
              <boxGeometry args={[0.1, WIN_H + 0.25, 0.06]} />
              <meshStandardMaterial color={0x3e2208} roughness={0.9} flatShading />
            </mesh>
          </group>
        ))}
      </group>

      <mesh position={[-3.2, H + 0.8, (ZF + ZB) / 2]} rotation={[0, 0, 0.4]} castShadow>
        <boxGeometry args={[8.5, 0.2, D + 4]} />
        <meshStandardMaterial color={0x4a2f12} roughness={1} flatShading />
      </mesh>
      <mesh position={[3.2, H + 0.8, (ZF + ZB) / 2]} rotation={[0, 0, -0.4]} castShadow>
        <boxGeometry args={[8.5, 0.2, D + 4]} />
        <meshStandardMaterial color={0x4a2f12} roughness={1} flatShading />
      </mesh>

      <group
        ref={(node) => {
          cabinDoorHitRef.current = node;
        }}
        position={[-W / 2 + 0.1, 1.8, 1.5]}
      >
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
          <meshStandardMaterial color={0xc8a04a} metalness={0.9} roughness={0.2} flatShading />
        </mesh>
      </group>

      <group
        ref={fireplaceRef}
        position={[-3.6, 0, -4.5]}
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

      <group ref={tableRef} position={[0.22, 0, -1]} userData={{ isMovable: true, movableType: 'table' }}>
        <mesh position={[0, 1.155, 0]} castShadow>
          <boxGeometry args={[2.6, 0.12, 1.4]} />
          <meshStandardMaterial
            color={0x5c3a22}
            roughness={1}
            metalness={0}
            flatShading
            fog={false}
            ref={(mat) => {
              if (mat) mat.userData.envMapIntensityOverride = 0;
            }}
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

      <group ref={rugRef} position={[0.3, 0, -1]} userData={{ isMovable: true, movableType: 'rug' }}>
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.02, 0]}
          receiveShadow
          material={rugMat}
        >
          <planeGeometry args={[2.6 * 1.35, 1.4 * 1.55]} />
        </mesh>
      </group>

      <group
        ref={chairRef}
        position={[1.34, 0, -1]}
        rotation={[0, (3 * Math.PI) / 2, 0]}
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

      <group
        ref={aquariumRef}
        position={[4.15, -0.2, -4.2]}
        scale={1.05}
        userData={{ isMovable: true, movableType: 'aquarium' }}
      >
        <CabinAquarium />
      </group>

      <group
        ref={shelfRef}
        position={[5.4, 0, 1.5]}
        rotation={[0, -Math.PI / 2, 0]}
        userData={{ isMovable: true, movableType: 'shelf' }}
      >
        <CabinBookshelf />
      </group>

      <group
        ref={rodWallRef}
        position={[5.4, 2.091, -1.3]}
        rotation={[0, -Math.PI / 2, 0]}
        userData={{ isMovable: true, movableType: 'rod_wall' }}
      >
        <CabinRodWall />
      </group>

      {hasTurtle ? (
        <group
          ref={turtleRef}
          position={[-1.92, 0.19, -1.48]}
          rotation={[0, -Math.PI * 0.15, 0]}
          userData={{ isMovable: true, movableType: 'turtle' }}
        >
          <group scale={0.357}>
            <GiantLandTurtle cabinIdle />
          </group>
        </group>
      ) : null}

      {hasAxolotlInCabin ? (
        <group
          ref={axolotlRef}
          position={[1.0, 1.33, -1.0]}
          userData={{ isMovable: true, movableType: 'axolotl' }}
        >
          <CabinAxolotl />
        </group>
      ) : null}

      <group
        ref={vaseRef}
        position={[0.22, 1.215, -1.0]}
        userData={{ isMovable: true, movableType: 'table_vase' }}
      >
        <CabinTableVase />
      </group>

      {showCheese ? (
        <group
          ref={cheeseRef}
          position={[-2.65, 0.08, 1.95]}
          userData={{ isMovable: true, movableType: 'cheese' }}
        >
          <CabinCheese />
        </group>
      ) : null}

      {hasGoldenFrog ? (
        <group
          ref={frogRef}
          position={[5.13, 0, 0.21]}
          rotation={[0, -2.4, 0]}
          userData={{ isMovable: true, movableType: 'golden_frog' }}
        >
          <GoldenFrog />
        </group>
      ) : null}
    </group>
  );
}
