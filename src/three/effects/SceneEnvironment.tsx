/* Three.js-scene opdateres imperativt — R3F's `scene` er mutable runtime state. */
/* eslint-disable react-hooks/immutability -- scene.background, scene.fog */
import { useRef, useLayoutEffect, useEffect, type MutableRefObject } from 'react';
import {
  Fog,
  Group,
  SpotLight as THREESpotLight,
  Object3D,
  Vector3,
  MathUtils,
  type ShaderMaterial,
  type DirectionalLight,
  type AmbientLight,
  type HemisphereLight,
} from 'three';
import { Sky, calcPosFromAngles } from '@react-three/drei';
import { Sky as SkyImpl } from 'three-stdlib';
import { useFrame, useThree } from '@react-three/fiber';
import type { GraphicsQuality } from '../../types/game.js';
import { useGameStore } from '../../store/useGameStore.js';
import {
  computeDayNightPhase,
  computeEnvironmentFrame,
  computeNightSkyOpacity,
  computeSkyFrame,
  NIGHT_SKY_DREI_THRESHOLD,
  usesDayNightSolidBackdrop,
} from '../logic/environment.js';
import { DAY_NIGHT_EPOCH_MS } from '../logic/dayNightClock.js';
import { useUIStore } from '../../store/useUIStore.js';

const SKY_PATCHED = '__skyExposurePatched';

/**
 * Patches the Drei Sky ShaderMaterial so it applies its own ACES filmic
 * tonemapping at a separate sky-specific exposure level, decoupled from
 * the renderer's global `toneMappingExposure`.
 */
function patchSkyShader(mat: ShaderMaterial): void {
  if ((mat as unknown as Record<string, boolean>)[SKY_PATCHED]) return;

  mat.toneMapped = false;
  mat.uniforms.uSkyExposure = { value: useUIStore.getState().skyExposure };

  mat.fragmentShader =
    'uniform float uSkyExposure;\n' + mat.fragmentShader;

  mat.fragmentShader = mat.fragmentShader.replace(
    'gl_FragColor = vec4( retColor, 1.0 );',
    [
      'vec3 _se = retColor * uSkyExposure;',
      '_se = (_se * (2.51 * _se + 0.03)) / (_se * (2.43 * _se + 0.59) + 0.14);',
      'gl_FragColor = vec4(_se, 1.0);',
    ].join('\n'),
  );

  mat.needsUpdate = true;
  (mat as unknown as Record<string, boolean>)[SKY_PATCHED] = true;
}

function configureSunShadow(light: DirectionalLight, quality: GraphicsQuality): void {
  const mapSize = quality === 'low' ? 1024 : quality === 'medium' ? 2048 : 4096;

  const sh = light.shadow;
  if (sh.map && (sh.mapSize.x !== mapSize || sh.mapSize.y !== mapSize)) {
    sh.map.dispose();
    sh.map = null;
  }
  sh.mapSize.set(mapSize, mapSize);
  sh.bias = 0;
  sh.normalBias = 0;
  sh.radius = 1;
  const sc = sh.camera;
  sc.left = -18;
  sc.right = 18;
  sc.top = 18;
  sc.bottom = -18;
  sc.near = 0.5;
  sc.far = 90;
  sc.updateProjectionMatrix();
}

type SkyUniformsRef = MutableRefObject<{
  inclination: number;
  azimuth: number;
  turbidity: number;
  rayleigh: number;
  mieCoefficient: number;
  mieDirectionalG: number;
}>;

/** Synkroniserer Drei-Sky shader-uniforms fra smoothed ref (hvert frame). */
function DynamicSky({ valuesRef }: { valuesRef: SkyUniformsRef }) {
  const meshRef = useRef<SkyImpl>(null);
  const sunScratch = useRef(new Vector3());

  useFrame(() => {
    const mesh = meshRef.current;
    const mat = mesh?.material as ShaderMaterial | undefined;
    if (!mat?.uniforms) return;

    patchSkyShader(mat);
    mat.uniforms.uSkyExposure.value = useUIStore.getState().skyExposure;

    const v = valuesRef.current;
    mat.uniforms.turbidity.value = v.turbidity;
    mat.uniforms.rayleigh.value = v.rayleigh;
    mat.uniforms.mieCoefficient.value = v.mieCoefficient;
    mat.uniforms.mieDirectionalG.value = v.mieDirectionalG;
    calcPosFromAngles(v.inclination, v.azimuth, sunScratch.current);
    mat.uniforms.sunPosition.value.copy(sunScratch.current);
  });

  return <Sky ref={meshRef} distance={450000} />;
}

/** Baggrund, tåge, døgnlys, vejr, Drei-Sky — synkroniserer `timePhase` i Zustand ved faseskift. */
export function SceneEnvironment() {
  const { scene, camera } = useThree();
  const locationId = useGameStore((s) => s.currentLocation);
  const setTimePhase = useGameStore((s) => s.setTimePhase);

  const sunRef = useRef<DirectionalLight>(null);
  const ambRef = useRef<AmbientLight>(null);
  const lastPhaseIdx = useRef(-1);
  const nightFallToastSentRef = useRef(false);
  const morningToastSentRef = useRef(false);

  const spotRef = useRef<THREESpotLight | null>(null);
  const targetRef = useRef<Object3D | null>(null);
  const caveHemiRef = useRef<HemisphereLight | null>(null);

  const appliedSunShadowQuality = useRef<GraphicsQuality | null>(null);
  const graphicsQuality = useUIStore((s) => s.graphicsQuality);

  const skyTargetRef = useRef({
    inclination: 0.55,
    azimuth: 0.25,
    turbidity: 8,
    rayleigh: 0.45,
    mieCoefficient: 0.005,
    mieDirectionalG: 0.8,
  });
  const sunDirRef = useRef(new Vector3(0, 1, 0));
  const lightDist = 42;
  const dreiSkyGroupRef = useRef<Group>(null);
  const prevLocRef = useRef(locationId);

  useLayoutEffect(() => {
    const spot = new THREESpotLight(0xfff5cc, 0);
    /* Bred kegle + lang rækkevidde: mørke grotte-meshes skal få diffust lys (ikke kun partikler). */
    spot.angle = Math.PI / 2.65;
    spot.penumbra = 0.5;
    spot.distance = 130;
    spot.decay = 1.0;
    const target = new Object3D();
    target.position.set(0, 0, -12);
    camera.add(spot);
    camera.add(target);
    spot.target = target;
    spotRef.current = spot;
    targetRef.current = target;
    return () => {
      camera.remove(spot);
      camera.remove(target);
    };
  }, [camera]);

  useEffect(() => {
    scene.fog = new Fog(0x87ceeb, 20, 60);
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  const showSky = usesDayNightSolidBackdrop(locationId);

  useFrame((_, delta) => {
    /* Zustand-værdier skal læses her — ikke fra React-closure: R3F useFrame kan ellers beholde forældet headlampOn. */
    const { headlampOn, currentLocation: locId, weatherType: wx } = useGameStore.getState();

    if (sunRef.current && appliedSunShadowQuality.current !== graphicsQuality) {
      configureSunShadow(sunRef.current, graphicsQuality);
      appliedSunShadowQuality.current = graphicsQuality;
    }

    const timeMs = Date.now() - DAY_NIGHT_EPOCH_MS;
    const { phaseIdx, cur, nxt, lerpT } = computeDayNightPhase(timeMs);
    const nightSkyOp = computeNightSkyOpacity(cur.name, nxt.name, lerpT);
    if (phaseIdx !== lastPhaseIdx.current) {
      const prevPhaseIdx = lastPhaseIdx.current;
      lastPhaseIdx.current = phaseIdx;
      setTimePhase(cur);
      // Legacy tickScene: onPhaseChange kun efter første fase er sat (ikke ved load).
      if (prevPhaseIdx !== -1 && cur.name === 'Morgen' && !morningToastSentRef.current) {
        morningToastSentRef.current = true;
        useUIStore.getState().setDayNightToast('🌅 Ny dag – held og lykke!');
      }
    }

    /* Backup: ved cycle-wrap kan nogle frames springe phaseIdx — trig ved slutning af Nat→Morgen. */
    if (
      cur.name === 'Nat' &&
      nxt.name === 'Morgen' &&
      lerpT >= 0.985 &&
      !morningToastSentRef.current
    ) {
      morningToastSentRef.current = true;
      useUIStore.getState().setDayNightToast('🌅 Ny dag – held og lykke!');
    }

    if (cur.name === 'Aften' || cur.name === 'Dag') {
      morningToastSentRef.current = false;
    }
    if (cur.name === 'Dag' || cur.name === 'Morgen') {
      nightFallToastSentRef.current = false;
    }
    if (
      lastPhaseIdx.current !== -1 &&
      cur.name === 'Aften' &&
      nxt.name === 'Nat' &&
      lerpT >= 0.9 &&
      !nightFallToastSentRef.current
    ) {
      nightFallToastSentRef.current = true;
      useUIStore.getState().setDayNightToast('🌇 Natten falder på...');
    }

    const env = computeEnvironmentFrame({
      timeMs,
      weatherType: wx,
      locationId: locId,
      headlampOn,
    });

    const skyFrame = computeSkyFrame({ timeMs, weatherType: wx, locationId: locId }, sunDirRef.current);
    const prevLoc = prevLocRef.current;
    prevLocRef.current = locId;
    const snapSky = prevLoc !== locId && !usesDayNightSolidBackdrop(prevLoc);
    const k = snapSky ? 1 : 1 - Math.exp(-delta * 2.8);
    const st = skyTargetRef.current;
    st.inclination = MathUtils.lerp(st.inclination, skyFrame.inclination, k);
    st.azimuth = MathUtils.lerp(st.azimuth, skyFrame.azimuth, k);
    st.turbidity = MathUtils.lerp(st.turbidity, skyFrame.turbidity, k);
    st.rayleigh = MathUtils.lerp(st.rayleigh, skyFrame.rayleigh, k);
    st.mieCoefficient = MathUtils.lerp(st.mieCoefficient, skyFrame.mieCoefficient, k);
    st.mieDirectionalG = MathUtils.lerp(st.mieDirectionalG, skyFrame.mieDirectionalG, k);

    /* Samme vinkel som Drei-Sky (udglattet) — ellers hopper skygger med rå `skyFrame.sunDirection`. */
    calcPosFromAngles(st.inclination, st.azimuth, sunDirRef.current);

    const showBackdrop = usesDayNightSolidBackdrop(locId);
    const solidStarfieldBackdrop = showBackdrop && nightSkyOp > NIGHT_SKY_DREI_THRESHOLD;
    if (showBackdrop && skyFrame.enabled && !solidStarfieldBackdrop) {
      scene.background = null;
    } else {
      scene.background = env.bg;
    }

    const g = dreiSkyGroupRef.current;
    if (g) {
      g.visible = showBackdrop && nightSkyOp <= NIGHT_SKY_DREI_THRESHOLD;
    }

    const fog = scene.fog;
    if (fog instanceof Fog) {
      fog.color.copy(env.fogColor);
      fog.near = env.fogNear;
      fog.far = env.fogFar;
    }

    if (sunRef.current) {
      sunRef.current.color.copy(env.sunColor);
      sunRef.current.intensity = env.sunIntensity;
      const d = sunDirRef.current;
      sunRef.current.position.set(d.x * lightDist, d.y * lightDist, d.z * lightDist);
    }
    if (ambRef.current) {
      ambRef.current.intensity = env.ambIntensity;
      ambRef.current.color.copy(env.ambColor);
    }

    const spot = spotRef.current;
    if (spot) {
      spot.intensity = env.caveSpotIntensity;
    }
    const hemi = caveHemiRef.current;
    if (hemi) {
      hemi.intensity = env.caveHemiIntensity;
    }
  });

  return (
    <>
      {showSky ? (
        <group ref={dreiSkyGroupRef}>
          <DynamicSky valuesRef={skyTargetRef} />
        </group>
      ) : null}
      {/* Grotte: fyldlys når pandelampe er tændt — styres i useFrame via caveHemiIntensity */}
      <hemisphereLight
        ref={caveHemiRef}
        args={[0xb8c8d8, 0x2c2824, 0]}
        position={[0, 6, 0]}
      />
      <ambientLight ref={ambRef} color={0xffffff} />
      <directionalLight
        ref={sunRef}
        color={0xffdfba}
        intensity={1.35}
        position={[15, 20, 10]}
        castShadow={graphicsQuality !== 'low'}
      />
    </>
  );
}
