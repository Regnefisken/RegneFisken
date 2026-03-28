import { useEffect } from 'react';
import { useAudio } from '../../audio/useAudio';
import type { WishId } from '../../store/useCollectionStore';
import { useCollectionStore } from '../../store/useCollectionStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUIStore } from '../../store/useUIStore';

const WISH_ICON: Record<WishId, string> = {
  friend: '🐵',
  love: '❤️',
  wealth: '💰',
};

export function WishModal() {
  const { play } = useAudio();
  const show = useCollectionStore((s) => s.showWishModal);
  const setShow = useCollectionStore((s) => s.setShowWishModal);
  const options = useCollectionStore((s) => s.wishOptions);
  const usedWishes = useCollectionStore((s) => s.usedWishes);
  const setUsedWishes = useCollectionStore((s) => s.setUsedWishes);
  const helleflynderCaught = useCollectionStore((s) => s.helleflynderCaught);
  const setUnlockedCompanions = useCollectionStore((s) => s.setUnlockedCompanions);

  const setToastMessage = useUIStore((s) => s.setToastMessage);
  const setXpToast = useUIStore((s) => s.setXpToast);

  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        play('ui');
        setShow(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [show, play, setShow]);

  function chooseWish(id: WishId) {
    setUsedWishes((prev) => (prev.includes(id) ? prev : [...prev, id]));

    if (id === 'wealth') {
      usePlayerStore.getState().setCoins((c) => c + 1000);
      setXpToast('+1000 kroner! 💰');
      play('coin');
      setToastMessage('💰 Helleflynderen opfyldte dit rigdomsønske! +1.000 kroner!');
    } else if (id === 'friend') {
      useCollectionStore.getState().setHasMonkeyOnPier(true);
      setUnlockedCompanions((prev) => [...new Set([...prev, 'monkey'])]);
      setToastMessage('🐵 Du har fået abe-vennen som matematik-hjælper!');
      play('win');
    } else if (id === 'love') {
      useCollectionStore.getState().setHasHeartBalloon(true);
      useCollectionStore.getState().setBalloonPopped(false);
      useCollectionStore.getState().setBalloonCurrentHideout('pier');
      setToastMessage('❤️ Helleflynderen gav dig kærlighed! En hjerteballon dukker op 🎈');
      play('win');
    }

    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[10050] flex items-center justify-center p-4"
      style={{
        animation: 'fadeInZoom 0.4s ease-out',
        background: 'rgba(0,0,0,0.45)',
      }}
    >
      <div
        className="max-h-[90dvh] w-[92%] max-w-[460px] overflow-y-auto rounded-[1.75rem] p-8 text-center shadow-2xl"
        style={{
          background: 'linear-gradient(160deg, #0a0a1f 0%, #1a1040 60%, #0f0a00 100%)',
          border: '2px solid rgba(222,184,135,0.5)',
          boxShadow:
            '0 0 60px rgba(222,184,135,0.2), 0 25px 60px rgba(0,0,0,0.8)',
        }}
      >
        <div
          className="mb-2 text-[4rem] leading-none"
          style={{ filter: 'drop-shadow(0 0 20px rgba(222,184,135,0.8))' }}
        >
          🐟✨
        </div>
        <div
          className="mb-2 font-black tracking-[0.2em] text-[0.75rem] text-[#DEB887] uppercase"
          style={{ fontWeight: 900 }}
        >
          Helleflynderens gave
        </div>
        <h2 className="mb-2 text-[1.75rem] font-black text-[#fef3c7]">Vælg dit ønske</h2>
        <p className="mb-7 text-[0.85rem] text-[#9ca3af]">
          Fanget {helleflynderCaught}/3 gange.{' '}
          {helleflynderCaught < 3
            ? 'Fang den igen for et nyt ønske.'
            : '✨ Det var den sidste gang — tak for fisketuren!'}
        </p>

        <div className="flex flex-col gap-3 text-left">
          {options.map((wish) => {
            const parts = wish.label.trim().split(/\s+/);
            const emoji = parts[0] ?? '';
            const titleRest = parts.slice(1).join(' ');
            return (
              <button
                key={wish.id}
                type="button"
                onClick={() => chooseWish(wish.id)}
                className="flex cursor-pointer items-start gap-4 rounded-[0.875rem] border p-4 text-[1rem] font-bold text-[#fef3c7] transition hover:scale-[1.02]"
                style={{
                  background: 'rgba(222,184,135,0.08)',
                  borderColor: 'rgba(222,184,135,0.3)',
                }}
              >
                <span className="shrink-0 text-[2rem] leading-none">{emoji}</span>
                <div>
                  <div className="mb-0.5 text-[1.05rem] font-black">{titleRest}</div>
                  <div className="text-[0.8rem] font-normal text-[#9ca3af]">{wish.description}</div>
                </div>
              </button>
            );
          })}
          {options.length === 0 && (
            <div className="py-4 text-center text-[#6b7280] italic">
              Du har allerede brugt alle ønsker. Tak for 3 fangster!
            </div>
          )}
        </div>

        {usedWishes.length > 0 && (
          <div
            className="mt-5 rounded-xl border p-3"
            style={{
              background: 'rgba(0,0,0,0.3)',
              borderColor: 'rgba(255,255,255,0.06)',
            }}
          >
            <div
              className="mb-2 text-[0.72rem] tracking-[0.1em] text-[#6b7280] uppercase"
              style={{ fontWeight: 700 }}
            >
              Brugte ønsker
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {usedWishes.map((id) => (
                <span key={id} className="text-[1.25rem] opacity-50 line-through">
                  {WISH_ICON[id]}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
