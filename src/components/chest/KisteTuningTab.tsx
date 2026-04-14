import { useMemo } from 'react';
import { computeAdditiveDR, computeAdditiveVR } from '../../logic/catch-engine';
import { getRarityWeights } from '../../logic/rarity';
import { useGameStore } from '../../store/useGameStore';
import { usePlayerStore } from '../../store/usePlayerStore';

export function KisteTuningTab() {
  const upgrades = usePlayerStore((s) => s.upgrades);
  const progression = usePlayerStore((s) => s.progression);
  const conchBaitExpiry = usePlayerStore((s) => s.conchBaitExpiry);
  const flyBaitExpiry = usePlayerStore((s) => s.flyBaitExpiry);
  const hajBloodExpiry = usePlayerStore((s) => s.hajBloodExpiry);
  const perleLimExpiry = usePlayerStore((s) => s.perleLimExpiry);
  const currentLocation = useGameStore((s) => s.currentLocation);

  const now = Date.now();
  const dr = computeAdditiveDR(now, upgrades, conchBaitExpiry, flyBaitExpiry, hajBloodExpiry, perleLimExpiry);
  const vr = computeAdditiveVR(upgrades);
  let xr = 0;
  if (upgrades.includes('luxury_boat')) xr += 15;

  const w = useMemo(
    () => getRarityWeights(progression.level, dr),
    [progression.level, dr]
  );

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-slate-500">
        🔧 Tuning — Held · Rigdom · Erfaring
      </div>
      <div className="grid grid-cols-3 gap-2">
        {(
          [
            ['DR', dr, '#4ade80', '#86efac', 'rgba(74,222,128,0.1)', 'rgba(74,222,128,0.3)', 'Held'],
            ['VR', vr, '#facc15', '#fde047', 'rgba(250,204,21,0.1)', 'rgba(250,204,21,0.3)', 'Rigdom'],
            ['XR', xr, '#a78bfa', '#c4b5fd', 'rgba(167,139,250,0.1)', 'rgba(167,139,250,0.3)', 'Erfaring'],
          ] as const
        ).map(([label, val, col, sub, bg, brd, desc]) => (
          <div
            key={label}
            className="rounded-xl border px-2 py-3 text-center"
            style={{ background: bg, borderColor: brd }}
          >
            <div className="text-2xl font-black" style={{ color: col }}>
              {val}
            </div>
            <div className="text-[0.7rem] font-bold" style={{ color: sub }}>
              {desc}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-slate-500">
        Rarity-vægte (lvl {progression.level}, {String(currentLocation)})
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {(
          [
            ['Common', w.common, '#94a3b8'],
            ['Rare', w.rare, '#3b82f6'],
            ['Legend.', w.legendary, '#a855f7'],
            ['Mystisk', w.mystisk, '#06b6d4'],
          ] as const
        ).map(([label, val, col]) => (
          <div
            key={label}
            className="rounded-lg px-1 py-1.5 text-center"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <div className="text-[0.95rem] font-extrabold" style={{ color: col }}>
              {val.toFixed(1)}
            </div>
            <div className="text-[0.65rem] font-semibold text-slate-500">{label}</div>
          </div>
        ))}
      </div>
      <div className="mt-1 text-[0.68rem] leading-relaxed text-slate-600">
        Held:{' '}
        {[
          upgrades.includes('heldig_firkloever') && '🍀8',
          upgrades.includes('pirate_hat') && '🏴‍☠️5',
          now < conchBaitExpiry && '🍯6',
          now < hajBloodExpiry && '🩸15',
          now < flyBaitExpiry && '🪰12',
          now < perleLimExpiry && '🦪15',
        ]
          .filter(Boolean)
          .join(' + ') || '—'}
        <br />
        Rigdom: {[upgrades.includes('golden_hook') && '🪝15'].filter(Boolean).join(' + ') || '—'}
        <br />
        Erfaring: {[upgrades.includes('luxury_boat') && '⛵15'].filter(Boolean).join(' + ') || '—'}
      </div>
    </div>
  );
}
