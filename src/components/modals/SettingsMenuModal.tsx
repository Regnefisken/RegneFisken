import type { CSSProperties } from 'react';
import { useAudio } from '../../audio/useAudio';
import { useMathStore } from '../../store/useMathStore';
import { useTeacherStore } from '../../store/useTeacherStore.js';
import { useUIStore } from '../../store/useUIStore';

/** Legacy: legacy-game.html showSettingsMenu — hub før Skærmindstillinger, Credits, m.m. */
export function SettingsMenuModal() {
  const show = useUIStore((s) => s.showSettingsMenu);
  const setShowSettingsMenu = useUIStore((s) => s.setShowSettingsMenu);
  const setShowScreenSettings = useUIStore((s) => s.setShowScreenSettings);
  const setShowCreditsOverlay = useUIStore((s) => s.setShowCreditsOverlay);
  const setShowAboutModal = useUIStore((s) => s.setShowAboutModal);
  const setShowResetConfirm = useUIStore((s) => s.setShowResetConfirm);
  const setShowMathSettings = useMathStore((s) => s.setShowMathSettings);
  const setShowTeacherDashboard = useUIStore((s) => s.setShowTeacherDashboard);
  const hideMathSettingsEntry = useTeacherStore((s) => s.hideMathSettingsEntry);
  const { play } = useAudio();

  if (!show) return null;

  function close() {
    play('ui');
    setShowSettingsMenu(false);
  }

  const items: {
    label: string;
    icon: string;
    style: CSSProperties;
    onClick?: () => void;
  }[] = [
    {
      label: 'Skærmindstillinger',
      icon: '🖥️',
      style: {
        background: 'rgba(56,189,248,0.12)',
        border: '1px solid rgba(56,189,248,0.35)',
        color: '#7dd3fc',
      },
      onClick: () => {
        play('ui');
        setShowSettingsMenu(false);
        setShowScreenSettings(true);
      },
    },
    {
      label: 'Credits',
      icon: '🏆',
      style: {
        background: 'rgba(234,179,8,0.15)',
        border: '1px solid rgba(234,179,8,0.4)',
        color: '#fde68a',
      },
      onClick: () => {
        play('win');
        setShowSettingsMenu(false);
        setShowCreditsOverlay(true);
      },
    },
    {
      label: 'Matematik',
      icon: '🧮',
      style: {
        background: 'rgba(79,70,229,0.15)',
        border: '1px solid rgba(79,70,229,0.5)',
        color: '#c4b5fd',
      },
      onClick: () => {
        play('ui');
        setShowSettingsMenu(false);
        setShowMathSettings(true);
      },
    },
    {
      label: 'Lærerdashboard',
      icon: '👨‍🏫',
      style: {
        background: 'rgba(16,185,129,0.12)',
        border: '1px solid rgba(16,185,129,0.4)',
        color: '#6ee7b7',
      },
      onClick: () => {
        play('ui');
        setShowSettingsMenu(false);
        setShowTeacherDashboard(true);
      },
    },
    {
      label: 'Om spillet',
      icon: '❓',
      style: {
        background: 'rgba(56,189,248,0.15)',
        border: '1px solid rgba(56,189,248,0.4)',
        color: '#bae6fd',
      },
      onClick: () => {
        play('ui');
        setShowSettingsMenu(false);
        setShowAboutModal(true);
      },
    },
    {
      label: 'Nulstil save (taber progress)',
      icon: '↺',
      style: {
        background: 'rgba(220,38,38,0.15)',
        border: '1px solid rgba(220,38,38,0.35)',
        color: '#fca5a5',
      },
      onClick: () => {
        setShowSettingsMenu(false);
        setShowResetConfirm(true);
      },
    },
  ];

  const visibleItems = hideMathSettingsEntry
    ? items.filter((item) => item.label !== 'Matematik')
    : items;

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[99998] flex items-center justify-center bg-black/75 backdrop-blur-[8px]"
      style={{ WebkitBackdropFilter: 'blur(8px)' }}
      onClick={close}
      onKeyDown={(e) => e.key === 'Escape' && close()}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal
        aria-labelledby="settings-menu-title"
        className="anim-slide-in-up w-[90%] max-w-[22rem] rounded-3xl border-2 border-white/[0.15] p-8 shadow-2xl"
        style={{
          background: 'rgba(15,23,42,0.97)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h3 id="settings-menu-title" className="text-xl font-black text-white">
            ⚙️ Indstillinger
          </h3>
          <button
            type="button"
            onClick={close}
            className="cursor-pointer border-none bg-transparent text-2xl leading-none text-slate-400"
          >
            ✕
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {visibleItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl py-[0.85rem] pr-4 pl-4 text-left text-[0.95rem] font-bold"
              style={item.style}
            >
              <span className="text-[1.1rem]" aria-hidden>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
