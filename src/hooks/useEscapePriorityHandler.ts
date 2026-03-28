import { useEffect } from 'react';
import { useMathStore } from '../store/useMathStore';
import { useUIStore } from '../store/useUIStore';

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
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
