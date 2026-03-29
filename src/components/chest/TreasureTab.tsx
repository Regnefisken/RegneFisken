import { useMemo } from 'react';
import { COLLECTIBLES, getNextMilestone } from '../../data/collectibles';
import { LOCATION_DISPLAY } from '../../data/locations';
import { SHOP_ITEMS } from '../../data/shop';
import { useCollectionStore } from '../../store/useCollectionStore';
import { usePlayerStore } from '../../store/usePlayerStore';

export function TreasureTab() {
  const upgrades = usePlayerStore((s) => s.upgrades);
  const questItems = usePlayerStore((s) => s.questItems);
  const wildTurtleSpawned = usePlayerStore((s) => s.wildTurtleSpawned);
  const cheeseSources = usePlayerStore((s) => s.cheeseSources);
  const featherSources = usePlayerStore((s) => s.featherSources);

  const collectibleInventory = useCollectionStore((s) => s.collectibleInventory);
  const collectibleDelivered = useCollectionStore((s) => s.collectibleDelivered);

  const skatteItems = useMemo(
    () =>
      SHOP_ITEMS.filter(
        (i) =>
          (i.category === 'travel' || i.category === 'legendary') &&
          !i.id.startsWith('desert_') &&
          !i.id.startsWith('arctic_') &&
          upgrades.includes(i.id),
      ),
    [upgrades],
  );

  const hasMapLeft = questItems.includes('map_left');
  const hasMapRight = questItems.includes('map_right') || upgrades.includes('map_right');
  const hasFullMap = hasMapLeft && hasMapRight;

  const cf = cheeseSources.length;
  const ff = featherSources.length;

  const collectiblesRows = useMemo(() => {
    return Object.values(COLLECTIBLES)
      .map((cfg) => {
        const inv = collectibleInventory[cfg.invKey as keyof typeof collectibleInventory] ?? 0;
        const del = collectibleDelivered[cfg.id as keyof typeof collectibleDelivered] ?? 0;
        const nm = getNextMilestone(cfg.id, del);
        if (inv === 0 && del === 0) return null;
        return { cfg, inv, del, nm };
      })
      .filter(Boolean) as {
      cfg: (typeof COLLECTIBLES)[keyof typeof COLLECTIBLES];
      inv: number;
      del: number;
      nm: number | null;
    }[];
  }, [collectibleInventory, collectibleDelivered]);

  const hasTurtleTreasure =
    questItems.includes('turtle_hatched') || wildTurtleSpawned;

  const emptySkat =
    skatteItems.length === 0 &&
    collectibleInventory.conchCount +
      collectibleInventory.pearlCount +
      collectibleInventory.fossilCount +
      (collectibleDelivered.fossil ?? 0) +
      (collectibleDelivered.conch ?? 0) +
      (collectibleDelivered.pearl ?? 0) ===
      0 &&
    !hasMapLeft &&
    !hasMapRight &&
    !questItems.includes('cabin_key') &&
    cf === 0 &&
    ff === 0 &&
    !hasTurtleTreasure;

  const sectionLabel =
    'mb-2 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-slate-500';

  return (
    <div className="flex flex-col gap-4 text-sm">
      {collectiblesRows.length > 0 && (
        <div>
          <div className={sectionLabel}>💎 Samleobjekter & Afleveringer</div>
          <div className="flex flex-col gap-2">
            {collectiblesRows.map(({ cfg, inv, del, nm }) => (
              <div
                key={cfg.id}
                className="flex items-center gap-2.5 rounded-xl border px-3 py-2.5"
                style={{
                  background: cfg.bgColor,
                  borderColor: cfg.borderColor,
                }}
              >
                <span className="text-xl">{cfg.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1 text-[0.85rem]">
                    <span className="font-bold" style={{ color: cfg.color }}>
                      {inv} i taske
                    </span>
                    <span className="text-[0.72rem] text-slate-500">
                      · {del} afleveret til {cfg.npcName}
                    </span>
                  </div>
                  {nm != null && (
                    <div
                      className="mt-1.5 h-1 overflow-hidden rounded-full"
                      style={{ background: 'rgba(0,0,0,0.3)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          background: cfg.color,
                          width: `${Math.min(100, (del / nm) * 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(hasMapLeft || hasMapRight) && (
        <div>
          <div className={sectionLabel}>🗺 Skattekort</div>
          <div
            className="flex items-center gap-3 rounded-2xl border p-3"
            style={{
              background: hasFullMap ? 'rgba(120,50,0,0.85)' : 'rgba(30,20,50,0.85)',
              borderColor: hasFullMap ? '#f59e0b' : '#6d28d9',
            }}
          >
            <span className="text-2xl">🗺</span>
            <div>
              <div
                className="font-bold"
                style={{ color: hasFullMap ? '#fbbf24' : '#a78bfa' }}
              >
                {hasFullMap ? 'Komplet Skattekort' : 'Halvt Skattekort'}
              </div>
              <div className="text-[0.78rem] text-slate-500">
                {hasFullMap
                  ? `Låser ${LOCATION_DISPLAY.forbidden} op`
                  : 'Find den anden halvdel'}
              </div>
            </div>
          </div>
        </div>
      )}

      {questItems.includes('cabin_key') && (
        <div>
          <div className={sectionLabel}>🗝️ Nøgler</div>
          <div
            className="flex items-center gap-3 rounded-2xl border border-amber-400/40 p-3"
            style={{ background: 'rgba(30,25,5,0.85)' }}
          >
            <span className="text-2xl">🗝️</span>
            <div className="font-bold text-amber-400">Fiskehyttens Nøgle</div>
          </div>
        </div>
      )}

      {(cf > 0 || ff > 0) && (
        <div>
          <div className={sectionLabel}>🔍 Natursamling</div>
          <div className="flex flex-wrap gap-2">
            {cf > 0 && (
              <div
                className="flex items-center gap-2 rounded-xl border border-amber-700/40 px-3 py-2"
                style={{ background: 'rgba(20,15,5,0.85)' }}
              >
                <span className="text-lg">🧀</span>
                <span className="font-bold text-amber-400">{cf}/3</span>
              </div>
            )}
            {ff > 0 && (
              <div
                className="flex items-center gap-2 rounded-xl border border-slate-500/40 px-3 py-2"
                style={{ background: 'rgba(10,15,25,0.85)' }}
              >
                <span className="text-lg">🪶</span>
                <span className="font-bold text-slate-400">{ff}/3</span>
              </div>
            )}
          </div>
        </div>
      )}

      {(questItems.includes('turtle_hatched') || wildTurtleSpawned) && (
        <div>
          <div className={sectionLabel}>🐢 Særlige øjeblikke</div>
          <div className="flex flex-col gap-2">
            {questItems.includes('turtle_hatched') && (
              <div
                className="flex items-center gap-3 rounded-2xl border p-3"
                style={{
                  background: 'rgba(10,40,20,0.85)',
                  borderColor: 'rgba(34,197,94,0.4)',
                }}
              >
                <span className="text-2xl">🐢</span>
                <div className="font-bold" style={{ color: '#86efac' }}>
                  Skildpadden i Fiskehytten
                </div>
              </div>
            )}
            {wildTurtleSpawned && (
              <div
                className="flex items-center gap-3 rounded-2xl border p-3"
                style={{
                  background: 'rgba(20,35,10,0.85)',
                  borderColor: 'rgba(74,222,128,0.4)',
                }}
              >
                <span className="text-2xl">🐢</span>
                <div className="font-bold" style={{ color: '#4ade80' }}>
                  Fri skildpadde på Tropisk Ø
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {skatteItems.length > 0 && (
        <div>
          <div className={sectionLabel}>🏆 Tilladelser & Særligt grej</div>
          <div className="grid grid-cols-2 gap-2">
            {skatteItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-xl border border-slate-600/60 bg-slate-800/60 px-3 py-2.5"
              >
                <span className="text-lg">{item.icon}</span>
                <div className="min-w-0 text-[0.8rem] font-semibold text-slate-200">{item.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {emptySkat && (
        <p className="py-6 text-center text-[0.9rem] italic text-slate-500">
          Ingen skatte endnu — udforsk verden og gå i butikken!
        </p>
      )}
    </div>
  );
}
