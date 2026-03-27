import { getFinalStreakBonus } from '../../logic/xp-engine';
import { useFishingStore } from '../../store/useFishingStore';
import { useMathStore } from '../../store/useMathStore';

export function StreakIndicator() {
  const currentStreak = useFishingStore((s) => s.currentStreak);
  const zenMode = useMathStore((s) => s.zenMode);
  const bonus = getFinalStreakBonus(currentStreak, zenMode, 1);

  if (currentStreak <= 0) return null;

  return (
    <div
      className={`flex w-full items-center gap-2 rounded-2xl border px-4 py-1.5 text-sm font-black shadow-lg ${
        currentStreak >= 5
          ? 'anim-fire border-yellow-400 bg-orange-600/80 text-yellow-100'
          : 'border-slate-500 bg-slate-700/80 text-slate-200'
      }`}
    >
      <span>{currentStreak >= 5 ? '🔥' : '⚡'}</span>
      <span>
        Streak: {currentStreak}
        {currentStreak >= 5 ? ` · +${bonus} Rigdom` : ''}
      </span>
    </div>
  );
}
