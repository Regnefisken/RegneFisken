import { useMemo } from 'react';

import { mulberry32 } from '../utils/legacyRng.js';

/** Sørøver-bro — Forbudte Sø (`BRIDGE_MODELS[2]`), samme random-fordeling som legacy. */
export function PiratePier() {
  const oMat = useMemo(
    () => ({ color: 0x3e2723, roughness: 1, flatShading: true as const }),
    [],
  );
  const postMat = useMemo(
    () => ({ color: 0x2a1b18, roughness: 1, flatShading: true as const }),
    [],
  );
  const ropeMat = useMemo(
    () => ({ color: 0x6b5b45, roughness: 1, flatShading: true as const }),
    [],
  );

  const planks = useMemo(() => {
    const rows: { z: number; y: number; rot: [number, number, number] }[] = [];
    let si = 0;
    for (let z = -1; z <= 11; z += 0.3) {
      const next = mulberry32(0xbabe00 ^ (si * 0x85ebca6b));
      if (next() < 0.12) {
        si++;
        continue;
      }
      rows.push({
        z,
        y: 0.3 + next() * 0.1,
        rot: [(next() - 0.5) * 0.15, (next() - 0.5) * 0.15, 0] as [number, number, number],
      });
      si++;
    }
    return rows;
  }, []);

  const posts = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => {
      const zP = -1 + i * 1.2;
      const next = mulberry32(0xcafe00 ^ (i * 0x9e3779b1));
      const xP = (i % 2 === 0 ? -1.6 : 1.6) + (next() - 0.5) * 0.4;
      return {
        x: xP,
        z: zP,
        rot: [(next() - 0.5) * 0.3, 0, (next() - 0.5) * 0.3] as [number, number, number],
      };
    });
  }, []);

  return (
    <group position={[0, 0.05, 0]} rotation={[0, Math.PI * 0.02, 0]}>
      {planks.map((p, i) => (
        <mesh key={i} position={[0, p.y, p.z]} rotation={p.rot} castShadow receiveShadow>
          <boxGeometry args={[3.8, 0.1, 0.2]} />
          <meshStandardMaterial {...oMat} />
        </mesh>
      ))}
      {posts.map((p, i) => (
        <mesh key={`p-${i}`} position={[p.x, -1, p.z]} rotation={p.rot} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 4, 8]} />
          <meshStandardMaterial {...postMat} />
        </mesh>
      ))}
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={`r-${i}`}
          position={[i % 2 === 0 ? -1.7 : 1.7, 0.5, i * 2.8 - 1]}
          rotation={[0, 0, Math.PI * 0.15 * 0.5]}
        >
          <cylinderGeometry args={[0.03, 0.03, 3.5, 6]} />
          <meshStandardMaterial {...ropeMat} />
        </mesh>
      ))}
    </group>
  );
}
