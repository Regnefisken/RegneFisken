import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/useGameStore.js';
import { useUIStore } from '../../store/useUIStore.js';
import { jungleTouchInput } from '../../three/jungleTouchInput.js';

const JOYSTICK_SIZE = 128;
const JOYSTICK_MAX = 44;
const THUMB_VIS = 28;

/** Virtual joystick — venstre bund; kamera-drag på højre halvdel. Kun mobil + jungle (ikke under jungle-fiskeri). */
export function JungleTouchControls() {
  const uiMode = useUIStore((s) => s.uiMode);
  const currentLocation = useGameStore((s) => s.currentLocation);
  const jungleFishing = useGameStore((s) => s.jungleFishing);

  const [thumb, setThumb] = useState({ x: 0, y: 0 });
  const joyActive = useRef(false);
  const joyOrigin = useRef({ x: 0, y: 0 });
  const lookId = useRef<number | null>(null);
  const lookLast = useRef({ x: 0, y: 0 });

  const updateJoystick = useCallback((clientX: number, clientY: number) => {
    const dx = clientX - joyOrigin.current.x;
    const dy = clientY - joyOrigin.current.y;
    const len = Math.hypot(dx, dy);
    const scale = len > JOYSTICK_MAX ? JOYSTICK_MAX / len : 1;
    const sdx = dx * scale;
    const sdy = dy * scale;
    jungleTouchInput.move.x = Math.max(-1, Math.min(1, sdx / JOYSTICK_MAX));
    jungleTouchInput.move.y = Math.max(-1, Math.min(1, -sdy / JOYSTICK_MAX));
    setThumb({ x: (sdx / JOYSTICK_MAX) * THUMB_VIS, y: (-sdy / JOYSTICK_MAX) * THUMB_VIS });
  }, []);

  const endJoystick = useCallback(() => {
    joyActive.current = false;
    jungleTouchInput.move.x = 0;
    jungleTouchInput.move.y = 0;
    setThumb({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const onPointerUp = () => {
      endJoystick();
    };
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [endJoystick]);

  const onJoyPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    joyActive.current = true;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    joyOrigin.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    updateJoystick(e.clientX, e.clientY);
  };

  const onJoyPointerMove = (e: React.PointerEvent) => {
    if (!joyActive.current) return;
    e.preventDefault();
    updateJoystick(e.clientX, e.clientY);
  };

  const onLookTouchStart = (e: React.TouchEvent) => {
    if (lookId.current !== null) return;
    const t = e.changedTouches[0];
    lookId.current = t.identifier;
    lookLast.current = { x: t.clientX, y: t.clientY };
  };

  const onLookTouchMove = (e: React.TouchEvent) => {
    if (lookId.current === null) return;
    const t = Array.from(e.changedTouches).find((x) => x.identifier === lookId.current);
    if (!t) return;
    const dx = t.clientX - lookLast.current.x;
    const dy = t.clientY - lookLast.current.y;
    lookLast.current = { x: t.clientX, y: t.clientY };
    jungleTouchInput.look.dx += dx;
    jungleTouchInput.look.dy += dy;
    e.preventDefault();
  };

  const onLookTouchEnd = (e: React.TouchEvent) => {
    for (const c of Array.from(e.changedTouches)) {
      if (c.identifier === lookId.current) {
        lookId.current = null;
        break;
      }
    }
  };

  if (uiMode !== 'mobile' || currentLocation !== 'jungle_island' || jungleFishing) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[24]">
      <div
        className="pointer-events-auto absolute top-0 right-0 h-full w-1/2 touch-none select-none"
        style={{ touchAction: 'none' }}
        onTouchStart={onLookTouchStart}
        onTouchMove={onLookTouchMove}
        onTouchEnd={onLookTouchEnd}
        aria-hidden
      />
      <div
        className="pointer-events-auto absolute bottom-6 left-6 flex touch-manipulation items-center justify-center rounded-full border border-white/25 bg-black/35"
        style={{
          width: JOYSTICK_SIZE,
          height: JOYSTICK_SIZE,
          touchAction: 'none',
        }}
        onPointerDown={onJoyPointerDown}
        onPointerMove={onJoyPointerMove}
        role="presentation"
      >
        <div
          className="h-12 w-12 rounded-full bg-white/35 shadow-md"
          style={{
            transform: `translate(${thumb.x}px, ${thumb.y}px)`,
          }}
        />
      </div>
    </div>
  );
}
