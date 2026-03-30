import { useCallback, useMemo, useRef, useLayoutEffect, useEffect } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  ConeGeometry,
  Float32BufferAttribute,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  PointsMaterial,
  Quaternion,
  Vector3,
} from 'three';
import { useFrame } from '@react-three/fiber';
import type { Points } from 'three';
import {
  buildBoltSegments,
  ensureLinePositions,
  fillSparkParams,
} from './cuteFishExtremeUtils.js';

const BOLT_REGEN_MS = 80;
const SPARK_COUNT = 24;

export function ElectricSparksFX({ enabled }: { enabled: boolean }) {
  const pointsRef = useRef<Points>(null);
  const matRef = useRef<PointsMaterial | null>(null);
  const data = useMemo(() => fillSparkParams(0xdecafbad), []);
  const geom = useMemo(() => {
    const g = new BufferGeometry();
    const pos = new Float32Array(SPARK_COUNT * 3);
    const col = new Float32Array(SPARK_COUNT * 3);
    g.setAttribute('position', new BufferAttribute(pos, 3));
    g.setAttribute('color', new BufferAttribute(col, 3));
    return g;
  }, []);

  useFrame(({ clock }) => {
    if (!enabled) return;
    const t = clock.elapsedTime;
    /* eslint-disable react-hooks/immutability -- Three.js: muterer vertex-attribut arrays */
    const pos = geom.attributes.position.array as Float32Array;
    const col = geom.attributes.color.array as Float32Array;
    for (let i = 0; i < SPARK_COUNT; i++) {
      const th = data.angles[i] + t * data.speeds[i];
      const ph = data.phases[i] + t * (0.75 + (i % 7) * 0.07);
      const r = data.rBase[i] + Math.sin(t * 3.2 + i * 0.2) * 0.06;
      const sp = Math.sin(ph);
      const cp = Math.cos(ph);
      pos[i * 3] = r * sp * Math.cos(th);
      pos[i * 3 + 1] = r * cp;
      pos[i * 3 + 2] = r * sp * Math.sin(th);
      const w = data.isWhite[i];
      col[i * 3] = w ? 1 : 0.25;
      col[i * 3 + 1] = w ? 1 : 0.92;
      col[i * 3 + 2] = w ? 1 : 1;
    }
    geom.attributes.position.needsUpdate = true;
    geom.attributes.color.needsUpdate = true;
    /* eslint-enable react-hooks/immutability */
    if (matRef.current) {
      matRef.current.opacity = 0.45 + Math.sin(t * 30) * 0.28;
    }
  });

  if (!enabled) return null;

  return (
    <points ref={pointsRef} geometry={geom} frustumCulled={false}>
      <pointsMaterial
        ref={matRef}
        vertexColors
        size={0.038}
        transparent
        opacity={0.65}
        blending={AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

export function ElectricBoltsFX({
  enabled,
  sx,
  sy,
  sz,
}: {
  enabled: boolean;
  sx: number;
  sy: number;
  sz: number;
}) {
  const cyanGeo = useMemo(() => new BufferGeometry(), []);
  const whiteGeo = useMemo(() => new BufferGeometry(), []);
  const lastRegen = useRef(-999999);

  const regen = useCallback(() => {
    const { cyan, white } = buildBoltSegments(sx, sy, sz);
    const c = ensureLinePositions(cyan);
    const w = ensureLinePositions(white);
    cyanGeo.setAttribute('position', new Float32BufferAttribute(c, 3));
    whiteGeo.setAttribute('position', new Float32BufferAttribute(w, 3));
    cyanGeo.computeBoundingSphere();
    whiteGeo.computeBoundingSphere();
  }, [sx, sy, sz, cyanGeo, whiteGeo]);

  useLayoutEffect(() => {
    if (enabled) regen();
  }, [enabled, regen]);

  useFrame(({ clock }) => {
    if (!enabled) return;
    const ms = clock.elapsedTime * 1000;
    if (ms - lastRegen.current < BOLT_REGEN_MS) return;
    lastRegen.current = ms;
    regen();
  });

  if (!enabled) return null;

  return (
    <group>
      <lineSegments geometry={cyanGeo} frustumCulled={false}>
        <lineBasicMaterial color={0x44eeff} transparent opacity={0.85} blending={AdditiveBlending} depthWrite={false} />
      </lineSegments>
      <lineSegments geometry={whiteGeo} frustumCulled={false}>
        <lineBasicMaterial color={0xffffff} transparent opacity={0.55} blending={AdditiveBlending} depthWrite={false} />
      </lineSegments>
    </group>
  );
}

const coneGeo = new ConeGeometry(0.12, 0.55, 5);
const _dummy = new Object3D();
const _quat = new Quaternion();
const _scale = new Vector3();

export function PufferSpikesInstanced({
  puff,
  spikeDensity,
  sx,
  sy,
  sz,
  puffScale,
}: {
  puff: number;
  spikeDensity: number;
  sx: number;
  sy: number;
  sz: number;
  puffScale: number;
}) {
  const ref = useRef<InstancedMesh>(null);
  const count = Math.min(280, Math.max(20, Math.round(180 * spikeDensity)));
  const spikeMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: 0x8899aa,
        metalness: 0.25,
        roughness: 0.45,
        emissive: 0x223344,
        emissiveIntensity: 0.15,
      }),
    [],
  );
  useEffect(() => () => spikeMat.dispose(), [spikeMat]);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const golden = Math.PI * (3 - Math.sqrt(5));
    const rx = sz * 0.36 * puffScale;
    const ry = sy * 0.36 * puffScale;
    const rz = sx * 0.36 * puffScale;
    const spikeScale = puff * 1.65;
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / Math.max(1, count - 1)) * 2;
      const rr = Math.sqrt(Math.max(0, 1 - y * y));
      const th = golden * i;
      const x = Math.cos(th) * rr;
      const z = Math.sin(th) * rr;
      const px = x * rx;
      const py = y * ry;
      const pz = z * rz;
      const dir = new Vector3(px, py, pz).normalize();
      _quat.setFromUnitVectors(new Vector3(0, 1, 0), dir);
      _dummy.position.set(px, py, pz);
      _dummy.quaternion.copy(_quat);
      const s = spikeScale * 0.09;
      _scale.set(s, s * 1.2, s);
      _dummy.scale.copy(_scale);
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [puff, spikeDensity, sx, sy, sz, puffScale, count]);

  if (puff <= 0.001) return null;

  return (
    <instancedMesh key={count} ref={ref} args={[coneGeo, spikeMat, count]} frustumCulled={false} />
  );
}
