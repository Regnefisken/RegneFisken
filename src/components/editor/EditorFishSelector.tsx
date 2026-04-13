import { CATCH_MASTER_DATA } from '../../data/fish.js';
import { useEditorStore } from '../../store/useEditorStore.js';
import { ITEM_TYPE_OPTIONS, PRIMARY_AREA_OPTIONS, RARITY_GROUPS } from './editorConstants.js';

const CATCH_TYPES = ['fish', 'special', 'quest', 'danger', 'treasure', 'boss'] as const;

export function EditorFishSelector() {
  const mode = useEditorStore((s) => s.mode);
  const setMode = useEditorStore((s) => s.setMode);
  const startNewFish = useEditorStore((s) => s.startNewFish);
  const selectFish = useEditorStore((s) => s.selectFish);
  const selectedFishId = useEditorStore((s) => s.selectedFishId);
  const cloneFromExisting = useEditorStore((s) => s.cloneFromExisting);
  const newFishMeta = useEditorStore((s) => s.newFishMeta);
  const setNewFishMeta = useEditorStore((s) => s.setNewFishMeta);

  const withModel = CATCH_MASTER_DATA.filter((c) => c.model != null);

  const toggleArea = (id: string) => {
    const set = new Set(newFishMeta.primaryAreas);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    setNewFishMeta({ primaryAreas: [...set] });
  };

  return (
    <div className="flex flex-col gap-2 py-1 text-sm">
      <div className="flex gap-1">
        <button
          type="button"
          className={`flex-1 rounded px-2 py-1 text-xs ${mode === 'edit' ? 'bg-blue-600' : 'bg-gray-700'}`}
          onClick={() => setMode('edit')}
          title="Vælg en eksisterende fangst fra databasen"
        >
          Redigér eksisterende
        </button>
        <button
          type="button"
          className={`flex-1 rounded px-2 py-1 text-xs ${mode === 'create' ? 'bg-blue-600' : 'bg-gray-700'}`}
          onClick={() => startNewFish()}
          title="Opret helt ny fisk med standard model-config"
        >
          Opret ny
        </button>
      </div>

      {mode === 'edit' ? (
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-300" htmlFor="editor-fish-select">
            Fisk
          </label>
          <select
            id="editor-fish-select"
            className="rounded border border-gray-600 bg-gray-800 px-2 py-1 text-xs text-white"
            value={selectedFishId ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              if (v) selectFish(v);
            }}
            title="Liste over alle arter med 3D-model"
          >
            <option value="">— Vælg fisk —</option>
            {RARITY_GROUPS.map((rarity) => {
              const group = withModel.filter((c) => c.rarity === rarity);
              if (group.length === 0) return null;
              return (
                <optgroup key={rarity} label={rarity}>
                  {group.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.id})
                    </option>
                  ))}
                </optgroup>
              );
            })}
            {(() => {
              const listed = new Set<string>(RARITY_GROUPS);
              const rest = withModel.filter((c) => !listed.has(c.rarity));
              if (rest.length === 0) return null;
              return (
                <optgroup label="Øvrige">
                  {rest.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.id})
                    </option>
                  ))}
                </optgroup>
              );
            })()}
          </select>
          <button
            type="button"
            className="rounded bg-amber-700 px-2 py-1 text-xs disabled:opacity-40"
            disabled={!selectedFishId}
            onClick={() => selectedFishId && cloneFromExisting(selectedFishId)}
            title="Kopier valgt fisk til create-mode med nyt id"
          >
            Klonér til ny
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-1">
            <label className="text-xs text-gray-400">
              Id
              <input
                className="mt-0.5 w-full rounded border border-gray-600 bg-gray-800 px-1 py-0.5 text-xs"
                value={newFishMeta.id}
                onChange={(e) => setNewFishMeta({ id: e.target.value })}
                title="Unikt id (fx fisk_havgus)"
              />
            </label>
            <label className="text-xs text-gray-400">
              Navn
              <input
                className="mt-0.5 w-full rounded border border-gray-600 bg-gray-800 px-1 py-0.5 text-xs"
                value={newFishMeta.name}
                onChange={(e) => setNewFishMeta({ name: e.target.value })}
                title="Vist navn i spillet"
              />
            </label>
          </div>
          <label className="text-xs text-gray-400">
            Sjældenhed
            <select
              className="mt-0.5 w-full rounded border border-gray-600 bg-gray-800 px-1 py-0.5 text-xs"
              value={newFishMeta.rarity}
              onChange={(e) => setNewFishMeta({ rarity: e.target.value })}
            >
              {RARITY_GROUPS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-gray-400">
            Type
            <select
              className="mt-0.5 w-full rounded border border-gray-600 bg-gray-800 px-1 py-0.5 text-xs"
              value={newFishMeta.type}
              onChange={(e) => setNewFishMeta({ type: e.target.value })}
            >
              {CATCH_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-gray-400">
            itemType
            <select
              className="mt-0.5 w-full rounded border border-gray-600 bg-gray-800 px-1 py-0.5 text-xs"
              value={newFishMeta.itemType}
              onChange={(e) => setNewFishMeta({ itemType: e.target.value })}
            >
              {ITEM_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <details className="rounded border border-gray-700/60">
            <summary className="cursor-pointer px-1 py-0.5 text-xs text-gray-400">
              ▸ Områder (primaryAreas)
            </summary>
            <div className="flex flex-col gap-0.5 p-1">
              {PRIMARY_AREA_OPTIONS.map(({ id, label }) => (
                <label key={id} className="flex cursor-pointer items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={newFishMeta.primaryAreas.includes(id)}
                    onChange={() => toggleArea(id)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </details>
          <details className="rounded border border-amber-900/40">
            <summary className="cursor-pointer px-1 py-0.5 text-xs text-amber-200/90">
              ▸ Krav &amp; valgfrit (til entry-skelet)
            </summary>
            <div className="flex flex-col gap-1.5 p-1 text-xs text-gray-300">
              <p className="text-[10px] leading-snug text-gray-500">
                Tomme felter udelades ved «Kopiér entry-skelet». Brug fx <span className="font-mono">rod_mahogni</span> eller
                lad stå tom for <span className="font-mono">null</span>.
              </p>
              <div className="grid grid-cols-2 gap-1">
                <label className="text-[10px] text-gray-400">
                  requiredRod
                  <input
                    className="mt-0.5 w-full rounded border border-gray-600 bg-gray-800 px-1 py-0.5 font-mono text-[10px]"
                    value={newFishMeta.requiredRod}
                    onChange={(e) => setNewFishMeta({ requiredRod: e.target.value })}
                    placeholder="(tom = null)"
                  />
                </label>
                <label className="text-[10px] text-gray-400">
                  requiredBait
                  <input
                    className="mt-0.5 w-full rounded border border-gray-600 bg-gray-800 px-1 py-0.5 font-mono text-[10px]"
                    value={newFishMeta.requiredBait}
                    onChange={(e) => setNewFishMeta({ requiredBait: e.target.value })}
                    placeholder="(tom = null)"
                  />
                </label>
              </div>
              <label className="text-[10px] text-gray-400">
                requiredUpgrade
                <input
                  className="mt-0.5 w-full rounded border border-gray-600 bg-gray-800 px-1 py-0.5 font-mono text-[10px]"
                  value={newFishMeta.requiredUpgrade}
                  onChange={(e) => setNewFishMeta({ requiredUpgrade: e.target.value })}
                  placeholder="fx magnet — tom = udelad"
                />
              </label>
              <div className="grid grid-cols-2 gap-1">
                <label className="text-[10px] text-gray-400">
                  lootWeight
                  <input
                    className="mt-0.5 w-full rounded border border-gray-600 bg-gray-800 px-1 py-0.5 font-mono text-[10px]"
                    value={newFishMeta.lootWeight}
                    onChange={(e) => setNewFishMeta({ lootWeight: e.target.value })}
                    placeholder="preload-prioritet"
                  />
                </label>
                <label className="text-[10px] text-gray-400">
                  specialOnCatch
                  <input
                    className="mt-0.5 w-full rounded border border-gray-600 bg-gray-800 px-1 py-0.5 font-mono text-[10px]"
                    value={newFishMeta.specialOnCatch}
                    onChange={(e) => setNewFishMeta({ specialOnCatch: e.target.value })}
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <label className="text-[10px] text-gray-400">
                  weightRange min
                  <input
                    className="mt-0.5 w-full rounded border border-gray-600 bg-gray-800 px-1 py-0.5 font-mono text-[10px]"
                    value={newFishMeta.weightRangeMin}
                    onChange={(e) => setNewFishMeta({ weightRangeMin: e.target.value })}
                  />
                </label>
                <label className="text-[10px] text-gray-400">
                  weightRange max
                  <input
                    className="mt-0.5 w-full rounded border border-gray-600 bg-gray-800 px-1 py-0.5 font-mono text-[10px]"
                    value={newFishMeta.weightRangeMax}
                    onChange={(e) => setNewFishMeta({ weightRangeMax: e.target.value })}
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <label className="text-[10px] text-gray-400">
                  value
                  <input
                    className="mt-0.5 w-full rounded border border-gray-600 bg-gray-800 px-1 py-0.5 font-mono text-[10px]"
                    value={newFishMeta.value}
                    onChange={(e) => setNewFishMeta({ value: e.target.value })}
                  />
                </label>
                <label className="text-[10px] text-gray-400">
                  xpReward
                  <input
                    className="mt-0.5 w-full rounded border border-gray-600 bg-gray-800 px-1 py-0.5 font-mono text-[10px]"
                    value={newFishMeta.xpReward}
                    onChange={(e) => setNewFishMeta({ xpReward: e.target.value })}
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <label className="text-[10px] text-gray-400">
                  visual
                  <input
                    className="mt-0.5 w-full rounded border border-gray-600 bg-gray-800 px-1 py-0.5 font-mono text-[10px]"
                    value={newFishMeta.visual}
                    onChange={(e) => setNewFishMeta({ visual: e.target.value })}
                    placeholder="junk/treasure …"
                  />
                </label>
                <label className="text-[10px] text-gray-400">
                  visualScale
                  <input
                    className="mt-0.5 w-full rounded border border-gray-600 bg-gray-800 px-1 py-0.5 font-mono text-[10px]"
                    value={newFishMeta.visualScale}
                    onChange={(e) => setNewFishMeta({ visualScale: e.target.value })}
                  />
                </label>
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
