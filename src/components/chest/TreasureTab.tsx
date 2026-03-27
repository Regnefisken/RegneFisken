import { useCollectionStore } from '../../store/useCollectionStore';

export function TreasureTab() {
  const inv = useCollectionStore((s) => s.collectibleInventory);
  const delivered = useCollectionStore((s) => s.collectibleDelivered);

  return (
    <div className="space-y-4 text-sm text-slate-300">
      <div>
        <h3 className="mb-2 font-bold text-white">📦 På lager</h3>
        <ul className="space-y-1 text-slate-400">
          <li>Fossiler: {inv.fossilCount}</li>
          <li>Konkylier: {inv.conchCount}</li>
          <li>Perler: {inv.pearlCount}</li>
        </ul>
      </div>
      <div>
        <h3 className="mb-2 font-bold text-white">🏛 Leveret</h3>
        <ul className="space-y-1 text-slate-400">
          <li>Fossil: {delivered.fossil}</li>
          <li>Konkylie: {delivered.conch}</li>
          <li>Perle: {delivered.pearl}</li>
        </ul>
      </div>
    </div>
  );
}
