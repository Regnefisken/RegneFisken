import type { FishModelConfig, MouthType, TeethConfig, TeethType } from '../../types/fish.js';
import { useEditorStore } from '../../store/useEditorStore.js';
import { usesStandardFishMesh } from './editorConstants.js';
import { LockToggle } from './LockToggle.js';

function numToHex(n: number): string {
  return `#${(n >>> 0).toString(16).padStart(6, '0')}`;
}

function hexToNum(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

const TEETH_TYPES: { id: TeethType; label: string }[] = [
  { id: 'shark_double', label: 'Haj (dobbelt række)' },
  { id: 'fangs', label: 'Fangænder' },
  { id: 'tiny', label: 'Små tænder' },
  { id: 'tusks', label: 'Stødtænder' },
];

const MOUTH_TYPES: { id: MouthType; label: string }[] = [
  { id: 'none', label: 'Ingen' },
  { id: 'wide_shark', label: 'Bred haj' },
  { id: 'round_sucker', label: 'Rund sugemund' },
  { id: 'underbite', label: 'Underbid' },
  { id: 'beak', label: 'Næb' },
];

function defaultTeeth(): TeethConfig {
  return { type: 'tiny', count: 12, size: 0.038, color: 0xffffff, zOffset: 0 };
}

function mergeTeeth(patch: Partial<TeethConfig>, prev: TeethConfig | undefined): TeethConfig {
  const base = prev ?? defaultTeeth();
  return { ...base, ...patch };
}

export function EditorMouthControls() {
  const config = useEditorStore((s) => s.configOverride);
  const updateConfig = useEditorStore((s) => s.updateConfig);

  if (!config) return null;
  if (!usesStandardFishMesh(config)) {
    return (
      <p className="text-xs text-gray-500">
        Mund og tænder gælder kun standard fisk-modellen (ikke krabbe, blæksprutte m.m.).
      </p>
    );
  }

  const teethEnabled = config.teeth !== undefined && config.teeth !== false;
  const tc = typeof config.teeth === 'object' && config.teeth !== null ? config.teeth : mergeTeeth({}, undefined);
  const mt: MouthType = config.mouthType ?? 'none';

  const setTeethEnabled = (on: boolean) => {
    if (!on) {
      updateConfig({ teeth: undefined } as Partial<FishModelConfig>);
      return;
    }
    updateConfig({ teeth: defaultTeeth() } as Partial<FishModelConfig>);
  };

  const patchTeeth = (p: Partial<TeethConfig>) => {
    const raw = config.teeth;
    const prev = typeof raw === 'object' && raw !== null ? raw : defaultTeeth();
    updateConfig({ teeth: mergeTeeth(p, prev) } as Partial<FishModelConfig>);
  };

  const setMouthType = (id: MouthType) => {
    if (id === 'none') {
      updateConfig({ mouthType: undefined, mouthOpenness: undefined, mouthColor: undefined } as Partial<FishModelConfig>);
      return;
    }
    updateConfig({
      mouthType: id,
      mouthOpenness: config.mouthOpenness ?? 0.55,
      mouthColor: config.mouthColor ?? 0x2a0808,
    } as Partial<FishModelConfig>);
  };

  return (
    <div className="flex flex-col gap-2 py-1 text-xs">
      <div className="flex items-start gap-1">
        <label className="flex flex-1 items-center gap-2 text-gray-300">
          <input
            type="checkbox"
            checked={teethEnabled}
            onChange={(e) => setTeethEnabled(e.target.checked)}
            title="Tilføj kegle-tænder ved munden"
          />
          Tænder
        </label>
        <LockToggle paramKey="teeth" />
      </div>

      {teethEnabled && (
        <>
          <label className="text-gray-400">
            Type
            <select
              className="mt-0.5 w-full rounded border border-gray-600 bg-gray-800 px-1 py-0.5 text-accent-blue-500"
              value={tc.type}
              onChange={(e) => patchTeeth({ type: e.target.value as TeethType })}
            >
              {TEETH_TYPES.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-gray-400">
            Antal (count): {tc.count ?? 12}
            <input
              type="range"
              className="mt-0.5 w-full accent-blue-500"
              min={4}
              max={28}
              step={1}
              value={tc.count ?? 12}
              onChange={(e) => patchTeeth({ count: Number(e.target.value) })}
              title="Bruges primært til tiny og shark_double"
            />
          </label>
          <label className="text-gray-400">
            Størrelse (size): {(tc.size ?? 0.038).toFixed(3)}
            <input
              type="range"
              className="mt-0.5 w-full accent-blue-500"
              min={0.02}
              max={0.09}
              step={0.001}
              value={tc.size ?? 0.038}
              onChange={(e) => patchTeeth({ size: Number(e.target.value) })}
            />
          </label>
          <label className="text-gray-400">
            Forskydning Z (zOffset): {(tc.zOffset ?? 0).toFixed(2)}
            <input
              type="range"
              className="mt-0.5 w-full accent-blue-500"
              min={-0.25}
              max={0.25}
              step={0.01}
              value={tc.zOffset ?? 0}
              onChange={(e) => patchTeeth({ zOffset: Number(e.target.value) })}
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-gray-400">Tandfarve</span>
            <input
              type="color"
              className="h-7 w-10 cursor-pointer rounded border border-gray-600 bg-transparent"
              value={numToHex(tc.color ?? 0xffffff)}
              onChange={(e) => patchTeeth({ color: hexToNum(e.target.value) })}
            />
          </div>
        </>
      )}

      <div className="mt-1 flex items-start gap-1">
        <label className="flex-1 text-gray-400">
          Mundtype (mouthType)
          <select
            className="mt-0.5 w-full rounded border border-gray-600 bg-gray-800 px-1 py-0.5 text-accent-blue-500"
            value={mt}
            onChange={(e) => setMouthType(e.target.value as MouthType)}
          >
            {MOUTH_TYPES.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <LockToggle paramKey="mouthType" />
      </div>

      {mt !== 'none' && (
        <>
          <label className="text-gray-400">
            Åbenhed (mouthOpenness): {(config.mouthOpenness ?? 0.55).toFixed(2)}
            <input
              type="range"
              className="mt-0.5 w-full accent-blue-500"
              min={0.12}
              max={1}
              step={0.01}
              value={config.mouthOpenness ?? 0.55}
              onChange={(e) =>
                updateConfig({ mouthOpenness: Number(e.target.value) } as Partial<FishModelConfig>)
              }
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-gray-400">Mundfarve</span>
            <input
              type="color"
              className="h-7 w-10 cursor-pointer rounded border border-gray-600 bg-transparent"
              value={numToHex(config.mouthColor ?? 0x2a0808)}
              onChange={(e) => updateConfig({ mouthColor: hexToNum(e.target.value) } as Partial<FishModelConfig>)}
            />
          </div>
        </>
      )}
    </div>
  );
}
