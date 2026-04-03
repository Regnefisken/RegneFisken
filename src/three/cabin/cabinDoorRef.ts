import type { Object3D } from 'three';

/** Alle dør-grupper til raycast (ramme + dør + håndtag) — sættes fra hytte-rum. */
export const cabinDoorHitRef: { current: Object3D | null } = { current: null };

/** Første forælder med `userData.doorTarget` (lokations-id ved klik). */
export function getCabinDoorTarget(hitObject: Object3D): string | null {
  let o: Object3D | null = hitObject;
  while (o) {
    const t = o.userData?.doorTarget;
    if (typeof t === 'string' && t.length > 0) return t;
    o = o.parent;
  }
  return null;
}
