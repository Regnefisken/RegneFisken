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
import {
  BUCKET_INNER_RADIUS,
  BUCKET_VISUAL_HEIGHT,
  BUCKET_WATER_RADIUS,
  WATER_SURFACE_Y_LOCAL,
} from '../../logic/bucket-visual.js';
import { usePlayerStore } from '../../store/usePlayerStore.js';
import { bucketSceneAnchorRef } from '../bucket-anchor.js';

const SIDES = 16;

/**
 * Vand: cylinder + disk ved `WATER_SURFACE_Y_LOCAL`, `waterBottomPad` 0,015 (mørkt, let transparent).
 * Legacy `buildBucket` + placering på molen (1.1, 0.72, 8.8).
 */
export function Bucket() {
  const upgrades = usePlayerStore((s) => s.upgrades);
  const tier = useMemo(() => getBucketTier(upgrades), [upgrades]);
  const rootRef = useRef<Group>(null);

  const { bodyGeo, bottomGeo, rimGeo, handleGeo, waterCylinderGeo, waterSurfaceGeo } = useMemo(() => {
    const body = new CylinderGeometry(0.55, 0.42, 0.9, SIDES, 1, true);
    const bottom = new CircleGeometry(0.42, SIDES);
    const rim = new TorusGeometry(0.55, 0.03, 6, SIDES);
    const waterBottomPad = 0.015;
    const waterH = WATER_SURFACE_Y_LOCAL - waterBottomPad;
    const waterCylinder = new CylinderGeometry(
      BUCKET_WATER_RADIUS,
      BUCKET_WATER_RADIUS,
      waterH,
      32,
      1,
      false,
    );
    const waterSurface = new CircleGeometry(BUCKET_WATER_RADIUS, 40);
    const handleCurve = new QuadraticBezierCurve3(
      new Vector3(-0.55, 0.9, 0),
      new Vector3(0, 1.85, 0),
      new Vector3(0.55, 0.9, 0),
    );
    const handle = new TubeGeometry(handleCurve, 12, 0.04, 6, false);
    return {
      bodyGeo: body,
      bottomGeo: bottom,
      rimGeo: rim,
      handleGeo: handle,
      waterCylinderGeo: waterCylinder,
      waterSurfaceGeo: waterSurface,
    };
  }, []);

  useEffect(
    () => () => {
      bodyGeo.dispose();
      bottomGeo.dispose();
      rimGeo.dispose();
      handleGeo.dispose();
      waterCylinderGeo.dispose();
      waterSurfaceGeo.dispose();
    },
    [bodyGeo, bottomGeo, rimGeo, handleGeo, waterCylinderGeo, waterSurfaceGeo],
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

  const waterBottomPad = 0.015;
  const waterH = WATER_SURFACE_Y_LOCAL - waterBottomPad;
  const waterCenterY = waterBottomPad + waterH / 2;

  return (
    <group ref={rootRef} position={[1.1, 0.48, 8.8]}>
      <group renderOrder={-1}>
        <mesh geometry={waterCylinderGeo} position={[0, waterCenterY, 0]} renderOrder={-1}>
          <meshStandardMaterial
            color="#153d54"
            transparent
            opacity={0.72}
            roughness={0.35}
            metalness={0.04}
            depthWrite={false}
          />
        </mesh>
        <mesh
          geometry={waterSurfaceGeo}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, WATER_SURFACE_Y_LOCAL, 0]}
          renderOrder={-1}
        >
          <meshStandardMaterial
            color="#1a4f6a"
            transparent
            opacity={0.55}
            roughness={0.25}
            metalness={0.06}
            depthWrite={false}
          />
        </mesh>
      </group>
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
