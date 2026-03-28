import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import {
  Mesh,
  MeshBasicMaterial,
  Scene,
  TetrahedronGeometry,
  Vector3,
} from 'three';
import { useGameStore } from '../../store/useGameStore.js';
import { drainWaterSplashSpawns } from './waterSplashFx.js';

type Particle = {
  mesh: Mesh;
  velocity: Vector3;
  life: number;
  decay: number;
};

const geo = new TetrahedronGeometry(0.15);
const baseMat = new MeshBasicMaterial({ color: 0x87ceeb });

function spawnWater(scene: Scene, list: Particle[], origin: Vector3, count: number) {
  for (let i = 0; i < count; i++) {
    const mat = baseMat.clone();
    const mesh = new Mesh(geo, mat);
    mesh.position.copy(origin);
    mesh.position.x += (Math.random() - 0.5) * 0.5;
    mesh.position.z += (Math.random() - 0.5) * 0.5;
    const vel = new Vector3(
      (Math.random() - 0.5) * 0.3,
      Math.random() * 0.5 + 0.1,
      (Math.random() - 0.5) * 0.3,
    );
    scene.add(mesh);
    list.push({
      mesh,
      velocity: vel,
      life: 1,
      decay: 0.025 + Math.random() * 0.01,
    });
  }
}

/** Legacy `spawnParticles(..., 'water', ...)` — tetraedre med tyngde og fade. */
export function WaterSplashParticles() {
  const { scene } = useThree();
  const particlesRef = useRef<Particle[]>([]);
  const prevGs = useRef(useGameStore.getState().gameState);

  useEffect(() => {
    return useGameStore.subscribe((s) => {
      const now = s.gameState;
      const was = prevGs.current;
      if (was === 'casting' && now === 'waiting') {
        spawnWater(scene, particlesRef.current, new Vector3(0, 0, -2.8), 15);
      }
      prevGs.current = now;
    });
  }, [scene]);

  useFrame(() => {
    const list = particlesRef.current;
    for (const batch of drainWaterSplashSpawns()) {
      spawnWater(scene, list, batch.origin, batch.count);
    }
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.life -= p.decay;
      p.mesh.position.add(p.velocity);
      p.velocity.y -= 0.02;
      p.mesh.scale.setScalar(p.life * 0.5);
      p.mesh.rotation.x += 0.1;
      p.mesh.rotation.y += 0.1;
      if (p.life <= 0 || p.mesh.position.y < -2) {
        scene.remove(p.mesh);
        const m = p.mesh.material;
        if (!Array.isArray(m)) m.dispose();
        else m.forEach((x) => x.dispose());
        list.splice(i, 1);
      }
    }
  });

  return null;
}
