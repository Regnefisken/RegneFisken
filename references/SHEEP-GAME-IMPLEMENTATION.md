# Implementeringsguide: "Tæl Får" senge-minispil

> **Formål:** Når spilleren klikker på sengen (`bedroom_bed`) i soveværelset — og **ikke** er i furniture-mode — fader skærmen til sort, og et fåretælle-minispil vises som fullscreen-overlay. Spillets lyde mutes. En "Stå op"-knap (samme grafiske stil som klædeskabets "Tilbage til hytten") lukker minispillet.

---

## Ændrede / nye filer

| Fil | Type | Beskrivelse |
|---|---|---|
| `src/store/useGameStore.ts` | Ændring | Tilføj `showSheepGame` state + setter |
| `src/three/cabin/CabinFurnitureDrag.tsx` | Ændring | Tilføj seng-klik blok i `onDown` |
| `src/three/cabin/SheepGameOverlay.tsx` | **Ny fil** | Hele minispil-overlay'et |
| Cabin-layout (monterer `AquariumGameOverlay`) | Ændring | Tilføj `<SheepGameOverlay />` |

Ingen ændringer i `audioEngine.ts`, `cabin-room-travel.ts` eller `WardrobeModal.tsx` — vi genbruger eksisterende systemer direkte.

---

## Trin 1 — State i `useGameStore.ts`

Tilføj et nyt flag efter `showAquariumGame` (linje ~37, ~85, ~144):

### Interface (linje ~37)

```ts
showSheepGame: boolean;
```

### Initial state (linje ~85)

```ts
showSheepGame: false,
```

### Setter (linje ~144)

```ts
setShowSheepGame: (showSheepGame) => set({ showSheepGame }),
```

Mønsteret er identisk med `showAquariumGame` / `setShowAquariumGame`.

---

## Trin 2 — Klik-handling i `CabinFurnitureDrag.tsx`

Tilføj en ny blok i `onDown`-funktionen **efter** aquarium-blokken (linje ~172) og **før** mirror-blokken (linje ~174). Den skal sidde inde i den eksisterende `if (!furnitureModeRef.current && gameStateRef.current === 'idle')` guard.

```ts
// --- Seng → Tæl Får minispil ---
const cabinBed = cabinMovableRoots.current.find(
  (o) => o.userData?.movableType === 'bedroom_bed',
);
if (cabinBed) {
  getNDC(e);
  raycaster.current.setFromCamera(ndc.current, camera);
  const bh = raycaster.current.intersectObject(cabinBed, true);
  if (bh.length > 0) {
    play('ui');
    runCabinOverlayFade(() => {
      useGameStore.getState().setShowSheepGame(true);
    });
    if ('cancelable' in e && e.cancelable) e.preventDefault();
    return;
  }
}
```

### Vigtige detaljer

- Blokken er allerede inde i `if (!furnitureModeRef.current)` — furniture-mode er automatisk udelukket.
- `runCabinOverlayFade` (importeret fra `../../logic/cabin-room-travel.js`) giver den eksisterende fade-til-sort-transition (380 ms), nøjagtigt som spejlet/klædeskabet.
- Sengen er kun synlig hvis `vis('bedroom_bed')` er true, så den kan kun klikkes af spillere der ejer den.

---

## Trin 3 — Ny fil: `SheepGameOverlay.tsx`

**Placering:** `src/three/cabin/SheepGameOverlay.tsx`

Komponenten følger `AquariumGameOverlay`-mønsteret men er simplere (ingen iframe — alt er inline React).

### 3a — Overordnet struktur

```tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useUIStore } from '../../store/useUIStore';
import { stopAmbience } from '../../audio/ambience';

const FADE_IN_MS = 500;
const FADE_OUT_MS = 400;

type Phase = 'idle' | 'fadeIn' | 'playing' | 'fadeOut';

export function SheepGameOverlay() {
  const currentLocation = useGameStore((s) => s.currentLocation);
  const showSheepGame = useGameStore((s) => s.showSheepGame);
  const setShowSheepGame = useGameStore((s) => s.setShowSheepGame);

  const [phase, setPhase] = useState<Phase>('idle');
  // ... (se detaljer nedenfor)
}
```

### 3b — Phase-system

```tsx
// Åbn: showSheepGame → true trigger fadeIn → efter FADE_IN_MS → playing
useEffect(() => {
  if (!showSheepGame) {
    setPhase('idle');
    return;
  }
  setPhase('fadeIn');
  const t = setTimeout(() => setPhase('playing'), FADE_IN_MS);
  return () => clearTimeout(t);
}, [showSheepGame]);

// Luk-funktion (kaldt fra "Stå op"-knappen)
const handleExit = useCallback(() => {
  setPhase('fadeOut');
  setTimeout(() => {
    setShowSheepGame(false);
    setPhase('idle');
  }, FADE_OUT_MS);
}, [setShowSheepGame]);
```

### 3c — "Stå op"-knap (kopierer WardrobeModal stil, linje 278)

```tsx
<button
  type="button"
  aria-label="Stå op"
  onClick={handleExit}
  className="absolute left-[max(0.75rem,env(safe-area-inset-left))] top-[max(0.75rem,env(safe-area-inset-top))] z-10 inline-flex items-center gap-2 rounded-2xl border-2 border-[#e6c12a] bg-[#1a2332] px-4 py-2.5 text-sm font-bold text-[#ffe94a] shadow-[0_4px_14px_rgba(0,0,0,0.45)] transition hover:brightness-110 active:scale-[0.98] md:text-base"
>
  <span className="select-none" aria-hidden>🛏️</span>
  Stå op
</button>
```

Nøjagtigt samme klasser som klædeskabets "Tilbage til hytten"-knap, bare med teksten "Stå op" og 🛏️-emoji i stedet for 🏠.

### 3d — Tælleknap med touch-support

```tsx
const [count, setCount] = useState(0);
const buttonRef = useRef<HTMLButtonElement>(null);

const handleCount = useCallback(() => {
  setCount((c) => c + 1);
  playSoftBlip();  // se 3f
  // Bounce-animation via class toggle
  const btn = buttonRef.current;
  if (btn) {
    btn.classList.remove('animate-bounce-click');
    void btn.offsetWidth; // trigger reflow
    btn.classList.add('animate-bounce-click');
  }
}, []);
```

**Touch-support — vigtigt for mobil:**

```tsx
<button
  ref={buttonRef}
  onPointerDown={(e) => {
    e.preventDefault();  // forhindrer ghost-click
    handleCount();
  }}
  style={{ touchAction: 'manipulation' }}  // fjerner 300ms touch-delay
  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold
             py-4 px-12 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)]
             text-4xl md:text-5xl border-2 border-indigo-400 min-w-[120px]
             select-none"
>
  {count}
</button>
```

`onPointerDown` i stedet for `onClick` giver instant respons på både touch og mus. `touchAction: 'manipulation'` fjerner browser-delay.

### 3e — Canvas-animation (eng, hegn, får, stjerner)

```tsx
const canvasRef = useRef<HTMLCanvasElement>(null);
const animFrameRef = useRef<number>(0);

useEffect(() => {
  if (phase !== 'playing' && phase !== 'fadeIn') return;

  const canvas = canvasRef.current;
  if (!canvas) return;
  const ctx = canvas.getContext('2d')!;

  let width = 0, height = 0, groundY = 0, fenceX = 0;
  let sheepArray: Sheep[] = [];
  let stars: Star[] = [];
  let lastSpawnTime = 0;
  let nextSpawnDelay = 2000;

  function resize() {
    width = canvas!.width = window.innerWidth;
    height = canvas!.height = window.innerHeight;
    groundY = height * 0.7;
    fenceX = width / 2;
    // Generer stjerner
    stars = Array.from({ length: 100 }, () => ({
      x: Math.random() * width,
      y: Math.random() * groundY,
      size: Math.random() * 2,
      opacity: Math.random(),
    }));
  }

  // ... (Sheep-klasse og gameLoop fra den leverede kode)
  // Overfør direkte — logikken er identisk.

  window.addEventListener('resize', resize);
  resize();
  animFrameRef.current = requestAnimationFrame(gameLoop);

  return () => {
    window.removeEventListener('resize', resize);
    cancelAnimationFrame(animFrameRef.current);
  };
}, [phase]);
```

Hele `Sheep`-klassen og `gameLoop`-funktionen fra den leverede HTML overføres 1:1 ind i dette `useEffect`. Canvas renderes i JSX:

```tsx
<canvas ref={canvasRef} className="block w-full h-full" />
```

### 3f — Blødt blip-lyd ved tælle-klik

```tsx
let blipCtx: AudioContext | null = null;

function playSoftBlip() {
  if (!blipCtx) {
    const AC = window.AudioContext
      || (window as any).webkitAudioContext;
    if (!AC) return;
    blipCtx = new AC();
  }
  if (blipCtx.state === 'suspended') blipCtx.resume();

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
```

Lyden er uafhængig af spillets audio-system — den bruger sin egen `AudioContext` og afspilles altid, uanset mute-state.

### 3g — Samlet JSX-layout

```tsx
if (currentLocation !== 'cabin_bedroom') return null;
if (!showSheepGame && phase === 'idle') return null;

const overlayOpacity =
  phase === 'fadeIn' ? 1 :
  phase === 'playing' ? 1 :
  phase === 'fadeOut' ? 0 : 0;

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
    {/* Canvas baggrund */}
    <canvas ref={canvasRef} className="block w-full h-full" />

    {/* UI overlay */}
    <div className="absolute inset-0 flex flex-col items-center justify-start pt-16 z-10 pointer-events-none">
      <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg mb-8">
        Tid til at sove...
      </h1>
      <button /* tælleknap — se 3d */ />
    </div>

    {/* "Stå op"-knap — se 3c */}
    <button /* ... */ />

    {/* Bounce-animation CSS */}
    <style>{`
      @keyframes bounce-click {
        0% { transform: scale(1); }
        30% { transform: scale(0.85); }
        60% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
      .animate-bounce-click {
        animation: bounce-click 0.3s ease-out;
      }
    `}</style>
  </div>
);
```

---

## Trin 4 — Mute spillets lyde

Sæt `isMuted = true` i `useUIStore` når minispillet er aktivt, og gendan den forrige værdi ved lukning.

```tsx
// I SheepGameOverlay:
useEffect(() => {
  if (phase !== 'playing') return;

  const prevMuted = useUIStore.getState().isMuted;
  useUIStore.getState().setIsMuted(true);

  // Stop allerede-afspillende ambience (hav/regn/grotte)
  stopAmbience();

  return () => {
    useUIStore.getState().setIsMuted(prevMuted);
    // Ambience genstarter automatisk via useWeatherEngine
    // når isMuted skifter tilbage til false
  };
}, [phase]);
```

### Hvorfor dette virker

`audioEngine.ts` checker `isMuted()` ved start af enhver lyd:
- `playSoundEffect()` — early return hvis muted
- `startAmbience()` — early return hvis muted
- `startBossAmbience()` / `startCaveAmbience()` — early return hvis muted

`useWeatherEngine.ts` synkroniserer med mute-state og genstarter ambience automatisk når `isMuted` skifter til `false`.

---

## Trin 5 — Monter overlay i komponent-træet

Find den komponent der monterer `<AquariumGameOverlay />` (sandsynligvis cabin-layout eller en fælles wrapper). Tilføj `SheepGameOverlay` ved siden af:

```tsx
import { SheepGameOverlay } from '../cabin/SheepGameOverlay';

// I JSX:
<AquariumGameOverlay />
<SheepGameOverlay />
```

Overlay'et renderes kun betinget — `if (!showSheepGame && phase === 'idle') return null` — så det har ingen performance-cost når det ikke er aktivt.

---

## Trin 6 — Sikkerhedsguard ved lokationsskift

Allerede dækket i komponentens early-return (`currentLocation !== 'cabin_bedroom'`), plus cleanup `useEffect`:

```tsx
useEffect(() => {
  if (currentLocation !== 'cabin_bedroom' && showSheepGame) {
    setShowSheepGame(false);
  }
}, [currentLocation, showSheepGame, setShowSheepGame]);

// + cleanup ved unmount:
useEffect(() => {
  return () => {
    useGameStore.getState().setShowSheepGame(false);
  };
}, []);
```

---

## Opsummering af dataflow

```
Klik på seng (CabinFurnitureDrag)
  │
  ├─ furnitureMode === true?  → drag-logik (eksisterende)
  │
  └─ furnitureMode === false?
      │
      ├─ play('ui')
      ├─ runCabinOverlayFade() → sort fade (380ms)
      │   └─ setShowSheepGame(true)
      │
      └─ SheepGameOverlay renderer:
          ├─ phase: fadeIn (500ms) → playing → fadeOut (400ms)
          ├─ Muter spillets lyde via setIsMuted(true)
          ├─ Canvas: nattehimmel, stjerner, eng, hegn, får
          ├─ Tælleknap med touch-support + blødt blip
          └─ "Stå op"-knap → handleExit → fadeOut → setShowSheepGame(false) → unmute
```
