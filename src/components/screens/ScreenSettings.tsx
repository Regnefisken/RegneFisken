import { useAudio } from '../../audio/useAudio';
import { useUIStore } from '../../store/useUIStore';

export function ScreenSettings() {
  const { play } = useAudio();
  const setShowScreenSettings = useUIStore((s) => s.setShowScreenSettings);
  const fontSize = useUIStore((s) => s.fontSize);
  const setFontSize = useUIStore((s) => s.setFontSize);
  const uiScale = useUIStore((s) => s.uiScale);
  const setUiScale = useUIStore((s) => s.setUiScale);
  const reducedMotion = useUIStore((s) => s.reducedMotion);
  const setReducedMotion = useUIStore((s) => s.setReducedMotion);
  const highContrast = useUIStore((s) => s.highContrast);
  const setHighContrast = useUIStore((s) => s.setHighContrast);

  function close() {
    play('ui');
    setShowScreenSettings(false);
  }

  return (
    <div className="panel-shop anim-zoom-in pointer-events-auto max-w-md rounded-3xl border border-slate-700 p-6 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-black text-cyan-300">⚙️ Skærm</h2>
        <button
          type="button"
          onClick={close}
          className="rounded-xl bg-slate-800 px-3 py-1.5 text-sm font-bold text-slate-300"
        >
          Luk
        </button>
      </div>
      <div className="space-y-4 text-sm text-slate-300">
        <label className="block">
          Skriftstørrelse ({fontSize}%)
          <input
            type="range"
            min={80}
            max={140}
            value={fontSize}
            onChange={(e) => {
              play('ui');
              setFontSize(Number(e.target.value));
            }}
            className="mt-1 w-full accent-cyan-500"
          />
        </label>
        <label className="block">
          UI-skala ({uiScale}%)
          <input
            type="range"
            min={80}
            max={120}
            value={uiScale}
            onChange={(e) => {
              play('ui');
              setUiScale(Number(e.target.value));
            }}
            className="mt-1 w-full accent-cyan-500"
          />
        </label>
        <label className="flex items-center justify-between">
          Reducer bevægelse
          <input
            type="checkbox"
            checked={reducedMotion}
            onChange={(e) => {
              play('ui');
              setReducedMotion(e.target.checked);
            }}
            className="h-5 w-5 accent-cyan-500"
          />
        </label>
        <label className="flex items-center justify-between">
          Høj kontrast
          <input
            type="checkbox"
            checked={highContrast}
            onChange={(e) => {
              play('ui');
              setHighContrast(e.target.checked);
            }}
            className="h-5 w-5 accent-cyan-500"
          />
        </label>
      </div>
    </div>
  );
}
