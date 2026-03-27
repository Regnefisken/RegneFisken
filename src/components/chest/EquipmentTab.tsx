import { SHOP_ITEMS } from '../../data/shop';
import { usePlayerStore } from '../../store/usePlayerStore';

export function EquipmentTab() {
  const upgrades = usePlayerStore((s) => s.upgrades);
  const ownedGear = SHOP_ITEMS.filter(
    (i) => i.category === 'fishing_gear' && upgrades.includes(i.id)
  );

  return (
    <div className="space-y-3 text-sm text-slate-300">
      <p className="text-slate-500">Dit aktive fiskegrej og opgraderinger.</p>
      {ownedGear.length === 0 ? (
        <p className="italic text-slate-500">Ingen endnu — køb i butikken.</p>
      ) : (
        <ul className="space-y-2">
          {ownedGear.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/50 p-3"
            >
              <span className="text-2xl">{item.icon}</span>
              <div>
                <div className="font-bold text-white">{item.name}</div>
                <div className="text-xs text-slate-500">{item.description}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
