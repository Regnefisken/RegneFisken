import { COMPANIONS_DATABASE } from '../../data/collectibles';
import type { CompanionDef } from '../../types/collectibles';
import { useCollectionStore } from '../../store/useCollectionStore';
import { usePlayerStore } from '../../store/usePlayerStore';

function unlockHint(comp: CompanionDef, cheeseCount: number, featherCount: number): string {
  switch (comp.unlockType) {
    case 'collectibles':
      return comp.unlockValue === 'cheeses'
        ? `Ost: ${cheeseCount}/3`
        : `Fjer: ${featherCount}/3`;
    case 'turtle_hatch':
      return '🥚 Klæk skildpaddeægget';
    case 'wish':
      return '🐟 Ønsk hos Helleflynderen';
    case 'golden_frog_catch':
      return '🐸 Fang Den Gyldne Frø';
    case 'axolotl_catch':
      return '🌟 Fang Glødende Axolotl i grotten';
    case 'cheese_bought':
      return '🧀 Køb Gammel Stærk Ost i butikken';
    case 'pirate_fossil_milestone':
      return '🏴‍☠️ Giv 5 fossiler til Kaptajn Rotteskæg';
    case 'haps_sardine_milestone':
      return '🐦 Giv 10 sardiner til Havnemågen Haps';
    default:
      return '❓ Hemmeligt';
  }
}

export function PetTab() {
  const unlockedCompanions = useCollectionStore((s) => s.unlockedCompanions);
  const cheeseSources = usePlayerStore((s) => s.cheeseSources);
  const featherSources = usePlayerStore((s) => s.featherSources);

  const cheeseCount = cheeseSources.length;
  const featherCount = featherSources.length;

  return (
    <div className="flex flex-col gap-4 text-sm text-slate-300">
      <div className="text-[0.7rem] font-black tracking-widest text-slate-500 uppercase">
        🐾 Dine kæledyr ({unlockedCompanions.length}/{COMPANIONS_DATABASE.length})
      </div>
      <div className="grid grid-cols-2 gap-3">
        {COMPANIONS_DATABASE.map((comp) => {
          const isUnlocked = unlockedCompanions.includes(comp.id);
          const hint = unlockHint(comp, cheeseCount, featherCount);
          return (
            <div
              key={comp.id}
              className="flex flex-col items-center gap-2 rounded-3xl border-2 p-3 transition-all"
              style={{
                background: isUnlocked ? 'rgba(16,185,129,0.12)' : 'rgba(30,41,59,0.5)',
                borderColor: isUnlocked ? comp.color : 'rgba(51,65,85,0.5)',
                opacity: isUnlocked ? 1 : 0.6,
              }}
            >
              <span
                className={`text-4xl sm:text-5xl ${comp.id === 'turtle' && isUnlocked ? 'turtle-companion' : ''}`}
                style={{ filter: isUnlocked ? undefined : 'grayscale(1)' }}
              >
                {comp.emoji}
              </span>
              <span
                className="text-center text-[0.95rem] font-bold"
                style={{ color: isUnlocked ? 'white' : '#64748b' }}
              >
                {comp.name}
              </span>
              <span
                className="text-center text-[0.78rem] leading-snug"
                style={{ color: isUnlocked ? '#94a3b8' : '#475569' }}
              >
                {isUnlocked ? comp.description : hint}
              </span>
              {isUnlocked && (
                <span
                  className="rounded-md px-2 py-0.5 text-[0.72rem] font-bold"
                  style={{
                    color: comp.color,
                    background: `${comp.color}22`,
                  }}
                >
                  ✓ Låst op
                </span>
              )}
            </div>
          );
        })}
      </div>
      {unlockedCompanions.length === 0 && (
        <p className="mt-1 text-center text-[0.85rem] text-slate-600 italic">
          Find oste, fjer og klæk æg for at få kæledyr!
        </p>
      )}
    </div>
  );
}
