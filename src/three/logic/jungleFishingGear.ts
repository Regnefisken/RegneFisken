import { Vector3 } from 'three';
import {
  HILL_TOP_Y,
  ISLAND_LIFT,
  ISLAND_Z,
  JUNGLE_FISH_BUCKET_X,
  JUNGLE_FISH_BUCKET_Z,
  jungleFishingBucketWorldY,
} from '../environments/jungleTerrain.js';

export const PIER_BUCKET = new Vector3(1.1, 0.48, 8.8);

const seaDir = new Vector3(JUNGLE_FISH_BUCKET_X, 0, JUNGLE_FISH_BUCKET_Z - ISLAND_Z);

/** Y-rotation to turn pier-forward (-Z) toward the jungle sea direction. */
export const JUNGLE_ROT_Y = Math.atan2(-seaDir.x, -seaDir.z);

const cosR = Math.cos(JUNGLE_ROT_Y);
const sinR = Math.sin(JUNGLE_ROT_Y);

const bucketWorldY = jungleFishingBucketWorldY(HILL_TOP_Y, ISLAND_LIFT);
const jungleBucket = new Vector3(JUNGLE_FISH_BUCKET_X, bucketWorldY, JUNGLE_FISH_BUCKET_Z);

/** Group world position so that PIER_BUCKET in local space lands at the jungle bucket after Y-rotation. */
export const JUNGLE_GROUP_POS: [number, number, number] = [
  JUNGLE_FISH_BUCKET_X - (PIER_BUCKET.x * cosR + PIER_BUCKET.z * sinR),
  bucketWorldY - PIER_BUCKET.y,
  JUNGLE_FISH_BUCKET_Z - (-PIER_BUCKET.x * sinR + PIER_BUCKET.z * cosR),
];

/** Rotate a pier camera position around the pier bucket and place it relative to the jungle bucket. */
export function pierToJungle(pierPos: Vector3): Vector3 {
  const dx = pierPos.x - PIER_BUCKET.x;
  const dy = pierPos.y - PIER_BUCKET.y;
  const dz = pierPos.z - PIER_BUCKET.z;
  return new Vector3(
    jungleBucket.x + dx * cosR + dz * sinR,
    jungleBucket.y + dy,
    jungleBucket.z - dx * sinR + dz * cosR,
  );
}
