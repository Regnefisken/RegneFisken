import { useEffect, useRef } from 'react';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import { ensureAmbienceStarted, playSoundEffect } from '../../audio/audioEngine.js';
import { useGameStore } from '../../store/useGameStore.js';
import { usePlayerStore } from '../../store/usePlayerStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import {
  resetSoeuhyreCaughtThisVisit,
  soeUhyreCaughtThisVisit,
} from '../soeuhyre-ambient-flags.js';
import { Soeuhyre } from './Soeuhyre.js';

type SuState = 'submerged' | 'surfacing' | 'surface' | 'diving';

const SURFACE_Y = 0.2;
const DIVE_BOTTOM = -8;
const BASE_ROT_Y = Math.PI * 0.12;

/** Legacy `tickScene` Søuhyre ambient: surface/dive cycle, pause under fishing combat. */
export function SoeuhyreAmbient() {
  const rootRef = useRef<Group>(null);
  const stateRef = useRef<SuState>('submerged');
  const nextActionRef = useRef(0);
  const frozenRemRef = useRef<number | null>(null);
  const toastShownRef = useRef(false);
  const seededRef = useRef(false);
  const diveAngleRef = useRef(0);
  const spawnRef = useRef<{ x: number; z: number } | null>(null);

  const locationOk = useGameStore((s) => s.currentLocation === 'desert_lake');
  const soeuhyreDefeated = usePlayerStore((s) => s.soeuhyreDefeated);

  useEffect(() => {
    if (!locationOk) {
      resetSoeuhyreCaughtThisVisit();
      seededRef.current = false;
      spawnRef.current = null;
      stateRef.current = 'submerged';
      toastShownRef.current = false;
      nextActionRef.current = 0;
      frozenRemRef.current = null;
    }
  }, [locationOk]);

  useFrame(({ clock }) => {
    if (!locationOk || soeuhyreDefeated || soeUhyreCaughtThisVisit) return;
    const g = rootRef.current;
    if (!g) return;

    const time = clock.elapsedTime;

    if (!spawnRef.current) {
      spawnRef.current = {
        x: (Math.random() - 0.5) * 4,
        z: -3.2 + (Math.random() - 0.5) * 2,
      };
    }

    if (!seededRef.current) {
      seededRef.current = true;
      g.position.set(spawnRef.current.x, DIVE_BOTTOM, spawnRef.current.z);
      g.rotation.y = BASE_ROT_Y;
      nextActionRef.current = time + 5 + Math.random() * 5;
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
      diveAngleRef.current = 0;
      if (time >= nextActionRef.current) {
        stateRef.current = 'surfacing';
      }
    } else if (st === 'surfacing') {
      g.position.y += 0.025;
      diveAngleRef.current = Math.max(0, ((SURFACE_Y - g.position.y) / 8.2) * 0.8);
      g.position.x += Math.sin(time * 0.4) * 0.002;
      g.rotation.y = BASE_ROT_Y + Math.sin(time * 0.3) * 0.1;

      if (g.position.y >= SURFACE_Y) {
        g.position.y = SURFACE_Y;
        diveAngleRef.current = 0;
        stateRef.current = 'surface';
        nextActionRef.current = time + 8 + Math.random() * 7;
        if (!toastShownRef.current) {
          toastShownRef.current = true;
          ensureAmbienceStarted();
          playSoundEffect('legendary');
          useUIStore.getState().setToastMessage('🐉 Søuhyret er dukket op i Ørkensøen!');
        }
      }
    } else if (st === 'surface') {
      diveAngleRef.current = 0;
      g.position.x += Math.sin(time * 0.3) * 0.004;
      g.position.z += Math.cos(time * 0.25) * 0.002;
      g.rotation.y = BASE_ROT_Y + Math.sin(time * 0.2) * 0.15;
      g.position.y = SURFACE_Y + Math.sin(time * 1.2) * 0.02;
      g.position.x = Math.max(-7, Math.min(7, g.position.x));
      g.position.z = Math.max(-10, Math.min(-3, g.position.z));

      if (time >= nextActionRef.current) {
        stateRef.current = 'diving';
      }
    } else if (st === 'diving') {
      g.position.y -= 0.018;
      const diveProg = Math.min(1, (SURFACE_Y - g.position.y) / (SURFACE_Y - DIVE_BOTTOM));
      diveAngleRef.current = diveProg * 0.9;
      g.position.x += Math.sin(time * 0.2) * 0.002;
      g.rotation.y = BASE_ROT_Y + Math.sin(time * 0.15) * 0.06;

      if (g.position.y <= DIVE_BOTTOM) {
        g.position.y = DIVE_BOTTOM;
        diveAngleRef.current = 0;
        stateRef.current = 'submerged';
        nextActionRef.current = time + 30 + Math.random() * 15;
      }
    }
  });

  if (!locationOk || soeuhyreDefeated || soeUhyreCaughtThisVisit) return null;

  return (
    <group ref={rootRef} rotation={[0, BASE_ROT_Y, 0]}>
      <Soeuhyre diveAngleRef={diveAngleRef} />
    </group>
  );
}
