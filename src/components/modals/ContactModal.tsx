import { useAudio } from '../../audio/useAudio';
import { useUIStore } from '../../store/useUIStore';

export function ContactModal() {
  const { play } = useAudio();
  const open = useUIStore((s) => s.showContactModal);
  const setOpen = useUIStore((s) => s.setShowContactModal);

  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
      onClick={() => {
        play('ui');
        setOpen(false);
      }}
      role="presentation"
    >
      <div
        className="anim-zoom-in panel-shop max-w-md rounded-2xl border border-slate-600 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Kontakt"
      >
        <h2 className="mb-2 text-xl font-black text-white">✉️ Kontakt</h2>
        <p className="mb-4 text-sm text-slate-400">
          Skriv til udvikleren via websitet{' '}
          <a
            href="https://www.regnefisken.dk"
            className="text-emerald-400 underline"
            target="_blank"
            rel="noreferrer"
          >
            regnefisken.dk
          </a>
          .
        </p>
        <button
          type="button"
          onClick={() => {
            play('ui');
            setOpen(false);
          }}
          className="w-full rounded-xl bg-slate-700 py-2 font-bold text-white hover:bg-slate-600"
        >
          Luk
        </button>
      </div>
    </div>
  );
}
