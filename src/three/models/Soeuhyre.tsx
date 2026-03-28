import { useMemo, useRef, type MutableRefObject, type ReactNode } from 'react';
import { AdditiveBlending, Group, type Points } from 'three';
import type { ThreeElements } from '@react-three/fiber';
import { useFrame } from '@react-three/fiber';

const NUM_SEGMENTS = 30;
const PARTICLES = 400;

function detB(i: number, j: number) {
  const x = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Søuhyre — legacy `createSoeUhyreMesh` (segment-bølge + bobler). */
export function Soeuhyre({
  diveAngle = 0,
  diveAngleRef,
  catchMode = false,
  children,
  ...props
}: {
  diveAngle?: number;
  diveAngleRef?: MutableRefObject<number>;
  catchMode?: boolean;
  children?: ReactNode;
} & ThreeElements['group']) {
  const segRefs = useRef<(Group | null)[]>([]);
  const bubblesRef = useRef<Points>(null);
  const bubblePos = useMemo(() => {
    const pos = new Float32Array(PARTICLES * 3);
    for (let i = 0; i < PARTICLES * 3; i++) {
      pos[i] = (detB(i, i % 17) - 0.5) * 40;
    }
    return pos;
  }, []);

  const segments = useMemo(() => {
    const list: { i: number; radius: number; z: number }[] = [];
    for (let i = 0; i < NUM_SEGMENTS; i++) {
      let radius = 2.5;
      if (i > 0) {
        const tailFactor = i / NUM_SEGMENTS;
        radius = 2.5 * Math.cos((tailFactor * Math.PI) / 2);
      }
      if (radius < 0.2) radius = 0.2;
      list.push({ i, radius, z: -i * 2.2 });
    }
    return list;
  }, []);

  const skinMat = useMemo(
    () => ({ color: 0x11aa33, roughness: 0.4, metalness: 0.1, flatShading: true as const }),
    [],
  );
  const spikeMat = useMemo(() => ({ color: 0x005511, flatShading: true as const }), []);
  const toothMat = useMemo(() => ({ color: 0xffffee, flatShading: true as const }), []);

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    const da = diveAngleRef ? diveAngleRef.current : diveAngle;
    const speed = 3.0;
    const waveLength = 0.4;

    segRefs.current.forEach((seg, idx) => {
      if (!seg) return;
      const offset = idx * waveLength;
      const surfaceMix = 1.0 - da * 0.7;
      seg.position.x = Math.sin(time * speed - offset) * 4 * surfaceMix;
      seg.position.y = Math.cos(time * speed * 0.8 - offset) * 0.5 * surfaceMix;
      seg.rotation.z = Math.cos(time * speed - offset) * 0.04 * surfaceMix;
      seg.rotation.y = Math.sin(time * speed - offset) * 0.2 * surfaceMix;
      const tailT = idx / NUM_SEGMENTS;
      seg.rotation.x = da * tailT * 0.6;
    });

    const geo = bubblesRef.current?.geometry;
    if (geo?.attributes.position) {
      const positions = geo.attributes.position.array as Float32Array;
      const bubbleSpeed = 0.4 + da * 0.6;
      for (let i = 2; i < PARTICLES * 3; i += 3) {
        positions[i] += bubbleSpeed;
        positions[i - 1] += 0.03 + da * 0.05;
        if (positions[i] > 20) {
          const seed = Math.floor(i / 3);
          positions[i] = -40;
          positions[i - 1] = (detB(seed, 2) - 0.5) * 30;
          positions[i - 2] = (detB(seed, 3) - 0.5) * 40;
        }
      }
      geo.attributes.position.needsUpdate = true;
    }
  });

  const scale = catchMode ? 0.18 * 0.22 : 0.22;

  return (
    <group scale={scale} {...props}>
      {segments.map((s) => (
        <group
          key={s.i}
          ref={(el) => {
            segRefs.current[s.i] = el;
          }}
          position={[0, 0, s.z]}
        >
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[s.radius, 6, 6]} />
            <meshStandardMaterial {...skinMat} />
          </mesh>
          {s.i > 2 && s.i < NUM_SEGMENTS - 2 && s.i % 2 === 0 ? (
            <mesh position={[0, s.radius + s.radius * 0.2, 0]} rotation={[-0.2, 0, 0]} castShadow>
              <coneGeometry args={[s.radius * 0.3, s.radius * 1.5, 4]} />
              <meshStandardMaterial {...spikeMat} />
            </mesh>
          ) : null}
          {s.i === 0 ? (
            <>
              <group position={[1.5, 1.2, 1.8]}>
                <mesh castShadow>
                  <sphereGeometry args={[0.5, 16, 16]} />
                  <meshStandardMaterial color={0xffdd00} emissive={0x665500} />
                </mesh>
                <mesh position={[0.1, 0, 0.4]} castShadow>
                  <sphereGeometry args={[0.2, 16, 16]} />
                  <meshBasicMaterial color={0x000000} />
                </mesh>
              </group>
              <group position={[-1.5, 1.2, 1.8]}>
                <mesh castShadow>
                  <sphereGeometry args={[0.5, 16, 16]} />
                  <meshStandardMaterial color={0xffdd00} emissive={0x665500} />
                </mesh>
                <mesh position={[-0.1, 0, 0.4]} castShadow>
                  <sphereGeometry args={[0.2, 16, 16]} />
                  <meshBasicMaterial color={0x000000} />
                </mesh>
              </group>
              <mesh position={[1.2, 2.2, 0]} rotation={[-0.5, 0, -0.3]} castShadow>
                <coneGeometry args={[0.4, 2, 8]} />
                <meshStandardMaterial color={0x004411} />
              </mesh>
              <mesh position={[-1.2, 2.2, 0]} rotation={[-0.5, 0, 0.3]} castShadow>
                <coneGeometry args={[0.4, 2, 8]} />
                <meshStandardMaterial color={0x004411} />
              </mesh>
              {Array.from({ length: 9 }, (_, t) => {
                const tFactor = t / 8 - 0.5;
                return (
                  <mesh
                    key={t}
                    position={[tFactor * 3.8, -0.9 + Math.abs(tFactor) * 0.5, 2.7 - Math.abs(tFactor) * 2.0]}
                    rotation={[Math.PI - 0.8, tFactor * 0.5, -tFactor * 1.5]}
                    castShadow
                  >
                    <coneGeometry args={[0.25, 1.2, 4]} />
                    <meshStandardMaterial {...toothMat} />
                  </mesh>
                );
              })}
            </>
          ) : null}
        </group>
      ))}
      <points ref={bubblesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[bubblePos, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={0xffffff}
          size={0.15}
          transparent
          opacity={0.4}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
      {children}
    </group>
  );
}
