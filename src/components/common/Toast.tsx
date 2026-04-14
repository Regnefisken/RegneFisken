import { useEffect } from 'react';
import { useUIStore } from '../../store/useUIStore';

const TOAST_MS = 8000;

export function Toast() {
  const toastMessage = useUIStore((s) => s.toastMessage);
  const toastTone = useUIStore((s) => s.toastTone);
  const setToastMessage = useUIStore((s) => s.setToastMessage);

  useEffect(() => {
    if (!toastMessage) return;
    const t = window.setTimeout(() => setToastMessage(null), TOAST_MS);
    return () => window.clearTimeout(t);
  }, [toastMessage, setToastMessage]);

  if (!toastMessage) return null;

  const weather = toastTone === 'weather';

  return (
    <div
      className={`toast-message-legacy pointer-events-none fixed top-36 left-1/2 z-[60] flex max-w-[min(92vw,30rem)] flex-wrap items-center justify-center gap-2 rounded-full anim-slide-top ${
        weather
          ? 'toast-tone-weather bg-red-600 text-white'
          : 'toast-tone-positive bg-emerald-200 text-emerald-950'
      }`}
      style={{ left: '50%' }}
      role="status"
      aria-live="polite"
    >
      {weather && (
        <span className="shrink-0 select-none text-[1.05em] leading-none" aria-hidden>
          ⚠️
        </span>
      )}
      <span className="min-w-0 flex-1 text-center">{toastMessage}</span>
    </div>
  );
}
