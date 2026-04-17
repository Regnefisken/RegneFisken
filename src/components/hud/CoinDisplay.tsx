import { usePlayerStore } from '../../store/usePlayerStore';
import { CoinIcon } from '../common/CoinIcon';

export function CoinDisplay() {
  const coins = usePlayerStore((s) => s.coins);

  return (
    <div className="btn-glass flex w-full items-center justify-between gap-2 rounded-2xl border border-white/20 px-3 py-1.5 shadow-xl">
      <span className="shrink-0">
        <CoinIcon size={18} />
      </span>
      <span className="flex-1 text-center font-mono text-lg font-bold text-yellow-100">{coins}</span>
      <span className="shrink-0 text-xs font-bold text-yellow-200/60">kr</span>
    </div>
  );
}
