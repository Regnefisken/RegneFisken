import { useAudio } from '../../audio/useAudio';
import { useUIStore } from '../../store/useUIStore';

export function ResetConfirm() {
  const { play } = useAudio();
  const show = useUIStore((s) => s.showResetConfirm);
  const setShow = useUIStore((s) => s.setShowResetConfirm);

  if (!show) return null;

  return (
    <div className="absolute inset-0 z-[65] flex items-center justify-center bg-black/70 p-4">
      <div className="panel-shop max-w-sm rounded-2xl border border-red-900/50 p-6 text-center shadow-xl">
        <p className="mb-4 font-bold text-white">Nulstil fremskridt?</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              play('ui');
              setShow(false);
            }}
            className="flex-1 rounded-xl bg-slate-700 py-2 font-bold text-white"
          >
            Annuller
          </button>
          <button
            type="button"
            onClick={() => {
              play('ui');
              setShow(false);
            }}
            className="flex-1 rounded-xl bg-red-600 py-2 font-bold text-white"
          >
            Bekræft
          </button>
        </div>
      </div>
    </div>
  );
}
