import { useMemo, useRef } from 'react';
import { DoubleSide, Group } from 'three';
import { useFrame } from '@react-three/fiber';

/** Legacy createCatchModel plesiosaur-gren (skaleret, flipper-paddle). */
export function PlesiosaurusCatchModel({
  bucketIdle,
  /** Mole-NPC efter fangst: ingen Y-snurre — verdens-`rotation.y` som legacy (~-0.2π). */
  ambientPierNpc,
}: {
  bucketIdle?: boolean;
  ambientPierNpc?: boolean;
}) {
  const root = useRef<Group>(null);
  const dino = useRef<Group>(null);
  const flaps = [
    useRef<Group>(null),
    useRef<Group>(null),
    useRef<Group>(null),
    useRef<Group>(null),
  ] as const;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const r = root.current;
    const d = dino.current;
    if (r && !ambientPierNpc) {
      r.rotation.y += bucketIdle ? 0.004 : 0.008;
    }
    if (d) {
      d.position.y = Math.sin(t * 1.5) * (bucketIdle ? 0.04 : 0.12);
      d.rotation.z = Math.sin(t * 1.2) * (bucketIdle ? 0.015 : 0.03);
    }
    const paddleSpeed = t * 3;
    const front = Math.sin(paddleSpeed) * (bucketIdle ? 0.15 : 0.4);
    const back = Math.sin(paddleSpeed - 1) * (bucketIdle ? 0.12 : 0.3);
    flaps[0].current!.rotation.z = front;
    flaps[1].current!.rotation.z = -front;
    flaps[2].current!.rotation.z = back;
    flaps[3].current!.rotation.z = -back;
  });

  const mat = { color: '#2e8b57', roughness: 0.5, metalness: 0.1 } as const;

  return (
    <group ref={root} scale={0.055}>
      <group ref={dino}>
        <mesh castShadow position={[0, 1.2, 0]} scale={[1.5, 0.8, 1]}>
          <sphereGeometry args={[2, 24, 16]} />
          <meshStandardMaterial {...mat} />
        </mesh>
        <mesh castShadow position={[3.5, 3, 0]} rotation={[0, 0, -Math.PI / 4]}>
          <cylinderGeometry args={[0.4, 0.8, 4, 14]} />
          <meshStandardMaterial {...mat} />
        </mesh>
        <mesh castShadow position={[5.2, 4.5, 0]} scale={[1.2, 0.8, 0.8]}>
          <sphereGeometry args={[0.8, 14, 12]} />
          <meshStandardMaterial {...mat} />
        </mesh>
        <mesh castShadow position={[-3.5, 1, 0]} rotation={[0, 0, Math.PI / 2.2]}>
          <cylinderGeometry args={[0.1, 0.8, 5, 12]} />
          <meshStandardMaterial {...mat} />
        </mesh>
        <group position={[5.5, 4.7, 0.55]}>
          <mesh>
            <sphereGeometry args={[0.22, 12, 10]} />
            <meshStandardMaterial color="#fff" roughness={0.5} />
          </mesh>
          <mesh position={[0.12, 0, 0.12]}>
            <sphereGeometry args={[0.12, 10, 8]} />
            <meshStandardMaterial color="#111" roughness={0.2} />
          </mesh>
        </group>
        <group position={[5.5, 4.7, -0.55]}>
          <mesh>
            <sphereGeometry args={[0.22, 12, 10]} />
            <meshStandardMaterial color="#fff" roughness={0.5} />
          </mesh>
          <mesh position={[0.12, 0, -0.12]}>
            <sphereGeometry args={[0.12, 10, 8]} />
            <meshStandardMaterial color="#111" roughness={0.2} />
          </mesh>
        </group>
        <group position={[0, 2.0, 0]}>
          <mesh>
            <boxGeometry args={[1.8, 0.2, 1.8]} />
            <meshStandardMaterial color="#5c4033" roughness={0.9} />
          </mesh>
          <mesh position={[0, -0.05, 0]}>
            <boxGeometry args={[2.2, 0.1, 2.2]} />
            <meshStandardMaterial color="#b22222" roughness={0.85} />
          </mesh>
          <mesh position={[0.6, 0.3, 0]} rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.6, 8]} />
            <meshStandardMaterial color="#aaa" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
        {(
          [
            [1.5, 0.2, 1.2, -Math.PI / 2],
            [1.5, 0.2, -1.2, Math.PI / 2],
            [-1.5, 0.2, 1.0, -Math.PI / 2],
            [-1.5, 0.2, -1.0, Math.PI / 2],
          ] as const
        ).map(([x, y, z, ry], i) => (
          <group key={i} position={[x, y, z]} rotation={[0, ry, 0]}>
            <group ref={flaps[i]}>
              <mesh position={[1.5, 0, 0]} scale={[1.5, 0.15, 0.8]} castShadow>
                <sphereGeometry args={[1, 12, 10]} />
                <meshStandardMaterial {...mat} />
              </mesh>
            </group>
          </group>
        ))}
      </group>
    </group>
  );
}

const AXO_MAT = {
  color: 0xffb6c1,
  roughness: 0.4,
  flatShading: true,
} as const;
/** Krop, hoved, kæbe — glat skygge (ikke lavpoly-facetter). */
const AXO_SKIN_SMOOTH = {
  color: 0xffb6c1,
  roughness: 0.4,
  flatShading: false,
} as const;
const AXO_DARK = {
  color: 0xff7fa8,
  emissive: 0xff7fa8,
  emissiveIntensity: 0.4,
  roughness: 0.5,
  flatShading: true,
} as const;
const AXO_GILL = {
  color: 0xff1493,
  emissive: 0xff1493,
  emissiveIntensity: 0.5,
  flatShading: true,
} as const;

/**
 * Port af legacy `createCatchModel` → `itemType === 'axolotl'` (inkl. `group.scale.setScalar(1.3)`).
 * `animated`: false til statisk møbel i hytten.
 */
export function AxolotlCatchModel({
  bucketIdle,
  animated = true,
}: {
  bucketIdle?: boolean;
  animated?: boolean;
}) {
  const g = useRef<Group>(null);
  useFrame((_, dt) => {
    if (!animated || !g.current) return;
    const step = bucketIdle ? 0.005 : 0.009;
    g.current.rotation.y += step * Math.min(2.5, dt * 60);
  });

  const gillRows: { zOff: number; gi: number }[] = [
    { zOff: -0.18, gi: 0 },
    { zOff: 0, gi: 1 },
    { zOff: 0.18, gi: 2 },
  ];

  const legs: [number, number, number][] = [
    [-0.11, -0.3, 0.27],
    [0.17, -0.3, 0.27],
    [-0.11, -0.3, -0.27],
    [0.17, -0.3, -0.27],
  ];

  return (
    <group ref={g} scale={1.3}>
      <mesh castShadow scale={[1.8, 1, 1]}>
        <sphereGeometry args={[0.4, 24, 18]} />
        <meshStandardMaterial {...AXO_SKIN_SMOOTH} />
      </mesh>
      <mesh castShadow position={[0.72, 0, 0]} scale={[1, 0.85, 1]}>
        <sphereGeometry args={[0.38, 24, 18]} />
        <meshStandardMaterial {...AXO_SKIN_SMOOTH} />
      </mesh>
      <mesh castShadow position={[0.85, -0.1, 0]} scale={[0.9, 0.5, 1.1]}>
        <sphereGeometry args={[0.3, 20, 14]} />
        <meshStandardMaterial {...AXO_SKIN_SMOOTH} />
      </mesh>
      <mesh castShadow position={[-0.9, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.25, 0.9, 6]} />
        <meshStandardMaterial {...AXO_DARK} />
      </mesh>
      <mesh castShadow position={[0, 0.42, 0]}>
        <coneGeometry args={[0.12, 0.55, 4]} />
        <meshStandardMaterial {...AXO_DARK} />
      </mesh>
      <mesh position={[0.88, 0.14, 0.22]}>
        <sphereGeometry args={[0.09, 8, 6]} />
        <meshBasicMaterial color={0x1a0010} />
      </mesh>
      <mesh position={[0.88, 0.14, -0.22]}>
        <sphereGeometry args={[0.09, 8, 6]} />
        <meshBasicMaterial color={0x1a0010} />
      </mesh>
      <mesh position={[0.95, 0.18, 0.23]}>
        <sphereGeometry args={[0.035, 5, 4]} />
        <meshBasicMaterial color={0xffffff} />
      </mesh>
      <mesh position={[0.95, 0.18, -0.23]}>
        <sphereGeometry args={[0.035, 5, 4]} />
        <meshBasicMaterial color={0xffffff} />
      </mesh>
      {gillRows.map(({ zOff, gi }) => {
        const gRad = 0.042;
        const gLen = (0.28 - gi * 0.02) * 1.42;
        const x0 = 0.62 - gi * 0.04 + 0.03;
        const y0 = 0.27;
        const zMag = (0.32 + Math.abs(zOff)) * 0.91;
        const hx = 0.7;
        const hy = 0.21;
        const pull = 0.036;
        function towardHead(p: [number, number, number]): [number, number, number] {
          const [px, py, pz] = p;
          const vx = hx - px;
          const vy = hy - py;
          const vz = -pz;
          const len = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1;
          return [
            px + (vx / len) * pull,
            py + (vy / len) * pull,
            pz + (vz / len) * pull,
          ];
        }
        const baseL = towardHead([x0, y0, zMag]);
        const baseR = towardHead([x0, y0, -zMag]);
        const knotIn = 0.018;
        const szL = Math.sign(baseL[2]) || 1;
        const szR = Math.sign(baseR[2]) || -1;
        const knotL: [number, number, number] = [
          baseL[0] - knotIn,
          baseL[1] - knotIn * 0.9,
          baseL[2] - szL * knotIn,
        ];
        const knotR: [number, number, number] = [
          baseR[0] - knotIn,
          baseR[1] - knotIn * 0.9,
          baseR[2] - szR * knotIn,
        ];
        return (
          <group key={zOff}>
            <mesh castShadow position={baseL} rotation={[0.5, 0, 0.4]}>
              <coneGeometry args={[gRad, gLen, 4]} />
              <meshStandardMaterial {...AXO_GILL} />
            </mesh>
            <mesh castShadow position={baseR} rotation={[-0.5, 0, 0.4]}>
              <coneGeometry args={[gRad, gLen, 4]} />
              <meshStandardMaterial {...AXO_GILL} />
            </mesh>
            <mesh castShadow position={knotL}>
              <sphereGeometry args={[0.045, 5, 4]} />
              <meshStandardMaterial {...AXO_GILL} />
            </mesh>
            <mesh castShadow position={knotR}>
              <sphereGeometry args={[0.045, 5, 4]} />
              <meshStandardMaterial {...AXO_GILL} />
            </mesh>
          </group>
        );
      })}
      {legs.map(([lx, ly, lz], i) => (
        <mesh
          key={i}
          castShadow
          position={[lx, ly, lz]}
          rotation={[0, 0, 0.3 * Math.sign(lz)]}
        >
          <cylinderGeometry args={[0.06, 0.05, 0.28, 5]} />
          <meshStandardMaterial {...AXO_MAT} />
        </mesh>
      ))}
    </group>
  );
}

function randomTeethSeeds() {
  return Array.from({ length: 7 }, () => ({
    h: 0.25 + Math.random() * 0.22,
    rx: 0.1 + Math.random() * 0.25,
    rz: (Math.random() - 0.5) * 0.4,
    px: (Math.random() - 0.5) * 0.3,
  }));
}

export function GnavneGormCatchModel({ bucketIdle }: { bucketIdle?: boolean }) {
  const g = useRef<Group>(null);
  const seeds = useMemo(() => randomTeethSeeds(), []);

  useFrame(() => {
    if (g.current) g.current.rotation.y += bucketIdle ? 0.004 : 0.007;
  });

  return (
    <group ref={g} scale={1.45}>
      <pointLight color={0x39ff14} intensity={1.6} distance={4} position={[0.85, 1.75, 0]} />
      <mesh castShadow scale={[1.1, 0.95, 1.2]}>
        <dodecahedronGeometry args={[1.05, 1]} />
        <meshStandardMaterial color="#1a2f3a" roughness={0.88} flatShading />
      </mesh>
      <mesh castShadow position={[0.55, 0, 0]}>
        <boxGeometry args={[1.5, 0.38, 1.5]} />
        <meshStandardMaterial color="#1a2f3a" roughness={0.88} flatShading />
      </mesh>
      <mesh castShadow position={[0.62, -0.5, 0]}>
        <boxGeometry args={[1.6, 0.45, 1.6]} />
        <meshStandardMaterial color="#1a2f3a" roughness={0.88} flatShading />
      </mesh>
      {seeds.map((s, ti) => (
        <mesh
          key={ti}
          castShadow
          position={[0.55 + s.px, -0.25, -0.55 + ti * 0.18]}
          rotation={[s.rx, 0, s.rz]}
        >
          <coneGeometry args={[0.07, s.h, 4]} />
          <meshStandardMaterial color="#ddd" roughness={0.5} flatShading />
        </mesh>
      ))}
      <mesh position={[0.55, 0.38, 0.55]}>
        <sphereGeometry args={[0.08, 6, 5]} />
        <meshBasicMaterial color="#ff2200" />
      </mesh>
      <mesh position={[0.55, 0.38, -0.55]}>
        <sphereGeometry args={[0.08, 6, 5]} />
        <meshBasicMaterial color="#ff2200" />
      </mesh>
      <mesh castShadow position={[0.3, 1.15, 0]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.045, 0.045, 1.3, 5]} />
        <meshStandardMaterial color="#0d1e28" roughness={0.9} flatShading />
      </mesh>
      <mesh castShadow position={[0.85, 1.75, 0]}>
        <sphereGeometry args={[0.22, 10, 8]} />
        <meshStandardMaterial color="#39ff14" emissive="#39ff14" emissiveIntensity={1.2} />
      </mesh>
      <mesh castShadow position={[-0.2, 0.3, 0.9]} rotation={[0.3, 0, Math.PI / 2]}>
        <coneGeometry args={[0.35, 0.5, 4]} />
        <meshStandardMaterial color="#102030" roughness={0.9} transparent opacity={0.7} side={DoubleSide} />
      </mesh>
      <mesh castShadow position={[-0.2, 0.3, -0.9]} rotation={[0.3, 0, Math.PI / 2]}>
        <coneGeometry args={[0.35, 0.5, 4]} />
        <meshStandardMaterial color="#102030" roughness={0.9} transparent opacity={0.7} side={DoubleSide} />
      </mesh>
      <mesh castShadow position={[0, 1.1, 0]}>
        <coneGeometry args={[0.28, 0.65, 4]} />
        <meshStandardMaterial color="#102030" roughness={0.9} transparent opacity={0.7} side={DoubleSide} />
      </mesh>
    </group>
  );
}
