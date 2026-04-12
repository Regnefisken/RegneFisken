import type { MouseEvent } from 'react';
import { useEditorStore } from '../../store/useEditorStore.js';

/**
 * Lille lås-knap til at beskytte en parameter mod tilfældig-funktionen.
 * Bruges ved siden af sliders, dropdowns og andre kontroller.
 */
export function LockToggle({ paramKey }: { paramKey: string }) {
  const locked = useEditorStore((s) => s.lockedParams.has(paramKey));
  const toggleLock = useEditorStore((s) => s.toggleLock);

  return (
    <button
      type="button"
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] transition-colors ${
        locked
          ? 'bg-amber-900/60 text-amber-300 hover:bg-amber-800/70'
          : 'bg-gray-800 text-gray-600 hover:text-gray-400'
      }`}
      onClick={() => toggleLock(paramKey)}
      title={
        locked
          ? `Låst — "${paramKey}" beskyttes ved tilfældig`
          : `Ulåst — "${paramKey}" kan ændres ved tilfældig`
      }
    >
      {locked ? '🔒' : '🔓'}
    </button>
  );
}

/**
 * Lås-knap til en hel sektion. Toggler alle parametre i sektionen.
 * Bruges i <summary>-linjen på en <details>-sektion.
 */
export function SectionLockToggle({
  paramKeys,
  className = '',
}: {
  paramKeys: string[];
  className?: string;
}) {
  const lockedParams = useEditorStore((s) => s.lockedParams);
  const toggleLock = useEditorStore((s) => s.toggleLock);

  const allLocked = paramKeys.every((k) => lockedParams.has(k));

  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    for (const key of paramKeys) {
      const isLocked = lockedParams.has(key);
      if (allLocked && isLocked) {
        toggleLock(key);
      } else if (!allLocked && !isLocked) {
        toggleLock(key);
      }
    }
  };

  return (
    <button
      type="button"
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] transition-colors ${
        allLocked
          ? 'bg-amber-900/60 text-amber-300 hover:bg-amber-800/70'
          : 'bg-gray-800 text-gray-600 hover:text-gray-400'
      } ${className}`}
      onClick={handleClick}
      title={
        allLocked
          ? 'Alle parametre i sektionen er låst'
          : 'Lås/lås op for alle parametre i sektionen'
      }
    >
      {allLocked ? '🔒' : '🔓'}
    </button>
  );
}
