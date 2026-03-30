import type { EyeConfig, EyePupilShape, FishModelConfig } from '../../types/fish.js';
import { useEditorStore } from '../../store/useEditorStore.js';
import { usesStandardFishMesh } from './editorConstants.js';

function numToHex(n: number): string {
  return `#${(n >>> 0).toString(16).padStart(6, '0')}`;
}

function hexToNum(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

const PUPIL_SHAPES: { id: EyePupilShape; label: string }[] = [
  { id: 'sphere', label: 'Kugle (sphere)' },
  { id: 'round', label: 'Flad rund (round)' },
  { id: 'vertical_slit', label: 'Lodret spalte' },
  { id: 'horizontal_slit', label: 'Vandret spalte' },
  { id: 'diamond', label: 'Rude (diamond)' },
  { id: 'star', label: 'Stjerne' },
  { id: 'heart', label: 'Hjerte' },
  { id: 'crescent', label: 'Halvmåne' },
  { id: 'cross', label: 'Kors' },
];

function mergeEye(patch: Partial<EyeConfig>, prev: EyeConfig | undefined): EyeConfig {
  return { ...prev, ...patch };
}

export function EditorEyeControls() {
  const config = useEditorStore((s) => s.configOverride);
  const updateConfig = useEditorStore((s) => s.updateConfig);

  if (!config) return null;
  if (!usesStandardFishMesh(config)) {
    return (
      <p className="text-xs text-gray-500">
        Øje-tilpasning gælder kun standard fisk-modellen (ikke krabbe, blæksprutte m.m.).
      </p>
    );
  }

  const enabled = config.eyeConfig !== undefined;
  const ec = config.eyeConfig;

  const setEnabled = (on: boolean) => {
    if (!on) {
      updateConfig({ eyeConfig: undefined } as Partial<FishModelConfig>);
      return;
    }
    updateConfig({ eyeConfig: {} } as Partial<FishModelConfig>);
  };

  const patch = (p: Partial<EyeConfig>) => {
    updateConfig({ eyeConfig: mergeEye(p, ec) } as Partial<FishModelConfig>);
  };

  return (
    <div className="flex flex-col gap-2 py-1 text-xs">
      <label className="flex items-center gap-2 text-gray-300">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          title="Slå til for at redigere øjne — ellers bruges klassisk udseende"
        />
        Tilpas øjne (eyeConfig)
      </label>

      {enabled && (
        <>
          <label className="text-gray-400">
            Størrelse (size): {(ec?.size ?? 0.14).toFixed(2)}
            <input
              type="range"
              className="mt-0.5 w-full accent-blue-500"
              min={0.15}
              max={0.48}
              step={0.01}
              value={ec?.size ?? 0.14}
              onChange={(e) => patch({ size: Number(e.target.value) })}
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-gray-400" title="Øjenhvid">
              Sclera
            </span>
            <input
              type="color"
              className="h-7 w-10 cursor-pointer rounded border border-gray-600 bg-transparent"
              value={numToHex(ec?.scleraColor ?? 0xffffff)}
              onChange={(e) => patch({ scleraColor: hexToNum(e.target.value) })}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-gray-400">Pupil</span>
            <input
              type="color"
              className="h-7 w-10 cursor-pointer rounded border border-gray-600 bg-transparent"
              value={numToHex(ec?.pupilColor ?? 0x111111)}
              onChange={(e) => patch({ pupilColor: hexToNum(e.target.value) })}
            />
          </div>
          <label className="text-gray-400">
            Pupilform
            <select
              className="mt-0.5 w-full rounded border border-gray-600 bg-gray-800 px-2 py-1 text-white"
              value={ec?.pupilShape ?? 'sphere'}
              onChange={(e) => patch({ pupilShape: e.target.value as EyePupilShape })}
            >
              {PUPIL_SHAPES.map(({ id, label }) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-gray-400">
            Pupil-skala: {(ec?.pupilScale ?? 1).toFixed(2)}
            <input
              type="range"
              className="mt-0.5 w-full accent-blue-500"
              min={0.2}
              max={2.5}
              step={0.05}
              value={ec?.pupilScale ?? 1}
              onChange={(e) => patch({ pupilScale: Number(e.target.value) })}
            />
          </label>
          <label className="text-gray-400">
            Pupil-dybde: {(ec?.pupilDepth ?? 0.85).toFixed(2)}
            <input
              type="range"
              className="mt-0.5 w-full accent-blue-500"
              min={0.5}
              max={0.98}
              step={0.01}
              value={ec?.pupilDepth ?? 0.85}
              onChange={(e) => patch({ pupilDepth: Number(e.target.value) })}
            />
          </label>
          <label className="text-gray-400">
            Offset X (side): {(ec?.offsetX ?? 0).toFixed(2)}
            <input
              type="range"
              className="mt-0.5 w-full accent-blue-500"
              min={-0.4}
              max={0.4}
              step={0.01}
              value={ec?.offsetX ?? 0}
              onChange={(e) => patch({ offsetX: Number(e.target.value) })}
            />
          </label>
          <label className="text-gray-400">
            Offset Y (op/ned): {(ec?.offsetY ?? 0).toFixed(2)}
            <input
              type="range"
              className="mt-0.5 w-full accent-blue-500"
              min={-0.5}
              max={0.5}
              step={0.01}
              value={ec?.offsetY ?? 0}
              onChange={(e) => patch({ offsetY: Number(e.target.value) })}
            />
          </label>
        </>
      )}
    </div>
  );
}
