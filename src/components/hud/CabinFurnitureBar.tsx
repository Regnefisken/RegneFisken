import { useAudio } from '../../audio/useAudio';
import { isCabinLocation } from '../../logic/location-helpers';
import { useGameStore } from '../../store/useGameStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { cabinMovableRoots } from '../../three/cabin/cabinMovablesRef';
import {
  resetFurnitureToDefaults,
  snapshotFurniturePositions,
} from '../../three/cabin/cabinFurniturePersistence';

function persistMovables() {
  usePlayerStore.getState().setFurniturePositions(snapshotFurniturePositions(cabinMovableRoots.current));
}

/** Bund møbel-knapper i hytten — legacy ~12764–12838. */
export function CabinFurnitureBar() {
  const { play } = useAudio();
  const currentLocation = useGameStore((s) => s.currentLocation);
  const furnitureMode = useGameStore((s) => s.furnitureMode);
  const setFurnitureMode = useGameStore((s) => s.setFurnitureMode);
  const selectedFurniture = useGameStore((s) => s.selectedFurniture);
  const setSelectedFurniture = useGameStore((s) => s.setSelectedFurniture);

  if (!isCabinLocation(currentLocation)) return null;

  function toggleFurnitureMode() {
    const next = !furnitureMode;
    setFurnitureMode(next);
    if (!next) {
      persistMovables();
      for (const obj of cabinMovableRoots.current) {
        if (obj.userData?.movableType === 'turtle') {
          (obj.userData as { _savedY?: number })._savedY = obj.position.y;
        }
      }
      setSelectedFurniture(null);
    }
  }

  function resetFurniture() {
    resetFurnitureToDefaults(cabinMovableRoots.current);
    persistMovables();
    setSelectedFurniture(null);
    play('ui');
  }

  function nudgeSelected(dy: number, drot: number) {
    if (!selectedFurniture) return;
    const obj = cabinMovableRoots.current.find((o) => o.userData?.movableType === selectedFurniture);
    if (!obj) return;
    obj.position.y += dy;
    obj.rotation.y += drot;
    persistMovables();
  }

  return (
    <div
      className="pointer-events-auto fixed left-1/2 z-[9990] flex -translate-x-1/2 flex-col items-center gap-2"
      style={{ bottom: '1.5rem' }}
    >
      {furnitureMode && selectedFurniture && (
        <div className="flex flex-wrap justify-center gap-1.5">
          <button
            type="button"
            className="rounded-lg border border-white/30 bg-black/55 px-2.5 py-1.5 text-lg text-white"
            onClick={() => nudgeSelected(0, -Math.PI / 8)}
            aria-label="Drej mod uret"
          >
            ↩
          </button>
          <button
            type="button"
            className="rounded-lg border border-white/30 bg-black/55 px-2.5 py-1.5 text-lg text-white"
            onClick={() => nudgeSelected(0, Math.PI / 8)}
            aria-label="Drej med uret"
          >
            ↪
          </button>
          <button
            type="button"
            className="rounded-lg border border-white/30 bg-black/55 px-2.5 py-1.5 text-lg text-white"
            onClick={() => nudgeSelected(0.12, 0)}
            aria-label="Højere"
          >
            ↑
          </button>
          <button
            type="button"
            className="rounded-lg border border-white/30 bg-black/55 px-2.5 py-1.5 text-lg text-white"
            onClick={() => nudgeSelected(-0.12, 0)}
            aria-label="Lavere"
          >
            ↓
          </button>
        </div>
      )}
      {furnitureMode && selectedFurniture && (
        <div className="max-w-[min(92vw,22rem)] text-center text-xs text-amber-100/90">
          🖱 scroll = drej · 📱 brug pil-knapper
          <br />
          <span className="opacity-80">↑↓ = højde • træk = placering • ↩↪ = drej</span>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => {
            play('ui');
            toggleFurnitureMode();
          }}
          className="touch-manipulation rounded-xl px-5 py-2.5 font-black shadow-lg transition-transform hover:scale-105"
          style={{
            border: furnitureMode ? '2px solid #34d399' : '2px solid rgba(196,136,58,0.55)',
            background: furnitureMode ? 'rgba(5,150,105,0.92)' : 'rgba(60,35,10,0.88)',
            color: furnitureMode ? '#d1fae5' : '#fde68a',
            boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
          }}
        >
          {furnitureMode ? '✅ Færdig' : '🛋 Arranger møbler'}
        </button>
        {furnitureMode && (
          <button
            type="button"
            onClick={() => {
              play('ui');
              resetFurniture();
            }}
            className="touch-manipulation rounded-xl border-2 border-red-400/70 bg-red-900/85 px-4 py-2.5 font-bold text-red-100 shadow-md hover:bg-red-800/90"
          >
            ↺ Nulstil
          </button>
        )}
      </div>
      {furnitureMode && !selectedFurniture && (
        <p className="max-w-[min(92vw,24rem)] text-center text-sm text-amber-100/85">
          Klik på et møbel for at vælge det — træk for at flytte
        </p>
      )}
    </div>
  );
}
