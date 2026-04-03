import { useEffect, useState } from 'react';
import { useAudio } from '../../audio/useAudio';
import {
  getCurrentRoom,
  getFurnitureDisplayLabel,
  type RoomId,
} from '../../data/furnitureShopItems';
import { isCabinLocation } from '../../logic/location-helpers';
import { useGameStore } from '../../store/useGameStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUIStore } from '../../store/useUIStore';
import { cabinMovableRoots } from '../../three/cabin/cabinMovablesRef';
import {
  resetFurnitureToDefaults,
  snapshotFurniturePositions,
} from '../../three/cabin/cabinFurniturePersistence';

function persistMovables() {
  usePlayerStore.getState().setFurniturePositions(snapshotFurniturePositions(cabinMovableRoots.current));
}

const ROOM_MOVE_CHOICES: { id: RoomId; label: string }[] = [
  { id: 'living', label: 'Stue' },
  { id: 'kitchen', label: 'Køkken' },
  { id: 'bedroom', label: 'Soveværelse' },
];

/** Bund møbel-knapper i hytten — legacy ~12764–12838. */
export function CabinFurnitureBar() {
  const { play } = useAudio();
  const currentLocation = useGameStore((s) => s.currentLocation);
  const furnitureMode = useGameStore((s) => s.furnitureMode);
  const setFurnitureMode = useGameStore((s) => s.setFurnitureMode);
  const selectedFurniture = useGameStore((s) => s.selectedFurniture);
  const setSelectedFurniture = useGameStore((s) => s.setSelectedFurniture);
  const hiddenFurniture = usePlayerStore((s) => s.hiddenFurniture);
  const toggleHiddenFurniture = usePlayerStore((s) => s.toggleHiddenFurniture);
  const furnitureRoomAssignment = usePlayerStore((s) => s.furnitureRoomAssignment);
  const moveFurnitureToRoomStore = usePlayerStore((s) => s.moveFurnitureToRoom);
  const setFurniturePositions = usePlayerStore((s) => s.setFurniturePositions);
  const setToastMessage = useUIStore((s) => s.setToastMessage);
  const [roomMoveOpen, setRoomMoveOpen] = useState(false);

  useEffect(() => {
    if (!selectedFurniture) setRoomMoveOpen(false);
  }, [selectedFurniture]);

  if (!isCabinLocation(currentLocation)) return null;

  function hideSelected() {
    if (!selectedFurniture) return;
    toggleHiddenFurniture(selectedFurniture);
    setSelectedFurniture(null);
    play('ui');
  }

  function unhideType(type: string) {
    if (!hiddenFurniture.includes(type)) return;
    toggleHiddenFurniture(type);
    play('ui');
  }

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

  function moveSelectedToRoom(room: RoomId) {
    if (!selectedFurniture) return;
    const currentRoom = getCurrentRoom(selectedFurniture, furnitureRoomAssignment);
    if (room === currentRoom) {
      setRoomMoveOpen(false);
      return;
    }
    const label = getFurnitureDisplayLabel(selectedFurniture);
    moveFurnitureToRoomStore(selectedFurniture, room);
    setFurniturePositions((prev) => {
      const next = { ...prev };
      delete next[selectedFurniture];
      return next;
    });
    setSelectedFurniture(null);
    setRoomMoveOpen(false);
    const roomDa = ROOM_MOVE_CHOICES.find((r) => r.id === room)?.label ?? room;
    setToastMessage(`${label} flyttet til ${roomDa}`);
    play('ui');
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
          <button
            type="button"
            className="rounded-lg border border-white/30 bg-black/55 px-2.5 py-1.5 text-lg text-white"
            onClick={hideSelected}
            aria-label="Skjul møbel"
            title="Skjul møbel"
          >
            👁️
          </button>
          <div className="relative">
            <button
              type="button"
              className="rounded-lg border border-white/30 bg-black/55 px-2.5 py-1.5 text-lg text-white"
              onClick={() => setRoomMoveOpen((o) => !o)}
              aria-expanded={roomMoveOpen}
              aria-haspopup="menu"
              aria-label="Flyt til rum"
              title="Flyt til rum"
            >
              🏠
            </button>
            {roomMoveOpen && (
              <div
                role="menu"
                className="absolute bottom-full left-1/2 z-[9991] mb-1 flex min-w-[10rem] -translate-x-1/2 flex-col gap-0.5 rounded-lg border border-white/25 bg-black/90 py-1 shadow-lg"
              >
                {ROOM_MOVE_CHOICES.map(({ id, label }) => {
                  const currentRoom = selectedFurniture
                    ? getCurrentRoom(selectedFurniture, furnitureRoomAssignment)
                    : null;
                  const disabled = id === currentRoom;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="menuitem"
                      disabled={disabled}
                      className="px-3 py-2 text-left text-sm text-amber-50/95 enabled:hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
                      onClick={() => moveSelectedToRoom(id)}
                    >
                      {label}
                      {disabled ? ' (her)' : ''}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      {furnitureMode && selectedFurniture && (
        <div className="max-w-[min(92vw,22rem)] text-center text-xs text-amber-100/90">
          🖱 scroll = drej · 📱 brug pil-knapper
          <br />
          <span className="opacity-80">
            ↑↓ = højde • træk = placering • ↩↪ = drej • 👁️ = skjul • 🏠 = flyt rum
          </span>
        </div>
      )}
      {furnitureMode && hiddenFurniture.length > 0 && (
        <div
          className="max-w-[min(92vw,24rem)] rounded-xl border border-slate-600/80 bg-black/60 px-3 py-2.5 text-left shadow-lg"
          role="region"
          aria-label="Skjulte møbler"
        >
          <div className="mb-2 text-center text-xs font-bold text-slate-200">👁️‍🗨️ Skjulte møbler</div>
          <ul className="flex max-h-40 flex-col gap-1.5 overflow-y-auto text-sm">
            {hiddenFurniture.map((type) => (
              <li
                key={type}
                className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-2 py-1.5"
              >
                <span className="min-w-0 truncate text-amber-50/95">{getFurnitureDisplayLabel(type)}</span>
                <button
                  type="button"
                  onClick={() => unhideType(type)}
                  className="shrink-0 rounded-md border border-emerald-500/60 bg-emerald-800/80 px-2.5 py-1 text-xs font-bold text-emerald-100 hover:bg-emerald-700/90"
                >
                  Vis
                </button>
              </li>
            ))}
          </ul>
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
