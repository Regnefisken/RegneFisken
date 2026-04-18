import { Object3D, Raycaster, Scene, Vector3 } from 'three';

const RAY_ORIGIN_Y = 160;
const GROUND_RAY_FAR = 260;

const _origin = new Vector3();
const _down = new Vector3(0, -1, 0);

export function isGroundSnapSkipped(obj: Object3D): boolean {
  let o: Object3D | null = obj;
  while (o) {
    if (o.userData?.skipGroundSnap) return true;
    if (o.userData?.desertLakeLizard) return true;
    o = o.parent;
  }
  return false;
}

/**
 * Lodret raycast mod synlige meshes; springer vand/skyer m.m. over (samme filter som firben).
 * @returns træfpunkt-Y på overfladen, eller null.
 */
export function raycastGroundSurfaceY(scene: Scene, raycaster: Raycaster, x: number, z: number): number | null {
  _origin.set(x, RAY_ORIGIN_Y, z);
  raycaster.set(_origin, _down);
  raycaster.far = GROUND_RAY_FAR;
  const hits = raycaster.intersectObjects(scene.children, true);
  for (const h of hits) {
    if (isGroundSnapSkipped(h.object)) continue;
    return h.point.y;
  }
  return null;
}
