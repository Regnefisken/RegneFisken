import { Color } from 'three';
import { useEditorStore } from '../../store/useEditorStore.js';
import type { ColorGradientStops } from '../../types/fish.js';

function numToHex(n: number | null): string {
  if (n === null) return '#888888';
  return `#${(n >>> 0).toString(16).padStart(6, '0')}`;
}

function hexToNum(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

function defaultGradientFromBody(hex: number): ColorGradientStops {
  const c = new Color(hex);
  return {
    back: new Color(c).multiplyScalar(0.72).getHex(),
    mid1: c.getHex(),
    mid2: new Color(c).lerp(new Color(0xffffff), 0.22).getHex(),
    belly: new Color(c).lerp(new Color(0xffffff), 0.52).getHex(),
  };
}

export function EditorColorControls() {
  const config = useEditorStore((s) => s.configOverride);
  const updateConfig = useEditorStore((s) => s.updateConfig);

  if (!config) return null;

  const colorNull = config.color === null;
  const emissiveOn = config.emissive != null;
  const gradientOn = config.colorGradient != null;
  const rainbowOn = config.useRainbow === true;
  const showGradientPickers = gradientOn && !rainbowOn;
  const colorGradient = config.colorGradient;
  const hemiOn = config.bodyHemisphereTint != null;
  const hemi = config.bodyHemisphereTint;

  const bodyOp = config.bodyOpacity ?? 1;
  const finOp = config.finOpacity ?? 0.95;

  return (
    <div className="flex flex-col gap-2 py-1 text-xs">
      <div className="flex flex-col gap-1">
        <span className="text-gray-300" title="Hovedfarve; null giver tilfældig pr. instans (fx frø)">
          Farve (color)
        </span>
        <label className="flex items-center gap-2 text-gray-400">
          <input
            type="checkbox"
            checked={colorNull}
            onChange={(e) => updateConfig({ color: e.target.checked ? null : 0x6699aa })}
          />
          null (tilfældig)
        </label>
        {!colorNull && (
          <div className="flex items-center gap-2">
            <input
              type="color"
              className="h-8 w-10 cursor-pointer rounded border border-gray-600 bg-transparent"
              value={numToHex(config.color ?? 0)}
              onChange={(e) => updateConfig({ color: hexToNum(e.target.value) })}
            />
            <input
              className="flex-1 rounded border border-gray-600 bg-gray-800 px-1 py-0.5 font-mono text-white"
              value={numToHex(config.color ?? 0)}
              onChange={(e) => {
                const raw = e.target.value.trim();
                if (/^#[0-9a-fA-F]{6}$/.test(raw)) updateConfig({ color: hexToNum(raw) });
              }}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-gray-700 pt-2">
        <span className="text-gray-300" title="Fire-stop gradient, regnbue eller kamæleon på kroppen (standard fisk)">
          Gradient og farvespil
        </span>
        <label
          className="flex items-center gap-2 text-gray-400"
          title="Lodret gradient i tekstur-rum: hver farve følger et bånd rundt om kroppen (som breddegrader), ikke en hel bug-/ryg-flade alene."
        >
          <input
            type="checkbox"
            checked={gradientOn}
            onChange={(e) => {
              if (e.target.checked) {
                const base = config.color ?? 0x6699aa;
                updateConfig({ colorGradient: defaultGradientFromBody(base) });
              } else {
                updateConfig({ colorGradient: undefined });
              }
            }}
          />
          4-zone gradient (UV-bånd)
        </label>
        {showGradientPickers && colorGradient && (
          <div className="flex flex-col gap-2 pl-1">
            {(
              [
                ['back', 'Stop 1 (tekstur-top)'],
                ['mid1', 'Stop 2'],
                ['mid2', 'Stop 3'],
                ['belly', 'Stop 4 (tekstur-bund)'],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="flex flex-col gap-0.5">
                <span className="text-gray-500">{label}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="h-7 w-9 cursor-pointer rounded border border-gray-600 bg-transparent"
                    value={numToHex(colorGradient[key])}
                    onChange={(e) =>
                      updateConfig({
                        colorGradient: { ...colorGradient, [key]: hexToNum(e.target.value) },
                      })
                    }
                  />
                  <input
                    className="flex-1 rounded border border-gray-600 bg-gray-800 px-1 py-0.5 font-mono text-[11px] text-white"
                    value={numToHex(colorGradient[key])}
                    onChange={(e) => {
                      const raw = e.target.value.trim();
                      if (/^#[0-9a-fA-F]{6}$/.test(raw)) {
                        updateConfig({
                          colorGradient: { ...colorGradient, [key]: hexToNum(raw) },
                        });
                      }
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        <label className="flex items-center gap-2 text-gray-400" title="Overskriver 4-zone gradient med spektral-regnbue">
          <input
            type="checkbox"
            checked={rainbowOn}
            onChange={(e) => updateConfig({ useRainbow: e.target.checked ? true : undefined })}
          />
          Regnbue (spektral)
        </label>
        <label className="flex items-center gap-2 text-gray-400" title="Langsom HSL-animation på kropsfarve">
          <input
            type="checkbox"
            checked={config.chameleonMode === true}
            onChange={(e) => updateConfig({ chameleonMode: e.target.checked ? true : undefined })}
          />
          Kamæleon (animation)
        </label>

        <div className="mt-1 flex flex-col gap-2 border-t border-gray-600/80 pt-2">
          <label
            className="flex items-center gap-2 text-gray-400"
            title="Hele bug vs hele ryg som halvkugler (fladenormal Y i mesh). Multiplikativ med diffus/gradient. 1,1,1 = ingen tint."
          >
            <input
              type="checkbox"
              checked={hemiOn}
              onChange={(e) => {
                if (e.target.checked) {
                  updateConfig({
                    bodyHemisphereTint: {
                      ventral: 0xff3333,
                      dorsal: 0xffffff,
                      softness: 0.2,
                    },
                  });
                } else {
                  updateConfig({ bodyHemisphereTint: undefined });
                }
              }}
            />
            Bug / ryg (normal-halvkugler)
          </label>
          {hemiOn && hemi && (
            <div className="flex flex-col gap-2 pl-1">
              <div className="flex flex-col gap-0.5">
                <span className="text-gray-500">Bug (ventral)</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="h-7 w-9 cursor-pointer rounded border border-gray-600 bg-transparent"
                    value={numToHex(hemi.ventral)}
                    onChange={(e) =>
                      updateConfig({
                        bodyHemisphereTint: { ...hemi, ventral: hexToNum(e.target.value) },
                      })
                    }
                  />
                  <input
                    className="flex-1 rounded border border-gray-600 bg-gray-800 px-1 py-0.5 font-mono text-[11px] text-white"
                    value={numToHex(hemi.ventral)}
                    onChange={(e) => {
                      const raw = e.target.value.trim();
                      if (/^#[0-9a-fA-F]{6}$/.test(raw)) {
                        updateConfig({
                          bodyHemisphereTint: { ...hemi, ventral: hexToNum(raw) },
                        });
                      }
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-gray-500">Ryg (dorsal)</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="h-7 w-9 cursor-pointer rounded border border-gray-600 bg-transparent"
                    value={numToHex(hemi.dorsal)}
                    onChange={(e) =>
                      updateConfig({
                        bodyHemisphereTint: { ...hemi, dorsal: hexToNum(e.target.value) },
                      })
                    }
                  />
                  <input
                    className="flex-1 rounded border border-gray-600 bg-gray-800 px-1 py-0.5 font-mono text-[11px] text-white"
                    value={numToHex(hemi.dorsal)}
                    onChange={(e) => {
                      const raw = e.target.value.trim();
                      if (/^#[0-9a-fA-F]{6}$/.test(raw)) {
                        updateConfig({
                          bodyHemisphereTint: { ...hemi, dorsal: hexToNum(raw) },
                        });
                      }
                    }}
                  />
                </div>
              </div>
              <label className="flex flex-col gap-0.5 text-gray-400">
                <span>Blød kant ({(hemi.softness ?? 0.18).toFixed(2)})</span>
                <input
                  type="range"
                  className="w-full accent-blue-500"
                  min={0.05}
                  max={0.45}
                  step={0.01}
                  value={hemi.softness ?? 0.18}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    updateConfig({
                      bodyHemisphereTint: {
                        ...hemi,
                        softness: Math.abs(v - 0.18) < 0.02 ? undefined : v,
                      },
                    });
                  }}
                />
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-gray-700 pt-2">
        <span className="text-gray-300" title="Glas/gelé via transmission på krop og finner (standard fisk)">
          Gennemsigtighed
        </span>
        <label className="flex flex-col gap-0.5 text-gray-400">
          <span>Krop-gennemsigtighed ({bodyOp.toFixed(2)})</span>
          <input
            type="range"
            className="w-full accent-blue-500"
            min={0.05}
            max={1}
            step={0.01}
            value={bodyOp}
            onChange={(e) => {
              const v = Number(e.target.value);
              updateConfig({ bodyOpacity: v >= 1 ? undefined : v });
            }}
          />
        </label>
        <label className="flex flex-col gap-0.5 text-gray-400">
          <span>Fin-gennemsigtighed ({finOp.toFixed(2)})</span>
          <input
            type="range"
            className="w-full accent-blue-500"
            min={0.1}
            max={1}
            step={0.01}
            value={finOp}
            onChange={(e) => {
              const v = Number(e.target.value);
              updateConfig({ finOpacity: v >= 0.95 ? undefined : v });
            }}
          />
        </label>
      </div>

      <div className="flex flex-col gap-1 border-t border-gray-700 pt-2">
        <label className="flex items-center gap-2 text-gray-300">
          <input
            type="checkbox"
            checked={emissiveOn}
            onChange={(e) => {
              if (e.target.checked) {
                const base = config.color ?? 0x6699aa;
                updateConfig({ emissive: base, emissiveIntensity: 0.22 });
              } else {
                updateConfig({ emissive: undefined, emissiveIntensity: undefined });
              }
            }}
            title="Lægger lys oven på overfladen (additive). Lav intensitet + farve tæt på kroppen giver mest ‘blanding’; høj intensitet dominerer som selvlys."
          />
          Emissive (glød)
        </label>
        {emissiveOn && config.emissive != null && (
          <>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="h-8 w-10 cursor-pointer rounded border border-gray-600 bg-transparent"
                value={numToHex(config.emissive)}
                onChange={(e) => updateConfig({ emissive: hexToNum(e.target.value) })}
              />
              <span className="text-gray-500">Intensitet</span>
              <input
                type="range"
                className="flex-1 accent-blue-500"
                min={0}
                max={2}
                step={0.05}
                value={config.emissiveIntensity ?? 0.45}
                onChange={(e) => updateConfig({ emissiveIntensity: Number(e.target.value) })}
              />
              <span className="w-8 text-gray-400">{(config.emissiveIntensity ?? 0.45).toFixed(2)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
