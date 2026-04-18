import { useMemo, useRef } from 'react';
import { CatmullRomCurve3, Group, Raycaster, Vector3 } from 'three';
import { useFrame, useThree } from '@react-three/fiber';

import { raycastGroundSurfaceY } from '../logic/groundSnapRaycast.js';
import { desertLakeLizardPathPoints } from './desertLakeLizardPath.js';

/** Lineær hastighed langs kurven (0–1 per sek.); lavere = længere lap på den lange rute. */
const PATH_U_PER_SEC = 0.012;
const RUN_OMEGA = 13.5;
const FOOT_SURFACE_OFFSET = 0.038;
const SAND_FALLBACK_Y = -0.02 + FOOT_SURFACE_OFFSET;

const BODY = 0x2e7d32;
const BELLY = 0x66bb6a;
const DARK = 0x1b5e20;

const _p = new Vector3();
const _t = new Vector3();

/**
 * Grønt ørkenfirben der følger `desertLakeLizardPath` — lavpoly, løbeanimation.
 */
export function DesertLakeLizard() {
  const { scene } = useThree();
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const tail = useRef<Group>(null);
  const legFL = useRef<Group>(null);
  const legFR = useRef<Group>(null);
  const legBL = useRef<Group>(null);
  const legBR = useRef<Group>(null);

  const raycaster = useMemo(() => new Raycaster(), []);

  const curve = useMemo(() => {
    const pts = desertLakeLizardPathPoints();
    return new CatmullRomCurve3(pts, true, 'catmullrom', 0.42);
  }, []);

  useFrame(({ clock }) => {
    const u = (clock.elapsedTime * PATH_U_PER_SEC) % 1;
    curve.getPointAt(u, _p);
    curve.getTangentAt(u, _t);
    _t.y = 0;
    if (_t.lengthSq() < 1e-8) return;
    _t.normalize();

    const surfaceY = raycastGroundSurfaceY(scene, raycaster, _p.x, _p.z);
    const groundY =
      surfaceY !== null ? surfaceY + FOOT_SURFACE_OFFSET : SAND_FALLBACK_Y;

    const yRot = Math.atan2(_t.x, _t.z);
    const run = clock.elapsedTime * RUN_OMEGA;
    const s = Math.sin(run);
    const c = Math.cos(run);

    const r = root.current;
    if (r) {
      r.position.set(_p.x, groundY, _p.z);
      r.rotation.set(0, yRot, 0);
    }

    const bob = Math.abs(c) * 0.028;
    if (body.current) {
      body.current.position.y = 0.06 + bob;
    }

    const swing = 0.52;
    if (legFL.current) legFL.current.rotation.x = s * swing;
    if (legBR.current) legBR.current.rotation.x = s * swing;
    if (legFR.current) legFR.current.rotation.x = -s * swing;
    if (legBL.current) legBL.current.rotation.x = -s * swing;

    if (tail.current) {
      tail.current.rotation.y = Math.sin(run * 1.1) * 0.38;
      tail.current.rotation.x = -0.12 + Math.sin(run * 0.9) * 0.06;
    }
  });

  const matBody = { color: BODY, roughness: 0.88, flatShading: true as const };
  const matBelly = { color: BELLY, roughness: 0.9, flatShading: true as const };
  const matDark = { color: DARK, roughness: 0.9, flatShading: true as const };

  return (
    <group ref={root} userData={{ desertLakeLizard: true }}>
      <group ref={body} position={[0, 0.06, 0]}>
        {/* Kroppen langs +Z (frem) */}
        <mesh castShadow position={[0, 0.05, -0.02]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.34, 0.11, 0.24]} />
          <meshStandardMaterial {...matBody} />
        </mesh>
        <mesh castShadow position={[0, 0.02, -0.02]}>
          <boxGeometry args={[0.28, 0.06, 0.18]} />
          <meshStandardMaterial {...matBelly} />
        </mesh>
        {/* Hoved */}
        <mesh castShadow position={[0, 0.06, 0.2]} rotation={[0.08, 0, 0]}>
          <boxGeometry args={[0.16, 0.09, 0.14]} />
          <meshStandardMaterial {...matBody} />
        </mesh>
        <mesh castShadow position={[-0.045, 0.08, 0.28]}>
          <sphereGeometry args={[0.028, 6, 5]} />
          <meshStandardMaterial color={0x0d1f0d} roughness={0.5} flatShading />
        </mesh>
        <mesh castShadow position={[0.045, 0.08, 0.28]}>
          <sphereGeometry args={[0.028, 6, 5]} />
          <meshStandardMaterial color={0x0d1f0d} roughness={0.5} flatShading />
        </mesh>
        {/* Snude */}
        <mesh castShadow position={[0, 0.055, 0.34]}>
          <boxGeometry args={[0.1, 0.06, 0.08]} />
          <meshStandardMaterial {...matDark} />
        </mesh>

        {/* Ben — roteret om skulder/hofte mod kroppen */}
        <group ref={legFL} position={[0.11, 0, 0.06]}>
          <mesh castShadow position={[0, -0.05, 0]} rotation={[0.15, 0, 0]}>
            <boxGeometry args={[0.055, 0.12, 0.055]} />
            <meshStandardMaterial {...matBody} />
          </mesh>
        </group>
        <group ref={legFR} position={[-0.11, 0, 0.06]}>
          <mesh castShadow position={[0, -0.05, 0]} rotation={[0.15, 0, 0]}>
            <boxGeometry args={[0.055, 0.12, 0.055]} />
            <meshStandardMaterial {...matBody} />
          </mesh>
        </group>
        <group ref={legBL} position={[0.11, 0, -0.12]}>
          <mesh castShadow position={[0, -0.05, 0]} rotation={[-0.08, 0, 0]}>
            <boxGeometry args={[0.055, 0.11, 0.055]} />
            <meshStandardMaterial {...matBody} />
          </mesh>
        </group>
        <group ref={legBR} position={[-0.11, 0, -0.12]}>
          <mesh castShadow position={[0, -0.05, 0]} rotation={[-0.08, 0, 0]}>
            <boxGeometry args={[0.055, 0.11, 0.055]} />
            <meshStandardMaterial {...matBody} />
          </mesh>
        </group>

        {/* Hale */}
        <group ref={tail} position={[0, 0.07, -0.2]}>
          <mesh castShadow position={[0, 0, -0.16]} rotation={[0.12, 0, 0]}>
            <boxGeometry args={[0.09, 0.07, 0.34]} />
            <meshStandardMaterial {...matBody} />
          </mesh>
          <mesh castShadow position={[0, 0, -0.38]} rotation={[0.2, 0, 0]}>
            <boxGeometry args={[0.06, 0.05, 0.2]} />
            <meshStandardMaterial {...matDark} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
