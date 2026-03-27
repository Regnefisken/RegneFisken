import { FARVANDE } from '../../data/math-config';
import { useAudio } from '../../audio/useAudio';
import { useMathStore } from '../../store/useMathStore';
import type { MathDifficulty } from '../../types/math';

const DIFFICULTIES: MathDifficulty[] = ['beginner', 'intermediate', 'expert'];

export function MathSettingsScreen() {
  const { play } = useAudio();
  const setShowMathSettings = useMathStore((s) => s.setShowMathSettings);

  const activeOps = useMathStore((s) => s.activeOps);
  const setActiveOps = useMathStore((s) => s.setActiveOps);
  const mathDifficulty = useMathStore((s) => s.mathDifficulty);
  const setMathDifficulty = useMathStore((s) => s.setMathDifficulty);
  const mathCategory = useMathStore((s) => s.mathCategory);
  const setMathCategory = useMathStore((s) => s.setMathCategory);
  const selectedFarvand = useMathStore((s) => s.selectedFarvand);
  const setSelectedFarvand = useMathStore((s) => s.setSelectedFarvand);
  const zenMode = useMathStore((s) => s.zenMode);
  const setZenMode = useMathStore((s) => s.setZenMode);
  const showNumberPad = useMathStore((s) => s.showNumberPad);
  const setShowNumberPad = useMathStore((s) => s.setShowNumberPad);

  function close() {
    play('ui');
    setShowMathSettings(false);
  }

  function toggleOp(op: string) {
    play('ui');
    setActiveOps((ops) => (ops.includes(op) ? ops.filter((o) => o !== op) : [...ops, op]));
  }

  return (
    <div className="panel-shop anim-zoom-in pointer-events-auto max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-700 p-6 shadow-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-black text-indigo-300">🔢 Regneindstillinger</h2>
        <button
          type="button"
          onClick={close}
          className="rounded-xl bg-slate-800 px-3 py-1.5 text-sm font-bold text-slate-300"
        >
          Luk
        </button>
      </div>

      <section className="mb-6">
        <h3 className="mb-2 text-xs font-black tracking-widest text-slate-500 uppercase">
          Farvand (data)
        </h3>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(FARVANDE) as (keyof typeof FARVANDE)[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                play('ui');
                setSelectedFarvand(id);
              }}
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                selectedFarvand === id
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {FARVANDE[id].name}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h3 className="mb-2 text-xs font-black tracking-widest text-slate-500 uppercase">
          Operatorer
        </h3>
        <div className="flex flex-wrap gap-2">
          {['+', '-', '*', '/'].map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => toggleOp(op)}
              className={`h-10 w-10 rounded-xl text-lg font-black ${
                activeOps.includes(op)
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {op === '*' ? '×' : op === '/' ? ':' : op}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h3 className="mb-2 text-xs font-black tracking-widest text-slate-500 uppercase">
          Sværhedsgrad
        </h3>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => {
                play('ui');
                setMathDifficulty(d);
              }}
              className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                mathDifficulty === d ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h3 className="mb-2 text-xs font-black tracking-widest text-slate-500 uppercase">
          Kategori
        </h3>
        <select
          value={mathCategory}
          onChange={(e) => {
            play('ui');
            setMathCategory(e.target.value);
          }}
          className="w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white"
        >
          <option value="basic">Basis</option>
          <option value="regnehistorier">Regnehistorier</option>
          <option value="lette-historier">Lette historier</option>
          <option value="multi-term">Flere led</option>
          <option value="equations">Ligninger</option>
          <option value="decimals">Decimaler</option>
        </select>
      </section>

      <section className="flex flex-col gap-3">
        <label className="flex items-center justify-between gap-2 text-sm text-slate-300">
          Zen-mode (uendelig tid + afslør svar)
          <input
            type="checkbox"
            checked={zenMode}
            onChange={(e) => {
              play('ui');
              setZenMode(e.target.checked);
            }}
            className="h-5 w-5 accent-emerald-500"
          />
        </label>
        <label className="flex items-center justify-between gap-2 text-sm text-slate-300">
          Touch-numpad
          <input
            type="checkbox"
            checked={showNumberPad}
            onChange={(e) => {
              play('ui');
              setShowNumberPad(e.target.checked);
            }}
            className="h-5 w-5 accent-emerald-500"
          />
        </label>
      </section>
    </div>
  );
}
