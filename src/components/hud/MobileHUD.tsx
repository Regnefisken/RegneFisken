import { useUIStore } from '../../store/useUIStore';
import { GoalNotification } from '../modals/GoalNotification';

/** Mål-toast øverst til højre — under lokationslinje, fri for venstre titel. */
const MOBILE_HUD_TOP = '5.35rem';

/** XP-toast og æg-timer ligger i `GameCornerUI` over rejse-knappen (samme synlighed som 🗺 på mobil). */
export function MobileHUD() {
  const uiMode = useUIStore((s) => s.uiMode);
  const uiHidden = useUIStore((s) => s.uiHidden);
  const pendingGoal = useUIStore((s) => s.pendingGoal);
  const showLevelUp = useUIStore((s) => s.showLevelUp);

  if (uiMode !== 'mobile' || uiHidden) return null;

  return (
    <div
      className="pointer-events-auto z-[150] flex max-w-[min(16rem,48vw)] flex-col items-end gap-1.5"
      style={{ position: 'fixed', top: MOBILE_HUD_TOP, right: '1rem' }}
    >
      {pendingGoal && showLevelUp == null && <GoalNotification />}
    </div>
  );
}
