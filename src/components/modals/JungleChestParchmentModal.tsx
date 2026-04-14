import { useAudio } from '../../audio/useAudio';
import { markJungleChestParchmentSeen } from '../../logic/jungle-chest-reveal';
import { useUIStore } from '../../store/useUIStore';
import { requestGameCanvasPointerLock } from '../../utils/requestGameCanvasPointerLock';

export function JungleChestParchmentModal() {
  const show = useUIStore((s) => s.showJungleChestParchmentModal);
  const setShow = useUIStore((s) => s.setShowJungleChestParchmentModal);
  const { play } = useAudio();

  if (!show) return null;

  function closeAndMark() {
    play('ui');
    markJungleChestParchmentSeen();
    setShow(false);
    requestGameCanvasPointerLock();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="jungle-chest-parchment-title"
      className="pointer-events-auto fixed inset-0 z-[99998] flex animate-[fadeInZoom_0.45s_ease-out] items-center justify-center bg-black/90 backdrop-blur-[14px]"
      style={{ WebkitBackdropFilter: 'blur(14px)' }}
      onClick={closeAndMark}
      onKeyDown={(e) => {
        if (e.key === 'Escape') closeAndMark();
      }}
    >
      <div
        className="w-[92%] max-w-[520px] rounded-[1.75rem] border-2 border-amber-700/50 p-8 text-center shadow-[0_0_100px_rgba(180,120,40,0.18),0_28px_70px_rgba(0,0,0,0.85)]"
        style={{
          background:
            'linear-gradient(168deg, #1a1208 0%, #2a1810 38%, #120a06 100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 text-[3.25rem] leading-none">📜</div>
        <h2
          id="jungle-chest-parchment-title"
          className="mb-4 text-[1.55rem] font-black leading-tight text-amber-100"
        >
          Mystisk Pergament
        </h2>
        <p className="mb-4 text-[0.92rem] leading-relaxed text-amber-100/90">
          Rullen er gulnet og knaser let mellem fingrene. Den lugter af salt, tang og fjerne eventyr.
        </p>
        <p className="mb-5 text-[0.92rem] leading-relaxed text-amber-50/88">
          Da du forsigtigt ruller den ud, danser de gamle bogstaver i månelyset – som om de kun vågner,
          når det bliver rigtig mørkt.
        </p>
        <blockquote
          className="mb-7 whitespace-pre-line rounded-2xl border border-amber-600/35 px-5 py-4 text-left text-[0.92rem] italic leading-relaxed text-amber-200/95"
          style={{ background: 'rgba(0,0,0,0.35)' }}
        >
          {`„Skatten er allerede fundet… eller er den?
Løft blikket mod stjernerne når natten falder på!“`}
        </blockquote>
        <button
          type="button"
          className="w-full cursor-pointer rounded-[0.875rem] border-0 border-b-4 border-[#5c3d0a] bg-gradient-to-br from-amber-800 to-amber-600 py-4 text-[1.05rem] font-black text-amber-50 transition-transform hover:scale-[1.02]"
          onClick={closeAndMark}
        >
          📜 Tag pergamentet med
        </button>
      </div>
    </div>
  );
}
