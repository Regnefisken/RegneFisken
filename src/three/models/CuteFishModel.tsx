import { useEffect, useMemo, useRef } from 'react';
import {
  CatmullRomCurve3,
  Color,
  DoubleSide,
  MathUtils,
  Vector3,
  TubeGeometry,
  type Group,
} from 'three';
import { useFrame } from '@react-three/fiber';
import type { FishModelConfig } from '../../types/fish.js';
import {
  createFishLatheGeometry,
  getScaleTextures,
  resolveBodyColor,
} from './cuteFishUtils.js';

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

function WhiteSharkCatch({ bucketIdle }: { bucketIdle?: boolean }) {
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
          <meshStandardMaterial color={top} roughness={0.35} metalness={0.15} />
        </mesh>
        <mesh castShadow scale={[1.55, 1.75, 4.4]} position={[0, -0.05, 0]}>
          <sphereGeometry args={[0.95, 16, 12, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.45]} />
          <meshStandardMaterial color={belly} roughness={0.3} metalness={0.05} />
        </mesh>
        <mesh castShadow position={[0, 0.1, 5.2]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.2, 1, 1]}>
          <coneGeometry args={[1.0, 3.2, 14]} />
          <meshStandardMaterial color={top} roughness={0.35} />
        </mesh>
        <mesh castShadow position={[0, -0.4, 3.8]} scale={[1.3, 0.5, 1]}>
          <sphereGeometry args={[0.8, 12, 8, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5]} />
          <meshStandardMaterial color={belly} roughness={0.35} />
        </mesh>
        <mesh castShadow position={[0, 2.6, 0.5]} scale={[0.4, 1.0, 1.2]}>
          <coneGeometry args={[0.5, 2.8, 8]} />
          <meshStandardMaterial color={top} roughness={0.4} />
        </mesh>
        <mesh ref={stem} castShadow rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -4.5]}>
          <cylinderGeometry args={[0.4, 0.25, 2.5, 8]} />
          <meshStandardMaterial color={top} roughness={0.35} />
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

function GoldenCarpCatch({ bucketIdle }: { bucketIdle?: boolean }) {
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
}: {
  config: FishModelConfig;
  fishModelId: string;
  instanceId: string;
  rollColor: number;
  bucketIdle?: boolean;
}) {
  const bodyColor = useMemo(
    () => resolveBodyColor(config, fishModelId, rollColor, instanceId),
    [config, fishModelId, rollColor, instanceId]
  );
  const colHex = hex(bodyColor);
  const finHex = config.redFins ? '#ff4444' : colHex;

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

  if (config.isStarfish) return <StarfishModel bodyMat={bodyMat} scale={config.scale * 0.8} bucketIdle={bucketIdle} />;
  if (config.isFrog && !config.isGoldenFrog)
    return <FrogModel bodyMat={bodyMat} scale={config.scale * 0.75} bucketIdle={bucketIdle} />;
  if (config.isCrab) return <CrabModel bodyMat={bodyMat} config={config} scale={config.scale * 0.75} bucketIdle={bucketIdle} />;
  if (config.isOctopus) return <OctopusModel bodyMat={bodyMat} scale={config.scale * 0.65} bucketIdle={bucketIdle} />;
  if (config.isLobster) return <LobsterModel bodyMat={bodyMat} scale={config.scale * 0.72} bucketIdle={bucketIdle} />;
  if (config.isRay) return <RayModel bodyMat={bodyMat} scale={config.scale * 0.7} bucketIdle={bucketIdle} />;
  if (config.isWhiteShark) return <WhiteSharkCatch bucketIdle={bucketIdle} />;
  if (config.isGoldenCarp) return <GoldenCarpCatch bucketIdle={bucketIdle} />;
  if (config.isBottle) return <BottleModel scale={config.scale || 1} bucketIdle={bucketIdle} />;
  if (config.isOyster) return <OysterModel config={config} scale={config.scale || 1} bucketIdle={bucketIdle} />;
  if (config.isConch) return <ConchModel scale={config.scale ?? 1} bucketIdle={bucketIdle} />;
  if (config.isFossil) return <FossilModel scale={config.scale || 1} bucketIdle={bucketIdle} />;

  return (
    <StandardFishModel
      config={config}
      bodyColor={bodyColor}
      finHex={finHex}
      bodyMat={bodyMat}
      bucketIdle={bucketIdle}
    />
  );
}

function StarfishModel({
  bodyMat,
  scale,
  bucketIdle,
}: {
  bodyMat: { color: string; roughness: number; metalness: number; emissive: string; emissiveIntensity: number };
  scale: number;
  bucketIdle?: boolean;
}) {
  const g = useRef<Group>(null);
  useFrame(() => {
    if (g.current) g.current.rotation.z += bucketIdle ? 0.002 : 0.004;
  });
  return (
    <group ref={g} scale={scale} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.38, 0.35, 0.18, 12]} />
        <meshStandardMaterial {...bodyMat} />
      </mesh>
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
      <mesh position={[0.18, 0.12, 0.1]}>
        <sphereGeometry args={[0.07, 6, 5]} />
        <meshBasicMaterial color="#111" />
      </mesh>
      <mesh position={[0.18, 0.12, -0.1]}>
        <sphereGeometry args={[0.07, 6, 5]} />
        <meshBasicMaterial color="#111" />
      </mesh>
    </group>
  );
}

function FrogModel({
  bodyMat,
  scale,
  bucketIdle,
}: {
  bodyMat: Record<string, unknown>;
  scale: number;
  bucketIdle?: boolean;
}) {
  const g = useRef<Group>(null);
  useFrame(() => {
    if (g.current) g.current.rotation.y += bucketIdle ? 0.004 : 0.008;
  });
  return (
    <group ref={g} scale={scale}>
      <mesh castShadow scale={[1.3, 0.75, 1.1]}>
        <sphereGeometry args={[0.5, 12, 10]} />
        <meshStandardMaterial {...(bodyMat as object)} />
      </mesh>
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
      {[[-0.3, -0.3, 0.35], [-0.3, -0.3, -0.35], [0.1, -0.4, 0.38], [0.1, -0.4, -0.38]].map((p, i) => (
        <mesh key={i} castShadow position={p as [number, number, number]} rotation={[0, 0, 0.5]}>
          <cylinderGeometry args={[0.07, 0.05, 0.38, 6]} />
          <meshStandardMaterial {...(bodyMat as object)} />
        </mesh>
      ))}
    </group>
  );
}

function CrabModel({
  bodyMat,
  config,
  scale,
  bucketIdle,
}: {
  bodyMat: Record<string, unknown>;
  config: FishModelConfig;
  scale: number;
  bucketIdle?: boolean;
}) {
  const g = useRef<Group>(null);
  useFrame(() => {
    if (g.current) g.current.rotation.y += bucketIdle ? 0.004 : 0.007;
  });
  const thin = config.thinLegs;
  const legThick = thin ? 0.025 : 0.045;
  const legThin = thin ? 0.015 : 0.035;
  const legLen = thin ? 0.85 : 0.55;
  const legCount = thin ? 5 : 4;
  return (
    <group ref={g} scale={scale}>
      <mesh castShadow scale={thin ? [1.1, 0.55, 1.1] : [1.5, 0.55, 1.1]}>
        <sphereGeometry args={[0.55, 12, 8]} />
        <meshStandardMaterial {...(bodyMat as object)} />
      </mesh>
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
      {!thin && (
        <>
          <mesh castShadow position={[0.62, 0, 0.55]} scale={[1.3, 0.75, 0.9]}>
            <sphereGeometry args={[0.18, 8, 7]} />
            <meshStandardMaterial {...(bodyMat as object)} />
          </mesh>
          <mesh castShadow position={[0.62, 0, -0.55]} scale={[1.3, 0.75, 0.9]}>
            <sphereGeometry args={[0.18, 8, 7]} />
            <meshStandardMaterial {...(bodyMat as object)} />
          </mesh>
        </>
      )}
      <mesh position={[0.55, 0.25, 0.25]}>
        <sphereGeometry args={[0.09, 6, 5]} />
        <meshBasicMaterial color="#111" />
      </mesh>
      <mesh position={[0.55, 0.25, -0.25]}>
        <sphereGeometry args={[0.09, 6, 5]} />
        <meshBasicMaterial color="#111" />
      </mesh>
    </group>
  );
}

function OctopusModel({
  bodyMat,
  scale,
  bucketIdle,
}: {
  bodyMat: Record<string, unknown>;
  scale: number;
  bucketIdle?: boolean;
}) {
  const g = useRef<Group>(null);
  useFrame(() => {
    if (g.current) g.current.rotation.y += bucketIdle ? 0.003 : 0.006;
  });
  return (
    <group ref={g} scale={scale}>
      <mesh castShadow position={[0, 0.45, 0]} scale={[1, 1.3, 1]}>
        <sphereGeometry args={[0.55, 14, 12]} />
        <meshStandardMaterial {...(bodyMat as object)} />
      </mesh>
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
    </group>
  );
}

function LobsterModel({
  bodyMat,
  scale,
  bucketIdle,
}: {
  bodyMat: Record<string, unknown>;
  scale: number;
  bucketIdle?: boolean;
}) {
  const g = useRef<Group>(null);
  useFrame(() => {
    if (g.current) g.current.rotation.y += bucketIdle ? 0.003 : 0.006;
  });
  return (
    <group ref={g} scale={scale}>
      <mesh castShadow position={[-0.15, 0, 0]} scale={[1.5, 0.65, 1]}>
        <sphereGeometry args={[0.45, 10, 8]} />
        <meshStandardMaterial {...(bodyMat as object)} />
      </mesh>
      <mesh castShadow position={[0.75, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.28, 0.18, 0.9, 8]} />
        <meshStandardMaterial {...(bodyMat as object)} />
      </mesh>
      <mesh castShadow position={[-0.52, 0.1, 0.55]} scale={[1.4, 0.85, 1.1]}>
        <sphereGeometry args={[0.22, 9, 7]} />
        <meshStandardMaterial {...(bodyMat as object)} />
      </mesh>
      <mesh castShadow position={[-0.52, 0.1, -0.55]} scale={[1.4, 0.85, 1.1]}>
        <sphereGeometry args={[0.22, 9, 7]} />
        <meshStandardMaterial {...(bodyMat as object)} />
      </mesh>
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
      <mesh position={[-0.52, 0.32, 0.2]}>
        <sphereGeometry args={[0.07, 6, 5]} />
        <meshBasicMaterial color="#111" />
      </mesh>
      <mesh position={[-0.52, 0.32, -0.2]}>
        <sphereGeometry args={[0.07, 6, 5]} />
        <meshBasicMaterial color="#111" />
      </mesh>
    </group>
  );
}

function RayModel({
  bodyMat,
  scale,
  bucketIdle,
}: {
  bodyMat: Record<string, unknown>;
  scale: number;
  bucketIdle?: boolean;
}) {
  const g = useRef<Group>(null);
  useFrame(() => {
    if (g.current) g.current.rotation.y += bucketIdle ? 0.002 : 0.005;
  });
  return (
    <group ref={g} scale={scale}>
      <mesh castShadow scale={[1, 0.18, 1.55]}>
        <sphereGeometry args={[0.7, 14, 12]} />
        <meshStandardMaterial {...(bodyMat as object)} />
      </mesh>
      <mesh castShadow position={[0, 0.02, 0.8]} rotation={[0, 0, Math.PI / 2]} scale={[1, 0.18, 1.5]}>
        <coneGeometry args={[0.35, 1.3, 6]} />
        <meshStandardMaterial {...(bodyMat as object)} />
      </mesh>
      <mesh castShadow position={[0, 0.02, -0.8]} rotation={[0, Math.PI, Math.PI / 2]} scale={[1, 0.18, 1.5]}>
        <coneGeometry args={[0.35, 1.3, 6]} />
        <meshStandardMaterial {...(bodyMat as object)} />
      </mesh>
      <mesh castShadow position={[-1.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.02, 1.4, 5]} />
        <meshStandardMaterial {...(bodyMat as object)} />
      </mesh>
      <mesh position={[0.45, 0.14, 0.3]}>
        <sphereGeometry args={[0.065, 6, 5]} />
        <meshBasicMaterial color="#111" />
      </mesh>
      <mesh position={[0.45, 0.14, -0.3]}>
        <sphereGeometry args={[0.065, 6, 5]} />
        <meshBasicMaterial color="#111" />
      </mesh>
    </group>
  );
}

function BottleModel({ scale, bucketIdle }: { scale: number; bucketIdle?: boolean }) {
  const g = useRef<Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (g.current) {
      g.current.rotation.y += bucketIdle ? 0.006 : 0.01;
      g.current.position.y = -0.2 + Math.sin(t * 2) * (bucketIdle ? 0.04 : 0.1);
    }
  });
  return (
    <group ref={g} scale={scale * 0.55} position={[0, -0.2, 0]}>
      <mesh castShadow position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 1.2, 12]} />
        <meshPhysicalMaterial
          color="#88ccaa"
          transmission={0.75}
          thickness={0.25}
          roughness={0.12}
          transparent
        />
      </mesh>
      <mesh castShadow position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.15, 0.4, 0.4, 12]} />
        <meshPhysicalMaterial color="#88ccaa" transmission={0.7} thickness={0.15} roughness={0.15} transparent />
      </mesh>
      <mesh castShadow position={[0, 1.75, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.3, 12]} />
        <meshPhysicalMaterial color="#88ccaa" transmission={0.65} roughness={0.15} transparent />
      </mesh>
      <mesh castShadow position={[0, 1.95, 0]}>
        <cylinderGeometry args={[0.12, 0.14, 0.2, 8]} />
        <meshStandardMaterial color="#8b5a2b" />
      </mesh>
      <mesh castShadow position={[0, 0.6, 0]} rotation={[0.2, 0, 0.2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.8, 8]} />
        <meshStandardMaterial color="#fffdd0" />
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
}) {
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

function ConchModel({ scale, bucketIdle }: { scale: number; bucketIdle?: boolean }) {
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

function FossilModel({ scale, bucketIdle }: { scale: number; bucketIdle?: boolean }) {
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

function StandardFishModel({
  config,
  bodyColor,
  finHex,
  bodyMat,
  bucketIdle,
}: {
  config: FishModelConfig;
  bodyColor: number;
  finHex: string;
  bodyMat: { color: string; roughness: number; metalness: number; emissive: string; emissiveIntensity: number };
  bucketIdle?: boolean;
}) {
  const root = useRef<Group>(null);
  const tailGroup = useRef<Group>(null);
  const jawGroup = useRef<Group>(null);

  const [sx, sy, sz] = config.bodyShape;
  const latheGeo = useMemo(() => createFishLatheGeometry(28), []);
  useEffect(() => () => latheGeo.dispose(), [latheGeo]);

  const textures = useMemo(() => getScaleTextures(bodyColor, 'medium'), [bodyColor]);
  const lureColor = config.emissive != null ? hex(config.emissive) : '#39ff14';

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const speed = (config.speed || 1) * 2.5;
    if (bucketIdle && tailGroup.current) {
      tailGroup.current.rotation.y = Math.sin(t * speed * 2) * 0.35;
    }
    if (!bucketIdle && root.current && !config.isPiranha) {
      root.current.rotation.y = t * 0.85;
      root.current.position.y = Math.sin(t * 2) * 0.18;
      if (tailGroup.current) tailGroup.current.rotation.y = Math.sin(t * 12) * 0.35;
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
  });

  const tail = config.tail;

  const tailNodes = (() => {
    if (tail === 'none' || tail === 'star') return null;
    if (tail === 'forked') {
      return (
        <>
          <mesh castShadow rotation={[0, 0, -Math.PI / 4]} position={[-sz * 0.72, sy * 0.25, 0]}>
            <coneGeometry args={[0.28, 0.9, 10]} />
            <meshStandardMaterial color={finHex} roughness={0.35} metalness={0.08} />
          </mesh>
          <mesh castShadow rotation={[0, 0, -Math.PI * 0.75]} position={[-sz * 0.72, -sy * 0.25, 0]}>
            <coneGeometry args={[0.28, 0.9, 10]} />
            <meshStandardMaterial color={finHex} roughness={0.35} metalness={0.08} />
          </mesh>
        </>
      );
    }
    if (tail === 'shark') {
      return (
        <>
          <mesh castShadow rotation={[0, 0, -Math.PI / 3]} position={[-sz * 0.72, sy * 0.45, 0]}>
            <coneGeometry args={[0.36, 1.3, 10]} />
            <meshStandardMaterial color={finHex} roughness={0.35} />
          </mesh>
          <mesh castShadow rotation={[0, 0, -Math.PI * 0.62]} position={[-sz * 0.68, -sy * 0.18, 0]}>
            <coneGeometry args={[0.18, 0.7, 8]} />
            <meshStandardMaterial color={finHex} roughness={0.35} />
          </mesh>
        </>
      );
    }
    if (tail === 'flat' || tail === 'whip') {
      return (
        <mesh castShadow rotation={[0, 0, Math.PI / 2]} position={[-sz * 0.72, 0, 0]}>
          <coneGeometry args={[0.45, 1.0, 12]} />
          <meshStandardMaterial color={finHex} roughness={0.35} />
        </mesh>
      );
    }
    if (tail === 'eel' || config.isEel) {
      return (
        <mesh castShadow rotation={[0, 0, Math.PI / 2]} position={[-sz * 0.8, 0, 0]}>
          <coneGeometry args={[0.18, 0.7, 8]} />
          <meshStandardMaterial color={finHex} roughness={0.35} />
        </mesh>
      );
    }
    if (tail === 'dino') {
      return (
        <mesh castShadow rotation={[0, 0, -Math.PI * 0.45]} position={[-sz * 0.8, sy * 0.35, 0]}>
          <coneGeometry args={[0.5, 1.4, 10]} />
          <meshStandardMaterial color={finHex} roughness={0.35} />
        </mesh>
      );
    }
    return (
      <mesh castShadow rotation={[0, 0, Math.PI / 2]} position={[-sz * 0.75, 0, 0]}>
        <coneGeometry args={[0.38, 1.1, 14]} />
        <meshStandardMaterial color={finHex} roughness={0.35} />
      </mesh>
    );
  })();

  return (
    <group ref={root} scale={(config.scale || 1) * 0.55}>
      <mesh castShadow geometry={latheGeo} scale={[sz * 0.7, sy * 0.7, sx * 0.7]}>
        <meshPhysicalMaterial
          color={bodyColor}
          map={textures.map}
          normalMap={textures.normalMap}
          normalScale={[1.2, 1.2]}
          metalness={config.metalness ?? 0.12}
          roughness={config.roughness ?? 0.2}
          clearcoat={0.35}
          clearcoatRoughness={0.1}
          emissive={new Color(bodyColor).lerp(new Color(0x4488ff), 0.08)}
          emissiveIntensity={0.06}
        />
      </mesh>
      {!config.noEyes && !config.isPiranha && (
        <>
          <mesh position={[sz * 0.65, sy * 0.15, sx * 0.55]}>
            <sphereGeometry args={[0.14, 10, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[sz * 0.73, sy * 0.16, sx * 0.57]}>
            <sphereGeometry args={[0.08, 8, 6]} />
            <meshBasicMaterial color="#111111" />
          </mesh>
          <mesh position={[sz * 0.76, sy * 0.21, sx * 0.59]}>
            <sphereGeometry args={[0.035, 5, 4]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[sz * 0.65, sy * 0.15, -sx * 0.55]}>
            <sphereGeometry args={[0.14, 10, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[sz * 0.73, sy * 0.16, -sx * 0.57]}>
            <sphereGeometry args={[0.08, 8, 6]} />
            <meshBasicMaterial color="#111111" />
          </mesh>
          <mesh position={[sz * 0.76, sy * 0.21, -sx * 0.59]}>
            <sphereGeometry args={[0.035, 5, 4]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </>
      )}
      <group ref={tailGroup}>{tailNodes}</group>
      {(config.finUp || tail === 'shark' || config.spikes) && (
        <>
          {Array.from({ length: config.spikes ? 3 : 1 }, (_, di) => (
            <mesh
              key={di}
              castShadow
              position={[sz * (0.15 - di * 0.2), sy * 0.68, 0]}
            >
              <coneGeometry args={[0.2, 0.65, 8]} />
              <meshStandardMaterial color={finHex} roughness={0.35} />
            </mesh>
          ))}
        </>
      )}
      <mesh castShadow position={[sz * 0.12, -sy * 0.28, sx * 0.7]} rotation={[0.5, 0, 0.6]}>
        <coneGeometry args={[0.15, 0.55, 7]} />
        <meshStandardMaterial color={finHex} roughness={0.35} />
      </mesh>
      <mesh castShadow position={[sz * 0.12, -sy * 0.28, -sx * 0.7]} rotation={[-0.5, 0, 0.6]}>
        <coneGeometry args={[0.15, 0.55, 7]} />
        <meshStandardMaterial color={finHex} roughness={0.35} />
      </mesh>
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
      {config.sword && (
        <mesh castShadow position={[sz * 0.75 + 1.0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.045, 0.02, 2.0, 6]} />
          <meshStandardMaterial {...bodyMat} />
        </mesh>
      )}
      {config.longBeak && (
        <mesh castShadow position={[sz * 0.75 + sz * 0.4, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.03, sz * 0.9, 6]} />
          <meshStandardMaterial {...bodyMat} />
        </mesh>
      )}
      {config.whiskers && (
        <>
          {[-0.12, 0.12].map((yOff, wi) => (
            <mesh
              key={wi}
              castShadow
              position={[sz * 0.72, yOff, sx * 0.25 * (wi === 0 ? 1 : -1)]}
              rotation={[0, 0, 0.5]}
            >
              <cylinderGeometry args={[0.02, 0.01, 0.55, 4]} />
              <meshStandardMaterial color={finHex} roughness={0.4} />
            </mesh>
          ))}
        </>
      )}
      {config.isDino && (
        <>
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
          <mesh castShadow position={[sz * 0.2, -sy * 0.6, sx * 0.85]} scale={[1.6, 0.35, 1]}>
            <sphereGeometry args={[0.35, 8, 6]} />
            <meshStandardMaterial {...bodyMat} />
          </mesh>
          <mesh castShadow position={[sz * 0.2, -sy * 0.6, -sx * 0.85]} scale={[1.6, 0.35, 1]}>
            <sphereGeometry args={[0.35, 8, 6]} />
            <meshStandardMaterial {...bodyMat} />
          </mesh>
        </>
      )}
      {(config.lure || config.isBossGorm) && (
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
      )}
      {config.isPiranha && (
        <>
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
          <mesh position={[sz * 0.65, sy * 0.2, sx * 0.56]}>
            <sphereGeometry args={[0.07, 8, 6]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
          <mesh position={[sz * 0.65, sy * 0.2, -sx * 0.56]}>
            <sphereGeometry args={[0.07, 8, 6]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
        </>
      )}
    </group>
  );
}
