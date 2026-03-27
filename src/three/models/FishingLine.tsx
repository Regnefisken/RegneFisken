import type { RefObject } from 'react';
import { useRef } from 'react';
import {
  CatmullRomCurve3,
  DoubleSide,
  Mesh,
  Object3D,
  TubeGeometry,
  Vector3,
} from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/useGameStore.js';

const tipWorld = new Vector3();
const endWorld = new Vector3();

/** Dynamisk snøre (CatmullRom + Tube) — porteret fra legacy `updateFishingLine`. */
export function FishingLine({
  rodTipRef,
  lineEndRef,
}: {
  rodTipRef: RefObject<Object3D | null>;
  lineEndRef: RefObject<Object3D | null>;
}) {
  const meshRef = useRef<Mesh>(null);
  const gameState = useGameStore((s) => s.gameState);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    const tip = rodTipRef.current;
    const end = lineEndRef.current;
    const show =
      gameState === 'casting' ||
      gameState === 'waiting' ||
      gameState === 'biting' ||
      gameState === 'fighting';

    if (!mesh || !tip || !end || !show) {
      if (mesh) mesh.visible = false;
      return;
    }

    mesh.visible = true;
    tip.getWorldPosition(tipWorld);
    end.getWorldPosition(endWorld);

    const time = clock.elapsedTime;
    const N = 5;
    const casting = gameState === 'casting';
    const inWater = gameState === 'waiting' || gameState === 'biting' || gameState === 'fighting';
    const sag = casting ? 0.7 : 0.25;
    const pts: Vector3[] = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const x = tipWorld.x + (endWorld.x - tipWorld.x) * u;
      let y = tipWorld.y + (endWorld.y - tipWorld.y) * u;
      const z = tipWorld.z + (endWorld.z - tipWorld.z) * u;
      const droop = 4 * sag * u * (1 - u);
      y -= droop;
      if (inWater && i > 0 && i < N) y += Math.sin(time * 1.5 + i * 1.2) * 0.06;
      pts.push(new Vector3(x, y, z));
    }

    const curve = new CatmullRomCurve3(pts, false, 'catmullrom', 0.3);
    const nextGeo = new TubeGeometry(curve, 32, 0.005, 6, false);
    const old = mesh.geometry;
    mesh.geometry = nextGeo;
    old.dispose();
  });

  return (
    <mesh ref={meshRef} frustumCulled={false}>
      <tubeGeometry args={[new CatmullRomCurve3([new Vector3(0, -10, 0), new Vector3(0, -10, 0.01)]), 8, 0.005, 6, false]} />
      <meshPhongMaterial
        color={0xccccdd}
        transparent
        opacity={0.82}
        specular={0x555555}
        shininess={80}
        depthWrite={false}
        side={DoubleSide}
      />
    </mesh>
  );
}
