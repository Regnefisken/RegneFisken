import { useAudio } from '../../audio/useAudio';
import { useCollectionStore } from '../../store/useCollectionStore';

export function WishModal() {
  const { play } = useAudio();
  const show = useCollectionStore((s) => s.showWishModal);
  const setShow = useCollectionStore((s) => s.setShowWishModal);
  const options = useCollectionStore((s) => s.wishOptions);

  if (!show) return null;

  return (
    <div className="absolute inset-0 z-[65] flex items-center justify-center bg-black/70 p-4">
      <div className="panel-shop max-w-md rounded-2xl border border-amber-600/40 p-6 shadow-xl">
        <h2 className="mb-3 text-lg font-black text-amber-200">🌟 Ønske</h2>
        <ul className="mb-4 space-y-2 text-sm text-slate-300">
          {options.length === 0 ? (
            <li>Ingen valg lige nu.</li>
          ) : (
            options.map((o) => <li key={o}>• {o}</li>)
          )}
        </ul>
        <button
          type="button"
          onClick={() => {
            play('ui');
            setShow(false);
          }}
          className="w-full rounded-xl bg-slate-700 py-2 font-bold text-white"
        >
          Luk
        </button>
      </div>
    </div>
  );
}
