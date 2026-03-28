import { useMemo } from 'react';
import { SHOP_ITEMS } from '../../data/shop';
import { BUCKET_TIERS, getBucketTier, getRodTier, ROD_TIERS } from '../../data/equipment';
import { inventoryBucketCount } from '../../logic/bucket-inventory';
import { usePlayerStore } from '../../store/usePlayerStore';

const sectionLabelClass =
  'mb-2 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-slate-500';

const cardRowClass =
  'flex items-center gap-3 rounded-2xl border border-slate-600/60 bg-slate-800/60 px-3 py-3';

export function EquipmentTab() {
  const upgrades = usePlayerStore((s) => s.upgrades);
  const inventory = usePlayerStore((s) => s.inventory);

  const currentRod = useMemo(() => getRodTier(upgrades), [upgrades]);
  const currentBucket = useMemo(() => getBucketTier(upgrades), [upgrades]);
  const fishInBucket = inventoryBucketCount(inventory);
  const bucketFull = fishInBucket >= currentBucket.capacity;

  const kisteUdstyrItems = useMemo(
    () =>
      SHOP_ITEMS.filter(
        (i) => i.category === 'fishing_gear' && (upgrades.includes(i.id) || i.permanent),
      ),
    [upgrades],
  );
  const desertItems = useMemo(
    () => SHOP_ITEMS.filter((i) => i.id.startsWith('desert_') && upgrades.includes(i.id)),
    [upgrades],
  );
  const arcticItems = useMemo(
    () => SHOP_ITEMS.filter((i) => i.id.startsWith('arctic_') && upgrades.includes(i.id)),
    [upgrades],
  );

  const rodDots = (
    <div className="ml-auto flex gap-[0.3rem]">
      {ROD_TIERS.map((rt) => (
        <div
          key={rt.id ?? 'klassisk'}
          title={rt.name}
          className="h-2 w-2 rounded-full"
          style={{
            background:
              currentRod.id === rt.id || (currentRod.id === null && rt.id === null)
                ? '#f59e0b'
                : 'rgba(51,65,85,0.8)',
          }}
        />
      ))}
    </div>
  );

  const bucketDots = (
    <div className="ml-auto flex gap-[0.3rem]">
      {BUCKET_TIERS.map((bt) => (
        <div
          key={bt.id ?? 'trae'}
          title={bt.name}
          className="h-2 w-2 rounded-full"
          style={{
            background:
              currentBucket.id === bt.id || (currentBucket.id === null && bt.id === null)
                ? '#f59e0b'
                : 'rgba(51,65,85,0.8)',
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-4 text-sm">
      <div>
        <div className={sectionLabelClass}>🎣 Fiskestang</div>
        <div className={cardRowClass}>
          <span className="text-2xl">{currentRod.icon ?? '🎣'}</span>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-slate-200">{currentRod.name} Stang</div>
            <div className="text-[0.78rem] text-slate-500">+{currentRod.timeBonus}s tid per fangst</div>
          </div>
          {rodDots}
        </div>
      </div>

      <div>
        <div className={sectionLabelClass}>🪣 Spand</div>
        <div
          className={cardRowClass}
          style={{
            borderColor: bucketFull ? '#ef4444' : 'rgba(51,65,85,0.6)',
          }}
        >
          <span className="text-2xl">{currentBucket.icon ?? '🪣'}</span>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-slate-200">{currentBucket.name}</div>
            <div
              className="text-[0.78rem]"
              style={{ color: bucketFull ? '#f87171' : '#64748b' }}
            >
              {fishInBucket}/{currentBucket.capacity} fisk
              {bucketFull ? ' — FULD! ⛔' : ''}
            </div>
          </div>
          {bucketDots}
        </div>
      </div>

      {kisteUdstyrItems.length > 0 && (
        <div>
          <div className={sectionLabelClass}>⚙️ Opgraderinger</div>
          <div className="grid grid-cols-2 gap-2">
            {kisteUdstyrItems.map((item) => (
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

      {desertItems.length > 0 && (
        <div>
          <div className={sectionLabelClass}>🏜️ Ørkengrej</div>
          <div className="flex flex-wrap gap-1.5">
            {desertItems.map((i) => (
              <div
                key={i.id}
                title={i.name}
                className="rounded-[0.6rem] border border-amber-700/40 px-2.5 py-1.5 text-amber-200"
                style={{ background: 'rgba(120,53,15,0.2)' }}
              >
                <span>{i.icon}</span> <span className="text-[0.7rem]">{i.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {arcticItems.length > 0 && (
        <div>
          <div className={sectionLabelClass}>🧊 Ishavsgrej</div>
          <div className="flex flex-wrap gap-1.5">
            {arcticItems.map((i) => (
              <div
                key={i.id}
                title={i.name}
                className="rounded-[0.6rem] border border-sky-400/30 px-2.5 py-1.5 text-sky-200"
                style={{ background: 'rgba(30,64,110,0.25)' }}
              >
                <span>{i.icon}</span> <span className="text-[0.7rem]">{i.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {kisteUdstyrItems.length === 0 && desertItems.length === 0 && arcticItems.length === 0 && (
        <p className="py-6 text-center text-[0.9rem] italic text-slate-500">
          Ingen udstyr-opgraderinger endnu — gå i butikken!
        </p>
      )}
    </div>
  );
}
