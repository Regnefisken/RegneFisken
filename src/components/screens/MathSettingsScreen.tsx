import {
  FARVANDE,
  MATH_TYPE_DEFS,
  MATH_TYPE_GROUP_LABEL,
  MATH_TYPE_GROUP_ORDER,
} from '../../data/math-config';
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

  const activeMathTypes = useMathStore((s) => s.activeMathTypes);
  const setActiveMathTypes = useMathStore((s) => s.setActiveMathTypes);
  const typeOps = useMathStore((s) => s.typeOps);
  const setTypeOps = useMathStore((s) => s.setTypeOps);
  const mathDifficulty = useMathStore((s) => s.mathDifficulty);
  const setMathDifficulty = useMathStore((s) => s.setMathDifficulty);
  const selectedFarvand = useMathStore((s) => s.selectedFarvand) as FarvandKey;
  const setSelectedFarvand = useMathStore((s) => s.setSelectedFarvand);
  const zenMode = useMathStore((s) => s.zenMode);
  const setZenMode = useMathStore((s) => s.setZenMode);
  const zenSkipDelay = useMathStore((s) => s.zenSkipDelay);
  const setZenSkipDelay = useMathStore((s) => s.setZenSkipDelay);
  const showNumberPad = useMathStore((s) => s.showNumberPad);
  const setShowNumberPad = useMathStore((s) => s.setShowNumberPad);
  const decimalSeparator = useMathStore((s) => s.decimalSeparator);
  const setDecimalSeparator = useMathStore((s) => s.setDecimalSeparator);

  const fv = FARVANDE[selectedFarvand];
  const allowedMathTypes = fv.allowedMathTypes as string[];
  const typeOpsAvailable = fv.typeOpsAvailable as Record<string, string[]>;

  function close() {
    play('ui');
    setShowMathSettings(false);
  }

  function selectFarvand(key: FarvandId) {
    play('ui');
    setSelectedFarvand(key);
    const f = FARVANDE[key as FarvandKey];
    const allowed = new Set(f.allowedMathTypes as string[]);
    const prevTypes = useMathStore.getState().activeMathTypes;
    const filtered = prevTypes.filter((t) => allowed.has(t));
    setActiveMathTypes(filtered.length > 0 ? filtered : ['plus']);
    setTypeOps((prevOps) => {
      const next: Record<string, string[]> = { ...prevOps };
      const fOps = f.typeOpsAvailable as Record<string, string[]>;
      for (const k of Object.keys(next)) {
        const avail = fOps[k];
        if (!avail) {
          delete next[k];
          continue;
        }
        const pruned = (next[k] ?? []).filter((o) => avail.includes(o));
        if (pruned.length === 0) delete next[k];
        else next[k] = pruned;
      }
      return next;
    });
  }

  function toggleMathType(id: string) {
    if (!allowedMathTypes.includes(id)) return;
    const isOn = activeMathTypes.includes(id);
    if (isOn && activeMathTypes.length === 1) return;
    play('ui');
    const def = MATH_TYPE_DEFS.find((d) => d.id === id);
    if (isOn) {
      setActiveMathTypes((prev) => prev.filter((t) => t !== id));
      if (def?.supportsOps) {
        setTypeOps((prev) => {
          const n = { ...prev };
          delete n[id];
          return n;
        });
      }
    } else {
      setActiveMathTypes((prev) => [...prev, id]);
      if (def?.supportsOps) {
        const avail = typeOpsAvailable[id];
        if (avail && avail.length > 0) {
          setTypeOps((prev) => ({ ...prev, [id]: [...avail] }));
        }
      }
    }
  }

  function getSelectedOpsForType(typeId: string): string[] {
    const avail = typeOpsAvailable[typeId] ?? [];
    const stored = typeOps[typeId]?.filter((o) => avail.includes(o));
    if (stored && stored.length > 0) return stored;
    return [...avail];
  }

  function toggleTypeOp(typeId: 'emoji-counting' | 'regnehistorier', op: string) {
    const avail = typeOpsAvailable[typeId] ?? [];
    if (!avail.includes(op)) return;
    play('ui');
    setTypeOps((prev) => {
      const cur = (prev[typeId] ?? [...avail]).filter((o) => avail.includes(o));
      const isOn = cur.includes(op);
      if (isOn && cur.length === 1) return prev;
      const nextOps = isOn ? cur.filter((o) => o !== op) : [...cur, op];
      return { ...prev, [typeId]: nextOps };
    });
  }

  function opPillSymbol(op: string): string {
    if (op === '*') return '×';
    if (op === '/') return '÷';
    if (op === '-') return '−';
    return '+';
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
            🧮 Matematik
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
                💡 Farvandet bestemmer hvilke opgavetyper du kan vælge
              </div>
            </div>
          )}

          {mathSettingsTab === 'ops' && (
            <div>
              <h3 className="mb-1 text-sm font-black tracking-widest text-slate-400 uppercase">
                🎣 Vælg madding
              </h3>
              <p className="mb-4 text-xs font-bold text-slate-500">
                Vælg én eller flere
              </p>
              <div className="space-y-6">
                {MATH_TYPE_GROUP_ORDER.map((group) => {
                  const defs = MATH_TYPE_DEFS.filter(
                    (d) => d.group === group && allowedMathTypes.includes(d.id),
                  );
                  if (defs.length === 0) return null;
                  return (
                    <div key={group}>
                      <div className="mb-2 flex items-center gap-2 text-slate-500">
                        <span className="h-px flex-1 bg-slate-600/80" aria-hidden />
                        <span className="shrink-0 text-[11px] font-black tracking-widest uppercase">
                          {MATH_TYPE_GROUP_LABEL[group]}
                        </span>
                        <span className="h-px flex-1 bg-slate-600/80" aria-hidden />
                      </div>
                      <div className="space-y-2">
                        {defs.map((def) => {
                          const isOn = activeMathTypes.includes(def.id);
                          const availOps =
                            def.supportsOps && isOn ? typeOpsAvailable[def.id] ?? [] : [];
                          const selectedOps =
                            def.supportsOps && isOn ? getSelectedOpsForType(def.id) : [];
                          return (
                            <div key={def.id}>
                              <button
                                type="button"
                                onClick={() => toggleMathType(def.id)}
                                className="flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 transition-all hover:scale-[1.01] active:scale-95"
                                style={{
                                  background: isOn ? 'rgba(99,102,241,0.12)' : 'rgba(30,41,59,0.5)',
                                  borderColor: isOn ? 'rgba(129,140,248,0.65)' : 'rgba(51,65,85,0.6)',
                                }}
                              >
                                <div className="min-w-0 flex-1 text-left">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">{def.icon}</span>
                                    <div className="text-sm font-black text-white">{def.label}</div>
                                  </div>
                                  <div className="mt-0.5 pl-7 text-xs font-bold text-slate-500">{def.desc}</div>
                                </div>
                                <div
                                  className={`ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-black transition-all ${
                                    isOn
                                      ? 'border-green-400 bg-green-500 text-white'
                                      : 'border-slate-600 bg-slate-800 text-slate-600'
                                  }`}
                                >
                                  {isOn ? '✓' : ''}
                                </div>
                              </button>
                              {def.supportsOps && isOn && availOps.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5 pl-8">
                                  {availOps.map((op) => {
                                    const pillOn = selectedOps.includes(op);
                                    return (
                                      <button
                                        key={op}
                                        type="button"
                                        onClick={() =>
                                          toggleTypeOp(
                                            def.id as 'emoji-counting' | 'regnehistorier',
                                            op,
                                          )
                                        }
                                        className="flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-black transition-all hover:scale-105 active:scale-95"
                                        style={{
                                          background: pillOn
                                            ? 'rgba(34,211,238,0.22)'
                                            : 'rgba(30,41,59,0.85)',
                                          borderColor: pillOn ? '#22d3ee' : 'rgba(51,65,85,0.7)',
                                          color: pillOn ? '#a5f3fc' : '#64748b',
                                        }}
                                        aria-pressed={pillOn}
                                      >
                                        {opPillSymbol(op)}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                className="mt-4 rounded-xl border border-slate-600/40 px-3 py-2 text-xs font-bold text-slate-400"
                style={{ background: 'rgba(15,23,42,0.6)' }}
              >
                💡 Aftal med en voksen hvad der passer til dit niveau
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
                💡 Justér niveau yderligere - virker med udvalgte opgavetyper
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
                    ✂️ Klip-linen-knap
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
                    💡 Kun aktiv uden tid. Barnet får tid til at tænke – og ser svaret hvis det giver op.
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
                  className={`relative h-9 w-16 shrink-0 overflow-hidden rounded-full transition-colors ${showNumberPad ? 'bg-emerald-500' : 'bg-slate-600'}`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 flex size-8 min-h-8 min-w-8 max-h-8 max-w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-[10px] font-black leading-none shadow-md transition-transform duration-200 ${showNumberPad ? 'translate-x-7' : 'translate-x-0'}`}
                  >
                    {showNumberPad ? 'ON' : 'OFF'}
                  </div>
                </button>
              </div>
              <div
                className="mt-3 rounded-xl border border-slate-600/40 px-3 py-2 text-xs font-bold text-slate-400"
                style={{ background: 'rgba(15,23,42,0.6)' }}
              >
                💡 Numpad inkluderer C og − knapper. Decimaltast og minus vises kun ved relevante opgavetyper.
              </div>

              {/* ── Decimalseparator ── */}
              <h3 className="mt-8 mb-4 text-sm font-black tracking-widest text-slate-400 uppercase">
                🔢 Decimaltegn
              </h3>
              <div className="flex items-center justify-between rounded-3xl border border-slate-700 bg-slate-800/70 p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 text-3xl">
                    {decimalSeparator === ',' ? ',' : '.'}
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">
                      {decimalSeparator === ',' ? 'Komma (dansk)' : 'Punktum (engelsk)'}
                    </div>
                    <div className="text-sm text-slate-400">Bruges i opgaver og på numpad</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    play('ui');
                    setDecimalSeparator(decimalSeparator === ',' ? '.' : ',');
                  }}
                  className={`relative h-9 w-16 rounded-full transition-all ${decimalSeparator === '.' ? 'bg-amber-500' : 'bg-slate-600'}`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-black shadow-md transition-all ${decimalSeparator === '.' ? 'translate-x-7' : ''}`}
                  >
                    {decimalSeparator === ',' ? ',' : '.'}
                  </div>
                </button>
              </div>
              <div
                className="mt-3 rounded-xl border border-slate-600/40 px-3 py-2 text-xs font-bold text-slate-400"
                style={{ background: 'rgba(15,23,42,0.6)' }}
              >
                💡 Standard er komma. Skift til punktum hvis du foretrækker international notation.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

