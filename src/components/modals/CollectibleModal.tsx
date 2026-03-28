import { useEffect, useState } from 'react';
import { useAudio } from '../../audio/useAudio';
import { COLLECTIBLES } from '../../data/collectibles';
import { PIRATE_QUOTES } from '../../data/pirate-quotes';
import { tryCompleteNextGoal } from '../../logic/goal-progress';
import { applyXP } from '../../logic/xp-engine';
import type { CollectibleId } from '../../types/collectibles';
import type { MilestoneReward } from '../../types/collectibles';
import { useCollectionStore } from '../../store/useCollectionStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUIStore } from '../../store/useUIStore';

function invKeyFor(id: CollectibleId): 'fossilCount' | 'conchCount' | 'pearlCount' {
  return COLLECTIBLES[id].invKey as 'fossilCount' | 'conchCount' | 'pearlCount';
}

function deliveredKeyFor(id: CollectibleId): 'fossil' | 'conch' | 'pearl' {
  if (id === 'fossil') return 'fossil';
  if (id === 'conch') return 'conch';
  return 'pearl';
}

function itemTypeFor(id: CollectibleId): string {
  if (id === 'fossil') return 'fossil';
  if (id === 'conch') return 'conch';
  return 'pearl';
}

function applyReward(
  r: MilestoneReward,
  setToastMessage: (s: string | null) => void,
  play: (s: string) => void,
  setHvalbofActive: (v: boolean) => void,
  setKoedklumpActive: (v: boolean) => void,
  setActiveBait: (v: string | null) => void,
  setCheeseSources: (v: string[] | ((p: string[]) => string[])) => void,
  setCoins: (v: number | ((p: number) => number)) => void,
  setProgression: (v: { level: number; xp: number }) => void,
  progression: { level: number; xp: number },
  setShowLevelUp: (v: number | null) => void,
) {
  setToastMessage(r.toast);
  play('coin');
  if (r.type === 'hvalbof') setHvalbofActive(true);
  if (r.type === 'koedklump') setKoedklumpActive(true);
  if (r.type === 'bait') setActiveBait('bait');
  if (r.type === 'cheese') {
    setCheeseSources((p) => (p.includes('pingvin') ? p : [...p, 'pingvin']));
  }
  if (r.type === 'xp_coins' && 'xp' in r && 'coins' in r) {
    setCoins((c) => c + r.coins);
    const { level, xp, levelUps } = applyXP(progression.level, progression.xp, r.xp);
    setProgression({ level, xp });
    if (levelUps.length > 0) setShowLevelUp(levelUps[levelUps.length - 1]!);
  }
}

/** NPC-dialog: fossil (pirat), konkylie (pingvin), perle (havfrue) — `COLLECTIBLES`-data. */
export function CollectibleModal() {
  const { play } = useAudio();
  const kind = useUIStore((s) => s.showCollectibleModal);
  const setKind = useUIStore((s) => s.setShowCollectibleModal);
  const setToastMessage = useUIStore((s) => s.setToastMessage);
  const setShowLevelUp = useUIStore((s) => s.setShowLevelUp);

  const setInventory = usePlayerStore((s) => s.setInventory);
  const setProgression = usePlayerStore((s) => s.setProgression);
  const setCoins = usePlayerStore((s) => s.setCoins);
  const setHvalbofActive = usePlayerStore((s) => s.setHvalbofActive);
  const setKoedklumpActive = usePlayerStore((s) => s.setKoedklumpActive);
  const setActiveBait = usePlayerStore((s) => s.setActiveBait);
  const setCheeseSources = usePlayerStore((s) => s.setCheeseSources);

  const collectibleInventory = useCollectionStore((s) => s.collectibleInventory);
  const setCollectibleInventory = useCollectionStore((s) => s.setCollectibleInventory);
  const collectibleDelivered = useCollectionStore((s) => s.collectibleDelivered);
  const setCollectibleDelivered = useCollectionStore((s) => s.setCollectibleDelivered);

  const [pirateQuoteIdx, setPirateQuoteIdx] = useState(0);
  useEffect(() => {
    if (kind === 'fossil') {
      setPirateQuoteIdx(Math.floor(Math.random() * PIRATE_QUOTES.length));
    }
  }, [kind]);

  if (!kind) return null;

  const cfg = COLLECTIBLES[kind];
  const ikey = invKeyFor(kind);
  const dkey = deliveredKeyFor(kind);
  const onHand = collectibleInventory[ikey];
  const delivered = collectibleDelivered[dkey];
  const itype = itemTypeFor(kind);

  const milestones = Object.keys(cfg.milestoneRewards)
    .map(Number)
    .sort((a, b) => a - b);
  const nextMilestone = milestones.find((m) => delivered < m) ?? null;

  function runSingleDeliver() {
    if (!usePlayerStore.getState().inventory.some((f) => f.itemType === itype)) return;

    setInventory((prev) => {
      const i = prev.findIndex((f) => f.itemType === itype);
      if (i === -1) return prev;
      const next = [...prev];
      next.splice(i, 1);
      return next;
    });
    setCollectibleInventory((c) => ({ ...c, [ikey]: Math.max(0, c[ikey] - 1) }));

    let newDelivered = 0;
    setCollectibleDelivered((d) => {
      newDelivered = d[dkey] + 1;
      return { ...d, [dkey]: newDelivered };
    });

    const reward = cfg.milestoneRewards[newDelivered as keyof typeof cfg.milestoneRewards];
    if (reward) {
      applyReward(
        reward,
        setToastMessage,
        play,
        setHvalbofActive,
        setKoedklumpActive,
        setActiveBait,
        setCheeseSources,
        setCoins,
        setProgression,
        usePlayerStore.getState().progression,
        setShowLevelUp,
      );
    }
    tryCompleteNextGoal();
  }

  function deliverOne() {
    if (useCollectionStore.getState().collectibleInventory[ikey] <= 0) return;
    play('ui');
    runSingleDeliver();
  }

  function deliverFive() {
    const n = useCollectionStore.getState().collectibleInventory[ikey];
    if (n < 5) return;
    play('ui');
    for (let i = 0; i < 5; i++) {
      if (useCollectionStore.getState().collectibleInventory[ikey] <= 0) break;
      if (!usePlayerStore.getState().inventory.some((f) => f.itemType === itype)) break;
      runSingleDeliver();
    }
  }

  function deliverAll() {
    const n = useCollectionStore.getState().collectibleInventory[ikey];
    if (n <= 0) return;
    play('ui');
    for (let i = 0; i < n; i++) {
      if (useCollectionStore.getState().collectibleInventory[ikey] <= 0) break;
      if (!usePlayerStore.getState().inventory.some((f) => f.itemType === itype)) break;
      runSingleDeliver();
    }
  }

  function close() {
    play('ui');
    setKind(null);
  }

  const usePirateQuotes = kind === 'fossil' && delivered > 10 && onHand > 0;
  const dialogText = usePirateQuotes
    ? `"${PIRATE_QUOTES[pirateQuoteIdx]}"`
    : cfg.dialogs(delivered);

  const progressPct = nextMilestone ? Math.min(100, (delivered / nextMilestone) * 100) : 100;
  const hasReward = nextMilestone != null && cfg.milestoneRewards[nextMilestone as keyof typeof cfg.milestoneRewards];

  return (
    <div
      className="absolute inset-0 z-[10050] flex items-center justify-center pointer-events-auto"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={close}
      role="presentation"
    >
      <div
        className="max-w-sm w-full mx-4 max-h-[85dvh] overflow-y-auto rounded-3xl border-4 p-8 relative"
        style={{
          background: cfg.modalBg,
          borderColor: cfg.modalBorder,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: icon left, name + subtitle right */}
        <div className="flex items-center gap-4 mb-5">
          <div className="text-6xl">{cfg.npcIcon}</div>
          <div>
            <div style={{ color: cfg.color, fontWeight: 900, fontSize: '1.15rem' }}>{cfg.npcName}</div>
            <div className="text-stone-400 text-xs uppercase tracking-wider">
              Samleren · {delivered} {cfg.namePlural.toLowerCase()} modtaget
            </div>
          </div>
        </div>

        {/* Dialog text — always based on delivered count */}
        <p
          className="text-stone-200 text-base leading-relaxed mb-5 italic"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          {dialogText}
        </p>

        {/* Milestone progress bar (only after first delivery) */}
        {delivered > 0 && (
          <div
            className="mb-4 px-3 py-2 rounded-xl text-xs"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex justify-between text-stone-400 mb-1">
              <span>Næste milepæl</span>
              <span style={{ color: cfg.color, fontWeight: 700 }}>
                {nextMilestone ? `${delivered}/${nextMilestone}` : `${delivered} ✓ Alle nået!`}
              </span>
            </div>
            {nextMilestone != null && (
              <div className="h-1.5 rounded-full bg-stone-800">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progressPct}%`, background: cfg.color }}
                />
              </div>
            )}
          </div>
        )}

        {onHand > 0 ? (
          <div className="flex flex-col gap-3">
            {/* Reward hint */}
            {hasReward && (
              <div
                className="text-amber-200 text-xs italic px-3 py-2 rounded-xl text-center"
                style={{ background: 'rgba(180,100,0,0.2)', border: '1px solid rgba(245,158,11,0.3)' }}
              >
                ⭐ Indlever nu og modtag en belønning!
              </div>
            )}
            <button
              type="button"
              onClick={deliverOne}
              className="w-full py-3 rounded-2xl font-bold text-base border-b-4 transition-all hover:scale-105 active:scale-95"
              style={{ background: cfg.btnBg, borderColor: cfg.btnBorder, color: cfg.btnColor }}
            >
              {cfg.icon} Giv 1 {cfg.name.toLowerCase()} ({onHand} på lager)
            </button>
            {onHand >= 5 && (
              <button
                type="button"
                onClick={deliverFive}
                className="w-full py-3 rounded-2xl font-bold text-base border-b-4 transition-all hover:scale-105 active:scale-95"
                style={{ background: cfg.btnBg, borderColor: cfg.btnBorder, color: cfg.btnColor, opacity: 0.85 }}
              >
                {cfg.icon} Giv 5 {cfg.namePlural.toLowerCase()}
              </button>
            )}
            {onHand > 1 && (
              <button
                type="button"
                onClick={deliverAll}
                className="w-full py-3 rounded-2xl font-bold text-base border-b-4 transition-all hover:scale-105 active:scale-95"
                style={{ background: cfg.btnBg, borderColor: cfg.btnBorder, color: cfg.btnColor, opacity: 0.7 }}
              >
                {cfg.icon} Giv ALLE {onHand} {cfg.namePlural.toLowerCase()}
              </button>
            )}
            <button
              type="button"
              onClick={close}
              className="w-full py-3 rounded-2xl font-bold text-base bg-stone-800 hover:bg-stone-700 text-stone-300 border-b-4 border-stone-900 transition-all"
            >
              Måske en anden gang
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="text-stone-400 text-sm italic text-center py-2">
              {delivered === 0 ? cfg.emptyText : cfg.returnText}
            </div>
            <button
              type="button"
              onClick={close}
              className="w-full py-3 rounded-2xl font-bold text-base bg-stone-800 hover:bg-stone-700 text-stone-300 border-b-4 border-stone-900 transition-all"
            >
              Farvel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
