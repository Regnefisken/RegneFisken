import { useMemo, useRef } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { useFrame } from '@react-three/fiber';
import {
  DodecahedronGeometry,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  type Group as ThreeGroup,
} from 'three';
import { useAudio } from '../../audio/useAudio.js';
import { buildPirateChestMesh } from '../meshes/pirate-chest-mesh.js';
import { buildPirateMesh } from '../meshes/pirate-mesh.js';
import { usePlayerStore } from '../../store/usePlayerStore.js';
import { useUIStore } from '../../store/useUIStore.js';

function buildPirateRockGroup(): ThreeGroup {
  const rockGeo = new DodecahedronGeometry(2.5, 3);
  const rpos = rockGeo.attributes.position;
  const seed = 42;
  for (let i = 0; i < rpos.count; i++) {
    const px = rpos.getX(i);
    const py = rpos.getY(i);
    const pz = rpos.getZ(i);
    const n = Math.sin(px * 3.1 + seed) * Math.cos(py * 2.7) * Math.sin(pz * 4.3 + seed * 0.5);
    const noise = 1 + n * 0.18;
    rpos.setXYZ(i, px * noise, py * noise, pz * noise);
  }
  rockGeo.computeVertexNormals();
  const rockMat = new MeshStandardMaterial({
    color: 0x4a4a5a,
    roughness: 0.95,
    flatShading: true,
  });
  const rock = new Mesh(rockGeo, rockMat);
  rock.scale.set(1.1, 0.65, 1.0);
  const mossMat = new MeshStandardMaterial({ color: 0x3d5c3a, roughness: 1, flatShading: true });
  const mossGeo = new DodecahedronGeometry(2.52, 2);
  const mossPos = mossGeo.attributes.position;
  for (let i = 0; i < mossPos.count; i++) {
    const py = mossPos.getY(i);
    const scale = py > 0.5 ? 1 + Math.sin(i * 1.7) * 0.04 : 0.3;
    mossPos.setXYZ(
      i,
      mossPos.getX(i) * scale,
      mossPos.getY(i) * scale,
      mossPos.getZ(i) * scale,
    );
  }
  mossGeo.computeVertexNormals();
  const moss = new Mesh(mossGeo, mossMat);
  moss.scale.copy(rock.scale);
  const g = new Group();
  g.add(rock, moss);
  return g;
}

/** Pirat, klippe, skattekiste — Den Forbudte Sø. */
export function ForbiddenSeaNpcs() {
  const { play } = useAudio();
  const cheeseSources = usePlayerStore((s) => s.cheeseSources);
  const setCheeseSources = usePlayerStore((s) => s.setCheeseSources);
  const setToastMessage = useUIStore((s) => s.setToastMessage);
  const setShowCollectibleModal = useUIStore((s) => s.setShowCollectibleModal);

  const pirateObj = useMemo(() => buildPirateMesh(), []);
  const chestObj = useMemo(
    () => (cheeseSources.includes('pirate_chest') ? null : buildPirateChestMesh()),
    [cheeseSources],
  );
  const rockObj = useMemo(() => buildPirateRockGroup(), []);

  const pirateRef = useRef<ThreeGroup | null>(null);
  const chestRef = useRef<ThreeGroup | null>(null);

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    /* Lokal Y: parent har world y = 1.642 — legacy: 1.642 + sin(t*1.2)*0.04 */
    if (chestRef.current) {
      chestRef.current.position.y = Math.sin(time * 1.2) * 0.04;
    }
    const root = pirateRef.current;
    if (root?.userData?.torso) {
      const d = root.userData;
      const t = time + (d.timeOffset ?? 0);
      d.torso.position.y = 2.2 + Math.sin(t * 1.8) * 0.028;
      d.headGroup.position.y = 3.4 + Math.sin(t * 1.8) * 0.022;
      d.headGroup.rotation.y = Math.sin(t * 0.55) * 0.15;
      d.hatGroup.position.y = 0.85 + Math.sin(t * 2.6) * 0.006;
      d.armR.rotation.x = -0.7 + Math.sin(t * 1.5) * 0.04;
      d.armL.rotation.x = -0.2 + Math.sin(t * 1.5 + 1.0) * 0.04;
      const targetScale = d.isHovered ? d.hoverScale : d.originalScale;
      root.scale.setScalar(MathUtils.lerp(root.scale.x, targetScale, 0.12));
    }
  });

  return (
    <group>
      <group position={[5.2, -0.15, 3.5]}>
        <primitive object={rockObj} />
      </group>
      <group position={[5.2, 1.35, 3.5]} rotation={[0, -Math.PI * 0.15, 0]}>
        <primitive
          ref={pirateRef}
          object={pirateObj}
          onPointerOver={(e: ThreeEvent<PointerEvent>) => {
            e.stopPropagation();
            pirateObj.userData.isHovered = true;
          }}
          onPointerOut={(e: ThreeEvent<PointerEvent>) => {
            e.stopPropagation();
            pirateObj.userData.isHovered = false;
          }}
          onPointerDown={(e: ThreeEvent<PointerEvent>) => {
            e.stopPropagation();
            play('ui');
            setShowCollectibleModal('fossil');
          }}
        />
      </group>
      {chestObj ? (
        <group position={[5.529, 1.642, 4.401]} rotation={[0, Math.PI * 0.8, 0]} scale={1.4}>
          <primitive
            ref={chestRef}
            object={chestObj}
            onPointerDown={(e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation();
              if (cheeseSources.includes('pirate_chest')) return;
              play('coin');
              setCheeseSources((p) => (p.includes('pirate_chest') ? p : [...p, 'pirate_chest']));
              setToastMessage('🧀 Du fandt ost i skattekisten!');
            }}
          />
        </group>
      ) : null}
    </group>
  );
}

export default ForbiddenSeaNpcs;
