/* Three.js-scene opdateres imperativt — R3F's `scene` er mutable runtime state. */
/* eslint-disable react-hooks/immutability -- scene.background, scene.fog */
import { useRef, useLayoutEffect, useEffect, type MutableRefObject } from 'react';
import {
  Fog,
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
import { useGameStore } from '../../store/useGameStore.js';
import {
  computeDayNightPhase,
  computeEnvironmentFrame,
  computeSkyFrame,
  usesDayNightSolidBackdrop,
} from '../logic/environment.js';
import { useUIStore } from '../../store/useUIStore.js';
import { DAY_NIGHT_EPOCH_MS } from '../logic/dayNightClock.js';

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

  const spotRef = useRef<THREESpotLight | null>(null);
  const targetRef = useRef<Object3D | null>(null);
  const caveHemiRef = useRef<HemisphereLight | null>(null);

  const shadowConfigured = useRef(false);

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

    if (!shadowConfigured.current && sunRef.current) {
      sunRef.current.shadow.mapSize.set(2048, 2048);
      sunRef.current.shadow.camera.updateProjectionMatrix();
      shadowConfigured.current = true;
    }

    const timeMs = Date.now() - DAY_NIGHT_EPOCH_MS;
    const { phaseIdx, cur } = computeDayNightPhase(timeMs);
    if (phaseIdx !== lastPhaseIdx.current) {
      const prevPhaseIdx = lastPhaseIdx.current;
      lastPhaseIdx.current = phaseIdx;
      setTimePhase(cur);
      // Legacy tickScene: onPhaseChange kun efter første fase er sat (ikke ved load).
      if (prevPhaseIdx !== -1) {
        const msg =
          cur.name === 'Morgen'
            ? '🌅 Ny dag – held og lykke!'
            : cur.name === 'Aften'
              ? '🌇 Natten falder på... mystiske fangster venter'
              : null;
        if (msg) useUIStore.getState().setDayNightToast(msg);
      }
    }

    const env = computeEnvironmentFrame({
      timeMs,
      weatherType: wx,
      locationId: locId,
      headlampOn,
    });

    const skyFrame = computeSkyFrame({ timeMs, weatherType: wx, locationId: locId }, sunDirRef.current);
    const k = 1 - Math.exp(-delta * 2.8);
    const st = skyTargetRef.current;
    st.inclination = MathUtils.lerp(st.inclination, skyFrame.inclination, k);
    st.azimuth = MathUtils.lerp(st.azimuth, skyFrame.azimuth, k);
    st.turbidity = MathUtils.lerp(st.turbidity, skyFrame.turbidity, k);
    st.rayleigh = MathUtils.lerp(st.rayleigh, skyFrame.rayleigh, k);
    st.mieCoefficient = MathUtils.lerp(st.mieCoefficient, skyFrame.mieCoefficient, k);
    st.mieDirectionalG = MathUtils.lerp(st.mieDirectionalG, skyFrame.mieDirectionalG, k);

    // Udendørs fiskesteder: Drei-himmel kun i Morgen — ellers ensfarvet døgn-bg (som legacy HTML / mole).
    const showBackdrop = usesDayNightSolidBackdrop(locId);
    const solidDayNightBackdrop = showBackdrop && phaseIdx !== 0;
    if (showBackdrop && skyFrame.enabled && !solidDayNightBackdrop) {
      scene.background = null;
    } else {
      scene.background = env.bg;
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
      const d = skyFrame.sunDirection;
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
      {showSky ? <DynamicSky valuesRef={skyTargetRef} /> : null}
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
        castShadow
      />
    </>
  );
}
