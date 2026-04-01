import { useAudio } from '../../audio/useAudio';
import { useUIStore } from '../../store/useUIStore';
import { requestGameCanvasPointerLock } from '../../utils/requestGameCanvasPointerLock';

export function JunglePirateWelcomeModal() {
  const show = useUIStore((s) => s.showJunglePirateDialog);
  const setShow = useUIStore((s) => s.setShowJunglePirateDialog);
  const { play } = useAudio();

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="jungle-pirate-welcome-title"
      className="pointer-events-auto fixed inset-0 z-[99998] flex animate-[fadeInZoom_0.4s_ease-out] items-center justify-center bg-black/88 backdrop-blur-[12px]"
      style={{ WebkitBackdropFilter: 'blur(12px)' }}
      onClick={() => {
        setShow(false);
        requestGameCanvasPointerLock();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          setShow(false);
          requestGameCanvasPointerLock();
        }
      }}
    >
      <div
        className="w-[92%] max-w-[480px] rounded-[1.75rem] border-2 border-[rgba(88,28,135,0.55)] p-8 text-center shadow-[0_0_80px_rgba(88,28,135,0.22),0_25px_60px_rgba(0,0,0,0.75)]"
        style={{
          background: 'linear-gradient(165deg, #0f0518 0%, #1a0a28 45%, #0a0612 100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 text-[4rem] leading-none">🏴‍☠️</div>
        <div className="mb-2 text-[0.75rem] font-black tracking-[0.2em] text-amber-400/95 uppercase">
          Kaptajn Rotteskæg
        </div>
        <h2
          id="jungle-pirate-welcome-title"
          className="mb-4 text-[1.5rem] leading-snug font-black text-amber-50"
        >
          Velkommen til Jungleøen!
        </h2>
        <p className="mb-7 text-[0.9rem] leading-relaxed text-gray-300">
          Aaarr! Velkommen, matros! Denne ø er fuld af mysterier og sjældne fisk. Pas på — junglen gemmer
          mange hemmeligheder...
        </p>
        <button
          type="button"
          className="w-full cursor-pointer rounded-[0.875rem] border-0 border-b-4 border-[#5c3d0a] bg-gradient-to-br from-amber-900 to-amber-700 py-4 text-[1.05rem] font-black text-amber-50 transition-transform hover:scale-[1.02]"
          onClick={() => {
            play('ui');
            setShow(false);
            requestGameCanvasPointerLock();
          }}
        >
          🏴‍☠️ Tak, kaptajn!
        </button>
      </div>
    </div>
  );
}
