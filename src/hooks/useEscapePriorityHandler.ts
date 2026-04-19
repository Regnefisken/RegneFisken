import { useEffect } from 'react';
import { markJungleChestParchmentSeen } from '../logic/jungle-chest-reveal';
import { useGameStore } from '../store/useGameStore';
import { useMathStore } from '../store/useMathStore';
import { useUIStore } from '../store/useUIStore';
import { requestGameCanvasPointerLock } from '../utils/requestGameCanvasPointerLock';

/** Escape lukker én modal ad gangen (legacy-rækkefølge). */
export function useEscapePriorityHandler() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const u = useUIStore.getState();
      if (u.isBagOpen) {
        u.setIsBagOpen(false);
        e.preventDefault();
        return;
      }
      if (u.showKisteMenu) {
        u.setShowKisteMenu(false);
        e.preventDefault();
        return;
      }
      const g = useGameStore.getState();
      if (g.gameState === 'shop' || g.gameState === 'goals') {
        g.setGameState('idle');
        e.preventDefault();
        return;
      }
      if (u.showScreenSettings) {
        u.setShowScreenSettings(false);
        e.preventDefault();
        return;
      }
      if (u.showSettingsMenu) {
        u.setShowSettingsMenu(false);
        e.preventDefault();
        return;
      }
      const m = useMathStore.getState();
      if (m.showMathSettings) {
        m.setShowMathSettings(false);
        e.preventDefault();
        return;
      }
      if (u.showNavPicker) {
        u.setShowNavPicker(false);
        e.preventDefault();
        return;
      }
      if (u.showCreditsOverlay) {
        u.setShowCreditsOverlay(false);
        e.preventDefault();
        return;
      }
      if (u.showAboutModal) {
        u.setShowAboutModal(false);
        e.preventDefault();
        return;
      }
      if (u.showContactModal) {
        u.setShowContactModal(false);
        e.preventDefault();
        return;
      }
      if (u.showJungleChestParchmentModal) {
        markJungleChestParchmentSeen();
        u.setShowJungleChestParchmentModal(false);
        requestGameCanvasPointerLock();
        e.preventDefault();
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
