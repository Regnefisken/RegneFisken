import { useAudio } from '../../audio/useAudio';
import { useGameStore } from '../../store/useGameStore';
import { useCollectionStore } from '../../store/useCollectionStore';

type CabinFirstKind = 'living' | 'kitchen' | 'bedroom';

const COPY: Record<
  CabinFirstKind,
  { title: string; body: string }
> = {
  living: {
    title: 'Velkommen til Hytten! 🎣',
    body: 'Dette er din private fiskehytte! Her er fred og ro, og ingen fisk der forstyrrer dig.\n\nMåske vil der dukke sjove ting op herinde, jo mere du udforsker verdenen?',
  },
  kitchen: {
    title: 'Køkkenet',
    body: 'Et hyggeligt køkken — men her mangler lidt møbler! Kig forbi butikken for at gøre det hjemligt.',
  },
  bedroom: {
    title: 'Soveværelset',
    body: 'Her er stille og roligt — det perfekte sted at slappe af. Men det kunne godt bruge lidt indretning! Kig forbi butikken.',
  },
};

/** Første besøg pr. hytterum — sætter `hasVisitedCabin*` (persist) ved luk. */
export function CabinFirstVisitModal() {
  const { play } = useAudio();
  const currentLocation = useGameStore((s) => s.currentLocation);
  const hasVisitedCabin = useCollectionStore((s) => s.hasVisitedCabin);
  const hasVisitedCabinKitchen = useCollectionStore((s) => s.hasVisitedCabinKitchen);
  const hasVisitedCabinBedroom = useCollectionStore((s) => s.hasVisitedCabinBedroom);
  const setHasVisitedCabin = useCollectionStore((s) => s.setHasVisitedCabin);
  const setHasVisitedCabinKitchen = useCollectionStore((s) => s.setHasVisitedCabinKitchen);
  const setHasVisitedCabinBedroom = useCollectionStore((s) => s.setHasVisitedCabinBedroom);

  let kind: CabinFirstKind | null = null;
  if (currentLocation === 'cabin_living' && !hasVisitedCabin) kind = 'living';
  else if (currentLocation === 'cabin_kitchen' && !hasVisitedCabinKitchen) kind = 'kitchen';
  else if (currentLocation === 'cabin_bedroom' && !hasVisitedCabinBedroom) kind = 'bedroom';

  if (kind === null) return null;

  const { title, body } = COPY[kind];

  function onDismiss() {
    play('ui');
    if (kind === 'living') setHasVisitedCabin(true);
    else if (kind === 'kitchen') setHasVisitedCabinKitchen(true);
    else setHasVisitedCabinBedroom(true);
  }

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[10040] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)' }}
    >
      <div
        className="anim-zoom-in panel-dark mx-4 max-w-sm rounded-3xl border border-amber-500/50 px-8 py-6 text-center shadow-2xl"
        style={{ background: 'rgba(30,15,5,0.98)' }}
      >
        <h2 className="mb-3 text-2xl font-black text-amber-300">{title}</h2>
        <p className="mb-6 whitespace-pre-line text-sm leading-relaxed text-amber-100/90">{body}</p>
        <button
          type="button"
          className="rounded-xl bg-amber-600 px-6 py-2 font-bold text-amber-950 transition-transform hover:scale-105"
          onClick={onDismiss}
        >
          Forstået!
        </button>
      </div>
    </div>
  );
}
