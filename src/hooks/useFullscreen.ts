import { useCallback, useEffect } from 'react';
import { useUIStore } from '../store/useUIStore.js';

function fullscreenElement(): Element | null {
  return (
    document.fullscreenElement ??
    (document as Document & { webkitFullscreenElement?: Element | null }).webkitFullscreenElement ??
    null
  );
}

/** Fuldskærm mod #root — matcher legacy `toggleFullscreen` + change-events. */
export function useFullscreen() {
  const isFullscreen = useUIStore((s) => s.isFullscreen);
  const setIsFullscreen = useUIStore((s) => s.setIsFullscreen);

  useEffect(() => {
    const sync = () => setIsFullscreen(!!fullscreenElement());
    sync();
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync as EventListener);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync as EventListener);
    };
  }, [setIsFullscreen]);

  const toggle = useCallback(() => {
    const el = document.getElementById('root');
    if (!el) return;
    const fs = !!fullscreenElement();
    if (!fs) {
      if (el.requestFullscreen) void el.requestFullscreen().catch(() => {});
      else
        (el as unknown as { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen?.();
    } else {
      if (document.exitFullscreen) void document.exitFullscreen().catch(() => {});
      else (document as Document & { webkitExitFullscreen?: () => void }).webkitExitFullscreen?.();
    }
  }, []);

  return { isFullscreen, toggle };
}
