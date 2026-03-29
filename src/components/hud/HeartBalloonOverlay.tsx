import { BALLOON_HIDEOUTS } from '../../data/world.js';
import { useAudio } from '../../audio/useAudio.js';
import { useCollectionStore } from '../../store/useCollectionStore.js';
import { useGameStore } from '../../store/useGameStore.js';
import { useUIStore } from '../../store/useUIStore.js';

/** Legacy ~11967–12004: hjerteballon på skiftende `balloonCurrentHideout`, klik → nyt gemmested. */
export function HeartBalloonOverlay() {
  const { play } = useAudio();
  const currentLocation = useGameStore((s) => s.currentLocation);
  const hasHeartBalloon = useCollectionStore((s) => s.hasHeartBalloon);
  const balloonCurrentHideout = useCollectionStore((s) => s.balloonCurrentHideout);
  const balloonPopped = useCollectionStore((s) => s.balloonPopped);
  const setBalloonPopped = useCollectionStore((s) => s.setBalloonPopped);
  const setBalloonCurrentHideout = useCollectionStore((s) => s.setBalloonCurrentHideout);
  const setToastMessage = useUIStore((s) => s.setToastMessage);
  const setWorldParticleBurst = useUIStore((s) => s.setWorldParticleBurst);

  if (
    !hasHeartBalloon ||
    !balloonCurrentHideout ||
    currentLocation !== balloonCurrentHideout
  ) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed bottom-32 right-16 z-[9980] flex flex-col items-center md:bottom-36 md:right-24"
      style={{ maxWidth: 'min(100vw - 2rem, 28rem)' }}
    >
      {!balloonPopped ? (
        <button
          type="button"
          className="pointer-events-auto flex cursor-pointer flex-col items-center border-0 bg-transparent p-0"
          style={{ animation: 'balloonFloat 3.2s ease-in-out infinite' }}
          title="Pop ballonen – den gemmer sig et nyt sted!"
          onClick={() => {
            play('win');
            setBalloonPopped(true);
            setWorldParticleBurst('confetti');
            window.setTimeout(() => useUIStore.getState().setWorldParticleBurst(null), 900);
            let newHideout: string;
            do {
              newHideout = BALLOON_HIDEOUTS[Math.floor(Math.random() * BALLOON_HIDEOUTS.length)]!;
            } while (newHideout === balloonCurrentHideout);
            window.setTimeout(() => {
              setBalloonCurrentHideout(newHideout);
              setBalloonPopped(false);
            }, 900);
            setToastMessage('🎈 Pop! Ballonen elsker gemmeleg — find den et nyt sted!');
          }}
        >
          <div className="relative" style={{ filter: 'drop-shadow(0 0 14px rgba(255,50,100,0.8))' }}>
            <div className="text-[3.8rem] leading-none">❤️</div>
            <div
              className="pointer-events-none absolute top-[0.4rem] left-[0.9rem] h-[0.45rem] w-[0.7rem] rounded-full bg-white/55"
              style={{ transform: 'rotate(-25deg)' }}
            />
          </div>
          <svg width="24" height="55" className="-mt-1 block overflow-visible" aria-hidden>
            <path
              d="M12,0 Q18,14 10,28 Q4,42 12,55"
              stroke="rgba(255,130,160,0.9)"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
          <div
            className="-mt-0.5 h-[7px] w-[7px] rounded-full border border-[#78350f] bg-[#b45309]"
            aria-hidden
          />
          <div
            className="mt-1 text-[0.6rem] font-extrabold text-[#f9a8d4]"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)', animation: 'pulse 1.4s ease-in-out infinite' }}
          >
            Klik! 💥
          </div>
        </button>
      ) : (
        <div
          className="flex flex-col items-center"
          style={{ animation: 'balloonPop 0.35s ease-out forwards' }}
        >
          <div className="text-[3.5rem]" style={{ filter: 'drop-shadow(0 0 20px rgba(255,200,80,0.9))' }}>
            💥
          </div>
          <div
            className="text-base font-black text-amber-200"
            style={{ animation: 'zoomIn 0.2s ease-out', textShadow: '0 0 8px rgba(255,220,50,0.8)' }}
          >
            POP!
          </div>
        </div>
      )}
    </div>
  );
}
