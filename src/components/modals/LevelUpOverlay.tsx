import { useEffect } from 'react';
import { useAudio } from '../../audio/useAudio';
import { useUIStore } from '../../store/useUIStore';

export function LevelUpOverlay() {
  const { play } = useAudio();
  const level = useUIStore((s) => s.showLevelUp);
  const setShowLevelUp = useUIStore((s) => s.setShowLevelUp);

  useEffect(() => {
    if (level == null) return;
    play('levelup');
    const t = window.setTimeout(() => setShowLevelUp(null), 1400);
    return () => window.clearTimeout(t);
  }, [level, play, setShowLevelUp]);

  if (level == null) return null;

  const milestone = level === 15 ? '🌊 Dybet venter på dig...' : null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[55] flex flex-col items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
    >
      <div className="anim-levelup text-center">
        <div className="mb-2 text-8xl" style={{ filter: 'drop-shadow(0 0 24px rgba(250,204,21,0.9))' }}>
          ⭐
        </div>
        <div
          className="mb-1 text-2xl font-black tracking-widest text-yellow-300 uppercase"
          style={{ textShadow: '0 0 20px rgba(250,204,21,0.8)' }}
        >
          Level Up!
        </div>
        <div
          className="font-black text-white"
          style={{
            fontSize: '5rem',
            lineHeight: 1,
            textShadow: '0 0 30px rgba(250,204,21,0.6)',
          }}
        >
          {level}
        </div>
        {milestone && (
          <div
            className="mt-4 rounded-full px-6 py-2 text-sm font-bold text-yellow-900"
            style={{ background: 'rgba(250,204,21,0.9)' }}
          >
            {milestone}
          </div>
        )}
      </div>
    </div>
  );
}
