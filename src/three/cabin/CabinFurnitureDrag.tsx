import { useEffect, useRef } from 'react';
import { Object3D, Plane, Raycaster, Vector2, Vector3 } from 'three';
import { useThree } from '@react-three/fiber';
import { useAudio } from '../../audio/useAudio.js';
import { LOCATIONS } from '../../data/locations.js';
import { runCabinOverlayFade, runLocationTravel } from '../../logic/cabin-room-travel.js';
import { isCabinLocation } from '../../logic/location-helpers.js';
import { canOpenTravelMenu } from '../../logic/travel-unlock.js';
import { useGameStore } from '../../store/useGameStore.js';
import { usePlayerStore } from '../../store/usePlayerStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import { cabinDoorHitRef, getCabinDoorTarget } from './cabinDoorRef.js';
import { cabinMovableRoots } from './cabinMovablesRef.js';
import { snapshotFurniturePositions } from './cabinFurniturePersistence.js';

function findMovableRoot(hit: Object3D): Object3D | null {
  let obj: Object3D | null = hit;
  while (obj && !obj.userData?.isMovable) obj = obj.parent;
  return obj;
}

function persistMovables() {
  const snap = snapshotFurniturePositions(cabinMovableRoots.current);
  usePlayerStore.getState().setFurniturePositions((prev) => ({ ...prev, ...snap }));
}

function tryOpenTravelFromDoor(play: (id: string) => void) {
  const p = usePlayerStore.getState();
  const ui = useUIStore.getState();
  if (!canOpenTravelMenu(p.progression.level, p.upgrades, p.questItems)) {
    play('error');
    const nextLocked = Object.values(LOCATIONS).find((a) => a.id !== 'pier');
    if (nextLocked) {
      const missingLevel = p.progression.level < nextLocked.unlockLevel;
      ui.setToastMessage(
        missingLevel
          ? `Kræver level ${nextLocked.unlockLevel} for at rejse!`
          : 'Du mangler fiskekort!',
      );
    } else {
      ui.setToastMessage('Du mangler fiskekort!');
    }
    return;
  }
  play('ui');
  ui.setShowNavPicker(true);
}

function updateCabinCursor(
  canvas: HTMLCanvasElement,
  overDoor: boolean,
  furnitureMode: boolean,
  dragging: boolean,
) {
  if (dragging) return;
  if (overDoor) canvas.style.cursor = 'pointer';
  else if (furnitureMode) canvas.style.cursor = 'grab';
  else canvas.style.cursor = 'default';
}

/** Dør-klik → rejsemenu (før møbel-drag) + furniture mode som legacy. */
export function CabinFurnitureDrag() {
  const { play } = useAudio();
  const { gl, camera } = useThree();
  const gameState = useGameStore((s) => s.gameState);
  const locationId = useGameStore((s) => s.currentLocation);
  const furnitureMode = useGameStore((s) => s.furnitureMode);
  const setSelectedFurniture = useGameStore((s) => s.setSelectedFurniture);

  const gameStateRef = useRef(gameState);
  const locationRef = useRef(locationId);
  const furnitureModeRef = useRef(furnitureMode);
  const dragPlane = useRef(new Plane(new Vector3(0, 1, 0), 0));
  const dragOffset = useRef(new Vector3());
  const draggedObjectRef = useRef<Object3D | null>(null);
  const ndc = useRef(new Vector2());
  const raycaster = useRef(new Raycaster());
  const pt = useRef(new Vector3());

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);
  useEffect(() => {
    locationRef.current = locationId;
  }, [locationId]);
  useEffect(() => {
    furnitureModeRef.current = furnitureMode;
  }, [furnitureMode]);

  useEffect(() => {
    if (!isCabinLocation(locationId)) {
      useGameStore.getState().setFurnitureMode(false);
      useGameStore.getState().setSelectedFurniture(null);
    }
  }, [locationId]);

  useEffect(() => {
    const canvas = gl.domElement;

    const getNDC = (e: PointerEvent | TouchEvent) => {
      const touch = 'touches' in e && e.touches[0] ? e.touches[0] : (e as PointerEvent);
      const rect = canvas.getBoundingClientRect();
      ndc.current.set(
        ((touch.clientX - rect.left) / rect.width) * 2 - 1,
        -((touch.clientY - rect.top) / rect.height) * 2 + 1,
      );
    };

    const onDown = (e: PointerEvent | TouchEvent) => {
      if (gameStateRef.current !== 'idle') return;

      if (isCabinLocation(locationRef.current) && cabinDoorHitRef.current) {
        getNDC(e);
        raycaster.current.setFromCamera(ndc.current, camera);
        const doorHits = raycaster.current.intersectObject(cabinDoorHitRef.current, true);
        if (doorHits.length > 0) {
          const target = getCabinDoorTarget(doorHits[0]!.object);
          if (target) {
            play('ui');
            runLocationTravel(target, () => {
              useGameStore.getState().setCurrentLocation(target);
            });
          } else {
            tryOpenTravelFromDoor(play);
          }
          if ('cancelable' in e && e.cancelable) e.preventDefault();
          return;
        }
      }

      /* Hyttens skildpadde → samme modal som vild skildpadde (legacy ~11041–11047). */
      if (
        isCabinLocation(locationRef.current) &&
        !furnitureModeRef.current &&
        gameStateRef.current === 'idle'
      ) {
        const cabinTurtle = cabinMovableRoots.current.find(
          (o) => o.userData?.movableType === 'turtle',
        );
        if (cabinTurtle) {
          getNDC(e);
          raycaster.current.setFromCamera(ndc.current, camera);
          const th = raycaster.current.intersectObject(cabinTurtle, true);
          if (th.length > 0) {
            play('ui');
            useUIStore.getState().setShowWildTurtleModal(true);
            if ('cancelable' in e && e.cancelable) e.preventDefault();
            return;
          }
        }
      }

      if (
        isCabinLocation(locationRef.current) &&
        !furnitureModeRef.current &&
        gameStateRef.current === 'idle'
      ) {
        const cabinAquarium = cabinMovableRoots.current.find(
          (o) => o.userData?.movableType === 'aquarium',
        );
        if (cabinAquarium) {
          getNDC(e);
          raycaster.current.setFromCamera(ndc.current, camera);
          const aq = raycaster.current.intersectObject(cabinAquarium, true);
          if (aq.length > 0) {
            play('ui');
            useGameStore.getState().setShowAquariumGame(true);
            if ('cancelable' in e && e.cancelable) e.preventDefault();
            return;
          }
        }
      }

      if (
        isCabinLocation(locationRef.current) &&
        !furnitureModeRef.current &&
        gameStateRef.current === 'idle'
      ) {
        const p = usePlayerStore.getState();
        const mirror = cabinMovableRoots.current.find((o) => o.userData?.movableType === 'bedroom_mirror');
        if (mirror && p.unlockedFurniture.includes('bedroom_mirror')) {
          getNDC(e);
          raycaster.current.setFromCamera(ndc.current, camera);
          const mh = raycaster.current.intersectObject(mirror, true);
          if (mh.length > 0) {
            play('ui');
            runCabinOverlayFade(() => {
              useUIStore.getState().setShowWardrobeModal(true);
            });
            if ('cancelable' in e && e.cancelable) e.preventDefault();
            return;
          }
        }
        const wardrobe = cabinMovableRoots.current.find(
          (o) => o.userData?.movableType === 'bedroom_wardrobe',
        );
        if (
          wardrobe &&
          p.unlockedFurniture.includes('bedroom_wardrobe') &&
          !p.unlockedFurniture.includes('bedroom_mirror')
        ) {
          getNDC(e);
          raycaster.current.setFromCamera(ndc.current, camera);
          const wh = raycaster.current.intersectObject(wardrobe, true);
          if (wh.length > 0) {
            play('ui');
            useUIStore.getState().setToastMessage(
              'Brug gulvspejlet i hytten (eller køb det i butikken) for at åbne avataren.',
            );
            if ('cancelable' in e && e.cancelable) e.preventDefault();
            return;
          }
        }
      }

      if (!furnitureModeRef.current) return;
      if (!isCabinLocation(locationRef.current)) return;
      getNDC(e);
      raycaster.current.setFromCamera(ndc.current, camera);
      const objs = cabinMovableRoots.current;
      const hits = objs.length ? raycaster.current.intersectObjects(objs, true) : [];
      if (!hits.length) {
        setSelectedFurniture(null);
        return;
      }
      const root = findMovableRoot(hits[0]!.object);
      if (!root) return;
      draggedObjectRef.current = root;
      dragPlane.current.constant = -root.position.y;
      const type = root.userData.movableType as string | undefined;
      if (type) setSelectedFurniture(type);
      persistMovables();
      if (raycaster.current.ray.intersectPlane(dragPlane.current, pt.current)) {
        dragOffset.current.copy(pt.current).sub(root.position);
      }
      canvas.style.cursor = 'grabbing';
      if ('cancelable' in e && e.cancelable) e.preventDefault();
    };

    const onWheel = (e: WheelEvent) => {
      if (gameStateRef.current !== 'idle') return;
      if (!furnitureModeRef.current) return;
      if (!isCabinLocation(locationRef.current)) return;
      const selected = useGameStore.getState().selectedFurniture;
      const target =
        draggedObjectRef.current ||
        (selected
          ? cabinMovableRoots.current.find((o) => o.userData?.movableType === selected)
          : null);
      if (target) {
        target.rotation.y += e.deltaY * 0.003;
        persistMovables();
      }
    };

    const onMove = (e: PointerEvent | TouchEvent) => {
      if (gameStateRef.current !== 'idle') return;

      const dragging = !!draggedObjectRef.current;
      if (
        !dragging &&
        isCabinLocation(locationRef.current) &&
        cabinDoorHitRef.current
      ) {
        getNDC(e);
        raycaster.current.setFromCamera(ndc.current, camera);
        const overDoor =
          raycaster.current.intersectObject(cabinDoorHitRef.current, true).length > 0;
        updateCabinCursor(canvas, overDoor, furnitureModeRef.current, false);
      }

      const obj = draggedObjectRef.current;
      if (!obj) return;
      getNDC(e);
      raycaster.current.setFromCamera(ndc.current, camera);
      if (!raycaster.current.ray.intersectPlane(dragPlane.current, pt.current)) return;
      const newX = Math.max(-5.4, Math.min(5.4, pt.current.x - dragOffset.current.x));
      const newZ = Math.max(-4.6, Math.min(3.5, pt.current.z - dragOffset.current.z));
      obj.position.x = newX;
      obj.position.z = newZ;
      if ('cancelable' in e && e.cancelable) e.preventDefault();
    };

    const finishDrag = () => {
      if (draggedObjectRef.current) {
        draggedObjectRef.current = null;
        persistMovables();
      }
    };

    const refreshCabinCursor = () => {
      if (!isCabinLocation(locationRef.current) || gameStateRef.current !== 'idle') {
        canvas.style.cursor = 'default';
        return;
      }
      if (!cabinDoorHitRef.current) {
        updateCabinCursor(canvas, false, furnitureModeRef.current, false);
        return;
      }
      raycaster.current.setFromCamera(ndc.current, camera);
      const overDoor =
        raycaster.current.intersectObject(cabinDoorHitRef.current, true).length > 0;
      updateCabinCursor(canvas, overDoor, furnitureModeRef.current, false);
    };

    const onUp = () => {
      finishDrag();
      refreshCabinCursor();
    };

    const onLeave = () => {
      finishDrag();
      if (isCabinLocation(locationRef.current)) {
        updateCabinCursor(canvas, false, furnitureModeRef.current, false);
      } else {
        canvas.style.cursor = 'default';
      }
    };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('touchstart', onDown, { passive: false });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    canvas.addEventListener('touchend', onUp);
    canvas.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('touchstart', onDown);
      canvas.removeEventListener('touchmove', onMove);
      canvas.removeEventListener('touchend', onUp);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [gl, camera, setSelectedFurniture, play]);

  useEffect(() => {
    const canvas = gl.domElement;
    if (!isCabinLocation(locationId) || gameState !== 'idle') {
      canvas.style.cursor = 'default';
      return;
    }
    if (!draggedObjectRef.current) {
      updateCabinCursor(canvas, false, furnitureMode, false);
    }
  }, [gl, locationId, furnitureMode, gameState]);

  return null;
}
