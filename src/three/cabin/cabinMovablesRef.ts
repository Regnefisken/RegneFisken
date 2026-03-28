import type { Object3D } from 'three';

/** Deler flytbare hytte-objekter mellem `FishingCabin` (opdaterer) og drag/UI (læser). */
export const cabinMovableRoots: { current: Object3D[] } = { current: [] };
