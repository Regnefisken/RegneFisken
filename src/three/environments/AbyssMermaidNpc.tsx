import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import type { Group as ThreeGroup } from 'three';
import { MathUtils } from 'three';
import { useAudio } from '../../audio/useAudio';
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

    /* Legacy tickScene: let svaj på hele gruppen */
    g.rotation.z = Math.sin(t * 0.8) * 0.015;

    const targetScale = hovered ? (d.hoverScale ?? 1.08) : (d.originalScale ?? 1.0);
    g.scale.setScalar(MathUtils.lerp(g.scale.x, targetScale, 0.12));

    /* Follow-up: hale, hår, krop */
    if (d.haleTop) {
      d.haleTop.rotation.z = Math.sin(t * 0.8) * 0.12;
    }
    if (d.haarGroup) {
      d.haarGroup.rotation.z = Math.sin(t * 0.6 + (d.timeOffset ?? 0)) * 0.08;
    }
    if (d.havfrue) {
      d.havfrue.position.y = 1.7 + Math.sin(t * 0.5) * 0.02;
    }
  });

  if (level < 17) {
    return (
      <group position={[-11.43, -0.3, -5.76]}>
        <primitive object={stoneOnly} />
      </group>
    );
  }

  return (
    <group position={[-11.43, -0.3, -5.76]} rotation={[0, Math.PI * 0.3, 0]}>
      <primitive
        ref={ref}
        object={mermaid}
        onPointerDown={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          play('ui');
          setShowCollectibleModal('pearl');
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      />
    </group>
  );
}
