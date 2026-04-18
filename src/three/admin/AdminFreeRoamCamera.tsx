import { useEffect, useMemo, useRef } from 'react';
import { Euler, Raycaster, Vector3 } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useAdminStore } from '../../store/useAdminStore.js';
import { raycastGroundSurfaceY } from '../logic/groundSnapRaycast.js';

const COORDS_THROTTLE_MS = 100;
/** Øjenhøjde over raycast-træfpunkt (samme skala som scene). */
const FREE_ROAM_EYE_HEIGHT = 1.72;

function isTypingTarget(el: EventTarget | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return el.isContentEditable;
}

/**
 * Dev-only: free-roam — fly (standard) eller jordlås (WASD på plan, Y fra raycast).
 * Space/Q flyver lodret kun når jordlås er fra.
 */
export function AdminFreeRoamCamera() {
  const { camera, gl, scene } = useThree();
  const keys = useRef<Set<string>>(new Set());
  const euler = useRef(new Euler(0, 0, 0, 'YXZ'));
  const lastCoordsWrite = useRef(0);
  const eulerSynced = useRef(false);
  const raycaster = useMemo(() => new Raycaster(), []);
  const forwardH = useRef(new Vector3());
  const rightH = useRef(new Vector3());

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      const k = e.code === 'Space' ? 'Space' : e.code;
      keys.current.add(k);
      if (e.code === 'Space') e.preventDefault();
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.current.add('Shift');
    };
    const up = (e: KeyboardEvent) => {
      const k = e.code === 'Space' ? 'Space' : e.code;
      keys.current.delete(k);
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        keys.current.delete('Shift');
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useEffect(() => {
    const el = gl.domElement;
    const onClick = () => {
      if (document.pointerLockElement !== el) void el.requestPointerLock();
    };
    const onMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== el) return;
      const sens = 0.002;
      euler.current.y -= e.movementX * sens;
      euler.current.x -= e.movementY * sens;
      const limit = Math.PI / 2 - 0.05;
      euler.current.x = Math.max(-limit, Math.min(limit, euler.current.x));
    };
    el.addEventListener('click', onClick);
    el.addEventListener('mousemove', onMove);
    return () => {
      el.removeEventListener('click', onClick);
      el.removeEventListener('mousemove', onMove);
    };
  }, [gl]);

  useFrame((_, delta) => {
    if (!eulerSynced.current) {
      eulerSynced.current = true;
      euler.current.setFromQuaternion(camera.quaternion, 'YXZ');
    }
    camera.quaternion.setFromEuler(euler.current);

    const shift = keys.current.has('ShiftLeft') || keys.current.has('ShiftRight') || keys.current.has('Shift');
    const speed = shift ? 30 : 10;

    const groundLock = useAdminStore.getState().freeRoamGroundLock;

    if (groundLock) {
      const y = euler.current.y;
      forwardH.current.set(-Math.sin(y), 0, -Math.cos(y));
      rightH.current.set(Math.cos(y), 0, -Math.sin(y));
      if (keys.current.has('KeyW')) camera.position.addScaledVector(forwardH.current, speed * delta);
      if (keys.current.has('KeyS')) camera.position.addScaledVector(forwardH.current, -speed * delta);
      if (keys.current.has('KeyA')) camera.position.addScaledVector(rightH.current, -speed * delta);
      if (keys.current.has('KeyD')) camera.position.addScaledVector(rightH.current, speed * delta);
      const surfaceY = raycastGroundSurfaceY(scene, raycaster, camera.position.x, camera.position.z);
      if (surfaceY !== null) {
        camera.position.y = surfaceY + FREE_ROAM_EYE_HEIGHT;
      }
    } else {
      const forward = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
      const right = new Vector3(1, 0, 0).applyQuaternion(camera.quaternion).normalize();

      if (keys.current.has('KeyW')) camera.position.addScaledVector(forward, speed * delta);
      if (keys.current.has('KeyS')) camera.position.addScaledVector(forward, -speed * delta);
      if (keys.current.has('KeyA')) camera.position.addScaledVector(right, -speed * delta);
      if (keys.current.has('KeyD')) camera.position.addScaledVector(right, speed * delta);
      if (keys.current.has('Space')) camera.position.y += speed * delta;
      if (keys.current.has('KeyQ')) camera.position.y -= speed * delta;
    }

    const now = performance.now();
    if (now - lastCoordsWrite.current >= COORDS_THROTTLE_MS) {
      lastCoordsWrite.current = now;
      useAdminStore.getState().setCoords({
        x: Number(camera.position.x.toFixed(2)),
        y: Number(camera.position.y.toFixed(2)),
        z: Number(camera.position.z.toFixed(2)),
      });
    }
  });

  return null;
}
