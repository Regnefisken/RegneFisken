import type { FishModelConfig } from '../../types/fish.js';
import { useEditorStore } from '../../store/useEditorStore.js';
import {
  CREATURE_RADIO_OPTIONS,
  clearCreatureFlags,
  detectCreatureKind,
  type CreatureKind,
} from './editorConstants.js';

const STANDARD_FLAGS: { key: keyof FishModelConfig; label: string; title: string }[] = [
  { key: 'flat', label: 'Flad (flat)', title: 'Flad kropsprofil' },
  { key: 'stripes', label: 'Striber', title: 'Vertikale striber' },
  { key: 'redFins', label: 'Røde finner', title: 'Røde finner' },
  { key: 'isEel', label: 'Ål-krop (isEel)', title: 'Lang smal krop' },
  { key: 'longBeak', label: 'Lang næb', title: 'Langt næb' },
  { key: 'spikes', label: 'Pigge', title: 'Rygpigge' },
  { key: 'uglyHead', label: 'Mærkeligt hoved', title: 'Variant hovedform' },
  { key: 'isPiranha', label: 'Piraja', title: 'Piraja-kæbe' },
  { key: 'finUp', label: 'Rygfinne op', title: 'Stor rygfinne' },
  { key: 'sword', label: 'Sværd', title: 'Svard på snuden' },
  { key: 'whiskers', label: 'Skæg', title: 'Skægtråde' },
  { key: 'lure', label: 'Lokke (lure)', title: 'Lystfisker-lampe' },
  { key: 'noEyes', label: 'Uden øjne', title: 'Skjul øjne' },
  { key: 'isDino', label: 'Dino', title: 'Dino-variant' },
  { key: 'isBossGorm', label: 'Boss Gorm', title: 'Boss Gorm-variant' },
];

export function EditorFeatureToggles() {
  const config = useEditorStore((s) => s.configOverride);
  const updateConfig = useEditorStore((s) => s.updateConfig);
  const selectPart = useEditorStore((s) => s.selectPart);

  if (!config) return null;

  const creature = detectCreatureKind(config);

  const setCreature = (id: CreatureKind) => {
    selectPart(null);
    const cleared = clearCreatureFlags();
    if (id === 'standard') {
      updateConfig(cleared as Partial<FishModelConfig>);
    } else {
      updateConfig({ ...cleared, [id]: true } as Partial<FishModelConfig>);
    }
  };

  const spotsEnabled = config.spots !== undefined && config.spots !== false;
  const spotsMode: 'bool' | 'color' =
    typeof config.spots === 'number' ? 'color' : 'bool';

  return (
    <div className="flex flex-col gap-3 py-1 text-xs">
      <fieldset className="border border-gray-700 p-2">
        <legend className="px-1 text-gray-300" title="Kun én specialmodel ad gangen">
          Væsen-type
        </legend>
        <div className="flex max-h-40 flex-col gap-1 overflow-y-auto">
          {CREATURE_RADIO_OPTIONS.map(({ id, label }) => (
            <label key={id} className="flex cursor-pointer items-center gap-2 text-gray-300">
              <input
                type="radio"
                name="editor-creature"
                checked={creature === id}
                onChange={() => setCreature(id)}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="border border-gray-700 p-2">
        <legend className="px-1 text-gray-300" title="Kun visuelt for standard fisk-modellen">
          Standard fisk — detaljer
        </legend>
        <div className="flex flex-col gap-1">
          {STANDARD_FLAGS.map(({ key, label, title }) => (
            <label key={String(key)} className="flex cursor-pointer items-center gap-2 text-gray-400">
              <input
                type="checkbox"
                checked={Boolean(config[key])}
                onChange={(e) => updateConfig({ [key]: e.target.checked ? true : false } as Partial<FishModelConfig>)}
                title={title}
              />
              <span title={title}>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="border border-gray-700 p-2">
        <legend className="px-1 text-gray-300">Pletter (spots)</legend>
        <label className="mb-1 flex items-center gap-2 text-gray-400">
          <input
            type="checkbox"
            checked={spotsEnabled}
            onChange={(e) => updateConfig({ spots: e.target.checked ? true : undefined })}
          />
          Slå pletter til
        </label>
        {spotsEnabled && (
          <div className="ml-4 flex flex-col gap-1">
            <label className="flex items-center gap-2 text-gray-400">
              <input
                type="radio"
                name="editor-spots-mode"
                checked={spotsMode === 'bool'}
                onChange={() => updateConfig({ spots: true })}
              />
              Standard (mørk)
            </label>
            <label className="flex items-center gap-2 text-gray-400">
              <input
                type="radio"
                name="editor-spots-mode"
                checked={spotsMode === 'color'}
                onChange={() => updateConfig({ spots: 0x333333 })}
              />
              Egen farve (hex)
            </label>
            {spotsMode === 'color' && typeof config.spots === 'number' && (
              <input
                type="color"
                className="h-8 w-16 cursor-pointer rounded border border-gray-600"
                value={`#${(config.spots >>> 0).toString(16).padStart(6, '0')}`}
                onChange={(e) => updateConfig({ spots: parseInt(e.target.value.replace('#', ''), 16) })}
              />
            )}
          </div>
        )}
      </fieldset>

      <div className="flex flex-col gap-2">
        <span className="text-gray-300" title="PBR-materiale">
          Materiale
        </span>
        <label className="text-gray-400">
          Metalness: {(config.metalness ?? 0.12).toFixed(2)}
          <input
            type="range"
            className="w-full accent-blue-500"
            min={0}
            max={1}
            step={0.01}
            value={config.metalness ?? 0.12}
            onChange={(e) => updateConfig({ metalness: Number(e.target.value) })}
          />
        </label>
        <label className="text-gray-400">
          Roughness: {(config.roughness ?? 0.2).toFixed(2)}
          <input
            type="range"
            className="w-full accent-blue-500"
            min={0}
            max={1}
            step={0.01}
            value={config.roughness ?? 0.2}
            onChange={(e) => updateConfig({ roughness: Number(e.target.value) })}
          />
        </label>
      </div>

      <fieldset className="border border-gray-700 p-2">
        <legend className="px-1 text-gray-300">Avanceret</legend>
        <label className="mb-1 text-gray-400">
          maxDisplayScale: {(config.maxDisplayScale ?? 0).toFixed(1)}
          <input
            type="range"
            className="w-full accent-blue-500"
            min={0}
            max={5}
            step={0.1}
            value={config.maxDisplayScale ?? 0}
            onChange={(e) => updateConfig({ maxDisplayScale: Number(e.target.value) || undefined })}
            title="0 = brug default i spillet"
          />
        </label>
        <label className="mb-1 text-gray-400">
          scaleCurve: {(config.scaleCurve ?? 0).toFixed(1)}
          <input
            type="range"
            className="w-full accent-blue-500"
            min={0}
            max={5}
            step={0.1}
            value={config.scaleCurve ?? 0}
            onChange={(e) => updateConfig({ scaleCurve: Number(e.target.value) || undefined })}
          />
        </label>
        <label className="mb-1 text-gray-400">
          openAngle (østers): {config.openAngle ?? 0}°
          <input
            type="range"
            className="w-full accent-blue-500"
            min={0}
            max={180}
            step={1}
            value={config.openAngle ?? 0}
            onChange={(e) => updateConfig({ openAngle: Number(e.target.value) || undefined })}
          />
        </label>
        <label className="flex items-center gap-2 text-gray-400">
          <input
            type="checkbox"
            checked={Boolean(config.hasPearl)}
            onChange={(e) => updateConfig({ hasPearl: e.target.checked || undefined })}
          />
          Perle (hasPearl)
        </label>
        <label className="flex items-center gap-2 text-gray-400">
          <input
            type="checkbox"
            checked={Boolean(config.thinLegs)}
            onChange={(e) => updateConfig({ thinLegs: e.target.checked || undefined })}
          />
          Tynde ben (krabbe)
        </label>
        <label className="flex items-center gap-2 text-gray-400">
          <input
            type="checkbox"
            checked={Boolean(config.isGoldenFrog)}
            onChange={(e) => updateConfig({ isGoldenFrog: e.target.checked || undefined })}
          />
          Gylden frø (isGoldenFrog)
        </label>
      </fieldset>
    </div>
  );
}
