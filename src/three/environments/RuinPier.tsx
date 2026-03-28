import { useMemo } from 'react';

/** Mystisk ruin-bro — Grotte (`BRIDGE_MODELS[4]` i legacy-game.html ~3146–3163). */
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

  /** legacy: for (let z = 1; z <= 11; z += 2) — ingen rotation på planker (kun position 0, 0.25, z). */
  const slabZ = useMemo(() => {
    const z: number[] = [];
    for (let v = 1; v <= 11; v += 2) z.push(v);
    return z;
  }, []);

  /** legacy: søjler — rotation.y = Math.random() * 2π per søjle (stabile pseudo-tilfældige værdier). */
  const pillars = useMemo(() => {
    const rot = [0.37, 2.81, 5.12, 1.03, 4.44, 2.19];
    return Array.from({ length: 6 }, (_, i) => ({
      z: 1 + i * 2,
      x: i % 2 === 0 ? -1.8 : 1.8,
      rotY: rot[i]!,
    }));
  }, []);

  /** legacy: for (let z = 1; z <= 10; z += 3.5) + (Math.random()-0.5)*3 på x */
  const gems = useMemo(() => {
    const rows: { z: number; x: number }[] = [];
    for (let z = 1; z <= 10; z += 3.5) {
      rows.push({ z, x: (Math.sin(z * 2.17) * 0.92) * 1.5 });
    }
    return rows;
  }, []);

  return (
    <group position={[0, 0.1, 0]} scale={[0.95, 1, 0.95]}>
      {slabZ.map((z, i) => (
        <mesh key={i} position={[0, 0.25, z]} castShadow receiveShadow>
          <boxGeometry args={[3.8, 0.4, 1.9]} />
          <meshStandardMaterial {...sMat} />
        </mesh>
      ))}
      {pillars.map((p, i) => (
        <mesh key={`p-${i}`} position={[p.x, 0.5, p.z]} rotation={[0, p.rotY, 0]} castShadow>
          <boxGeometry args={[0.6, 2.2, 0.6]} />
          <meshStandardMaterial {...sMat} />
        </mesh>
      ))}
      {gems.map((g, i) => (
        <mesh key={`g-${i}`} position={[g.x, 0.6, g.z]}>
          <octahedronGeometry args={[0.15, 0]} />
          <meshStandardMaterial {...glowMat} />
        </mesh>
      ))}
    </group>
  );
}
