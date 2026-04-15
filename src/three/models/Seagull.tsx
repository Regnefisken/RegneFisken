import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { BufferGeometry, Float32BufferAttribute, Group } from 'three';
import type { ThreeElements } from '@react-three/fiber';
import { useFrame } from '@react-three/fiber';

export type SeagullPalette = { body: number; wing: number };

const DEFAULT_PALETTE: SeagullPalette = { body: 0xf5f5f0, wing: 0xe8e8e0 };

/** Lodret løft af hele modellen (krop + vinger) i forhold til gruppe-anchor. */
const SEAGULL_LIFT_Y = 0.07;

/**
 * Trekantet vinge-prisme i XZ: spids mod kroppen (±X), bred vingespids langs Z.
 * `mirrorX`: højre vinge — spids mod -X i lokalt rum (ind mod fuglen).
 */
function createTriangularWingPrismGeometry(
  length: number,
  tipChord: number,
  thickness: number,
  mirrorX: boolean,
): BufferGeometry {
  const halfL = length / 2;
  const zw = tipChord / 2;
  const t = thickness / 2;
  const dir = mirrorX ? -1 : 1;
  const rx = dir * halfL;
  const tx = -dir * halfL;

  const positions = new Float32Array([
    rx, -t, 0, tx, -t, -zw, tx, -t, zw,
    rx, +t, 0, tx, +t, -zw, tx, +t, zw,
  ]);

  const indices = [
    0, 2, 1,
    3, 4, 5,
    0, 1, 4, 0, 4, 3,
    0, 3, 5, 0, 5, 2,
    1, 2, 5, 1, 5, 4,
  ];

  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/** Måge — legacy `buildSeagull` med let vinge-flap. */
export function Seagull({
  palette = DEFAULT_PALETTE,
  children,
  wingFlapSpeed = 14,
  wingFlapAmplitude = 0.35,
  wingFlapSlowEnvelope = false,
  wingFlapMoodCycle = false,
  ...props
}: {
  palette?: SeagullPalette;
  children?: ReactNode;
  /** Vinge-bask frekvens (højere = hurtigere). Standard 14 som i legacy. */
  wingFlapSpeed?: number;
  /** Maks. vinkel på vingebask. */
  wingFlapAmplitude?: number;
  /** Langsom intensitetsvariation (fx NPC: ikke konstant bask). */
  wingFlapSlowEnvelope?: boolean;
  /**
   * NPC (Haps): veksler langsomt mellem næsten legacy flap (14 / 0,35) og rolig flap;
   * i rolige faser tilføjes let envelope som før.
   */
  wingFlapMoodCycle?: boolean;
} & ThreeElements['group']) {
  const wingL = useRef<Group>(null);
  const wingR = useRef<Group>(null);
  /** Integreret fase når flap-frekvens varierer (undgår runaway fra sin(t·speed(t))). */
  const wingPhaseMoodRef = useRef(0);

  const bodyMat = useMemo(
    () => ({ color: palette.body, roughness: 0.5, flatShading: false as const }),
    [palette.body],
  );
  const wingMat = useMemo(
    () => ({ color: palette.wing, roughness: 0.55, flatShading: false as const }),
    [palette.wing],
  );
  const eyeMat = useMemo(
    () => ({ color: 0x1e1e24, roughness: 0.35, flatShading: false as const }),
    [],
  );

  const wingGeoms = useMemo(
    () => ({
      l: createTriangularWingPrismGeometry(1.2, 0.35, 0.06, false),
      r: createTriangularWingPrismGeometry(1.2, 0.35, 0.06, true),
    }),
    [],
  );

  useEffect(() => {
    return () => {
      wingGeoms.l.dispose();
      wingGeoms.r.dispose();
    };
  }, [wingGeoms]);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    let flap: number;
    if (wingFlapMoodCycle) {
      const mood = 0.5 + 0.5 * Math.sin(t * 0.13);
      const speed = 3.2 + mood * 10.8;
      const baseAmp = (0.12 + mood * 0.23) * 0.9;
      wingPhaseMoodRef.current += speed * delta;
      flap = Math.sin(wingPhaseMoodRef.current) * baseAmp;
      if (mood < 0.42) {
        const env = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * 0.38)) ** 2;
        flap *= env;
      }
    } else {
      flap = Math.sin(t * wingFlapSpeed) * wingFlapAmplitude;
      if (wingFlapSlowEnvelope) {
        const env = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(t * 0.38)) ** 2;
        flap *= env;
      }
    }
    if (wingL.current) wingL.current.rotation.z = flap;
    if (wingR.current) wingR.current.rotation.z = -flap;
  });

  return (
    <group {...props}>
      <group scale={0.7} position={[0, SEAGULL_LIFT_Y, 0]}>
        <group scale={1.1}>
          <mesh castShadow>
            <sphereGeometry args={[0.25, 10, 6]} />
            <meshStandardMaterial {...bodyMat} />
          </mesh>
          <mesh position={[0, 0.2, 0.3]} castShadow>
            <sphereGeometry args={[0.14, 8, 6]} />
            <meshStandardMaterial {...bodyMat} />
          </mesh>
          <mesh position={[-0.05, 0.21, 0.415]} castShadow>
            <sphereGeometry args={[0.026, 8, 6]} />
            <meshStandardMaterial {...eyeMat} />
          </mesh>
          <mesh position={[0.05, 0.21, 0.415]} castShadow>
            <sphereGeometry args={[0.026, 8, 6]} />
            <meshStandardMaterial {...eyeMat} />
          </mesh>
          <mesh position={[0, 0.18, 0.52]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <coneGeometry args={[0.04, 0.18, 6]} />
            <meshStandardMaterial color={0xffcc40} roughness={0.4} flatShading={false} />
          </mesh>
        </group>
        <group ref={wingL} position={[-0.6, 0, 0]}>
          <mesh castShadow geometry={wingGeoms.l}>
            <meshStandardMaterial {...wingMat} />
          </mesh>
        </group>
        <group ref={wingR} position={[0.6, 0, 0]}>
          <mesh castShadow geometry={wingGeoms.r}>
            <meshStandardMaterial {...wingMat} />
          </mesh>
        </group>
        {children}
      </group>
    </group>
  );
}
