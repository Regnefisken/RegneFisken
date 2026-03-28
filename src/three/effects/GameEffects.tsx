import { useEffect, useState } from 'react';
import { Color } from 'three';
import { Sparkles } from '@react-three/drei';
import { useUIStore } from '../../store/useUIStore.js';

/** 3D XP-glimt og level-up stjerneskær — supplement til HUD. */
export function GameEffects() {
  const worldParticleBurst = useUIStore((s) => s.worldParticleBurst);
  const [xpBurst, setXpBurst] = useState(false);
  const [levelBurst, setLevelBurst] = useState(false);

  useEffect(() => {
    let prevXp = useUIStore.getState().xpToast;
    const unsub = useUIStore.subscribe((s) => {
      if (s.xpToast && s.xpToast !== prevXp) {
        setXpBurst(true);
        window.setTimeout(() => setXpBurst(false), 700);
      }
      prevXp = s.xpToast;
    });
    return unsub;
  }, []);

  useEffect(() => {
    let prevLevel = useUIStore.getState().showLevelUp;
    const unsub = useUIStore.subscribe((s) => {
      if (s.showLevelUp != null && s.showLevelUp !== prevLevel) {
        setLevelBurst(true);
        window.setTimeout(() => setLevelBurst(false), 1400);
      }
      prevLevel = s.showLevelUp;
    });
    return unsub;
  }, []);

  return (
    <group position={[0, 0.15, -2.8]}>
      {worldParticleBurst === 'confetti' ? (
        <group position={[0, 3, 3]}>
          <Sparkles
            count={24}
            scale={3.2}
            size={2.8}
            speed={0.55}
            opacity={0.92}
            color={new Color(0xf472b6)}
          />
          <Sparkles
            count={18}
            scale={2.6}
            size={2.2}
            speed={0.45}
            opacity={0.85}
            color={new Color(0xfde047)}
          />
        </group>
      ) : null}
      {worldParticleBurst === 'levelup' ? (
        <group position={[0, 4, 8]}>
          <Sparkles count={48} scale={3.4} size={3} speed={0.5} opacity={0.92} color={new Color(0xfde047)} />
          <Sparkles count={36} scale={2.8} size={2.2} speed={0.42} opacity={0.82} color={new Color(0xf97316)} />
        </group>
      ) : null}
      {xpBurst ? (
        <Sparkles
          count={32}
          scale={2.4}
          size={2.4}
          speed={0.4}
          opacity={0.9}
          color={new Color(0xa78bfa)}
          position={[0, 3.05, 2.35]}
        />
      ) : null}
      {levelBurst ? (
        <group position={[0, 3.35, 2.15]}>
          <Sparkles count={55} scale={3.6} size={3.2} speed={0.55} opacity={0.92} color={new Color(0xfde047)} />
          <Sparkles count={40} scale={3} size={2.2} speed={0.45} opacity={0.8} color={new Color(0xf97316)} />
        </group>
      ) : null}
    </group>
  );
}
