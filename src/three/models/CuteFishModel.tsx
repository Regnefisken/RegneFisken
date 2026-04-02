import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { createBioluminescentEmissiveMap, disposeBioluminescentTexture } from './cuteFishExtremeUtils.js';
import { ElectricBoltsFX, ElectricSparksFX, PufferSpikesInstanced } from './cuteFishExtremeEffects.js';
import {
  CatmullRomCurve3,
  Color,
  CanvasTexture,
  DoubleSide,
  FrontSide,
  MathUtils,
  Mesh,
  MeshPhysicalMaterial,
  Texture,
  Vector3,
  TubeGeometry,
  type Group,
} from 'three';
import { useFrame } from '@react-three/fiber';
import type { FishBodyProfile, FishModelConfig, TeethConfig } from '../../types/fish.js';
import {
  applyBodyProfileToEyePosition,
  createFishBodyGeometry,
  deformFishBody,
  fishBodyEllipsoidOutwardNormal,
  fishBodyEllipsoidSurface,
  getScaleTextures,
  normalizeBodySegments,
  pelvicFinYFactor,
  resolveBodyColor,
  resolveSideFinPartAdjustments,
} from './cuteFishUtils.js';
import {
  createGlimmerEmissiveMask,
  disposeGlimmerBumpMap,
  generateBodyDiffuseMap,
} from './cuteFishPatterns.js';
import { createPupilGeometry, isPupilFlat } from './cuteFishEyeUtils.js';
import {
  createDorsalFinGeometry,
  createTailFinGeometry,
  isExtrudedTailType,
} from './cuteFishFinTailShapes.js';

/** Cone: lokal +Y → verdens −X (spids bagud). Ekstra vinkel = additiv på Z ift. denne base. */
const TAIL_RZ_BASE = Math.PI / 2;

/** Extrudering (profil XY, dybde langs Z): lokal +Y → verdens −X (bagud), samme som kegle; tykkelse Z → +Y. */
const TAIL_EXTRUDED_EULER: [number, number, number] = [-Math.PI / 2, 0, Math.PI / 2];

/** Indsynkning af halerod i kroppen (skaleres med `sz`). */
const TAIL_ROOT_EMBED = 0.038;
/** Ekstruderet hale: ca. halvdelen af profiludstræk bagud (skaleres med `sz`) så rod ligger ved rotationspunktet. */
const TAIL_EXTRUDED_ROOT_HALF = 0.2;
/** Skub halefinne frem mod bagkrop (positiv X i hale-gruppen = mod snude), så roden forankres i kroppen. */
const TAIL_ANCHOR_ALONG_SZ = 0.16;

type EditorModelProps = {
  editorMode?: boolean;
  selectedPart?: string | null;
  onPartClick?: (name: string) => void;
  adjustments?: FishModelConfig['partAdjustments'];
};

interface PartGroupProps {
  name: string;
  adjustments?: FishModelConfig['partAdjustments'];
  editorMode?: boolean;
  selectedPart?: string | null;
  onPartClick?: (name: string) => void;
  children: ReactNode;
}

type SideFinPartGroupProps = PartGroupProps & {
  /** Fin forankring i fiskens rum — skal komme *før* rotation så rx/ry/rz drejer om kroppen ved finnen, ikke om origo. */
  anchor: [number, number, number];
};

function PartGroup({ name, adjustments, editorMode, selectedPart, onPartClick, children }: PartGroupProps) {
  const adj = adjustments?.[name];
  const isSelected = Boolean(editorMode && selectedPart === name);

  return (
    <group
      position={[adj?.dx ?? 0, adj?.dy ?? 0, adj?.dz ?? 0]}
      rotation={[adj?.rx ?? 0, adj?.ry ?? 0, adj?.rz ?? 0]}
      scale={[adj?.sx ?? 1, adj?.sy ?? 1, adj?.sz ?? 1]}
      onClick={
        editorMode
          ? (e) => {
              e.stopPropagation();
              onPartClick?.(name);
            }
          : undefined
      }
      userData={{ editorPartName: name }}
    >
      {children}
      {isSelected && (
        <mesh scale={1.15}>
          <sphereGeometry args={[0.2, 8, 6]} />
          <meshBasicMaterial color="#00ff88" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

/** Sidefinner: T(d)+skala, derefter forankring, derefter rotation — så Euler roterer om finnens led, og par/spejl matcher. */
function SideFinPartGroup({ name, adjustments, editorMode, selectedPart, onPartClick, children, anchor }: SideFinPartGroupProps) {
  const adj = adjustments?.[name];
  const isSelected = Boolean(editorMode && selectedPart === name);

  return (
    <group
      position={[adj?.dx ?? 0, adj?.dy ?? 0, adj?.dz ?? 0]}
      scale={[adj?.sx ?? 1, adj?.sy ?? 1, adj?.sz ?? 1]}
      onClick={
        editorMode
          ? (e) => {
              e.stopPropagation();
              onPartClick?.(name);
            }
          : undefined
      }
      userData={{ editorPartName: name }}
    >
      <group position={anchor}>
        <group rotation={[adj?.rx ?? 0, adj?.ry ?? 0, adj?.rz ?? 0]}>{children}</group>
        {isSelected && (
          <mesh scale={1.15}>
            <sphereGeometry args={[0.2, 8, 6]} />
            <meshBasicMaterial color="#00ff88" wireframe transparent opacity={0.4} />
          </mesh>
        )}
      </group>
    </group>
  );
}

function buildConchPathPoints(segments = 65): Vector3[] {
  const pts: Vector3[] = [];
  const s = 0.8;
  const turns = 4.2;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = t * Math.PI * 2 * turns;
    const radius = Math.pow(2.65, t) * 0.135;
    const y = -t * 1.65;
    pts.push(
      new Vector3(
        Math.cos(angle) * radius * s,
        y * s,
        Math.sin(angle) * radius * s
      )
    );
  }
  return pts;
}

function useConchGeometry() {
  return useMemo(() => {
    const path = new CatmullRomCurve3(buildConchPathPoints());
    const tubeGeo = new TubeGeometry(path, 56, 0.36, 14, false);
    const pos = tubeGeo.attributes.position;
    const v = new Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const tt = Math.max(0, Math.min(1, (-v.y) / 1.65));
      const flare = 1 + Math.pow(tt, 2.2) * 3.2;
      v.x *= flare * 0.96;
      v.z *= flare;
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    tubeGeo.computeVertexNormals();
    return { geo: tubeGeo, path };
  }, []);
}

function hex(c: number) {
  return `#${(c >>> 0).toString(16).padStart(6, '0')}`;
}

function WhiteSharkCatch({ bucketIdle }: { bucketIdle?: boolean } & EditorModelProps) {
  const root = useRef<Group>(null);
  const tailU = useRef<Group>(null);
  const tailL = useRef<Group>(null);
  const stem = useRef<Group>(null);
  const shark = useRef<Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (tailU.current) tailU.current.rotation.x = 0.3 + Math.sin(t * 4) * (bucketIdle ? 0.06 : 0.15);
    if (tailL.current) tailL.current.rotation.x = -0.3 + Math.sin(t * 4) * (bucketIdle ? 0.06 : 0.15);
    if (stem.current) stem.current.rotation.y = Math.sin(t * 4) * (bucketIdle ? 0.03 : 0.08);
    if (shark.current) shark.current.rotation.y = Math.sin(t * 2) * (bucketIdle ? 0.01 : 0.02);
  });

  const top = '#5a636b';
  const belly = '#ffffff';
  return (
    <group ref={root} rotation={[0, Math.PI / 2, 0]} scale={1.0}>
      <group ref={shark}>
        <mesh castShadow scale={[1.5, 1.8, 4.5]}>
          <sphereGeometry args={[1, 20, 14]} />
          <meshStandardMaterial color={top} metalness={0.15} />
        </mesh>
        <mesh castShadow scale={[1.55, 1.75, 4.4]} position={[0, -0.05, 0]}>
          <sphereGeometry args={[0.95, 16, 12, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.45]} />
          <meshStandardMaterial color={belly} roughness={0.3} metalness={0.05} />
        </mesh>
        <mesh castShadow position={[0, 0.1, 5.2]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.2, 1, 1]}>
          <coneGeometry args={[1.0, 3.2, 14]} />
          <meshStandardMaterial color={top} />
        </mesh>
        <mesh castShadow position={[0, -0.4, 3.8]} scale={[1.3, 0.5, 1]}>
          <sphereGeometry args={[0.8, 12, 8, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5]} />
          <meshStandardMaterial color={belly} />
        </mesh>
        <mesh castShadow position={[0, 2.6, 0.5]} scale={[0.4, 1.0, 1.2]}>
          <coneGeometry args={[0.5, 2.8, 8]} />
          <meshStandardMaterial color={top} roughness={0.4} />
        </mesh>
        <mesh ref={stem} castShadow rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -4.5]}>
          <cylinderGeometry args={[0.4, 0.25, 2.5, 8]} />
          <meshStandardMaterial color={top} />
        </mesh>
        <group ref={tailU} position={[0, 1.3, -5.5]}>
          <mesh scale={[0.3, 1.0, 0.8]} rotation={[0.3, 0, 0]}>
            <coneGeometry args={[0.35, 3.0, 8]} />
            <meshStandardMaterial color={top} roughness={0.4} />
          </mesh>
        </group>
        <group ref={tailL} position={[0, -0.9, -5.5]}>
          <mesh scale={[0.3, 1.0, 0.8]} rotation={[-0.3, 0, 0]}>
            <coneGeometry args={[0.3, 2.0, 8]} />
            <meshStandardMaterial color={top} roughness={0.4} />
          </mesh>
        </group>
        <mesh position={[1.15, 0.4, 4.0]}>
          <sphereGeometry args={[0.18, 8, 6]} />
          <meshBasicMaterial color="#111" />
        </mesh>
        <mesh position={[-1.15, 0.4, 4.0]}>
          <sphereGeometry args={[0.18, 8, 6]} />
          <meshBasicMaterial color="#111" />
        </mesh>
      </group>
    </group>
  );
}

function GoldenCarpCatch({ bucketIdle }: { bucketIdle?: boolean } & EditorModelProps) {
  const root = useRef<Group>(null);
  const carp = useRef<Group>(null);
  const tail = useRef<Group>(null);
  const pecL = useRef<Group>(null);
  const pecR = useRef<Group>(null);
  const whiskerL = useRef<Group>(null);
  const whiskerR = useRef<Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const speed = t * (bucketIdle ? 1.4 : 2.2);
    if (tail.current) tail.current.rotation.y = Math.sin(speed) * (bucketIdle ? 0.2 : 0.45);
    if (pecL.current) pecL.current.rotation.y = 0.3 + Math.sin(speed + 1) * (bucketIdle ? 0.1 : 0.25);
    if (pecR.current) pecR.current.rotation.y = -0.3 - Math.sin(speed + 1) * (bucketIdle ? 0.1 : 0.25);
    if (whiskerL.current) whiskerL.current.rotation.z = -1.0 + Math.sin(speed * 0.7) * 0.15;
    if (whiskerR.current) whiskerR.current.rotation.z = -1.0 + Math.sin(speed * 0.7) * 0.15;
    if (carp.current) {
      carp.current.position.y = Math.sin(speed * 0.5) * (bucketIdle ? 0.05 : 0.15);
      carp.current.rotation.x = Math.sin(speed * 0.5) * (bucketIdle ? 0.02 : 0.05);
    }
  });

  return (
    <group ref={root} scale={0.28}>
      <pointLight color={0xffd700} intensity={1.4} distance={4} position={[0, 0.2, 0]} />
      <group ref={carp}>
        <mesh castShadow scale={[1.5, 1.1, 0.85]}>
          <sphereGeometry args={[0.6, 20, 14]} />
          <meshStandardMaterial
            color="#ffd700"
            emissive="#aa6600"
            emissiveIntensity={0.45}
            roughness={0.15}
            metalness={0.95}
          />
        </mesh>
        <mesh castShadow position={[0.6, 0, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[1, 1, 0.85]}>
          <coneGeometry args={[0.51, 1.2, 18]} />
          <meshStandardMaterial
            color="#ffd700"
            emissive="#aa6600"
            emissiveIntensity={0.45}
            roughness={0.15}
            metalness={0.95}
          />
        </mesh>
        <group ref={whiskerL}>
          <mesh castShadow position={[1.1, -0.2, 0.25]} rotation={[0.3, 0, -1.0]}>
            <cylinderGeometry args={[0.015, 0.005, 0.7, 5]} />
            <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
        <group ref={whiskerR}>
          <mesh castShadow position={[1.1, -0.2, -0.25]} rotation={[-0.3, 0, -1.0]}>
            <cylinderGeometry args={[0.015, 0.005, 0.7, 5]} />
            <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
        <mesh castShadow position={[-0.1, 0.75, 0]} rotation={[0, 0, -0.5]} scale={[0.6, 1, 0.4]}>
          <coneGeometry args={[0.35, 1.4, 8]} />
          <meshStandardMaterial
            color="#ffb800"
            emissive="#885500"
            emissiveIntensity={0.35}
            roughness={0.3}
            metalness={0.6}
            transparent
            opacity={0.85}
            side={DoubleSide}
          />
        </mesh>
        <group ref={pecL}>
          <mesh castShadow position={[0.4, -0.4, 0.5]} rotation={[-Math.PI / 2, 0.3, Math.PI / 4]}>
            <coneGeometry args={[0.3, 1.0, 8]} />
            <meshStandardMaterial
              color="#ffb800"
              emissive="#885500"
              emissiveIntensity={0.35}
              transparent
              opacity={0.85}
              side={DoubleSide}
            />
          </mesh>
        </group>
        <group ref={pecR}>
          <mesh castShadow position={[0.4, -0.4, -0.5]} rotation={[Math.PI / 2, 0.3, Math.PI / 4]}>
            <coneGeometry args={[0.3, 1.0, 8]} />
            <meshStandardMaterial
              color="#ffb800"
              emissive="#885500"
              emissiveIntensity={0.35}
              transparent
              opacity={0.85}
              side={DoubleSide}
            />
          </mesh>
        </group>
        <group ref={tail} position={[-0.8, 0, 0]}>
          <mesh position={[-0.6, 0, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.2]}>
            <coneGeometry args={[0.5, 1.4, 8]} />
            <meshStandardMaterial color="#ffb800" emissive="#885500" transparent opacity={0.85} side={DoubleSide} />
          </mesh>
          <mesh position={[-0.6, 0.5, 0]} rotation={[0, 0, Math.PI / 4]} scale={[1, 1, 0.2]}>
            <coneGeometry args={[0.25, 0.9, 8]} />
            <meshStandardMaterial color="#ffb800" emissive="#885500" transparent opacity={0.85} side={DoubleSide} />
          </mesh>
          <mesh position={[-0.6, -0.5, 0]} rotation={[0, 0, -Math.PI / 4]} scale={[1, 1, 0.2]}>
            <coneGeometry args={[0.25, 0.9, 8]} />
            <meshStandardMaterial color="#ffb800" emissive="#885500" transparent opacity={0.85} side={DoubleSide} />
          </mesh>
        </group>
        <mesh position={[0.85, 0.15, 0.4]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshBasicMaterial color="#111" />
        </mesh>
        <mesh position={[0.09, 0, 0.09]}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshBasicMaterial color="#fff" />
        </mesh>
        <mesh position={[0.85, 0.15, -0.4]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshBasicMaterial color="#111" />
        </mesh>
        <mesh position={[0.09, 0, -0.09]}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshBasicMaterial color="#fff" />
        </mesh>
      </group>
    </group>
  );
}

export function CuteFishModel({
  config,
  fishModelId,
  instanceId,
  rollColor,
  bucketIdle,
  editorMode,
  editorSwimAnimation,
  selectedPart,
  onPartClick,
}: {
  config: FishModelConfig;
  fishModelId: string;
  instanceId: string;
  rollColor: number;
  bucketIdle?: boolean;
  editorMode?: boolean;
  /** Kun i editor: når sand, kør svømme-animation (ellers stille som standard). */
  editorSwimAnimation?: boolean;
  selectedPart?: string | null;
  onPartClick?: (name: string) => void;
}) {
  const bodyColor = useMemo(
    () => resolveBodyColor(config, fishModelId, rollColor, instanceId),
    [config, fishModelId, rollColor, instanceId]
  );
  const colHex = hex(bodyColor);
  const finHex =
    config.finColor != null ? hex(config.finColor) : config.redFins ? '#ff4444' : colHex;

  const bodyMat = useMemo(
    () => ({
      color: colHex,
      roughness: 0.38,
      metalness: 0.1,
      emissive: config.emissive != null ? hex(config.emissive) : '#000000',
      emissiveIntensity: config.emissive != null ? (config.emissiveIntensity ?? 0.45) : 0,
    }),
    [colHex, config.emissive, config.emissiveIntensity]
  );

  if (config.isStarfish)
    return (
      <StarfishModel
        bodyMat={bodyMat}
        scale={config.scale * 0.8}
        bucketIdle={bucketIdle}
        editorMode={editorMode}
        selectedPart={selectedPart}
        onPartClick={onPartClick}
        adjustments={config.partAdjustments}
      />
    );
  if (config.isFrog && !config.isGoldenFrog)
    return (
      <FrogModel
        bodyMat={bodyMat}
        scale={config.scale * 0.75}
        bucketIdle={bucketIdle}
        editorMode={editorMode}
        selectedPart={selectedPart}
        onPartClick={onPartClick}
        adjustments={config.partAdjustments}
      />
    );
  if (config.isCrab)
    return (
      <CrabModel
        bodyMat={bodyMat}
        config={config}
        scale={config.scale * 0.75}
        bucketIdle={bucketIdle}
        editorMode={editorMode}
        selectedPart={selectedPart}
        onPartClick={onPartClick}
        adjustments={config.partAdjustments}
      />
    );
  if (config.isOctopus)
    return (
      <OctopusModel
        bodyMat={bodyMat}
        scale={config.scale * 0.65}
        bucketIdle={bucketIdle}
        editorMode={editorMode}
        selectedPart={selectedPart}
        onPartClick={onPartClick}
        adjustments={config.partAdjustments}
      />
    );
  if (config.isLobster)
    return (
      <LobsterModel
        bodyMat={bodyMat}
        scale={config.scale * 0.72}
        bucketIdle={bucketIdle}
        editorMode={editorMode}
        selectedPart={selectedPart}
        onPartClick={onPartClick}
        adjustments={config.partAdjustments}
      />
    );
  if (config.isRay)
    return (
      <RayModel
        bodyMat={bodyMat}
        scale={config.scale * 0.7}
        bucketIdle={bucketIdle}
        editorMode={editorMode}
        selectedPart={selectedPart}
        onPartClick={onPartClick}
        adjustments={config.partAdjustments}
      />
    );
  if (config.isWhiteShark)
    return <WhiteSharkCatch bucketIdle={bucketIdle} editorMode={editorMode} selectedPart={selectedPart} onPartClick={onPartClick} />;
  if (config.isGoldenCarp)
    return <GoldenCarpCatch bucketIdle={bucketIdle} editorMode={editorMode} selectedPart={selectedPart} onPartClick={onPartClick} />;
  if (config.isBottle)
    return (
      <BottleModel
        scale={config.scale || 1}
        bucketIdle={bucketIdle}
        editorMode={editorMode}
        selectedPart={selectedPart}
        onPartClick={onPartClick}
      />
    );
  if (config.isOyster)
    return (
      <OysterModel
        config={config}
        scale={config.scale || 1}
        bucketIdle={bucketIdle}
        editorMode={editorMode}
        selectedPart={selectedPart}
        onPartClick={onPartClick}
      />
    );
  if (config.isConch)
    return (
      <ConchModel
        scale={config.scale ?? 1}
        bucketIdle={bucketIdle}
        editorMode={editorMode}
        selectedPart={selectedPart}
        onPartClick={onPartClick}
      />
    );
  if (config.isFossil)
    return (
      <FossilModel
        scale={config.scale || 1}
        bucketIdle={bucketIdle}
        editorMode={editorMode}
        selectedPart={selectedPart}
        onPartClick={onPartClick}
      />
    );

  return (
    <StandardFishModel
      config={config}
      bodyColor={bodyColor}
      finHex={finHex}
      bodyMat={bodyMat}
      bucketIdle={bucketIdle}
      editorMode={editorMode}
      editorSwimAnimation={editorSwimAnimation}
      selectedPart={selectedPart}
      onPartClick={onPartClick}
    />
  );
}

function StarfishModel({
  bodyMat,
  scale,
  bucketIdle,
  adjustments,
  editorMode,
  selectedPart,
  onPartClick,
}: {
  bodyMat: { color: string; roughness: number; metalness: number; emissive: string; emissiveIntensity: number };
  scale: number;
  bucketIdle?: boolean;
} & EditorModelProps) {
  const g = useRef<Group>(null);
  useFrame(() => {
    if (g.current) g.current.rotation.z += bucketIdle ? 0.002 : 0.004;
  });
  const partProps = { adjustments, editorMode, selectedPart, onPartClick };
  return (
    <group ref={g} scale={scale} rotation={[-Math.PI / 2, 0, 0]}>
      <PartGroup name="body" {...partProps}>
        <mesh castShadow>
          <cylinderGeometry args={[0.38, 0.35, 0.18, 12]} />
          <meshStandardMaterial {...bodyMat} />
        </mesh>
      </PartGroup>
      <PartGroup name="arms" {...partProps}>
        {Array.from({ length: 5 }, (_, i) => {
          const angle = (i / 5) * Math.PI * 2;
          return (
            <group key={i}>
              <mesh
                castShadow
                position={[Math.cos(angle) * 0.62, 0, Math.sin(angle) * 0.62]}
                rotation={[0, -angle, Math.PI / 2]}
              >
                <cylinderGeometry args={[0.16, 0.08, 0.85, 8]} />
                <meshStandardMaterial {...bodyMat} />
              </mesh>
              <mesh position={[Math.cos(angle) * 0.62, 0.12, Math.sin(angle) * 0.62]}>
                <sphereGeometry args={[0.08, 5, 4]} />
                <meshStandardMaterial {...bodyMat} />
              </mesh>
            </group>
          );
        })}
      </PartGroup>
      <PartGroup name="eyes" {...partProps}>
        <mesh position={[0.18, 0.12, 0.1]}>
          <sphereGeometry args={[0.07, 6, 5]} />
          <meshBasicMaterial color="#111" />
        </mesh>
        <mesh position={[0.18, 0.12, -0.1]}>
          <sphereGeometry args={[0.07, 6, 5]} />
          <meshBasicMaterial color="#111" />
        </mesh>
      </PartGroup>
    </group>
  );
}

function FrogModel({
  bodyMat,
  scale,
  bucketIdle,
  adjustments,
  editorMode,
  selectedPart,
  onPartClick,
}: {
  bodyMat: Record<string, unknown>;
  scale: number;
  bucketIdle?: boolean;
} & EditorModelProps) {
  const g = useRef<Group>(null);
  useFrame(() => {
    if (g.current) g.current.rotation.y += bucketIdle ? 0.004 : 0.008;
  });
  const partProps = { adjustments, editorMode, selectedPart, onPartClick };
  return (
    <group ref={g} scale={scale}>
      <PartGroup name="body" {...partProps}>
        <mesh castShadow scale={[1.3, 0.75, 1.1]}>
          <sphereGeometry args={[0.5, 12, 10]} />
          <meshStandardMaterial {...(bodyMat as object)} />
        </mesh>
      </PartGroup>
      <PartGroup name="eyes" {...partProps}>
        <mesh position={[0.28, 0.42, 0.3]}>
          <sphereGeometry args={[0.16, 8, 7]} />
          <meshBasicMaterial color="#fff" />
        </mesh>
        <mesh position={[0.28, 0.42, -0.3]}>
          <sphereGeometry args={[0.16, 8, 7]} />
          <meshBasicMaterial color="#fff" />
        </mesh>
        <mesh position={[0.38, 0.44, 0.3]}>
          <sphereGeometry args={[0.08, 6, 5]} />
          <meshBasicMaterial color="#111" />
        </mesh>
        <mesh position={[0.38, 0.44, -0.3]}>
          <sphereGeometry args={[0.08, 6, 5]} />
          <meshBasicMaterial color="#111" />
        </mesh>
      </PartGroup>
      <PartGroup name="legs" {...partProps}>
        {[[-0.3, -0.3, 0.35], [-0.3, -0.3, -0.35], [0.1, -0.4, 0.38], [0.1, -0.4, -0.38]].map((p, i) => (
          <mesh key={i} castShadow position={p as [number, number, number]} rotation={[0, 0, 0.5]}>
            <cylinderGeometry args={[0.07, 0.05, 0.38, 6]} />
            <meshStandardMaterial {...(bodyMat as object)} />
          </mesh>
        ))}
      </PartGroup>
    </group>
  );
}

function CrabModel({
  bodyMat,
  config,
  scale,
  bucketIdle,
  adjustments,
  editorMode,
  selectedPart,
  onPartClick,
}: {
  bodyMat: Record<string, unknown>;
  config: FishModelConfig;
  scale: number;
  bucketIdle?: boolean;
} & EditorModelProps) {
  const g = useRef<Group>(null);
  useFrame(() => {
    if (g.current) g.current.rotation.y += bucketIdle ? 0.004 : 0.007;
  });
  const thin = config.thinLegs;
  const legThick = thin ? 0.025 : 0.045;
  const legThin = thin ? 0.015 : 0.035;
  const legLen = thin ? 0.85 : 0.55;
  const legCount = thin ? 5 : 4;
  const partProps = { adjustments, editorMode, selectedPart, onPartClick };
  return (
    <group ref={g} scale={scale}>
      <PartGroup name="body" {...partProps}>
        <mesh castShadow scale={thin ? [1.1, 0.55, 1.1] : [1.5, 0.55, 1.1]}>
          <sphereGeometry args={[0.55, 12, 8]} />
          <meshStandardMaterial {...(bodyMat as object)} />
        </mesh>
      </PartGroup>
      <PartGroup name="legs" {...partProps}>
        {Array.from({ length: legCount }, (_, i) => (
          <group key={i}>
            <mesh
              castShadow
              position={[-0.1 + i * 0.08, -0.2, 0.58 + i * 0.03]}
              rotation={[0, 0, 0.5 - i * 0.1]}
            >
              <cylinderGeometry args={[legThick, legThin, legLen, 5]} />
              <meshStandardMaterial {...(bodyMat as object)} />
            </mesh>
            <mesh
              castShadow
              position={[-0.1 + i * 0.08, -0.2, -(0.58 + i * 0.03)]}
              rotation={[0, 0, 0.5 - i * 0.1]}
            >
              <cylinderGeometry args={[legThick, legThin, legLen, 5]} />
              <meshStandardMaterial {...(bodyMat as object)} />
            </mesh>
          </group>
        ))}
      </PartGroup>
      <PartGroup name="leftClaw" {...partProps}>
        {!thin && (
          <mesh castShadow position={[0.62, 0, 0.55]} scale={[1.3, 0.75, 0.9]}>
            <sphereGeometry args={[0.18, 8, 7]} />
            <meshStandardMaterial {...(bodyMat as object)} />
          </mesh>
        )}
        {thin && editorMode && (
          <mesh position={[0.62, 0, 0.55]}>
            <sphereGeometry args={[0.2, 6, 5]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        )}
      </PartGroup>
      <PartGroup name="rightClaw" {...partProps}>
        {!thin && (
          <mesh castShadow position={[0.62, 0, -0.55]} scale={[1.3, 0.75, 0.9]}>
            <sphereGeometry args={[0.18, 8, 7]} />
            <meshStandardMaterial {...(bodyMat as object)} />
          </mesh>
        )}
        {thin && editorMode && (
          <mesh position={[0.62, 0, -0.55]}>
            <sphereGeometry args={[0.2, 6, 5]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        )}
      </PartGroup>
      <PartGroup name="eyes" {...partProps}>
        <mesh position={[0.55, 0.25, 0.25]}>
          <sphereGeometry args={[0.09, 6, 5]} />
          <meshBasicMaterial color="#111" />
        </mesh>
        <mesh position={[0.55, 0.25, -0.25]}>
          <sphereGeometry args={[0.09, 6, 5]} />
          <meshBasicMaterial color="#111" />
        </mesh>
      </PartGroup>
    </group>
  );
}

function OctopusModel({
  bodyMat,
  scale,
  bucketIdle,
  adjustments,
  editorMode,
  selectedPart,
  onPartClick,
}: {
  bodyMat: Record<string, unknown>;
  scale: number;
  bucketIdle?: boolean;
} & EditorModelProps) {
  const g = useRef<Group>(null);
  useFrame(() => {
    if (g.current) g.current.rotation.y += bucketIdle ? 0.003 : 0.006;
  });
  const partProps = { adjustments, editorMode, selectedPart, onPartClick };
  return (
    <group ref={g} scale={scale}>
      <PartGroup name="head" {...partProps}>
        <mesh castShadow position={[0, 0.45, 0]} scale={[1, 1.3, 1]}>
          <sphereGeometry args={[0.55, 14, 12]} />
          <meshStandardMaterial {...(bodyMat as object)} />
        </mesh>
      </PartGroup>
      <PartGroup name="eyes" {...partProps}>
        <mesh position={[0.32, 0.62, 0.38]}>
          <sphereGeometry args={[0.11, 8, 7]} />
          <meshBasicMaterial color="#fff" />
        </mesh>
        <mesh position={[0.39, 0.63, 0.4]}>
          <sphereGeometry args={[0.062, 6, 5]} />
          <meshBasicMaterial color="#111" />
        </mesh>
        <mesh position={[0.32, 0.62, -0.38]}>
          <sphereGeometry args={[0.11, 8, 7]} />
          <meshBasicMaterial color="#fff" />
        </mesh>
        <mesh position={[0.39, 0.63, -0.4]}>
          <sphereGeometry args={[0.062, 6, 5]} />
          <meshBasicMaterial color="#111" />
        </mesh>
      </PartGroup>
      <PartGroup name="tentacles" {...partProps}>
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          return (
            <mesh
              key={i}
              castShadow
              position={[Math.cos(angle) * 0.38, -0.18, Math.sin(angle) * 0.38]}
              rotation={[0.4 + Math.sin(angle) * 0.15, 0, Math.cos(angle) * 0.3]}
            >
              <cylinderGeometry args={[0.055, 0.025, 0.9, 5]} />
              <meshStandardMaterial {...(bodyMat as object)} />
            </mesh>
          );
        })}
      </PartGroup>
    </group>
  );
}

function LobsterModel({
  bodyMat,
  scale,
  bucketIdle,
  adjustments,
  editorMode,
  selectedPart,
  onPartClick,
}: {
  bodyMat: Record<string, unknown>;
  scale: number;
  bucketIdle?: boolean;
} & EditorModelProps) {
  const g = useRef<Group>(null);
  useFrame(() => {
    if (g.current) g.current.rotation.y += bucketIdle ? 0.003 : 0.006;
  });
  const partProps = { adjustments, editorMode, selectedPart, onPartClick };
  return (
    <group ref={g} scale={scale}>
      <PartGroup name="body" {...partProps}>
        <mesh castShadow position={[-0.15, 0, 0]} scale={[1.5, 0.65, 1]}>
          <sphereGeometry args={[0.45, 10, 8]} />
          <meshStandardMaterial {...(bodyMat as object)} />
        </mesh>
      </PartGroup>
      <PartGroup name="head" {...partProps}>
        <mesh castShadow position={[0.75, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.28, 0.18, 0.9, 8]} />
          <meshStandardMaterial {...(bodyMat as object)} />
        </mesh>
      </PartGroup>
      <PartGroup name="leftClaw" {...partProps}>
        <mesh castShadow position={[-0.52, 0.1, 0.55]} scale={[1.4, 0.85, 1.1]}>
          <sphereGeometry args={[0.22, 9, 7]} />
          <meshStandardMaterial {...(bodyMat as object)} />
        </mesh>
      </PartGroup>
      <PartGroup name="rightClaw" {...partProps}>
        <mesh castShadow position={[-0.52, 0.1, -0.55]} scale={[1.4, 0.85, 1.1]}>
          <sphereGeometry args={[0.22, 9, 7]} />
          <meshStandardMaterial {...(bodyMat as object)} />
        </mesh>
      </PartGroup>
      <PartGroup name="legs" {...partProps}>
        {Array.from({ length: 5 }, (_, i) => (
          <group key={i}>
            <mesh castShadow position={[-0.05 + i * 0.07, -0.28, 0.42]} rotation={[0, 0, 0.4]}>
              <cylinderGeometry args={[0.035, 0.025, 0.42, 4]} />
              <meshStandardMaterial {...(bodyMat as object)} />
            </mesh>
            <mesh castShadow position={[-0.05 + i * 0.07, -0.28, -0.42]} rotation={[0, 0, 0.4]}>
              <cylinderGeometry args={[0.035, 0.025, 0.42, 4]} />
              <meshStandardMaterial {...(bodyMat as object)} />
            </mesh>
          </group>
        ))}
      </PartGroup>
      <PartGroup name="eyes" {...partProps}>
        <mesh position={[-0.52, 0.32, 0.2]}>
          <sphereGeometry args={[0.07, 6, 5]} />
          <meshBasicMaterial color="#111" />
        </mesh>
        <mesh position={[-0.52, 0.32, -0.2]}>
          <sphereGeometry args={[0.07, 6, 5]} />
          <meshBasicMaterial color="#111" />
        </mesh>
      </PartGroup>
    </group>
  );
}

function RayModel({
  bodyMat,
  scale,
  bucketIdle,
  adjustments,
  editorMode,
  selectedPart,
  onPartClick,
}: {
  bodyMat: Record<string, unknown>;
  scale: number;
  bucketIdle?: boolean;
} & EditorModelProps) {
  const g = useRef<Group>(null);
  useFrame(() => {
    if (g.current) g.current.rotation.y += bucketIdle ? 0.002 : 0.005;
  });
  const partProps = { adjustments, editorMode, selectedPart, onPartClick };
  return (
    <group ref={g} scale={scale}>
      <PartGroup name="body" {...partProps}>
        <mesh castShadow scale={[1, 0.18, 1.55]}>
          <sphereGeometry args={[0.7, 14, 12]} />
          <meshStandardMaterial {...(bodyMat as object)} />
        </mesh>
      </PartGroup>
      <PartGroup name="leftWing" {...partProps}>
        <mesh castShadow position={[0, 0.02, 0.8]} rotation={[0, 0, Math.PI / 2]} scale={[1, 0.18, 1.5]}>
          <coneGeometry args={[0.35, 1.3, 6]} />
          <meshStandardMaterial {...(bodyMat as object)} />
        </mesh>
      </PartGroup>
      <PartGroup name="rightWing" {...partProps}>
        <mesh castShadow position={[0, 0.02, -0.8]} rotation={[0, Math.PI, Math.PI / 2]} scale={[1, 0.18, 1.5]}>
          <coneGeometry args={[0.35, 1.3, 6]} />
          <meshStandardMaterial {...(bodyMat as object)} />
        </mesh>
      </PartGroup>
      <PartGroup name="tail" {...partProps}>
        <mesh castShadow position={[-1.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.06, 0.02, 1.4, 5]} />
          <meshStandardMaterial {...(bodyMat as object)} />
        </mesh>
      </PartGroup>
      <PartGroup name="eyes" {...partProps}>
        <mesh position={[0.45, 0.14, 0.3]}>
          <sphereGeometry args={[0.065, 6, 5]} />
          <meshBasicMaterial color="#111" />
        </mesh>
        <mesh position={[0.45, 0.14, -0.3]}>
          <sphereGeometry args={[0.065, 6, 5]} />
          <meshBasicMaterial color="#111" />
        </mesh>
      </PartGroup>
    </group>
  );
}

/** Legacy `buildCuteFishModel` → `config.isBottle` (flaskepost) — skala/position som legacy, ikke ekstra 0.55. */
function BottleModel({ scale, bucketIdle }: { scale: number; bucketIdle?: boolean } & EditorModelProps) {
  const g = useRef<Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (g.current) {
      g.current.rotation.y += bucketIdle ? 0.006 : 0.01;
      g.current.position.y = -1 + Math.sin(t * 2) * (bucketIdle ? 0.04 : 0.1);
    }
  });
  return (
    <group ref={g} scale={scale} position={[0, -1, 0]}>
      <mesh castShadow position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 1.2, 12]} />
        <meshPhysicalMaterial
          color="#88ccaa"
          transmission={0.8}
          opacity={1}
          roughness={0.1}
          transparent
        />
      </mesh>
      <mesh castShadow position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.15, 0.4, 0.4, 12]} />
        <meshPhysicalMaterial color="#88ccaa" transmission={0.8} opacity={1} roughness={0.1} transparent />
      </mesh>
      <mesh castShadow position={[0, 1.75, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.3, 12]} />
        <meshPhysicalMaterial color="#88ccaa" transmission={0.8} opacity={1} roughness={0.1} transparent />
      </mesh>
      <mesh castShadow position={[0, 1.95, 0]}>
        <cylinderGeometry args={[0.12, 0.14, 0.2, 8]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.4} metalness={0.1} flatShading />
      </mesh>
      <mesh castShadow position={[0, 0.6, 0]} rotation={[0.2, 0, 0.2]}>
        <cylinderGeometry args={[0.1, 0.1, 1.28, 8]} />
        <meshStandardMaterial color="#fffdd0" roughness={0.4} metalness={0.1} flatShading />
      </mesh>
    </group>
  );
}

function OysterModel({
  config,
  scale,
  bucketIdle,
}: {
  config: FishModelConfig;
  scale: number;
  bucketIdle?: boolean;
} & EditorModelProps) {
  const g = useRef<Group>(null);
  const topRef = useRef<Group>(null);
  const open = config.openAngle ?? 12;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (g.current) g.current.rotation.y += bucketIdle ? 0.004 : 0.008;
    if (topRef.current) {
      topRef.current.rotation.x = MathUtils.degToRad(-open - Math.sin(t * 1.5) * (bucketIdle ? 2 : 4));
    }
  });

  return (
    <group ref={g} scale={scale * 0.55}>
      <mesh castShadow rotation={[Math.PI * 0.1, 0, 0]} scale={[1.8, 0.9, 1.4]}>
        <sphereGeometry args={[1.1, 24, 20, 0, Math.PI * 2, Math.PI * 0.6, Math.PI * 0.7]} />
        <meshPhongMaterial color="#e8e0d0" shininess={15} specular="#222222" />
      </mesh>
      <group ref={topRef} position={[0, 0.15, 0]} rotation={[MathUtils.degToRad(-open), 0, 0]}>
        <mesh castShadow scale={[1.7, 0.85, 1.35]}>
          <sphereGeometry args={[1.05, 22, 18, 0, Math.PI * 2, Math.PI * 0.3, Math.PI * 0.75]} />
          <meshPhongMaterial color="#e8e0d0" shininess={15} />
        </mesh>
      </group>
      <mesh castShadow position={[0, 0.08, 0]} rotation={[Math.PI * 0.15, 0, 0]}>
        <sphereGeometry args={[0.95, 18, 16, 0, Math.PI * 2, Math.PI * 0.65, Math.PI * 0.4]} />
        <meshPhongMaterial color="#f8f0e8" shininess={80} specular="#ffffff" />
      </mesh>
      {config.hasPearl && (
        <>
          <mesh position={[0.3, 0.25, 0.1]}>
            <sphereGeometry args={[0.22, 16, 12]} />
            <meshPhongMaterial color="#ffeeff" shininess={120} emissive="#442244" emissiveIntensity={0.25} />
          </mesh>
          <pointLight color={0xffaaff} intensity={1.0} distance={4} position={[0.3, 0.25, 0.1]} />
        </>
      )}
    </group>
  );
}

function ConchModel({ scale, bucketIdle }: { scale: number; bucketIdle?: boolean } & EditorModelProps) {
  const g = useRef<Group>(null);
  const { geo, path } = useConchGeometry();
  useEffect(() => () => geo.dispose(), [geo]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (g.current) {
      g.current.rotation.set(0.35, t * (bucketIdle ? 0.5 : 0.8), Math.PI * 0.6);
      g.current.position.y = Math.sin(t * 1.8) * (bucketIdle ? 0.03 : 0.07);
    }
  });

  const spikes = useMemo(() => {
    const out: Vector3[] = [];
    for (let i = 4; i < 17; i++) {
      const t = i / 22;
      const pt = path.getPoint(t);
      const tangent = path.getTangent(t).clone().normalize();
      out.push(pt.clone().add(tangent.multiplyScalar(0.25)));
    }
    return out;
  }, [path]);

  return (
    <group ref={g} scale={(scale || 1) * 1.45 * 0.75 * 0.55}>
      <mesh geometry={geo} castShadow>
        <meshPhysicalMaterial
          color="#ffe4c4"
          emissive="#ff9eb8"
          emissiveIntensity={0.22}
          roughness={0.28}
          metalness={0.08}
          clearcoat={0.9}
          clearcoatRoughness={0.12}
          side={DoubleSide}
        />
      </mesh>
      {spikes.map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <coneGeometry args={[0.045, 0.26, 5]} />
          <meshPhysicalMaterial color="#ffe4c4" roughness={0.3} clearcoat={0.6} side={DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function FossilModel({ scale, bucketIdle }: { scale: number; bucketIdle?: boolean } & EditorModelProps) {
  const g = useRef<Group>(null);
  useFrame(() => {
    if (g.current) g.current.rotation.y += bucketIdle ? 0.004 : 0.008;
  });
  return (
    <group ref={g} scale={scale * 0.55} rotation={[0, 0, 0.3]}>
      <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 1.6, 8]} />
        <meshStandardMaterial color="#e8e0d0" roughness={0.45} flatShading />
      </mesh>
      {(
        [
          [-0.8, 0.2],
          [-0.8, -0.2],
          [0.8, 0.2],
          [0.8, -0.2],
        ] as const
      ).map(([x, y], i) => (
        <mesh key={i} castShadow position={[x, y, 0]}>
          <sphereGeometry args={[0.28, 8, 8]} />
          <meshStandardMaterial color="#e8e0d0" roughness={0.45} flatShading />
        </mesh>
      ))}
    </group>
  );
}

type StandardFishEyePartProps = {
  adjustments?: FishModelConfig['partAdjustments'];
  editorMode?: boolean;
  selectedPart?: string | null;
  onPartClick?: (name: string) => void;
};

function StandardFishEyes({
  sx,
  sy,
  sz,
  config,
  partProps,
  bodyProfile,
}: {
  sx: number;
  sy: number;
  sz: number;
  config: FishModelConfig;
  partProps: StandardFishEyePartProps;
  bodyProfile: FishBodyProfile;
}) {
  const puffS = 1 + (config.pufferInflation?.puff ?? 0) * 0.82;
  const adj = (ex: number, ey: number, ez: number) =>
    applyBodyProfileToEyePosition(bodyProfile, sx, sy, sz, ex, ey, ez, puffS);
  const pupilGeo = useMemo(() => {
    if (!config.eyeConfig) return null;
    const ec = config.eyeConfig;
    const size = ec.size ?? 0.14;
    const r = size * (0.08 / 0.14) * (ec.pupilScale ?? 1);
    return createPupilGeometry(ec.pupilShape ?? 'sphere', r);
  }, [config.eyeConfig]);

  useEffect(() => {
    return () => {
      pupilGeo?.dispose();
    };
  }, [pupilGeo]);

  if (!config.eyeConfig) {
    const sL = fishBodyEllipsoidSurface(sx, sy, sz, puffS, 0.66, 0.16, 0.58);
    const sR = fishBodyEllipsoidSurface(sx, sy, sz, puffS, 0.66, 0.16, -0.58);
    const posSL = adj(sL[0], sL[1], sL[2]);
    const posSR = adj(sR[0], sR[1], sR[2]);
    const nL = fishBodyEllipsoidOutwardNormal(sx, sy, sz, puffS, posSL[0], posSL[1], posSL[2]);
    const nR = fishBodyEllipsoidOutwardNormal(sx, sy, sz, puffS, posSR[0], posSR[1], posSR[2]);
    const R = 0.14;
    const rP = 0.08;
    const pupilAlong = R - rP * 0.82;
    const posPL: [number, number, number] = [
      posSL[0] + nL.x * pupilAlong,
      posSL[1] + nL.y * pupilAlong,
      posSL[2] + nL.z * pupilAlong,
    ];
    const posPR: [number, number, number] = [
      posSR[0] + nR.x * pupilAlong,
      posSR[1] + nR.y * pupilAlong,
      posSR[2] + nR.z * pupilAlong,
    ];
    /** Samme skærm-venstre/højre som sidefinner: venstre øje = −Z (posSR), højre = +Z (posSL). */
    return (
      <>
        <PartGroup name="leftEye" {...partProps}>
          <mesh position={posSR}>
            <sphereGeometry args={[0.14, 10, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={posPR}>
            <sphereGeometry args={[0.08, 8, 6]} />
            <meshBasicMaterial color="#111111" />
          </mesh>
        </PartGroup>
        <PartGroup name="rightEye" {...partProps}>
          <mesh position={posSL}>
            <sphereGeometry args={[0.14, 10, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={posPL}>
            <sphereGeometry args={[0.08, 8, 6]} />
            <meshBasicMaterial color="#111111" />
          </mesh>
        </PartGroup>
      </>
    );
  }

  if (!pupilGeo) return null;

  const ec = config.eyeConfig;
  const size = ec.size ?? 0.14;
  const scleraColor = hex(ec.scleraColor ?? 0xffffff);
  const pupilColor = hex(ec.pupilColor ?? 0x111111);
  const pupilShape = ec.pupilShape ?? 'sphere';
  const ox = ec.offsetX ?? 0;
  const oy = ec.offsetY ?? 0;

  const flat = isPupilFlat(pupilShape);
  const scleraDirX = sz * 0.65;
  const scleraDirY = sy * (0.15 + oy * 0.25);
  const scleraDirZ = (sign: number) => sign * sx * (0.55 + ox * 0.25);

  const sL = fishBodyEllipsoidSurface(sx, sy, sz, puffS, scleraDirX, scleraDirY, scleraDirZ(1));
  const sR = fishBodyEllipsoidSurface(sx, sy, sz, puffS, scleraDirX, scleraDirY, scleraDirZ(-1));
  const posSL = adj(sL[0], sL[1], sL[2]);
  const posSR = adj(sR[0], sR[1], sR[2]);
  const nL = fishBodyEllipsoidOutwardNormal(sx, sy, sz, puffS, posSL[0], posSL[1], posSL[2]);
  const nR = fishBodyEllipsoidOutwardNormal(sx, sy, sz, puffS, posSR[0], posSR[1], posSR[2]);
  const rPupil = size * (0.08 / 0.14) * (ec.pupilScale ?? 1);
  const pupilAlong = size - rPupil * 0.82;
  const posPL: [number, number, number] = [
    posSL[0] + nL.x * pupilAlong,
    posSL[1] + nL.y * pupilAlong,
    posSL[2] + nL.z * pupilAlong,
  ];
  const posPR: [number, number, number] = [
    posSR[0] + nR.x * pupilAlong,
    posSR[1] + nR.y * pupilAlong,
    posSR[2] + nR.z * pupilAlong,
  ];

  /** Venstre øje = −Z-side (posSR); højre = +Z (posSL). Flad pupil: −Z-side brugte tidligere Y-π flip. */
  return (
    <>
      <PartGroup name="leftEye" {...partProps}>
        <mesh position={posSR}>
          <sphereGeometry args={[size, 10, 8]} />
          <meshBasicMaterial color={scleraColor} />
        </mesh>
        <mesh
          geometry={pupilGeo}
          position={posPR}
          rotation={flat ? [0, Math.PI, 0] : [0, 0, 0]}
        >
          <meshBasicMaterial color={pupilColor} side={flat ? DoubleSide : FrontSide} />
        </mesh>
      </PartGroup>
      <PartGroup name="rightEye" {...partProps}>
        <mesh position={posSL}>
          <sphereGeometry args={[size, 10, 8]} />
          <meshBasicMaterial color={scleraColor} />
        </mesh>
        <mesh
          geometry={pupilGeo}
          position={posPL}
          rotation={flat ? [0, 0, 0] : [0, 0, 0]}
        >
          <meshBasicMaterial color={pupilColor} side={flat ? DoubleSide : FrontSide} />
        </mesh>
      </PartGroup>
    </>
  );
}

function resolveTeethConfig(raw: FishModelConfig['teeth']): TeethConfig | null {
  if (raw === false || raw === undefined) return null;
  if (raw === true) {
    return { type: 'tiny', count: 12, size: 0.038, color: 0xffffff, zOffset: 0 };
  }
  return {
    type: raw.type ?? 'tiny',
    count: raw.count ?? 12,
    size: raw.size ?? 0.038,
    color: raw.color ?? 0xffffff,
    zOffset: raw.zOffset ?? 0,
  };
}

function StandardFishMouthTeeth({
  sx,
  sy,
  sz,
  config,
  partProps,
}: {
  sx: number;
  sy: number;
  sz: number;
  config: FishModelConfig;
  partProps: StandardFishEyePartProps;
}) {
  if (config.isPiranha || config.isDino) return null;

  const tc = resolveTeethConfig(config.teeth);
  const mt = config.mouthType;
  const hasMouth = mt != null && mt !== 'none';
  if (!tc && !hasMouth) return null;

  const openness = MathUtils.clamp(config.mouthOpenness ?? 0.55, 0.12, 1);
  const mouthCol = hex(config.mouthColor ?? 0x2a0808);
  const toothRot: [number, number, number] = [0, 0, -Math.PI / 2];
  /**
   * Kroppen skaleres med [sz·0.7, …] langs længdeaksen; profilen går ~0→2 i lokal x.
   * Øjne ligger ~0.65·sz (≈ fed krop midt-forrest). Snude-spidsen ligger ved ~1.4·sz — IKKE ved 0.8·sz
   * (det er stadig i den tykke del). Mund/tænder skal forankres ved snuden.
   */
  const snoutSurfaceX = sz * 1.28;
  const lipForward = sz * 0.08;
  const mouthRingX = snoutSurfaceX + lipForward;
  const teethRowX = snoutSurfaceX + lipForward * 0.45;

  const toothMeshes: ReactNode[] = [];
  if (tc) {
    const baseX = teethRowX;
    const baseY = -sy * 0.1;
    const zo = tc.zOffset ?? 0;
    const size = tc.size ?? 0.038;
    const h = size * 4.2;
    const r = size * 0.55;
    const col = hex(tc.color ?? 0xffffff);
    const ttype = tc.type;

    const pushCone = (key: string, x: number, y: number, z: number, sc: number) => {
      toothMeshes.push(
        <mesh key={key} castShadow position={[x, y, z + zo]} rotation={toothRot} scale={sc}>
          <coneGeometry args={[r * sc, h * sc, 5]} />
          <meshStandardMaterial color={col} metalness={0.15} />
        </mesh>
      );
    };

    if (ttype === 'tiny') {
      const n = Math.max(3, Math.min(28, tc.count ?? 12));
      for (let i = 0; i < n; i++) {
        const u = n <= 1 ? 0.5 : i / (n - 1);
        const z = (u - 0.5) * sx * 0.38;
        pushCone(`tiny-${i}`, baseX, baseY, z, 1);
      }
    } else if (ttype === 'shark_double') {
      const per = Math.max(3, Math.floor((tc.count ?? 8) / 2));
      for (let row = 0; row < 2; row++) {
        const y = row === 0 ? -sy * 0.035 : -sy * 0.155;
        for (let i = 0; i < per; i++) {
          const u = per <= 1 ? 0.5 : i / (per - 1);
          const z = (u - 0.5) * sx * 0.34;
          pushCone(`sd-${row}-${i}`, baseX, y, z, 0.92);
        }
      }
    } else if (ttype === 'fangs') {
      const pts: [number, number, number][] = [
        [baseX, -sy * 0.05, -sx * 0.08],
        [baseX, -sy * 0.05, sx * 0.08],
        [baseX, -sy * 0.14, -sx * 0.05],
        [baseX, -sy * 0.14, sx * 0.05],
      ];
      pts.forEach((p, i) => {
        toothMeshes.push(
          <mesh key={`fang-${i}`} castShadow position={[p[0], p[1], p[2] + zo]} rotation={toothRot} scale={1.35}>
            <coneGeometry args={[r * 1.35, h * 1.35, 5]} />
            <meshStandardMaterial color={col} roughness={0.28} metalness={0.2} />
          </mesh>
        );
      });
    } else if (ttype === 'tusks') {
      for (const sign of [-1, 1] as const) {
        toothMeshes.push(
          <mesh
            key={`tusk-${sign}`}
            castShadow
            position={[baseX, -sy * 0.07, sign * sx * 0.14 + zo]}
            rotation={[0.12, 0, -Math.PI / 2]}
            scale={1.85}
          >
            <coneGeometry args={[r * 1.15, h * 1.35, 6]} />
            <meshStandardMaterial color={col} roughness={0.3} metalness={0.12} />
          </mesh>
        );
      }
    } else {
      const n = Math.max(3, Math.min(28, tc.count ?? 12));
      for (let i = 0; i < n; i++) {
        const u = n <= 1 ? 0.5 : i / (n - 1);
        const z = (u - 0.5) * sx * 0.38;
        pushCone(`fb-${i}`, baseX, baseY, z, 1);
      }
    }
  }

  const mouthMatProps = {
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  } as const;

  let mouthMesh: ReactNode = null;
  if (hasMouth && mt) {
    const ox = openness;
    if (mt === 'wide_shark') {
      mouthMesh = (
        <mesh
          castShadow
          renderOrder={2}
          position={[mouthRingX, -sy * 0.09, 0]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[1, 0.42 + ox * 0.38, 1.22]}
        >
          <ringGeometry args={[sx * 0.11 * ox, sx * 0.2 * ox, 32]} />
          <meshStandardMaterial
            color={mouthCol}
            roughness={0.65}
            metalness={0.05}
            emissive={mouthCol}
            emissiveIntensity={0.22}
            side={DoubleSide}
            {...mouthMatProps}
          />
        </mesh>
      );
    } else if (mt === 'round_sucker') {
      mouthMesh = (
        <mesh
          castShadow
          renderOrder={2}
          position={[mouthRingX * 0.998, -sy * 0.1, 0]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <torusGeometry args={[sx * 0.13 * ox, 0.045, 14, 36]} />
          <meshStandardMaterial
            color={mouthCol}
            roughness={0.55}
            emissive={mouthCol}
            emissiveIntensity={0.18}
            {...mouthMatProps}
          />
        </mesh>
      );
    } else if (mt === 'underbite') {
      mouthMesh = (
        <mesh
          castShadow
          renderOrder={2}
          position={[snoutSurfaceX + lipForward * 0.35, -sy * (0.17 + ox * 0.04), 0]}
        >
          <boxGeometry args={[sz * 0.14 * ox, sy * 0.11, sx * 0.26 * ox]} />
          <meshStandardMaterial color={mouthCol} roughness={0.55} emissive={mouthCol} emissiveIntensity={0.12} {...mouthMatProps} />
        </mesh>
      );
    } else if (mt === 'beak') {
      mouthMesh = (
        <mesh
          castShadow
          renderOrder={2}
          position={[mouthRingX + sz * (0.04 + ox * 0.05), -sy * 0.05, 0]}
          rotation={[0, 0, -Math.PI / 2]}
        >
          <coneGeometry args={[0.055 * ox, 0.18 * ox, 7]} />
          <meshStandardMaterial color={mouthCol} roughness={0.42} emissive={mouthCol} emissiveIntensity={0.1} {...mouthMatProps} />
        </mesh>
      );
    }
  }

  return (
    <>
      {toothMeshes.length > 0 && (
        <PartGroup name="teeth" {...partProps}>
          {toothMeshes}
        </PartGroup>
      )}
      {mouthMesh && (
        <PartGroup name="mouth" {...partProps}>
          {mouthMesh}
        </PartGroup>
      )}
    </>
  );
}

/** Fin-materiale med valgfri gelé/glas når finOpacity er sat og under 0.95; glimmer via emissiveMap (samme som krop — bump er upålidelig på fin-mesh). */
function StandardFinMaterial({
  color,
  roughness = 0.25,
  metalness,
  finOpacity,
  finGlimmer,
  finGlimmerMask,
  flatShading,
}: {
  color: string;
  roughness?: number;
  metalness?: number;
  finOpacity?: number;
  finGlimmer?: FishModelConfig['finGlimmer'];
  finGlimmerMask?: CanvasTexture | null;
  /** Lav-poly skygge (matcher `bodyShadingStyle: 'flat'`). */
  flatShading?: boolean;
}) {
  const useGlass = finOpacity != null && finOpacity < 0.95;
  const fg =
    finGlimmer != null && finGlimmer.amount > 0 && finGlimmerMask != null ? finGlimmer : null;
  const fa = fg?.amount ?? 0;
  const baseM = metalness ?? 0;
  const glimmerMat =
    fg != null
      ? {
          emissiveMap: finGlimmerMask!,
          emissive: new Color(fg.color),
          emissiveIntensity: 0.05 + fa * 0.52,
          metalness: Math.min(1, baseM + fa * 0.28),
          roughness: Math.max(0.06, roughness - fa * 0.11),
          specularColor: new Color(fg.color),
          specularIntensity: 0.16 + fa * 0.9,
        }
      : {};

  if (!useGlass) {
    return (
      <meshStandardMaterial
        color={color}
        roughness={roughness}
        flatShading={flatShading}
        side={DoubleSide}
        {...(metalness != null ? { metalness } : {})}
        {...glimmerMat}
      />
    );
  }
  const fo = finOpacity as number;
  return (
    <meshPhysicalMaterial
      color={color}
      roughness={roughness}
      flatShading={flatShading}
      side={DoubleSide}
      {...(metalness != null ? { metalness } : {})}
      {...glimmerMat}
      transparent
      opacity={fo}
      transmission={Math.min(1, Math.max(0, 1 - fo * 0.35))}
      ior={1.33}
      thickness={0.8}
    />
  );
}

function StandardFishModel({
  config,
  bodyColor,
  finHex,
  bodyMat,
  bucketIdle,
  editorMode,
  editorSwimAnimation,
  selectedPart,
  onPartClick,
}: {
  config: FishModelConfig;
  bodyColor: number;
  finHex: string;
  bodyMat: { color: string; roughness: number; metalness: number; emissive: string; emissiveIntensity: number };
  bucketIdle?: boolean;
  editorMode?: boolean;
  editorSwimAnimation?: boolean;
  selectedPart?: string | null;
  onPartClick?: (name: string) => void;
}) {
  const root = useRef<Group>(null);
  const tailGroup = useRef<Group>(null);
  const jawGroup = useRef<Group>(null);
  const leftFinRef = useRef<Mesh>(null);
  const rightFinRef = useRef<Mesh>(null);
  const leftPelvicRef = useRef<Mesh>(null);
  const rightPelvicRef = useRef<Mesh>(null);

  const [sx, sy, sz] = config.bodyShape;
  const bodyProfile = config.bodyProfile ?? 'standard';
  const bodySegments = normalizeBodySegments(config.bodySegments ?? config.bodyLatheSegments);
  const bodyFlat = config.bodyShadingStyle === 'flat';
  const bodyGeo = useMemo(() => {
    const g = createFishBodyGeometry(bodySegments);
    deformFishBody(g, bodyProfile);
    return g;
  }, [bodySegments, bodyProfile]);
  useEffect(() => () => bodyGeo.dispose(), [bodyGeo]);
  const dorsalExtraTilt = bodyProfile === 'tapered' ? 0.04 : bodyProfile === 'tadpole' ? 0.06 : 0;
  const pelvicYFactor = pelvicFinYFactor(bodyProfile);
  const dorsalZScale = sz * 0.45 * (config.dorsalFinType ? 1 : 0.6);
  const dorsalAutoEmbed = (config.dorsalFinType ? 1 : 0.6) * 0.04;
  const dorsalY = sy * (0.85 - dorsalAutoEmbed - (config.dorsalFinEmbed ?? 0) * 0.95);

  const tailExtrudeGeo = useMemo(() => createTailFinGeometry(config.tail), [config.tail]);
  const dorsalExtrudeGeo = useMemo(
    () => (config.dorsalFinType ? createDorsalFinGeometry(config.dorsalFinType) : null),
    [config.dorsalFinType]
  );

  useEffect(() => {
    return () => {
      tailExtrudeGeo?.dispose();
    };
  }, [tailExtrudeGeo]);

  useEffect(() => {
    return () => {
      dorsalExtrudeGeo?.dispose();
    };
  }, [dorsalExtrudeGeo]);

  const scaleTextures = useMemo(() => getScaleTextures(bodyColor, 'medium'), [bodyColor]);
  const needsCanvasBodyMap =
    Boolean(config.useRainbow) ||
    config.colorGradient != null ||
    (config.bodyPattern != null && config.bodyPattern !== 'solid');
  const tintMapIsFullAlbedo = Boolean(config.useRainbow) || config.colorGradient != null;
  const bodyDiffuseMap = useMemo(() => {
    if (!needsCanvasBodyMap) return scaleTextures.map;
    return generateBodyDiffuseMap({
      bodyColor,
      bodyPattern: config.bodyPattern,
      patternColor: config.patternColor,
      patternDensity: config.patternDensity,
      colorGradient: config.colorGradient,
      useRainbow: config.useRainbow,
      width: 512,
      height: 256,
    });
  }, [
    bodyColor,
    needsCanvasBodyMap,
    config.bodyPattern,
    config.patternColor,
    config.patternDensity,
    config.colorGradient,
    config.useRainbow,
    scaleTextures.map,
  ]);

  /** På krop er `bumpMap` deaktiveret når `normalMap` er sat (Three.js shader); brug emissiveMap i stedet. */
  const bodyGlimmerEmissiveMask = useMemo(() => {
    const g = config.glimmer;
    if (!g || g.amount <= 0) return null;
    return createGlimmerEmissiveMask((bodyColor ^ 0x9e3779b9) >>> 0, g.amount, g.placement ?? 0);
  }, [bodyColor, config.glimmer]);

  const finGlimmerEmissiveMask = useMemo(() => {
    const g = config.finGlimmer;
    if (!g || g.amount <= 0) return null;
    return createGlimmerEmissiveMask((bodyColor ^ 0x6c078965) >>> 0, g.amount, g.placement ?? 0);
  }, [bodyColor, config.finGlimmer]);

  useEffect(() => {
    return () => {
      disposeGlimmerBumpMap(bodyGlimmerEmissiveMask);
      disposeGlimmerBumpMap(finGlimmerEmissiveMask);
    };
  }, [bodyGlimmerEmissiveMask, finGlimmerEmissiveMask]);

  const bodyGlimmerMat = useMemo(() => {
    const g = config.glimmer;
    if (!g || g.amount <= 0 || !bodyGlimmerEmissiveMask) return {};
    return {
      emissiveMap: bodyGlimmerEmissiveMask,
      emissive: new Color(g.color),
      emissiveIntensity: 0.06 + g.amount * 0.58,
      metalness: Math.min(1, (config.metalness ?? 0.12) + g.amount * 0.26),
      roughness: Math.max(0.06, (config.roughness ?? 0.2) - g.amount * 0.1),
      specularColor: new Color(g.color),
      specularIntensity: 0.12 + g.amount * 0.98,
    };
  }, [config.glimmer, config.metalness, config.roughness, bodyGlimmerEmissiveMask]);

  const bioOn = config.bioluminescent?.enabled === true;
  const bioEmissiveTex = useMemo(() => {
    if (!bioOn) return null;
    return createBioluminescentEmissiveMap(256, 128, bodyColor);
  }, [bioOn, bodyColor]);

  useEffect(() => {
    return () => {
      disposeBioluminescentTexture(bioEmissiveTex ?? undefined);
    };
  }, [bioEmissiveTex]);

  /** UV: roter 90° så søm/mønster følger mave–ryg og hoved–hale i stedet for en tydelig lateral stribe. */
  useEffect(() => {
    const alignBodySurfaceUv = (t: Texture | null | undefined) => {
      if (!t) return;
      t.center.set(0.5, 0.5);
      t.rotation = Math.PI / 2;
      t.needsUpdate = true;
    };
    alignBodySurfaceUv(bodyDiffuseMap);
    alignBodySurfaceUv(scaleTextures.normalMap);
    alignBodySurfaceUv(bodyGlimmerEmissiveMask ?? undefined);
    alignBodySurfaceUv(bioEmissiveTex ?? undefined);
  }, [bodyDiffuseMap, scaleTextures.normalMap, bodyGlimmerEmissiveMask, bioEmissiveTex]);

  const puffAmt = config.pufferInflation?.puff ?? 0;
  const puffScale = 1 + puffAmt * 0.82;

  const bodyMaterialRef = useRef<MeshPhysicalMaterial | null>(null);
  const bodyGlass = config.bodyOpacity != null && config.bodyOpacity < 1;
  const lureColor = config.emissive != null ? hex(config.emissive) : '#39ff14';

  const partAdjustmentsResolved = useMemo(
    () => resolveSideFinPartAdjustments(config.partAdjustments),
    [config.partAdjustments]
  );

  const partProps = {
    adjustments: partAdjustmentsResolved,
    editorMode,
    selectedPart,
    onPartClick,
  };

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const speed = (config.speed || 1) * 2.5;
    const tailAmp = config.tailSwingAmplitude ?? 0.33;
    const paddle = (config.tailFinMovement ?? 'normal') === 'paddle';
    const swimPreview = !editorMode || editorSwimAnimation === true;

    const applyTailSwing = (wave: number) => {
      if (!tailGroup.current) return;
      if (paddle) {
        /** Padle (rokke/fugl): vip omkring Z (tværs gennem fisken) = op/ned i sagittalplan — ikke X (rulle om langsaks). */
        tailGroup.current.rotation.x = 0;
        tailGroup.current.rotation.y = 0;
        tailGroup.current.rotation.z = wave;
      } else {
        tailGroup.current.rotation.x = 0;
        tailGroup.current.rotation.z = 0;
        tailGroup.current.rotation.y = wave;
      }
    };

    if (bucketIdle && tailGroup.current && !config.isPiranha) {
      applyTailSwing(Math.sin(t * speed * 2) * tailAmp);
    }
    if (swimPreview && (bucketIdle || !config.isPiranha)) {
      const flap = Math.sin(t * speed * 2 + 0.5) * 0.5;
      if (leftFinRef.current) leftFinRef.current.rotation.z = -Math.PI / 2 + flap;
      if (rightFinRef.current) rightFinRef.current.rotation.z = -Math.PI / 2 + flap;

      const wave = Math.sin(t * speed * 2) * 0.35;
      const pelvicFlap = 0.2 - wave * 0.16;
      if (leftPelvicRef.current) leftPelvicRef.current.rotation.z = pelvicFlap;
      if (rightPelvicRef.current) rightPelvicRef.current.rotation.z = pelvicFlap;
    }
    if (!bucketIdle && root.current && !config.isPiranha && swimPreview) {
      root.current.rotation.y = t * 0.85;
      root.current.position.y = Math.sin(t * 2) * 0.18;
      if (tailGroup.current) {
        applyTailSwing(Math.sin(t * 12) * tailAmp);
      }
    }
    if (config.isPiranha && jawGroup.current) {
      const snap = Math.sin(t * 18);
      jawGroup.current.rotation.z = snap > 0.4 ? 0.25 : -0.15;
      const dart = Math.pow(Math.sin(t * 4), 7);
      if (root.current) {
        root.current.position.x = dart * 0.5;
        root.current.rotation.y += 0.01 + dart * 0.08;
      }
    }
    if (config.chameleonMode && bodyMaterialRef.current && !bioOn) {
      const hue = (t * 0.05) % 1;
      bodyMaterialRef.current.color.setHSL(hue, 1, 0.6);
      const gl = config.glimmer;
      if (!gl || gl.amount <= 0) {
        bodyMaterialRef.current.emissive.setHex(0x000000);
        bodyMaterialRef.current.emissiveIntensity = 0;
      }
    }
    if (bioOn && bodyMaterialRef.current && config.bioluminescent) {
      const int = config.bioluminescent.intensity;
      bodyMaterialRef.current.emissiveIntensity = int * (0.5 + Math.sin(t * 4) * 0.5);
    }
  });

  const tail = config.tail;

  const tailPivot = 0.885;
  const tailTx = (k: number) => sz * (tailPivot - k);
  const tailRootEmbed = sz * TAIL_ROOT_EMBED;
  const tailAlong = sz * TAIL_ANCHOR_ALONG_SZ;

  const tailNodes = (() => {
    if (tail === 'none' || tail === 'star') return null;
    if (tail === 'forked') {
      const h = 0.9;
      const rx = -(h / 2) - tailRootEmbed;
      return (
        <>
          <mesh
            castShadow
            renderOrder={10}
            rotation={[0, 0, TAIL_RZ_BASE - Math.PI / 4]}
            position={[rx, sy * 0.25, 0]}
          >
            <coneGeometry args={[0.28, h, 10]} />
            <StandardFinMaterial flatShading={bodyFlat} color={finHex} metalness={0.08} finOpacity={config.finOpacity}
            finGlimmer={config.finGlimmer}
            finGlimmerMask={finGlimmerEmissiveMask} />
          </mesh>
          <mesh
            castShadow
            renderOrder={10}
            rotation={[0, 0, TAIL_RZ_BASE - Math.PI * 0.75]}
            position={[rx, -sy * 0.25, 0]}
          >
            <coneGeometry args={[0.28, h, 10]} />
            <StandardFinMaterial flatShading={bodyFlat} color={finHex} metalness={0.08} finOpacity={config.finOpacity}
            finGlimmer={config.finGlimmer}
            finGlimmerMask={finGlimmerEmissiveMask} />
          </mesh>
        </>
      );
    }
    if (tail === 'shark') {
      const hL = 1.3;
      const hS = 0.7;
      return (
        <>
          <mesh
            castShadow
            renderOrder={10}
            rotation={[0, 0, TAIL_RZ_BASE - Math.PI / 3]}
            position={[-(hL / 2) - tailRootEmbed, sy * 0.45, 0]}
          >
            <coneGeometry args={[0.36, hL, 10]} />
            <StandardFinMaterial flatShading={bodyFlat} color={finHex} finOpacity={config.finOpacity}
            finGlimmer={config.finGlimmer}
            finGlimmerMask={finGlimmerEmissiveMask} />
          </mesh>
          <mesh
            castShadow
            renderOrder={10}
            rotation={[0, 0, TAIL_RZ_BASE - Math.PI * 0.62]}
            position={[-(hS / 2) - tailRootEmbed, -sy * 0.18, 0]}
          >
            <coneGeometry args={[0.18, hS, 8]} />
            <StandardFinMaterial flatShading={bodyFlat} color={finHex} finOpacity={config.finOpacity}
            finGlimmer={config.finGlimmer}
            finGlimmerMask={finGlimmerEmissiveMask} />
          </mesh>
        </>
      );
    }
    if (tail === 'standard' || tail === 'thin' || tail === 'chunky' || tail === 'flat' || tail === 'whip') {
      const coneArgs: [number, number, number] =
        tail === 'flat' || tail === 'whip'
          ? [0.45, 1.0, 12]
          : tail === 'thin'
            ? [0.32, 1.0, 14]
            : [0.38, 1.1, 14];
      const h = coneArgs[1];
      const chunkyScale = tail === 'chunky' ? ([1.14, 1.14, 1.14] as const) : undefined;
      const effH = h * (chunkyScale ? chunkyScale[1] : 1);
      const rx = -(effH / 2) - tailRootEmbed;
      return (
        <mesh
          key={`tail-cone-${tail}`}
          castShadow
          renderOrder={10}
          rotation={[0, 0, TAIL_RZ_BASE]}
          position={[rx, 0, 0]}
          scale={chunkyScale}
        >
          <coneGeometry args={coneArgs} />
          <StandardFinMaterial flatShading={bodyFlat} color={finHex} finOpacity={config.finOpacity}
            finGlimmer={config.finGlimmer}
            finGlimmerMask={finGlimmerEmissiveMask} />
        </mesh>
      );
    }
    if (tail === 'eel' || config.isEel) {
      const h = 0.7;
      return (
        <mesh castShadow renderOrder={10} rotation={[0, 0, TAIL_RZ_BASE]} position={[-(h / 2) - tailRootEmbed, 0, 0]}>
          <coneGeometry args={[0.18, h, 8]} />
          <StandardFinMaterial flatShading={bodyFlat} color={finHex} finOpacity={config.finOpacity}
            finGlimmer={config.finGlimmer}
            finGlimmerMask={finGlimmerEmissiveMask} />
        </mesh>
      );
    }
    if (tail === 'dino') {
      const h = 1.4;
      return (
        <mesh castShadow renderOrder={10} rotation={[0, 0, TAIL_RZ_BASE - Math.PI * 0.45]} position={[-(h / 2) - tailRootEmbed, sy * 0.35, 0]}>
          <coneGeometry args={[0.5, h, 10]} />
          <StandardFinMaterial flatShading={bodyFlat} color={finHex} finOpacity={config.finOpacity}
            finGlimmer={config.finGlimmer}
            finGlimmerMask={finGlimmerEmissiveMask} />
        </mesh>
      );
    }
    if (isExtrudedTailType(tail) && tailExtrudeGeo) {
      const ex = tailTx(0.72) - tailRootEmbed - sz * TAIL_EXTRUDED_ROOT_HALF;
      return (
        <mesh
          key={`tail-extruded-${tail}`}
          castShadow
          renderOrder={10}
          rotation={TAIL_EXTRUDED_EULER}
          position={[ex, 0, 0]}
          geometry={tailExtrudeGeo}
        >
          <StandardFinMaterial flatShading={bodyFlat} color={finHex} metalness={0.08} finOpacity={config.finOpacity}
            finGlimmer={config.finGlimmer}
            finGlimmerMask={finGlimmerEmissiveMask} />
        </mesh>
      );
    }
    const h = 1.1;
    return (
      <mesh
        castShadow
        renderOrder={10}
        rotation={[0, 0, TAIL_RZ_BASE]}
        position={[-(h / 2) - tailRootEmbed, 0, 0]}
      >
        <coneGeometry args={[0.38, h, 14]} />
        <StandardFinMaterial flatShading={bodyFlat} color={finHex} finOpacity={config.finOpacity}
            finGlimmer={config.finGlimmer}
            finGlimmerMask={finGlimmerEmissiveMask} />
      </mesh>
    );
  })();

  const sideFinScale = config.sideFinScale != null ? config.sideFinScale : 1;
  const pelvicFinScale = config.pelvicFinScale != null ? config.pelvicFinScale : 1;

  return (
    <group ref={root} scale={(config.scale || 1) * 0.55}>
      <PartGroup name="body" {...partProps}>
        <mesh castShadow geometry={bodyGeo} scale={[sz * 0.7 * puffScale, sy * 0.7 * puffScale, sx * 0.7]}>
          <meshPhysicalMaterial
            ref={bodyMaterialRef}
            flatShading={bodyFlat}
            color={tintMapIsFullAlbedo ? 0xffffff : bodyColor}
            map={bodyDiffuseMap}
            normalMap={scaleTextures.normalMap}
            normalScale={[1.2, 1.2]}
            metalness={config.metalness ?? 0.12}
            roughness={config.roughness ?? 0.2}
            clearcoat={0.5}
            clearcoatRoughness={0.08}
            emissive={
              bioOn && config.bioluminescent
                ? new Color(config.bioluminescent.color)
                : config.emissive != null
                  ? new Color(config.emissive)
                  : new Color(0x000000)
            }
            emissiveIntensity={
              bioOn ? 1 : config.emissive != null ? (config.emissiveIntensity ?? 0.45) : 0
            }
            {...(!bioOn ? bodyGlimmerMat : {})}
            {...(bioOn && bioEmissiveTex ? { emissiveMap: bioEmissiveTex } : {})}
            {...(bodyGlass
              ? {
                  transparent: true,
                  opacity: config.bodyOpacity!,
                  transmission: Math.min(1, Math.max(0, 1 - config.bodyOpacity! * 0.35)),
                  ior: 1.33,
                  thickness: 0.8,
                }
              : { transparent: false, opacity: 1, transmission: 0 }            )}
          />
        </mesh>
        {config.pufferInflation != null && (
          <PufferSpikesInstanced
            puff={config.pufferInflation.puff}
            spikeDensity={config.pufferInflation.spikeDensity}
            sx={sx}
            sy={sy}
            sz={sz}
            puffScale={puffScale}
            bodyProfile={bodyProfile}
            flatShading={bodyFlat}
          />
        )}
        {config.stripes && (
          <>
            {[0, 1].map((si) => (
              <mesh key={si} position={[sz * (0 - si * 0.22), 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                <torusGeometry args={[sy * 0.72, 0.075, 6, 20]} />
                <meshBasicMaterial color="#000000" transparent opacity={0.2} />
              </mesh>
            ))}
          </>
        )}
        {config.spots && (
          <>
            {Array.from({ length: 6 }, (_, si) => {
              const angle = (si / 6) * Math.PI * 2;
              const spotColor =
                typeof config.spots === 'number' ? `#${(config.spots >>> 0).toString(16).padStart(6, '0')}` : '#333';
              return (
                <mesh
                  key={si}
                  position={[
                    sz * (-0.1 + Math.cos(angle * 0.7) * 0.38),
                    sy * (Math.sin(angle) * 0.45),
                    sx * (Math.cos(angle) * 0.55),
                  ]}
                >
                  <sphereGeometry args={[0.085, 5, 4]} />
                  <meshBasicMaterial color={spotColor} />
                </mesh>
              );
            })}
          </>
        )}
      </PartGroup>
      {config.electricSparks && <ElectricSparksFX enabled />}
      {config.electricBolts && <ElectricBoltsFX enabled sx={sx} sy={sy} sz={sz} />}
      {!config.noEyes && !config.isPiranha && (
        <StandardFishEyes sx={sx} sy={sy} sz={sz} config={config} partProps={partProps} bodyProfile={bodyProfile} />
      )}
      {!config.isPiranha && (
        <StandardFishMouthTeeth sx={sx} sy={sy} sz={sz} config={config} partProps={partProps} />
      )}
      <PartGroup name="tail" {...partProps}>
        <group ref={tailGroup} position={[-sz * tailPivot, 0, 0]} scale={config.tailScale != null ? config.tailScale : 1}>
          <group position={[tailAlong, 0, 0]}>{tailNodes}</group>
        </group>
      </PartGroup>
      {(config.finUp || tail === 'shark' || config.spikes || config.dorsalFinType != null) && (
        <PartGroup name="dorsalFin" {...partProps}>
          <>
            {config.dorsalFinType != null && dorsalExtrudeGeo ? (
              <mesh
                castShadow
                renderOrder={10}
                geometry={dorsalExtrudeGeo}
                position={[sz * 0.15, dorsalY, 0]}
                rotation={[-dorsalExtraTilt, 0, 0]}
                scale={[1, 1, dorsalZScale]}
              >
                <StandardFinMaterial flatShading={bodyFlat} color={finHex} finOpacity={config.finOpacity}
                  finGlimmer={config.finGlimmer}
                  finGlimmerMask={finGlimmerEmissiveMask} />
              </mesh>
            ) : (
              Array.from({ length: config.spikes ? 3 : 1 }, (_, di) => (
                <mesh
                  key={di}
                  castShadow
                  renderOrder={10}
                  position={[sz * (0.15 - di * 0.2), dorsalY, 0]}
                  rotation={[-dorsalExtraTilt, 0, 0]}
                  scale={[1, 1, dorsalZScale]}
                >
                  <coneGeometry args={[0.2, 0.65, 8]} />
                  <StandardFinMaterial flatShading={bodyFlat} color={finHex} finOpacity={config.finOpacity}
                    finGlimmer={config.finGlimmer}
                    finGlimmerMask={finGlimmerEmissiveMask} />
                </mesh>
              ))
            )}
          </>
        </PartGroup>
      )}
      {/** Trekantet cylinder (3 segmenter) som før; anchor før rotation i SideFinPartGroup. */}
      <SideFinPartGroup
        name="leftFin"
        anchor={[sz * 0.28, -sy * 0.15, -sx * 0.68]}
        {...partProps}
      >
        <group scale={[1, 1, -1]}>
          <mesh
            ref={leftFinRef}
            castShadow
            renderOrder={10}
            rotation={[0, Math.PI / 2, -Math.PI / 2]}
            scale={[0.09 * sideFinScale, sideFinScale * 0.82, sideFinScale * 0.95]}
          >
            <cylinderGeometry args={[0, 0.42, 0.85, 3]} />
            <StandardFinMaterial
              flatShading={bodyFlat}
              color={finHex}
              roughness={0.38}
              finOpacity={config.finOpacity}
              finGlimmer={config.finGlimmer}
              finGlimmerMask={finGlimmerEmissiveMask}
            />
          </mesh>
        </group>
      </SideFinPartGroup>
      <SideFinPartGroup name="rightFin" anchor={[sz * 0.28, -sy * 0.15, sx * 0.68]} {...partProps}>
        <mesh
          ref={rightFinRef}
          castShadow
          renderOrder={10}
          rotation={[0, Math.PI / 2, -Math.PI / 2]}
          scale={[0.09 * sideFinScale, sideFinScale * 0.82, sideFinScale * 0.95]}
        >
          <cylinderGeometry args={[0, 0.42, 0.85, 3]} />
          <StandardFinMaterial
            flatShading={bodyFlat}
            color={finHex}
            roughness={0.38}
            finOpacity={config.finOpacity}
            finGlimmer={config.finGlimmer}
            finGlimmerMask={finGlimmerEmissiveMask}
          />
        </mesh>
      </SideFinPartGroup>
      {config.showPelvicFins && (
        <PartGroup name="pelvicFins" {...partProps}>
          <mesh
            ref={leftPelvicRef}
            castShadow
            renderOrder={10}
            position={[sz * 0.08, -sy * 0.42 * pelvicYFactor, sx * 0.4]}
            rotation={[Math.PI / 2 - 0.65, 0, 0.2]}
            scale={[0.09 * pelvicFinScale, pelvicFinScale * 0.82, pelvicFinScale * 0.95]}
          >
            <cylinderGeometry args={[0, 0.38, 0.78, 3]} />
            <StandardFinMaterial flatShading={bodyFlat} color={finHex} roughness={0.38} finOpacity={config.finOpacity}
              finGlimmer={config.finGlimmer}
              finGlimmerMask={finGlimmerEmissiveMask} />
          </mesh>
          <group position={[sz * 0.08, -sy * 0.42 * pelvicYFactor, -sx * 0.4]} scale={[1, 1, -1]}>
            <mesh
              ref={rightPelvicRef}
              castShadow
              renderOrder={10}
              rotation={[Math.PI / 2 - 0.65, 0, 0.2]}
              scale={[0.09 * pelvicFinScale, pelvicFinScale * 0.82, pelvicFinScale * 0.95]}
            >
              <cylinderGeometry args={[0, 0.38, 0.78, 3]} />
              <StandardFinMaterial flatShading={bodyFlat} color={finHex} roughness={0.38} finOpacity={config.finOpacity}
                finGlimmer={config.finGlimmer}
                finGlimmerMask={finGlimmerEmissiveMask} />
            </mesh>
          </group>
        </PartGroup>
      )}
      {config.sword && (
        <PartGroup name="sword" {...partProps}>
          <mesh castShadow position={[sz * 0.75 + 1.0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.045, 0.02, 2.0, 6]} />
            <meshStandardMaterial {...bodyMat} />
          </mesh>
        </PartGroup>
      )}
      {config.longBeak && (
        <PartGroup name="beak" {...partProps}>
          <mesh castShadow position={[sz * 0.75 + sz * 0.4, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.07, 0.03, sz * 0.9, 6]} />
            <meshStandardMaterial {...bodyMat} />
          </mesh>
        </PartGroup>
      )}
      {config.whiskers && (
        <PartGroup name="whiskers" {...partProps}>
          <>
            {[-0.12, 0.12].map((yOff, wi) => (
              <mesh
                key={wi}
                castShadow
                position={[sz * 0.72, yOff, sx * 0.25 * (wi === 0 ? 1 : -1)]}
                rotation={[0, 0, 0.5]}
              >
                <cylinderGeometry args={[0.02, 0.01, 0.55, 4]} />
                <StandardFinMaterial flatShading={bodyFlat} color={finHex} roughness={0.4} finOpacity={config.finOpacity}
            finGlimmer={config.finGlimmer}
            finGlimmerMask={finGlimmerEmissiveMask} />
              </mesh>
            ))}
          </>
        </PartGroup>
      )}
      {config.isDino && (
        <>
          <PartGroup name="dinoHead" {...partProps}>
            <mesh castShadow position={[sz * 0.72, sy * 0.55, 0]} rotation={[0, 0, -Math.PI / 3]}>
              <cylinderGeometry args={[0.2, 0.28, 1.4, 8]} />
              <meshStandardMaterial {...bodyMat} />
            </mesh>
            <mesh castShadow position={[sz * 1.1, sy * 1.1, 0]}>
              <sphereGeometry args={[0.3, 10, 8]} />
              <meshStandardMaterial {...bodyMat} />
            </mesh>
            <mesh position={[sz * 1.24, sy * 1.18, 0.17]}>
              <sphereGeometry args={[0.07, 6, 5]} />
              <meshBasicMaterial color="#111" />
            </mesh>
            <mesh position={[sz * 1.24, sy * 1.18, -0.17]}>
              <sphereGeometry args={[0.07, 6, 5]} />
              <meshBasicMaterial color="#111" />
            </mesh>
          </PartGroup>
          <PartGroup name="dinoLegs" {...partProps}>
            <mesh castShadow position={[sz * 0.2, -sy * 0.6, sx * 0.85]} scale={[1.6, 0.35, 1]}>
              <sphereGeometry args={[0.35, 8, 6]} />
              <meshStandardMaterial {...bodyMat} />
            </mesh>
            <mesh castShadow position={[sz * 0.2, -sy * 0.6, -sx * 0.85]} scale={[1.6, 0.35, 1]}>
              <sphereGeometry args={[0.35, 8, 6]} />
              <meshStandardMaterial {...bodyMat} />
            </mesh>
          </PartGroup>
        </>
      )}
      {(config.lure || config.isBossGorm) && (
        <PartGroup name="lure" {...partProps}>
          <>
            <mesh castShadow position={[sz * 0.35, sy * 0.7, 0]} rotation={[0, 0, -0.45]}>
              <cylinderGeometry args={[0.04, 0.04, 1.2, 6]} />
              <meshStandardMaterial {...bodyMat} />
            </mesh>
            <mesh castShadow position={[sz * 0.7, sy * 1.15, 0]}>
              <sphereGeometry args={[0.17, 10, 8]} />
              <meshStandardMaterial color={lureColor} emissive={lureColor} emissiveIntensity={1.2} />
            </mesh>
            <pointLight color={lureColor} intensity={1.2} distance={4} position={[sz * 0.7, sy * 1.15, 0]} />
          </>
        </PartGroup>
      )}
      {config.isPiranha && (
        <>
          <PartGroup name="jaw" {...partProps}>
            <group ref={jawGroup} position={[0, 0, 0]}>
              <mesh castShadow position={[sz * 0.5, -sy * 0.25, 0]} rotation={[0, 0, -0.15]}>
                <boxGeometry args={[sz * 0.6, sy * 0.35, sx * 0.6]} />
                <meshStandardMaterial color="#8b2500" roughness={0.5} />
              </mesh>
              {Array.from({ length: 5 }, (_, i) => (
                <mesh
                  key={i}
                  position={[sz * 0.75, -sy * 0.1, (i - 2) * (sx * 0.12)]}
                  rotation={[0, 0, -0.3]}
                >
                  <coneGeometry args={[0.03, 0.15, 4]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
              ))}
            </group>
          </PartGroup>
          <PartGroup name="leftEye" {...partProps}>
            <mesh position={[sz * 0.65, sy * 0.2, -sx * 0.56]}>
              <sphereGeometry args={[0.07, 8, 6]} />
              <meshBasicMaterial color="#ff0000" />
            </mesh>
          </PartGroup>
          <PartGroup name="rightEye" {...partProps}>
            <mesh position={[sz * 0.65, sy * 0.2, sx * 0.56]}>
              <sphereGeometry args={[0.07, 8, 6]} />
              <meshBasicMaterial color="#ff0000" />
            </mesh>
          </PartGroup>
        </>
      )}
    </group>
  );
}
