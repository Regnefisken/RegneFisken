import { useEffect, useMemo, useRef } from 'react';
import {
  CircleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  QuadraticBezierCurve3,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from 'three';
import { getBucketTier } from '../../data/equipment.js';
import { BUCKET_INNER_RADIUS, BUCKET_VISUAL_HEIGHT } from '../../logic/bucket-visual.js';
import { usePlayerStore } from '../../store/usePlayerStore.js';
import { bucketSceneAnchorRef } from '../bucket-anchor.js';

const SIDES = 16;

/** Legacy `buildBucket` + placering på molen (1.1, 0.72, 8.8). */
export function Bucket() {
  const upgrades = usePlayerStore((s) => s.upgrades);
  const tier = useMemo(() => getBucketTier(upgrades), [upgrades]);
  const rootRef = useRef<Group>(null);

  const { bodyGeo, bottomGeo, rimGeo, handleGeo } = useMemo(() => {
    const body = new CylinderGeometry(0.55, 0.42, 0.9, SIDES, 1, true);
    const bottom = new CircleGeometry(0.42, SIDES);
    const rim = new TorusGeometry(0.55, 0.03, 6, SIDES);
    const handleCurve = new QuadraticBezierCurve3(
      new Vector3(-0.55, 0.9, 0),
      new Vector3(0, 1.85, 0),
      new Vector3(0.55, 0.9, 0),
    );
    const handle = new TubeGeometry(handleCurve, 12, 0.04, 6, false);
    return { bodyGeo: body, bottomGeo: bottom, rimGeo: rim, handleGeo: handle };
  }, []);

  useEffect(
    () => () => {
      bodyGeo.dispose();
      bottomGeo.dispose();
      rimGeo.dispose();
      handleGeo.dispose();
    },
    [bodyGeo, bottomGeo, rimGeo, handleGeo],
  );

  useEffect(() => {
    const g = rootRef.current;
    if (g) {
      g.userData.isBucket = true;
      g.userData.innerRadius = BUCKET_INNER_RADIUS;
      g.userData.height = BUCKET_VISUAL_HEIGHT;
      bucketSceneAnchorRef.current = g;
    }
    return () => {
      if (bucketSceneAnchorRef.current === g) bucketSceneAnchorRef.current = null;
    };
  }, []);

  const rimColor = useMemo(() => {
    const c = new Color(tier.color);
    c.multiplyScalar(0.78);
    return c.getHex();
  }, [tier.color]);

  return (
    <group ref={rootRef} position={[1.1, 0.72, 8.8]}>
      <mesh geometry={bodyGeo} castShadow position={[0, 0.45, 0]}>
        <meshStandardMaterial
          color={tier.color}
          metalness={tier.metalness}
          roughness={tier.roughness}
          flatShading
          side={DoubleSide}
        />
      </mesh>
      <mesh geometry={bottomGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <meshStandardMaterial
          color={tier.color}
          metalness={tier.metalness}
          roughness={tier.roughness}
          flatShading
          side={DoubleSide}
        />
      </mesh>
      <mesh geometry={rimGeo} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.9, 0]}>
        <meshStandardMaterial
          color={rimColor}
          metalness={tier.metalness}
          roughness={tier.roughness}
          flatShading
          side={DoubleSide}
        />
      </mesh>
      <mesh geometry={handleGeo}>
        <meshStandardMaterial
          color={rimColor}
          metalness={tier.metalness}
          roughness={tier.roughness}
        />
      </mesh>
    </group>
  );
}
