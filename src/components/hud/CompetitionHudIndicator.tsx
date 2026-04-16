import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';

const DURATION_MS = 30 * 60 * 1000;

/**
 * Live HUD under streak/spand: konkurrence-fangster + resterende tid.
 * Vises kun når en konkurrence er startet (session); skjules ved nulstil eller ny sideindlæsning.
 * Efter udløb: 0:00 og frossent fangsttal (til lærer-runde).
 */
export function CompetitionHudIndicator() {
  const startedAt = useGameStore((s) => s.competitionStartedAt);
  const catches = useGameStore((s) => s.competitionCatches);
  const finished = useGameStore((s) => s.competitionFinished);

  const [timeStr, setTimeStr] = useState('30:00');

  useEffect(() => {
    if (startedAt === null) return;
    if (finished) {
      setTimeStr('0:00');
      return;
    }
    const tick = () => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, DURATION_MS - elapsed);
      const min = Math.floor(remaining / 60000);
      const sec = Math.floor((remaining % 60000) / 1000);
      setTimeStr(`${min}:${sec.toString().padStart(2, '0')}`);
      if (remaining <= 0) {
        useGameStore.getState().setCompetitionFinished(true);
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [startedAt, finished]);

  if (startedAt === null) return null;

  const timeDisplay = finished ? '0:00' : timeStr;

  return (
    <div
      className={`flex w-full flex-col gap-1 rounded-2xl border px-3 py-2 text-xs font-bold shadow-lg ${
        finished
          ? 'border-red-500/60 bg-red-950/75 text-red-100'
          : 'border-sky-500/50 bg-sky-950/80 text-sky-100'
      }`}
      role="status"
      aria-live="polite"
      aria-label={`Konkurrence: ${timeDisplay} tilbage, ${catches} fangster`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1">
        <span className="tracking-wide uppercase opacity-90">🐟 Konkurrence</span>
        <span
          className={`font-mono text-sm tabular-nums ${finished ? 'text-red-300' : 'text-sky-200'}`}
        >
          {timeDisplay}
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-white/70">
          Fangster
        </span>
        <span className="font-mono text-base tabular-nums text-amber-200">{catches}</span>
      </div>
    </div>
  );
}
