import { useAudio } from '../../audio/useAudio';
import { useUIStore } from '../../store/useUIStore';

export function CollectibleModal() {
  const { play } = useAudio();
  const kind = useUIStore((s) => s.showCollectibleModal);
  const setKind = useUIStore((s) => s.setShowCollectibleModal);

  if (!kind) return null;

  const title =
    kind === 'fossil' ? '🦴 Fossil' : kind === 'conch' ? '🐚 Konkylie' : '💎 Perle';

  return (
    <div className="absolute inset-0 z-[65] flex items-center justify-center bg-black/70 p-4">
      <div className="panel-shop max-w-sm rounded-2xl border border-slate-600 p-6 text-center shadow-xl">
        <h2 className="mb-2 text-xl font-black text-white">{title}</h2>
        <p className="mb-4 text-sm text-slate-400">Samler-dialog åbnes fra spilverdenen i næste fase.</p>
        <button
          type="button"
          onClick={() => {
            play('ui');
            setKind(null);
          }}
          className="w-full rounded-xl bg-emerald-700 py-2 font-bold text-white"
        >
          OK
        </button>
      </div>
    </div>
  );
}
