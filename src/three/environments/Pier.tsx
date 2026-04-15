import { useMemo } from 'react';

import { useGameStore } from '../../store/useGameStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import { SeagullNPC } from '../models/SeagullNPC.js';
import { mulberry32 } from '../utils/legacyRng.js';

/** Træmole — `BRIDGE_MODELS[0]` i legacy-game.html: tre uafhængige random-værdier pr. planke. */
export function Pier() {
  const locationId = useGameStore((s) => s.currentLocation);
  const setShowCollectibleModal = useUIStore((s) => s.setShowCollectibleModal);
  /* Jungle: planker + pæle giver tætte skygge-striber på bro og strand — midlertidigt uden skygger her. */
  const pierShadows = locationId !== 'jungle_island';

  const wMat = useMemo(() => ({ color: 0x5d4037, roughness: 0.9, flatShading: true as const }), []);
  const dMat = useMemo(() => ({ color: 0x3e2723, roughness: 1, flatShading: true as const }), []);

  const planks = useMemo(() => {
    const rows: { z: number; x: number; rotY: number; rotZ: number }[] = [];
    let pi = 0;
    for (let z = -1; z <= 11.2; z += 0.28) {
      const next = mulberry32(0x5d40370 ^ (pi * 0x9e3779b9));
      const rx = next();
      const ry = next();
      const rz = next();
      rows.push({
        z,
        x: (rx - 0.5) * 0.05,
        rotY: (ry - 0.5) * 0.04,
        rotZ: (rz - 0.5) * 0.02,
      });
      pi++;
    }
    return rows;
  }, []);

  return (
    <group position={[0, 0.1, 0]}>
      {planks.map((row, i) => (
        <mesh
          key={i}
          position={[row.x, 0.3, row.z]}
          rotation={[0, row.rotY, row.rotZ]}
          castShadow={pierShadows}
          receiveShadow={pierShadows}
        >
          <boxGeometry args={[4.0, 0.15, 0.25]} />
          <meshStandardMaterial {...wMat} />
        </mesh>
      ))}
      <mesh position={[-1.5, 0.05, 5]} castShadow={pierShadows} receiveShadow={pierShadows}>
        <boxGeometry args={[0.3, 0.4, 12.5]} />
        <meshStandardMaterial {...dMat} />
      </mesh>
      <mesh position={[1.5, 0.05, 5]} castShadow={pierShadows} receiveShadow={pierShadows}>
        <boxGeometry args={[0.3, 0.4, 12.5]} />
        <meshStandardMaterial {...dMat} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const zP = -0.5 + i * 1.6;
        const xP = i % 2 === 0 ? -1.8 : 1.8;
        return (
          <mesh key={`p-${i}`} position={[xP, -1, zP]} castShadow={pierShadows}>
            <cylinderGeometry args={[0.18, 0.18, 3.5, 12]} />
            <meshStandardMaterial {...dMat} />
          </mesh>
        );
      })}
      {locationId === 'smaragd' && (
        <SeagullNPC
          position={[-1.8, 0.85, 5.9]}
          onInteract={() => setShowCollectibleModal('sardine')}
        />
      )}
    </group>
  );
}
