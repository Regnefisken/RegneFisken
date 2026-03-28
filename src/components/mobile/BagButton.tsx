import type { CSSProperties } from 'react';
import { useAudio } from '../../audio/useAudio';
import { useGameStore } from '../../store/useGameStore';
import { useUIStore } from '../../store/useUIStore';

const btnStyle: CSSProperties = {
  position: 'fixed',
  bottom: '5.35rem',
  right: '1rem',
  zIndex: 9980,
  width: '7rem',
  height: '7rem',
  background: 'linear-gradient(135deg, #1e3a5f, #0f172a)',
  border: '2px solid rgba(56,189,248,0.5)',
  borderRadius: '1rem',
  color: 'white',
  fontWeight: 900,
  fontSize: '2.2rem',
  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

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
      style={btnStyle}
      className="pointer-events-auto touch-manipulation"
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
