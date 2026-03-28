import type { Object3D } from 'three';

/** Dør-gruppe til raycast (ramme + dør + håndtag) — sættes fra `FishingCabin`. */
export const cabinDoorHitRef: { current: Object3D | null } = { current: null };
