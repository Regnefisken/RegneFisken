import { useRef } from 'react';
import { DoubleSide, Group, Mesh, MeshBasicMaterial } from 'three';
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

export function GnavneGormCatchModel({ bucketIdle }: { bucketIdle?: boolean }) {
  const g = useRef<Group>(null);
  const ringRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (g.current) g.current.rotation.y += bucketIdle ? 0.004 : 0.007;
    const ring = ringRef.current;
    if (ring) {
      ring.rotation.x = t * 0.5;
      ring.rotation.y = t * 0.3;
      (ring.material as MeshBasicMaterial).opacity = 0.1 + Math.sin(t * 3) * 0.08;
    }
  });

  // side: 1 = højre (+Z), -1 = venstre (-Z) — perfekt spejlet øje
  function Eye({ side }: { side: 1 | -1 }) {
    return (
      <group position={[1.0, 0.5, side * 0.5]}>
        {/* Øjenhule */}
        <mesh>
          <sphereGeometry args={[0.15, 8, 6]} />
          <meshStandardMaterial color="#112228" roughness={0.9} flatShading />
        </mesh>
        {/* Øjenæble */}
        <mesh position={[0.06, 0, side * 0.04]}>
          <sphereGeometry args={[0.12, 8, 6]} />
          <meshBasicMaterial color="#ff2200" />
        </mesh>
        {/* Glint */}
        <mesh position={[0.08, 0.04, side * 0.07]}>
          <sphereGeometry args={[0.045, 6, 4]} />
          <meshBasicMaterial color="#ff8844" />
        </mesh>
      </group>
    );
  }

  // Finne-komponent med ribber
  function Fin({
    position,
    rotation,
    flip,
  }: {
    position: [number, number, number];
    rotation: [number, number, number];
    flip: 1 | -1;
  }) {
    return (
      <group
        position={[position[0], position[1], position[2] * flip]}
        rotation={[rotation[0] * flip, rotation[1], rotation[2]]}
      >
        {/* Hoved-finne */}
        <mesh castShadow>
          <coneGeometry args={[0.45, 0.7, 5]} />
          <meshStandardMaterial color="#1a3848" roughness={0.75} flatShading transparent opacity={0.75} side={DoubleSide} />
        </mesh>
        {/* Fin-kant */}
        <mesh castShadow position={[0, -0.2, 0]}>
          <coneGeometry args={[0.48, 0.35, 5]} />
          <meshStandardMaterial color="#0d2030" roughness={0.85} flatShading transparent opacity={0.6} side={DoubleSide} />
        </mesh>
        {/* Ribber */}
        {[0, 1, 2].map(i => (
          <mesh key={i} position={[0, 0, (i - 1) * 0.12]} rotation={[0, 0, (i - 1) * 0.15]}>
            <cylinderGeometry args={[0.012, 0.008, 0.55, 3]} />
            <meshStandardMaterial color="#1a3040" roughness={0.8} flatShading />
          </mesh>
        ))}
      </group>
    );
  }

  // Tand-data (faste positioner — ingen randomisering)
  const upperTeeth: { x: number; z: number; h: number; lean: number }[] = [
    { x: 1.2, z: -0.45, h: 0.32, lean: 0.15 },
    { x: 1.4, z: -0.28, h: 0.38, lean: 0.1 },
    { x: 1.5, z: -0.08, h: 0.42, lean: 0.05 },
    { x: 1.5, z: 0.08, h: 0.4, lean: -0.05 },
    { x: 1.4, z: 0.28, h: 0.35, lean: -0.1 },
    { x: 1.2, z: 0.45, h: 0.3, lean: -0.15 },
  ];

  const lowerTeeth: { x: number; z: number; h: number; lean: number }[] = [
    { x: 1.25, z: -0.4, h: 0.28, lean: -0.12 },
    { x: 1.45, z: -0.22, h: 0.34, lean: -0.08 },
    { x: 1.55, z: 0, h: 0.36, lean: 0 },
    { x: 1.45, z: 0.22, h: 0.32, lean: 0.08 },
    { x: 1.25, z: 0.4, h: 0.26, lean: 0.12 },
  ];

  const warts = [
    { x: -0.4, y: 0.7, z: 0.3, r: 0.08 },
    { x: 0.2, y: 0.8, z: -0.5, r: 0.06 },
    { x: -0.6, y: 0.2, z: -0.6, r: 0.07 },
    { x: -0.3, y: -0.3, z: 0.7, r: 0.05 },
    { x: 0.4, y: 0.6, z: 0.6, r: 0.065 },
  ];

  return (
    <group ref={g} position={[0, -0.24, 0]} scale={1.3}>
      {/* ── LYGTEFISK-LYS ── */}
      <pointLight color={0x39ff14} intensity={2.0} distance={5} position={[0.88, 1.8, 0]} />

      {/* ══ 1. KROP ══ */}

      {/* Hoveddel — dodecahedron */}
      <mesh castShadow scale={[1.15, 1.0, 1.2]}>
        <dodecahedronGeometry args={[1.05, 1]} />
        <meshStandardMaterial color="#1a2f3a" roughness={0.88} flatShading />
      </mesh>

      {/* Bug — lysere underside */}
      <mesh castShadow position={[0.1, -0.55, 0]} scale={[1.4, 0.5, 1.3]}>
        <sphereGeometry args={[0.7, 10, 8, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5]} />
        <meshStandardMaterial color="#1e3845" roughness={0.82} flatShading />
      </mesh>

      {/* ══ 2. KÆBE — åben mund ══ */}

      {/* Overkæbe */}
      <mesh castShadow position={[0.85, 0.2, 0]} scale={[1.4, 0.45, 1.35]}>
        <sphereGeometry args={[0.65, 10, 8]} />
        <meshStandardMaterial color="#1a2f3a" roughness={0.88} flatShading />
      </mesh>

      {/* Snude-spids */}
      <mesh castShadow position={[1.35, 0.18, 0]} scale={[0.8, 0.4, 1.2]}>
        <sphereGeometry args={[0.4, 8, 6]} />
        <meshStandardMaterial color="#1a2f3a" roughness={0.88} flatShading />
      </mesh>

      {/* Underkæbe */}
      <mesh castShadow position={[0.75, -0.45, 0]} scale={[1.5, 0.4, 1.4]}>
        <sphereGeometry args={[0.6, 10, 8]} />
        <meshStandardMaterial color="#112228" roughness={0.9} flatShading />
      </mesh>

      {/* Hage */}
      <mesh castShadow position={[1.25, -0.5, 0]} scale={[0.9, 0.45, 1.1]}>
        <sphereGeometry args={[0.35, 8, 6]} />
        <meshStandardMaterial color="#112228" roughness={0.9} flatShading />
      </mesh>

      {/* Mund-hulrum (mørkt indre) */}
      <mesh position={[0.8, -0.1, 0]} scale={[1.3, 0.5, 1.1]}>
        <sphereGeometry args={[0.45, 8, 6]} />
        <meshStandardMaterial color="#1a0510" roughness={0.95} flatShading />
      </mesh>

      {/* ══ 3. TÆNDER ══ */}

      {/* Øvre tænder — hænger ned */}
      {upperTeeth.map((t, i) => (
        <mesh key={`ut${i}`} castShadow position={[t.x, -0.05, t.z]} rotation={[t.lean, 0, Math.PI]}>
          <coneGeometry args={[0.06, t.h, 4]} />
          <meshStandardMaterial color="#ddddcc" roughness={0.5} flatShading />
        </mesh>
      ))}

      {/* Nedre tænder — stikker op */}
      {lowerTeeth.map((t, i) => (
        <mesh key={`lt${i}`} castShadow position={[t.x, -0.25, t.z]} rotation={[t.lean, 0, 0]}>
          <coneGeometry args={[0.055, t.h, 4]} />
          <meshStandardMaterial color="#ddddcc" roughness={0.5} flatShading />
        </mesh>
      ))}

      {/* Hjørnetand venstre */}
      <mesh castShadow position={[1.1, 0.1, -0.5]} rotation={[-0.2, 0, 0.1]}>
        <coneGeometry args={[0.07, 0.45, 4]} />
        <meshStandardMaterial color="#ddddcc" roughness={0.5} flatShading />
      </mesh>

      {/* Hjørnetand højre */}
      <mesh castShadow position={[1.1, 0.1, 0.5]} rotation={[0.2, 0, 0.1]}>
        <coneGeometry args={[0.07, 0.45, 4]} />
        <meshStandardMaterial color="#ddddcc" roughness={0.5} flatShading />
      </mesh>

      {/* ══ 4. ØJNE ══ */}

      <Eye side={-1} />
      <Eye side={1} />

      {/* Øjenbryn-bule venstre */}
      <mesh castShadow position={[0.9, 0.64, -0.45]} scale={[1.5, 0.5, 1.2]}>
        <sphereGeometry args={[0.12, 6, 4]} />
        <meshStandardMaterial color="#1a2f3a" roughness={0.88} flatShading />
      </mesh>

      {/* Øjenbryn-bule højre */}
      <mesh castShadow position={[0.9, 0.64, 0.45]} scale={[1.5, 0.5, 1.2]}>
        <sphereGeometry args={[0.12, 6, 4]} />
        <meshStandardMaterial color="#1a2f3a" roughness={0.88} flatShading />
      </mesh>

      {/* ══ 5. LYGTEFISK-STANG ══ */}

      {/* Stang */}
      <mesh castShadow position={[0.3, 1.2, 0]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.04, 0.04, 1.4, 5]} />
        <meshStandardMaterial color="#0d1e28" roughness={0.9} flatShading />
      </mesh>

      {/* Lygte-kugle */}
      <mesh castShadow position={[0.88, 1.8, 0]}>
        <sphereGeometry args={[0.24, 12, 10]} />
        <meshStandardMaterial color="#39ff14" emissive="#39ff14" emissiveIntensity={1.4} roughness={0.2} />
      </mesh>

      {/* Glow-ring */}
      <mesh ref={ringRef} position={[0.88, 1.8, 0]}>
        <ringGeometry args={[0.26, 0.34, 12]} />
        <meshBasicMaterial color="#39ff14" transparent opacity={0.15} side={DoubleSide} />
      </mesh>

      {/* ══ 6. FINNER ══ */}

      {/* Side-finner */}
      <Fin position={[-0.15, 0.15, 1.05]} rotation={[0.4, 0, Math.PI / 2]} flip={1} />
      <Fin position={[-0.15, 0.15, 1.05]} rotation={[0.4, 0, Math.PI / 2]} flip={-1} />

      {/* Ryg-finne (dorsal) */}
      <group position={[-0.1, 1.15, 0]} rotation={[0, 0, 0.2]}>
        <mesh castShadow>
          <coneGeometry args={[0.35, 0.8, 5]} />
          <meshStandardMaterial color="#1a3848" roughness={0.75} flatShading transparent opacity={0.75} side={DoubleSide} />
        </mesh>
        {[0, 1, 2, 3].map(i => (
          <mesh key={i} position={[(i - 1.5) * 0.08, 0, 0]} rotation={[0, 0, (i - 1.5) * 0.1]}>
            <cylinderGeometry args={[0.01, 0.006, 0.65, 3]} />
            <meshStandardMaterial color="#1a3040" roughness={0.8} flatShading />
          </mesh>
        ))}
      </group>

      {/* Halefinne */}
      <group position={[-1.2, 0.1, 0]}>
        <mesh castShadow position={[0, 0.2, 0]} rotation={[0, 0, 0.6]}>
          <coneGeometry args={[0.25, 0.55, 4]} />
          <meshStandardMaterial color="#1a3848" roughness={0.75} flatShading transparent opacity={0.75} side={DoubleSide} />
        </mesh>
        <mesh castShadow position={[0, -0.15, 0]} rotation={[0, 0, -0.4]}>
          <coneGeometry args={[0.2, 0.45, 4]} />
          <meshStandardMaterial color="#1a3848" roughness={0.75} flatShading transparent opacity={0.75} side={DoubleSide} />
        </mesh>
      </group>

      {/* ══ 7. VORTER / BUMSER ══ */}

      {warts.map((w, i) => (
        <mesh key={`w${i}`} castShadow position={[w.x, w.y, w.z]}>
          <sphereGeometry args={[w.r, 5, 4]} />
          <meshStandardMaterial color="#223a48" roughness={0.95} flatShading />
        </mesh>
      ))}
    </group>
  );
}
