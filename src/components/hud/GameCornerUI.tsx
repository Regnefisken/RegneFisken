import { useAudio } from '../../audio/useAudio';
import { LOCATIONS } from '../../data/locations';
import { canOpenTravelMenu } from '../../logic/travel-unlock';
import { useFullscreen } from '../../hooks/useFullscreen';
import { useGameStore } from '../../store/useGameStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUIStore } from '../../store/useUIStore';

const cornerBtnBase =
  'touch-manipulation cursor-pointer select-none rounded-xl border px-3 py-2 text-lg leading-none transition-all hover:scale-110 active:scale-95';

const bottomSafe = 'max(1rem, env(safe-area-inset-bottom, 0px))';

/** Fuldskærm, skjul UI, lyd, menu og rejse-kort — matcher legacy (legacy-game.html bund-layout). */
export function GameCornerUI() {
  const { play } = useAudio();
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

  const gameState = useGameStore((s) => s.gameState);
  const uiHidden = useUIStore((s) => s.uiHidden);
  const setUiHidden = useUIStore((s) => s.setUiHidden);
  const setShowNavPicker = useUIStore((s) => s.setShowNavPicker);
  const setShowSettingsMenu = useUIStore((s) => s.setShowSettingsMenu);
  const setToastMessage = useUIStore((s) => s.setToastMessage);
  const isMuted = useUIStore((s) => s.isMuted);
  const setIsMuted = useUIStore((s) => s.setIsMuted);
  const isBagOpen = useUIStore((s) => s.isBagOpen);
  const uiMode = useUIStore((s) => s.uiMode);
  const showNavPicker = useUIStore((s) => s.showNavPicker);

  const progression = usePlayerStore((s) => s.progression);
  const upgrades = usePlayerStore((s) => s.upgrades);
  const questItems = usePlayerStore((s) => s.questItems);

  const showCornerButtons = gameState === 'idle' && !isBagOpen;
  /** På lille skærm skjul rejsekortet mens destinationsmenuen er åben (som fisketaske-knappen ved åben taske). */
  const showTravelMapButton =
    showCornerButtons && (uiMode !== 'mobile' || !showNavPicker);

  function openTravel() {
    if (!canOpenTravelMenu(progression.level, upgrades, questItems)) {
      play('error');
      const nextLocked = Object.values(LOCATIONS).find((a) => a.id !== 'pier');
      if (nextLocked) {
        const missingLevel = progression.level < nextLocked.unlockLevel;
        setToastMessage(
          missingLevel
            ? `Kræver level ${nextLocked.unlockLevel} for at rejse!`
            : 'Du mangler fiskekort!',
        );
      } else {
        setToastMessage('Du mangler fiskekort!');
      }
      return;
    }
    play('ui');
    setShowNavPicker(true);
  }

  return (
    <>
      {showTravelMapButton && (
        <button
          type="button"
          className="btn-glass pointer-events-auto fixed left-4 z-[9999] flex items-center justify-center rounded-2xl border border-white/20 text-5xl shadow-lg transition-all hover:scale-110 hover:bg-sky-600 active:scale-95"
          style={{
            bottom: `calc(5.5rem + env(safe-area-inset-bottom, 0px))`,
            width: '6.85rem',
            height: '6.85rem',
          }}
          title="Rejse"
          onClick={openTravel}
        >
          🗺
        </button>
      )}

      <div
        className="pointer-events-auto fixed left-4 z-[9999] flex"
        style={{
          bottom: bottomSafe,
          gap: '0.45rem',
        }}
      >
        <button
          type="button"
          className={`${cornerBtnBase} min-w-[3.2rem] text-center backdrop-blur-md`}
          style={{
            background: 'rgba(0,0,0,0.45)',
            borderColor: 'rgba(255,255,255,0.2)',
            color: 'white',
          }}
          title="Menu"
          onClick={() => {
            play('ui');
            setShowSettingsMenu(true);
          }}
        >
          ⚙️
          <span className="mt-0.5 block text-[0.65rem] opacity-75">Menu</span>
        </button>
        <button
          type="button"
          className={`${cornerBtnBase} min-w-[3.2rem] text-center backdrop-blur-md`}
          style={{
            background: isMuted ? 'rgba(239,68,68,0.45)' : 'rgba(0,0,0,0.45)',
            borderColor: isMuted ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.2)',
            color: isMuted ? '#fca5a5' : 'white',
            boxShadow: isMuted ? '0 0 12px rgba(239,68,68,0.4)' : 'none',
          }}
          title={isMuted ? 'Tænd lyd' : 'Sluk lyd'}
          onClick={() => {
            play('ui');
            setIsMuted(!isMuted);
          }}
        >
          {isMuted ? '🔇' : '🔊'}
          <span className="mt-0.5 block text-[0.65rem] opacity-75">{isMuted ? 'Fra' : 'Til'}</span>
        </button>
      </div>

      <button
        type="button"
        className={`${cornerBtnBase} pointer-events-auto fixed z-[9999] min-w-[3.2rem] text-center backdrop-blur-md`}
        style={{
          right: '4.8rem',
          bottom: bottomSafe,
          background: uiHidden ? 'rgba(14,116,144,0.7)' : 'rgba(0,0,0,0.45)',
          borderColor: uiHidden ? 'rgba(56,189,248,0.6)' : 'rgba(255,255,255,0.2)',
          color: 'white',
        }}
        title={uiHidden ? 'Vis UI' : 'Skjul UI'}
        onClick={() => {
          play('ui');
          setUiHidden(!uiHidden);
        }}
      >
        {uiHidden ? '👁️' : '🙈'}
        <span className="mt-0.5 block text-[0.65rem] opacity-75">{uiHidden ? 'Vis' : 'Skjul'}</span>
      </button>

      <button
        type="button"
        className={`${cornerBtnBase} pointer-events-auto fixed right-4 z-[9999] min-w-[3.2rem] text-center backdrop-blur-md`}
        style={{
          bottom: bottomSafe,
          background: 'rgba(0,0,0,0.45)',
          borderColor: 'rgba(255,255,255,0.2)',
          color: 'white',
        }}
        title={isFullscreen ? 'Afslut fuldskærm (F11)' : 'Fuldskærm (F11)'}
        onClick={() => {
          play('ui');
          toggleFullscreen();
        }}
      >
        {isFullscreen ? '✕' : '⛶'}
        <span className="mt-0.5 block text-[0.65rem] opacity-75">
          {isFullscreen ? 'Luk' : 'Fuld'}
        </span>
      </button>
    </>
  );
}
