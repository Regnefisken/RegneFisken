import { useEffect, useMemo, useRef } from 'react';
import { AdditiveBlending, ShaderMaterial } from 'three';
import type { Mesh } from 'three';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/useGameStore.js';
import {
  computeDayNightPhase,
  computeNightSkyOpacity,
} from '../logic/environment.js';
import { DAY_NIGHT_EPOCH_MS } from '../logic/dayNightClock.js';

/** Samme vis-kurve som `NightSky` point-stjerner — hytteudsyn matcher øvrige lokationer. */
function cabinWindowStarOpacity(nightOpacity: number): number {
  return Math.min(1, Math.pow(nightOpacity, 1.55) * 1.08);
}

const STAR_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const STAR_FRAG = /* glsl */ `
varying vec2 vUv;
uniform float uOpacity;
uniform float uTime;
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
void main() {
  if (uOpacity < 0.001) discard;
  /* Øverste ~55 % af ruden — mere luft til horisont under stjernerne. */
  if (vUv.y < 0.45) discard;
  vec2 uvn = vUv * vec2(88.0, 60.0);
  vec2 cell = floor(uvn);
  vec2 f = fract(uvn) - 0.5;
  float h = hash(cell);
  float br = 0.0;
  if (h > 0.90) {
    float d = length(f);
    float sz = 0.11 + 0.09 * hash(cell + 19.7);
    br = smoothstep(sz, 0.0, d) * (0.4 + 0.6 * hash(cell * 3.1));
    float tw = 0.88 + 0.12 * sin(uTime * 1.25 + h * 47.0);
    br *= tw;
  }
  vec3 col = vec3(0.93, 0.92, 1.0);
  float a = br * uOpacity;
  gl_FragColor = vec4(col * a, 1.0);
}
`;

/**
 * Én plan med procedurelle stjerner — i hyttens rod-koordinater, **bag** sky/fugle-zonen
 * (`BACKGROUND_Z_BOUNDS.fishing_cabin`), med skalering så ruden stadig fyldes; stjerner kun øverst
 * på ruden (UV). Dybdetest uden
 * depthWrite så skyer (uændret placering) skriver ovenpå stjernerne.
 */
export function CabinWindowStarfield({
  winW,
  winH,
  winY,
  planeZ,
}: {
  winW: number;
  winH: number;
  winY: number;
  /** Verdens/hytte Z — skal være < `minZ` for fugle/skyer så de ligger mellem ruden og stjerner. */
  planeZ: number;
}) {
  const meshRef = useRef<Mesh>(null);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uOpacity: { value: 0 },
          uTime: { value: 0 },
        },
        vertexShader: STAR_VERT,
        fragmentShader: STAR_FRAG,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: AdditiveBlending,
        fog: false,
      }),
    [],
  );

  useEffect(() => {
    return () => material.dispose();
  }, [material]);

  useFrame((state) => {
    if (useGameStore.getState().currentLocation !== 'fishing_cabin') return;
    const timeMs = Date.now() - DAY_NIGHT_EPOCH_MS;
    const { cur, nxt, lerpT } = computeDayNightPhase(timeMs);
    const nightOp = computeNightSkyOpacity(cur.name, nxt.name, lerpT);
    const vis = cabinWindowStarOpacity(nightOp);
    material.uniforms.uOpacity.value = vis;
    material.uniforms.uTime.value = state.clock.elapsedTime;
    const m = meshRef.current;
    if (m) m.visible = vis > 0.002;
  });

  return (
    <mesh ref={meshRef} position={[0, winY, planeZ]} frustumCulled renderOrder={0} visible={false}>
      <planeGeometry args={[winW * 1.04, winH * 1.04]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
