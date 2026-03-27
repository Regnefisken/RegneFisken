import { useEffect, useState } from 'react';
import { Color } from 'three';
import { Sparkles } from '@react-three/drei';
import { useUIStore } from '../../store/useUIStore.js';
import { useGameStore } from '../../store/useGameStore.js';

/** 3D XP-glimt, level-up stjerneskær og vand-plask — supplement til HUD. */
export function GameEffects() {
  const [xpBurst, setXpBurst] = useState(false);
  const [levelBurst, setLevelBurst] = useState(false);
  const [splashBurst, setSplashBurst] = useState(false);

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

  useEffect(() => {
    let prevGs = useGameStore.getState().gameState;
    const unsub = useGameStore.subscribe((s) => {
      if (prevGs === 'casting' && s.gameState === 'waiting') {
        setSplashBurst(true);
        window.setTimeout(() => setSplashBurst(false), 450);
      }
      prevGs = s.gameState;
    });
    return unsub;
  }, []);

  return (
    <group position={[0, 0.15, -2.8]}>
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
      {splashBurst ? (
        <Sparkles
          count={22}
          scale={0.55}
          size={1.2}
          speed={0.65}
          opacity={0.95}
          color={new Color(0x7dd3fc)}
          position={[0, 0.05, 0.15]}
        />
      ) : null}
    </group>
  );
}
