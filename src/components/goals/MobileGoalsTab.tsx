import { useAudio } from '../../audio/useAudio';
import { GOALS } from '../../data/progression';
import { buildGoalStatsSnapshot } from '../../logic/goal-progress';
import { getGoalRowProgress } from '../../logic/goal-row-progress';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUIStore } from '../../store/useUIStore';
import { CoinIcon } from '../common/CoinIcon';

/** Mål-liste til Fisketaske (mobil). */
export function MobileGoalsTab() {
  const { play } = useAudio();
  const completedGoals = usePlayerStore((s) => s.completedGoals);
  const activeCategory = useUIStore((s) => s.mobileGoalCategory);
  const setMobileGoalCategory = useUIStore((s) => s.setMobileGoalCategory);
  const goalStats = buildGoalStatsSnapshot();

  const categories = ['alle', 'fangst', 'matematik', 'udforskning', 'samling', 'økonomi'];
  const filtered = GOALS.filter(
    (g) => activeCategory === 'alle' || g.category === activeCategory
  );

  const done = GOALS.filter((g) => completedGoals.includes(g.id)).length;
  const total = GOALS.length;

  return (
    <div className="flex min-h-0 flex-col">
      <div className="mb-3 shrink-0">
        <h4 className="text-base font-black text-yellow-300">🏆 Mål</h4>
        <p className="mt-0.5 text-xs text-slate-400">
          <span className="font-bold text-white">{done}</span>
          <span className="text-slate-500">/{total} gennemført</span>
        </p>
        <div className="mt-2 h-1.5 w-full max-w-[12rem] overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${(done / total) * 100}%`,
              background: 'linear-gradient(to right, #f59e0b, #fbbf24)',
            }}
          />
        </div>
      </div>

      <div className="scrollbar-hide mb-3 flex shrink-0 gap-1.5 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              play('ui');
              setMobileGoalCategory(cat);
            }}
            className={`shrink-0 rounded-full px-3 py-1 text-[0.65rem] font-bold tracking-wider uppercase whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-yellow-500 text-black'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="scrollbar-hide flex min-h-0 flex-col gap-2 overflow-y-auto pr-0.5">
        {filtered.map((goal) => {
          const isDone = completedGoals.includes(goal.id);
          const isSecret = goal.secret && !isDone;
          const progress = !isDone ? getGoalRowProgress(goal, goalStats) : null;
          const pct = progress ? (progress.cur / progress.max) * 100 : 0;

          return (
            <div
              key={goal.id}
              className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all ${
                isDone
                  ? 'border-yellow-900/50 bg-yellow-900/10'
                  : 'border-slate-700/50 bg-slate-800/40'
              }`}
            >
              <div
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-xl ${
                  isDone ? 'bg-yellow-500/20' : isSecret ? 'bg-slate-800' : 'bg-slate-700/50'
                }`}
              >
                {isSecret ? '❓' : goal.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex flex-wrap items-center gap-1">
                  <span
                    className={`text-xs font-bold ${isDone ? 'text-yellow-300' : 'text-white'}`}
                  >
                    {isSecret ? '???' : goal.title}
                  </span>
                  {isDone && (
                    <span className="rounded-full bg-yellow-500/20 px-1.5 py-0.5 text-[0.6rem] font-bold text-yellow-400">
                      ✓
                    </span>
                  )}
                </div>
                <p className="text-[0.65rem] leading-snug text-slate-400">
                  {isSecret ? 'Skjult mål — fortsæt med at fiske!' : goal.description}
                </p>
                {progress && !isDone && !isSecret && (
                  <div className="mt-1.5">
                    <div className="h-1 w-full overflow-hidden rounded-full bg-slate-700">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                        }}
                      />
                    </div>
                    <span className="mt-0.5 block text-[0.6rem] text-slate-500">
                      {progress.cur} / {progress.max}
                    </span>
                  </div>
                )}
              </div>
              {!isDone && !isSecret && (
                <div className="flex flex-shrink-0 flex-col items-end gap-0.5 text-[0.6rem]">
                  {goal.reward.xp > 0 && (
                    <span className="font-bold text-purple-400">+{goal.reward.xp} XP</span>
                  )}
                  {goal.reward.coins > 0 && (
                    <span className="flex items-center gap-0.5 font-bold text-yellow-400">
                      +{goal.reward.coins} <CoinIcon size={12} />
                    </span>
                  )}
                </div>
              )}
              {isDone && <div className="flex-shrink-0 text-lg text-yellow-500">⭐</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
