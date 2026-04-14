import { useEffect, useState } from 'react';
import { useAudio } from '../../audio/useAudio';
import { useGameStore } from '../../store/useGameStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUIStore } from '../../store/useUIStore';

const pulse = 'baitPulse 2s ease-in-out infinite';

export function BaitTab() {
  const { play } = useAudio();
  const setGameState = useGameStore((s) => s.setGameState);
  const setShopInitialTab = useGameStore((s) => s.setShopInitialTab);
  const setShowKisteMenu = useUIStore((s) => s.setShowKisteMenu);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 4000);
    return () => window.clearInterval(id);
  }, []);

  const activeBait = usePlayerStore((s) => s.activeBait);
  const questItems = usePlayerStore((s) => s.questItems);
  const conchBaitExpiry = usePlayerStore((s) => s.conchBaitExpiry);
  const fossilBaitExpiry = usePlayerStore((s) => s.fossilBaitExpiry);
  const flyBaitExpiry = usePlayerStore((s) => s.flyBaitExpiry);
  const hajBloodExpiry = usePlayerStore((s) => s.hajBloodExpiry);
  const perleLimExpiry = usePlayerStore((s) => s.perleLimExpiry);
  const koedklumpActive = usePlayerStore((s) => s.koedklumpActive);
  const hvalbofActive = usePlayerStore((s) => s.hvalbofActive);
  const eggCountdown = usePlayerStore((s) => s.eggCountdown);

  const setConchBaitExpiry = usePlayerStore((s) => s.setConchBaitExpiry);
  const setFossilBaitExpiry = usePlayerStore((s) => s.setFossilBaitExpiry);
  const setFlyBaitExpiry = usePlayerStore((s) => s.setFlyBaitExpiry);
  const setHajBloodExpiry = usePlayerStore((s) => s.setHajBloodExpiry);
  const setPerleLimExpiry = usePlayerStore((s) => s.setPerleLimExpiry);

  const hasAnyActive =
    !!activeBait ||
    now < conchBaitExpiry ||
    now < fossilBaitExpiry ||
    now < flyBaitExpiry ||
    now < hajBloodExpiry ||
    now < perleLimExpiry ||
    koedklumpActive ||
    hvalbofActive;

  const hasTurtleEgg =
    questItems.includes('turtle_egg') && !questItems.includes('turtle_hatched');
  const hasAnything = hasAnyActive || hasTurtleEgg;

  const onGoToShop = () => {
    play('ui');
    setShowKisteMenu(false);
    setShopInitialTab('bait');
    setGameState('shop');
  };

  return (
    <div className="flex flex-col gap-3">
      {hasAnyActive && (
        <div>
          <div className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-slate-500">
            ⚡ Aktiv madding
          </div>

          {(activeBait === 'bait' || questItems.includes('bait')) && (
            <div
              className="mb-2 flex items-center gap-3 rounded-2xl border border-emerald-500 p-3"
              style={{
                background: 'rgba(5,40,20,0.95)',
                animation: pulse,
              }}
            >
              <span className="text-xl">🎣</span>
              <div>
                <div className="font-bold text-emerald-400">Mystisk Madding</div>
                <div className="text-[0.78rem] text-emerald-200">Kast snøren i Dybet!</div>
              </div>
            </div>
          )}

          {activeBait === 'legendary_bait' && (
            <div
              className="mb-2 flex items-center gap-3 rounded-2xl border border-amber-500 p-3"
              style={{
                background: 'rgba(30,15,0,0.95)',
                animation: pulse,
              }}
            >
              <span className="text-xl">🌈</span>
              <div>
                <div className="font-bold text-amber-400">Legendarisk Maddingspakke</div>
                <div className="text-[0.78rem] text-amber-100">
                  Næste fangst: GARANTERET legendarisk!
                </div>
              </div>
            </div>
          )}

          {now < conchBaitExpiry && (
            <div
              className="mb-2 flex items-center justify-between gap-2 rounded-2xl border border-pink-400 p-3"
              style={{
                background: 'rgba(50,20,40,0.95)',
                animation: pulse,
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🍯</span>
                <div>
                  <div className="font-bold text-pink-200">Sød Madding</div>
                  <div className="text-[0.78rem] text-pink-50">
                    {Math.ceil((conchBaitExpiry - now) / 60000)} min tilbage ·{' '}
                    <span className="text-emerald-400">+6 Held</span> · 30% chance for konkylie pr. kast
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Vil du smide den søde madding væk?')) setConchBaitExpiry(0);
                }}
                className="shrink-0 cursor-pointer rounded-lg border border-pink-400 bg-pink-500/15 px-2 py-1 text-[0.75rem] text-pink-200"
              >
                Fjern
              </button>
            </div>
          )}

          {now < fossilBaitExpiry && (
            <div
              className="mb-2 flex items-center justify-between gap-2 rounded-2xl border border-stone-400 p-3"
              style={{
                background: 'rgba(30,30,30,0.95)',
                animation: pulse,
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🌑</span>
                <div>
                  <div className="font-bold text-stone-200">Fossil-slam</div>
                  <div className="text-[0.78rem] text-stone-50">
                    {Math.ceil((fossilBaitExpiry - now) / 60000)} min tilbage · 25% fossil-chance
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Vil du fjerne Fossil-slammet?')) setFossilBaitExpiry(0);
                }}
                className="shrink-0 cursor-pointer rounded-lg border border-stone-400 bg-stone-500/20 px-2 py-1 text-[0.75rem] text-stone-200"
              >
                Fjern
              </button>
            </div>
          )}

          {now < flyBaitExpiry && (
            <div
              className="mb-2 flex items-center justify-between gap-2 rounded-2xl border border-lime-600 p-3"
              style={{
                background: 'rgba(30,50,25,0.95)',
                animation: pulse,
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🪰</span>
                <div>
                  <div className="font-bold text-lime-400">Farverig Flue</div>
                  <div className="text-[0.78rem] text-lime-100">
                    {Math.ceil((flyBaitExpiry - now) / 60000)} min tilbage ·{' '}
                    <span className="text-emerald-400">+12 Held</span> · frøer bider lettere!
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Vil du fjerne den farverige flue?')) setFlyBaitExpiry(0);
                }}
                className="shrink-0 cursor-pointer rounded-lg border border-lime-600 bg-lime-500/20 px-2 py-1 text-[0.75rem] text-lime-400"
              >
                Fjern
              </button>
            </div>
          )}

          {now < hajBloodExpiry && (
            <div
              className="mb-2 flex items-center justify-between gap-2 rounded-2xl border border-red-400 p-3"
              style={{
                background: 'rgba(185,28,28,0.95)',
                animation: pulse,
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🩸</span>
                <div>
                  <div className="font-bold text-red-300">Hajblod</div>
                  <div className="text-[0.78rem] text-red-100">
                    {Math.ceil((hajBloodExpiry - now) / 60000)} min tilbage ·{' '}
                    <span className="text-emerald-400">+15 Held</span> · tiltrækker Hvidhaj
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Vil du fjerne Hajblodet?')) setHajBloodExpiry(0);
                }}
                className="shrink-0 cursor-pointer rounded-lg border border-red-400 bg-red-500/20 px-2 py-1 text-[0.75rem] text-red-300"
              >
                Fjern
              </button>
            </div>
          )}

          {now < perleLimExpiry && (
            <div
              className="mb-2 flex items-center justify-between gap-2 rounded-2xl border border-violet-400 p-3"
              style={{
                background: 'rgba(147,51,234,0.95)',
                animation: pulse,
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🦪</span>
                <div>
                  <div className="font-bold text-violet-200">Perlelim</div>
                  <div className="text-[0.78rem] text-violet-50">
                    {Math.ceil((perleLimExpiry - now) / 60000)} min tilbage ·{' '}
                    <span className="text-emerald-400">+15 Held</span> · tiltrækker Østers med Perle
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Vil du fjerne Perlelimet?')) setPerleLimExpiry(0);
                }}
                className="shrink-0 cursor-pointer rounded-lg border border-violet-400 bg-violet-500/20 px-2 py-1 text-[0.75rem] text-violet-200"
              >
                Fjern
              </button>
            </div>
          )}

          {koedklumpActive && (
            <div
              className="mb-2 flex items-center gap-3 rounded-2xl border border-amber-700 p-3"
              style={{
                background: 'rgba(60,30,10,0.95)',
                animation: pulse,
              }}
            >
              <span className="text-xl">🍖</span>
              <div>
                <div className="font-bold text-amber-400">Klistret Kødklump</div>
                <div className="text-[0.78rem] text-amber-100">
                  Aktiv indtil Søuhyret er fanget · Fisk i Ørkensøen!
                </div>
              </div>
            </div>
          )}

          {hvalbofActive && (
            <div
              className="mb-2 flex items-center gap-3 rounded-2xl border border-violet-600 p-3"
              style={{
                background: 'rgba(30,10,50,0.95)',
                animation: pulse,
              }}
            >
              <span className="text-xl">🥩</span>
              <div>
                <div className="font-bold text-violet-300">Kæmpe Hvalbøf</div>
                <div className="text-[0.78rem] text-violet-100">
                  Aktiv indtil Kraken er fanget · Fisk i Den Forbudte Sø!
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {hasTurtleEgg && (
        <div>
          <div
            className="mb-2 text-[0.7rem] font-bold uppercase tracking-[0.1em]"
            style={{ color: '#64748b' }}
          >
            🥚 Skildpadde-æg
          </div>
          <div
            className="flex items-center gap-3 rounded-2xl border border-amber-600/50 p-3"
            style={{ background: 'rgba(50,40,10,0.85)' }}
          >
            <span className="text-2xl" style={{ animation: pulse }}>
              🥚
            </span>
            <div>
              <div className="font-bold" style={{ color: '#fde68a' }}>
                Skildpaddeæg klækker om...
              </div>
              <div
                className="font-mono text-[1.1rem] font-black"
                style={{ color: '#fde68a' }}
              >
                {eggCountdown || '...'}
              </div>
            </div>
          </div>
        </div>
      )}

      {!hasAnything && (
        <div
          className="rounded-[1.25rem] border-2 border-dashed border-slate-600/80 px-6 py-12 text-center"
          style={{ background: 'rgba(15,23,42,0.6)' }}
        >
          <div className="mb-4 text-[3.5rem] opacity-70">🪱</div>
          <h4 className="mb-2 font-bold text-slate-400">Din krog er tom</h4>
          <p className="mb-5 leading-relaxed text-slate-500">
            Køb madding i butikken for at tiltrække de helt sjældne fisk!
          </p>
          <button
            type="button"
            onClick={onGoToShop}
            className="cursor-pointer rounded-full border-none bg-green-600 px-8 py-3 font-bold text-white hover:bg-green-500"
          >
            🛒 Gå til butikken
          </button>
        </div>
      )}
    </div>
  );
}
