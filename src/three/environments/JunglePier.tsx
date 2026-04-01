import { useMemo } from 'react';

import { mulberry32 } from '../utils/legacyRng.js';

const PLANK_STEP = 0.32;

/**
 * Strandkant mod molen (x≈0): `JungleIsland`-sand har centrum z=14, top-radius ~27.5.
 * Bro-planker har lokalt z op til ~11.2 — offset flytter hele molen ud i vandet så den kun lige møder sandet.
 */
/** Eksporteret til `JunglePlayerController` (bro-z i verdensrum). */
export const JUNGLE_PIER_ANCHOR_Z = 1.58 - 11.2 - 13.75;

/** TRIN 5: mørk forvitret junglekaj — samme grid som Pier, jungle-æstetik. */
export function JunglePier() {
  /* Matcher Pier på jungle: undgå tætte skygge-striber på bro/strand. */
  const pierShadows = false;

  const plankMat = useMemo(() => ({ color: 0x4a3520, roughness: 0.92, flatShading: true as const }), []);
  const railMat = useMemo(() => ({ color: 0x3a2510, roughness: 0.95, flatShading: true as const }), []);

  const planks = useMemo(() => {
    const rows: { z: number; x: number; rotY: number; rotZ: number }[] = [];
    let pi = 0;
    for (let z = -1; z <= 11.2; z += PLANK_STEP) {
      const next = mulberry32(0x4a35200 ^ (pi * 0x9e3779b9));
      const rx = next();
      const ry = next();
      const rz = next();
      rows.push({
        z,
        x: (rx - 0.5) * 0.08,
        rotY: (ry - 0.5) * 0.09,
        rotZ: (rz - 0.5) * 0.045,
      });
      pi++;
    }
    return rows;
  }, []);

  return (
    <group position={[0, 0.095, JUNGLE_PIER_ANCHOR_Z]}>
      {planks.map((row, i) => (
        <mesh
          key={i}
          position={[row.x, 0.285, row.z]}
          rotation={[0, row.rotY, row.rotZ]}
          castShadow={pierShadows}
          receiveShadow={pierShadows}
        >
          <boxGeometry args={[2.8, 0.15, 0.25]} />
          <meshStandardMaterial {...plankMat} />
        </mesh>
      ))}

      <mesh position={[-1.015, 0.0475, 5]} castShadow={pierShadows} receiveShadow={pierShadows}>
        <boxGeometry args={[0.18, 0.4, 12.5]} />
        <meshStandardMaterial {...railMat} />
      </mesh>
      <mesh position={[1.015, 0.0475, 5]} castShadow={pierShadows} receiveShadow={pierShadows}>
        <boxGeometry args={[0.18, 0.4, 12.5]} />
        <meshStandardMaterial {...railMat} />
      </mesh>

      {Array.from({ length: 8 }, (_, i) => {
        const zP = -0.5 + i * 1.6;
        const xP = i % 2 === 0 ? -1.225 : 1.225;
        return (
          <mesh key={`p-${i}`} position={[xP, -1, zP]} castShadow={pierShadows}>
            <cylinderGeometry args={[0.17, 0.18, 3.5, 12]} />
            <meshStandardMaterial {...railMat} />
          </mesh>
        );
      })}
    </group>
  );
}
