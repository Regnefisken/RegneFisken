import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';

const ZOOM_IN_MS = 700;
const ZOOM_OUT_MS = 400;

type Phase = 'idle' | 'zoomIn' | 'playing' | 'zoomOut';

export function AquariumGameOverlay() {
  const currentLocation = useGameStore((s) => s.currentLocation);
  const showAquariumGame = useGameStore((s) => s.showAquariumGame);
  const setShowAquariumGame = useGameStore((s) => s.setShowAquariumGame);

  const [phase, setPhase] = useState<Phase>('idle');
  const [iframeReady, setIframeReady] = useState(false);
  const zoomInTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const zoomOutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finishExit = useCallback(() => {
    setShowAquariumGame(false);
    setPhase('idle');
    setIframeReady(false);
  }, [setShowAquariumGame]);

  useEffect(() => {
    return () => {
      useGameStore.getState().setShowAquariumGame(false);
    };
  }, []);

  useEffect(() => {
    if (currentLocation !== 'cabin_living' && showAquariumGame) {
      setShowAquariumGame(false);
    }
  }, [currentLocation, showAquariumGame, setShowAquariumGame]);

  useEffect(() => {
    if (!showAquariumGame) {
      if (zoomInTimerRef.current) {
        clearTimeout(zoomInTimerRef.current);
        zoomInTimerRef.current = null;
      }
      if (zoomOutTimerRef.current) {
        clearTimeout(zoomOutTimerRef.current);
        zoomOutTimerRef.current = null;
      }
      setPhase('idle');
      setIframeReady(false);
      return;
    }

    setIframeReady(false);
    setPhase('zoomIn');
    zoomInTimerRef.current = setTimeout(() => {
      zoomInTimerRef.current = null;
      setPhase('playing');
    }, ZOOM_IN_MS);

    return () => {
      if (zoomInTimerRef.current) {
        clearTimeout(zoomInTimerRef.current);
        zoomInTimerRef.current = null;
      }
    };
  }, [showAquariumGame]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const t = e.data && typeof e.data === 'object' ? (e.data as { type?: string }).type : null;
      if (t === 'aquarium-ready') setIframeReady(true);
      if (t === 'aquarium-exit') {
        setPhase('zoomOut');
        if (zoomOutTimerRef.current) clearTimeout(zoomOutTimerRef.current);
        zoomOutTimerRef.current = setTimeout(() => {
          zoomOutTimerRef.current = null;
          finishExit();
        }, ZOOM_OUT_MS);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [finishExit]);

  if (currentLocation !== 'cabin_living') return null;
  if (!showAquariumGame && phase === 'idle') return null;

  const showBubbleMask = phase === 'zoomIn' || (phase === 'playing' && !iframeReady);
  const iframeInteractive = phase === 'playing';

  return (
    <div
      className="aquarium-game-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        pointerEvents: 'auto',
      }}
    >
      <iframe
        title="Akvarie"
        src="/minigames/aquarium.html"
        allow="fullscreen"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
          opacity: phase === 'zoomIn' ? 0 : 1,
          transition: `opacity ${phase === 'playing' ? 280 : 0}ms ease-out`,
          pointerEvents: iframeInteractive ? 'auto' : 'none',
        }}
      />
      {(phase === 'zoomIn' || phase === 'zoomOut') && (
        <div
          aria-hidden
          className={
            phase === 'zoomIn' ? 'aquarium-zoom aquarium-zoom--in' : 'aquarium-zoom aquarium-zoom--out'
          }
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background:
              'radial-gradient(ellipse 80% 70% at 50% 45%, rgba(15, 40, 80, 0.15) 0%, rgba(5, 15, 45, 0.92) 55%, rgba(2, 8, 24, 0.98) 100%)',
          }}
        />
      )}
      {showBubbleMask && (
        <div
          className="aquarium-bubble-mask"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background:
              'radial-gradient(ellipse 75% 65% at 50% 48%, rgba(20, 55, 95, 0.35) 0%, rgba(8, 25, 55, 0.85) 50%, rgba(4, 12, 32, 0.95) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div className="aquarium-bubbles" />
          {!iframeReady && phase === 'playing' && (
            <div
              style={{
                position: 'absolute',
                bottom: '18%',
                fontSize: 'clamp(0.85rem, 2.5vw, 1rem)',
                color: 'rgba(200, 230, 255, 0.85)',
                textShadow: '0 1px 8px rgba(0,0,0,0.6)',
              }}
            >
              Indlæser akvariet…
            </div>
          )}
        </div>
      )}
      <style>{`
        @keyframes aquariumZoomIn {
          from {
            opacity: 0.92;
            transform: scale(1.12);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes aquariumZoomOut {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(1.1);
          }
        }
        .aquarium-zoom--in {
          animation: aquariumZoomIn ${ZOOM_IN_MS}ms cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
        }
        .aquarium-zoom--out {
          animation: aquariumZoomOut ${ZOOM_OUT_MS}ms cubic-bezier(0.4, 0, 0.6, 1) forwards;
        }
        .aquarium-bubbles {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }
        .aquarium-bubbles::before,
        .aquarium-bubbles::after {
          content: '';
          position: absolute;
          width: 120%;
          height: 120%;
          left: -10%;
          top: -10%;
          background-image: radial-gradient(
            circle at 20% 30%,
            rgba(255, 255, 255, 0.06) 0,
            transparent 40%
          ),
          radial-gradient(circle at 70% 60%, rgba(180, 220, 255, 0.05) 0, transparent 35%),
          radial-gradient(circle at 40% 80%, rgba(255, 255, 255, 0.04) 0, transparent 30%);
          animation: bubbleDrift 8s ease-in-out infinite;
        }
        .aquarium-bubbles::after {
          animation-delay: -4s;
          opacity: 0.7;
        }
        @keyframes bubbleDrift {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-2%, -3%) scale(1.02);
          }
        }
      `}</style>
    </div>
  );
}
