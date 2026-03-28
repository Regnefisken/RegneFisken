import { useAudio } from '../../audio/useAudio';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUIStore } from '../../store/useUIStore';

/** Legacy tropical island — klik på skildpaddeæg (linje ~13468). */
export function EggInspectModal() {
  const { play } = useAudio();
  const open = useUIStore((s) => s.showEggInspectModal);
  const setOpen = useUIStore((s) => s.setShowEggInspectModal);
  const setToastMessage = useUIStore((s) => s.setToastMessage);
  const setWorldParticleBurst = useUIStore((s) => s.setWorldParticleBurst);

  const questItems = usePlayerStore((s) => s.questItems);
  const eggLeftTimestamp = usePlayerStore((s) => s.eggLeftTimestamp);
  const wildTurtleSpawned = usePlayerStore((s) => s.wildTurtleSpawned);
  const setQuestItems = usePlayerStore((s) => s.setQuestItems);
  const setEggHatchAt = usePlayerStore((s) => s.setEggHatchAt);
  const setEggCountdown = usePlayerStore((s) => s.setEggCountdown);
  const setEggLeftTimestamp = usePlayerStore((s) => s.setEggLeftTimestamp);

  if (!open) return null;

  function closeModal() {
    setOpen(false);
  }

  return (
    <div
      role="presentation"
      className="pointer-events-auto fixed inset-0 z-[99998] flex items-center justify-center"
      style={{
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onClick={closeModal}
      onKeyDown={(e) => e.key === 'Escape' && closeModal()}
    >
      <div
        role="dialog"
        aria-modal
        aria-labelledby="egg-inspect-title"
        className="w-[90%] max-w-[22rem] rounded-[1.5rem] border-2 border-[#ea580c] p-8 text-center shadow-2xl"
        style={{
          background: 'rgba(120,53,15,0.97)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
          animation: 'zoomIn 0.25s ease-out forwards',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 text-[3.5rem] leading-none">🥚</div>
        <h3 id="egg-inspect-title" className="mb-2 text-[1.2rem] font-black text-white">
          Skildpaddeæg!
        </h3>
        <p className="mb-6 text-[0.9rem] leading-relaxed" style={{ color: '#fed7aa' }}>
          Du finder et stort varmt æg i sandet. Det vibrerer svagt. Vil du tage det med dig?
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="flex-1 cursor-pointer rounded-xl border-0 border-b-[3px] border-solid border-b-[#14532d] bg-[#16a34a] py-3 text-base font-bold text-white"
            onClick={() => {
              play('win');
              closeModal();
              setQuestItems((q) => (q.includes('turtle_egg') ? q : [...q, 'turtle_egg']));
              setEggHatchAt(Date.now() + 15 * 60 * 1000);
              setEggCountdown('15:00');
              setToastMessage('🥚 Du har samlet skildpaddeægget! Klækker om 15 minutter...');
              setWorldParticleBurst('confetti');
              window.setTimeout(() => useUIStore.getState().setWorldParticleBurst(null), 1800);
            }}
          >
            🤲 Tag det med
          </button>
          <button
            type="button"
            className="flex-1 cursor-pointer rounded-xl border-2 border-solid py-3 text-base font-bold"
            style={{
              background: '#1e293b',
              borderColor: 'rgba(255,255,255,0.15)',
              color: '#94a3b8',
            }}
            onClick={() => {
              play('ui');
              closeModal();
              if (eggLeftTimestamp) {
                setToastMessage('🥚 Du går forsigtigt udenom ægget...');
                return;
              }
              if (
                !questItems.includes('turtle_egg') &&
                !questItems.includes('turtle_hatched') &&
                !wildTurtleSpawned
              ) {
                setEggLeftTimestamp(Date.now());
                setToastMessage('🥚 Du lod ægget ligge i det varme sand... Naturen tager sig af det nu ❤️');
              }
            }}
          >
            Lad det ligge
          </button>
        </div>
      </div>
    </div>
  );
}
