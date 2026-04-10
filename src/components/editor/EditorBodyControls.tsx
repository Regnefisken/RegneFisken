import { useEffect } from 'react';
import type { FishBodyProfile, TailType } from '../../types/fish.js';
import { DEFAULT_BODY_SEGMENTS, normalizeBodySegments } from '../../three/models/cuteFishUtils.js';
import { useEditorStore } from '../../store/useEditorStore.js';
import {
  BODY_PROFILE_LABEL_DA,
  BODY_PROFILE_OPTIONS,
  EDITOR_HALEFORM_TAIL_TYPES,
  TAIL_TYPE_LABEL_DA,
  tailRequiresNormalSideFinMovement,
} from './editorConstants.js';

const EDITOR_HALEFORM_TAIL_SET = new Set<TailType>(EDITOR_HALEFORM_TAIL_TYPES);

export function EditorBodyControls() {
  const config = useEditorStore((s) => s.configOverride);
  const updateConfig = useEditorStore((s) => s.updateConfig);

  const rawSegs = config?.bodySegments ?? config?.bodyLatheSegments;
  useEffect(() => {
    if (rawSegs == null) return;
    const n = normalizeBodySegments(rawSegs);
    if (n !== rawSegs) {
      updateConfig({
        bodySegments: n === DEFAULT_BODY_SEGMENTS ? undefined : n,
        bodyLatheSegments: undefined,
      });
    }
  }, [rawSegs, updateConfig]);

  if (!config) return null;

  const updateBodyShape = (index: 0 | 1 | 2, value: number) => {
    const current = [...config.bodyShape] as [number, number, number];
    current[index] = value;
    updateConfig({ bodyShape: current });
  };

  const bodyProfile = (config.bodyProfile ?? 'standard') as FishBodyProfile;
  const bodyShading = config.bodyShadingStyle ?? 'smooth';
  const bodySegments = normalizeBodySegments(config.bodySegments ?? config.bodyLatheSegments);

  const tailSelectOptions: TailType[] = EDITOR_HALEFORM_TAIL_SET.has(config.tail)
    ? [...EDITOR_HALEFORM_TAIL_TYPES]
    : [config.tail, ...EDITOR_HALEFORM_TAIL_TYPES];

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
          onChange={(e) => {
            const tail = e.target.value as TailType;
            if (tailRequiresNormalSideFinMovement(tail)) {
              updateConfig({ tail, tailFinMovement: undefined });
            } else {
              updateConfig({ tail });
            }
          }}
        >
          {tailSelectOptions.map((t) => (
            <option key={t} value={t}>
              {TAIL_TYPE_LABEL_DA[t]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-0.5 text-gray-300" title="Grundform af kroppen (sphere + deformation, som i electric monster generator)">
        <span>Kropsfacon</span>
        <select
          className="rounded border border-gray-600 bg-gray-800 px-2 py-1 text-white accent-blue-500"
          value={bodyProfile}
          onChange={(e) => {
            const v = e.target.value as FishBodyProfile;
            updateConfig({ bodyProfile: v === 'standard' ? undefined : v });
          }}
        >
          {BODY_PROFILE_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {BODY_PROFILE_LABEL_DA[p]}
            </option>
          ))}
        </select>
      </label>

      <label
        className="flex flex-col gap-0.5 text-gray-300"
        title="Styrer om mesh-normaler er glatte (standard) eller facetterede — ikke lys/skygger i scenen. Gælder krop og standard-fiskenes finner."
      >
        <span>Normaler (krop og finner)</span>
        <select
          className="rounded border border-gray-600 bg-gray-800 px-2 py-1 text-white accent-blue-500"
          value={bodyShading}
          onChange={(e) => {
            const v = e.target.value as 'smooth' | 'flat';
            updateConfig({ bodyShadingStyle: v === 'smooth' ? undefined : v });
          }}
        >
          <option value="smooth">Glat</option>
          <option value="flat">Facetteret (lav-poly-look)</option>
        </select>
      </label>

      <SliderRow
        label="Clearcoat (krop)"
        title="0 = ingen laklag; 0.5 = samme som hidtil i spillet"
        min={0}
        max={1}
        step={0.05}
        value={config.bodyClearcoat ?? 0.5}
        onChange={(v) => {
          updateConfig({ bodyClearcoat: Math.abs(v - 0.5) < 0.03 ? undefined : v });
        }}
      />

      <SliderRow
        label="Clearcoat ruhed (krop)"
        title="0 = skarp spejlglans, 1 = mat lak — standard 0.08 som i spillet (gælder når clearcoat er tændt)"
        min={0}
        max={1}
        step={0.02}
        value={config.bodyClearcoatRoughness ?? 0.08}
        onChange={(v) => {
          updateConfig({
            bodyClearcoatRoughness: Math.abs(v - 0.08) < 0.015 ? undefined : v,
          });
        }}
      />

      {import.meta.env.DEV && (
        <>
          <SliderRow
            label="Krop-segmenter"
            title={`Kun lige tal — ulige segmenter bryder symmetrien. Standard ${DEFAULT_BODY_SEGMENTS}.`}
            min={8}
            max={32}
            step={2}
            value={bodySegments}
            integer
            onChange={(v) => {
              const n = normalizeBodySegments(Math.round(v));
              updateConfig({
                bodySegments: n === DEFAULT_BODY_SEGMENTS ? undefined : n,
                bodyLatheSegments: undefined,
              });
            }}
          />
          <p className="text-[10px] leading-snug text-gray-500">
            UV-sømmen på kroppen er i motoren lagt mod halen (skjult bag halefinnen); det er ikke en værdi her.
          </p>
        </>
      )}
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
  integer,
  onChange,
}: {
  label: string;
  title: string;
  min: number;
  max: number;
  step: number;
  value: number;
  integer?: boolean;
  onChange: (v: number) => void;
}) {
  const shown = integer ? String(Math.round(value)) : value.toFixed(2);
  return (
    <label className="flex flex-col gap-0.5 text-gray-300">
      <span title={title}>
        {label}: <span className="text-gray-400">{shown}</span>
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
