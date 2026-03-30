import { useEditorStore } from '../../store/useEditorStore.js';
import { TAIL_TYPE_LABEL_DA, TAIL_TYPES } from './editorConstants.js';

export function EditorBodyControls() {
  const config = useEditorStore((s) => s.configOverride);
  const updateConfig = useEditorStore((s) => s.updateConfig);

  if (!config) return null;

  const updateBodyShape = (index: 0 | 1 | 2, value: number) => {
    const current = [...config.bodyShape] as [number, number, number];
    current[index] = value;
    updateConfig({ bodyShape: current });
  };

  return (
    <div className="flex flex-col gap-2 py-1 text-xs">
      <SliderRow
        label="Bredde (bodyShape[0])"
        title="Krop bredde langs X"
        min={0.1}
        max={3}
        step={0.05}
        value={config.bodyShape[0]}
        onChange={(v) => updateBodyShape(0, v)}
      />
      <SliderRow
        label="Højde (bodyShape[1])"
        title="Krop højde langs Y"
        min={0.1}
        max={3}
        step={0.05}
        value={config.bodyShape[1]}
        onChange={(v) => updateBodyShape(1, v)}
      />
      <SliderRow
        label="Længde (bodyShape[2])"
        title="Krop længde langs Z"
        min={0.1}
        max={3}
        step={0.05}
        value={config.bodyShape[2]}
        onChange={(v) => updateBodyShape(2, v)}
      />
      <SliderRow
        label="Skala"
        title="Samlet model-skala"
        min={0.1}
        max={3}
        step={0.05}
        value={config.scale}
        onChange={(v) => updateConfig({ scale: v })}
      />
      <SliderRow
        label="Hastighed"
        title="Animationshastighed i spillet"
        min={0.1}
        max={5}
        step={0.1}
        value={config.speed}
        onChange={(v) => updateConfig({ speed: v })}
      />
      <label className="flex flex-col gap-0.5 text-gray-300" title="Haleform — extruderede former (slør, lyre, …) kræver standard fisk">
        <span>Haleform</span>
        <select
          className="rounded border border-gray-600 bg-gray-800 px-2 py-1 text-white accent-blue-500"
          value={config.tail}
          onChange={(e) => updateConfig({ tail: e.target.value as (typeof TAIL_TYPES)[number] })}
        >
          {TAIL_TYPES.map((t) => (
            <option key={t} value={t}>
              {TAIL_TYPE_LABEL_DA[t]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function SliderRow({
  label,
  title,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  title: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-0.5 text-gray-300">
      <span title={title}>
        {label}: <span className="text-gray-400">{value.toFixed(2)}</span>
      </span>
      <input
        type="range"
        className="w-full accent-blue-500"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
