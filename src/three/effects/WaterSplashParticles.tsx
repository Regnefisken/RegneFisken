import { useFrame } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useRef } from 'react';
import {
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  Object3D,
  TetrahedronGeometry,
  Vector3,
} from 'three';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';
import { useGameStore } from '../../store/useGameStore.js';
import { castTargetLandZRef } from '../logic/castTargetLandZ.js';
import { drainWaterSplashSpawns } from './waterSplashFx.js';

const MAX_PARTICLES = 48;
const GEO = new TetrahedronGeometry(0.15);
const MAT = new MeshBasicMaterial({ color: 0x87ceeb });

type Particle = {
  slot: number;
  position: Vector3;
  velocity: Vector3;
  life: number;
  decay: number;
  rotX: number;
  rotY: number;
};

const _dummy = new Object3D();
const _hidden = new Matrix4().makeScale(0, 0, 0);

/** Legacy `spawnParticles(..., 'water', ...)` — tetraedre med tyngde og fade. */
export function WaterSplashParticles() {
  const reducedMotion = useReducedMotion();
  const meshRef = useRef<InstancedMesh>(null);
  const particles = useRef<Particle[]>([]);
  const usedSlots = useRef(new Set<number>());
  const prevGs = useRef(useGameStore.getState().gameState);

  function nextFreeSlot(): number | null {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (!usedSlots.current.has(i)) return i;
    }
    return null;
  }

  function spawnParticles(origin: Vector3, count: number) {
    for (let i = 0; i < count; i++) {
      const slot = nextFreeSlot();
      if (slot === null) return;
      usedSlots.current.add(slot);
      particles.current.push({
        slot,
        position: origin.clone().add(
          new Vector3((Math.random() - 0.5) * 0.5, 0, (Math.random() - 0.5) * 0.5),
        ),
        velocity: new Vector3(
          (Math.random() - 0.5) * 0.3,
          Math.random() * 0.5 + 0.1,
          (Math.random() - 0.5) * 0.3,
        ),
        life: 1,
        decay: 0.025 + Math.random() * 0.01,
        rotX: Math.random() * Math.PI * 2,
        rotY: Math.random() * Math.PI * 2,
      });
    }
  }

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < MAX_PARTICLES; i++) {
      mesh.setMatrixAt(i, _hidden);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  useEffect(() => {
    return useGameStore.subscribe((s) => {
      const now = s.gameState;
      const was = prevGs.current;
      if (was === 'casting' && now === 'waiting') {
        spawnParticles(new Vector3(0, 0, castTargetLandZRef.current), 15);
      }
      prevGs.current = now;
    });
  }, []);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    for (const batch of drainWaterSplashSpawns()) {
      spawnParticles(batch.origin, batch.count);
    }

    const list = particles.current;

    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i]!;
      p.life -= p.decay;
      p.position.add(p.velocity);
      p.velocity.y -= 0.02;
      p.rotX += 0.1;
      p.rotY += 0.1;

      if (p.life <= 0 || p.position.y < -2) {
        mesh.setMatrixAt(p.slot, _hidden);
        usedSlots.current.delete(p.slot);
        list.splice(i, 1);
      } else {
        _dummy.position.copy(p.position);
        _dummy.rotation.set(p.rotX, p.rotY, 0);
        const s = p.life * 0.5;
        _dummy.scale.setScalar(s);
        _dummy.updateMatrix();
        mesh.setMatrixAt(p.slot, _dummy.matrix);
      }
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  if (reducedMotion) return null;

  return (
    <instancedMesh ref={meshRef} args={[GEO, MAT, MAX_PARTICLES]} frustumCulled={false} />
  );
}
