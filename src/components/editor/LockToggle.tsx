import type { MouseEvent } from 'react';
import { useEditorStore } from '../../store/useEditorStore.js';
import { isGraphicsCriticalParamKey } from './editorConstants.js';
import { GraphicsCriticalMarker } from './GraphicsCriticalMarker.js';

/**
 * Lille lås-knap til at beskytte en parameter mod tilfældig-funktionen.
 * Bruges ved siden af sliders, dropdowns og andre kontroller.
 */
export function LockToggle({ paramKey }: { paramKey: string }) {
  const locked = useEditorStore((s) => s.lockedParams.has(paramKey));
  const toggleLock = useEditorStore((s) => s.toggleLock);
  const gc = isGraphicsCriticalParamKey(paramKey);

  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <GraphicsCriticalMarker paramKey={paramKey} />
      <button
        type="button"
        className={`flex h-5 w-5 items-center justify-center rounded text-[10px] transition-colors ${
          locked
            ? gc
              ? 'bg-amber-900/60 text-amber-300 ring-1 ring-red-800/60 hover:bg-amber-800/70'
              : 'bg-amber-900/60 text-amber-300 hover:bg-amber-800/70'
            : gc
              ? 'bg-gray-800 text-gray-500 ring-1 ring-red-900/40 hover:text-gray-400'
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
    </div>
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
  const sectionHasGraphicsCritical = paramKeys.some((k) => isGraphicsCriticalParamKey(k));

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
    <div className={`flex shrink-0 items-center gap-0.5 ${className}`}>
      {sectionHasGraphicsCritical && (
        <span
          className="inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-600 px-0.5 text-[9px] font-black leading-none text-white shadow-sm"
          title="Sektionen indeholder grafik-tunge indstillinger (rød markering ved feltet)."
          aria-hidden
        >
          !
        </span>
      )}
      <button
        type="button"
        className={`flex h-5 w-5 items-center justify-center rounded text-[10px] transition-colors ${
          allLocked
            ? 'bg-amber-900/60 text-amber-300 hover:bg-amber-800/70'
            : 'bg-gray-800 text-gray-600 hover:text-gray-400'
        }`}
        onClick={handleClick}
        title={
          allLocked
            ? 'Alle parametre i sektionen er låst'
            : 'Lås/lås op for alle parametre i sektionen'
        }
      >
        {allLocked ? '🔒' : '🔓'}
      </button>
    </div>
  );
}
