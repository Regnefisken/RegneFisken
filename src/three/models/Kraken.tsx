import { useMemo, useRef, type ReactNode } from 'react';
import {
  Group,
  QuadraticBezierCurve3,
  Quaternion,
  TubeGeometry,
  Vector3,
  type Mesh,
} from 'three';
import type { ThreeElements } from '@react-three/fiber';
import { useFrame } from '@react-three/fiber';

const eyeMatW = { color: 0xffffff, roughness: 0.5, flatShading: false as const };
const eyeMatP = { color: 0x111111, roughness: 0.3, flatShading: false as const };

/** Tænder: trekantede kegler; spids langs +Y drejes til mund-gruppens +X (væk fra kroppen). */
const toothMat = {
  color: 0xf5f5ff,
  roughness: 0.28,
  metalness: 0.1,
  flatShading: true as const,
};

const KRAKEN_TOOTH_RING_COUNT = 10;
const KRAKEN_TOOTH_SCALE = 1.1;
const KRAKEN_TOOTH_RING_RADIUS = 0.17 * KRAKEN_TOOTH_SCALE;
const KRAKEN_TOOTH_CONE_RADIUS = 0.05 * KRAKEN_TOOTH_SCALE;
const KRAKEN_TOOTH_CONE_HEIGHT = 0.2 * KRAKEN_TOOTH_SCALE;
/** Ring skubbes lidt frem langs +X (væk fra krop, samme akse som kegle-spidser). */
const KRAKEN_TOOTH_RING_OFFSET_X = 0.05;

const KRAKEN_BODY_SPHERE_RADIUS = 1.2;
const KRAKEN_BODY_MESH_SCALE_BASE: [number, number, number] = [1, 1.4, 1];
/** +10% kun på hovedkrop-mesh; tentakel-geometri (kurver, tykkelse) skaleres ikke. */
const KRAKEN_BODY_BLOB_SCALE = 1.1;
const KRAKEN_BODY_CY = 1.5;

/** `i === 0` → +X — samme retning som øjnene; den tentakel skjuler ansigtet. */
const KRAKEN_TENTACLE_SKIP_INDEX = 0;

/** Øjne 150 % ift. tidligere (sclera, pupil og offset skaleres ens). */
const KRAKEN_EYE_SIZE = 1.5;
const KRAKEN_EYE_SCLERA_RADIUS = 0.08 * KRAKEN_EYE_SIZE;
const KRAKEN_EYE_PUPIL_RADIUS = 0.04 * KRAKEN_EYE_SIZE;
const KRAKEN_EYE_PUPIL_OFFSET = 0.04 * KRAKEN_EYE_SIZE;

/** Placering før krop blev forstørret — offset fra `(0, KRAKEN_BODY_CY, 0)` skaleres med blob-skala. */
const KRAKEN_EYE_BASE: [number, number, number][] = [
  [1.0, 1.2, 0.5],
  [1.0, 1.2, -0.5],
];

function krakenEyeWorldPosition(base: readonly [number, number, number]): [number, number, number] {
  const s = KRAKEN_BODY_BLOB_SCALE;
  const ox = base[0];
  const oy = base[1] - KRAKEN_BODY_CY;
  const oz = base[2];
  return [ox * s, KRAKEN_BODY_CY + oy * s, oz * s];
}

/** Kraken — legacy ambient + boss `kraken` (tentakler `useFrame`). */
export function Kraken({
  catchMode = false,
  children,
  ...props
}: {
  catchMode?: boolean;
  children?: ReactNode;
} & ThreeElements['group']) {
  const krakenRef = useRef<Group>(null);
  const tentaclesRef = useRef<(Mesh | null)[]>([]);

  const kMat = useMemo(
    () => ({ color: 0x4a0404, roughness: 0.7, flatShading: true as const }),
    [],
  );

  const mouthTeethLayout = useMemo(() => {
    const yAxis = new Vector3(0, 1, 0);
    /** I mund-gruppens rum: +X er ud mod scenen / væk fra kroppens centrum. */
    const awayFromBody = new Vector3(1, 0, 0);
    const toothQuat = new Quaternion().setFromUnitVectors(yAxis, awayFromBody);
    const R = KRAKEN_TOOTH_RING_RADIUS;
    const n = KRAKEN_TOOTH_RING_COUNT;
    return Array.from({ length: n }, (_, i) => {
      const t = (i / n) * Math.PI * 2;
      const uy = Math.cos(t);
      const uz = Math.sin(t);
      return {
        key: `kraken-tooth-${i}`,
        position: new Vector3(KRAKEN_TOOTH_RING_OFFSET_X, R * uy, R * uz),
        quaternion: toothQuat.clone(),
      };
    });
  }, []);

  /**
   * Hovedkrop: `sphereGeometry` radius × mesh-scale × `KRAKEN_BODY_BLOB_SCALE` (kun krop-mesh).
   * `p0`: flade på ellipsoide → langt ind langs normal + skub mod kropcentrum (stilk i kroppen) → `ROD_DROP_Y`.
   */
  const tentacleGeos = useMemo(() => {
    const rx =
      KRAKEN_BODY_SPHERE_RADIUS * KRAKEN_BODY_MESH_SCALE_BASE[0] * KRAKEN_BODY_BLOB_SCALE;
    const ry =
      KRAKEN_BODY_SPHERE_RADIUS * KRAKEN_BODY_MESH_SCALE_BASE[1] * KRAKEN_BODY_BLOB_SCALE;
    const rz =
      KRAKEN_BODY_SPHERE_RADIUS * KRAKEN_BODY_MESH_SCALE_BASE[2] * KRAKEN_BODY_BLOB_SCALE;
    const bodyCY = KRAKEN_BODY_CY;
    /** Lodret løft af kurven efter rod — kropcentrum `KRAKEN_BODY_CY` uændret. */
    const TENTACLE_LIFT_Y = 0.09;
    /** Ind langs ellipsoide-normal — længere stilk inde i kroppen. */
    const TENTACLE_BODY_MERGE_IN = 0.28;
    /** Ekstra ind mod kropcentrum langs vektor fra rod til centrum (forlænger bunden ind i blobben). */
    const TENTACLE_STEM_INTO_CENTER = 0.15;
    /** Lodret ned efter indtræk (lidt mindre så mere af indtrækket bliver inde i kroppen). */
    const ROD_DROP_Y = 0.38;
    /** Midtpunkt: langt ude så armen ikke krammer kroppen. */
    const p1Radius = 2.82;
    const p1Y = 0.24 + TENTACLE_LIFT_Y;
    /** Spids — højere end før så armene rækker længere opad. */
    const p2Radius = 1.9;
    const p2Y = 3.12 + TENTACLE_LIFT_Y * 0.35;
    const geos: TubeGeometry[] = [];
    for (let i = 0; i < 6; i++) {
      if (i === KRAKEN_TENTACLE_SKIP_INDEX) continue;
      const angle = (i / 6) * Math.PI * 2;
      const dir = new Vector3(Math.cos(angle), -0.78, Math.sin(angle)).normalize();
      const tt =
        1 /
        Math.sqrt(
          (dir.x / rx) ** 2 + (dir.y / ry) ** 2 + (dir.z / rz) ** 2,
        );
      const p0 = new Vector3(dir.x * tt, bodyCY + dir.y * tt, dir.z * tt);
      const gx = p0.x / (rx * rx);
      const gy = (p0.y - bodyCY) / (ry * ry);
      const gz = p0.z / (rz * rz);
      const n = new Vector3(gx, gy, gz);
      if (n.lengthSq() > 1e-8) {
        p0.addScaledVector(n.normalize(), -TENTACLE_BODY_MERGE_IN);
      }
      const center = new Vector3(0, bodyCY, 0);
      const toCenter = center.clone().sub(p0);
      if (toCenter.lengthSq() > 1e-8) {
        p0.addScaledVector(toCenter.normalize(), TENTACLE_STEM_INTO_CENTER);
      }
      p0.y -= ROD_DROP_Y;
      const p1 = new Vector3(Math.cos(angle) * p1Radius, p1Y, Math.sin(angle) * p1Radius);
      const p2 = new Vector3(Math.cos(angle) * p2Radius, p2Y, Math.sin(angle) * p2Radius);
      const curve = new QuadraticBezierCurve3(p0, p1, p2);
      geos.push(new TubeGeometry(curve, 16, 0.26, 6, false));
    }
    return geos;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const k = krakenRef.current;
    if (!k) return;
    k.rotation.y -= 0.005;
    tentaclesRef.current.forEach((mesh, idx) => {
      if (mesh) mesh.rotation.z = Math.sin(t * 1.5 + idx) * 0.15;
    });
    if (catchMode) {
      k.position.y = -1.0 + Math.sin(t * 2) * 0.2;
    } else {
      k.position.y = 0;
    }
  });

  const outerScale = catchMode ? 0.65 : 1.8;

  return (
    <group scale={outerScale} {...props}>
      <group ref={krakenRef}>
        {KRAKEN_EYE_BASE.map((base, i) => {
          const [x, y, z] = krakenEyeWorldPosition(base);
          return (
            <group key={i} position={[x, y, z]}>
              <mesh>
                <sphereGeometry args={[KRAKEN_EYE_SCLERA_RADIUS, 12, 12]} />
                <meshStandardMaterial {...eyeMatW} />
              </mesh>
              <mesh
                position={[
                  KRAKEN_EYE_PUPIL_OFFSET,
                  0,
                  base[2] > 0 ? KRAKEN_EYE_PUPIL_OFFSET : -KRAKEN_EYE_PUPIL_OFFSET,
                ]}
              >
                <sphereGeometry args={[KRAKEN_EYE_PUPIL_RADIUS, 12, 12]} />
                <meshStandardMaterial {...eyeMatP} />
              </mesh>
            </group>
          );
        })}
        {tentacleGeos.map((g, i) => (
          <mesh
            key={`kraken-tentacle-${i}`}
            ref={(el) => {
              tentaclesRef.current[i] = el;
            }}
            geometry={g}
            castShadow
          >
            <meshStandardMaterial {...kMat} />
          </mesh>
        ))}
        <mesh
          position={[0, KRAKEN_BODY_CY, 0]}
          scale={[
            KRAKEN_BODY_MESH_SCALE_BASE[0] * KRAKEN_BODY_BLOB_SCALE,
            KRAKEN_BODY_MESH_SCALE_BASE[1] * KRAKEN_BODY_BLOB_SCALE,
            KRAKEN_BODY_MESH_SCALE_BASE[2] * KRAKEN_BODY_BLOB_SCALE,
          ]}
          castShadow
        >
          <sphereGeometry args={[KRAKEN_BODY_SPHERE_RADIUS, 16, 16]} />
          <meshStandardMaterial {...kMat} />
        </mesh>
        {/* Skarpe tænder i en ring; spidser peger væk fra kraken (lokalt +X). */}
        <group position={[1.22, KRAKEN_BODY_CY - 0.68, 0]} rotation={[0.13, 0.22, -0.1]} castShadow>
          {mouthTeethLayout.map((d) => (
            <mesh key={d.key} position={d.position} quaternion={d.quaternion} castShadow>
              <coneGeometry args={[KRAKEN_TOOTH_CONE_RADIUS, KRAKEN_TOOTH_CONE_HEIGHT, 3]} />
              <meshStandardMaterial {...toothMat} />
            </mesh>
          ))}
        </group>
        {children}
      </group>
    </group>
  );
}
