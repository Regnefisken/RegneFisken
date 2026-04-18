import { useMemo, useRef, type ReactNode } from 'react';
import { Group, QuadraticBezierCurve3, TubeGeometry, Vector3, type Mesh } from 'three';
import type { ThreeElements } from '@react-three/fiber';
import { useFrame } from '@react-three/fiber';

const eyeMatW = { color: 0xffffff, roughness: 0.5, flatShading: false as const };
const eyeMatP = { color: 0x111111, roughness: 0.3, flatShading: false as const };

const KRAKEN_BODY_SPHERE_RADIUS = 1.2;
const KRAKEN_BODY_MESH_SCALE_BASE: [number, number, number] = [1, 1.4, 1];
/** +10% kun på hovedkrop-mesh; tentakel-geometri (kurver, tykkelse) skaleres ikke. */
const KRAKEN_BODY_BLOB_SCALE = 1.1;
const KRAKEN_BODY_CY = 1.5;

/** `i === 0` → +X — samme retning som øjnene; den tentakel skjuler ansigtet. */
const KRAKEN_TENTACLE_SKIP_INDEX = 0;

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
                <sphereGeometry args={[0.08, 12, 12]} />
                <meshStandardMaterial {...eyeMatW} />
              </mesh>
              <mesh position={[0.04, 0, base[2] > 0 ? 0.04 : -0.04]}>
                <sphereGeometry args={[0.04, 12, 12]} />
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
        {children}
      </group>
    </group>
  );
}
