import { useEditorStore } from '../../store/useEditorStore.js';

/**
 * Toolbar med tilfældig-knap, mutation-slider og globale lås-knapper.
 * Placeres i header-området af FishEditorPanel.
 */
export function EditorRandomizeBar() {
  const configOverride = useEditorStore((s) => s.configOverride);
  const mutationDegree = useEditorStore((s) => s.mutationDegree);
  const setMutationDegree = useEditorStore((s) => s.setMutationDegree);
  const randomizeFish = useEditorStore((s) => s.randomizeFish);
  const undoRandomizeFish = useEditorStore((s) => s.undoRandomizeFish);
  const randomizeUndoCount = useEditorStore((s) => s.randomizeUndoStack.length);
  const lockAll = useEditorStore((s) => s.lockAll);
  const unlockAll = useEditorStore((s) => s.unlockAll);

  if (!configOverride) return null;

  const canUndoRandom = randomizeUndoCount > 0;

  return (
    <div className="flex flex-col gap-1.5 border-t border-gray-700 pt-2">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-gray-700 text-base leading-none text-gray-200 hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-35"
          onClick={undoRandomizeFish}
          disabled={!canUndoRandom}
          title="Fortryd seneste tilfældig fisk — gå ét skridt tilbage"
          aria-label="Fortryd seneste tilfældig fisk"
        >
          ←
        </button>
        <button
          type="button"
          className="shrink-0 rounded bg-purple-700 px-2.5 py-1 text-xs font-medium hover:bg-purple-600"
          onClick={randomizeFish}
          title="Generér tilfældige værdier for alle ulåste parametre"
        >
          Tilfældig fisk
        </button>
        <label
          className="flex flex-1 items-center gap-1 text-[11px] text-gray-400"
          title="Hvor stor del af parametrene der ændres ved hvert tryk (0% = ingen, 100% = alle ulåste)"
        >
          <span className="shrink-0 whitespace-nowrap">Mutation:</span>
          <input
            type="range"
            className="flex-1 accent-purple-500"
            min={0}
            max={1}
            step={0.05}
            value={mutationDegree}
            onChange={(e) => setMutationDegree(Number(e.target.value))}
          />
          <span className="w-8 text-right text-gray-300">{Math.round(mutationDegree * 100)}%</span>
        </label>
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          className="flex-1 rounded bg-gray-700 px-2 py-0.5 text-[11px] text-gray-300 hover:bg-gray-600"
          onClick={lockAll}
          title="Lås alle parametre — ingen ændres ved tilfældig"
        >
          Lås alle
        </button>
        <button
          type="button"
          className="flex-1 rounded bg-gray-700 px-2 py-0.5 text-[11px] text-gray-300 hover:bg-gray-600"
          onClick={unlockAll}
          title="Lås alle parametre op — alle kan ændres ved tilfældig"
        >
          Lås alle op
        </button>
      </div>
    </div>
  );
}
