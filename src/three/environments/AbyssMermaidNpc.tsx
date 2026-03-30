import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import type { Group as ThreeGroup } from 'three';
import { MathUtils } from 'three';
import { useAudio } from '../../audio/useAudio.js';
import { buildMermaidNpcMesh, createMermaidStone } from '../meshes/mermaid-mesh.js';
import { usePlayerStore } from '../../store/usePlayerStore.js';
import { useUIStore } from '../../store/useUIStore.js';

/** Havfrue sten / NPC ved Dybet — legacy `abyss`-spawn + idle som `tickScene` / follow-up. */
export function AbyssMermaidNpc() {
  const { play } = useAudio();
  const level = usePlayerStore((s) => s.progression.level);
  const setShowCollectibleModal = useUIStore((s) => s.setShowCollectibleModal);

  const stoneOnly = useMemo(() => createMermaidStone(), []);
  const mermaidBuilt = useMemo(() => buildMermaidNpcMesh(), []);
  const mermaid = mermaidBuilt.model;

  const ref = useRef<ThreeGroup | null>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g?.userData?.isMermaidNPC || level < 17) return;

    const time = clock.elapsedTime;
    const d = g.userData as {
      timeOffset?: number;
      havfrue?: ThreeGroup;
      haarGroup?: ThreeGroup;
      haleTop?: { rotation: { z: number } };
      originalScale?: number;
      hoverScale?: number;
    };
    const t = time + (d.timeOffset ?? 0);

    /* Havfruen sidder stille på stenen — ingen hel-gruppe svaj */

    const targetScale = hovered ? (d.hoverScale ?? 1.08) : (d.originalScale ?? 1.0);
    g.scale.setScalar(MathUtils.lerp(g.scale.x, targetScale, 0.12));

    /* Follow-up: hale, hår, krop */
    if (d.haleTop) {
      d.haleTop.rotation.z = Math.sin(t * 0.8) * 0.12;
    }
    if (d.haarGroup) {
      d.haarGroup.rotation.z = Math.sin(t * 0.6 + (d.timeOffset ?? 0)) * 0.015;
    }
    if (d.havfrue) {
      d.havfrue.position.y = 1.7 + Math.sin(t * 0.5) * 0.02;
    }
  });

  const MERMAID_POS: [number, number, number] = [-6.35, -0.3, 1.45];
  const FACE_BUCKET_Y = Math.atan2(1.1 - MERMAID_POS[0], 8.8 - MERMAID_POS[2]);

  if (level < 17) {
    return (
      <group position={MERMAID_POS} rotation={[0, FACE_BUCKET_Y, 0]}>
        <primitive object={stoneOnly} />
      </group>
    );
  }

  return (
    <group position={MERMAID_POS} rotation={[0, FACE_BUCKET_Y, 0]}>
      {/* Invisible hitbox for reliable click detection */}
      <mesh
        position={[0, 1.5, 0]}
        onPointerDown={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          play('ui');
          setShowCollectibleModal('pearl');
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[2.2, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <primitive ref={ref} object={mermaid} />
    </group>
  );
}
