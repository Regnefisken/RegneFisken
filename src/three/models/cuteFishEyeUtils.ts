import { SphereGeometry } from 'three';
import type { BufferGeometry } from 'three';

/** Bredde-segmenter på `SphereGeometry` for sclera og pupilkugle (højde udledes, samme forhold som 32×24). */
export const MIN_EYE_SPHERE_WIDTH_SEGMENTS = 8;
export const MAX_EYE_SPHERE_WIDTH_SEGMENTS = 32;
/** Standard ~mellem gamle lav-poly (~10) og maks glathed (32) — lavere GPU end 32×24. */
export const DEFAULT_EYE_SPHERE_WIDTH_SEGMENTS = 18;

export function resolveEyeSphereSegments(override?: number): { width: number; height: number } {
  const w = Math.min(
    MAX_EYE_SPHERE_WIDTH_SEGMENTS,
    Math.max(
      MIN_EYE_SPHERE_WIDTH_SEGMENTS,
      Math.round(override ?? DEFAULT_EYE_SPHERE_WIDTH_SEGMENTS),
    ),
  );
  const h = Math.max(6, Math.round((w * 24) / 32));
  return { width: w, height: h };
}

/** Groft antal trekanter for én fuld kugel (Three.js `SphereGeometry`). */
export function estimateEyeSphereTriangleCount(width: number, height: number): number {
  return Math.max(2, height - 1) * width * 2;
}

/** Pupilkugle (én form). */
export function createPupilGeometry(
  r: number,
  sphereSegs: { width: number; height: number },
): BufferGeometry {
  return new SphereGeometry(r, sphereSegs.width, sphereSegs.height);
}
