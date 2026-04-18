import { xpNeededForLevel } from '../../data/xp';
import { usePlayerStore } from '../../store/usePlayerStore';

type Variant = 'mirror' | 'panel';

const variants: Record<
  Variant,
  { label: string; value: string; box: string; border: string }
> = {
  mirror: {
    label: 'text-white/50',
    value: 'font-bold text-[#e8d5a3]',
    box: 'rounded-xl border border-white/10 bg-black/20 p-3 text-sm',
    border: 'border-white/5',
  },
  panel: {
    label: 'text-slate-400',
    value: 'font-bold text-amber-200/95',
    box: 'rounded-xl border border-slate-600/60 bg-slate-800/60 p-3 text-sm',
    border: 'border-slate-600/40',
  },
};

/**
 * Penge, fangster, level, XP (tal + progressbar mod næste level).
 */
export function CareerStatsBlock({
  className = '',
  variant = 'panel',
}: {
  className?: string;
  variant?: Variant;
}) {
  const progression = usePlayerStore((s) => s.progression);
  const totalCatches = usePlayerStore((s) => s.totalSuccessfulCatches);
  const coins = usePlayerStore((s) => s.coins);
  const v = variants[variant];
  const xpNeeded = xpNeededForLevel(progression.level);
  const xpPct = Math.min((progression.xp / xpNeeded) * 100, 100);
  const xpBarFill =
    xpPct > 85
      ? 'linear-gradient(to right, #f59e0b, #fbbf24)'
      : 'linear-gradient(to right, #3b82f6, #8b5cf6)';
  const xpTrackClass =
    variant === 'mirror'
      ? 'border border-white/15 bg-black/30'
      : 'border border-slate-700/50 bg-slate-900/80';

  return (
    <div className={`${v.box} ${className}`.trim()}>
      <div className={`flex justify-between border-b py-1 ${v.border}`}>
        <span className={`flex items-center gap-2 ${v.label}`}>
          <span className="select-none" aria-hidden>
            💰
          </span>
          Penge
        </span>
        <span className={v.value}>
          {coins.toLocaleString('da-DK', { useGrouping: false })} kr
        </span>
      </div>
      <div className={`flex justify-between border-b py-1 ${v.border}`}>
        <span className={`flex items-center gap-2 ${v.label}`}>
          <span className="select-none" aria-hidden>
            🎣
          </span>
          Fangster
        </span>
        <span className={v.value}>{totalCatches}</span>
      </div>
      <div className={`flex justify-between border-b py-1 ${v.border}`}>
        <span className={`flex items-center gap-2 ${v.label}`}>
          <span className="select-none" aria-hidden>
            ⭐
          </span>
          Level
        </span>
        <span className={v.value}>{progression.level}</span>
      </div>
      <div className="py-1">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className={`flex shrink-0 items-center gap-2 ${v.label}`}>
            <span className="select-none" aria-hidden>
              ✨
            </span>
            XP
          </span>
          <span className={`${v.value} min-w-0 text-right text-[0.85em] tabular-nums`}>
            {progression.xp.toLocaleString('da-DK')}
            <span className="font-semibold opacity-55">/{xpNeeded.toLocaleString('da-DK')}</span>
          </span>
        </div>
        <div
          className={`h-1.5 overflow-hidden rounded-full ${xpTrackClass}`}
          role="progressbar"
          aria-valuenow={Math.round(progression.xp)}
          aria-valuemin={0}
          aria-valuemax={xpNeeded}
          aria-label="Fremskridt mod næste level"
        >
          <div
            className="h-full rounded-full transition-[width] duration-300 ease-out"
            style={{
              width: `${xpPct}%`,
              background: xpBarFill,
              boxShadow:
                xpPct > 85
                  ? '0 0 6px rgba(251,191,36,0.55)'
                  : '0 0 5px rgba(139,92,246,0.45)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
