import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';

const DURATION_MS = 30 * 60 * 1000;

type CompetitionHudIndicatorProps = {
  /** Mobil over rejse-knap: samme bredde som kort-knappen; indhold stables lodret. */
  narrowStack?: boolean;
};

/**
 * Live HUD under streak/spand: konkurrence-fangster + resterende tid.
 * Vises kun når en konkurrence er startet (session); skjules ved nulstil eller ny sideindlæsning.
 * Efter udløb: 0:00 og frossent fangsttal (til lærer-runde).
 */
export function CompetitionHudIndicator({ narrowStack = false }: CompetitionHudIndicatorProps) {
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

  const shellClass = `flex w-full flex-col rounded-2xl border font-bold shadow-lg ${
    finished
      ? 'border-red-500/60 bg-red-950/75 text-red-100'
      : 'border-sky-500/50 bg-sky-950/80 text-sky-100'
  }`;

  if (narrowStack) {
    return (
      <div
        className={`${shellClass} gap-2 px-2 py-2.5 text-[0.62rem] leading-tight`}
        role="status"
        aria-live="polite"
        aria-label={`Konkurrence: ${timeDisplay} tilbage, ${catches} fangster`}
      >
        <div className="flex flex-col items-center gap-1 border-b border-white/10 pb-2 text-center">
          <span className="max-w-full break-words uppercase tracking-wide opacity-90">
            🐟 Konkurrence
          </span>
          <span
            className={`font-mono text-base tabular-nums leading-none ${
              finished ? 'text-red-300' : 'text-sky-200'
            }`}
          >
            {timeDisplay}
          </span>
        </div>
        <div className="flex flex-col items-center gap-0.5 text-center">
          <span className="font-semibold uppercase tracking-wide text-white/70">Fangster</span>
          <span className="font-mono text-lg tabular-nums leading-none text-amber-200">
            {catches}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${shellClass} gap-1 px-3 py-2 text-xs`}
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
