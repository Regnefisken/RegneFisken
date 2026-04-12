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
  const unlockAllExceptGraphicsCritical = useEditorStore((s) => s.unlockAllExceptGraphicsCritical);
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
          title="Generér tilfældige værdier for alle ulåste parametre (grafik-tunge er låst som standard — rødt ! ved feltet)"
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
      <div className="flex flex-col gap-1">
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
            onClick={unlockAllExceptGraphicsCritical}
            title="Låser op for alt undtagen grafik-tunge parametre (dem forbliver låst mod tilfældig)"
          >
            Lås op (uden grafik)
          </button>
        </div>
        <button
          type="button"
          className="w-full rounded border border-red-900/50 bg-red-950/40 px-2 py-0.5 text-[11px] text-red-200/95 hover:bg-red-950/65"
          onClick={unlockAll}
          title="Låser alle parametre op — inkl. grafik-tunge. Tilfældig fisk kan da ændre alt, du ikke manuelt låser igen."
        >
          Lås alt op (inkl. grafik)
        </button>
        <p className="text-[10px] leading-snug text-gray-500">
          Grafik-tunge felter har et rødt <span className="font-bold text-red-400">!</span> og er låst mod tilfældig som
          standard.
        </p>
      </div>
    </div>
  );
}
