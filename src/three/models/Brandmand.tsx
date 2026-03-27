import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import {
  Group,
  IcosahedronGeometry,
  MeshPhysicalMaterial,
  QuadraticBezierCurve3,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
  type Mesh,
} from 'three';
import type { ThreeElements } from '@react-three/fiber';
import { useFrame } from '@react-three/fiber';

function det(i: number, j: number) {
  const x = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const brandmandPhy = (() => {
  const bell = new MeshPhysicalMaterial({
    color: 0xff77aa,
    transmission: 0.88,
    roughness: 0.2,
    metalness: 0,
    transparent: true,
    opacity: 0.68,
    emissive: 0x550033,
    emissiveIntensity: 0.4,
    clearcoat: 0.6,
    side: 2,
  });
  const rim = new MeshPhysicalMaterial({
    color: 0xff99cc,
    transparent: true,
    opacity: 0.55,
    emissive: 0xff3366,
    emissiveIntensity: 0.3,
    roughness: 0.3,
  });
  const core = new MeshPhysicalMaterial({
    color: 0xff3366,
    transmission: 0.65,
    transparent: true,
    opacity: 0.5,
    emissive: 0xff0022,
    emissiveIntensity: 0.6,
  });
  return { bell, rim, core };
})();

/** Brandmand / gopledyr — legacy `createBrandmandMesh` med `triggerFlash` ved mount. */
export function Brandmand({ children, ...props }: { children?: ReactNode } & ThreeElements['group']) {
  const groupRef = useRef<Group>(null);
  const innerGlowRef = useRef<import('three').PointLight>(null);
  const coreRef = useRef<Mesh>(null);
  const tentacleRefs = useRef<(Mesh | null)[]>([]);
  const oralRefs = useRef<(Mesh | null)[]>([]);
  const flashRef = useRef(1);

  const bellGeo = useMemo(
    () => new SphereGeometry(1.15, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.62),
    [],
  );
  const rimGeo = useMemo(() => new TorusGeometry(1.12, 0.06, 12, 48), []);
  const coreGeo = useMemo(() => new IcosahedronGeometry(0.48, 1), []);

  const tentacles = useMemo(() => {
    const num = 16;
    const list: { geo: TubeGeometry; angle: number; idx: number }[] = [];
    for (let i = 0; i < num; i++) {
      const angle = (i / num) * Math.PI * 2;
      const offsetX = Math.cos(angle) * 1.08;
      const offsetZ = Math.sin(angle) * 1.08;
      const randSeed = det(i, 1);
      const curve = new QuadraticBezierCurve3(
        new Vector3(offsetX, 0.42, offsetZ),
        new Vector3(offsetX * 1.25, -1.1, offsetZ * 1.25),
        new Vector3(
          offsetX * 0.7 + (randSeed - 0.5) * 0.9,
          -5.2,
          offsetZ * 0.7 + (randSeed - 0.5) * 0.9,
        ),
      );
      list.push({ geo: new TubeGeometry(curve, 12, 0.022, 6, false), angle, idx: i });
    }
    return list;
  }, []);

  const oralArms = useMemo(() => {
    const list: { geo: TubeGeometry; angle: number; idx: number }[] = [];
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const ox = Math.cos(angle) * 0.35;
      const oz = Math.sin(angle) * 0.35;
      const curve = new QuadraticBezierCurve3(
        new Vector3(ox, 0.3, oz),
        new Vector3(ox * 2.5, -1.5, oz * 2.5),
        new Vector3(ox * 1.8, -3.8, oz * 1.8),
      );
      list.push({ geo: new TubeGeometry(curve, 10, 0.055, 6, false), angle, idx: i });
    }
    return list;
  }, []);

  useEffect(() => {
    flashRef.current = 1;
    brandmandPhy.bell.emissiveIntensity = 0.4;
    brandmandPhy.bell.emissive.setHex(0x550033);
  }, []);

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    const g = groupRef.current;
    if (!g) return;

    const pulse = Math.sin(time * 2.8) * 0.11 + 1.0;
    const breathe = 1 - Math.sin(time * 1.4) * 0.08;
    g.scale.set(pulse * 0.68, breathe * 0.68, pulse * 0.68);

    tentacleRefs.current.forEach((mesh, tIdx) => {
      if (!mesh) return;
      const t = tentacles[tIdx];
      if (!t) return;
      const wave = Math.sin(time * 4 + t.idx * 1.3) * 0.35;
      mesh.rotation.z = wave * 0.8;
      mesh.rotation.x = Math.cos(t.angle) * wave * 0.6;
    });

    oralRefs.current.forEach((mesh, idx) => {
      if (!mesh) return;
      const wave = Math.sin(time * 3 + idx * 1.8) * 0.25;
      mesh.rotation.z = wave * 0.6;
      const a = oralArms[idx]?.angle ?? 0;
      mesh.rotation.x = Math.cos(a) * wave * 0.5;
    });

    g.position.y = Math.sin(time * 0.8) * 0.25 - 0.1;
    g.rotation.y = Math.sin(time * 0.5) * 0.15;

    let flash = flashRef.current;
    if (flash > 0) {
      flash *= 0.92;
      flashRef.current = flash;
      brandmandPhy.bell.emissiveIntensity = 0.4 + flash * 2.0;
      brandmandPhy.bell.emissive.setHex(flash > 0.3 ? 0xff0000 : 0x550033);
      if (innerGlowRef.current) innerGlowRef.current.intensity = 1.2 + flash * 4.0;
      if (flash < 0.01) {
        flashRef.current = 0;
        brandmandPhy.bell.emissiveIntensity = 0.4;
        brandmandPhy.bell.emissive.setHex(0x550033);
        if (innerGlowRef.current) innerGlowRef.current.intensity = 1.2 + Math.sin(time * 6) * 0.4;
      }
    } else if (innerGlowRef.current) {
      innerGlowRef.current.intensity = 1.2 + Math.sin(time * 6) * 0.4;
    }

    const core = coreRef.current;
    if (core) {
      const s = 0.9 + Math.sin(time * 5) * 0.12;
      core.scale.setScalar(s);
      brandmandPhy.core.emissiveIntensity = 0.6 + Math.sin(time * 3.5) * 0.3;
    }
  });

  const tentMat = useMemo(
    () => ({
      color: 0xff4488,
      transparent: true,
      opacity: 0.42,
      shininess: 5,
      side: 2 as const,
    }),
    [],
  );
  const oralMat = useMemo(
    () => ({
      color: 0xff6699,
      transparent: true,
      opacity: 0.5,
      shininess: 10,
    }),
    [],
  );

  return (
    <group ref={groupRef} {...props}>
      <mesh scale={[1, 0.48, 1]} position={[0, 0.72, 0]} geometry={bellGeo} material={brandmandPhy.bell} castShadow />
      <mesh position={[0, 0.38, 0]} rotation={[Math.PI / 2, 0, 0]} geometry={rimGeo} material={brandmandPhy.rim} />
      <mesh ref={coreRef} position={[0, 0.58, 0]} geometry={coreGeo} material={brandmandPhy.core} castShadow />
      <pointLight ref={innerGlowRef} color={0xff2255} intensity={1.2} distance={3} position={[0, 0.55, 0]} />
      {tentacles.map((t, i) => (
        <mesh
          key={i}
          ref={(el) => {
            tentacleRefs.current[i] = el;
          }}
          geometry={t.geo}
          castShadow
        >
          <meshPhongMaterial {...tentMat} />
        </mesh>
      ))}
      {oralArms.map((a, i) => (
        <mesh
          key={`o-${i}`}
          ref={(el) => {
            oralRefs.current[i] = el;
          }}
          geometry={a.geo}
          castShadow
        >
          <meshPhongMaterial {...oralMat} />
        </mesh>
      ))}
      {children}
    </group>
  );
}
