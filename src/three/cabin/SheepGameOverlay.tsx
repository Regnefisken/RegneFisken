import { useCallback, useEffect, useRef, useState } from 'react';
import { stopAmbience } from '../../audio/ambience';
import { useGameStore } from '../../store/useGameStore';
import { useUIStore } from '../../store/useUIStore';

const FADE_IN_MS = 500;
const FADE_OUT_MS = 400;

type Phase = 'idle' | 'fadeIn' | 'playing' | 'fadeOut';

let blipCtx: AudioContext | null = null;

function playSoftBlip() {
  if (!blipCtx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    blipCtx = new AC();
  }
  if (blipCtx.state === 'suspended') void blipCtx.resume();

  const osc = blipCtx.createOscillator();
  const gain = blipCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, blipCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, blipCtx.currentTime + 0.08);
  gain.gain.setValueAtTime(0.08, blipCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, blipCtx.currentTime + 0.12);
  osc.connect(gain).connect(blipCtx.destination);
  osc.start();
  osc.stop(blipCtx.currentTime + 0.12);
}

type Star = {
  x: number;
  y: number;
  size: number;
  base: number;
  twinkle: number;
};

type GrassFlower = {
  x: number;
  y: number;
  petal: string;
  center: string;
  rot: number;
  r: number;
};

const FLOWER_COLOR_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['#f9a8d4', '#fde047'],
  ['#c4b5fd', '#fef9c3'],
  ['#7dd3fc', '#fff1f2'],
  ['#fdba74', '#fef08a'],
  ['#86efac', '#fef08a'],
  ['#fca5a5', '#fef3c7'],
  ['#fcd34d', '#b45309'],
  ['#a5f3fc', '#fef08a'],
  ['#f0abfc', '#fef08a'],
  ['#bef264', '#854d0e'],
];

const SHEEP_EMOJI = '🐑';
/** Voksne får — max. skala (bruges til lams størrelse). */
const ADULT_FONT_BASE = 92;
const ADULT_SCALE_MAX = 1.33;
/** ~30 % lam, ca. 30 % af største fårs pixelstørrelse. */
const LAMB_FRACTION = 0.3;
const LAMB_SIZE_RATIO = 0.3;
/** Fødder lidt nede i græsset foran kanten (px nedad). */
const GRASS_FOOT_SINK_PX = 8;

class SheepEntity {
  x: number;
  y: number;
  vx: number;
  state: 'approach' | 'jump' | 'leave';
  jumpT: number;
  jumpStartX: number;
  readonly groundY: number;
  readonly fenceCenterX: number;
  readonly jumpWidth: number;
  readonly jumpPeak: number;
  readonly jumpDuration: number;
  readonly scale: number;
  readonly fontPx: number;
  readonly isLamb: boolean;
  readonly isBlack: boolean;
  readonly w: number;

  constructor(
    screenW: number,
    groundY: number,
    fenceCenterX: number,
    fencePostH: number,
    jumpWidth: number,
  ) {
    this.w = screenW;
    this.groundY = groundY;
    this.fenceCenterX = fenceCenterX;
    this.jumpWidth = jumpWidth;
    this.isLamb = Math.random() < LAMB_FRACTION;
    if (this.isLamb) {
      const maxAdultPx = ADULT_FONT_BASE * ADULT_SCALE_MAX;
      this.fontPx = Math.round(maxAdultPx * LAMB_SIZE_RATIO * (0.92 + Math.random() * 0.16));
      this.scale = 1;
    } else {
      this.scale = 1.05 + Math.random() * 0.28;
      this.fontPx = Math.round(ADULT_FONT_BASE * this.scale);
    }
    this.isBlack = Math.random() < 0.05;
    /** Fødder skal passere tydeligt over hegntop (rails + stolpe + margin). */
    const railTop = fencePostH * 0.35;
    this.jumpPeak = railTop + this.fontPx * 0.92 + 56;
    this.jumpDuration = 0.88 + Math.random() * 0.14;
    this.x = -100 - Math.random() * 120;
    this.y = groundY;
    const baseVx = 78 + Math.random() * 62;
    this.vx = this.isLamb ? baseVx * 0.88 : baseVx;
    this.state = 'approach';
    this.jumpT = 0;
    this.jumpStartX = 0;
  }

  update(dt: number): boolean {
    if (this.state === 'approach') {
      this.x += this.vx * dt;
      const jumpStart = this.fenceCenterX - this.jumpWidth / 2;
      if (this.x >= jumpStart) {
        this.x = jumpStart;
        this.jumpStartX = jumpStart;
        this.state = 'jump';
        this.jumpT = 0;
      }
    } else if (this.state === 'jump') {
      this.jumpT += dt / this.jumpDuration;
      const t = Math.min(1, this.jumpT);
      this.x = this.jumpStartX + this.jumpWidth * t;
      this.y = this.groundY - this.jumpPeak * Math.sin(Math.PI * t);
      if (t >= 1) {
        this.state = 'leave';
        this.y = this.groundY;
      }
    } else {
      this.x += this.vx * dt;
      if (this.x > this.w + 120) return false;
    }
    return true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const footY = this.y + GRASS_FOOT_SINK_PX;
    ctx.save();
    ctx.translate(this.x, footY);
    ctx.scale(-1, 1);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.font = `${this.fontPx}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
    if (this.isBlack) {
      ctx.filter = 'brightness(0.2) contrast(1.25) saturate(0.35)';
    }
    ctx.fillText(SHEEP_EMOJI, 0, 0);
    ctx.restore();
  }
}

export function SheepGameOverlay() {
  const currentLocation = useGameStore((s) => s.currentLocation);
  const showSheepGame = useGameStore((s) => s.showSheepGame);
  const setShowSheepGame = useGameStore((s) => s.setShowSheepGame);

  const [phase, setPhase] = useState<Phase>('idle');
  const [fadeInReady, setFadeInReady] = useState(false);
  const [count, setCount] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef(0);

  const handleExit = useCallback(() => {
    setPhase('fadeOut');
    setTimeout(() => {
      setShowSheepGame(false);
      setPhase('idle');
    }, FADE_OUT_MS);
  }, [setShowSheepGame]);

  useEffect(() => {
    return () => {
      useGameStore.getState().setShowSheepGame(false);
    };
  }, []);

  useEffect(() => {
    if (currentLocation !== 'cabin_bedroom' && showSheepGame) {
      setShowSheepGame(false);
    }
  }, [currentLocation, showSheepGame, setShowSheepGame]);

  useEffect(() => {
    if (!showSheepGame) {
      setPhase('idle');
      setFadeInReady(false);
      return;
    }
    setPhase('fadeIn');
    setFadeInReady(false);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setFadeInReady(true));
    });
    const t = setTimeout(() => setPhase('playing'), FADE_IN_MS);
    return () => {
      cancelAnimationFrame(id);
      clearTimeout(t);
    };
  }, [showSheepGame]);

  useEffect(() => {
    if (!showSheepGame) setCount(0);
  }, [showSheepGame]);

  useEffect(() => {
    if (phase !== 'playing') return;

    const prevMuted = useUIStore.getState().isMuted;
    useUIStore.getState().setIsMuted(true);
    stopAmbience();

    return () => {
      useUIStore.getState().setIsMuted(prevMuted);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'playing' && phase !== 'fadeIn') return;

    const el = canvasRef.current;
    if (!el) return;
    const c2d = el.getContext('2d');
    if (!c2d) return;
    const surface = el;
    const gctx = c2d;

    let width = 0;
    let height = 0;
    let groundY = 0;
    let fenceX = 0;
    /** Hegnstolper — højere profil. */
    let fencePostH = 0;
    /** Fire lodrette stolper (x-positioner). */
    let postXs: number[] = [];
    /** Vandret distance fåret bruger under hop (centreret om hegnet). */
    let jumpWidth = 0;
    let stars: Star[] = [];
    let flowers: GrassFlower[] = [];
    const sheepList: SheepEntity[] = [];
    let lastSpawnTime = 0;
    let nextSpawnDelay = 2000;
    let lastFrameTs = 0;

    function resize() {
      width = surface.width = window.innerWidth;
      height = surface.height = window.innerHeight;
      groundY = height * 0.72;
      fenceX = width / 2;
      fencePostH = Math.min(groundY * 0.092, 46);
      const gap = Math.min(58, width * 0.072);
      postXs = [-1.5, -0.5, 0.5, 1.5].map((m) => fenceX + m * gap);
      const leftPost = postXs[0]!;
      const rightPost = postXs[3]!;
      jumpWidth = rightPost - leftPost + Math.min(160, width * 0.22);
      sheepList.length = 0;
      stars = Array.from({ length: 110 }, () => ({
        x: Math.random() * width,
        y: Math.random() * groundY * 0.92,
        size: Math.random() * 2.2 + 0.3,
        base: 0.35 + Math.random() * 0.65,
        twinkle: Math.random() * Math.PI * 2,
      }));

      const grassH = height - groundY;
      const padY = Math.max(18, grassH * 0.06);
      flowers = Array.from({ length: 10 }, (_, i) => {
        const [petal, center] = FLOWER_COLOR_PAIRS[i % FLOWER_COLOR_PAIRS.length]!;
        return {
          x: width * (0.06 + Math.random() * 0.88),
          y: groundY + padY + Math.random() * (grassH - padY * 2),
          petal,
          center,
          rot: Math.random() * Math.PI * 2,
          r: 3.5 + Math.random() * 2.8,
        };
      });
    }

    function drawFlowers() {
      for (const f of flowers) {
        gctx.save();
        gctx.translate(f.x, f.y);
        gctx.rotate(f.rot);
        const stemLen = 10 + f.r * 0.4;
        gctx.strokeStyle = 'rgba(22,101,52,0.85)';
        gctx.lineWidth = 1.6;
        gctx.lineCap = 'round';
        gctx.beginPath();
        gctx.moveTo(0, stemLen * 0.35);
        gctx.quadraticCurveTo(f.r * 0.4, stemLen * 0.7, 0, stemLen);
        gctx.stroke();

        const cy = -f.r * 0.35;
        for (let p = 0; p < 5; p++) {
          const a = (p / 5) * Math.PI * 2 - Math.PI / 2;
          const px = Math.cos(a) * f.r * 0.75;
          const py = cy + Math.sin(a) * f.r * 0.75;
          gctx.fillStyle = f.petal;
          gctx.beginPath();
          gctx.arc(px, py, f.r * 0.55, 0, Math.PI * 2);
          gctx.fill();
        }
        gctx.fillStyle = f.center;
        gctx.beginPath();
        gctx.arc(0, cy, f.r * 0.35, 0, Math.PI * 2);
        gctx.fill();
        gctx.restore();
      }
    }

    function drawSky(t: number) {
      const g = gctx.createLinearGradient(0, 0, 0, groundY);
      g.addColorStop(0, '#0a1028');
      g.addColorStop(0.45, '#151a3a');
      g.addColorStop(1, '#1e2548');
      gctx.fillStyle = g;
      gctx.fillRect(0, 0, width, groundY);

      for (const st of stars) {
        const tw = 0.55 + 0.45 * Math.sin(t * 0.0012 + st.twinkle);
        gctx.fillStyle = `rgba(255,255,255,${st.base * tw})`;
        gctx.beginPath();
        gctx.arc(st.x, st.y, st.size, 0, Math.PI * 2);
        gctx.fill();
      }
    }

    function drawGround() {
      const g = gctx.createLinearGradient(0, groundY, 0, height);
      g.addColorStop(0, '#1a4d2e');
      g.addColorStop(0.4, '#2d6b42');
      g.addColorStop(1, '#143822');
      gctx.fillStyle = g;
      gctx.fillRect(0, groundY, width, height - groundY);

      gctx.strokeStyle = 'rgba(0,0,0,0.12)';
      gctx.lineWidth = 1;
      for (let i = 0; i < 40; i++) {
        const gx = (i / 40) * width;
        gctx.beginPath();
        gctx.moveTo(gx, groundY + 4);
        gctx.lineTo(gx + 8, groundY + 18 + (i % 3) * 2);
        gctx.stroke();
      }

      drawFlowers();
    }

    function drawFence() {
      const postH = fencePostH;
      const postW = 7;
      const left = postXs[0]!;
      const right = postXs[3]!;
      const railY1 = groundY - postH * 0.34;
      const railY2 = groundY - postH * 0.62;

      gctx.save();
      gctx.fillStyle = 'rgba(0,0,0,0.2)';
      gctx.beginPath();
      gctx.ellipse(fenceX, groundY + 5, (right - left) * 0.5, 10, 0, 0, Math.PI * 2);
      gctx.fill();

      for (const px of postXs) {
        const grd = gctx.createLinearGradient(px - postW / 2, groundY - postH, px + postW / 2, groundY);
        grd.addColorStop(0, '#c4a882');
        grd.addColorStop(0.45, '#8b6f56');
        grd.addColorStop(1, '#4a3628');
        gctx.fillStyle = grd;
        gctx.fillRect(px - postW / 2, groundY - postH, postW, postH);
        gctx.fillStyle = '#9d8268';
        gctx.beginPath();
        gctx.arc(px, groundY - postH, postW / 2 + 0.5, Math.PI, 0);
        gctx.fill();
        gctx.strokeStyle = 'rgba(255,255,255,0.2)';
        gctx.lineWidth = 1;
        gctx.beginPath();
        gctx.moveTo(px - postW / 2 + 1.5, groundY - 6);
        gctx.lineTo(px - postW / 2 + 1.5, groundY - postH + 6);
        gctx.stroke();
      }

      gctx.strokeStyle = '#4a3528';
      gctx.lineWidth = 5;
      gctx.lineCap = 'round';
      gctx.lineJoin = 'round';
      gctx.beginPath();
      gctx.moveTo(left - 6, railY1);
      gctx.lineTo(right + 6, railY1);
      gctx.moveTo(left - 6, railY2);
      gctx.lineTo(right + 6, railY2);
      gctx.stroke();

      gctx.strokeStyle = 'rgba(255,235,200,0.45)';
      gctx.lineWidth = 1.5;
      gctx.beginPath();
      gctx.moveTo(left - 6, railY1 - 1.5);
      gctx.lineTo(right + 6, railY1 - 1.5);
      gctx.moveTo(left - 6, railY2 - 1.5);
      gctx.lineTo(right + 6, railY2 - 1.5);
      gctx.stroke();

      gctx.strokeStyle = 'rgba(80,60,45,0.55)';
      gctx.lineWidth = 1;
      for (let i = 0; i < postXs.length - 1; i++) {
        const a = postXs[i]!;
        const b = postXs[i + 1]!;
        const mid = (a + b) / 2;
        gctx.beginPath();
        gctx.moveTo(mid - 8, railY2 + 2);
        gctx.lineTo(mid + 8, railY1 - 2);
        gctx.stroke();
      }
      gctx.restore();
    }

    function gameLoop(ts: number) {
      const dt = lastFrameTs ? Math.min(0.045, (ts - lastFrameTs) / 1000) : 1 / 60;
      lastFrameTs = ts;

      drawSky(ts);
      drawGround();
      drawFence();

      if (ts - lastSpawnTime > nextSpawnDelay) {
        sheepList.push(new SheepEntity(width, groundY, fenceX, fencePostH, jumpWidth));
        lastSpawnTime = ts;
        nextSpawnDelay = 1800 + Math.random() * 2200;
      }

      for (let i = sheepList.length - 1; i >= 0; i--) {
        const sh = sheepList[i]!;
        if (!sh.update(dt)) sheepList.splice(i, 1);
        else sh.draw(gctx);
      }

      animFrameRef.current = requestAnimationFrame(gameLoop);
    }

    window.addEventListener('resize', resize);
    resize();
    lastFrameTs = 0;
    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [phase]);

  const handleCount = useCallback(() => {
    setCount((c) => c + 1);
    playSoftBlip();
    const btn = buttonRef.current;
    if (btn) {
      btn.classList.remove('animate-bounce-click');
      void btn.offsetWidth;
      btn.classList.add('animate-bounce-click');
    }
  }, []);

  if (currentLocation !== 'cabin_bedroom') return null;
  if (!showSheepGame && phase === 'idle') return null;

  const overlayOpacity =
    phase === 'fadeOut' || (phase === 'fadeIn' && !fadeInReady) ? 0 : 1;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        pointerEvents: 'auto',
        opacity: overlayOpacity,
        transition: `opacity ${phase === 'fadeIn' ? FADE_IN_MS : FADE_OUT_MS}ms ease`,
      }}
    >
      <canvas ref={canvasRef} className="pointer-events-none block h-full w-full" />

      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-start pt-20">
        <div className="flex w-full max-w-[min(100%,28rem)] flex-col items-center px-4">
          <h1 className="mb-10 w-full translate-x-[0.22em] text-center text-4xl font-bold text-balance text-white drop-shadow-lg md:translate-x-[0.28em] md:text-5xl">
            Tid til at sove...
          </h1>
          <button
            type="button"
            ref={buttonRef}
            onPointerDown={(e) => {
              e.preventDefault();
              handleCount();
            }}
            style={{ touchAction: 'manipulation' }}
            className="pointer-events-auto mt-3 min-w-[144px] rounded-full border-2 border-indigo-400 bg-indigo-600 px-[3.75rem] py-5 text-[2.7rem] font-bold text-white shadow-[0_0_15px_rgba(79,70,229,0.5)] select-none hover:bg-indigo-500 md:mt-4 md:min-w-[168px] md:px-16 md:py-6 md:text-[3.6rem]"
          >
            {count}
          </button>
        </div>
      </div>

      <button
        type="button"
        aria-label="Stå op"
        onClick={handleExit}
        className="absolute top-[max(0.75rem,env(safe-area-inset-top))] left-[max(0.75rem,env(safe-area-inset-left))] z-10 inline-flex items-center gap-2 rounded-2xl border-2 border-[#e6c12a] bg-[#1a2332] px-4 py-2.5 text-sm font-bold text-[#ffe94a] shadow-[0_4px_14px_rgba(0,0,0,0.45)] transition hover:brightness-110 active:scale-[0.98] md:text-base"
      >
        <span className="select-none" aria-hidden>
          🛏️
        </span>
        Stå op
      </button>

      <style>{`
        @keyframes bounce-click {
          0% {
            transform: scale(1);
          }
          30% {
            transform: scale(0.85);
          }
          60% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
        .animate-bounce-click {
          animation: bounce-click 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
