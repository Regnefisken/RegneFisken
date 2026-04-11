import { useAudio } from '../../audio/useAudio';
import { runLocationTravel } from '../../logic/cabin-room-travel.js';
import { getLocation } from '../../data/locations';
import { useCollectionStore } from '../../store/useCollectionStore';
import { useFishingStore } from '../../store/useFishingStore';
import { useGameStore } from '../../store/useGameStore';
import { useUIStore } from '../../store/useUIStore';
import type { LocationId } from '../../types/locations';

/** Legacy `legacy-game.html` ~12602 — kort komplet → rejse til Den Forbudte Sø. */
export function MapRevealModal() {
  const { play } = useAudio();
  const showMapReveal = useCollectionStore((s) => s.showMapReveal);
  const setShowMapReveal = useCollectionStore((s) => s.setShowMapReveal);
  const setCurrentLocation = useGameStore((s) => s.setCurrentLocation);
  const setGameState = useGameStore((s) => s.setGameState);
  const setShopInitialTab = useGameStore((s) => s.setShopInitialTab);
  const resetWeatherForTravel = useGameStore((s) => s.resetWeatherForTravel);
  const setCurrentStreak = useFishingStore((s) => s.setCurrentStreak);
  const setStreakMilestoneToast = useFishingStore((s) => s.setStreakMilestoneToast);
  const setShowNavPicker = useUIStore((s) => s.setShowNavPicker);
  const setShowKisteMenu = useUIStore((s) => s.setShowKisteMenu);

  if (!showMapReveal) return null;

  function goForbidden() {
    setShowMapReveal(false);
    play('ui');
    /** Som legacy ved `travelTo`: forlad butik/kiste/rejse-overlay så spillet viser det nye sted. */
    setGameState('idle');
    setShopInitialTab('fishing_gear');
    setShowNavPicker(false);
    setShowKisteMenu(false);
    runLocationTravel('forbidden', () => {
      setCurrentLocation('forbidden' as LocationId);
      setCurrentStreak(0);
      setStreakMilestoneToast(null);
      resetWeatherForTravel(!!getLocation('forbidden').specialRules?.darkLocation);
    });
  }

  function dismiss() {
    play('ui');
    setShowMapReveal(false);
  }

  return (
    <div
      className="fixed inset-0 z-[99998] flex items-center justify-center animate-[fadeInZoom_0.4s_ease-out]"
      style={{
        background: 'rgba(0,0,0,0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div
        className="w-[92%] max-w-[480px] rounded-[1.75rem] border-2 border-amber-500/60 p-8 pb-10 text-center shadow-2xl"
        style={{
          background: 'linear-gradient(160deg, #1a0a00 0%, #2d1500 40%, #0a0a1a 100%)',
          boxShadow: '0 0 80px rgba(245,158,11,0.25), 0 25px 60px rgba(0,0,0,0.7)',
        }}
      >
        <div className="relative mb-6">
          <div className="text-[4rem] leading-none">🗺</div>
          <div
            className="absolute -top-2 right-1/2 translate-x-[60px] text-[1.8rem] animate-[xpToastPop_0.6s_ease-out_0.3s_both]"
            aria-hidden
          >
            ✨
          </div>
        </div>
        <div
          className="mb-2 text-[0.75rem] font-black tracking-[0.2em] text-amber-500 uppercase"
          style={{ fontWeight: 900 }}
        >
          Kortet er komplet!
        </div>
        <h2
          className="mb-3 text-[2rem] leading-tight font-black text-amber-50"
          style={{ fontWeight: 900 }}
        >
          Den Forbudte Sø
          <br />
          er opdaget!
        </h2>
        <div className="mb-6 flex justify-center gap-1">
          {['◧ Venstre halvdel', '◨ Højre halvdel'].map((label, i) => (
            <div
              key={label}
              className="flex-1 rounded-xl border border-amber-500/40 bg-amber-500/15 px-2 py-3 text-[0.75rem] font-bold text-amber-300"
              style={{
                borderRadius: i === 0 ? '0.75rem 0 0 0.75rem' : '0 0.75rem 0.75rem 0',
              }}
            >
              <div className="mb-1 text-2xl">🗺</div>
              {label}
            </div>
          ))}
        </div>
        <p className="mb-7 text-[0.9rem] leading-relaxed text-slate-300">
          En mystisk ø — ingen ved hvad der venter. Kun de modigste fiskere har vovet sig derud...
        </p>
        <button
          type="button"
          onClick={goForbidden}
          className="mb-3 w-full rounded-xl border-0 border-b-4 py-4 text-[1.1rem] font-black text-white transition-transform hover:scale-[1.02]"
          style={{
            background: 'linear-gradient(135deg, #b45309, #d97706)',
            borderBottomColor: '#92400e',
          }}
        >
          🧭 Sæt kurs mod Den Forbudte Sø!
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="w-full rounded-xl border border-white/15 bg-transparent py-3 text-[0.95rem] font-bold text-slate-400"
        >
          Afsted senere
        </button>
      </div>
    </div>
  );
}
