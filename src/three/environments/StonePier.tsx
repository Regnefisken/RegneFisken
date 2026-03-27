import { useMemo } from 'react';

/** Stensætning + planker — Ørkensøen (`BRIDGE_MODELS[1]`). */
export function StonePier() {
  const sMat = useMemo(
    () => ({ color: 0x8b7d6b, roughness: 0.95, flatShading: true as const }),
    [],
  );
  const floorMat = useMemo(
    () => ({ color: 0x9e9080, roughness: 1, flatShading: true as const }),
    [],
  );

  const zPlanks = useMemo(() => {
    const rows: number[] = [];
    for (let z = -1; z <= 11; z += 0.5) rows.push(z);
    return rows;
  }, []);

  return (
    <group position={[0, -0.3, 0]} scale={[1.05, 1, 1]}>
      <mesh position={[0, -1.2, 5]} castShadow receiveShadow>
        <boxGeometry args={[3.8, 3, 12]} />
        <meshStandardMaterial {...sMat} />
      </mesh>
      {zPlanks.map((z) => (
        <group key={z}>
          <mesh position={[-1.9, 0.4, z]} castShadow>
            <boxGeometry args={[0.4, 0.25, 0.48]} />
            <meshStandardMaterial {...sMat} />
          </mesh>
          <mesh position={[1.9, 0.4, z]} castShadow>
            <boxGeometry args={[0.4, 0.25, 0.48]} />
            <meshStandardMaterial {...sMat} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.3, 5]} receiveShadow>
        <boxGeometry args={[3.6, 0.1, 12]} />
        <meshStandardMaterial {...floorMat} />
      </mesh>
    </group>
  );
}
