import { useLayoutEffect, useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  DirectionalLight,
  Group,
  Object3D,
  ShaderMaterial,
  Vector3,
} from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore } from '../../store/useGameStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import {
  computeDayNightPhase,
  computeMoonArcU,
  computeNightSkyOpacity,
  usesDayNightSolidBackdrop,
} from '../logic/environment.js';
import { DAY_NIGHT_EPOCH_MS } from '../logic/dayNightClock.js';
import { DAY_NIGHT_CYCLE } from '../../data/world.js';

function hash01(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function starCountForQuality(q: string): number {
  if (q === 'low') return 80;
  if (q === 'medium') return 150;
  return 200;
}

const STAR_VERT = /* glsl */ `
attribute float aSize;
attribute vec3 aColor;
varying vec3 vColor;
varying float vWorldY;
void main() {
  vColor = aColor;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldY = worldPos.y;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  float scale = 72.0 / max(-mvPosition.z, 1.0);
  gl_PointSize = clamp(aSize * scale, 1.15, 6.2);
}
`;

const STAR_FRAG = /* glsl */ `
varying vec3 vColor;
varying float vWorldY;
uniform float uOpacity;
void main() {
  /* Punkt-sprites har én dybde for hele prikken — clip mod havplan så kanter ikke "svømmer" i bølger. */
  if (vWorldY < 0.08) discard;
  vec2 p = gl_PointCoord - vec2(0.5);
  float d = length(p);
  if (d > 0.5) discard;
  float core = step(d, 0.42);
  gl_FragColor = vec4(vColor, core * uOpacity);
}
`;

const MOON_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const MOON_FRAG = /* glsl */ `
varying vec2 vUv;
uniform float uOpacity;
void main() {
  if (uOpacity < 0.001) discard;
  vec2 c = vUv - vec2(0.5);
  float d = length(c);
  if (d > 0.5) discard;
  vec3 col = vec3(1.0, 0.98, 0.93) * uOpacity;
  gl_FragColor = vec4(col, 1.0);
}
`;

const GLOW_VERT = MOON_VERT;

const GLOW_FRAG = /* glsl */ `
varying vec2 vUv;
uniform float uOpacity;
void main() {
  vec2 c = vUv - vec2(0.5);
  float dist = length(c) * 2.0;
  float a = pow(1.0 - smoothstep(0.25, 1.0, dist), 1.8) * 0.28;
  vec3 col = vec3(1.0, 0.96, 0.82);
  gl_FragColor = vec4(col, a * uOpacity);
}
`;

const MOON_R = 3;
const GLOW_R = MOON_R * 3;
const MOON_SCALE_MIN = 0.72;
const MOON_SCALE_MAX = 1.22;
const MOON_DIST_MIN = 138;
const MOON_DIST_MAX = 178;

type MoonNightParams = {
  moonScale: number;
  skyDist: number;
  azimBase: number;
  elevMin: number;
  elevMax: number;
};

/** Én sæt parametre pr. helt spildøgn — ny tilfældig måne hver “nat”. */
function moonNightParams(nightIndex: number): MoonNightParams {
  const h = (k: number) => hash01(nightIndex * 19.713 + k * 3.791);
  let elevMin = 0.04 + h(4) * 0.08;
  let elevMax = 0.30 + h(5) * 0.18;
  if (elevMax <= elevMin + 0.10) elevMax = elevMin + 0.22;
  return {
    moonScale: MOON_SCALE_MIN + h(1) * (MOON_SCALE_MAX - MOON_SCALE_MIN),
    skyDist: MOON_DIST_MIN + h(2) * (MOON_DIST_MAX - MOON_DIST_MIN),
    azimBase: (h(3) - 0.5) * 1.25,
    elevMin,
    elevMax,
  };
}

/**
 * Retning til månen i kamera-lokalt rum (+Y op, −Z ind i scenen).
 * Monoton stigning fra elevMin (nær horisont) til elevMax over hele natten.
 */
function moonDirectionCameraLocal(
  u: number | null,
  p: MoonNightParams,
): [number, number, number] | null {
  if (u === null) return null;
  const t = Math.min(1, Math.max(0, u));
  const elev = p.elevMin + (p.elevMax - p.elevMin) * t;
  const azim = p.azimBase + 0.2 * t;

  const ce = Math.cos(elev);
  let x = ce * Math.sin(azim);
  const y = Math.sin(elev);
  let z = -ce * Math.cos(azim);
  if (z > 0.02) {
    x = -x;
    z = -z;
  }
  return [x, y, z];
}

const _v3 = new Vector3();

/** Nattehimmel: skarpe prikker; måne/stjerner afgrænses af dybdetest mod scenen (bølger), ikke flad horisont-plan. */
export function NightSky() {
  const groupRef = useRef<Group>(null);
  const moonGroupRef = useRef<Group>(null);
  const starMatRef = useRef<ShaderMaterial>(null);
  const moonMatRef = useRef<ShaderMaterial>(null);
  const glowMatRef = useRef<ShaderMaterial>(null);

  const scene = useThree((s) => s.scene);

  const moonLightRef = useRef<DirectionalLight>(null!);
  const moonLightTargetRef = useRef<Object3D>(null!);

  useLayoutEffect(() => {
    const light = new DirectionalLight(0x8090c0, 0);
    light.castShadow = false;
    const target = new Object3D();
    light.target = target;
    scene.add(light);
    scene.add(target);
    moonLightRef.current = light;
    moonLightTargetRef.current = target;
    return () => {
      scene.remove(light);
      scene.remove(target);
      light.dispose();
    };
  }, [scene]);

  const graphicsQuality = useUIStore((s) => s.graphicsQuality);

  const { geometry, starMaterial, moonMaterial, glowMaterial } = useMemo(() => {
    const count = starCountForQuality(graphicsQuality);

    const pos = new Float32Array(count * 3);
    const aSize = new Float32Array(count);
    const aColor = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const u = hash01(i * 3);
      const v = hash01(i * 3 + 1);
      const w = hash01(i * 5 + 2);
      const z = -40 - u * 48;
      const zT = (z + 88) / 48;
      const x = (v - 0.5) * 110;
      const yMix = w * 0.55 + (1 - zT) * 0.45;
      /* Lavere gulv → tættere på horisont/vand; fragment + depthTest begrænser stadig “svømning”. */
      const y = 13 + (52 - 13) * Math.min(1, Math.max(0, yMix));

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      const base = 0.85 + hash01(i * 21) * 0.42;
      /* ~12 % diskret lidt større prikker (subtilt). */
      const brighter = hash01(i * 29) > 0.88 ? 1.28 : 1.0;
      aSize[i] = base * brighter;
      const warm = hash01(i * 11);
      const cool = hash01(i * 13);
      aColor[i * 3] = 0.92 + warm * 0.08;
      aColor[i * 3 + 1] = 0.92 + warm * 0.06;
      aColor[i * 3 + 2] = 0.95 + cool * 0.05;
    }

    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(pos, 3));
    geo.setAttribute('aSize', new BufferAttribute(aSize, 1));
    geo.setAttribute('aColor', new BufferAttribute(aColor, 3));

    const starMat = new ShaderMaterial({
      uniforms: {
        uOpacity: { value: 0 },
      },
      vertexShader: STAR_VERT,
      fragmentShader: STAR_FRAG,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      fog: false,
    });

    const moonMat = new ShaderMaterial({
      uniforms: {
        uOpacity: { value: 0 },
      },
      vertexShader: MOON_VERT,
      fragmentShader: MOON_FRAG,
      transparent: false,
      depthWrite: true,
      depthTest: true,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
      fog: false,
    });

    const glowMat = new ShaderMaterial({
      uniforms: {
        uOpacity: { value: 0 },
      },
      vertexShader: GLOW_VERT,
      fragmentShader: GLOW_FRAG,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      fog: false,
      blending: AdditiveBlending,
    });

    return { geometry: geo, starMaterial: starMat, moonMaterial: moonMat, glowMaterial: glowMat };
  }, [graphicsQuality]);

  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;

    const locId = useGameStore.getState().currentLocation;
    if (!usesDayNightSolidBackdrop(locId)) {
      g.visible = false;
      if (moonLightRef.current) moonLightRef.current.intensity = 0;
      return;
    }

    const timeMs = Date.now() - DAY_NIGHT_EPOCH_MS;
    const { cur, nxt, lerpT } = computeDayNightPhase(timeMs);
    const nightOpacity = computeNightSkyOpacity(cur.name, nxt.name, lerpT);

    if (nightOpacity <= 1e-4) {
      g.visible = false;
      if (moonLightRef.current) moonLightRef.current.intensity = 0;
      return;
    }

    g.visible = true;
    const cam = state.camera;
    g.position.copy(cam.position);
    g.quaternion.copy(cam.quaternion);

    const cycleProgress = (timeMs % DAY_NIGHT_CYCLE.duration) / DAY_NIGHT_CYCLE.duration;
    const nightIndex = Math.floor(timeMs / DAY_NIGHT_CYCLE.duration);
    const moonParams = moonNightParams(nightIndex);
    const moonU = computeMoonArcU(cycleProgress);
    const md = moonDirectionCameraLocal(moonU, moonParams);
    const moonG = moonGroupRef.current;
    if (moonG) {
      if (md) {
        moonG.visible = true;
        moonG.position.set(
          md[0] * moonParams.skyDist,
          md[1] * moonParams.skyDist,
          md[2] * moonParams.skyDist,
        );
        moonG.scale.setScalar(moonParams.moonScale);
      } else {
        moonG.visible = false;
      }
    }

    const vis = Math.min(1, Math.pow(nightOpacity, 1.55) * 1.08);

    const starMat = starMatRef.current;
    if (starMat) starMat.uniforms.uOpacity.value = vis;

    const moonMat = moonMatRef.current;
    if (moonMat) moonMat.uniforms.uOpacity.value = vis;

    const glowMat = glowMatRef.current;
    if (glowMat) glowMat.uniforms.uOpacity.value = vis;

    const mLight = moonLightRef.current;
    if (mLight) {
      if (md && md[1] > 0) {
        const dir = _v3.set(md[0], md[1], md[2]).applyQuaternion(cam.quaternion);
        mLight.position.copy(cam.position).addScaledVector(dir, 50);
        moonLightTargetRef.current?.position.set(0, 0, 0);
        mLight.intensity = vis * 0.25;
      } else {
        mLight.intensity = 0;
      }
    }
  });

  return (
    <group ref={groupRef} renderOrder={2} visible={false}>
      <points geometry={geometry} frustumCulled={false} renderOrder={2}>
        <primitive ref={starMatRef} object={starMaterial} attach="material" />
      </points>
      <group ref={moonGroupRef}>
        <mesh position={[0, 0, -1]} renderOrder={2} frustumCulled={false}>
          <circleGeometry args={[GLOW_R, 64]} />
          <primitive ref={glowMatRef} object={glowMaterial} attach="material" />
        </mesh>
        <mesh renderOrder={2} frustumCulled={false}>
          <circleGeometry args={[MOON_R, 48]} />
          <primitive ref={moonMatRef} object={moonMaterial} attach="material" />
        </mesh>
      </group>
    </group>
  );
}
