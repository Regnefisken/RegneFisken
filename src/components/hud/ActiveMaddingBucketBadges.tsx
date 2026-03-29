import { useEffect, useState } from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';

/** Kompakte aktive-madding-rækker (ikon + ramme) — som legacy under spand. */
export function ActiveMaddingBucketBadges() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 4000);
    return () => window.clearInterval(id);
  }, []);

  const activeBait = usePlayerStore((s) => s.activeBait);
  const questItems = usePlayerStore((s) => s.questItems);
  const conchBaitExpiry = usePlayerStore((s) => s.conchBaitExpiry);
  const fossilBaitExpiry = usePlayerStore((s) => s.fossilBaitExpiry);
  const flyBaitExpiry = usePlayerStore((s) => s.flyBaitExpiry);
  const hajBloodExpiry = usePlayerStore((s) => s.hajBloodExpiry);
  const perleLimExpiry = usePlayerStore((s) => s.perleLimExpiry);
  const koedklumpActive = usePlayerStore((s) => s.koedklumpActive);
  const hvalbofActive = usePlayerStore((s) => s.hvalbofActive);
  const eggCountdown = usePlayerStore((s) => s.eggCountdown);

  type MaddingRow = {
    key: string;
    icon: string;
    label: string;
    color: string;
    border: string;
    bg: string;
    rightIcon?: string;
  };

  const activeMadding: MaddingRow[] = [];
  if (activeBait === 'bait' || questItems.includes('bait')) {
    activeMadding.push({
      key: 'bait',
      icon: '🎣',
      label: 'Mystisk Madding',
      color: '#4ade80',
      border: '#22c55e',
      bg: 'rgba(5,40,20,0.95)',
    });
  }
  if (activeBait === 'legendary_bait') {
    activeMadding.push({
      key: 'legbait',
      icon: '🌈',
      label: 'Legendarisk',
      color: '#fbbf24',
      border: '#f59e0b',
      bg: 'rgba(30,15,0,0.95)',
    });
  }
  if (now < conchBaitExpiry) {
    activeMadding.push({
      key: 'conchbait',
      icon: '🍯',
      label: `Sød · ${Math.ceil((conchBaitExpiry - now) / 60000)}m`,
      color: '#fbcfe8',
      border: '#f472b6',
      bg: 'rgba(50,20,40,0.95)',
    });
  }
  if (now < fossilBaitExpiry) {
    activeMadding.push({
      key: 'fossilbait',
      icon: '🌑',
      label: `Slam · ${Math.ceil((fossilBaitExpiry - now) / 60000)}m`,
      color: '#e7e5e4',
      border: '#a8a29e',
      bg: 'rgba(30,30,30,0.95)',
    });
  }
  if (now < flyBaitExpiry) {
    activeMadding.push({
      key: 'flybait',
      icon: '🪰',
      label: `Flue · ${Math.ceil((flyBaitExpiry - now) / 60000)}m`,
      color: '#a3e635',
      border: '#65a30d',
      bg: 'rgba(30,50,25,0.95)',
    });
  }
  if (now < hajBloodExpiry) {
    activeMadding.push({
      key: 'hajblood',
      icon: '🩸',
      label: `Hajblod · ${Math.ceil((hajBloodExpiry - now) / 60000)}m`,
      color: '#fca5a5',
      border: '#f87171',
      bg: 'rgba(185,28,28,0.95)',
    });
  }
  if (now < perleLimExpiry) {
    activeMadding.push({
      key: 'perlelim',
      icon: '🦪',
      label: `Perlelim · ${Math.ceil((perleLimExpiry - now) / 60000)}m`,
      color: '#e0bbff',
      border: '#c084fc',
      bg: 'rgba(147,51,234,0.95)',
    });
  }
  if (koedklumpActive) {
    activeMadding.push({
      key: 'koedklump',
      icon: '🍖',
      label: 'Klistret Kødklump',
      color: '#fbbf24',
      border: '#b45309',
      bg: 'rgba(60,30,10,0.95)',
    });
  }
  if (hvalbofActive) {
    activeMadding.push({
      key: 'hvalbof',
      icon: '🥩',
      label: 'Kæmpe Hvalbøf',
      color: '#c084fc',
      border: '#7c3aed',
      bg: 'rgba(30,10,50,0.95)',
    });
  }
  if (questItems.includes('turtle_egg') && !questItems.includes('turtle_hatched')) {
    activeMadding.push({
      key: 'egg',
      icon: '🥚',
      rightIcon: '⏳',
      label: eggCountdown || '...',
      color: '#fde68a',
      border: 'rgba(180,150,80,0.5)',
      bg: 'rgba(50,40,10,0.85)',
    });
  }

  if (activeMadding.length === 0) return null;

  return (
    <div className="pointer-events-none mt-1 flex w-full flex-col gap-1">
      {activeMadding.map((m) => (
        <div
          key={m.key}
          className="flex w-full items-center rounded-xl border px-2.5 py-1.5 text-xs font-bold"
          style={{
            background: m.bg,
            borderColor: m.border,
            boxShadow: `0 0 10px ${m.border}55`,
            animation: 'baitPulse 2s ease-in-out infinite',
            gap: m.rightIcon ? 0 : '0.5rem',
          }}
        >
          <span className="shrink-0 text-base">{m.icon}</span>
          <span
            className={m.rightIcon ? 'flex-1 text-center' : undefined}
            style={{ color: m.color }}
          >
            {m.label}
          </span>
          {m.rightIcon && <span className="shrink-0 text-base">{m.rightIcon}</span>}
        </div>
      ))}
    </div>
  );
}
