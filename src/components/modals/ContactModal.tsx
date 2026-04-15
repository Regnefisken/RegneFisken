import { useAudio } from '../../audio/useAudio';
import { AppVersionLabel } from '../common/AppVersionLabel';
import { useUIStore } from '../../store/useUIStore';

export function ContactModal() {
  const { play } = useAudio();
  const open = useUIStore((s) => s.showContactModal);
  const setOpen = useUIStore((s) => s.setShowContactModal);

  if (!open) return null;

  function close() {
    play('ui');
    setOpen(false);
  }

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center"
      style={{
        background: 'rgba(0,0,0,0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
      onClick={close}
      role="presentation"
    >
      <div
        className="anim-zoom-in panel-dark w-full max-w-xs rounded-3xl p-8 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-modal-title"
      >
        <div className="mb-6 text-5xl">👋</div>
        <h3 id="contact-modal-title" className="mb-2 text-2xl font-black text-white">
          Kontakt mig
        </h3>
        <p className="mb-8 text-sm text-emerald-300">Jeg svarer hurtigt på mail 😊</p>

        <div className="space-y-6 text-left">
          <div>
            <div className="mb-1 text-xs tracking-widest text-sky-400 uppercase">Navn</div>
            <div className="text-lg font-medium text-white">Anders E. D. Larsen</div>
          </div>
          <div>
            <div className="mb-1 text-xs tracking-widest text-sky-400 uppercase">Email</div>
            <a
              href="mailto:Anderserner@gmail.com"
              className="text-lg font-medium break-all text-emerald-400 hover:underline"
              onClick={() => play('ui')}
            >
              Anderserner@gmail.com
            </a>
          </div>
        </div>

        <AppVersionLabel className="mt-8" />

        <button
          type="button"
          onClick={close}
          className="mt-6 w-full rounded-2xl bg-white/10 py-3.5 font-bold text-white transition-all hover:bg-white/20"
        >
          Luk
        </button>
      </div>
    </div>
  );
}
