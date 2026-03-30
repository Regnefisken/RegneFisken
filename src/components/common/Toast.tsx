import { useEffect } from 'react';
import { useUIStore } from '../../store/useUIStore';

export function Toast() {
  const toastMessage = useUIStore((s) => s.toastMessage);
  const setToastMessage = useUIStore((s) => s.setToastMessage);

  useEffect(() => {
    if (!toastMessage) return;
    const t = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(t);
  }, [toastMessage, setToastMessage]);

  if (!toastMessage) return null;

  return (
    <div
      className="toast-message-legacy pointer-events-none fixed top-36 left-1/2 z-[60] flex max-w-[min(92vw,30rem)] flex-wrap items-center justify-center gap-2 rounded-full bg-red-600 text-white anim-slide-top"
      style={{ left: '50%' }}
      role="status"
      aria-live="polite"
    >
      <span className="shrink-0 select-none text-[1.05em] leading-none" aria-hidden>
        ⚠️
      </span>
      <span className="min-w-0 flex-1 text-center">{toastMessage}</span>
    </div>
  );
}
