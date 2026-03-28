import { useEffect, useRef } from 'react';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../store/useGameStore.js';
import { usePlayerStore } from '../store/usePlayerStore.js';
import { Kraken } from './models/Kraken.js';

type AkState = 'submerged' | 'surfacing' | 'surface' | 'diving';

const SURFACE_Y = -0.5;
const DIVE_BOTTOM = -10;
const BASE_ROT = Math.PI * -0.45;

/** Baggrunds-Kraken på Den Forbudte Sø — legacy `createAmbientKrakenMesh` + surface/dive-logik. */
export function AmbientKraken() {
  const rootRef = useRef<Group>(null);
  const stateRef = useRef<AkState>('submerged');
  const nextActionRef = useRef(0);
  const frozenRemRef = useRef<number | null>(null);
  const seededRef = useRef(false);

  const locationOk = useGameStore((s) => s.currentLocation === 'forbidden');
  const krakenDefeated = usePlayerStore((s) => s.krakenDefeated);

  const prevLocOk = useRef(locationOk);
  useEffect(() => {
    if (prevLocOk.current && !locationOk) {
      seededRef.current = false;
      stateRef.current = 'submerged';
      frozenRemRef.current = null;
      nextActionRef.current = 0;
    }
    prevLocOk.current = locationOk;
  }, [locationOk]);

  useFrame(({ clock }) => {
    if (!locationOk || krakenDefeated) return;
    const g = rootRef.current;
    if (!g) return;

    const time = clock.elapsedTime;
    if (!seededRef.current) {
      seededRef.current = true;
      nextActionRef.current = time + 8 + Math.random() * 12;
    }

    const gameState = useGameStore.getState().gameState;
    const busy =
      gameState === 'fighting' ||
      gameState === 'catch' ||
      gameState === 'biting' ||
      gameState === 'casting' ||
      gameState === 'waiting';

    if (busy) {
      if (nextActionRef.current > 0 && nextActionRef.current < time + 9999) {
        frozenRemRef.current = nextActionRef.current - time;
      }
      return;
    }

    if (frozenRemRef.current != null) {
      nextActionRef.current = time + Math.max(1, frozenRemRef.current);
      frozenRemRef.current = null;
    }

    const st = stateRef.current;
    if (st === 'submerged') {
      if (time >= nextActionRef.current) {
        stateRef.current = 'surfacing';
      }
    } else if (st === 'surfacing') {
      g.position.y += 0.03;
      g.position.x += Math.sin(time * 0.3) * 0.003;
      g.rotation.y = BASE_ROT + Math.sin(time * 0.25) * 0.12;
      if (g.position.y >= SURFACE_Y) {
        g.position.y = SURFACE_Y;
        stateRef.current = 'surface';
        nextActionRef.current = time + 4 + Math.random() * 3;
      }
    } else if (st === 'surface') {
      g.position.x += Math.sin(time * 0.2) * 0.005;
      g.position.z += Math.cos(time * 0.15) * 0.003;
      g.rotation.y = BASE_ROT + Math.sin(time * 0.18) * 0.18;
      g.position.y = SURFACE_Y + Math.sin(time * 1.0) * 0.15;
      g.position.x = Math.max(-8, Math.min(8, g.position.x));
      g.position.z = Math.max(-40, Math.min(-20, g.position.z));
      if (time >= nextActionRef.current) {
        stateRef.current = 'diving';
      }
    } else if (st === 'diving') {
      g.position.y -= 0.025;
      g.position.x += Math.sin(time * 0.15) * 0.002;
      g.rotation.y = BASE_ROT + Math.sin(time * 0.12) * 0.06;
      if (g.position.y <= DIVE_BOTTOM) {
        g.position.y = DIVE_BOTTOM;
        stateRef.current = 'submerged';
        nextActionRef.current = time + 20 + Math.random() * 8;
      }
    }
  });

  if (!locationOk || krakenDefeated) return null;

  return (
    <group ref={rootRef} position={[0, DIVE_BOTTOM, -30]} rotation={[0, BASE_ROT, 0]}>
      <Kraken />
    </group>
  );
}
