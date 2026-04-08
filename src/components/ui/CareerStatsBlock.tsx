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
 * Level, XP, fangster, penge — samme felter som under spejlet (`WardrobeModal`).
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

  return (
    <div className={`${v.box} ${className}`.trim()}>
      <div className={`flex justify-between border-b py-1 ${v.border}`}>
        <span className={`flex items-center gap-2 ${v.label}`}>
          <span className="select-none" aria-hidden>
            ⭐
          </span>
          Level
        </span>
        <span className={v.value}>{progression.level}</span>
      </div>
      <div className={`flex justify-between border-b py-1 ${v.border}`}>
        <span className={`flex items-center gap-2 ${v.label}`}>
          <span className="select-none" aria-hidden>
            ✨
          </span>
          XP
        </span>
        <span className={v.value}>{progression.xp.toLocaleString('da-DK')}</span>
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
      <div className="flex justify-between py-1">
        <span className={`flex items-center gap-2 ${v.label}`}>
          <span className="select-none" aria-hidden>
            💰
          </span>
          Penge
        </span>
        <span className={v.value}>{coins.toLocaleString('da-DK')} kr</span>
      </div>
    </div>
  );
}
