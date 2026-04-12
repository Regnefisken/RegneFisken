import { useMemo, useRef } from 'react';
import { BufferAttribute, BufferGeometry, Points, ShaderMaterial } from 'three';
import { useFrame } from '@react-three/fiber';
import type { GraphicsQuality } from '../../types/game.js';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';
import { useGameStore } from '../../store/useGameStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import { getWeatherEntry } from '../logic/environment.js';

/** Max vertices — faktisk antal styres af `u_count` (undgår geometry-reallokering). */
const MAX_COUNT = 2000;

function particleCountForQuality(q: GraphicsQuality): number {
  if (q === 'low') return 400;
  if (q === 'medium') return 1000;
  if (q === 'high') return 1600;
  return 2000;
}

const VERT = /* glsl */ `
  uniform float u_time;
  uniform float u_fall;
  uniform float u_drift;
  uniform float u_count;

  float hash01(float n) {
    return fract(sin(n * 12.9898) * 43758.5453);
  }

  void main() {
    if (float(gl_VertexID) >= u_count) {
      gl_Position = vec4(0.0);
      gl_PointSize = 0.0;
      return;
    }

    float i = float(gl_VertexID);

    float baseX = (hash01(i * 3.0) - 0.5) * 60.0;
    float baseY = hash01(i * 3.0 + 1.0) * 40.0;
    float baseZ = (hash01(i * 3.0 + 2.0) - 0.5) * 60.0;

    float y = mod(baseY - u_time * u_fall * 10.0, 42.0) - 2.0;

    float x = mod(baseX + u_time * u_drift * 10.0 + 30.0, 60.0) - 30.0;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(x, y, baseZ, 1.0);
    gl_PointSize = 2.0;
  }
`;

const FRAG = /* glsl */ `
  uniform float u_opacity;
  void main() {
    gl_FragColor = vec4(0.667, 0.667, 0.667, u_opacity);
  }
`;

/** Regn / storm-partikler — GPU vertex (ingen CPU-loop). */
export function WeatherParticles() {
  const reducedMotion = useReducedMotion();
  const reducedRef = useRef(reducedMotion);
  reducedRef.current = reducedMotion;
  const ref = useRef<Points>(null);

  const geometry = useMemo(() => {
    const geo = new BufferGeometry();
    const dummy = new Float32Array(MAX_COUNT);
    geo.setAttribute('position', new BufferAttribute(dummy, 1));
    return geo;
  }, []);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms: {
          u_time: { value: 0 },
          u_fall: { value: 0 },
          u_drift: { value: 0 },
          u_opacity: { value: 0.6 },
          u_count: { value: MAX_COUNT },
        },
        transparent: true,
        depthWrite: false,
      }),
    [],
  );

  useFrame((state) => {
    const { weatherType: wx, currentLocation } = useGameStore.getState();
    const w = getWeatherEntry(wx);
    const pts = ref.current;
    if (!pts) return;

    const outdoors = currentLocation !== 'cave';
    pts.visible = !reducedRef.current && w.rain && outdoors;
    if (!pts.visible) return;

    const unis = (pts.material as ShaderMaterial).uniforms;
    unis.u_time.value = state.clock.elapsedTime;
    unis.u_fall.value = w.storm ? 0.8 : 0.4;
    unis.u_drift.value = w.storm ? 0.1 : 0;
    unis.u_count.value = particleCountForQuality(useUIStore.getState().graphicsQuality);
  });

  return (
    <points ref={ref} geometry={geometry} material={material} visible={false} frustumCulled={false} />
  );
}
