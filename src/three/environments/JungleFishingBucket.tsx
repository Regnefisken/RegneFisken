import { useEffect, useMemo } from 'react';
import { ConeGeometry, CylinderGeometry, DoubleSide, SphereGeometry } from 'three';

type JungleFishingBucketProps = {
  position: [number, number, number];
};

export function JungleFishingBucket({ position }: JungleFishingBucketProps) {
  const { poleGeo, canopyGeo, finialGeo } = useMemo(() => {
    const pole = new CylinderGeometry(0.03, 0.035, 2.2, 8);
    const canopy = new ConeGeometry(1.1, 0.45, 8);
    const finial = new SphereGeometry(0.05, 8, 6);
    return { poleGeo: pole, canopyGeo: canopy, finialGeo: finial };
  }, []);

  useEffect(
    () => () => {
      poleGeo.dispose();
      canopyGeo.dispose();
      finialGeo.dispose();
    },
    [poleGeo, canopyGeo, finialGeo],
  );

  return (
    <group position={position} userData={{ jungleInteract: 'fish' }}>
      <mesh geometry={poleGeo} position={[0, 1.1, 0]} castShadow>
        <meshStandardMaterial color={0x8b6914} roughness={0.75} metalness={0.05} />
      </mesh>
      <mesh geometry={canopyGeo} position={[0, 2.0, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={0xe8443a} roughness={0.6} metalness={0.0} side={DoubleSide} />
      </mesh>
      <mesh geometry={finialGeo} position={[0, 2.25, 0]}>
        <meshStandardMaterial color={0xffd700} roughness={0.3} metalness={0.7} />
      </mesh>
    </group>
  );
}
