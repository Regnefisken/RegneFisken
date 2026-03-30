import { useEditorStore } from '../../store/useEditorStore.js';

function numToHex(n: number): string {
  return `#${(n >>> 0).toString(16).padStart(6, '0')}`;
}

function hexToNum(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

const DEFAULT_BIO_COLOR = 0x00ffcc;
const DEFAULT_BIO_INTENSITY = 1.5;
const DEFAULT_PUFF = 0.45;
const DEFAULT_SPIKE_DENSITY = 1;

export function EditorExtremeControls() {
  const config = useEditorStore((s) => s.configOverride);
  const updateConfig = useEditorStore((s) => s.updateConfig);

  if (!config) return null;

  const bio = config.bioluminescent;
  const bioOn = bio?.enabled === true;
  const puff = config.pufferInflation;

  return (
    <div className="flex flex-col gap-3 py-1 text-xs">
      <div className="flex flex-col gap-2 border-b border-gray-700 pb-2">
        <span className="text-gray-300" title="Lysende midterlinje på kroppen">
          Bioluminescens
        </span>
        <label className="flex cursor-pointer items-center gap-2 text-gray-400">
          <input
            type="checkbox"
            className="accent-blue-500"
            checked={bioOn}
            onChange={(e) => {
              if (e.target.checked) {
                updateConfig({
                  bioluminescent: {
                    enabled: true,
                    color: bio?.color ?? DEFAULT_BIO_COLOR,
                    intensity: bio?.intensity ?? DEFAULT_BIO_INTENSITY,
                  },
                });
              } else {
                updateConfig({ bioluminescent: undefined });
              }
            }}
            title="Slår lysende prikker langs kroppen til/fra"
          />
          Aktivér bioluminescens
        </label>
        {bioOn && bio && (
          <>
            <div className="flex flex-col gap-0.5">
              <span className="text-gray-500">Farve</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-8 w-10 cursor-pointer rounded border border-gray-600 bg-transparent"
                  value={numToHex(bio.color)}
                  onChange={(e) =>
                    updateConfig({
                      bioluminescent: {
                        enabled: true,
                        color: hexToNum(e.target.value),
                        intensity: bio.intensity,
                      },
                    })
                  }
                />
                <input
                  className="flex-1 rounded border border-gray-600 bg-gray-800 px-1 py-0.5 font-mono text-[11px] text-white"
                  value={numToHex(bio.color)}
                  onChange={(e) => {
                    const raw = e.target.value.trim();
                    if (/^#[0-9a-fA-F]{6}$/.test(raw)) {
                      updateConfig({
                        bioluminescent: {
                          enabled: true,
                          color: hexToNum(raw),
                          intensity: bio.intensity,
                        },
                      });
                    }
                  }}
                />
              </div>
            </div>
            <label className="flex flex-col gap-0.5 text-gray-400" title="0–3 — pulserende styrke">
              <span>Intensitet ({bio.intensity.toFixed(2)})</span>
              <input
                type="range"
                className="w-full accent-blue-500"
                min={0}
                max={3}
                step={0.05}
                value={bio.intensity}
                onChange={(e) =>
                  updateConfig({
                    bioluminescent: {
                      enabled: true,
                      color: bio.color,
                      intensity: Number(e.target.value),
                    },
                  })
                }
              />
            </label>
          </>
        )}
      </div>

      <div className="flex flex-col gap-2 border-b border-gray-700 pb-2">
        <span className="text-gray-300" title="Additive partikler og lyn omkring fisken">
          Elektricitet
        </span>
        <label className="flex cursor-pointer items-center gap-2 text-gray-400">
          <input
            type="checkbox"
            className="accent-blue-500"
            checked={config.electricSparks === true}
            onChange={(e) => updateConfig({ electricSparks: e.target.checked ? true : undefined })}
            title="Orbiterende gnister"
          />
          Elektriske gnister
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-gray-400">
          <input
            type="checkbox"
            className="accent-blue-500"
            checked={config.electricBolts === true}
            onChange={(e) => updateConfig({ electricBolts: e.target.checked ? true : undefined })}
            title="Zigzag-lyn der flimrer"
          />
          Lyn-bolts
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-gray-300" title="Oppustet krop og pigge">
          Puffer / kuglefisk
        </span>
        <label className="flex cursor-pointer items-center gap-2 text-gray-400">
          <input
            type="checkbox"
            className="accent-blue-500"
            checked={puff != null}
            onChange={(e) => {
              if (e.target.checked) {
                updateConfig({
                  pufferInflation: {
                    puff: puff?.puff ?? DEFAULT_PUFF,
                    spikeDensity: puff?.spikeDensity ?? DEFAULT_SPIKE_DENSITY,
                  },
                });
              } else {
                updateConfig({ pufferInflation: undefined });
              }
            }}
            title="Skaler krop og tilføj pigge"
          />
          Aktivér puffer-effekt
        </label>
        {puff != null && (
          <>
            <label className="flex flex-col gap-0.5 text-gray-400" title="0–1 — oppustning af krop (X/Y)">
              <span>Oppustning ({puff.puff.toFixed(2)})</span>
              <input
                type="range"
                className="w-full accent-blue-500"
                min={0}
                max={1}
                step={0.01}
                value={puff.puff}
                onChange={(e) =>
                  updateConfig({
                    pufferInflation: {
                      puff: Number(e.target.value),
                      spikeDensity: puff.spikeDensity,
                    },
                  })
                }
              />
            </label>
            <label
              className="flex flex-col gap-0.5 text-gray-400"
              title="0.3–1.5 — antal og tæthed af pigge"
            >
              <span>Pigge-tæthed ({puff.spikeDensity.toFixed(2)})</span>
              <input
                type="range"
                className="w-full accent-blue-500"
                min={0.3}
                max={1.5}
                step={0.02}
                value={puff.spikeDensity}
                onChange={(e) =>
                  updateConfig({
                    pufferInflation: {
                      puff: puff.puff,
                      spikeDensity: Number(e.target.value),
                    },
                  })
                }
              />
            </label>
          </>
        )}
      </div>
    </div>
  );
}
