import { useMemo, useRef } from 'react';
import { Group, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';

import { useGameStore } from '../../store/useGameStore.js';
import { JUNGLE_FISH_VIEW_DIR_XZ } from '../logic/jungleFishingGear.js';
import {
  HILL_TOP_Y,
  ISLAND_LIFT,
  JUNGLE_FISH_BUCKET_X,
  JUNGLE_FISH_BUCKET_Z,
  jungleFishingBucketWorldY,
} from './jungleTerrain.js';
import { JungleFishingPlesioNeckHeadModel } from '../models/JungleFishingPlesioNeckHeadModel.js';

const bucketWorldY = jungleFishingBucketWorldY(HILL_TOP_Y, ISLAND_LIFT);
const jungleBucket = new Vector3(JUNGLE_FISH_BUCKET_X, bucketWorldY, JUNGLE_FISH_BUCKET_Z);

/** Vandret vinkelret på synslinjen (tværs forbi spanden): (0,1,0) × view. */
const VIEW_SIDE_XZ = new Vector3(
  JUNGLE_FISH_VIEW_DIR_XZ.z,
  0,
  -JUNGLE_FISH_VIEW_DIR_XZ.x,
).normalize();

/** Afstand fra spand-center mod vandet langs blikket — “foran” spanden. */
const FORWARD_OUT = 10.5;
/** Halv bredde på tværs-passagen (meter) — ~2½× tidligere så den bliver synlig længere i begge retninger. */
const SWIM_HALF_WIDTH = 18.5;
/** Sinus-fase hastighed (dæmpet vs. før så ~samme tværs-hastighed trods længere bane). */
const SWIM_ANGULAR = 0.165;
/** Rod-skala: indre geometri matcher `PlesiosaurusCatchModel` (~0.055) før verdensskala. */
const MODEL_UNIT_SCALE = 0.055;
const WORLD_SCALE = 5.2;
/** Vandplanet ~y=0; geometri har høj model-Y før skalering, så roden skal trækkes ned. */
const WATER_Y = 0.08;
/** Verdensmeter: sænk hele modellen så hals/hoved ligger i vandet (kun snude/tinding over). */
const WORLD_SINK = 0.92;
const BOB_AMP = 0.045;

/**
 * Plesiosaurus hals+hals der glider forbi ude i vandet foran jungle-spanden,
 * kun mens `jungleFishing` er aktiv.
 */
export function JungleFishingSwimPlesio() {
  /** Monteres kun fra `JungleIsland` når `jungleFishing` — så `useFrame` afmonteres helt uden for fiskemode. */
  const currentLocation = useGameStore((s) => s.currentLocation);
  const root = useRef<Group>(null);

  const anchor = useMemo(() => {
    const a = jungleBucket.clone().addScaledVector(JUNGLE_FISH_VIEW_DIR_XZ, FORWARD_OUT);
    a.y = WATER_Y - WORLD_SINK;
    return a;
  }, []);

  useFrame(({ clock }) => {
    if (currentLocation !== 'jungle_island') return;
    const g = root.current;
    if (!g) return;

    const t = clock.elapsedTime;
    const phase = t * SWIM_ANGULAR;
    const lateral = Math.sin(phase) * SWIM_HALF_WIDTH;
    const velScale = Math.cos(phase) * SWIM_HALF_WIDTH * SWIM_ANGULAR;

    g.position.copy(anchor).addScaledVector(VIEW_SIDE_XZ, lateral);
    g.position.y = WATER_Y - WORLD_SINK + Math.sin(t * 2.1) * BOB_AMP;

    const vx = VIEW_SIDE_XZ.x * velScale;
    const vz = VIEW_SIDE_XZ.z * velScale;
    /** Lokal +X → verdens (cos y, 0, -sin y); peg langs hastighed (vx, 0, vz) ⇒ y = atan2(-vz, vx). */
    if (vx * vx + vz * vz > 1e-5) {
      g.rotation.y = Math.atan2(-vz, vx);
    }
    g.rotation.z = Math.sin(t * 1.4) * 0.04;
  });

  if (currentLocation !== 'jungle_island') return null;

  return (
    <group ref={root} scale={MODEL_UNIT_SCALE * WORLD_SCALE}>
      <JungleFishingPlesioNeckHeadModel />
    </group>
  );
}
