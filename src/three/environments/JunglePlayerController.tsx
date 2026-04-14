import { useEffect, useRef } from 'react';
import { Euler, Raycaster, Vector2 } from 'three';
import type { Object3D } from 'three';
import { useFrame, useThree } from '@react-three/fiber';

import { ensureAmbienceStarted, playSoundEffect } from '../../audio/audioEngine.js';
import { useAdminStore } from '../../store/useAdminStore.js';
import { useCollectionStore } from '../../store/useCollectionStore.js';
import { TRAVEL_FADE_MS } from '../../logic/cabin-room-travel.js';
import { useGameStore } from '../../store/useGameStore.js';
import { JUNGLE_CHEST_OPENED_QUEST } from '../../logic/jungle-chest-reveal.js';
import { usePlayerStore } from '../../store/usePlayerStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import { requestGameCanvasPointerLock } from '../../utils/requestGameCanvasPointerLock.js';
import { jungleTouchInput, resetJungleTouchInput } from '../jungleTouchInput.js';
import { JUNGLE_PIER_ANCHOR_Z } from './JunglePier.js';
import {
  HILL_TOP_Y,
  ISLAND_LIFT,
  ISLAND_Z,
  JUNGLE_FISH_BUCKET_X,
  JUNGLE_FISH_BUCKET_Z,
  JUNGLE_FISH_INTERACT_R,
  terrainYAt,
} from './jungleTerrain.js';

function runJungleFishingFade(onMidpoint: () => void, onFadeInComplete?: () => void): void {
  const ui = useUIStore.getState();
  if (ui.reducedMotion) {
    onMidpoint();
    onFadeInComplete?.();
    return;
  }
  const setOp = ui.setCabinRoomFadeOpacity;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setOp(1);
      window.setTimeout(() => {
        onMidpoint();
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setOp(0);
            onFadeInComplete?.();
          });
        });
      }, TRAVEL_FADE_MS);
    });
  });
}

const EYE_HEIGHT = 1.55;
const MOVE_SPEED = 4;
const SPRINT_SPEED = 7;
const GRAVITY = -15;
const JUMP_V = 5;
const PITCH_MIN = -1.344;
const PITCH_MAX = 0.855;
const MOUSE_SENS = 0.002;
const TOUCH_SENS = 0.003;

const ISLAND_CX = 0;
const ISLAND_CZ = ISLAND_Z;
const ISLAND_R = 26.4;

const SPAWN = { x: -0.01, y: 2.25, z: -23.23 } as const;
const LOOK_AT = { x: 0, y: 0, z: 14 } as const;

const LOCKED_CHEST_X = -1.5;
const LOCKED_CHEST_Z = 36;
const LOCKED_CHEST_INTERACT_R = 4;

/** Samme som `terrainYAt` i `jungleTerrain.ts` (local y før lift). */
function terrainLocalY(x: number, z: number): number {
  return terrainYAt(x, z, HILL_TOP_Y);
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
const ndcPointerScratch = new Vector2(0, 0);

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
  const savedCamPos = useRef({ x: 0, y: 0, z: 0 });
  const savedCamRot = useRef({ x: 0, y: 0 });
  const prevNearJungleBucket = useRef(false);
  const prevJungleFishing = useRef(false);
  /** Første kiste-åbning: toast skal vises før modal (toast ligger under modal i z-index). */
  const jungleChestModalDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tryEnterJungleFishing = useRef<() => boolean>(() => false);
  const tryExitJungleFishing = useRef<() => boolean>(() => false);
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

    const onMouseMove = (ev: MouseEvent) => {
      if (useGameStore.getState().jungleFishing) return;
      if (document.pointerLockElement !== el) return;
      camera.rotation.y -= ev.movementX * MOUSE_SENS;
      camera.rotation.x -= ev.movementY * MOUSE_SENS;
      camera.rotation.x = Math.max(PITCH_MIN, Math.min(PITCH_MAX, camera.rotation.x));
    };

    tryEnterJungleFishing.current = (): boolean => {
      const gs = useGameStore.getState();
      if (gs.jungleFishing || gs.gameState !== 'idle') return false;
      const dx = camera.position.x - JUNGLE_FISH_BUCKET_X;
      const dz = camera.position.z - JUNGLE_FISH_BUCKET_Z;
      if (Math.hypot(dx, dz) >= JUNGLE_FISH_INTERACT_R) return false;
      useGameStore.getState().setJungleParasolVisible(false);
      savedCamPos.current = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
      };
      savedCamRot.current = { x: camera.rotation.x, y: camera.rotation.y };
      document.exitPointerLock();
      skipNextPointerLockClick.current = true;
      runJungleFishingFade(() => {
        document.exitPointerLock();
        skipNextPointerLockClick.current = true;
        useGameStore.getState().setJungleFishing(true);
        useGameStore.getState().setGameState('idle');
      });
      return true;
    };

    tryExitJungleFishing.current = (): boolean => {
      const gs = useGameStore.getState();
      if (!gs.jungleFishing || gs.gameState !== 'idle') return false;
      runJungleFishingFade(
        () => {
          useGameStore.getState().setJungleFishing(false);
          useGameStore.getState().setJungleParasolVisible(true);
          useGameStore.getState().setGameState('idle');
          camera.rotation.order = 'YXZ';
          camera.position.set(
            savedCamPos.current.x,
            savedCamPos.current.y,
            savedCamPos.current.z,
          );
          camera.rotation.set(savedCamRot.current.x, savedCamRot.current.y, 0);
        },
        () => {
          if (useUIStore.getState().uiMode !== 'mobile') {
            requestGameCanvasPointerLock();
          }
        },
      );
      return true;
    };

    const onKeyDown = (ev: KeyboardEvent) => {
      const k = ev.key.toLowerCase();

      if (k === 'e') {
        if (tryEnterJungleFishing.current()) ev.preventDefault();
        return;
      }

      if (k === 'q') {
        if (tryExitJungleFishing.current()) ev.preventDefault();
        return;
      }

      keysPressed.current.add(k);
    };
    const onKeyUp = (ev: KeyboardEvent) => {
      keysPressed.current.delete(ev.key.toLowerCase());
    };

    const tryLock = () => {
      if (useUIStore.getState().uiMode === 'mobile') return;
      if (useGameStore.getState().jungleFishing) return;
      if (skipNextPointerLockClick.current) {
        skipNextPointerLockClick.current = false;
        return;
      }
      void el.requestPointerLock();
    };

    /**
     * Desktop: raycast fra midten (pointer lock). Mobil: raycast fra tryk (NDC) — fase 8 touch-audit.
     */
    const onPointerDown = (ev: PointerEvent) => {
      if (useGameStore.getState().jungleFishing) return;
      if (ev.button !== 0) return;
      const mobile = useUIStore.getState().uiMode === 'mobile';
      if (mobile) {
        const rect = gl.domElement.getBoundingClientRect();
        ndcPointerScratch.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
        ndcPointerScratch.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.current.setFromCamera(ndcPointerScratch, camera);
      } else {
        if (document.pointerLockElement !== el) return;
        raycaster.current.setFromCamera(NDC_CENTER, camera);
      }
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
        ev.preventDefault();
        ev.stopPropagation();
        return;
      }
      {
        const dx = camera.position.x - LOCKED_CHEST_X;
        const dz = camera.position.z - LOCKED_CHEST_Z;
        if (dx * dx + dz * dz < LOCKED_CHEST_INTERACT_R * LOCKED_CHEST_INTERACT_R) {
          const yaw = camera.rotation.y;
          const fwdX = -Math.sin(yaw);
          const fwdZ = -Math.cos(yaw);
          const toLen = Math.hypot(dx, dz);
          if (toLen > 0.01 && (fwdX * -dx + fwdZ * -dz) / toLen > 0.5) {
            ensureAmbienceStarted();
            playSoundEffect('ui');
            const questItems = usePlayerStore.getState().questItems;
            const hasJungleKey = questItems.includes('jungle_chest_key');
            const chestAlreadyOpened = questItems.includes(JUNGLE_CHEST_OPENED_QUEST);
            const ui = useUIStore.getState();
            if (!hasJungleKey) {
              ui.setToastMessage(
                'ØV...! Kisten er låst! Hvis bare du havde en nøgle der passede!',
              );
            } else if (!chestAlreadyOpened) {
              document.exitPointerLock();
              ui.setToastMessage(
                'Nøglen glider i låsen… noget indeni har ventet på dig.',
              );
              if (jungleChestModalDelayTimerRef.current) {
                clearTimeout(jungleChestModalDelayTimerRef.current);
                jungleChestModalDelayTimerRef.current = null;
              }
              jungleChestModalDelayTimerRef.current = setTimeout(() => {
                jungleChestModalDelayTimerRef.current = null;
                useUIStore.getState().setShowJungleChestParchmentModal(true);
              }, 2600);
            } else {
              ui.setToastMessage(
                'Kisten er tom, men du bærer stadig havfruens hemmelighed med dig.',
              );
            }
            ev.preventDefault();
            ev.stopPropagation();
            return;
          }
        }
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('click', tryLock);

    return () => {
      if (jungleChestModalDelayTimerRef.current) {
        clearTimeout(jungleChestModalDelayTimerRef.current);
        jungleChestModalDelayTimerRef.current = null;
      }
      resetJungleTouchInput();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('click', tryLock);
      if (document.pointerLockElement === el) {
        document.exitPointerLock();
      }
    };
  }, [camera, gl, scene, freeRoam]);

  useFrame((_, delta) => {
    if (freeRoam) return;
    let gs = useGameStore.getState();

    const req = gs.jungleFishRequest;
    if (req === 'enter') {
      useGameStore.getState().setJungleFishRequest(null);
      tryEnterJungleFishing.current();
    } else if (req === 'exit') {
      useGameStore.getState().setJungleFishRequest(null);
      tryExitJungleFishing.current();
    }
    gs = useGameStore.getState();

    if (gs.jungleFishing && !prevJungleFishing.current) {
      document.exitPointerLock();
      skipNextPointerLockClick.current = true;
    }
    prevJungleFishing.current = gs.jungleFishing;

    if (!gs.jungleFishing) {
      const near =
        Math.hypot(camera.position.x - JUNGLE_FISH_BUCKET_X, camera.position.z - JUNGLE_FISH_BUCKET_Z) <
        JUNGLE_FISH_INTERACT_R;
      if (near !== prevNearJungleBucket.current) {
        prevNearJungleBucket.current = near;
        useGameStore.getState().setNearJungleBucket(near);
      }
    } else if (prevNearJungleBucket.current) {
      prevNearJungleBucket.current = false;
      useGameStore.getState().setNearJungleBucket(false);
    }

    if (gs.jungleFishing) return;

    const li = jungleTouchInput.look;
    if (li.dx !== 0 || li.dy !== 0) {
      camera.rotation.y -= li.dx * TOUCH_SENS;
      camera.rotation.x -= li.dy * TOUCH_SENS;
      camera.rotation.x = Math.max(PITCH_MIN, Math.min(PITCH_MAX, camera.rotation.x));
      li.dx = 0;
      li.dy = 0;
    }

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
    let hLen = Math.hypot(mx, mz);
    if (hLen > 1e-6) {
      mx /= hLen;
      mz /= hLen;
    } else {
      const jx = jungleTouchInput.move.x;
      const jy = jungleTouchInput.move.y;
      if (Math.hypot(jx, jy) > 0.08) {
        mx = -Math.sin(yaw) * jy - Math.cos(yaw) * jx;
        mz = -Math.cos(yaw) * jy + Math.sin(yaw) * jx;
        hLen = Math.hypot(mx, mz);
        if (hLen > 1e-6) {
          mx /= hLen;
          mz /= hLen;
        }
      }
    }
    if (hLen > 1e-6) {
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
