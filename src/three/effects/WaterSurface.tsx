import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Color, DoubleSide, MathUtils, Mesh, MeshStandardMaterial, PlaneGeometry } from 'three';
import { useFrame } from '@react-three/fiber';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';
import { isCabinLocation } from '../../logic/location-helpers.js';
import { useGameStore } from '../../store/useGameStore.js';
import { DAY_NIGHT_EPOCH_MS } from '../logic/dayNightClock.js';
import { computeDayNightPhase, getWeatherEntry } from '../logic/environment.js';
import { getWaterColorHex } from '../logic/waterWaves.js';

/** Matcher `updateWaterGeometry` / plane lokalt XY, displacement langs Z. */
const WATER_MODE: Record<string, number> = {
  tropical_island: 1,
  jungle_island: 2,
  desert_lake: 3,
  arctic_sea: 4,
  cave: 5,
};

/** Mørkere vand om aften/nat på mole — som legacy-reference (teal → dyb blågrøn). */
function pierWaterBrightness(phaseIdx: number, lerpT: number, nxtName: string): number {
  if (phaseIdx === 3) return 0.5;
  if (phaseIdx === 2) {
    return nxtName === 'Nat' ? MathUtils.lerp(0.8, 0.5, lerpT) : 0.8;
  }
  if (phaseIdx === 1) {
    return nxtName === 'Aften' ? MathUtils.lerp(1, 0.8, lerpT) : 1;
  }
  if (phaseIdx === 0 && nxtName === 'Dag') {
    return MathUtils.lerp(0.94, 1, lerpT);
  }
  return 1;
}

const SHADOW_WAVE_DAMPING = 0.05;

const WAVE_AFTER_BEGIN_VERTEX = /* glsl */ `
#include <begin_vertex>
{
  vec3 pos = transformed;
  float wave = u_amp * sin(pos.x * 0.5 + u_time * u_speed)
    + u_amp * 0.5 * cos(pos.y * 0.3 + u_time * u_speed * 1.5);
  float mask = 1.0;
  float z = wave;
  if (u_mode == 1) {
    float dx = pos.x;
    float dy = pos.y + 11.5;
    float dist = sqrt((dx / 1.32) * (dx / 1.32) + dy * dy);
    mask = clamp((dist - 15.0) / 2.0, 0.0, 1.0);
    z = wave * mask;
  } else if (u_mode == 2) {
    float dx = pos.x;
    float dy = pos.y + 14.0;
    float dist = sqrt((dx / 1.32) * (dx / 1.32) + dy * dy);
    mask = clamp((dist - 22.0) / 4.0, 0.0, 1.0);
    float underIsland = -0.42 * (1.0 - mask);
    z = wave * mask + underIsland;
  } else if (u_mode == 3) {
    float nx = (pos.x - 0.0) / 15.7;
    float nz = (-pos.y - (-7.0)) / 9.1;
    float normDist = sqrt(nx * nx + nz * nz);
    float rawMask = clamp((1.0 - normDist) / (1.0 - 0.96), 0.0, 1.0);
    float shoreMask = rawMask * rawMask * (3.0 - 2.0 * rawMask);
    bool inBridge = pos.x >= -1.65 && pos.x <= 1.65 && (-pos.y) >= 0.05 && (-pos.y) <= 11.2;
    float finalMask = inBridge ? 0.0 : shoreMask;
    z = -1.25 * (1.0 - finalMask) + (0.11 + wave * 0.12 * finalMask) * finalMask;
  } else if (u_mode == 4) {
    float wz = -pos.y;
    float seaFrontMask = clamp((-0.9 - wz) / 2.1, 0.0, 1.0);
    bool inBridge = pos.x >= -2.05 && pos.x <= 2.05 && wz >= -1.2 && wz <= 11.4;
    float finalMask = inBridge ? 0.0 : seaFrontMask;
    z = wave * finalMask + -1.2 * (1.0 - finalMask);
  } else if (u_mode == 5) {
    z = 0.0;
  } else {
    z = wave;
  }
  transformed = vec3(pos.x, pos.y, z);
}
`;

function shadowFlattenVertex(damping: string): string {
  return `vec4 _waterWorldPos = modelMatrix * vec4(transformed, 1.0);
        _waterWorldPos.y *= ${damping};
        #if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_SHADOWS > 0 )
          vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
          vec4 shadowWorldPosition;
        #endif
        #if defined( USE_SHADOWMAP )
          #if NUM_DIR_LIGHT_SHADOWS > 0
            #pragma unroll_loop_start
            for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
              shadowWorldPosition = _waterWorldPos + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
              vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
            }
            #pragma unroll_loop_end
          #endif
        #endif`;
}

export function WaterSurface() {
  const reducedMotion = useReducedMotion();
  const reducedRef = useRef(reducedMotion);
  reducedRef.current = reducedMotion;
  const meshRef = useRef<Mesh>(null);
  const matRef = useRef<MeshStandardMaterial>(null);
  const prevShaderKey = useRef('');
  const colorScratch = useRef(new Color());
  const uTimeRef = useRef({ value: 0 });
  const uAmpRef = useRef({ value: 0.3 });
  const uSpeedRef = useRef({ value: 1.0 });
  const uModeRef = useRef({ value: 0 });

  const locationId = useGameStore((s) => s.currentLocation);
  const weatherType = useGameStore((s) => s.weatherType);

  const geometry = useMemo(() => new PlaneGeometry(120, 120, 40, 40), []);
  const waterColor = useMemo(() => getWaterColorHex(locationId), [locationId]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (mesh) mesh.layers.set(0);
  }, []);

  useLayoutEffect(() => {
    const mat = matRef.current;
    if (!mat) return;
    const cave = locationId === 'cave';
    const newKey = cave
      ? 'water-cave'
      : `water-shadow-flatten${locationId === 'jungle_island' ? '-jflat' : ''}`;

    if (newKey === prevShaderKey.current) return;
    prevShaderKey.current = newKey;

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.u_time = uTimeRef.current;
      shader.uniforms.u_amp = uAmpRef.current;
      shader.uniforms.u_speed = uSpeedRef.current;
      shader.uniforms.u_mode = uModeRef.current;

      shader.vertexShader =
        `
      uniform float u_time;
      uniform float u_amp;
      uniform float u_speed;
      uniform int u_mode;
      ` +
        shader.vertexShader.replace('#include <begin_vertex>', WAVE_AFTER_BEGIN_VERTEX);

      if (!cave) {
        shader.vertexShader = shader.vertexShader.replace(
          '#include <shadowmap_vertex>',
          shadowFlattenVertex(SHADOW_WAVE_DAMPING.toFixed(2)),
        );
      }
    };
    mat.customProgramCacheKey = () => newKey;
    mat.needsUpdate = true;
  }, [locationId]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (mesh) mesh.visible = !isCabinLocation(locationId);
  }, [locationId]);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    if (isCabinLocation(locationId)) return;

    const effectiveWx =
      locationId === 'cave' || locationId === 'jungle_island' ? 'clear' : weatherType;
    const wData = getWeatherEntry(effectiveWx);

    uTimeRef.current.value = state.clock.elapsedTime;
    const rm = reducedRef.current;
    uAmpRef.current.value = rm ? wData.waveAmp * 0.08 : wData.waveAmp;
    uSpeedRef.current.value = rm ? 0 : wData.storm ? 2.5 : 1.0;
    uModeRef.current.value = WATER_MODE[locationId] ?? 0;

    const mat = mesh.material as MeshStandardMaterial;
    colorScratch.current.setHex(waterColor);
    if (locationId === 'pier') {
      const { phaseIdx, lerpT, nxt } = computeDayNightPhase(Date.now() - DAY_NIGHT_EPOCH_MS);
      const b = pierWaterBrightness(phaseIdx, lerpT, nxt.name);
      colorScratch.current.multiplyScalar(b);
    }
    mat.color.copy(colorScratch.current);
  });

  const waterReceivesShadow = locationId !== 'cave' && locationId !== 'jungle_island';

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow={waterReceivesShadow}
      geometry={geometry}
    >
      <meshStandardMaterial
        ref={matRef}
        color={waterColor}
        roughness={0.42}
        metalness={0.02}
        side={DoubleSide}
        flatShading={locationId === 'jungle_island'}
      />
    </mesh>
  );
}
