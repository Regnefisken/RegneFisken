import { xpNeededForLevel } from '../../data/xp';
import { usePlayerStore } from '../../store/usePlayerStore';

export function XPBar() {
  const level = usePlayerStore((s) => s.progression.level);
  const xp = usePlayerStore((s) => s.progression.xp);
  const needed = xpNeededForLevel(level);
  const pct = Math.min((xp / needed) * 100, 100);
  const barColor =
    pct > 85
      ? 'linear-gradient(to right, #f59e0b, #fbbf24)'
      : 'linear-gradient(to right, #3b82f6, #8b5cf6)';

  return (
    <div className="panel-hud w-full min-w-0 rounded-2xl border border-slate-700 px-3 py-2 shadow-xl">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs font-black tracking-widest text-yellow-300 uppercase">
          ⭐ <span>LVL {level}</span>
        </span>
        <span className="font-mono text-xs text-slate-400">
          {xp}
          <span className="text-slate-600">/{needed}</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full border border-slate-700/50 bg-slate-800">
        <div
          style={{
            width: `${pct}%`,
            background: barColor,
            height: '100%',
            borderRadius: '9999px',
            transition: 'width 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow:
              pct > 85
                ? '0 0 8px rgba(251,191,36,0.7)'
                : '0 0 6px rgba(139,92,246,0.5)',
          }}
        />
      </div>
    </div>
  );
}
