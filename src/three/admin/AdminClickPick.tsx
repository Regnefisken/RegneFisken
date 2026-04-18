import { useEffect, useMemo } from 'react';
import { Raycaster, Vector2 } from 'three';
import { useThree } from '@react-three/fiber';

import { useAdminStore } from '../../store/useAdminStore.js';
import { isClickPickSkipped } from '../logic/groundSnapRaycast.js';

const _ndc = new Vector2();

/**
 * Dev: museklik → raycast fra kamera, første brugbare træf.
 * Med free-roam: **Alt+klik** for pick uden at bruge første klik til pointer lock; ellers klik når musen allerede er låst.
 * Aktiv kun når admin-panelet er åbent og `clickPickEnabled` er sand — ellers ingen lyttere.
 */
export function AdminClickPick() {
  const { scene, camera, gl } = useThree();
  const raycaster = useMemo(() => new Raycaster(), []);

  const enabled = useAdminStore((s) => s.clickPickEnabled && s.isOpen);

  useEffect(() => {
    if (!enabled) return;

    const el = gl.domElement;

    const onClick = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const pointerLocked = document.pointerLockElement === el;
      const allowPick = e.altKey || pointerLocked;
      if (!allowPick) return;

      const rect = el.getBoundingClientRect();
      _ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(_ndc, camera);
      raycaster.far = 500;
      const hits = raycaster.intersectObjects(scene.children, true);
      const includeWater = useAdminStore.getState().clickPickIncludeWater;
      for (const h of hits) {
        if (isClickPickSkipped(h.object, includeWater)) continue;
        const p = h.point;
        useAdminStore.getState().setPickedCoords({
          x: Number(p.x.toFixed(2)),
          y: Number(p.y.toFixed(2)),
          z: Number(p.z.toFixed(2)),
        });
        break;
      }
    };

    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [enabled, scene, camera, gl, raycaster]);

  return null;
}
