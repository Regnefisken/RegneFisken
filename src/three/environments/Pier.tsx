import { useMemo } from 'react';

/** Træmole (variant 0) — forenklet fra legacy `BRIDGE_MODELS[0]`. */
export function Pier() {
  const wMat = useMemo(() => ({ color: 0x5d4037, roughness: 0.9, flatShading: true as const }), []);
  const dMat = useMemo(() => ({ color: 0x3e2723, roughness: 1, flatShading: true as const }), []);

  const planks = useMemo(() => {
    const rows: { z: number; jitter: number }[] = [];
    for (let z = -1; z <= 11.2; z += 0.28) {
      rows.push({ z, jitter: ((z * 7.13) % 1) * 0.05 - 0.025 });
    }
    return rows;
  }, []);

  return (
    <group position={[0, 0.1, 0]}>
      {planks.map((row, i) => (
        <mesh
          key={i}
          position={[row.jitter, 0.3, row.z]}
          rotation={[0, row.jitter * 0.8, row.jitter * 0.4]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[4.0, 0.15, 0.25]} />
          <meshStandardMaterial {...wMat} />
        </mesh>
      ))}
      <mesh position={[-1.5, 0.05, 5]} castShadow receiveShadow>
        <boxGeometry args={[0.3, 0.4, 12.5]} />
        <meshStandardMaterial {...dMat} />
      </mesh>
      <mesh position={[1.5, 0.05, 5]} castShadow receiveShadow>
        <boxGeometry args={[0.3, 0.4, 12.5]} />
        <meshStandardMaterial {...dMat} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const zP = -0.5 + i * 1.6;
        const xP = i % 2 === 0 ? -1.8 : 1.8;
        return (
          <mesh key={`p-${i}`} position={[xP, -1, zP]} castShadow>
            <cylinderGeometry args={[0.18, 0.18, 3.5, 12]} />
            <meshStandardMaterial {...dMat} />
          </mesh>
        );
      })}
    </group>
  );
}
