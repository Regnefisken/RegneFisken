import { useMemo } from 'react';
import { useAudio } from '../../audio/useAudio';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUIStore } from '../../store/useUIStore';
import { BaitTab } from './BaitTab';
import { EquipmentTab } from './EquipmentTab';
import { KisteTuningTab } from './KisteTuningTab';
import { PetTab } from './PetTab';
import { TreasureTab } from './TreasureTab';

export function ChestMenu() {
  const { play } = useAudio();
  const show = useUIStore((s) => s.showKisteMenu);
  const kisteTab = useUIStore((s) => s.kisteTab);
  const setKisteTab = useUIStore((s) => s.setKisteTab);
  const setShowKisteMenu = useUIStore((s) => s.setShowKisteMenu);
  const hasPirateHat = usePlayerStore((s) => s.upgrades.includes('pirate_hat'));

  const tabs = useMemo(() => {
    const base = [
      { id: 'udstyr', label: '🛠️ Udstyr' },
      { id: 'madding', label: '⚡ Aktive buffs' },
      { id: 'companions', label: '🐢 Kæledyr' },
      { id: 'skatte', label: '💎 Skatte & Quest' },
    ] as const;
    if (!hasPirateHat) return [...base];
    return [...base, { id: 'tuning', label: '🔧 Tuning' } as const];
  }, [hasPirateHat]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-[8px]"
      onClick={() => {
        play('ui');
        setShowKisteMenu(false);
      }}
      onKeyDown={(e) => e.key === 'Escape' && setShowKisteMenu(false)}
      role="presentation"
    >
      <div
        className="panel-dark anim-zoom-in flex flex-col overflow-hidden rounded-3xl p-6 shadow-2xl"
        style={{
          border: '2px solid rgba(180,83,9,0.5)',
          maxWidth: '560px',
          width: '94%',
          height: 'clamp(420px, 72dvh, 680px)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.7)',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Kiste"
      >
        <div className="mb-4 flex shrink-0 items-center justify-between">
          <h3
            className="flex items-center gap-2 text-[1.4rem] font-black"
            style={{ color: '#fef3c7' }}
          >
            🗃️ Kiste
          </h3>
          <button
            type="button"
            onClick={() => {
              play('ui');
              setShowKisteMenu(false);
            }}
            className="cursor-pointer border-none bg-transparent text-[1.4rem] leading-none text-slate-400 transition-colors hover:text-slate-200"
            aria-label="Luk"
          >
            ✕
          </button>
        </div>
        {/* Én række faner (som legacy) — ingen wrap → modal hopper ikke ved tab-skift */}
        <div className="mb-4 flex min-h-0 shrink-0 gap-1 overflow-x-auto pb-0.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              title={t.label}
              onClick={() => {
                play('ui');
                setKisteTab(t.id);
              }}
              className="min-w-0 flex-1 cursor-pointer rounded-xl font-bold transition-all duration-150"
              style={{
                flex: '1 1 0',
                padding: '0.5rem 0.35rem',
                whiteSpace: 'nowrap',
                fontSize: 'max(0.65rem, 0.8rem)',
                border:
                  kisteTab === t.id
                    ? '2px solid #b45309'
                    : '1px solid rgba(255,255,255,0.1)',
                background:
                  kisteTab === t.id ? 'rgba(180,83,9,0.25)' : 'rgba(255,255,255,0.04)',
                color: kisteTab === t.id ? '#fde68a' : '#94a3b8',
              }}
            >
              <span className="block truncate text-center">{t.label}</span>
            </button>
          ))}
        </div>
        <div className="screen-settings-legacy-scroll min-h-0 flex-1 overflow-y-auto pr-1">
          {kisteTab === 'udstyr' && <EquipmentTab />}
          {kisteTab === 'madding' && <BaitTab />}
          {kisteTab === 'companions' && <PetTab />}
          {kisteTab === 'skatte' && <TreasureTab />}
          {kisteTab === 'tuning' && hasPirateHat && <KisteTuningTab />}
        </div>
      </div>
    </div>
  );
}
