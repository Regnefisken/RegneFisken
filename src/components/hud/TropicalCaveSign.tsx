import { useAudio } from '../../audio/useAudio';
import { runLocationTravel } from '../../logic/cabin-room-travel.js';
import { destinationAllowsTravel } from '../../logic/travel-unlock';
import { useFishingStore } from '../../store/useFishingStore';
import { useGameStore } from '../../store/useGameStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUIStore } from '../../store/useUIStore';
/**
 * Grotte-adgang fra Den Tropiske Ø — pixel-/layout-match af legacy-game.html ~11835–11912.
 */
export function TropicalCaveSign() {
  const { play } = useAudio();
  const gameState = useGameStore((s) => s.gameState);
  const currentLocation = useGameStore((s) => s.currentLocation);
  const setCurrentLocation = useGameStore((s) => s.setCurrentLocation);
  const resetWeatherForTravel = useGameStore((s) => s.resetWeatherForTravel);

  const upgrades = usePlayerStore((s) => s.upgrades);
  const uiHidden = useUIStore((s) => s.uiHidden);
  const uiMode = useUIStore((s) => s.uiMode);
  const setToastMessage = useUIStore((s) => s.setToastMessage);

  const setCurrentStreak = useFishingStore((s) => s.setCurrentStreak);
  const setStreakMilestoneToast = useFishingStore((s) => s.setStreakMilestoneToast);

  if (uiHidden || gameState !== 'idle' || currentLocation !== 'tropical_island') {
    return null;
  }

  const hasLamp = upgrades.includes('headlamp');

  function goToCave() {
    if (!hasLamp) {
      play('error');
      setToastMessage('🔦 Du mangler en pandelampe! Køb den i butikken for at gå ind i grotten.');
      return;
    }
    const gate = destinationAllowsTravel('cave', upgrades);
    if (!gate.ok) {
      play('error');
      setToastMessage(gate.message);
      return;
    }
    play('ui');
    runLocationTravel('cave', () => {
      setCurrentLocation('cave');
      setCurrentStreak(0);
      setStreakMilestoneToast(null);
      resetWeatherForTravel(false);
    });
  }

  if (uiMode === 'mobile') {
    return (
      <button
        type="button"
        aria-label="Den Mørke Grotte"
        onClick={goToCave}
        className="pointer-events-auto touch-manipulation"
        style={{
          position: 'fixed',
          right: '0.75rem',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 9999,
          width: '3.2rem',
          height: '3.2rem',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6b3f1a 0%, #3d200a 60%, #2a1508 100%)',
          border: '2.5px solid #1a0c04',
          boxShadow: '0 4px 0 #1a0c04, 0 6px 18px rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
        onTouchStart={(e) => {
          e.currentTarget.style.transform = 'translateY(-50%) scale(0.9)';
          e.currentTarget.style.boxShadow = '0 2px 0 #1a0c04, 0 3px 10px rgba(0,0,0,0.7)';
        }}
        onTouchEnd={(e) => {
          e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 0 #1a0c04, 0 6px 18px rgba(0,0,0,0.7)';
        }}
      >
        <span style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.8))' }}>🪨</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label="Den Mørke Grotte"
      onClick={goToCave}
      className="pointer-events-auto absolute right-6 flex flex-col items-center gap-1 transition-all hover:scale-105 active:scale-95 md:right-8"
      style={{
        background: 'linear-gradient(160deg, #6b3f1a 0%, #3d200a 60%, #2a1508 100%)',
        border: '3px solid #1a0c04',
        borderRadius: '0.75rem',
        boxShadow: '0 6px 0 #1a0c04, 0 10px 30px rgba(0,0,0,0.6)',
        padding: '1rem 1.25rem',
        top: '62%',
        transform: 'translateY(-50%) rotate(-3deg)',
        fontFamily: 'Georgia, serif',
        minWidth: '9rem',
        maxWidth: '11rem',
        textAlign: 'center',
        zIndex: 100,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '3px',
          borderRadius: '2px',
          background: 'rgba(255,220,120,0.18)',
          marginBottom: '0.5rem',
        }}
      />
      <span className="text-4xl" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.7))' }}>
        🪨
      </span>
      <div
        className="text-base font-black uppercase tracking-wide text-yellow-200"
        style={{ textShadow: '0 2px 6px rgba(0,0,0,0.9)', lineHeight: 1.2, marginTop: '0.3rem' }}
      >
        DEN MØRKE
        <br />
        GROTTE →
      </div>
      <div
        className="mt-1 text-xs font-bold"
        style={{
          color: hasLamp ? '#86efac' : '#9ca3af',
          textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          letterSpacing: '0.04em',
        }}
      >
        {hasLamp ? 'Pandelampe klar' : '🔒 Kræver pandelampe'}
      </div>
      <div
        style={{
          width: '100%',
          height: '3px',
          borderRadius: '2px',
          background: 'rgba(255,220,120,0.18)',
          marginTop: '0.5rem',
        }}
      />
    </button>
  );
}
