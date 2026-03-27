import { useMemo } from 'react';

/** Moderne marina — Ishavet (`BRIDGE_MODELS[3]`). */
export function MarinaPier() {
  const deck = useMemo(
    () => ({ color: 0xdce8f0, roughness: 0.3, flatShading: true as const }),
    [],
  );
  const edge = useMemo(
    () => ({ color: 0x1e3a5f, metalness: 0.7, roughness: 0.3, flatShading: true as const }),
    [],
  );
  const rail = useMemo(
    () => ({ color: 0xe0e8f0, metalness: 0.95, roughness: 0.05, flatShading: true as const }),
    [],
  );

  const posts = useMemo(() => {
    const pts: { x: number; z: number }[] = [];
    for (let z = 0; z <= 10; z += 2) {
      for (const side of [-1.8, 1.8]) {
        pts.push({ x: side, z });
      }
    }
    return pts;
  }, []);

  return (
    <group position={[0, 0.1, 0]}>
      <mesh position={[0, 0.3, 5]} castShadow receiveShadow>
        <boxGeometry args={[4, 0.3, 12.2]} />
        <meshStandardMaterial {...deck} />
      </mesh>
      {[-2, 2].map((side) => (
        <group key={side}>
          <mesh position={[side, 0.35, 5]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 12.2, 16]} />
            <meshStandardMaterial {...edge} />
          </mesh>
          <mesh position={[side * 0.9, 1.1, 5]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 12, 12]} />
            <meshStandardMaterial {...rail} />
          </mesh>
        </group>
      ))}
      {posts.map((p, i) => (
        <mesh key={i} position={[p.x, 0.75, p.z]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.8, 8]} />
          <meshStandardMaterial {...edge} />
        </mesh>
      ))}
    </group>
  );
}
