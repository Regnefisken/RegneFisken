import type { BodyPattern, FishModelConfig } from '../../types/fish.js';
import { useEditorStore } from '../../store/useEditorStore.js';
import { usesStandardFishMesh } from './editorConstants.js';

function numToHex(n: number): string {
  return `#${(n >>> 0).toString(16).padStart(6, '0')}`;
}

function hexToNum(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

const PATTERN_OPTIONS: { id: BodyPattern; label: string }[] = [
  { id: 'solid', label: 'Ensfarvet (solid)' },
  { id: 'stripes', label: 'Lodrette striber (stripes)' },
  { id: 'hstripes', label: 'Vandrette striber (hstripes)' },
  { id: 'waves', label: 'Bølger (waves)' },
  { id: 'spots', label: 'Pletter (spots)' },
  { id: 'koi', label: 'Koi-pletter (koi)' },
  { id: 'trout', label: 'Ørred-fregner (trout)' },
  { id: 'scales', label: 'Skæl-buer (scales)' },
  { id: 'marble', label: 'Marmor (marble)' },
  { id: 'labyrinth', label: 'Labyrint (labyrinth)' },
  { id: 'leopard', label: 'Leopard-rosetter (leopard)' },
  { id: 'net', label: 'Net/gitter (net)' },
  { id: 'neon', label: 'Neon-linje (neon)' },
  { id: 'bicolor', label: 'Todelt (bicolor)' },
  { id: 'ocellus', label: 'Øjeplet (ocellus)' },
];

export function EditorPatternControls() {
  const config = useEditorStore((s) => s.configOverride);
  const updateConfig = useEditorStore((s) => s.updateConfig);

  if (!config) return null;
  if (!usesStandardFishMesh(config)) {
    return (
      <p className="text-xs text-gray-500">
        Mønstre gælder kun standard fisk-modellen (ikke krabbe, blæksprutte m.m.).
      </p>
    );
  }

  const pattern: BodyPattern = config.bodyPattern ?? 'solid';
  const active = pattern !== 'solid';

  const setPattern = (id: BodyPattern) => {
    if (id === 'solid') {
      updateConfig({
        bodyPattern: undefined,
        patternColor: undefined,
        patternDensity: undefined,
      } as Partial<FishModelConfig>);
      return;
    }
    updateConfig({
      bodyPattern: id,
      patternColor: config.patternColor ?? 0x202020,
      patternDensity: config.patternDensity ?? 1,
    } as Partial<FishModelConfig>);
  };

  return (
    <div className="flex flex-col gap-2 py-1 text-xs">
      <label className="text-gray-400">
        Mønstertype
        <select
          className="mt-0.5 w-full rounded border border-gray-600 bg-gray-800 px-2 py-1 text-white"
          value={pattern}
          onChange={(e) => setPattern(e.target.value as BodyPattern)}
          title="Procedural kropsmønster — ensfarvet bruger klassisk skæl-tekstur"
        >
          {PATTERN_OPTIONS.map(({ id, label }) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>

      {active && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-gray-400" title="Farve som mønsteret tegnes med">
              Mønsterfarve
            </span>
            <input
              type="color"
              className="h-7 w-10 cursor-pointer rounded border border-gray-600 bg-transparent"
              value={numToHex(config.patternColor ?? 0x202020)}
              onChange={(e) =>
                updateConfig({ patternColor: hexToNum(e.target.value) } as Partial<FishModelConfig>)
              }
            />
          </div>
          <label className="text-gray-400">
            Densitet: {(config.patternDensity ?? 1).toFixed(2)}
            <input
              type="range"
              className="mt-0.5 w-full accent-blue-500"
              min={0.3}
              max={4}
              step={0.05}
              value={config.patternDensity ?? 1}
              onChange={(e) =>
                updateConfig({ patternDensity: Number(e.target.value) } as Partial<FishModelConfig>)
              }
              title="Lavere: større/færre gentagelser — højere: tættere mønster"
            />
          </label>
        </>
      )}
    </div>
  );
}
