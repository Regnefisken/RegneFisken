import { useEffect } from 'react';
import { useUIStore } from '../../store/useUIStore';

const CONFETTI_COLORS = [
  '#fde68a',
  '#f87171',
  '#86efac',
  '#7dd3fc',
  '#c4b5fd',
  '#fb923c',
  '#f472b6',
];

/** Legacy: legacy-game.html showCreditsOverlay — konfetti + boks, auto-luk 7s */
export function CreditsOverlay() {
  const show = useUIStore((s) => s.showCreditsOverlay);
  const setShowCreditsOverlay = useUIStore((s) => s.setShowCreditsOverlay);

  useEffect(() => {
    if (!show) return;
    const t = window.setTimeout(() => setShowCreditsOverlay(false), 7000);
    return () => clearTimeout(t);
  }, [show, setShowCreditsOverlay]);

  if (!show) return null;

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[999999] flex cursor-pointer items-center justify-center"
      style={{ background: 'rgba(5,10,28,0.80)' }}
      onClick={() => setShowCreditsOverlay(false)}
      onKeyDown={(e) => e.key === 'Escape' && setShowCreditsOverlay(false)}
      role="presentation"
    >
      {[...Array(40)].map((_, i) => {
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        const left = (i * 2.5) % 100;
        const delay = (i * 0.15) % 6;
        const dur = 3 + (i % 4);
        const size = 6 + (i % 8);
        const borderRadius = i % 3 === 0 ? '50%' : i % 3 === 1 ? '2px' : '0';
        return (
          <div
            key={i}
            className="pointer-events-none absolute top-[-20px] z-[1]"
            style={{
              left: `${left}%`,
              width: size,
              height: size,
              background: color,
              borderRadius,
              animation: `confettiFall ${dur}s ${delay}s linear infinite`,
            }}
          />
        );
      })}
      <div
        className="relative z-[2] cursor-default rounded-3xl border-2 border-amber-400/85 px-16 py-10 text-center shadow-2xl"
        style={{
          background: '#0f172a',
          animation: 'creditsBoxIn 0.35s ease-out forwards',
          boxShadow: '0 0 80px rgba(234,179,8,0.5), 0 30px 60px rgba(0,0,0,0.95)',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Credits"
      >
        <div className="mb-3 text-[2.8rem]">🏆</div>
        <p
          className="text-[1.75rem] font-black tracking-wide text-amber-200"
          style={{ textShadow: '0 0 20px rgba(234,179,8,0.8)' }}
        >
          Anders E. D. Larsen
        </p>
        <p className="mt-2.5 text-[0.95rem] text-slate-400">Skabt med kærlighed ❤️</p>
        <p className="mt-5 text-[0.75rem] text-slate-600">Klik for at lukke</p>
      </div>
    </div>
  );
}
