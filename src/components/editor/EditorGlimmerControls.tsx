import { useEditorStore } from '../../store/useEditorStore.js';

function numToHex(n: number): string {
  return `#${(n >>> 0).toString(16).padStart(6, '0')}`;
}

function hexToNum(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

const DEFAULT_GLIMMER_COLOR = 0xffe8a8;

export function EditorGlimmerControls() {
  const config = useEditorStore((s) => s.configOverride);
  const updateConfig = useEditorStore((s) => s.updateConfig);

  if (!config) return null;

  const g = config.glimmer;
  const fg = config.finGlimmer;
  const gAmt = g?.amount ?? 0;
  const fgAmt = fg?.amount ?? 0;
  const gCol = g?.color ?? DEFAULT_GLIMMER_COLOR;
  const fgCol = fg?.color ?? DEFAULT_GLIMMER_COLOR;
  const gPl = g?.placement ?? 0;
  const fgPl = fg?.placement ?? 0;

  return (
    <div className="flex flex-col gap-3 py-1 text-xs">
      <div className="flex flex-col gap-2">
        <span className="text-gray-300" title="Emissive-pletter + materiale (standard fisk)">
          Glimmer — krop
        </span>
        <label className="flex flex-col gap-0.5 text-gray-400">
          <span>Mængde (0 = slået fra) ({gAmt.toFixed(2)})</span>
          <input
            type="range"
            className="w-full accent-blue-500"
            min={0}
            max={1}
            step={0.01}
            value={gAmt}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (v <= 0) updateConfig({ glimmer: undefined });
              else updateConfig({ glimmer: { amount: v, color: gCol, placement: gPl } });
            }}
          />
        </label>
        {gAmt > 0 && (
          <>
            <div className="flex flex-col gap-0.5">
              <span className="text-gray-500">Glimmerfarve</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-8 w-10 cursor-pointer rounded border border-gray-600 bg-transparent"
                  value={numToHex(gCol)}
                  onChange={(e) =>
                    updateConfig({ glimmer: { amount: gAmt, color: hexToNum(e.target.value), placement: gPl } })
                  }
                />
                <input
                  className="flex-1 rounded border border-gray-600 bg-gray-800 px-1 py-0.5 font-mono text-[11px] text-white"
                  value={numToHex(gCol)}
                  onChange={(e) => {
                    const raw = e.target.value.trim();
                    if (/^#[0-9a-fA-F]{6}$/.test(raw)) {
                      updateConfig({ glimmer: { amount: gAmt, color: hexToNum(raw), placement: gPl } });
                    }
                  }}
                />
              </div>
            </div>
            <label
              className="flex flex-col gap-0.5 text-gray-400"
              title="Ændrer pseudo-tilfældig fordeling af pletter (samme mængde og farve)"
            >
              <span>Placering ({gPl.toFixed(2)})</span>
              <input
                type="range"
                className="w-full accent-blue-500"
                min={0}
                max={1}
                step={0.005}
                value={gPl}
                onChange={(e) =>
                  updateConfig({
                    glimmer: { amount: gAmt, color: gCol, placement: Number(e.target.value) },
                  })
                }
              />
            </label>
          </>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-gray-700 pt-2">
        <span className="text-gray-300" title="Glimmer på finner, hale og horn">
          Glimmer — finner
        </span>
        <label className="flex flex-col gap-0.5 text-gray-400">
          <span>Mængde (0 = slået fra) ({fgAmt.toFixed(2)})</span>
          <input
            type="range"
            className="w-full accent-blue-500"
            min={0}
            max={1}
            step={0.01}
            value={fgAmt}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (v <= 0) updateConfig({ finGlimmer: undefined });
              else updateConfig({ finGlimmer: { amount: v, color: fgCol, placement: fgPl } });
            }}
          />
        </label>
        {fgAmt > 0 && (
          <>
            <div className="flex flex-col gap-0.5">
              <span className="text-gray-500">Glimmerfarve</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-8 w-10 cursor-pointer rounded border border-gray-600 bg-transparent"
                  value={numToHex(fgCol)}
                  onChange={(e) =>
                    updateConfig({
                      finGlimmer: { amount: fgAmt, color: hexToNum(e.target.value), placement: fgPl },
                    })
                  }
                />
                <input
                  className="flex-1 rounded border border-gray-600 bg-gray-800 px-1 py-0.5 font-mono text-[11px] text-white"
                  value={numToHex(fgCol)}
                  onChange={(e) => {
                    const raw = e.target.value.trim();
                    if (/^#[0-9a-fA-F]{6}$/.test(raw)) {
                      updateConfig({
                        finGlimmer: { amount: fgAmt, color: hexToNum(raw), placement: fgPl },
                      });
                    }
                  }}
                />
              </div>
            </div>
            <label
              className="flex flex-col gap-0.5 text-gray-400"
              title="Ændrer pseudo-tilfældig fordeling af pletter på finner (uafhængig af krop)"
            >
              <span>Placering ({fgPl.toFixed(2)})</span>
              <input
                type="range"
                className="w-full accent-blue-500"
                min={0}
                max={1}
                step={0.005}
                value={fgPl}
                onChange={(e) =>
                  updateConfig({
                    finGlimmer: { amount: fgAmt, color: fgCol, placement: Number(e.target.value) },
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
