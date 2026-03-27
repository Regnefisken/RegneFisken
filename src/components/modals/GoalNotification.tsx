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
        className="flex items-center gap-3 rounded-2xl border border-yellow-500/40 px-4 py-3 shadow-2xl"
        style={{
          background: 'rgba(120,80,0,0.95)',
          backdropFilter: 'blur(16px)',
          animation: 'slideInRight 0.3s ease-out forwards',
        }}
      >
        <span className="text-2xl">{goal.icon}</span>
        <div>
          <div className="text-xs font-black tracking-widest text-yellow-300 uppercase">
            Mål gennemført!
          </div>
          <div className="text-sm font-bold text-white">{goal.title}</div>
          <div className="mt-0.5 flex gap-2">
            {goal.reward.xp > 0 && (
              <span className="text-xs font-bold text-purple-300">+{goal.reward.xp} XP</span>
            )}
            {goal.reward.coins > 0 && (
              <span className="flex items-center gap-1 text-xs font-bold text-yellow-300">
                +{goal.reward.coins} <CoinIcon size={12} />
              </span>
            )}
          </div>
        </div>
        <span className="text-xl text-yellow-400">⭐</span>
      </div>
    </div>
  );
}
