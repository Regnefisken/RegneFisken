import { useEffect } from 'react';
import { useUIStore } from '../store/useUIStore';

/** Synkroniserer skærm-/tilgængeligheds-state med `document` (root font, body-klasser). */
export function useScreenSettingsEffects() {
  const fontSize = useUIStore((s) => s.fontSize);
  const reducedMotion = useUIStore((s) => s.reducedMotion);
  const highContrast = useUIStore((s) => s.highContrast);
  const colorBlindMode = useUIStore((s) => s.colorBlindMode);

  useEffect(() => {
    const scale = fontSize / 100;
    document.documentElement.style.setProperty('--base-font-size', `${16 * scale}px`);
    document.documentElement.style.fontSize = `${16 * scale}px`;

    document.body.classList.toggle('reduce-motion', reducedMotion);
    document.body.classList.toggle('theme-high-contrast', highContrast);

    (['deuteranopia', 'protanopia', 'tritanopia'] as const).forEach((m) => {
      document.body.classList.toggle(`cvd-${m}`, colorBlindMode === m);
    });
  }, [fontSize, reducedMotion, highContrast, colorBlindMode]);
}
