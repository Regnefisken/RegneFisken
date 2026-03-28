import { useEffect } from 'react';
import { useUIStore } from '../../store/useUIStore';

/** Døgnrytme-besked: fast under kast-området (`top` i vh, ingen rem-cap). Ikke i justify-center-kolonne — kast-knappen hopper ikke. */
export function DayNightToast() {
  const dayNightToast = useUIStore((s) => s.dayNightToast);
  const setDayNightToast = useUIStore((s) => s.setDayNightToast);
  const uiHidden = useUIStore((s) => s.uiHidden);
  const reducedMotion = useUIStore((s) => s.reducedMotion);

  useEffect(() => {
    if (!dayNightToast) return;
    const id = window.setTimeout(() => setDayNightToast(null), 4000);
    return () => window.clearTimeout(id);
  }, [dayNightToast, setDayNightToast]);

  if (!dayNightToast || uiHidden) return null;

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 z-[25] flex justify-center px-2 ${reducedMotion ? '' : 'anim-day-night-fade'}`}
      style={{ top: '72vh' }}
      role="status"
      aria-live="polite"
    >
      <div
        className="max-w-[min(92vw,28rem)] rounded-full px-6 py-2.5 text-center text-sm font-bold tracking-wide shadow-xl"
        style={{
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.15)',
          color: 'rgba(255,255,255,0.92)',
          letterSpacing: '0.04em',
        }}
      >
        {dayNightToast}
      </div>
    </div>
  );
}
