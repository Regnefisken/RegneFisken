import { useCollectionStore } from '../../store/useCollectionStore';

export function PetTab() {
  const companions = useCollectionStore((s) => s.unlockedCompanions);

  return (
    <div className="text-sm text-slate-300">
      <p className="mb-3 text-slate-500">Ulåste og aktive følgesvende.</p>
      {companions.length === 0 ? (
        <p className="italic text-slate-500">Ingen kæledyr endnu.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {companions.map((id) => (
            <li
              key={id}
              className="rounded-full border border-amber-600/50 bg-amber-900/20 px-3 py-1 text-xs font-bold text-amber-200"
            >
              {id}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
