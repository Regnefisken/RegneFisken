import { useEffect, useState } from 'react';
import { usePlayerStore } from '../../store/usePlayerStore';

export function BaitTab() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 4000);
    return () => window.clearInterval(id);
  }, []);

  const activeBait = usePlayerStore((s) => s.activeBait);
  const conchBaitExpiry = usePlayerStore((s) => s.conchBaitExpiry);
  const fossilBaitExpiry = usePlayerStore((s) => s.fossilBaitExpiry);
  const flyBaitExpiry = usePlayerStore((s) => s.flyBaitExpiry);
  const hajBloodExpiry = usePlayerStore((s) => s.hajBloodExpiry);
  const perleLimExpiry = usePlayerStore((s) => s.perleLimExpiry);

  const rows: { label: string; on: boolean }[] = [
    { label: `Aktiv madding: ${activeBait ?? 'ingen'}`, on: !!activeBait },
    { label: 'Sød madding (konkylie)', on: now < conchBaitExpiry },
    { label: 'Fossil-slam', on: now < fossilBaitExpiry },
    { label: 'Farverig flue', on: now < flyBaitExpiry },
    { label: 'Hajblod', on: now < hajBloodExpiry },
    { label: 'Perlelim', on: now < perleLimExpiry },
  ];

  return (
    <div className="space-y-2 text-sm">
      <p className="text-slate-500">Status for agn og tidsbegrænsede effekter.</p>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li
            key={r.label}
            className="flex justify-between rounded-xl border border-slate-700 bg-slate-800/40 px-3 py-2"
          >
            <span className="text-slate-300">{r.label}</span>
            <span className={r.on ? 'font-bold text-emerald-400' : 'text-slate-600'}>
              {r.on ? 'Aktiv' : '—'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
