import { useAudio } from '../../audio/useAudio';
import { isCabinLocation } from '../../logic/location-helpers';
import { applyXP } from '../../logic/xp-engine';
import { useGameStore } from '../../store/useGameStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUIStore } from '../../store/useUIStore';

/** Klik på skildpadde: vild på tropisk ø eller hus-skildpadde i fiskehytten — samme modal og samme blad-belønning. */
export function WildTurtleModal() {
  const { play } = useAudio();
  const currentLocation = useGameStore((s) => s.currentLocation);
  const inCabin = isCabinLocation(currentLocation);
  const open = useUIStore((s) => s.showWildTurtleModal);
  const setOpen = useUIStore((s) => s.setShowWildTurtleModal);
  const setToastMessage = useUIStore((s) => s.setToastMessage);
  const setWorldParticleBurst = useUIStore((s) => s.setWorldParticleBurst);

  const progression = usePlayerStore((s) => s.progression);
  const setProgression = usePlayerStore((s) => s.setProgression);
  const setCoins = usePlayerStore((s) => s.setCoins);
  const setFeatherSources = usePlayerStore((s) => s.setFeatherSources);
  const setShowLevelUp = useUIStore((s) => s.setShowLevelUp);

  if (!open) return null;

  function close() {
    play('ui');
    setOpen(false);
  }

  return (
    <div
      role="presentation"
      className="pointer-events-auto fixed inset-0 z-[99998] flex items-center justify-center bg-black/75 backdrop-blur-[8px]"
      style={{ WebkitBackdropFilter: 'blur(8px)' }}
      onClick={close}
      onKeyDown={(e) => e.key === 'Escape' && close()}
    >
      <div
        role="dialog"
        aria-modal
        aria-labelledby="wild-turtle-title"
        className="flex w-[90%] max-w-[24rem] flex-col gap-4 rounded-[1.5rem] border-2 p-8 text-center shadow-2xl"
        style={{
          background: 'rgba(30,60,30,0.97)',
          borderColor: 'rgba(34,197,94,0.5)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="turtle-emoji text-[4rem] leading-none">🐢</div>
        <h3 id="wild-turtle-title" className="text-[1.5rem] font-black text-white">
          {inCabin ? 'Skildpadden i fiskehytten 🐢' : 'Den Fri Skildpadde 🐢'}
        </h3>
        <p className="text-[0.95rem] leading-relaxed" style={{ color: '#bbf7d0' }}>
          {inCabin
            ? 'Din skildpadde ser glad ud! Den blinker kærligt til dig.'
            : 'Skildpadden føler sig fri! Den blinker kærligt til dig.'}
        </p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="cursor-pointer rounded-xl border-0 border-b-[3px] border-solid border-b-[#14532d] bg-[#16a34a] py-3 text-base font-bold text-white"
            onClick={() => {
              play('win');
              setFeatherSources((p) => (p.includes('turtle') ? p : [...p, 'turtle']));
              setCoins((c) => c + 7);
              const { level, xp, levelUps } = applyXP(progression.level, progression.xp, 6);
              setProgression({ level, xp });
              if (levelUps.length > 0) setShowLevelUp(levelUps[levelUps.length - 1]!);
              setToastMessage(
                '🐢 Skildpadden åd bladet og gav dig en blød fjer! 🪶 +6 XP +7 kr',
              );
              setWorldParticleBurst('confetti');
              window.setTimeout(() => useUIStore.getState().setWorldParticleBurst(null), 1800);
              setOpen(false);
            }}
          >
            🌿 Giv et blad
          </button>
          <button
            type="button"
            className="cursor-pointer rounded-xl border-0 border-b-[3px] border-solid border-b-[#082f49] bg-[#0c4a6e] py-3 text-base font-bold text-white"
            onClick={() => {
              play('ui');
              setToastMessage('Skildpadden kigger kærligt på dig... 💕');
              setWorldParticleBurst('levelup');
              window.setTimeout(() => useUIStore.getState().setWorldParticleBurst(null), 1800);
            }}
          >
            👀 Kig længe
          </button>
          <button
            type="button"
            className="cursor-pointer rounded-xl border-2 border-solid py-3 text-base font-bold"
            style={{
              background: 'transparent',
              borderColor: 'rgba(255,255,255,0.15)',
              color: '#94a3b8',
            }}
            onClick={close}
          >
            Gå videre
          </button>
        </div>
      </div>
    </div>
  );
}
