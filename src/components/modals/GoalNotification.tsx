import { useEffect, useMemo } from 'react';
import { GOALS } from '../../data/progression';
import { useUIStore } from '../../store/useUIStore';
import { CoinIcon } from '../common/CoinIcon';

export function GoalNotification() {
  const pendingGoalId = useUIStore((s) => s.pendingGoal);
  const setPendingGoal = useUIStore((s) => s.setPendingGoal);

  const goal = useMemo(
    () => GOALS.find((g) => g.id === pendingGoalId) ?? null,
    [pendingGoalId]
  );

  useEffect(() => {
    if (!goal) return;
    const t = window.setTimeout(() => setPendingGoal(null), 3500);
    return () => window.clearTimeout(t);
  }, [goal, setPendingGoal]);

  if (!goal) return null;

  return (
    <div className="pointer-events-none mt-2 transition-all">
      <div
        className="goal-toast-legacy flex max-w-[min(92vw,22rem)] items-center gap-3 rounded-2xl border border-yellow-500/40 px-5 py-4 shadow-2xl"
        style={{
          background: 'rgba(120,80,0,0.95)',
          backdropFilter: 'blur(16px)',
          animation: 'slideInRight 0.3s ease-out forwards',
        }}
      >
        <span className="shrink-0 text-3xl leading-none">{goal.icon}</span>
        <div className="min-w-0 flex-1 font-bold text-white">
          <div className="goal-toast-label font-black tracking-widest text-yellow-300 uppercase">
            Mål gennemført!
          </div>
          <div className="mt-0.5 font-black">{goal.title}</div>
          <div className="goal-toast-reward mt-1 flex flex-wrap gap-2">
            {goal.reward.xp > 0 && (
              <span className="font-bold text-purple-300">+{goal.reward.xp} XP</span>
            )}
            {goal.reward.coins > 0 && (
              <span className="flex items-center gap-1 font-bold text-yellow-300">
                +{goal.reward.coins} <CoinIcon size={18} />
              </span>
            )}
          </div>
        </div>
        <span className="shrink-0 text-2xl text-yellow-400">⭐</span>
      </div>
    </div>
  );
}
