import { useAudio } from '../../audio/useAudio';
import { useGameStore } from '../../store/useGameStore';
import { useCollectionStore } from '../../store/useCollectionStore';

/** Første besøg i fiskehytten — matcher legacy velkomst; sætter hasVisitedCabin (skjuler grøn nøgle-banner på molen). */
export function CabinFirstVisitModal() {
  const { play } = useAudio();
  const currentLocation = useGameStore((s) => s.currentLocation);
  const hasVisitedCabin = useCollectionStore((s) => s.hasVisitedCabin);
  const setHasVisitedCabin = useCollectionStore((s) => s.setHasVisitedCabin);

  if (currentLocation !== 'fishing_cabin' || hasVisitedCabin) return null;

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[10040] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)' }}
    >
      <div
        className="anim-zoom-in panel-dark mx-4 max-w-sm rounded-3xl border border-amber-500/50 px-8 py-6 text-center shadow-2xl"
        style={{ background: 'rgba(30,15,5,0.98)' }}
      >
        <h2 className="mb-3 text-2xl font-black text-amber-300">Velkommen til Hytten! 🎣</h2>
        <p className="mb-6 text-sm leading-relaxed text-amber-100/90">
          Dette er din private fiskehytte! Her er fred og ro, og ingen fisk der forstyrrer dig.
          <br />
          <br />
          Måske vil der dukke sjove ting op herinde, jo mere du udforsker verdenen?
        </p>
        <button
          type="button"
          className="rounded-xl bg-amber-600 px-6 py-2 font-bold text-amber-950 transition-transform hover:scale-105"
          onClick={() => {
            play('ui');
            setHasVisitedCabin(true);
          }}
        >
          Forstået!
        </button>
      </div>
    </div>
  );
}
