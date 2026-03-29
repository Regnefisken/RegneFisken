import type { RefObject } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import {
  BufferGeometry,
  CatmullRomCurve3,
  DoubleSide,
  Mesh,
  Object3D,
  TubeGeometry,
  Vector3,
} from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/useGameStore.js';

const tipWorld = new Vector3();
const endWorld = new Vector3();

/** Samme kastvarighed som legacy `animateCast` / Bobber. */
const CAST_MS = 650;

const TUBULAR_SEGMENTS = 32;
const RADIAL_SEGMENTS = 6;
const TUBE_RADIUS = 0.005;

const P = new Vector3();
const vertex = new Vector3();
const normal = new Vector3();

/**
 * Opdaterer positions/normals in-place — samme logik som `TubeGeometry` (three.js),
 * uden `new TubeGeometry` pr. frame.
 */
function updateTubeGeometryFromCurve(
  geometry: BufferGeometry,
  path: CatmullRomCurve3,
  tubularSegments: number,
  radius: number,
  radialSegments: number,
  closed: boolean,
): void {
  const frames = path.computeFrenetFrames(tubularSegments, closed);
  const posAttr = geometry.getAttribute('position');
  const nAttr = geometry.getAttribute('normal');
  if (!posAttr || !nAttr) return;
  const positions = posAttr.array as Float32Array;
  const normals = nAttr.array as Float32Array;
  let o = 0;

  const writeSegment = (i: number): void => {
    path.getPointAt(i / tubularSegments, P);
    const N = frames.normals[i]!;
    const B = frames.binormals[i]!;
    for (let j = 0; j <= radialSegments; j++) {
      const v = (j / radialSegments) * Math.PI * 2;
      const sin = Math.sin(v);
      const cos = -Math.cos(v);
      normal.x = cos * N.x + sin * B.x;
      normal.y = cos * N.y + sin * B.y;
      normal.z = cos * N.z + sin * B.z;
      normal.normalize();
      normals[o] = normal.x;
      normals[o + 1] = normal.y;
      normals[o + 2] = normal.z;
      vertex.x = P.x + radius * normal.x;
      vertex.y = P.y + radius * normal.y;
      vertex.z = P.z + radius * normal.z;
      positions[o] = vertex.x;
      positions[o + 1] = vertex.y;
      positions[o + 2] = vertex.z;
      o += 3;
    }
  };

  for (let i = 0; i < tubularSegments; i++) {
    writeSegment(i);
  }
  writeSegment(closed ? 0 : tubularSegments);

  posAttr.needsUpdate = true;
  nAttr.needsUpdate = true;
}

/**
 * Dynamisk snøre (CatmullRom + Tube) — porteret fra legacy `updateFishingLine`.
 * Under kast: samme lodrette bølge som i vandfasen (`sin(time*1.5+i*1.2)*0.06`), men
 * amplitude følger `sin(tCast*π)` så bevægelsen er blødest midt i kastet og matcher
 * den levende følelse fra legacy (endepunkter + stangbevægelse).
 */
export function FishingLine({
  rodTipRef,
  lineEndRef,
}: {
  rodTipRef: RefObject<Object3D | null>;
  lineEndRef: RefObject<Object3D | null>;
}) {
  const meshRef = useRef<Mesh>(null);
  const wasCastingRef = useRef(false);
  const castStartRef = useRef(0);

  const { curve, geometry } = useMemo(() => {
    const pts = Array.from({ length: 6 }, (_, i) => new Vector3(0, -10 - i * 0.001, 0));
    const curve = new CatmullRomCurve3(pts, false, 'catmullrom', 0.3);
    const geometry = new TubeGeometry(
      curve,
      TUBULAR_SEGMENTS,
      TUBE_RADIUS,
      RADIAL_SEGMENTS,
      false,
    );
    return { curve, geometry };
  }, []);

  useEffect(
    () => () => {
      geometry.dispose();
    },
    [geometry],
  );

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    const tip = rodTipRef.current;
    const end = lineEndRef.current;
    const gameState = useGameStore.getState().gameState;
    const show =
      gameState === 'casting' ||
      gameState === 'waiting' ||
      gameState === 'biting' ||
      gameState === 'fighting';

    if (!mesh || !tip || !end || !show) {
      if (mesh) mesh.visible = false;
      return;
    }

    mesh.visible = true;
    tip.getWorldPosition(tipWorld);
    end.getWorldPosition(endWorld);

    const time = clock.elapsedTime;
    const N = 5;
    const pts = curve.points;
    const casting = gameState === 'casting';
    if (casting && !wasCastingRef.current) {
      castStartRef.current = performance.now();
      wasCastingRef.current = true;
    } else if (!casting) {
      wasCastingRef.current = false;
    }
    const tCast = casting ? Math.min(1, (performance.now() - castStartRef.current) / CAST_MS) : 0;
    const castWaveAmp = casting ? Math.sin(tCast * Math.PI) : 0;

    const inWater = gameState === 'waiting' || gameState === 'biting' || gameState === 'fighting';
    const sag = casting ? 0.7 : 0.25;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      let x = tipWorld.x + (endWorld.x - tipWorld.x) * u;
      let y = tipWorld.y + (endWorld.y - tipWorld.y) * u;
      let z = tipWorld.z + (endWorld.z - tipWorld.z) * u;
      const droop = 4 * sag * u * (1 - u);
      y -= droop;
      if (inWater && i > 0 && i < N) y += Math.sin(time * 1.5 + i * 1.2) * 0.06;
      if (casting && i > 0 && i < N) {
        y += Math.sin(time * 1.5 + i * 1.2) * 0.06 * castWaveAmp;
        const sway =
          Math.sin(time * 1.85 + i * 1.05) * 0.028 * castWaveAmp * Math.sin(u * Math.PI);
        x += sway;
        z += Math.cos(time * 1.6 + i * 0.95) * 0.022 * castWaveAmp * Math.sin(u * Math.PI);
      }
      pts[i]!.set(x, y, z);
    }

    curve.updateArcLengths();
    updateTubeGeometryFromCurve(geometry, curve, TUBULAR_SEGMENTS, TUBE_RADIUS, RADIAL_SEGMENTS, false);
  });

  return (
    <mesh ref={meshRef} geometry={geometry} frustumCulled={false}>
      <meshPhongMaterial
        color={0xccccdd}
        transparent
        opacity={0.82}
        specular={0x555555}
        shininess={80}
        depthWrite={false}
        side={DoubleSide}
      />
    </mesh>
  );
}
