import type { RefObject } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import {
  CatmullRomCurve3,
  DoubleSide,
  Group,
  MathUtils,
  MeshPhongMaterial,
  Object3D,
  TubeGeometry,
  Vector3,
} from 'three';
import { useFrame } from '@react-three/fiber';
import type { RodTier } from '../../types/shop.js';
import { getRodTier } from '../../data/equipment.js';
import { useGameStore } from '../../store/useGameStore.js';
import { usePlayerStore } from '../../store/usePlayerStore.js';

const CAST_MS = 650;

const SEG = 24;
const SHAFT_LENGTH = 4.5;
const SHAFT_START = -0.55;
const RING_POSITIONS = [-1.2, -2.5, -3.8, -4.9] as const;

function shaftRadiusAt(x: number): number {
  if (x > SHAFT_START) return 0.11;
  const progress = Math.min(1, (SHAFT_START - x) / SHAFT_LENGTH);
  return 0.08 - progress * 0.06;
}

const lineMat = new MeshPhongMaterial({
  color: 0xeeeeee,
  transparent: true,
  opacity: 0.72,
  specular: 0x666666,
  shininess: 90,
  depthWrite: false,
  side: DoubleSide,
});

function buildStaticLineGeometry() {
  const tubeRadius = 0.005;
  const margin = 0.048;
  const staticLinePoints: Vector3[] = [
    new Vector3(0.2, -(0.12 + tubeRadius + margin), 0),
    new Vector3(-0.2, -(shaftRadiusAt(-0.2) + tubeRadius + margin), 0),
  ];
  for (const xPos of RING_POSITIONS) {
    const sr = shaftRadiusAt(xPos);
    staticLinePoints.push(new Vector3(xPos, -(sr + tubeRadius + margin), 0));
  }
  const tipSR = shaftRadiusAt(-5.05);
  staticLinePoints.push(new Vector3(-5.05, -(tipSR + tubeRadius + margin), 0));
  const tubeCurve = new CatmullRomCurve3(staticLinePoints, false, 'catmullrom', 0.3);
  return new TubeGeometry(tubeCurve, 48, tubeRadius, 8, false);
}

/**
 * Detaljeret fiskestang + statisk snøre på klingen (legacy `buildFishingRod`).
 * Pivot som legacy `rodGroup`: position (2.5,1.5,8.5), base rotation.z -0.18.
 */
export function SceneFishingRod({ tipRef }: { tipRef: RefObject<Object3D | null> }) {
  const upgrades = usePlayerStore((s) => s.upgrades);
  const tier = useMemo(() => getRodTier(upgrades), [upgrades]);

  const staticLineGeo = useMemo(() => buildStaticLineGeometry(), []);
  useEffect(() => () => staticLineGeo.dispose(), [staticLineGeo]);

  const rodPivotRef = useRef<Group>(null);
  const castStartRef = useRef(0);
  const wasCastingRef = useRef(false);

  useFrame(({ clock }) => {
    const g = rodPivotRef.current;
    if (!g) return;
    const gameState = useGameStore.getState().gameState;
    const time = clock.elapsedTime;
    if (gameState === 'casting') {
      if (!wasCastingRef.current) {
        castStartRef.current = performance.now();
        wasCastingRef.current = true;
      }
      const t = Math.min(1, (performance.now() - castStartRef.current) / CAST_MS);
      g.rotation.z = -0.18 + Math.sin(t * Math.PI) * 1.1;
    } else {
      wasCastingRef.current = false;
      if (gameState === 'fighting') {
        g.rotation.z = -0.5 + Math.sin(time * 4) * 0.08;
      } else {
        const target = -0.18 + Math.sin(time * 0.5) * 0.03;
        g.rotation.z = MathUtils.lerp(g.rotation.z, target, 0.05);
      }
    }
  });

  const m = (t: RodTier) => ({
    rod: { color: t.rodColor, roughness: 0.8, metalness: t.metalness },
    grip: { color: t.gripColor, roughness: 0.9, metalness: 0.05 },
    seat: { color: t.seatColor, roughness: 0.3, metalness: 0.8 },
    reel: { color: t.reelBase, roughness: 0.6, metalness: 0.4 },
    spool: { color: t.spoolColor, roughness: 0.5, metalness: 0.2 },
  });
  const mat = m(tier);

  return (
    <group ref={rodPivotRef} position={[2.5, 1.5, 8.5]} rotation={[0, 0, -0.18]}>
      <group rotation={[0, 0, -Math.PI / 2]}>
        <mesh castShadow rotation={[0, 0, Math.PI / 2]} position={[1.0, 0, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 0.9, 12]} />
          <meshStandardMaterial {...mat.grip} flatShading />
        </mesh>
        <mesh position={[1.45, 0, 0]}>
          <sphereGeometry args={[0.14, 12, 8]} />
          <meshStandardMaterial {...mat.seat} />
        </mesh>
        <mesh castShadow rotation={[0, 0, Math.PI / 2]} position={[0.2, 0, 0]}>
          <cylinderGeometry args={[0.11, 0.11, 0.7, SEG]} />
          <meshStandardMaterial {...mat.seat} />
        </mesh>
        <mesh castShadow rotation={[0, 0, Math.PI / 2]} position={[-0.35, 0, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 0.4, 12]} />
          <meshStandardMaterial {...mat.grip} flatShading />
        </mesh>
        <mesh
          castShadow
          rotation={[0, 0, Math.PI / 2]}
          position={[-0.55 - SHAFT_LENGTH / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.02, 0.08, SHAFT_LENGTH, SEG]} />
          <meshStandardMaterial {...mat.rod} />
        </mesh>

        <group position={[0.2, -0.12, 0]}>
          <mesh position={[0, -0.1, 0]}>
            <boxGeometry args={[0.1, 0.2, 0.06]} />
            <meshStandardMaterial {...mat.reel} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} position={[0.05, -0.22, 0]}>
            <cylinderGeometry args={[0.14, 0.14, 0.25, SEG]} />
            <meshStandardMaterial {...mat.reel} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.1, -0.22, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.05, SEG]} />
            <meshStandardMaterial {...mat.seat} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.2, -0.22, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.15, SEG]} />
            <meshStandardMaterial {...mat.spool} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.31, -0.22, 0]}>
            <cylinderGeometry args={[0.15, 0.1, 0.08, SEG]} />
            <meshStandardMaterial {...mat.seat} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0.05, -0.22, 0.2]}>
            <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
            <meshStandardMaterial {...mat.seat} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0.05, -0.22, 0.3]}>
            <cylinderGeometry args={[0.06, 0.06, 0.12, 12]} />
            <meshStandardMaterial {...mat.reel} />
          </mesh>
        </group>

        {RING_POSITIONS.map((xPos, i) => {
          const progress = Math.abs((xPos - -0.55) / SHAFT_LENGTH);
          const currentRadius = 0.08 - progress * 0.06;
          const eyeRadius = 0.03 - i * 0.005;
          const eyeY = -currentRadius - 0.05;
          return (
            <group key={xPos}>
              <mesh rotation={[0, Math.PI / 2, 0]} position={[xPos, 0, 0]}>
                <torusGeometry args={[currentRadius + 0.01, 0.015, 8, SEG]} />
                <meshStandardMaterial {...mat.seat} />
              </mesh>
              <mesh rotation={[0, Math.PI / 2, 0]} position={[xPos, eyeY, 0]}>
                <torusGeometry args={[eyeRadius, 0.008, 8, 16]} />
                <meshStandardMaterial {...mat.seat} />
              </mesh>
              <mesh position={[xPos, -currentRadius - 0.025, 0]}>
                <cylinderGeometry args={[0.008, 0.008, 0.05, 8]} />
                <meshStandardMaterial {...mat.seat} />
              </mesh>
            </group>
          );
        })}

        <mesh geometry={staticLineGeo} material={lineMat} frustumCulled={false} />

        <object3D ref={tipRef} position={[-5.05, 0, 0]} />
      </group>
    </group>
  );
}
