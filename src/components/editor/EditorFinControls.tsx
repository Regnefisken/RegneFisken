import { useEffect } from 'react';
import { EDITOR_DEFAULT_SIDE_FINS_PAIR, useEditorStore } from '../../store/useEditorStore.js';
import {
  DORSAL_FIN_LABEL_DA,
  DORSAL_FIN_TYPES,
  tailRequiresNormalSideFinMovement,
  usesStandardFishMesh,
} from './editorConstants.js';
import { LockToggle } from './LockToggle.js';

function numToHex(n: number): string {
  return `#${(n >>> 0).toString(16).padStart(6, '0')}`;
}

function hexToNum(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

const deg = (rad: number) => (rad * 180) / Math.PI;
const radFromDeg = (d: number) => (d * Math.PI) / 180;

export function EditorFinControls({ mode: displayMode = 'all' }: { mode?: 'fins' | 'tail' | 'all' }) {
  const config = useEditorStore((s) => s.configOverride);
  const updateConfig = useEditorStore((s) => s.updateConfig);
  const updatePartAdjustment = useEditorStore((s) => s.updatePartAdjustment);
  const resetPartAdjustment = useEditorStore((s) => s.resetPartAdjustment);
  const selectPart = useEditorStore((s) => s.selectPart);

  const paddleMovementBlocked =
    config != null ? tailRequiresNormalSideFinMovement(config.tail) : false;

  useEffect(() => {
    if (!config || !usesStandardFishMesh(config)) return;
    if (paddleMovementBlocked && config.tailFinMovement === 'paddle') {
      updateConfig({ tailFinMovement: undefined });
    }
  }, [paddleMovementBlocked, config, updateConfig]);

  if (!config) return null;

  if (!usesStandardFishMesh(config)) {
    return (
      <p className="py-1 text-xs leading-snug text-gray-500" title="Kun CuteFishModel StandardFishModel">
        Hale- og finne-profiler (rygfinne, skala, bughfinner, fin-farve) gælder kun{' '}
        <strong className="text-gray-400">standard fisk</strong>. Vælg en fisk der bruger standard fisk-modellen.
      </p>
    );
  }

  const finColorOn = config.finColor != null;
  const tailScale = config.tailScale ?? 1;
  const sideFinScale = config.sideFinScale ?? 1;
  const pelvicFinScale = config.pelvicFinScale ?? 1;
  const embed = config.dorsalFinEmbed ?? 0;

  const effectiveTailFinMovement =
    paddleMovementBlocked ? 'normal' : (config.tailFinMovement ?? 'normal');

  const hasTailMesh = config.tail !== 'none' && config.tail !== 'star';
  const hasDorsalFin =
    config.finUp === true || config.tail === 'shark' || config.spikes === true || config.dorsalFinType != null;
  const tailAdj = config.partAdjustments?.tail ?? {};
  const dorsalAdj = config.partAdjustments?.dorsalFin ?? {};

  const showFins = displayMode === 'fins' || displayMode === 'all';
  const showTail = displayMode === 'tail' || displayMode === 'all';

  return (
    <div className="flex flex-col gap-2 py-1 text-xs">
      {showFins && (
        <>
          <div className="flex items-start gap-1">
            <label className="flex min-w-0 flex-1 flex-col gap-0.5 text-gray-300" title="Rygfinne — ExtrudeGeometry; tom = kegleform ved finOp/haj/pigge">
              <span>Rygfinne-type</span>
              <select
                className="rounded border border-gray-600 bg-gray-800 px-2 py-1 text-white accent-blue-500"
                title="Extruderede former; tom = kegle som ved Rygfinne op, haj-hale eller pigge"
                value={config.dorsalFinType ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  updateConfig({
                    dorsalFinType: v === '' ? undefined : (v as (typeof DORSAL_FIN_TYPES)[number]),
                  });
                }}
              >
                <option value="">— Spillets standard (kegle)</option>
                {DORSAL_FIN_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {DORSAL_FIN_LABEL_DA[t]}
                  </option>
                ))}
              </select>
            </label>
            <LockToggle paramKey="dorsalFinType" />
          </div>

          {import.meta.env.DEV && config.dorsalFinType != null && (
            <p className="text-[10px] leading-snug text-gray-500">
              Extruderet rygfinne: tykkelsen er centreret på ryggen i motoren (samme som i spillet).
            </p>
          )}

          <div className="flex items-start gap-1">
            <div className="flex-1">
              <SliderRow
                label="Rygfinne dybde i krop"
                title="0–0.35: sænk finnen ned i kroppen (dorsalFinEmbed)"
                min={0}
                max={0.35}
                step={0.01}
                value={embed}
                onChange={(v) => updateConfig({ dorsalFinEmbed: v === 0 ? undefined : v })}
              />
            </div>
            <LockToggle paramKey="dorsalFinEmbed" />
          </div>

          {hasDorsalFin && (
            <details className="mt-1 rounded border border-gray-600/50">
              <summary className="cursor-pointer px-1 py-0.5 text-[11px] text-gray-400">
                ▸ Rygfinne finjustering (position/rotation)
              </summary>
              <div className="flex flex-col gap-2 p-1">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-gray-200" title="Gemmes som partAdjustments.dorsalFin">
                    Rygfinne ved kroppen
                  </span>
                  <p className="text-[11px] leading-snug text-gray-500">
                    Flyt og roter rygfinnen — dX rykker den frem mod hovedet eller tilbage mod halen langs kroppen.
                    Samme som «Per-del justering» → Rygfinne / pigge.
                  </p>
                  <button
                    type="button"
                    className="self-start rounded bg-gray-700 px-2 py-0.5 text-[11px] text-gray-200 hover:bg-gray-600"
                    onClick={() => selectPart('dorsalFin')}
                    title="Vælg rygfinne i 3D (grøn markering)"
                  >
                    Markér rygfinne i preview
                  </button>
                </div>
                <div className="text-[11px] text-gray-500">Forskydning (dX, dY, dZ)</div>
                <TailSliderRow
                  axis="dx"
                  label="Frem og tilbage langs kroppen (mod hoved ↔ mod hale)"
                  min={-3}
                  max={3}
                  step={0.02}
                  value={dorsalAdj.dx ?? 0}
                  onChange={(v) => updatePartAdjustment('dorsalFin', { dx: v })}
                />
                <TailSliderRow
                  axis="dy"
                  label="Op/ned"
                  min={-3}
                  max={3}
                  step={0.02}
                  value={dorsalAdj.dy ?? 0}
                  onChange={(v) => updatePartAdjustment('dorsalFin', { dy: v })}
                />
                <TailSliderRow
                  axis="dz"
                  label="Side (venstre/højre)"
                  min={-3}
                  max={3}
                  step={0.02}
                  value={dorsalAdj.dz ?? 0}
                  onChange={(v) => updatePartAdjustment('dorsalFin', { dz: v })}
                />
                <div className="text-[11px] text-gray-500" title="Euler-vinkler som i Three.js">
                  Rotation (grader)
                </div>
                {(['rx', 'ry', 'rz'] as const).map((k) => (
                  <label key={k} className="flex flex-col gap-0.5 text-gray-300">
                    <span className="text-[11px] text-gray-400">
                      {k === 'rx' ? 'Vip (rX)' : k === 'ry' ? 'Drej side (rY)' : 'Roll (rZ)'}:{' '}
                      <span className="text-gray-300">{deg(dorsalAdj[k] ?? 0).toFixed(0)}°</span>
                    </span>
                    <input
                      type="range"
                      className="w-full accent-blue-500"
                      min={-180}
                      max={180}
                      step={1}
                      value={deg(dorsalAdj[k] ?? 0)}
                      onChange={(e) => {
                        const r = radFromDeg(Number(e.target.value));
                        updatePartAdjustment('dorsalFin', { [k]: r });
                      }}
                    />
                  </label>
                ))}
                <button
                  type="button"
                  className="rounded border border-gray-600 bg-gray-800/80 px-2 py-1 text-[11px] text-gray-300 hover:bg-gray-700"
                  onClick={() => resetPartAdjustment('dorsalFin')}
                  title="Fjern alle rygfinne-justeringer"
                >
                  Nulstil rygfinne ved kroppen
                </button>
              </div>
            </details>
          )}
        </>
      )}

      {showTail && (
        <>
          <div className="flex items-start gap-1">
            <div className="flex-1">
              <SliderRow
                label="Hale-skala"
                title="0.6–1.9: hele hale-sektionen (tailScale)"
                min={0.6}
                max={1.9}
                step={0.05}
                value={tailScale}
                onChange={(v) => updateConfig({ tailScale: v === 1 ? undefined : v })}
              />
            </div>
            <LockToggle paramKey="tailScale" />
          </div>

          <div className="flex flex-col gap-2 border-t border-gray-700 pt-2">
            <span className="text-gray-300" title="Standard fisk — svømme-animation">
              Animation (hale)
            </span>
            <div className="flex items-start gap-1">
              <div className="flex-1">
                <SliderRow
                  label="Hale-sving (Amplitude)"
                  title="0.05–0.8 — tailSwingAmplitude (standard: 0.33)"
                  min={0.05}
                  max={0.8}
                  step={0.01}
                  value={config.tailSwingAmplitude ?? 0.33}
                  onChange={(v) =>
                    updateConfig({ tailSwingAmplitude: Math.abs(v - 0.33) < 0.001 ? undefined : v })
                  }
                />
              </div>
              <LockToggle paramKey="tailSwingAmplitude" />
            </div>
            <div className="flex items-start gap-1">
              <label className="flex min-w-0 flex-1 flex-col gap-0.5 text-gray-300" title="tailFinMovement">
                <span>Halefinnens bevægelse</span>
                <select
                  className="rounded border border-gray-600 bg-gray-800 px-2 py-1 text-white accent-blue-500"
                  value={effectiveTailFinMovement}
                  onChange={(e) => {
                    const v = e.target.value as 'normal' | 'paddle';
                    if (paddleMovementBlocked && v === 'paddle') return;
                    updateConfig({ tailFinMovement: v === 'normal' ? undefined : v });
                  }}
                >
                  <option value="normal">Normal (side-til-side)</option>
                  <option
                    value="paddle"
                    disabled={paddleMovementBlocked}
                    title={paddleMovementBlocked ? 'Ikke med denne haleform' : undefined}
                  >
                    Padlen op/ned (rokke/fugl)
                  </option>
                </select>
                {paddleMovementBlocked && (
                  <span className="text-[11px] leading-snug text-gray-500">
                    Denne haleform kræver normal side-til-side bevægelse; padlen op/ned er slået fra.
                  </span>
                )}
              </label>
              <LockToggle paramKey="tailFinMovement" />
            </div>
            <div className="flex items-start gap-1">
              <div className="flex-1">
                <SliderRow
                  label="Svømmehastighed"
                  title="0.5–3.5 — speed (fin- og hale-frekvens)"
                  min={0.5}
                  max={3.5}
                  step={0.1}
                  value={config.speed}
                  onChange={(v) => updateConfig({ speed: v })}
                />
              </div>
              <LockToggle paramKey="speed" />
            </div>
          </div>

          {hasTailMesh && (
            <details className="mt-1 rounded border border-gray-600/50">
              <summary className="cursor-pointer px-1 py-0.5 text-[11px] text-gray-400">
                ▸ Hale finjustering (position/rotation)
              </summary>
              <div className="flex flex-col gap-2 p-1">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-gray-200" title="Gemmes som partAdjustments.tail">
                    Hale ved kroppen
                  </span>
                  <p className="text-[11px] leading-snug text-gray-500">
                    Flyt og roter hele hale-sektionen, så finnen møder kroppen bedre (især ved extruderede haler).
                    Samme data som under «Per-del justering» → Hale.
                  </p>
                  <button
                    type="button"
                    className="self-start rounded bg-gray-700 px-2 py-0.5 text-[11px] text-gray-200 hover:bg-gray-600"
                    onClick={() => selectPart('tail')}
                    title="Vælg hale-delen i 3D (grøn markering)"
                  >
                    Markér hale i preview
                  </button>
                </div>
                <div className="text-[11px] text-gray-500">Forskydning (dX, dY, dZ)</div>
                {(['dx', 'dy', 'dz'] as const).map((k) => (
                  <TailSliderRow
                    key={k}
                    axis={k}
                    label={
                      k === 'dx'
                        ? 'Frem/tilbage (langs krop)'
                        : k === 'dy'
                          ? 'Op/ned'
                          : 'Side (venstre/højre)'
                    }
                    min={-3}
                    max={3}
                    step={0.02}
                    value={tailAdj[k] ?? 0}
                    onChange={(v) => updatePartAdjustment('tail', { [k]: v })}
                  />
                ))}
                <div className="text-[11px] text-gray-500" title="Euler-vinkler som i Three.js">
                  Rotation (grader)
                </div>
                {(['rx', 'ry', 'rz'] as const).map((k) => (
                  <label key={k} className="flex flex-col gap-0.5 text-gray-300">
                    <span className="text-[11px] text-gray-400">
                      {k === 'rx' ? 'Vip om krop (rX)' : k === 'ry' ? 'Drej side (rY)' : 'Roll (rZ)'}:{' '}
                      <span className="text-gray-300">{deg(tailAdj[k] ?? 0).toFixed(0)}°</span>
                    </span>
                    <input
                      type="range"
                      className="w-full accent-blue-500"
                      min={-180}
                      max={180}
                      step={1}
                      value={deg(tailAdj[k] ?? 0)}
                      onChange={(e) => {
                        const r = radFromDeg(Number(e.target.value));
                        updatePartAdjustment('tail', { [k]: r });
                      }}
                    />
                  </label>
                ))}
                <button
                  type="button"
                  className="rounded border border-gray-600 bg-gray-800/80 px-2 py-1 text-[11px] text-gray-300 hover:bg-gray-700"
                  onClick={() => resetPartAdjustment('tail')}
                  title="Fjern alle hale-forbindelses-justeringer"
                >
                  Nulstil hale ved kroppen
                </button>
              </div>
            </details>
          )}
        </>
      )}

      {showFins && (
        <>
          <div className="flex items-start gap-1">
            <div className="flex-1">
              <SliderRow
                label="Sidefinner (brystfinner)"
                title="0.6–1.9: pectoral finner (sideFinScale)"
                min={0.6}
                max={1.9}
                step={0.05}
                value={sideFinScale}
                onChange={(v) => updateConfig({ sideFinScale: v === 1 ? undefined : v })}
              />
            </div>
            <LockToggle paramKey="sideFinScale" />
          </div>

          <div className="flex items-start gap-1">
            <label
              className="flex min-w-0 flex-1 flex-col gap-0.5 text-gray-300"
              title="Sidevejs: fast basis rZ −92° oven på rZ-tillæg i per-del (sidefinner). Svømme-flap ligger på finnen i lokalt rum og følger rotationen."
            >
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-blue-500"
                  checked={config.sideFinPlacement === 'sidevejs'}
                  onChange={(e) => {
                    const on = e.target.checked;
                    const pa = config.partAdjustments;
                    const pair = pa?.sideFinsPair ?? {};
                    if (on) {
                      updateConfig({
                        sideFinPlacement: 'sidevejs',
                        partAdjustments: {
                          ...pa,
                          sideFinsPair: { ...pair, rz: 0 },
                        },
                      });
                    } else {
                      updateConfig({
                        sideFinPlacement: undefined,
                        partAdjustments: {
                          ...pa,
                          sideFinsPair: { ...pair, rz: EDITOR_DEFAULT_SIDE_FINS_PAIR.rz },
                        },
                      });
                    }
                  }}
                />
                Sidevejs-finner
              </span>
              <span className="text-[10px] leading-snug text-gray-500">
                Roterer parret til ca. −92° om Z (rZ-tillæg i «Per-del» lægges ovenpå).
              </span>
            </label>
            <LockToggle paramKey="sideFinPlacement" />
          </div>

          <div className="flex items-start gap-1">
            <label className="flex flex-1 items-center gap-2 text-gray-300" title="Ekstra par bughfinner">
              <input
                type="checkbox"
                className="accent-blue-500"
                checked={config.showPelvicFins === true}
                onChange={(e) =>
                  updateConfig({
                    showPelvicFins: e.target.checked ? true : undefined,
                    pelvicFinScale: e.target.checked ? config.pelvicFinScale : undefined,
                  })
                }
              />
              Vis bughfinner
            </label>
            <LockToggle paramKey="showPelvicFins" />
          </div>

          {config.showPelvicFins && (
            <div className="flex items-start gap-1">
              <div className="flex-1">
                <SliderRow
                  label="Bughfinne-skala"
                  title="0.6–1.9 (pelvicFinScale)"
                  min={0.6}
                  max={1.9}
                  step={0.05}
                  value={pelvicFinScale}
                  onChange={(v) => updateConfig({ pelvicFinScale: v === 1 ? undefined : v })}
                />
              </div>
              <LockToggle paramKey="pelvicFinScale" />
            </div>
          )}

          <div className="flex flex-col gap-1 border-t border-gray-700 pt-2">
            <span className="text-gray-300" title="Alle finner — tilsidesætter kropsfarve / røde finner">
              Separat fin-farve
            </span>
            <div className="flex items-start gap-1">
              <label className="flex flex-1 items-center gap-2 text-gray-400">
                <input
                  type="checkbox"
                  className="accent-blue-500"
                  checked={finColorOn}
                  onChange={(e) => updateConfig({ finColor: e.target.checked ? 0x6699aa : undefined })}
                />
                Brug separat fin-farve
              </label>
              <LockToggle paramKey="finColor" />
            </div>
            {finColorOn && (
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-8 w-10 cursor-pointer rounded border border-gray-600 bg-transparent"
                  value={numToHex(config.finColor ?? 0x6699aa)}
                  onChange={(e) => updateConfig({ finColor: hexToNum(e.target.value) })}
                />
                <input
                  className="flex-1 rounded border border-gray-600 bg-gray-800 px-1 py-0.5 font-mono text-white"
                  value={numToHex(config.finColor ?? 0x6699aa)}
                  onChange={(e) => {
                    const raw = e.target.value.trim();
                    if (/^#[0-9a-fA-F]{6}$/.test(raw)) updateConfig({ finColor: hexToNum(raw) });
                  }}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function TailSliderRow({
  axis,
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  axis: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-0.5 text-gray-300">
      <span title={`${axis} — partAdjustments.tail`}>
        {label} ({axis}): <span className="text-gray-400">{value.toFixed(2)}</span>
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
