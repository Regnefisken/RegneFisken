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
  const dialogText =
    onHand <= 0
      ? cfg.emptyText
      : usePirateQuotes
        ? `"${PIRATE_QUOTES[pirateQuoteIdx]}"`
        : cfg.dialogs(delivered);

  return (
    <div
      className="absolute inset-0 z-[10050] flex items-center justify-center bg-black/70 p-4"
      onClick={close}
      role="presentation"
    >
      <div
        className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-2xl border-2 p-6 text-center shadow-xl"
        style={{
          background: cfg.modalBg,
          borderColor: cfg.modalBorder,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 text-5xl">{cfg.npcIcon}</div>
        <h2 className="mb-1 text-xl font-black text-white">{cfg.npcName}</h2>
        <p
          className={`mb-4 text-sm leading-relaxed ${usePirateQuotes ? 'text-slate-200' : 'text-slate-300'}`}
          style={
            usePirateQuotes
              ? { fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic' }
              : undefined
          }
        >
          {dialogText}
        </p>

        {nextMilestone != null && (
          <div className="mb-4 text-xs font-bold text-slate-400">
            Fremskridt mod milepæl: {delivered}/{nextMilestone}
          </div>
        )}

        <div className="mb-4 text-sm text-slate-400">
          På lager: <span className="font-mono text-white">{onHand}</span>{' '}
          {onHand === 1 ? cfg.name : cfg.namePlural}
        </div>

        <div className="flex flex-col gap-2">
          {onHand > 0 && (
            <>
              <button
                type="button"
                onClick={deliverOne}
                className="w-full rounded-xl py-3 font-bold text-white shadow-lg transition hover:opacity-95"
                style={{ background: cfg.btnBg, borderBottom: `3px solid ${cfg.btnBorder}`, color: cfg.btnColor }}
              >
                {cfg.icon} Giv 1 ({onHand} på lager)
              </button>
              {onHand > 1 && (
                <button
                  type="button"
                  onClick={deliverAll}
                  className="w-full rounded-xl border border-white/20 bg-white/10 py-2 text-sm font-bold text-white"
                >
                  Giv alle {onHand}
                </button>
              )}
            </>
          )}
          <button
            type="button"
            onClick={close}
            className="w-full rounded-xl border border-slate-500 bg-slate-800/80 py-2 text-sm font-bold text-slate-300"
          >
            Måske en anden gang
          </button>
        </div>
      </div>
    </div>
  );
}
