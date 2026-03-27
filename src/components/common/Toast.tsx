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
      className="pointer-events-none fixed top-24 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-red-600 px-6 py-3 font-bold text-white shadow-2xl"
      style={{ animation: 'toastIn 0.25s ease-out forwards' }}
    >
      ⚠️ {toastMessage}
    </div>
  );
}
