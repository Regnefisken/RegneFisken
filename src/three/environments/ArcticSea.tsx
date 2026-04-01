import { useMemo, useRef } from 'react';
import { AdditiveBlending, Color, PlaneGeometry, type Points } from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/useGameStore.js';
import { getWeatherEntry } from '../logic/environment.js';
import { ArcticPenguin } from '../models/ArcticPenguin.js';

function det(i: number, j: number) {
  const x = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Placering af isblok der tidligere lå ved ca. (-2.53, 1.88, 9.57) — flyttet manuelt. */
const ISHAVET_ICE_BLOCK_POSITION: [number, number, number] = [-8.2, 1.18, 1.35];
const ISHAVET_ICE_BLOCK_OVERRIDE_INDEX = 4;

const ICE_BLOCK_SIZE_MUL = 1.1;
/** Sænk center-Y med denne brøk af blokhøjden (modvirker at blokke “svæver” over vandet). */
const ICE_BLOCK_SINK_Y_FRAC = 0.05;

function iceBlockCenterY(h: number, manualCenterY?: number): number {
  const base = manualCenterY ?? h / 2;
  return base - ICE_BLOCK_SINK_Y_FRAC * h;
}

/** Ishav: isflage, isblokke, sne + NPC-pingvin — fra legacy `buildArcticSea`. */
export function ArcticSea() {
  const snowRef = useRef<Points>(null);
  const weatherType = useGameStore((s) => s.weatherType);
  const wEntry = getWeatherEntry(weatherType);
  const snowSize = wEntry.snow ? (wEntry.storm ? 0.22 : 0.16) : 0.12;
  const snowOpacity = wEntry.snow ? (wEntry.storm ? 0.9 : 0.8) : 0.7;
  const snowPos = useMemo(() => {
    const a = new Float32Array(1200 * 3);
    for (let i = 0; i < 1200; i++) {
      a[i * 3] = (det(i, 0) - 0.5) * 80;
      a[i * 3 + 1] = 2 + det(i, 1) * 18;
      a[i * 3 + 2] = (det(i, 2) - 0.5) * 80;
    }
    return a;
  }, []);

  const iceGeo = useMemo(() => {
    const g = new PlaneGeometry(30, 20, 18, 12);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const bump = Math.sin(x * 0.35) * 0.06 + Math.cos(y * 0.42) * 0.05 + (det(i, 4) - 0.5) * 0.04;
      pos.setZ(i, bump);
    }
    pos.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, []);

  const blocks = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const w = (1 + det(i, 5) * 2.5) * ICE_BLOCK_SIZE_MUL;
      const h = (0.6 + det(i, 6) * 2) * ICE_BLOCK_SIZE_MUL;
      const d = (1 + det(i, 7) * 2) * ICE_BLOCK_SIZE_MUL;
      const angle = (i / 14) * Math.PI * 2;
      const r = 10 + det(i, 8) * 12;
      const col = new Color().setHSL(0.55, 0.4, 0.75 + det(i, 9) * 0.15);
      return {
        w,
        h,
        d,
        x: Math.cos(angle) * r,
        z: Math.sin(angle) * r,
        ry: det(i, 10) * Math.PI,
        hex: col.getHex(),
      };
    });
  }, []);

  useFrame(() => {
    const geo = snowRef.current?.geometry;
    if (!geo?.attributes.position) return;
    const w = getWeatherEntry(useGameStore.getState().weatherType);
    const fallMul = w.snow ? (w.storm ? 4.0 : 2.0) : 1.0;
    const windDrift = w.snow && w.storm ? 0.12 : 0;
    const arr = geo.attributes.position.array as Float32Array;
    for (let i = 0; i < 1200; i++) {
      arr[i * 3 + 1] -= (0.04 + det(i, 11) * 0.02) * fallMul;
      if (windDrift > 0) {
        arr[i * 3] += windDrift;
        if (arr[i * 3] > 40) arr[i * 3] = -40;
      }
      if (arr[i * 3 + 1] < -2) {
        arr[i * 3 + 1] = 20;
        arr[i * 3] = (det(i, 12) - 0.5) * 80;
        arr[i * 3 + 2] = (det(i, 13) - 0.5) * 80;
      }
    }
    geo.attributes.position.needsUpdate = true;
  });

  return (
    <group>
      <ArcticPenguin position={[-3, 0, 5]} rotation={[0, Math.PI * 0.15, 0]} isNpc />
      <mesh geometry={iceGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 7]} receiveShadow>
        <meshStandardMaterial
          color={0xcceeff}
          roughness={0.1}
          metalness={0.2}
          flatShading
          transparent
          opacity={0.95}
        />
      </mesh>
      {blocks.map((b, i) => (
        <mesh
          key={i}
          position={
            i === ISHAVET_ICE_BLOCK_OVERRIDE_INDEX
              ? [
                  ISHAVET_ICE_BLOCK_POSITION[0],
                  iceBlockCenterY(b.h, ISHAVET_ICE_BLOCK_POSITION[1]),
                  ISHAVET_ICE_BLOCK_POSITION[2],
                ]
              : [b.x, iceBlockCenterY(b.h), b.z]
          }
          rotation={[0, b.ry, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial
            color={b.hex}
            roughness={0.1}
            metalness={0.1}
            flatShading
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
      <points ref={snowRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[snowPos, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={0xffffff}
          size={snowSize}
          transparent
          opacity={snowOpacity}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
    </group>
  );
}
