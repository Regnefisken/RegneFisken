import { useMemo, useRef } from 'react';
import { DoubleSide, Group } from 'three';
import { useFrame } from '@react-three/fiber';

/** Legacy createCatchModel plesiosaur-gren (skaleret, flipper-paddle). */
export function PlesiosaurusCatchModel({ bucketIdle }: { bucketIdle?: boolean }) {
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
    if (r) r.rotation.y += bucketIdle ? 0.004 : 0.008;
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

export function AxolotlCatchModel({ bucketIdle }: { bucketIdle?: boolean }) {
  const g = useRef<Group>(null);
  useFrame(() => {
    if (g.current) g.current.rotation.y += bucketIdle ? 0.005 : 0.009;
  });
  const pink = '#ffb6c1';
  const hot = '#ff1493';
  return (
    <group ref={g} scale={1.15}>
      <pointLight color={hot} intensity={0.65} distance={3} position={[0, 0.4, 0.6]} />
      <mesh castShadow scale={[1.8, 1, 1]}>
        <sphereGeometry args={[0.45, 16, 12]} />
        <meshStandardMaterial color={pink} emissive={hot} emissiveIntensity={0.35} roughness={0.4} />
      </mesh>
      <mesh castShadow position={[0.52, 0.05, 0]} scale={[0.85, 0.7, 0.75]}>
        <sphereGeometry args={[0.32, 12, 10]} />
        <meshStandardMaterial color={pink} roughness={0.45} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[0.35, 0.12, s * 0.38]} rotation={[0, 0, s * 0.4]}>
          {[0, 1, 2].map((j) => (
            <mesh key={j} position={[0.06, -0.08 - j * 0.12, 0]} castShadow>
              <coneGeometry args={[0.06, 0.22, 6]} />
              <meshStandardMaterial color={hot} emissive={hot} emissiveIntensity={0.8} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh castShadow position={[0.55, -0.05, 0.18]} rotation={[0.3, 0, 0.5]}>
        <cylinderGeometry args={[0.05, 0.04, 0.32, 6]} />
        <meshStandardMaterial color={pink} />
      </mesh>
      <mesh castShadow position={[0.55, -0.05, -0.18]} rotation={[-0.3, 0, 0.5]}>
        <cylinderGeometry args={[0.05, 0.04, 0.32, 6]} />
        <meshStandardMaterial color={pink} />
      </mesh>
      <mesh castShadow position={[-0.55, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.12, 0.35, 8]} />
        <meshStandardMaterial color={pink} />
      </mesh>
      <mesh position={[0.62, 0.1, 0.14]}>
        <sphereGeometry args={[0.055, 8, 6]} />
        <meshBasicMaterial color="#111" />
      </mesh>
      <mesh position={[0.62, 0.1, -0.14]}>
        <sphereGeometry args={[0.055, 8, 6]} />
        <meshBasicMaterial color="#111" />
      </mesh>
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
