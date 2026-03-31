import { useState } from 'react';
import { CATCH_MASTER_DATA } from '../../data/fish.js';
import type {
  ColorGradientStops,
  EyeConfig,
  FishModelConfig,
  GlimmerConfig,
  TeethConfig,
} from '../../types/fish.js';
import { DEFAULT_BODY_LATHE_SEGMENTS, normalizeBodyLatheSegments } from '../../three/models/cuteFishUtils.js';
import { EDITOR_DEFAULT_FISH_CONFIG, useEditorStore } from '../../store/useEditorStore.js';

function formatHexLiteral(n: number): string {
  return `0x${(n >>> 0).toString(16).toUpperCase().padStart(6, '0')}`;
}

function tsQuote(s: string): string {
  return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function formatPartAdjustments(adj: NonNullable<FishModelConfig['partAdjustments']>): string {
  const parts = Object.keys(adj).map((part) => {
    const o = adj[part]!;
    const inner = (['dx', 'dy', 'dz', 'sx', 'sy', 'sz', 'rx', 'ry', 'rz'] as const)
      .map((k) => (o[k] != null ? `${k}: ${o[k]}` : null))
      .filter(Boolean)
      .join(', ');
    return `${tsQuote(part)}: { ${inner} }`;
  });
  return `partAdjustments: { ${parts.join(', ')} }`;
}

function formatColorGradient(cg: ColorGradientStops): string {
  return `colorGradient: { back: ${formatHexLiteral(cg.back)}, mid1: ${formatHexLiteral(cg.mid1)}, mid2: ${formatHexLiteral(cg.mid2)}, belly: ${formatHexLiteral(cg.belly)} }`;
}

function formatEyeConfig(ec: EyeConfig): string {
  const parts: string[] = [];
  if (ec.size != null) parts.push(`size: ${ec.size}`);
  if (ec.scleraColor != null) parts.push(`scleraColor: ${formatHexLiteral(ec.scleraColor)}`);
  if (ec.pupilColor != null) parts.push(`pupilColor: ${formatHexLiteral(ec.pupilColor)}`);
  if (ec.pupilShape != null) parts.push(`pupilShape: ${tsQuote(ec.pupilShape)}`);
  if (ec.pupilScale != null) parts.push(`pupilScale: ${ec.pupilScale}`);
  if (ec.pupilDepth != null) parts.push(`pupilDepth: ${ec.pupilDepth}`);
  if (ec.offsetX != null) parts.push(`offsetX: ${ec.offsetX}`);
  if (ec.offsetY != null) parts.push(`offsetY: ${ec.offsetY}`);
  return `eyeConfig: { ${parts.join(', ')} }`;
}

function formatGlimmerConfig(g: GlimmerConfig, key: 'glimmer' | 'finGlimmer'): string {
  const parts = [`amount: ${g.amount}`, `color: ${formatHexLiteral(g.color)}`];
  if (g.placement != null && g.placement !== 0) {
    parts.push(`placement: ${g.placement}`);
  }
  return `${key}: { ${parts.join(', ')} }`;
}

function formatTeethConfig(t: TeethConfig): string {
  const parts: string[] = [`type: ${tsQuote(t.type)}`];
  if (t.count != null) parts.push(`count: ${t.count}`);
  if (t.size != null) parts.push(`size: ${t.size}`);
  if (t.color != null) parts.push(`color: ${formatHexLiteral(t.color)}`);
  if (t.zOffset != null && t.zOffset !== 0) parts.push(`zOffset: ${t.zOffset}`);
  return `teeth: { ${parts.join(', ')} }`;
}

/** TypeScript one-liner til fish.ts model-felt. */
export function fishModelConfigToTsLiteral(cfg: FishModelConfig): string {
  const chunks: string[] = [];
  chunks.push(`color: ${cfg.color === null ? 'null' : formatHexLiteral(cfg.color)}`);
  chunks.push(`bodyShape: [${cfg.bodyShape.join(', ')}]`);
  chunks.push(`tail: ${tsQuote(cfg.tail)}`);
  chunks.push(`speed: ${cfg.speed}`);
  chunks.push(`scale: ${cfg.scale}`);

  const skip = new Set(['color', 'bodyShape', 'tail', 'speed', 'scale']);
  const keys = (Object.keys(cfg) as (keyof FishModelConfig)[])
    .filter((k) => !skip.has(k))
    .sort();

  for (const key of keys) {
    const v = cfg[key];
    if (v === undefined) continue;
    if (typeof v === 'boolean' && v === false) continue;
    if (key === 'partAdjustments') {
      const pa = v as FishModelConfig['partAdjustments'];
      if (!pa || Object.keys(pa).length === 0) continue;
      chunks.push(formatPartAdjustments(pa));
      continue;
    }
    if (key === 'eyeConfig') {
      const eye = v as FishModelConfig['eyeConfig'];
      if (!eye || Object.keys(eye).length === 0) continue;
      chunks.push(formatEyeConfig(eye));
      continue;
    }
    if (key === 'colorGradient') {
      const cg = v as FishModelConfig['colorGradient'];
      if (!cg) continue;
      chunks.push(formatColorGradient(cg));
      continue;
    }
    if (key === 'bodyPattern') {
      const bp = v as FishModelConfig['bodyPattern'];
      if (!bp || bp === 'solid') continue;
      chunks.push(`bodyPattern: ${tsQuote(bp)}`);
      continue;
    }
    if (key === 'patternColor') {
      if (!cfg.bodyPattern || cfg.bodyPattern === 'solid') continue;
      chunks.push(`patternColor: ${formatHexLiteral(v as number)}`);
      continue;
    }
    if (key === 'patternDensity') {
      if (!cfg.bodyPattern || cfg.bodyPattern === 'solid') continue;
      const pd = v as number;
      if (pd === 1) continue;
      chunks.push(`patternDensity: ${pd}`);
      continue;
    }
    if (key === 'bodyOpacity') {
      const bo = v as number;
      if (bo >= 1) continue;
      chunks.push(`bodyOpacity: ${bo}`);
      continue;
    }
    if (key === 'finOpacity') {
      const fo = v as number;
      if (fo >= 0.95) continue;
      chunks.push(`finOpacity: ${fo}`);
      continue;
    }
    if (key === 'glimmer' || key === 'finGlimmer') {
      const gl = v as GlimmerConfig;
      if (!gl || gl.amount <= 0) continue;
      chunks.push(formatGlimmerConfig(gl, key));
      continue;
    }
    if (key === 'teeth') {
      if (v === true) {
        chunks.push('teeth: true');
        continue;
      }
      if (v && typeof v === 'object') {
        chunks.push(formatTeethConfig(v as TeethConfig));
        continue;
      }
      continue;
    }
    if (key === 'mouthType') {
      const m = v as FishModelConfig['mouthType'];
      if (!m || m === 'none') continue;
      chunks.push(`mouthType: ${tsQuote(m)}`);
      continue;
    }
    if (key === 'mouthOpenness') {
      if (!cfg.mouthType || cfg.mouthType === 'none') continue;
      const mo = v as number;
      if (mo === 0.55) continue;
      chunks.push(`mouthOpenness: ${mo}`);
      continue;
    }
    if (key === 'mouthColor') {
      if (!cfg.mouthType || cfg.mouthType === 'none') continue;
      const mc = v as number;
      if (mc === 0x2a0808) continue;
      chunks.push(`mouthColor: ${formatHexLiteral(mc)}`);
      continue;
    }
    if (key === 'dorsalFinType') {
      chunks.push(`dorsalFinType: ${tsQuote(v as string)}`);
      continue;
    }
    if (key === 'dorsalFinEmbed') {
      const de = v as number;
      if (de === 0) continue;
      chunks.push(`dorsalFinEmbed: ${de}`);
      continue;
    }
    if (key === 'tailScale') {
      const ts = v as number;
      if (ts === 1) continue;
      chunks.push(`tailScale: ${ts}`);
      continue;
    }
    if (key === 'sideFinScale') {
      const sf = v as number;
      if (sf === 1) continue;
      chunks.push(`sideFinScale: ${sf}`);
      continue;
    }
    if (key === 'pelvicFinScale') {
      const pf = v as number;
      if (pf === 1) continue;
      chunks.push(`pelvicFinScale: ${pf}`);
      continue;
    }
    if (key === 'finColor') {
      chunks.push(`finColor: ${formatHexLiteral(v as number)}`);
      continue;
    }
    if (key === 'bioluminescent') {
      const b = v as FishModelConfig['bioluminescent'];
      if (!b || !b.enabled) continue;
      chunks.push(
        `bioluminescent: { enabled: true, color: ${formatHexLiteral(b.color)}, intensity: ${b.intensity} }`,
      );
      continue;
    }
    if (key === 'pufferInflation') {
      const p = v as FishModelConfig['pufferInflation'];
      if (!p) continue;
      chunks.push(`pufferInflation: { puff: ${p.puff}, spikeDensity: ${p.spikeDensity} }`);
      continue;
    }
    if (key === 'bodyProfile') {
      const bp = v as FishModelConfig['bodyProfile'];
      if (!bp || bp === 'standard') continue;
      chunks.push(`bodyProfile: ${tsQuote(bp)}`);
      continue;
    }
    if (key === 'bodyLatheSegments') {
      const n = normalizeBodyLatheSegments(v as number);
      if (n === DEFAULT_BODY_LATHE_SEGMENTS) continue;
      chunks.push(`bodyLatheSegments: ${n}`);
      continue;
    }
    if (key === 'bodyShadingStyle') {
      const s = v as FishModelConfig['bodyShadingStyle'];
      if (!s || s === 'smooth') continue;
      chunks.push(`bodyShadingStyle: ${tsQuote(s)}`);
      continue;
    }
    if (typeof v === 'boolean' && v === true) {
      chunks.push(`${String(key)}: true`);
      continue;
    }
    if (typeof v === 'number') {
      if (key === 'spots') {
        chunks.push(`spots: ${formatHexLiteral(v)}`);
      } else if (key === 'bellyColor' || key === 'emissive') {
        chunks.push(`${String(key)}: ${formatHexLiteral(v)}`);
      } else {
        chunks.push(`${String(key)}: ${v}`);
      }
      continue;
    }
  }

  return `{ ${chunks.join(', ')} }`;
}

function buildFullEntryLine(opts: {
  id: string;
  name: string;
  type: string;
  rarity: string;
  primaryAreas: string[];
  itemType: string;
  model: FishModelConfig;
}): string {
  const areas = opts.primaryAreas.map(tsQuote).join(', ');
  const model = fishModelConfigToTsLiteral(opts.model);
  return `{ id: ${tsQuote(opts.id)}, name: ${tsQuote(opts.name)}, type: ${tsQuote(opts.type)}, rarity: ${tsQuote(opts.rarity)}, primaryAreas: [${areas}], requirements: { requiredRod: null, requiredBait: null }, itemType: ${tsQuote(opts.itemType)}, model: ${model} },`;
}

function ConfigDiffView({
  orig,
  cur,
}: {
  orig: FishModelConfig | null;
  cur: FishModelConfig | null;
}) {
  if (!cur) return <span className="text-gray-500">Ingen aktiv config</span>;
  const base = orig ?? EDITOR_DEFAULT_FISH_CONFIG;
  const keys = new Set([...Object.keys(base), ...Object.keys(cur)] as (keyof FishModelConfig)[]);
  const rows: { key: string; a: string; b: string }[] = [];
  for (const k of [...keys].sort()) {
    const a = base[k];
    const b = cur[k];
    const sa = JSON.stringify(a);
    const sb = JSON.stringify(b);
    if (sa === sb) continue;
    rows.push({ key: String(k), a: sa, b: sb });
  }
  if (rows.length === 0) {
    return <span className="text-gray-500">Ingen ændring ift. baseline</span>;
  }
  return (
    <div className="flex flex-col gap-1">
      {rows.map(({ key, a, b }) => (
        <div key={key} className="break-all">
          <span className="text-amber-200">{key}</span>:{' '}
          <span className="text-red-300">{a}</span>
          <span className="text-gray-500"> → </span>
          <span className="text-green-300">{b}</span>
        </div>
      ))}
    </div>
  );
}

export function EditorExport() {
  const mode = useEditorStore((s) => s.mode);
  const selectedFishId = useEditorStore((s) => s.selectedFishId);
  const originalConfig = useEditorStore((s) => s.originalConfig);
  const configOverride = useEditorStore((s) => s.configOverride);
  const newFishMeta = useEditorStore((s) => s.newFishMeta);
  const [toast, setToast] = useState(false);

  const baseline = mode === 'edit' ? originalConfig : null;

  const flash = () => {
    setToast(true);
    setTimeout(() => setToast(false), 2000);
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      flash();
    } catch {
      setToast(true);
      setTimeout(() => setToast(false), 2000);
    }
  };

  if (!configOverride) {
    return <p className="text-xs text-gray-500">Vælg eller opret en fisk for at eksportere.</p>;
  }

  const modelTs = fishModelConfigToTsLiteral(configOverride);

  const onCopyModel = () => copy(modelTs);

  const onCopyFull = () => {
    if (mode === 'edit' && selectedFishId) {
      const entry = CATCH_MASTER_DATA.find((c) => c.id === selectedFishId);
      if (!entry) return;
      copy(
        buildFullEntryLine({
          id: entry.id,
          name: entry.name,
          type: entry.type,
          rarity: entry.rarity,
          primaryAreas: entry.primaryAreas,
          itemType: entry.itemType,
          model: configOverride,
        }),
      );
    } else {
      copy(
        buildFullEntryLine({
          id: newFishMeta.id || 'fisk_ny_',
          name: newFishMeta.name || 'Uden navn',
          type: newFishMeta.type,
          rarity: newFishMeta.rarity,
          primaryAreas: newFishMeta.primaryAreas,
          itemType: newFishMeta.itemType,
          model: configOverride,
        }),
      );
    }
  };

  const onCopyJson = () => copy(JSON.stringify(configOverride, null, 2));

  return (
    <div className="flex flex-col gap-2 py-1 text-xs">
      {toast && (
        <div
          className="rounded bg-green-800 px-2 py-1 text-center text-white"
          role="status"
        >
          Kopieret!
        </div>
      )}
      <div className="flex flex-col gap-1">
        <button
          type="button"
          className="rounded bg-blue-700 px-2 py-1 text-left hover:bg-blue-600"
          onClick={onCopyModel}
          title="Kun model-objektet som TS-literal"
        >
          Kopiér model config
        </button>
        <button
          type="button"
          className="rounded bg-blue-700 px-2 py-1 text-left hover:bg-blue-600"
          onClick={onCopyFull}
          title="Hele CATCH_MASTER_DATA-linjen"
        >
          Kopiér fuld entry
        </button>
        <button
          type="button"
          className="rounded bg-blue-700 px-2 py-1 text-left hover:bg-blue-600"
          onClick={onCopyJson}
          title="Rå JSON af model-config"
        >
          Kopiér som JSON
        </button>
      </div>
      <div>
        <div className="mb-0.5 text-gray-400" title="Sammenligning med original (edit) eller standard (create)">
          Diff (baseline → nuværende)
        </div>
        <div className="max-h-32 overflow-auto rounded border border-gray-700 bg-black/40 p-2 text-[11px] text-gray-200">
          <ConfigDiffView orig={baseline} cur={configOverride} />
        </div>
      </div>
    </div>
  );
}
