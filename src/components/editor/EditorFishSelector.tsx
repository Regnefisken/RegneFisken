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
  const updateConfig = useEditorStore((s) => s.updateConfig);

  const withModel = CATCH_MASTER_DATA.filter((c) => c.model != null);

  const toggleArea = (id: string) => {
    const set = new Set(newFishMeta.primaryAreas);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    setNewFishMeta({ primaryAreas: [...set] });
  };

  const applyPreset = (key: 'standard' | 'eel' | 'flatfish' | 'crab' | 'octopus') => {
    const clear = {
      isFrog: false,
      isStarfish: false,
      isCrab: false,
      isOctopus: false,
      isLobster: false,
      isRay: false,
      isWhiteShark: false,
      isGoldenCarp: false,
      isBottle: false,
      isOyster: false,
      isConch: false,
      isFossil: false,
      isGoldenFrog: false,
    };
    if (key === 'standard') {
      updateConfig({
        ...clear,
        bodyShape: [1, 1, 1.2],
        tail: 'standard',
        scale: 1,
        speed: 1,
        flat: false,
        isEel: false,
      });
    } else if (key === 'eel') {
      updateConfig({
        ...clear,
        bodyShape: [0.4, 0.4, 2.5],
        tail: 'eel',
        isEel: true,
        scale: 1,
        speed: 0.8,
      });
    } else if (key === 'flatfish') {
      updateConfig({
        ...clear,
        bodyShape: [1.4, 0.3, 1.2],
        tail: 'flat',
        flat: true,
        scale: 0.9,
        speed: 0.7,
      });
    } else if (key === 'crab') {
      updateConfig({
        ...clear,
        bodyShape: [1.3, 0.5, 1.0],
        tail: 'none',
        isCrab: true,
        scale: 0.7,
        speed: 0.5,
      });
    } else if (key === 'octopus') {
      updateConfig({
        ...clear,
        bodyShape: [1, 1, 1],
        tail: 'none',
        isOctopus: true,
        scale: 1,
        speed: 0.5,
      });
    }
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
          <fieldset className="border border-gray-700 p-1">
            <legend className="px-1 text-xs text-gray-400">Områder (primaryAreas)</legend>
            <div className="flex flex-col gap-0.5">
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
          </fieldset>
          <div className="text-xs text-gray-400">Arketyp</div>
          <div className="flex flex-wrap gap-1">
            {(
              [
                ['standard', 'Standard fisk'],
                ['eel', 'Ål'],
                ['flatfish', 'Fladfisk'],
                ['crab', 'Krabbe'],
                ['octopus', 'Blæksprutte'],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                className="rounded bg-gray-700 px-2 py-0.5 text-xs hover:bg-gray-600"
                onClick={() => applyPreset(k)}
                title={`Sæt model-config til ${label}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
