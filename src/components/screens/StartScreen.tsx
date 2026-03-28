import { useAudio } from '../../audio/useAudio';
import { useFullscreen } from '../../hooks/useFullscreen';
import { autoDetectGraphics } from '../../logic/auto-detect-graphics';
import { useUIStore } from '../../store/useUIStore';

const cornerBtnBase =
  'touch-manipulation cursor-pointer select-none rounded-xl border px-3 py-2 text-lg leading-none transition-all hover:scale-110 active:scale-95';

export function StartScreen() {
  const { play } = useAudio();
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
  const isFadingOut = useUIStore((s) => s.isFadingOut);
  const setIsFadingOut = useUIStore((s) => s.setIsFadingOut);
  const setHasStarted = useUIStore((s) => s.setHasStarted);
  const setShowContactModal = useUIStore((s) => s.setShowContactModal);
  const setShowSettingsMenu = useUIStore((s) => s.setShowSettingsMenu);
  const isMuted = useUIStore((s) => s.isMuted);
  const setIsMuted = useUIStore((s) => s.setIsMuted);
  const uiHidden = useUIStore((s) => s.uiHidden);
  const setUiHidden = useUIStore((s) => s.setUiHidden);

  function handleStartGame() {
    play('ui');
    const isSmallScreen = window.innerWidth <= 1024 || window.innerHeight <= 800;
    useUIStore.getState().setUiMode(isSmallScreen ? 'mobile' : 'desktop');

    if (!useUIStore.getState().graphicsAutoDetected) {
      const result = autoDetectGraphics();
      useUIStore.getState().setGraphicsQuality(result.quality);
      useUIStore.getState().setPmremExposure(result.exposure);
      if (typeof window !== 'undefined') {
        (window as unknown as { pmremExposure?: number }).pmremExposure = result.exposure;
      }
      useUIStore.getState().setGraphicsAutoDetected(true);
    }

    setIsFadingOut(true);
    window.setTimeout(() => {
      setHasStarted(true);
      setIsFadingOut(false);
    }, 600);
  }

  return (
    <div
      className={`absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden transition-opacity duration-600 ${
        isFadingOut ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
      style={{ transition: 'opacity 0.6s ease' }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, #38bdf8 0%, #0ea5e9 35%, #0369a1 60%, #075985 72%, #c2a46e 80%, #e2c97e 88%, #f0d9a0 100%)',
        }}
      />

      <div className="cloud1 absolute top-[6%] left-0" style={{ pointerEvents: 'none', zIndex: 2 }}>
        <div
          style={{
            width: 180,
            height: 55,
            background: 'rgba(255,255,255,0.88)',
            borderRadius: 40,
            position: 'relative',
          }}
        >
          <div
            style={{
              width: 80,
              height: 50,
              background: 'rgba(255,255,255,0.88)',
              borderRadius: 40,
              position: 'absolute',
              top: -22,
              left: 30,
            }}
          />
          <div
            style={{
              width: 60,
              height: 40,
              background: 'rgba(255,255,255,0.88)',
              borderRadius: 40,
              position: 'absolute',
              top: -16,
              left: 80,
            }}
          />
        </div>
      </div>
      <div className="cloud2 absolute top-[13%] left-0" style={{ pointerEvents: 'none', zIndex: 2 }}>
        <div
          style={{
            width: 140,
            height: 42,
            background: 'rgba(255,255,255,0.75)',
            borderRadius: 40,
            position: 'relative',
          }}
        >
          <div
            style={{
              width: 70,
              height: 45,
              background: 'rgba(255,255,255,0.75)',
              borderRadius: 40,
              position: 'absolute',
              top: -20,
              left: 20,
            }}
          />
        </div>
      </div>
      <div
        className="cloud3 absolute top-[4%] left-0"
        style={{ pointerEvents: 'none', marginLeft: '40vw', zIndex: 2 }}
      >
        <div
          style={{
            width: 110,
            height: 35,
            background: 'rgba(255,255,255,0.65)',
            borderRadius: 40,
            position: 'relative',
          }}
        >
          <div
            style={{
              width: 55,
              height: 38,
              background: 'rgba(255,255,255,0.65)',
              borderRadius: 40,
              position: 'absolute',
              top: -16,
              left: 18,
            }}
          />
        </div>
      </div>

      <div
        className="absolute"
        style={{
          top: '7%',
          right: '12%',
          width: 70,
          height: 70,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #fef08a 30%, #fde047 70%, #facc15 100%)',
          boxShadow: '0 0 40px 12px rgba(253,224,71,0.5)',
          zIndex: 1,
        }}
      />

      <div
        className="wave-anim absolute right-0 bottom-[18%] left-0 overflow-hidden"
        style={{ height: 60 }}
      >
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
          <path
            d="M0,30 C200,5 400,55 600,30 C800,5 1000,55 1200,30 C1300,17 1380,38 1440,30 L1440,60 L0,60 Z"
            fill="rgba(255,255,255,0.18)"
          />
          <path
            d="M0,40 C180,15 360,60 540,40 C720,15 900,60 1080,40 C1260,20 1360,50 1440,40 L1440,60 L0,60 Z"
            fill="rgba(255,255,255,0.12)"
          />
        </svg>
      </div>

      <div className="fish-jump absolute bottom-[20%] left-[15%]" style={{ fontSize: 40 }}>
        🐟
      </div>
      <div
        className="fish-jump absolute right-[18%] bottom-[22%]"
        style={{ fontSize: 30, animationDelay: '3.5s' }}
      >
        🐠
      </div>

      <div
        className="absolute right-0 bottom-0 left-0"
        style={{
          height: '18%',
          background: 'linear-gradient(to bottom, #e2c97e, #d4b483)',
        }}
      >
        <div className="absolute" style={{ bottom: '30%', left: '8%', fontSize: 28 }}>
          🐚
        </div>
        <div className="absolute" style={{ bottom: '20%', left: '22%', fontSize: 22 }}>
          🦀
        </div>
        <div className="absolute" style={{ bottom: '35%', right: '15%', fontSize: 24 }}>
          ⭐
        </div>
        <div className="absolute" style={{ bottom: '25%', right: '30%', fontSize: 20 }}>
          🐚
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center" style={{ marginTop: '-8vh' }}>
        <h1
          className="start-title flex max-w-[95vw] flex-wrap items-center justify-center gap-2 sm:gap-4 md:gap-5"
          style={{
            fontWeight: 900,
            color: 'white',
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
            lineHeight: 1.05,
            fontFamily: 'Georgia, "Times New Roman", serif',
            willChange: 'transform',
          }}
        >
          <span
            aria-hidden
            style={{
              fontSize: 'clamp(2.2rem, 7vw, 5rem)',
              lineHeight: 1,
              filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.35))',
            }}
          >
            🎣
          </span>
          <span
            style={{
              fontSize: 'clamp(2.0rem, 6.5vw, 6rem)',
              textShadow:
                '0 2px 0 rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.5)',
            }}
          >
            Regnefisken
          </span>
        </h1>

        <p
          className="start-btn text-center"
          style={{
            color: 'rgba(255,255,255,0.92)',
            fontSize: 'clamp(0.85rem, 2.2vw, 1.25rem)',
            fontWeight: 600,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginTop: '0.5rem',
            fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
            textShadow: '0 1px 4px rgba(0,0,0,0.45)',
            animationDelay: '0.7s',
          }}
        >
          Fisk, regnestykker &amp; eventyr
        </p>

        <button
          type="button"
          onClick={handleStartGame}
          className="start-btn"
          style={{
            marginTop: '2.5rem',
            background: 'linear-gradient(to bottom, #4ade80, #16a34a)',
            color: 'white',
            fontSize: 'clamp(1.4rem, 4vw, 2rem)',
            fontWeight: 800,
            padding: '1rem 4rem',
            borderRadius: '2rem',
            border: 'none',
            cursor: 'pointer',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
            boxShadow: '0 8px 0 #14532d, 0 16px 30px rgba(0,0,0,0.35)',
            transform: 'translateY(0)',
            transition: 'transform 0.1s, box-shadow 0.1s',
            animationDelay: '0.9s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 11px 0 #14532d, 0 20px 35px rgba(0,0,0,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 0 #14532d, 0 16px 30px rgba(0,0,0,0.35)';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'translateY(5px)';
            e.currentTarget.style.boxShadow = '0 3px 0 #14532d, 0 8px 15px rgba(0,0,0,0.3)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 0 #14532d, 0 16px 30px rgba(0,0,0,0.35)';
          }}
        >
          🎮 Start
        </button>
      </div>

      {/* Legacy: bund-venstre Menu + Lyd; bund-højre Skjul + Fuld (btn-fullscreen / btn-corner) */}
      <div
        className="pointer-events-auto fixed left-4 z-[9999] flex"
        style={{
          bottom: 'max(1rem, env(safe-area-inset-bottom, 0px))',
          gap: '0.45rem',
        }}
      >
        <button
          type="button"
          className={`${cornerBtnBase} min-w-[3.2rem] text-center backdrop-blur-md`}
          style={{
            background: 'rgba(0,0,0,0.45)',
            borderColor: 'rgba(255,255,255,0.2)',
            color: 'white',
          }}
          title="Menu"
          onClick={() => {
            play('ui');
            setShowSettingsMenu(true);
          }}
        >
          ⚙️
          <span className="mt-0.5 block text-[0.65rem] opacity-75">Menu</span>
        </button>
        <button
          type="button"
          className={`${cornerBtnBase} min-w-[3.2rem] text-center backdrop-blur-md`}
          style={{
            background: isMuted ? 'rgba(239,68,68,0.45)' : 'rgba(0,0,0,0.45)',
            borderColor: isMuted ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.2)',
            color: isMuted ? '#fca5a5' : 'white',
            boxShadow: isMuted ? '0 0 12px rgba(239,68,68,0.4)' : 'none',
          }}
          title={isMuted ? 'Tænd lyd' : 'Sluk lyd'}
          onClick={() => {
            play('ui');
            setIsMuted(!isMuted);
          }}
        >
          {isMuted ? '🔇' : '🔊'}
          <span className="mt-0.5 block text-[0.65rem] opacity-75">{isMuted ? 'Fra' : 'Til'}</span>
        </button>
      </div>

      <button
        type="button"
        className={`${cornerBtnBase} pointer-events-auto fixed z-[9999] min-w-[3.2rem] text-center backdrop-blur-md`}
        style={{
          right: '4.8rem',
          bottom: 'max(1rem, env(safe-area-inset-bottom, 0px))',
          background: uiHidden ? 'rgba(14,116,144,0.7)' : 'rgba(0,0,0,0.45)',
          borderColor: uiHidden ? 'rgba(56,189,248,0.6)' : 'rgba(255,255,255,0.2)',
          color: 'white',
        }}
        title={uiHidden ? 'Vis UI' : 'Skjul UI'}
        onClick={() => {
          play('ui');
          setUiHidden(!uiHidden);
        }}
      >
        {uiHidden ? '👁️' : '🙈'}
        <span className="mt-0.5 block text-[0.65rem] opacity-75">{uiHidden ? 'Vis' : 'Skjul'}</span>
      </button>

      <button
        type="button"
        className={`${cornerBtnBase} pointer-events-auto fixed right-4 z-[9999] min-w-[3.2rem] text-center backdrop-blur-md`}
        style={{
          bottom: 'max(1rem, env(safe-area-inset-bottom, 0px))',
          background: 'rgba(0,0,0,0.45)',
          borderColor: 'rgba(255,255,255,0.2)',
          color: 'white',
        }}
        title={isFullscreen ? 'Afslut fuldskærm (F11)' : 'Fuldskærm (F11)'}
        onClick={() => {
          play('ui');
          toggleFullscreen();
        }}
      >
        {isFullscreen ? '✕' : '⛶'}
        <span className="mt-0.5 block text-[0.65rem] opacity-75">{isFullscreen ? 'Luk' : 'Fuld'}</span>
      </button>

      <div
        className="pointer-events-auto absolute bottom-6 left-1/2 z-10 flex max-w-[min(100vw-2rem,520px)] -translate-x-1/2 flex-col items-center gap-3 px-2"
        style={{ paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <button
          type="button"
          onClick={() => {
            play('ui');
            setShowContactModal(true);
          }}
          className="start-btn flex items-center gap-2 rounded-xl border-2 border-[#78350f] px-6 py-2.5 text-xs font-bold tracking-widest text-amber-50 shadow-md transition-all hover:brightness-110 active:scale-95 md:text-sm"
          style={{
            background: 'linear-gradient(to bottom, #b45309, #92400e)',
            boxShadow: '0 4px 0 #5c2d0a, 0 8px 20px rgba(0,0,0,0.35)',
          }}
        >
          ✉️ Kontakt udvikleren
        </button>
        <div className="text-center text-[11px] font-medium leading-snug tracking-wide text-white/70 md:text-xs">
          © 2026 Anders E. D. Larsen | Alle rettigheder forbeholdt •{' '}
          <span className="text-emerald-300">Gratis nu</span>
        </div>
      </div>
    </div>
  );
}
