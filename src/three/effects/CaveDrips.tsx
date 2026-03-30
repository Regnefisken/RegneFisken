import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Group, Mesh, MeshBasicMaterial, SphereGeometry } from 'three';
import { playSoundEffect } from '../../audio/audioEngine.js';

const DRIP_GEO = new SphereGeometry(0.04, 10, 10);
const DRIP_MAT = new MeshBasicMaterial({
  color: 0x88ccff,
  transparent: true,
  opacity: 0.6,
});

type Drip = { mesh: Mesh; vy: number };

const MAX_DRIPS = 12;

/** Vanddråber fra loftet i grotten — let gravity + dryp-lyd ved vandoverfladen. */
export function CaveDrips() {
  const groupRef = useRef<Group>(null);
  const dripsRef = useRef<Drip[]>([]);
  const nextSpawnAtRef = useRef(0);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    const now = performance.now();
    if (nextSpawnAtRef.current === 0) {
      nextSpawnAtRef.current = now + 800 + Math.random() * 2200;
    }

    if (now >= nextSpawnAtRef.current && dripsRef.current.length < MAX_DRIPS) {
      const mesh = new Mesh(DRIP_GEO, DRIP_MAT);
      mesh.position.set(
        -12 + Math.random() * 24,
        7 + Math.random() * 2,
        -15 + Math.random() * 25,
      );
      group.add(mesh);
      dripsRef.current.push({ mesh, vy: 0 });
      nextSpawnAtRef.current = now + 800 + Math.random() * 2200;
    }

    for (let i = dripsRef.current.length - 1; i >= 0; i--) {
      const d = dripsRef.current[i];
      d.vy -= 0.003;
      d.mesh.position.y += d.vy;
      if (d.mesh.position.y < -2) {
        playSoundEffect('cave_drip');
        group.remove(d.mesh);
        dripsRef.current.splice(i, 1);
      }
    }
  });

  return <group ref={groupRef} />;
}
