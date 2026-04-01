import { useAudio } from '../../audio/useAudio';
import { useCollectionStore } from '../../store/useCollectionStore';
import { useGameStore } from '../../store/useGameStore';
import type { LocationId } from '../../types/locations';

/** Efter klik på jungle-Plesiosaurus — rejse tilbage til Den Gamle Mole. */
export function JunglePlesioNpcModal() {
  const { play } = useAudio();
  const show = useCollectionStore((s) => s.showJunglePlesioNPC);
  const setShow = useCollectionStore((s) => s.setShowJunglePlesioNPC);
  const setCurrentLocation = useGameStore((s) => s.setCurrentLocation);

  if (!show) return null;

  function goBackToPier() {
    setShow(false);
    setCurrentLocation('pier' as LocationId);
    play('ui');
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="jungle-plesio-npc-title"
      className="pointer-events-auto fixed inset-0 z-[99998] flex animate-[fadeInZoom_0.4s_ease-out] items-center justify-center bg-black/88 backdrop-blur-[12px]"
      style={{ WebkitBackdropFilter: 'blur(12px)' }}
      onClick={() => setShow(false)}
      onKeyDown={(e) => e.key === 'Escape' && setShow(false)}
    >
      <div
        className="w-[92%] max-w-[480px] rounded-[1.75rem] border-2 border-[rgba(46,139,87,0.6)] p-8 text-center shadow-[0_0_80px_rgba(46,139,87,0.25),0_25px_60px_rgba(0,0,0,0.7)]"
        style={{
          background: 'linear-gradient(160deg, #0a2a1a 0%, #1a4a2a 40%, #0a1a0a 100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 text-[4rem] leading-none">🦕</div>
        <div className="mb-2 text-[0.75rem] font-black tracking-[0.2em] text-emerald-400 uppercase">
          Plesiosaurus
        </div>
        <h2
          id="jungle-plesio-npc-title"
          className="mb-4 text-[1.5rem] leading-snug font-black text-green-100"
        >
          Vil du rejse tilbage?
        </h2>
        <p className="mb-7 text-[0.9rem] leading-relaxed text-gray-300">
          Jeg kan svømme dig tilbage til Den Gamle Mole når som helst. Hop op!
        </p>
        <button
          type="button"
          className="mb-3 w-full cursor-pointer rounded-[0.875rem] border-0 border-b-4 border-[#14532d] bg-gradient-to-br from-green-800 to-green-600 py-4 text-[1.1rem] font-black text-white transition-transform hover:scale-[1.02]"
          onClick={() => {
            play('ui');
            goBackToPier();
          }}
        >
          🦕 Ja, tag mig tilbage!
        </button>
        <button
          type="button"
          className="w-full cursor-pointer rounded-[0.875rem] border border-white/15 bg-transparent py-3 text-[0.95rem] font-bold text-gray-400"
          onClick={() => {
            play('ui');
            setShow(false);
          }}
        >
          Nej tak, jeg bliver lidt endnu
        </button>
      </div>
    </div>
  );
}
