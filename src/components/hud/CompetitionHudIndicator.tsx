import { useEffect, useRef, useState } from 'react';
import { useAudio } from '../../audio/useAudio';
import {
  FISHING_COMPETITION_DURATION_MS,
  FISHING_COMPETITION_IDLE_TIME_LABEL,
} from '../../data/fishingCompetition.js';
import { useGameStore } from '../../store/useGameStore';

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
  const { play } = useAudio();
  const startedAt = useGameStore((s) => s.competitionStartedAt);
  const catches = useGameStore((s) => s.competitionCatches);
  const finished = useGameStore((s) => s.competitionFinished);
  const resetCompetition = useGameStore((s) => s.resetCompetition);

  const [timeStr, setTimeStr] = useState(FISHING_COMPETITION_IDLE_TIME_LABEL);
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (startedAt === null) return;
    if (finished) {
      setTimeStr('0:00');
      return;
    }
    const tick = () => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, FISHING_COMPETITION_DURATION_MS - elapsed);
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

  const statusLabel = `Konkurrence: ${timeDisplay} tilbage, ${catches} fangster`;

  function handleResetClick(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    play('ui');
    resetCompetition();
    setMenuOpen(false);
  }

  const resetMenuPlacementClass = narrowStack
    ? 'bottom-full left-0 right-0 mb-1'
    : 'top-full left-0 right-0 mt-1';

  const resetMenu = (
    <div
      className={`absolute ${resetMenuPlacementClass} z-[10050] rounded-xl border border-slate-600 bg-slate-900/98 p-1 shadow-xl backdrop-blur-sm`}
      role="menu"
    >
      <button
        type="button"
        role="menuitem"
        onClick={handleResetClick}
        className="touch-manipulation w-full rounded-lg bg-slate-700 px-2 py-2 text-center text-[0.65rem] font-bold leading-tight text-slate-200 transition-colors hover:bg-slate-600 sm:text-xs"
      >
        🔄 Afslut/nulstil konkurrence
      </button>
    </div>
  );

  if (narrowStack) {
    return (
      <div ref={rootRef} className="relative w-full pointer-events-auto">
        <button
          type="button"
          className={`${shellClass} gap-2 px-2 py-2.5 text-[0.62rem] leading-tight`}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-label={`${statusLabel}. Klik for muligheder.`}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <div className="flex flex-col items-center gap-1 border-b border-white/10 pb-2 text-center">
            <span className="max-w-full break-words uppercase tracking-wide opacity-90">
              🐟 Konkurrence
            </span>
            <span
              className={`font-mono text-base tabular-nums leading-none ${
                finished ? 'text-red-300' : 'text-sky-200'
              }`}
              aria-hidden
            >
              {timeDisplay}
            </span>
          </div>
          <div className="flex flex-col items-center gap-0.5 text-center">
            <span className="font-semibold uppercase tracking-wide text-white/70">Fangster</span>
            <span className="font-mono text-lg tabular-nums leading-none text-amber-200" aria-hidden>
              {catches}
            </span>
          </div>
        </button>
        {menuOpen ? resetMenu : null}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative w-full pointer-events-auto">
      <button
        type="button"
        className={`${shellClass} gap-1 px-3 py-2 text-xs`}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label={`${statusLabel}. Klik for muligheder.`}
        onClick={() => setMenuOpen((o) => !o)}
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1">
          <span className="tracking-wide uppercase opacity-90">🐟 Konkurrence</span>
          <span
            className={`font-mono text-sm tabular-nums ${finished ? 'text-red-300' : 'text-sky-200'}`}
            aria-hidden
          >
            {timeDisplay}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-white/70">
            Fangster
          </span>
          <span className="font-mono text-base tabular-nums text-amber-200" aria-hidden>
            {catches}
          </span>
        </div>
      </button>
      {menuOpen ? resetMenu : null}
    </div>
  );
}
