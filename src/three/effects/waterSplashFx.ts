import { Vector3 } from 'three';

type Spawn = { origin: Vector3; count: number };

const pending: Spawn[] = [];

export function queueWaterSplash(origin: Vector3, count: number) {
  pending.push({ origin: origin.clone(), count });
}

export function drainWaterSplashSpawns(): Spawn[] {
  if (pending.length === 0) return [];
  return pending.splice(0, pending.length);
}
