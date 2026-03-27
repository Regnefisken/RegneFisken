import { useAudio } from '../../audio/useAudio';
import { useUIStore } from '../../store/useUIStore';
import { BaitTab } from './BaitTab';
import { EquipmentTab } from './EquipmentTab';
import { PetTab } from './PetTab';
import { TreasureTab } from './TreasureTab';

const TABS = [
  { id: 'udstyr', label: '🎣 Udstyr' },
  { id: 'madding', label: '🪱 Madding' },
  { id: 'pet', label: '🐾 Kæledyr' },
  { id: 'skat', label: '💎 Skat' },
] as const;

export function ChestMenu() {
  const { play } = useAudio();
  const show = useUIStore((s) => s.showKisteMenu);
  const kisteTab = useUIStore((s) => s.kisteTab);
  const setKisteTab = useUIStore((s) => s.setKisteTab);
  const setShowKisteMenu = useUIStore((s) => s.setShowKisteMenu);

  if (!show) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={() => {
        play('ui');
        setShowKisteMenu(false);
      }}
      onKeyDown={(e) => e.key === 'Escape' && setShowKisteMenu(false)}
      role="presentation"
    >
      <div
        className="panel-shop anim-zoom-in flex max-h-[85dvh] w-full max-w-2xl flex-col rounded-3xl border border-slate-600 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Kiste"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-black text-emerald-300">📦 Kisten</h2>
          <button
            type="button"
            onClick={() => {
              play('ui');
              setShowKisteMenu(false);
            }}
            className="rounded-xl bg-slate-800 px-4 py-2 font-bold text-slate-300 hover:bg-slate-700"
          >
            Luk
          </button>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                play('ui');
                setKisteTab(t.id);
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase ${
                kisteTab === t.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="scrollbar-hide flex-1 overflow-y-auto">
          {kisteTab === 'udstyr' && <EquipmentTab />}
          {kisteTab === 'madding' && <BaitTab />}
          {kisteTab === 'pet' && <PetTab />}
          {kisteTab === 'skat' && <TreasureTab />}
        </div>
      </div>
    </div>
  );
}
