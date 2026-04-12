import { useEffect, useState } from 'react';
import { useUIStore } from '../store/useUIStore.js';

export type MobileLayoutInfo = {
  /** Efter spilstart: følger `uiMode`; før start: samme heuristik som StartScreen. */
  isMobile: boolean;
  /** 768–1024px bredde (tablet-lignende). */
  isTablet: boolean;
  isPortrait: boolean;
};

function getWindowSize(): { w: number; h: number } {
  if (typeof window === 'undefined') return { w: 1920, h: 1080 };
  return { w: window.innerWidth, h: window.innerHeight };
}

function matchesSmallScreen(w: number, h: number): boolean {
  return w <= 1024 || h <= 800;
}

function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let t: ReturnType<typeof setTimeout> | null = null;
  return ((...args: unknown[]) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      t = null;
      fn(...args);
    }, ms);
  }) as T;
}

/**
 * Konsistent mobildetektering: `uiMode` efter spilstart + debounced viewport-flags.
 */
export function useIsMobile(): MobileLayoutInfo {
  const uiMode = useUIStore((s) => s.uiMode);
  const hasStarted = useUIStore((s) => s.hasStarted);
  const [size, setSize] = useState(getWindowSize);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = debounce(() => {
      setSize(getWindowSize());
    }, 150);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  const { w, h } = size;
  const isPortrait = w < h;
  const isTablet = w >= 768 && w <= 1024;
  const isSmallScreen = matchesSmallScreen(w, h);
  const isMobile = hasStarted ? uiMode === 'mobile' : isSmallScreen;

  return { isMobile, isTablet, isPortrait };
}
