import { useAudio } from '../../audio/useAudio';
import { RAT_FACTS } from '../../data/world';
import { useCollectionStore } from '../../store/useCollectionStore';

/** Dialog med rotten på molen — som legacy-game.html ~12614–12630. */
export function RatModal() {
  const { play } = useAudio();
  const showRat = useCollectionStore((s) => s.showRat);
  const setShowRat = useCollectionStore((s) => s.setShowRat);
  const ratFactIndex = useCollectionStore((s) => s.ratFactIndex);
  const setRatFactIndex = useCollectionStore((s) => s.setRatFactIndex);

  if (!showRat) return null;

  const fact = RAT_FACTS[ratFactIndex % RAT_FACTS.length] ?? RAT_FACTS[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rat-modal-title"
      className="pointer-events-auto fixed inset-0 z-[99997] flex items-end justify-center bg-black/70 pb-24 backdrop-blur-[8px]"
      onClick={() => setShowRat(false)}
    >
      <div
        className="anim-slide-in-up w-[92%] max-w-[420px] rounded-3xl border-2 border-[rgba(120,100,70,0.5)] bg-[rgba(20,15,10,0.97)] p-7 text-left shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center gap-3.5">
          <div className="shrink-0 text-4xl leading-none">🐀</div>
          <div>
            <div
              id="rat-modal-title"
              className="text-[0.7rem] font-black tracking-[0.15em] text-[#c4a882] uppercase"
            >
              Rotten på molen
            </div>
            <div className="text-[0.7rem] text-[#8b7355]">Fiskeekspert og selvudnævnt faktaformidler</div>
          </div>
        </div>
        <p className="mb-5 text-base leading-relaxed font-normal text-[#e8d5b8] italic">{fact}</p>
        <div className="flex gap-3">
          <button
            type="button"
            className="flex-1 cursor-pointer rounded-xl border border-[rgba(180,140,80,0.3)] bg-[rgba(80,60,30,0.6)] py-2.5 text-[0.85rem] font-bold text-[#d4b896]"
            onClick={() => {
              setRatFactIndex(Math.floor(Math.random() * RAT_FACTS.length));
              play('ui');
            }}
          >
            🎲 En ny fact
          </button>
          <button
            type="button"
            className="flex-1 cursor-pointer rounded-xl border border-white/[0.08] bg-[rgba(30,25,20,0.8)] py-2.5 text-[0.85rem] font-bold text-[#6b7280]"
            onClick={() => {
              play('ui');
              setShowRat(false);
            }}
          >
            Farvel
          </button>
        </div>
      </div>
    </div>
  );
}
