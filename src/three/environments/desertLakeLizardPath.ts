import { Vector3 } from 'three';

/**
 * Waypoints for firbenets rute. X/Z er banen; Y fra free-roam er kun reference og bruges ikke —
 * højde sættes med raycast mod jord/mole/sten i `DesertLakeLizard`.
 */
export const DESERT_LAKE_LIZARD_WAYPOINTS: ReadonlyArray<readonly [number, number, number]> = [
  [-3.04, 1.9, -22.18],
  [-12.47, 1.9, -20.62],
  [-20.94, 1.81, -9.83],
  [-16.31, 2.86, 3.27],
  [-9.13, 1.69, 5.15],
  [-0.65, 2.72, 17.15],
  [8.12, 2.25, 10.02],
  [9.24, 1.85, 5.21],
  [19.44, 2.01, -4.07],
  [15.05, 1.94, -16.63],
  [27.81, 2.12, -18.48],
  [21.79, 2.29, -8.95],
  [10.97, 1.8, -17.21],
  [-2.65, 1.79, -21.52],
];

export function desertLakeLizardPathPoints(): Vector3[] {
  return DESERT_LAKE_LIZARD_WAYPOINTS.map(([x, , z]) => new Vector3(x, 0, z));
}
