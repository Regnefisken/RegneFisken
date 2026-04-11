import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAudio } from '../../audio/useAudio';
import { GOALS } from '../../data/progression';
import { buildGoalStatsSnapshot } from '../../logic/goal-progress';
import { getGoalRowProgress } from '../../logic/goal-row-progress';
import { useCollectionStore } from '../../store/useCollectionStore';
import { useGameStore } from '../../store/useGameStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { CoinIcon } from '../common/CoinIcon';

export function GoalsScreen() {
  const { play } = useAudio();
  const setGameState = useGameStore((s) => s.setGameState);
  const completedGoals = usePlayerStore((s) => s.completedGoals);
  const playerGoalSlice = usePlayerStore(
    useShallow((s) => ({
      stats: s.stats,
      progression: s.progression,
      questItems: s.questItems,
      cheeseSources: s.cheeseSources,
      featherSources: s.featherSources,
    }))
  );
  const collectionGoalSlice = useCollectionStore(
    useShallow((s) => ({
      collectibleInventory: s.collectibleInventory,
      collectibleDelivered: s.collectibleDelivered,
      unlockedCompanions: s.unlockedCompanions,
      usedWishes: s.usedWishes,
    }))
  );

  void playerGoalSlice;
  void collectionGoalSlice;
  const goalStats = buildGoalStatsSnapshot();

  const [activeCategory, setActiveCategory] = useState('alle');
  const categories = ['alle', 'fangst', 'matematik', 'udforskning', 'samling', 'økonomi'];
  const filtered = GOALS.filter(
    (g) => activeCategory === 'alle' || g.category === activeCategory
  );

  const done = GOALS.filter((g) => completedGoals.includes(g.id)).length;
  const total = GOALS.length;

  function onClose() {
    play('ui');
    setGameState('idle');
  }

  return (
    <div className="panel-shop anim-zoom-in pointer-events-auto flex h-[80dvh] max-h-[80dvh] min-h-0 w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-700 p-8 shadow-2xl">
      <div className="mb-6 flex shrink-0 items-start justify-between">
        <div>
          <h2 className="flex items-center gap-3 text-4xl font-black text-yellow-300">🏆 Mål</h2>
          <p className="mt-1 text-sm text-slate-400">
            <span className="font-bold text-white">{done}</span>
            <span className="text-slate-500">/{total} gennemført</span>
          </p>
          <div className="mt-2 h-2 w-48 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(done / total) * 100}%`,
                background: 'linear-gradient(to right, #f59e0b, #fbbf24)',
              }}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="panel-close-btn bg-slate-800 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
        >
          ← Luk
        </button>
      </div>

      <div className="mb-5 flex shrink-0 flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              play('ui');
              setActiveCategory(cat);
            }}
            className={`rounded-full px-4 py-1.5 text-xs font-bold tracking-wider uppercase transition-all ${
              activeCategory === cat
                ? 'bg-yellow-500 text-black'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
        {filtered.map((goal) => {
          const isDone = completedGoals.includes(goal.id);
          const isSecret = goal.secret && !isDone;
          const progress = !isDone ? getGoalRowProgress(goal, goalStats) : null;
          const pct = progress ? (progress.cur / progress.max) * 100 : 0;

          return (
            <div
              key={goal.id}
              className={`flex items-center gap-4 rounded-2xl border p-4 transition-all ${
                isDone
                  ? 'border-yellow-900/50 bg-yellow-900/10'
                  : 'border-slate-700/50 bg-slate-800/40'
              }`}
            >
              <div
                className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-3xl ${
                  isDone ? 'bg-yellow-500/20' : isSecret ? 'bg-slate-800' : 'bg-slate-700/50'
                }`}
              >
                {isSecret ? '❓' : goal.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-center gap-2">
                  <span
                    className={`text-sm font-bold ${isDone ? 'text-yellow-300' : 'text-white'}`}
                  >
                    {isSecret ? '???' : goal.title}
                  </span>
                  {isDone && (
                    <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs font-bold text-yellow-400">
                      ✓ Klaret
                    </span>
                  )}
                </div>
                <p className="text-xs leading-snug text-slate-400">
                  {isSecret ? 'Skjult mål — fortsæt med at fiske!' : goal.description}
                </p>
                {progress && !isDone && !isSecret && (
                  <div className="mt-2">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                        }}
                      />
                    </div>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {progress.cur} / {progress.max}
                    </span>
                  </div>
                )}
              </div>
              {!isDone && !isSecret && (
                <div className="flex flex-shrink-0 flex-col items-end gap-1 text-xs">
                  {goal.reward.xp > 0 && (
                    <span className="font-bold text-purple-400">+{goal.reward.xp} XP</span>
                  )}
                  {goal.reward.coins > 0 && (
                    <span className="flex items-center gap-1 font-bold text-yellow-400">
                      +{goal.reward.coins} <CoinIcon size={14} />
                    </span>
                  )}
                </div>
              )}
              {isDone && <div className="flex-shrink-0 text-2xl text-yellow-500">⭐</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
