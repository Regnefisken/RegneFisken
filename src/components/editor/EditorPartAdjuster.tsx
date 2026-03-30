import { useEditorStore } from '../../store/useEditorStore.js';
import { getEditorPartIdsForConfig } from './editorConstants.js';

const PART_LABELS: Record<string, string> = {
  body: 'Krop',
  leftEye: 'Venstre øje',
  rightEye: 'Højre øje',
  tail: 'Hale',
  dorsalFin: 'Rygfinne / pigge',
  leftFin: 'Venstre sidefinne',
  rightFin: 'Højre sidefinne',
  beak: 'Næb',
  jaw: 'Underkæbe (piraja)',
  lure: 'Lokke',
  whiskers: 'Skæg',
  sword: 'Sværd',
  dinoHead: 'Dino hoved',
  dinoLegs: 'Dino ben',
  head: 'Hoved',
  leftClaw: 'Venstre klo',
  rightClaw: 'Højre klo',
  legs: 'Ben',
  eyes: 'Øjne',
  tentacles: 'Tentakler',
  leftWing: 'Venstre vinge',
  rightWing: 'Højre vinge',
  arms: 'Arme',
  teeth: 'Tænder',
  mouth: 'Mund',
  pelvicFins: 'Bughfinner',
};

export function EditorPartAdjuster() {
  const config = useEditorStore((s) => s.configOverride);
  const selectedPart = useEditorStore((s) => s.selectedPart);
  const selectPart = useEditorStore((s) => s.selectPart);
  const updatePartAdjustment = useEditorStore((s) => s.updatePartAdjustment);
  const resetPartAdjustment = useEditorStore((s) => s.resetPartAdjustment);

  const partIds = config ? getEditorPartIdsForConfig(config) : null;
  if (!config || !partIds) {
    return (
      <p className="text-xs text-gray-500">
        Per-del justering er ikke tilgængelig for denne modeltype (fx hvidhaj, flaske, østers).
      </p>
    );
  }

  const adj = selectedPart ? (config.partAdjustments?.[selectedPart] ?? {}) : {};

  const setAxis = (
    key: 'dx' | 'dy' | 'dz' | 'sx' | 'sy' | 'sz' | 'rx' | 'ry' | 'rz',
    value: number | undefined,
  ) => {
    if (!selectedPart) return;
    if (value === undefined) return;
    updatePartAdjustment(selectedPart, { [key]: value });
  };

  const deg = (rad: number) => (rad * 180) / Math.PI;
  const radFromDeg = (d: number) => (d * Math.PI) / 180;

  return (
    <div className="flex flex-col gap-2 py-1 text-xs">
      <label className="text-gray-300" title="Vælg del eller klik på fisken i 3D">
        Del
        <select
          className="mt-0.5 w-full rounded border border-gray-600 bg-gray-800 px-2 py-1 text-white"
          value={selectedPart ?? ''}
          onChange={(e) => selectPart(e.target.value || null)}
        >
          <option value="">— Ingen —</option>
          {partIds.map((id) => (
            <option key={id} value={id}>
              {PART_LABELS[id] ?? id}
            </option>
          ))}
        </select>
      </label>

      {selectedPart && (
        <>
          <div className="text-[11px] text-gray-500">Position (dX, dY, dZ)</div>
          {(['dx', 'dy', 'dz'] as const).map((k) => (
            <label key={k} className="flex flex-col text-gray-400">
              {k.toUpperCase()}: {(adj[k] ?? 0).toFixed(2)}
              <input
                type="range"
                className="w-full accent-blue-500"
                min={-2}
                max={2}
                step={0.01}
                value={adj[k] ?? 0}
                onChange={(e) => setAxis(k, Number(e.target.value))}
              />
            </label>
          ))}
          <div className="text-[11px] text-gray-500">Skala (sX, sY, sZ)</div>
          {(['sx', 'sy', 'sz'] as const).map((k) => (
            <label key={k} className="flex flex-col text-gray-400">
              {k.toUpperCase()}: {(adj[k] ?? 1).toFixed(2)}
              <input
                type="range"
                className="w-full accent-blue-500"
                min={0.1}
                max={3}
                step={0.05}
                value={adj[k] ?? 1}
                onChange={(e) => setAxis(k, Number(e.target.value))}
              />
            </label>
          ))}
          <div className="text-[11px] text-gray-500" title="Euler X/Y/Z i radianer (som Three.js rotation)">
            Rotation (grader — rX, rY, rZ)
          </div>
          {(['rx', 'ry', 'rz'] as const).map((k) => (
            <label key={k} className="flex flex-col text-gray-400">
              {k.toUpperCase()}: {deg(adj[k] ?? 0).toFixed(0)}°
              <input
                type="range"
                className="w-full accent-blue-500"
                min={-180}
                max={180}
                step={1}
                value={deg(adj[k] ?? 0)}
                onChange={(e) => setAxis(k, radFromDeg(Number(e.target.value)))}
              />
            </label>
          ))}
          <button
            type="button"
            className="rounded bg-gray-700 px-2 py-1 text-xs hover:bg-gray-600"
            onClick={() => resetPartAdjustment(selectedPart)}
            title="Fjern justeringer for den valgte del"
          >
            Nulstil del
          </button>
        </>
      )}
    </div>
  );
}
