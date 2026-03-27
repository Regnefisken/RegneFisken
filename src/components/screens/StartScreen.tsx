import { useAudio } from '../../audio/useAudio';
import { useUIStore } from '../../store/useUIStore';

export function StartScreen() {
  const { play } = useAudio();
  const isFadingOut = useUIStore((s) => s.isFadingOut);
  const setIsFadingOut = useUIStore((s) => s.setIsFadingOut);
  const setHasStarted = useUIStore((s) => s.setHasStarted);
  const setShowContactModal = useUIStore((s) => s.setShowContactModal);

  function handleStartGame() {
    play('ui');
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
          className="start-title"
          style={{
            fontSize: 'clamp(2.0rem, 6.5vw, 6rem)',
            fontWeight: 900,
            color: 'white',
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
            lineHeight: 1.1,
            fontFamily: 'Georgia, "Times New Roman", serif',
            display: 'inline-block',
            willChange: 'transform',
            whiteSpace: 'nowrap',
            maxWidth: '95vw',
            overflow: 'hidden',
          }}
        >
          🎣 Regnefisken
        </h1>

        <p
          className="start-btn"
          style={{
            color: 'rgba(255,255,255,0.85)',
            fontSize: 'clamp(0.9rem, 2.5vw, 1.3rem)',
            fontWeight: 600,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            marginTop: '0.5rem',
            textShadow: '0 1px 4px rgba(0,0,0,0.4)',
            animationDelay: '0.7s',
          }}
        >
          Fisk, regnestykker & eventyr
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

      <div className="pointer-events-auto absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3">
        <div className="text-center text-[11px] font-medium tracking-wide text-white/70 leading-tight md:text-xs">
          © 2026 Anders E. D. Larsen
          <br />
          Alle rettigheder forbeholdt • <span className="text-emerald-300">Gratis nu</span>
        </div>
        <button
          type="button"
          onClick={() => {
            play('ui');
            setShowContactModal(true);
          }}
          className="btn-glass flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-bold tracking-widest shadow-md transition-all hover:bg-white/10 active:scale-95 md:text-sm"
        >
          ✉️ Kontakt udvikleren
        </button>
      </div>
    </div>
  );
}
