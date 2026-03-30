import { useMemo, useRef } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { type Group, Quaternion, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { useAudio } from '../../audio/useAudio.js';
import { usePlayerStore } from '../../store/usePlayerStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import { GiantLandTurtle } from '../models/GiantLandTurtle.js';
import { TurtleEgg } from '../models/TurtleEgg.js';

/** Spand på molen — samme XZ som `Bucket`. */
const MOLE_BUCKET_XZ = { x: 1.1, z: 8.8 } as const;
/** Vild skildpadde ved reden (sand øst for molen). Yaw mod spand = atan2 fra dette punkt — ikke samme udgangspunkt som NPC’er vest for kajen. */
const WILD_TURTLE_NEST_XZ = { x: 4.2, z: 4.8 } as const;
/** Modellens +X er hoved-enden (øjne, næse); −X er spids hale — peg +X mod spand, hale væk fra spand. */
const WILD_TURTLE_QUAT_TO_BUCKET = (() => {
  const dir = new Vector3(
    MOLE_BUCKET_XZ.x - WILD_TURTLE_NEST_XZ.x,
    0,
    MOLE_BUCKET_XZ.z - WILD_TURTLE_NEST_XZ.z,
  ).normalize();
  return new Quaternion().setFromUnitVectors(new Vector3(1, 0, 0), dir);
})();

const trunkMat = { color: 0x6b4a31, roughness: 0.9, flatShading: false as const };
const leafMat = { color: 0x2e8b57, roughness: 0.8, flatShading: false as const };
const nutMat = { color: 0x3e2723, roughness: 1, flatShading: false as const };

function PalmLeaf({ mat, sx, sy, sz }: { mat: typeof leafMat; sx: number; sy: number; sz: number }) {
  return (
    <mesh scale={[sx, sy, sz]}>
      <sphereGeometry args={[1, 10, 6]} />
      <meshStandardMaterial {...mat} />
    </mesh>
  );
}

function Palm1() {
  let yPos = 0;
  let radius = 0.42;
  const segs: { y: number; r: number; i: number }[] = [];
  for (let i = 0; i < 12; i++) {
    segs.push({ y: yPos, r: radius, i });
    yPos += 0.29;
    radius *= 0.96;
  }
  const last = segs[11]!;
  return (
    <group>
      {segs.map((s) => (
        <mesh
          key={s.i}
          position={[Math.sin(s.i * 0.12) * 0.28, s.y, Math.cos(s.i * 0.12) * 0.14]}
          rotation={[0, 0, Math.sin(s.i * 0.12) * 0.08]}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[s.r * 0.9, s.r, 0.33, 8]} />
          <meshStandardMaterial {...trunkMat} />
        </mesh>
      ))}
      <group position={[Math.sin(11 * 0.12) * 0.28, last.y + 0.29, Math.cos(11 * 0.12) * 0.14]}>
        {Array.from({ length: 7 }, (_, i) => (
          <group key={i} rotation={[0, (i / 7) * Math.PI * 2, 0.38 + (i % 4) * 0.07]}>
            <group position={[1.4, 0, 0]}>
              <PalmLeaf mat={leafMat} sx={2.2} sy={0.14} sz={0.55} />
            </group>
          </group>
        ))}
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[Math.cos(i * 2.1) * 0.28, -0.18, Math.sin(i * 2.1) * 0.28]}>
            <dodecahedronGeometry args={[0.25, 1]} />
            <meshStandardMaterial {...nutMat} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function SharkFin({
  radius,
  speed,
  startAngle,
}: {
  radius: number;
  speed: number;
  startAngle: number;
}) {
  const ref = useRef<Group>(null);
  const angleRef = useRef(startAngle);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    angleRef.current += speed;
    const ang = angleRef.current;
    const islandZ = 11.5;
    const t = clock.elapsedTime;
    /** Vandplanet ligger ~y=0; hold finnen let nedsænket så basen skjules i vandet (ikke “skøjte” over). */
    const finBaseY = 0.12 + Math.sin(t * 2.2 + ang) * 0.045;
    g.position.set(Math.cos(ang) * radius, finBaseY, islandZ + Math.sin(ang) * radius);
    g.rotation.y = speed > 0 ? -ang + Math.PI : -ang;
    g.rotation.z = Math.sin(t * 1.8 + ang * 1.5) * 0.1;
  });
  return (
    <group ref={ref}>
      <mesh rotation={[0.18, 0, 0]} scale={[0.28, 1, 1]} castShadow>
        <coneGeometry args={[0.45, 1.4, 5]} />
        <meshStandardMaterial color={0x556b7d} flatShading />
      </mesh>
    </group>
  );
}

/** Tropisk ø: sand, græs, palmer, hajfinner, æg — fra legacy `buildTropicalIsland`. */
export function TropicalIsland() {
  const { play } = useAudio();
  const questItems = usePlayerStore((s) => s.questItems);
  const eggLeftTimestamp = usePlayerStore((s) => s.eggLeftTimestamp);
  const wildTurtleSpawned = usePlayerStore((s) => s.wildTurtleSpawned);
  const setToastMessage = useUIStore((s) => s.setToastMessage);
  const setShowEggInspectModal = useUIStore((s) => s.setShowEggInspectModal);
  const setShowWildTurtleModal = useUIStore((s) => s.setShowWildTurtleModal);

  const sandMat = useMemo(() => ({ color: 0xf5deb3, roughness: 0.85, metalness: 0.05 }), []);
  const grassMat = useMemo(() => ({ color: 0x3d8c40, roughness: 0.85 }), []);
  const rockMat = useMemo(() => ({ color: 0x555555, roughness: 1, flatShading: false as const }), []);
  const palmPlaces = useMemo(
    () => [
      { x: -5.5, z: 4.5, scale: 1.15, rot: 0.35 },
      { x: -2.8, z: 1.8, scale: 0.95, rot: -0.2 },
      { x: 3.2, z: 2.1, scale: 1.25, rot: 0.6 },
      { x: 7.5, z: 5.8, scale: 1.05, rot: -0.45 },
      { x: -8.0, z: 8.2, scale: 0.85, rot: 1.1 },
    ],
    [],
  );

  const stones = useMemo(
    () =>
      [
        { x: -6.2, z: 2.6, size: 0.27 },
        { x: -4.0, z: 4.7, size: 0.41 },
        { x: -2.9, z: 7.1, size: 0.33 },
        { x: 2.9, z: 2.5, size: 0.29 },
        { x: 5.6, z: 3.9, size: 0.46 },
        { x: 5.5, z: 7.0, size: 0.36 },
      ] as const,
    [],
  );

  const hideEgg =
    questItems.includes('turtle_egg') ||
    questItems.includes('turtle_hatched') ||
    wildTurtleSpawned;

  function onEggPointer(_e: ThreeEvent<PointerEvent>) {
    if (eggLeftTimestamp && !wildTurtleSpawned) {
      setToastMessage('🥚 Du går forsigtigt udenom ægget...');
      return;
    }
    if (
      !questItems.includes('turtle_egg') &&
      !questItems.includes('turtle_hatched') &&
      !eggLeftTimestamp &&
      !wildTurtleSpawned
    ) {
      play('ui');
      setShowEggInspectModal(true);
    }
  }

  function onWildTurtlePointer(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
    play('ui');
    setShowWildTurtleModal(true);
  }

  return (
    <group>
      <mesh position={[0, -0.8, 11.5]} scale={[1.32, 1, 1]} castShadow receiveShadow>
        <cylinderGeometry args={[12.5, 13.5, 0.8, 48]} />
        <meshStandardMaterial {...sandMat} />
      </mesh>
      <mesh position={[0, -0.3, 11.5]} scale={[1.32, 1, 1]} castShadow receiveShadow>
        <cylinderGeometry args={[11.2, 12.2, 0.9, 48]} />
        <meshStandardMaterial {...sandMat} />
      </mesh>
      <mesh position={[0, 0.1, 11.5]} scale={[1.32, 1, 1]} receiveShadow>
        <cylinderGeometry args={[10.8, 11.5, 0.26, 48]} />
        <meshStandardMaterial {...sandMat} />
      </mesh>
      <mesh position={[0, 0.11, 11.5]} scale={[1.32, 1, 1]} receiveShadow>
        <cylinderGeometry args={[5.8, 6.6, 0.27, 48]} />
        <meshStandardMaterial {...grassMat} />
      </mesh>
      {palmPlaces.map((p, i) => (
        <group key={i} position={[p.x, 0.15, p.z]} rotation={[0, p.rot, 0]} scale={p.scale}>
          <Palm1 />
        </group>
      ))}
      <SharkFin radius={26} speed={0.0036} startAngle={0} />
      <SharkFin radius={33} speed={0.0048} startAngle={Math.PI * 0.8} />
      <SharkFin radius={40} speed={-0.0045} startAngle={Math.PI * 1.7} />
      {!hideEgg ? <TurtleEgg onInteract={onEggPointer} /> : null}
      {wildTurtleSpawned ? (
        <group
          position={[WILD_TURTLE_NEST_XZ.x, 0.52, WILD_TURTLE_NEST_XZ.z]}
          quaternion={WILD_TURTLE_QUAT_TO_BUCKET}
          scale={0.85}
          userData={{ isWildTurtle: true, isFree: true }}
        >
          <GiantLandTurtle wildIsland onPointerDown={onWildTurtlePointer} />
        </group>
      ) : null}
      <mesh position={[-9, -0.15, 13]} rotation={[0.3, 1, 0.2]} castShadow>
        <dodecahedronGeometry args={[1.1, 1]} />
        <meshStandardMaterial {...rockMat} />
      </mesh>
      {stones.map((s, i) => (
        <mesh
          key={i}
          position={[s.x, 0.1 + s.size * 0.22, s.z]}
          rotation={[s.size * 1.7, s.size * 2.3, s.size * 1.1]}
          castShadow
        >
          <sphereGeometry args={[s.size, 8, 6]} />
          <meshStandardMaterial {...rockMat} />
        </mesh>
      ))}
      <mesh position={[-8.4, 0.1 + 1.08 * 0.22, 5.8]} rotation={[0.35, 1.05, 0.2]} castShadow>
        <sphereGeometry args={[1.08, 10, 8]} />
        <meshStandardMaterial {...rockMat} />
      </mesh>
    </group>
  );
}

export default TropicalIsland;
