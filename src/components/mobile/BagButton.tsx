import { useAudio } from '../../audio/useAudio';
import { useGameStore } from '../../store/useGameStore';
import { useUIStore } from '../../store/useUIStore';

/** 🎒 Fisketaske — kun mobil, idle, bag lukket (legacy showCornerButtons). */
export function BagButton() {
  const { play } = useAudio();
  const gameState = useGameStore((s) => s.gameState);
  const uiMode = useUIStore((s) => s.uiMode);
  const uiHidden = useUIStore((s) => s.uiHidden);
  const isBagOpen = useUIStore((s) => s.isBagOpen);
  const setIsBagOpen = useUIStore((s) => s.setIsBagOpen);
  const setBagTab = useUIStore((s) => s.setBagTab);

  const showCornerButtons = gameState === 'idle' && !isBagOpen;

  if (uiMode !== 'mobile' || uiHidden || !showCornerButtons) return null;

  return (
    <button
      type="button"
      aria-label="Åbn Fisketaske"
      className="btn-glass pointer-events-auto touch-manipulation fixed right-4 z-[9980] flex cursor-pointer items-center justify-center rounded-2xl border border-white/20 text-[2.2rem] font-black leading-none text-white shadow-lg transition-all hover:scale-110 active:scale-95"
      style={{
        bottom: '5.35rem',
        width: '7rem',
        height: '7rem',
      }}
      onClick={() => {
        play('ui');
        setBagTab('menu');
        setIsBagOpen(true);
      }}
    >
      🎒
    </button>
  );
}
