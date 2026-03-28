import { FARVANDE } from '../../data/math-config';
import { useAudio } from '../../audio/useAudio';
import { useMathStore } from '../../store/useMathStore';
import type { FarvandId, MathDifficulty } from '../../types/math';

const MATH_TABS = [
  { id: 'farvand', label: 'Farvand', icon: '🌊' },
  { id: 'ops', label: 'Regneart', icon: '🎣' },
  { id: 'level', label: 'Sværhedsgrad', icon: '📊' },
  { id: 'time', label: 'Tid', icon: '🕐' },
  { id: 'more', label: 'Avanceret', icon: '✨' },
] as const;

const DIFFICULTIES: { id: MathDifficulty; label: string; desc: string; icon: string; color: string; bg: string; radio: string }[] = [
  {
    id: 'beginner',
    label: 'Begynder',
    desc: 'Encifrede tal og simple tabeller (1–10)',
    icon: '🟢',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.15)',
    radio: 'bg-green-500 border-green-400',
  },
  {
    id: 'intermediate',
    label: 'Øvet',
    desc: 'To- og trecifrede tal, den lille tabel',
    icon: '🟡',
    color: '#eab308',
    bg: 'rgba(234,179,8,0.15)',
    radio: 'bg-yellow-400 border-yellow-300',
  },
  {
    id: 'expert',
    label: 'Ekspert',
    desc: 'Store tal, gange med tocifret × encifret',
    icon: '🟣',
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.15)',
    radio: 'bg-indigo-500 border-indigo-400',
  },
];

const CATEGORY_ROWS: {
  id: string;
  label: string;
  icon: string;
  desc: string;
}[] = [
  { id: 'basic', label: 'Ingen (standard regnearter)', icon: '🔢', desc: 'Brug kun de valgte regnearter ovenfor' },
  { id: 'multi-term', label: 'Flere led', icon: '📐', desc: '3 led: a + b − c' },
  { id: 'equations', label: 'Ligninger', icon: '🔤', desc: 'Find x: a + x = c' },
  { id: 'decimals', label: 'Decimaler', icon: '🔬', desc: 'Regn med decimaltal' },
  { id: 'regnehistorier', label: 'Regnehistorier', icon: '📖', desc: 'Tekstopgaver med hajer & fisk' },
  {
    id: 'lette-historier',
    label: 'Regnehistorier – de allermindste',
    icon: '🧸',
    desc: 'Super-lette historier for 0.-1. kl.',
  },
];

type FarvandKey = keyof typeof FARVANDE;

function farvandColors(key: FarvandKey) {
  if (key === 'kysten') return { bg: '74,222,128', border: '#4ade80', text: '#bbf7d0' };
  if (key === 'aabenhav') return { bg: '56,189,248', border: '#38bdf8', text: '#bae6fd' };
  return { bg: '139,92,246', border: '#8b5cf6', text: '#c4b5fd' };
}

export function MathSettingsScreen() {
  const { play } = useAudio();
  const setShowMathSettings = useMathStore((s) => s.setShowMathSettings);
  const mathSettingsTab = useMathStore((s) => s.mathSettingsTab);
  const setMathSettingsTab = useMathStore((s) => s.setMathSettingsTab);

  const activeOps = useMathStore((s) => s.activeOps);
  const setActiveOps = useMathStore((s) => s.setActiveOps);
  const mathDifficulty = useMathStore((s) => s.mathDifficulty);
  const setMathDifficulty = useMathStore((s) => s.setMathDifficulty);
  const mathCategory = useMathStore((s) => s.mathCategory);
  const setMathCategory = useMathStore((s) => s.setMathCategory);
  const selectedFarvand = useMathStore((s) => s.selectedFarvand) as FarvandKey;
  const setSelectedFarvand = useMathStore((s) => s.setSelectedFarvand);
  const zenMode = useMathStore((s) => s.zenMode);
  const setZenMode = useMathStore((s) => s.setZenMode);
  const zenSkipDelay = useMathStore((s) => s.zenSkipDelay);
  const setZenSkipDelay = useMathStore((s) => s.setZenSkipDelay);
  const showNumberPad = useMathStore((s) => s.showNumberPad);
  const setShowNumberPad = useMathStore((s) => s.setShowNumberPad);

  const fv = FARVANDE[selectedFarvand];
  const allowedOps = fv.allowedOps as string[];
  const allowedCategories = fv.allowedCategories as string[];

  function close() {
    play('ui');
    setShowMathSettings(false);
  }

  function selectFarvand(key: FarvandId) {
    play('ui');
    setSelectedFarvand(key);
    const allowed = FARVANDE[key as FarvandKey].allowedOps as string[];
    const prevOps = useMathStore.getState().activeOps;
    const filtered = prevOps.filter((o) => allowed.includes(o));
    setActiveOps(filtered.length > 0 ? filtered : [allowed[0]!]);
    const allowedCats = FARVANDE[key as FarvandKey].allowedCategories as string[];
    const prevCat = useMathStore.getState().mathCategory;
    setMathCategory(allowedCats.includes(prevCat) ? prevCat : 'basic');
  }

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-black/75 backdrop-blur-sm"
      onClick={close}
      onKeyDown={(e) => e.key === 'Escape' && close()}
      role="presentation"
    >
      <div
        className="panel-dark anim-zoom-in flex h-[min(680px,92dvh)] max-h-[min(680px,92dvh)] min-h-0 w-full max-w-md flex-col overflow-hidden rounded-3xl border-2 border-indigo-800/60 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="math-settings-title"
      >
        <div className="flex shrink-0 items-center justify-between px-8 pt-7 pb-4">
          <h2 id="math-settings-title" className="flex items-center gap-2 text-2xl font-black text-indigo-300">
            🧮 Matematik-indstillinger
          </h2>
          <button
            type="button"
            onClick={close}
            className="panel-close-btn bg-slate-800 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
          >
            ✕ Luk
          </button>
        </div>

        <div className="flex shrink-0 gap-1 border-b border-slate-700/50 px-8 pb-4">
          {MATH_TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                play('ui');
                setMathSettingsTab(id);
              }}
              className="flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2.5 text-xs font-black transition-all active:scale-95"
              style={{
                background: mathSettingsTab === id ? 'rgba(99,102,241,0.2)' : 'transparent',
                borderBottom:
                  mathSettingsTab === id ? '2px solid #818cf8' : '2px solid transparent',
                color: mathSettingsTab === id ? '#a5b4fc' : '#64748b',
              }}
            >
              <span className="text-lg">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto px-8 py-6">
          {mathSettingsTab === 'farvand' && (
            <div>
              <h3 className="mb-3 text-sm font-black tracking-widest text-slate-400 uppercase">
                🌊 Vælg farvand
              </h3>
              <div className="space-y-3">
                {(Object.keys(FARVANDE) as FarvandKey[]).map((key) => {
                  const f = FARVANDE[key];
                  const isActive = selectedFarvand === key;
                  const colors = farvandColors(key);
                  const [emoji, ...rest] = f.name.split(' ');
                  const title = rest.join(' ');
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => selectFarvand(key)}
                      className="flex w-full items-center gap-4 rounded-3xl border-2 px-5 py-5 transition-all hover:scale-[1.02] active:scale-95"
                      style={{
                        background: isActive ? `rgba(${colors.bg},0.18)` : 'rgba(30,41,59,0.5)',
                        borderColor: isActive ? colors.border : 'rgba(51,65,85,0.6)',
                        borderWidth: isActive ? 3 : 2,
                      }}
                    >
                      <div className="text-4xl">{emoji}</div>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="text-lg font-black text-white">{title}</div>
                        <div
                          className="mt-0.5 text-xs font-bold"
                          style={{ color: isActive ? colors.text : '#64748b' }}
                        >
                          {f.desc}
                        </div>
                      </div>
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-sm font-black transition-all ${
                          isActive ? 'border-white bg-white text-slate-900' : 'border-slate-600 bg-slate-800'
                        }`}
                      >
                        {isActive ? '✓' : ''}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div
                className="mt-4 rounded-xl border border-slate-600/40 px-3 py-2 text-xs font-bold text-slate-400"
                style={{ background: 'rgba(15,23,42,0.6)' }}
              >
                💡 Farvandet bestemmer hvilke regnearter og kategorier du kan vælge. Start ved Kysten og arbejd
                dig ud!
              </div>
            </div>
          )}

          {mathSettingsTab === 'ops' && (
            <div>
              <h3 className="mb-3 text-sm font-black tracking-widest text-slate-400 uppercase">
                🎣 Vælg madding (Regnearter)
              </h3>
              <div className="space-y-2">
                {(
                  [
                    { op: '+', label: 'Plus (+)', desc: 'x1 chance for sjælden fisk', bg: '16,185,129', border: '#10b981', text: '#6ee7b7' },
                    { op: '-', label: 'Minus (−)', desc: 'x2 chance for sjælden fisk', bg: '59,130,246', border: '#3b82f6', text: '#93c5fd' },
                    { op: '*', label: 'Gange (×)', desc: 'x3 chance for sjælden fisk', bg: '217,119,6', border: '#d97706', text: '#fcd34d' },
                    { op: '/', label: 'Division (÷)', desc: 'x4 chance for sjælden fisk', bg: '124,58,237', border: '#7c3aed', text: '#c4b5fd' },
                  ] as const
                )
                  .filter(({ op }) => allowedOps.includes(op))
                  .map(({ op, label, desc, bg, border, text }) => {
                    const isOn = activeOps.includes(op);
                    return (
                      <button
                        key={op}
                        type="button"
                        onClick={() => {
                          play('ui');
                          setActiveOps((prev) => {
                            if (isOn && prev.length === 1) return prev;
                            if (isOn) return prev.filter((o) => o !== op);
                            const withoutSpecials = prev.filter(
                              (o) => o !== 'tenfriends' && o !== '100friends' && o !== 'skaeve100friends',
                            );
                            return [...withoutSpecials, op];
                          });
                        }}
                        className="flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 transition-all hover:scale-[1.02] active:scale-95"
                        style={{
                          background: isOn ? `rgba(${bg},0.15)` : 'rgba(30,41,59,0.5)',
                          borderColor: isOn ? border : 'rgba(51,65,85,0.6)',
                        }}
                      >
                        <div className="text-left">
                          <div className="text-sm font-black text-white">{label}</div>
                          <div className="mt-0.5 text-xs font-bold" style={{ color: isOn ? text : '#64748b' }}>
                            {desc}
                          </div>
                        </div>
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-black transition-all ${
                            isOn
                              ? 'border-green-400 bg-green-500 text-white'
                              : 'border-slate-600 bg-slate-800 text-slate-600'
                          }`}
                        >
                          {isOn ? '✓' : ''}
                        </div>
                      </button>
                    );
                  })}
              </div>

              <div className="mt-5 border-t border-slate-700/50 pt-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-lg">📂</span>
                  <h4 className="text-xs font-black tracking-widest text-indigo-400 uppercase">Specialmadding</h4>
                  {mathCategory !== 'basic' && (
                    <span
                      className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ background: 'rgba(99,102,241,0.3)', color: '#a5b4fc' }}
                    >
                      Aktiv
                    </span>
                  )}
                </div>

                {allowedOps.includes('tenfriends') && (
                  <SpecialOpToggle
                    label="🎯 10'er-venner"
                    sub="? + 3 = 10 — Find det manglende tal"
                    isOn={activeOps.includes('tenfriends')}
                    onToggle={() => {
                      play('ui');
                      setActiveOps((prev) => {
                        const isOn = prev.includes('tenfriends');
                        if (isOn && prev.length === 1) return prev;
                        if (isOn) {
                          const without = prev.filter((o) => o !== 'tenfriends');
                          return without.length > 0 ? without : ['+'];
                        }
                        return ['tenfriends'];
                      });
                    }}
                    activeStyle={{ bg: 'rgba(16,185,129,0.15)', border: '#10b981' }}
                  />
                )}
                {allowedOps.includes('100friends') && (
                  <SpecialOpToggle
                    label="🎯 100'er-venner"
                    sub="90 + ? = 100 — hele tiere"
                    isOn={activeOps.includes('100friends')}
                    onToggle={() => {
                      play('ui');
                      setActiveOps((prev) => {
                        const isOn = prev.includes('100friends');
                        if (isOn && prev.length === 1) return prev;
                        if (isOn) {
                          const without = prev.filter((o) => o !== '100friends');
                          return without.length > 0 ? without : ['+'];
                        }
                        return ['100friends'];
                      });
                    }}
                    activeStyle={{ bg: 'rgba(16,185,129,0.15)', border: '#10b981' }}
                  />
                )}
                {allowedOps.includes('skaeve100friends') && (
                  <SpecialOpToggle
                    label="🎯 Skæve 100'er-venner"
                    sub="37 + ? = 100 — alle tal 1-99"
                    isOn={activeOps.includes('skaeve100friends')}
                    onToggle={() => {
                      play('ui');
                      setActiveOps((prev) => {
                        const isOn = prev.includes('skaeve100friends');
                        if (isOn && prev.length === 1) return prev;
                        if (isOn) {
                          const without = prev.filter((o) => o !== 'skaeve100friends');
                          return without.length > 0 ? without : ['+'];
                        }
                        return ['skaeve100friends'];
                      });
                    }}
                    activeStyle={{ bg: 'rgba(217,119,6,0.15)', border: '#d97706' }}
                    onVariant="orange"
                  />
                )}

                {allowedCategories.length > 1 && (
                  <div
                    className="mt-3 overflow-hidden rounded-2xl border"
                    style={{ borderColor: 'rgba(99,102,241,0.25)', background: 'rgba(99,102,241,0.05)' }}
                  >
                    {CATEGORY_ROWS.filter((row) => allowedCategories.includes(row.id)).map((row, idx) => (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => {
                          play('ui');
                          setMathCategory(row.id);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 transition-all hover:bg-white/5 active:scale-[0.98]"
                        style={{
                          background: mathCategory === row.id ? 'rgba(99,102,241,0.18)' : 'transparent',
                          borderTop: idx > 0 ? '1px solid rgba(99,102,241,0.12)' : 'none',
                        }}
                      >
                        <span className="text-base">{row.icon}</span>
                        <div className="min-w-0 flex-1 text-left">
                          <div className="truncate text-sm font-bold text-white">{row.label}</div>
                          <div className="truncate text-[11px] text-slate-500">{row.desc}</div>
                        </div>
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-black transition-all ${
                            mathCategory === row.id
                              ? 'border-indigo-400 bg-indigo-500 text-white'
                              : 'border-slate-600 bg-slate-800'
                          }`}
                        >
                          {mathCategory === row.id ? '●' : ''}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div
                className="mt-3 rounded-xl border border-slate-600/40 px-3 py-2 text-xs font-bold text-slate-400"
                style={{ background: 'rgba(15,23,42,0.6)' }}
              >
                {mathCategory === 'regnehistorier'
                  ? '🌟 Regnehistorier er sjove opgaver pakket ind i små historier!'
                  : mathCategory === 'lette-historier'
                    ? '🧸 Lette historier er perfekte til de allermindste!'
                    : mathCategory !== 'basic'
                      ? '🌟 Specialkategorier giver sværere og sjovere opgaver!'
                      : allowedCategories.length > 1
                        ? "💡 Tip: Vælg en specialkategori herover for sværere opgaver."
                        : "💡 Tip: Slå 10'er-venner til for at øve talforståelse. Du kan kombinere med + og −."}
              </div>
            </div>
          )}

          {mathSettingsTab === 'level' && (
            <div>
              <h3 className="mb-3 text-sm font-black tracking-widest text-slate-400 uppercase">
                📊 Vælg sværhedsgrad
              </h3>
              <div className="space-y-2">
                {DIFFICULTIES.map(({ id, label, desc, icon, color, bg, radio }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      play('ui');
                      setMathDifficulty(id);
                    }}
                    className="flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 transition-all hover:scale-[1.02] active:scale-95"
                    style={{
                      background: mathDifficulty === id ? bg : 'rgba(30,41,59,0.5)',
                      borderColor: mathDifficulty === id ? color : 'rgba(51,65,85,0.6)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{icon}</span>
                      <div className="text-left">
                        <div className="text-sm font-black text-white">{label}</div>
                        <div className="mt-0.5 text-xs text-slate-400">{desc}</div>
                      </div>
                    </div>
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-black transition-all ${
                        mathDifficulty === id ? `${radio} text-white` : 'border-slate-600 bg-slate-800'
                      }`}
                    >
                      {mathDifficulty === id ? '●' : ''}
                    </div>
                  </button>
                ))}
              </div>
              <div
                className="mt-3 rounded-xl border border-slate-600/40 px-3 py-2 text-xs font-bold text-slate-400"
                style={{ background: 'rgba(15,23,42,0.6)' }}
              >
                💡 Begynder passer til Kysten (0.–3. kl.), Øvet til Åbent Hav (4.–6. kl.), Ekspert til Dybet
                (7.–9. kl.).
              </div>
            </div>
          )}

          {mathSettingsTab === 'time' && (
            <div>
              <h3 className="mb-3 text-sm font-black tracking-widest text-slate-400 uppercase">
                🕐 Tid på regnestykker
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    play('ui');
                    setZenMode(false);
                  }}
                  aria-pressed={!zenMode}
                  className="flex flex-1 flex-col items-center gap-1 rounded-2xl border-2 px-4 py-4 font-black transition-all hover:scale-[1.02] active:scale-95"
                  style={{
                    background: !zenMode ? 'rgba(16,185,129,0.18)' : 'rgba(30,41,59,0.5)',
                    borderColor: !zenMode ? '#10b981' : 'rgba(51,65,85,0.6)',
                  }}
                >
                  <span className="text-3xl">🕐</span>
                  <span className="text-sm font-black text-white">Med tid</span>
                  <div
                    className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full border-2 text-xs font-black transition-all ${
                      !zenMode ? 'border-green-400 bg-green-500 text-white' : 'border-slate-600 bg-slate-800'
                    }`}
                  >
                    {!zenMode ? '●' : ''}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    play('ui');
                    setZenMode(true);
                  }}
                  aria-pressed={zenMode}
                  className="flex flex-1 flex-col items-center gap-1 rounded-2xl border-2 px-4 py-4 font-black transition-all hover:scale-[1.02] active:scale-95"
                  style={{
                    background: zenMode ? 'rgba(14,165,233,0.18)' : 'rgba(30,41,59,0.5)',
                    borderColor: zenMode ? '#0ea5e9' : 'rgba(51,65,85,0.6)',
                  }}
                >
                  <span className="text-3xl">♾️</span>
                  <span className="text-sm font-black text-white">Uden tid</span>
                  <div
                    className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full border-2 text-xs font-black transition-all ${
                      zenMode ? 'border-sky-400 bg-sky-500 text-white' : 'border-slate-600 bg-slate-800'
                    }`}
                  >
                    {zenMode ? '●' : ''}
                  </div>
                </button>
              </div>
              <div
                className="mt-3 rounded-xl border border-slate-600/40 px-3 py-2 text-xs font-bold text-slate-400"
                style={{ background: 'rgba(15,23,42,0.6)' }}
              >
                💡 I Zen-mode får du stadig en mild streak-bonus (+1 rigdom pr. streak når du rammer 10+), men
                uden tidspres. Nyd roen!
              </div>

              {zenMode && (
                <div className="mt-6 border-t border-slate-700/50 pt-5">
                  <h3 className="mb-2 text-sm font-black tracking-widest text-slate-400 uppercase">
                    ✂️ Klip linen-knap
                  </h3>
                  <p className="mb-3 text-xs text-slate-400">
                    Hvis et regnestykke føles for svært, dukker en venlig &quot;Klip linen&quot; op efter valgt
                    tid. Barnet ser svaret og lærer uden at sidde fast.
                  </p>
                  <div className="flex gap-2">
                    {(
                      [
                        { val: 10, label: '10 sek' },
                        { val: 15, label: '15 sek' },
                        { val: 0, label: 'Aldrig' },
                      ] as const
                    ).map(({ val, label }) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          play('ui');
                          setZenSkipDelay(val);
                        }}
                        className="flex-1 rounded-2xl border-2 py-3 text-sm font-black transition-all hover:scale-[1.02] active:scale-95"
                        style={{
                          background:
                            zenSkipDelay === val ? 'rgba(14,165,233,0.18)' : 'rgba(30,41,59,0.5)',
                          borderColor: zenSkipDelay === val ? '#0ea5e9' : 'rgba(51,65,85,0.6)',
                          color: zenSkipDelay === val ? '#7dd3fc' : '#64748b',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div
                    className="mt-3 rounded-xl border border-slate-600/40 px-3 py-2 text-xs font-bold text-slate-400"
                    style={{ background: 'rgba(15,23,42,0.6)' }}
                  >
                    💡 Kun aktiv i Uendelig tid. Barnet får tid til at tænke – og ser svaret når det giver op.
                  </div>
                </div>
              )}
            </div>
          )}

          {mathSettingsTab === 'more' && (
            <div className="flex flex-col pt-2">
              <h3 className="mb-4 text-sm font-black tracking-widest text-slate-400 uppercase">
                ⌨️ Indtastningsmetode
              </h3>
              <div className="flex items-center justify-between rounded-3xl border border-slate-700 bg-slate-800/70 p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 text-3xl">
                    🔢
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">Touch-numpad</div>
                    <div className="text-sm text-slate-400">
                      Store knapper i kamp-skærmen. Standard på mobil.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    play('ui');
                    setShowNumberPad(!showNumberPad);
                  }}
                  className={`relative h-9 w-16 rounded-full transition-all ${showNumberPad ? 'bg-emerald-500' : 'bg-slate-600'}`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-black shadow-md transition-all ${showNumberPad ? 'translate-x-7' : ''}`}
                  >
                    {showNumberPad ? 'ON' : 'OFF'}
                  </div>
                </button>
              </div>
              <div
                className="mt-3 rounded-xl border border-slate-600/40 px-3 py-2 text-xs font-bold text-slate-400"
                style={{ background: 'rgba(15,23,42,0.6)' }}
              >
                💡 Numpad inkluderer C, − og . knapper. Minus og komma er kun synlige i Dybet-farvandet.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SpecialOpToggle({
  label,
  sub,
  isOn,
  onToggle,
  activeStyle,
  onVariant,
}: {
  label: string;
  sub: string;
  isOn: boolean;
  onToggle: () => void;
  activeStyle: { bg: string; border: string };
  onVariant?: 'orange';
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="mb-2 flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 transition-all hover:scale-[1.02] active:scale-95"
      style={{
        background: isOn ? activeStyle.bg : 'rgba(30,41,59,0.5)',
        borderColor: isOn ? activeStyle.border : 'rgba(51,65,85,0.6)',
      }}
    >
      <div className="text-left">
        <div className="text-sm font-black text-white">{label}</div>
        <div
          className="mt-0.5 text-xs font-bold"
          style={{ color: isOn ? (onVariant === 'orange' ? '#fcd34d' : '#6ee7b7') : '#64748b' }}
        >
          {sub}
        </div>
      </div>
      <div
        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-black transition-all ${
          isOn
            ? onVariant === 'orange'
              ? 'border-orange-400 bg-orange-500 text-white'
              : 'border-green-400 bg-green-500 text-white'
            : 'border-slate-600 bg-slate-800 text-slate-600'
        }`}
      >
        {isOn ? '✓' : ''}
      </div>
    </button>
  );
}
