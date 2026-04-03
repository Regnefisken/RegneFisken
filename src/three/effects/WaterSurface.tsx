import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Color, DoubleSide, MathUtils, Mesh, MeshStandardMaterial, PlaneGeometry } from 'three';
import { useFrame } from '@react-three/fiber';
import { isCabinLocation } from '../../logic/location-helpers.js';
import { useGameStore } from '../../store/useGameStore.js';
import { DAY_NIGHT_EPOCH_MS } from '../logic/dayNightClock.js';
import { computeDayNightPhase } from '../logic/environment.js';
import { getWaterColorHex, updateWaterGeometry } from '../logic/waterWaves.js';

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

/**
 * How much of the wave Y-displacement is used for shadow coordinate lookup.
 * 0 = completely flat shadow plane (no flicker), 1 = full wave (current jitter).
 */
const SHADOW_WAVE_DAMPING = 0.05;

export function WaterSurface() {
  const meshRef = useRef<Mesh>(null);
  const matRef = useRef<MeshStandardMaterial>(null);
  const colorScratch = useRef(new Color());
  const locationId = useGameStore((s) => s.currentLocation);
  const weatherType = useGameStore((s) => s.weatherType);

  const geometry = useMemo(() => new PlaneGeometry(120, 120, 40, 40), []);
  const waterColor = useMemo(() => getWaterColorHex(locationId), [locationId]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (mesh) mesh.layers.set(0);
  }, []);

  /* I grotten slår SceneEnvironment solens `castShadow` fra (performance) — så findes ingen
   * gyldig shadow map, men `receiveShadow` her ville stadig mørkne vandet. Udenfor grotte:
   * flad shadow-lookup for at undgå bølge-flimmer på skyggeplanet. */
  useLayoutEffect(() => {
    const mat = matRef.current;
    if (!mat) return;
    const cave = locationId === 'cave';
    mat.onBeforeCompile = (shader) => {
      if (cave) return;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <shadowmap_vertex>',
        `vec4 _waterWorldPos = modelMatrix * vec4(transformed, 1.0);
        _waterWorldPos.y *= ${SHADOW_WAVE_DAMPING.toFixed(2)};
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
        #endif`,
      );
    };
    mat.customProgramCacheKey = () => (cave ? 'water-cave' : 'water-shadow-flatten');
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
    updateWaterGeometry(mesh.geometry as PlaneGeometry, state.clock.elapsedTime, locationId, weatherType);

    const mat = mesh.material as MeshStandardMaterial;
    colorScratch.current.setHex(waterColor);
    if (locationId === 'pier') {
      const { phaseIdx, lerpT, nxt } = computeDayNightPhase(Date.now() - DAY_NIGHT_EPOCH_MS);
      const b = pierWaterBrightness(phaseIdx, lerpT, nxt.name);
      colorScratch.current.multiplyScalar(b);
    }
    mat.color.copy(colorScratch.current);
  });

  /* jungle_island: stor sand-cylinder kaster ellers en mørk cirkel på vandet (shadow map). */
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
      />
    </mesh>
  );
}
