import { useEffect, useRef } from 'react';
import { Euler, Raycaster, Vector2 } from 'three';
import type { Object3D } from 'three';
import { useFrame, useThree } from '@react-three/fiber';

import { ensureAmbienceStarted, playSoundEffect } from '../../audio/audioEngine.js';
import { useAdminStore } from '../../store/useAdminStore.js';
import { useCollectionStore } from '../../store/useCollectionStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import { JUNGLE_PIER_ANCHOR_Z } from './JunglePier.js';

const EYE_HEIGHT = 1.55;
const MOVE_SPEED = 4;
const SPRINT_SPEED = 7;
const GRAVITY = -15;
const JUMP_V = 5;
const PITCH_MIN = -1.344;
const PITCH_MAX = 0.855;
const MOUSE_SENS = 0.002;

const ISLAND_CX = 0;
const ISLAND_CZ = 14;
const ISLAND_R = 13.2;

const SPAWN = { x: -0.01, y: 2.25, z: -9.48 } as const;
const LOOK_AT = { x: 0, y: 0, z: 14 } as const;

const ISLAND_LIFT = 0.12;
const HILL_TOP_Y = 0.325;

/** Samme som `terrainYAt` i `JungleIsland` (local y før lift). */
function terrainLocalY(x: number, z: number): number {
  const dx = x;
  const dz = z - ISLAND_CZ;
  const d = Math.sqrt(dx * dx + dz * dz);
  if (d < 5.5) {
    const t = d / 5.5;
    return HILL_TOP_Y * (1 - t) + 0.08 * t;
  }
  if (d < 9.35) return 0.06;
  if (d < 12.1) return 0.02;
  return -0.02;
}

const PIER_Z_MIN = JUNGLE_PIER_ANCHOR_Z - 1;
const PIER_Z_MAX = JUNGLE_PIER_ANCHOR_Z + 11.2;
const PIER_X_EXTENT = 1.85 * 0.7;
/** Bro-ende → strand: overlap med sandcirkel (centrum z=14) så der ikke er et dødt bånd. */
const PIER_TO_ISLAND_Z_MAX = ISLAND_CZ - ISLAND_R + 0.5;
const PIER_DECK_WORLD_Y = 0.475 * 0.95;

function isPierToIslandTransition(x: number, z: number): boolean {
  return Math.abs(x) < PIER_X_EXTENT && z >= PIER_Z_MAX && z <= PIER_TO_ISLAND_Z_MAX;
}

function getGroundWorldY(x: number, z: number): number {
  if (Math.abs(x) < PIER_X_EXTENT && z >= PIER_Z_MIN && z <= PIER_Z_MAX) return PIER_DECK_WORLD_Y;
  if (isPierToIslandTransition(x, z)) return terrainLocalY(x, z) + ISLAND_LIFT;
  const dx = x - ISLAND_CX;
  const dz = z - ISLAND_CZ;
  if (dx * dx + dz * dz <= ISLAND_R * ISLAND_R) return terrainLocalY(x, z) + ISLAND_LIFT;
  return PIER_DECK_WORLD_Y;
}

function isWalkable(x: number, z: number): boolean {
  if (Math.abs(x) < PIER_X_EXTENT && z >= PIER_Z_MIN && z <= PIER_Z_MAX) return true;
  if (isPierToIslandTransition(x, z)) return true;
  const dx = x - ISLAND_CX;
  const dz = z - ISLAND_CZ;
  return dx * dx + dz * dz < ISLAND_R * ISLAND_R;
}

/** TRIN 7: first-person på jungleøen — WASD, mus, hop, ø-grænse + bro. */
const NDC_CENTER = new Vector2(0, 0);

function jungleNpcTagFromObject(obj: Object3D | null): 'plesio' | 'pirate' | null {
  let o: Object3D | null = obj;
  while (o) {
    const t = o.userData?.jungleNpcClick;
    if (t === 'plesio' || t === 'pirate') return t;
    o = o.parent;
  }
  return null;
}

export function JunglePlayerController() {
  const { camera, gl, scene } = useThree();
  const keysPressed = useRef(new Set<string>());
  const velocityY = useRef(0);
  const jumpConsumed = useRef(false);
  const raycaster = useRef(new Raycaster());
  const skipNextPointerLockClick = useRef(false);
  const freeRoamActive = useAdminStore((s) => s.freeRoamActive);
  const freeRoam = import.meta.env.DEV && freeRoamActive;

  useEffect(() => {
    if (freeRoam) return;
    camera.rotation.order = 'YXZ';
    camera.position.set(SPAWN.x, SPAWN.y, SPAWN.z);
    camera.lookAt(LOOK_AT.x, LOOK_AT.y, LOOK_AT.z);
    camera.rotation.order = 'YXZ';
    const e = new Euler().setFromQuaternion(camera.quaternion, 'YXZ');
    camera.rotation.set(e.x, e.y, 0);

    const el = gl.domElement;

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== el) return;
      camera.rotation.y -= e.movementX * MOUSE_SENS;
      camera.rotation.x -= e.movementY * MOUSE_SENS;
      camera.rotation.x = Math.max(PITCH_MIN, Math.min(PITCH_MAX, camera.rotation.x));
    };

    const onKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    const tryLock = () => {
      if (skipNextPointerLockClick.current) {
        skipNextPointerLockClick.current = false;
        return;
      }
      void el.requestPointerLock();
    };

    /** Ved pointer lock er musen skjult; R3F-pointer rammer ikke — raycast fra skærmens midte (sigtekorn). */
    const onMouseDown = (e: MouseEvent) => {
      if (document.pointerLockElement !== el || e.button !== 0) return;
      raycaster.current.setFromCamera(NDC_CENTER, camera);
      const hits = raycaster.current.intersectObjects(scene.children, true);
      for (const hit of hits) {
        const tag = jungleNpcTagFromObject(hit.object);
        if (!tag) continue;
        skipNextPointerLockClick.current = true;
        document.exitPointerLock();
        ensureAmbienceStarted();
        playSoundEffect('ui');
        if (tag === 'plesio') {
          useCollectionStore.getState().setShowJunglePlesioNPC(true);
        } else {
          useUIStore.getState().setShowJunglePirateDialog(true);
        }
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('click', tryLock);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('click', tryLock);
      if (document.pointerLockElement === el) {
        document.exitPointerLock();
      }
    };
  }, [camera, gl, scene, freeRoam]);

  useFrame((_, delta) => {
    if (freeRoam) return;
    const keys = keysPressed.current;
    const yaw = camera.rotation.y;

    let mx = 0;
    let mz = 0;
    if (keys.has('w')) {
      mx += -Math.sin(yaw);
      mz += -Math.cos(yaw);
    }
    if (keys.has('s')) {
      mx -= -Math.sin(yaw);
      mz -= -Math.cos(yaw);
    }
    if (keys.has('a')) {
      mx += -Math.cos(yaw);
      mz += Math.sin(yaw);
    }
    if (keys.has('d')) {
      mx -= -Math.cos(yaw);
      mz -= Math.sin(yaw);
    }
    const hLen = Math.hypot(mx, mz);
    if (hLen > 1e-6) {
      mx /= hLen;
      mz /= hLen;
      const sprinting = keys.has('shift');
      const speed = sprinting ? SPRINT_SPEED : MOVE_SPEED;
      const nx = camera.position.x + mx * speed * delta;
      const nz = camera.position.z + mz * speed * delta;
      if (isWalkable(nx, nz)) {
        camera.position.x = nx;
        camera.position.z = nz;
      } else {
        if (isWalkable(nx, camera.position.z)) camera.position.x = nx;
        else if (isWalkable(camera.position.x, nz)) camera.position.z = nz;
      }
    }

    const ground = getGroundWorldY(camera.position.x, camera.position.z);
    const standY = ground + EYE_HEIGHT;

    if (!keys.has(' ')) jumpConsumed.current = false;

    const onGround =
      velocityY.current <= 0 && camera.position.y <= standY + 0.06;
    if (onGround && keys.has(' ') && !jumpConsumed.current) {
      velocityY.current = JUMP_V;
      jumpConsumed.current = true;
    }

    if (velocityY.current > 0.01 || camera.position.y > standY + 0.02) {
      velocityY.current += GRAVITY * delta;
      camera.position.y += velocityY.current * delta;
      if (camera.position.y <= standY) {
        camera.position.y = standY;
        velocityY.current = 0;
      }
    } else {
      camera.position.y = standY;
      velocityY.current = 0;
    }
  });

  return null;
}
