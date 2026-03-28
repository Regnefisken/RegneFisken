import { useEffect } from 'react';
import { useAudio } from '../../audio/useAudio';
import { SAVE_KEY } from '../../logic/save-load';
import { useUIStore } from '../../store/useUIStore';

/** Legacy: legacy-game.html showResetConfirm — samme layout, tekst og localStorage + reload. */
export function ResetConfirm() {
  const { play } = useAudio();
  const show = useUIStore((s) => s.showResetConfirm);
  const setShow = useUIStore((s) => s.setShowResetConfirm);

  useEffect(() => {
    if (!show) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        play('ui');
        setShow(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [show, play, setShow]);

  if (!show) return null;

  function close() {
    play('ui');
    setShow(false);
  }

  function confirmReset() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      /* ignore */
    }
    window.location.reload();
  }

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-[8px]"
      style={{ WebkitBackdropFilter: 'blur(8px)' }}
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal
        aria-labelledby="reset-confirm-title"
        className="w-[90%] max-w-[22rem] rounded-3xl border-2 border-white/[0.15] p-8 text-center shadow-2xl"
        style={{
          background: 'rgba(15,23,42,0.97)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
        }}
      >
        <div className="mb-4 text-[2.5rem]">⚠️</div>
        <p id="reset-confirm-title" className="mb-7 text-[1.05rem] font-bold leading-[1.5] text-white">
          Er du sikker på at du vil nulstille al din progression?
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={confirmReset}
            className="flex-1 cursor-pointer rounded-xl border-0 border-b-4 border-solid border-b-[#991b1b] bg-[#dc2626] py-3 text-base font-bold text-white"
          >
            Ja
          </button>
          <button
            type="button"
            onClick={close}
            className="flex-1 cursor-pointer rounded-xl border-2 border-white/[0.15] bg-[#1e293b] py-3 text-base font-bold text-slate-400"
          >
            Nej
          </button>
        </div>
      </div>
    </div>
  );
}
