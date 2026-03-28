import { useFishingStore } from '../../store/useFishingStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUIStore } from '../../store/useUIStore';
import { GoalNotification } from '../modals/GoalNotification';
import { StreakIndicator } from './StreakIndicator';
import { WeatherWidget } from './WeatherWidget';
import { XPBar } from './XPBar';

/** Under "RegneFisken" + safe-area — undgår overlap med titel (clamp kan være høj på smalle skærme). */
const MOBILE_HUD_TOP = '5.35rem';

/** Fast XP, vejr, streak og mål-toast i mobil-mode (legacy top-fixed). Kiste kun via 🎒 Fisketaske. */
export function MobileHUD() {
  const uiMode = useUIStore((s) => s.uiMode);
  const uiHidden = useUIStore((s) => s.uiHidden);
  const xpToast = useUIStore((s) => s.xpToast);
  const pendingGoal = useUIStore((s) => s.pendingGoal);
  const showLevelUp = useUIStore((s) => s.showLevelUp);

  const currentStreak = useFishingStore((s) => s.currentStreak);
  const questItems = usePlayerStore((s) => s.questItems);
  const eggCountdown = usePlayerStore((s) => s.eggCountdown);
  const showTurtleEggHud =
    questItems.includes('turtle_egg') && !questItems.includes('turtle_hatched');

  if (uiMode !== 'mobile' || uiHidden) return null;

  return (
    <>
      <div
        className="pointer-events-auto z-[150] max-w-[min(14rem,42vw)]"
        style={{ position: 'fixed', top: MOBILE_HUD_TOP, left: '1rem' }}
      >
        <div className="relative w-full">
          <XPBar />
          {xpToast && (
            <div
              className="xp-toast-hud pointer-events-none absolute top-1/2 left-full z-10 ml-2 -translate-y-1/2 rounded-xl font-black whitespace-nowrap text-emerald-300"
              style={{
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(8px)',
                animation: 'xpToastPop 0.2s ease-out forwards',
              }}
            >
              {xpToast}
            </div>
          )}
        </div>
        {showTurtleEggHud && !!eggCountdown && (
          <div
            className="panel-hud mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border px-3 py-2 shadow-xl"
            style={{ borderColor: '#334155' }}
          >
            <span className="text-xl leading-none">🥚</span>
            <span className="text-lg leading-none">⏳</span>
            <span
              className="font-mono text-[1.05rem] font-black tabular-nums"
              style={{ color: '#fde68a' }}
            >
              {eggCountdown}
            </span>
          </div>
        )}
      </div>

      <div
        className="pointer-events-auto z-[150] flex max-w-[min(16rem,48vw)] flex-col items-end gap-1.5"
        style={{ position: 'fixed', top: MOBILE_HUD_TOP, right: '1rem' }}
      >
        <WeatherWidget />
        {currentStreak > 0 && <StreakIndicator />}
        {pendingGoal && showLevelUp == null && <GoalNotification />}
      </div>
    </>
  );
}
