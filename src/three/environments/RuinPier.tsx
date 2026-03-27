import { useMemo } from 'react';

/** Mystisk ruin-bro — Grotte (`BRIDGE_MODELS[4]`). */
export function RuinPier() {
  const sMat = useMemo(
    () => ({ color: 0x485048, roughness: 1, flatShading: true as const }),
    [],
  );
  const glowMat = useMemo(
    () => ({
      color: 0x2a4a3a,
      emissive: 0x001f10,
      emissiveIntensity: 0.8,
      roughness: 0.9,
      flatShading: true as const,
    }),
    [],
  );

  const slabs = useMemo(() => {
    const rows: { z: number; rot: number }[] = [];
    for (let z = 1; z <= 11; z += 2) {
      rows.push({ z, rot: ((z * 9.17) % 1) * Math.PI * 2 });
    }
    return rows;
  }, []);

  const pillars = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      z: 1 + i * 2,
      x: i % 2 === 0 ? -1.8 : 1.8,
      rot: ((i * 4.91) % 1) * Math.PI * 2,
    }));
  }, []);

  const gems = useMemo(() => {
    return [1, 4.5, 7, 10].map((z, i) => ({
      z,
      x: (((i * 3.7) % 1) - 0.5) * 3,
      y: 0.6,
    }));
  }, []);

  return (
    <group position={[0, 0.1, 0]} scale={[0.95, 1, 0.95]}>
      {slabs.map((s, i) => (
        <mesh key={i} position={[0, 0.25, s.z]} castShadow receiveShadow rotation={[0, s.rot, 0]}>
          <boxGeometry args={[3.8, 0.4, 1.9]} />
          <meshStandardMaterial {...sMat} />
        </mesh>
      ))}
      {pillars.map((p, i) => (
        <mesh key={`p-${i}`} position={[p.x, 0.5, p.z]} rotation={[0, p.rot, 0]} castShadow>
          <boxGeometry args={[0.6, 2.2, 0.6]} />
          <meshStandardMaterial {...sMat} />
        </mesh>
      ))}
      {gems.map((g, i) => (
        <mesh key={`g-${i}`} position={[g.x, g.y, g.z]}>
          <octahedronGeometry args={[0.15, 0]} />
          <meshStandardMaterial {...glowMat} />
        </mesh>
      ))}
    </group>
  );
}
