import { useCallback, useEffect, useMemo, useState } from 'react';
import { flushGameSave } from '../../logic/game-persistence';
import type { AvatarSaveState } from '../../store/usePlayerStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUIStore } from '../../store/useUIStore';
import {
  HAIR_COLORS,
  HAIR_STYLES,
  EYE_STYLES,
  SKIN_TONES,
  WARDROBE_ITEMS,
} from '../../data/wardrobeItems';
import { CareerStatsBlock } from '../ui/CareerStatsBlock';
import { renderAvatarSvg, type AvatarRenderDevState } from './renderAvatarSvg';

function cloneAvatar(a: AvatarSaveState): AvatarSaveState {
  return {
    ...a,
    equipped: { ...a.equipped },
    heldItems: [...a.heldItems],
  };
}

const RN: Record<string, string> = {
  common: 'Almindelig',
  rare: 'Sjælden',
  legendary: 'Legendarisk',
};

const RC: Record<string, string> = {
  common: '#94a3b8',
  rare: '#a855f7',
  legendary: '#ffd700',
};

function isEquippedInDraft(d: AvatarSaveState, item: (typeof WARDROBE_ITEMS)[number]): boolean {
  if (item.slot === 'held') return d.heldItems.includes(item.id);
  if (item.slot === 'pet') return d.pet === item.id;
  return d.equipped[item.slot as string] === item.id;
}

function applyToggleEquip(d: AvatarSaveState, item: (typeof WARDROBE_ITEMS)[number]): AvatarSaveState {
  const slot = item.slot as string;
  if (slot === 'held') {
    const hi = [...d.heldItems];
    const ix = hi.indexOf(item.id);
    if (ix >= 0) hi.splice(ix, 1);
    else {
      hi.push(item.id);
      if (hi.length > 2) hi.shift();
    }
    return { ...d, heldItems: hi };
  }
  if (slot === 'pet') {
    return { ...d, pet: d.pet === item.id ? null : item.id };
  }
  const nextEq = { ...d.equipped };
  if (nextEq[slot] === item.id) delete nextEq[slot];
  else nextEq[slot] = item.id;
  return { ...d, equipped: nextEq };
}

export function WardrobeModal() {
  const open = useUIStore((s) => s.showWardrobeModal);
  const setOpen = useUIStore((s) => s.setShowWardrobeModal);
  const setToastMessage = useUIStore((s) => s.setToastMessage);

  const unlockedFurniture = usePlayerStore((s) => s.unlockedFurniture);
  const ownedIds = usePlayerStore((s) => s.ownedWardrobeItemIds);
  const savedAvatar = usePlayerStore((s) => s.avatar);
  const setSavedAvatar = usePlayerStore((s) => s.setAvatar);
  const setHasSeenIntro = usePlayerStore((s) => s.setHasSeenWardrobeIntro);
  const hasSeenIntro = usePlayerStore((s) => s.hasSeenWardrobeIntro);

  const hasWardrobe = unlockedFurniture.includes('bedroom_wardrobe');

  const [tab, setTab] = useState<'creator' | 'wardrobe'>('creator');
  const [draft, setDraft] = useState<AvatarSaveState>(() => cloneAvatar(savedAvatar));
  const [category, setCategory] = useState<string>('Alle');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [devOpen, setDevOpen] = useState(false);
  const [devTargetId, setDevTargetId] = useState<string | null>(null);
  const [devOffset, setDevOffset] = useState({ x: 0, y: 0 });
  const [devScale, setDevScale] = useState(1);
  const [devFootGap, setDevFootGap] = useState(0);

  useEffect(() => {
    if (open) {
      setDraft(cloneAvatar(savedAvatar));
      setTab('creator');
      setSelectedId(null);
      setShowIntro(!hasSeenIntro);
      setDevOpen(false);
      setDevTargetId(null);
      setDevOffset({ x: 0, y: 0 });
      setDevScale(1);
      setDevFootGap(0);
    }
  }, [open, savedAvatar, hasSeenIntro]);

  const previewAvatar = useMemo((): AvatarSaveState => {
    if (hasWardrobe) return draft;
    return {
      ...draft,
      equipped: {},
      heldItems: [],
      pet: null,
    };
  }, [draft, hasWardrobe]);

  const svgHtml = useMemo(() => {
    const dev: AvatarRenderDevState | undefined =
      devTargetId !== null
        ? { targetId: devTargetId, offset: devOffset, scale: devScale, footGap: devFootGap }
        : undefined;
    return renderAvatarSvg(previewAvatar, 'wm', dev);
  }, [previewAvatar, devTargetId, devOffset.x, devOffset.y, devScale, devFootGap]);

  const devOutputText = useMemo(() => {
    if (!devTargetId) return '—';
    const item = WARDROBE_ITEMS.find((i) => i.id === devTargetId);
    const slot = item?.slot ?? '?';
    let out = `"${devTargetId}" [${slot}]: offset(${devOffset.x}, ${devOffset.y}), scale(${devScale.toFixed(2)})`;
    if (slot === 'feet') out += `, gap(${devFootGap})`;
    return out;
  }, [devTargetId, devOffset, devScale, devFootGap]);

  const devTargetLabel = useMemo(() => {
    if (!devTargetId) return 'Intet udstyr valgt';
    const item = WARDROBE_ITEMS.find((i) => i.id === devTargetId);
    return item ? `→ ${item.name} (${item.slot})` : devTargetId;
  }, [devTargetId]);

  const showDevFootGap =
    devTargetId !== null && WARDROBE_ITEMS.find((i) => i.id === devTargetId)?.slot === 'feet';

  const ownedSet = useMemo(() => new Set(ownedIds), [ownedIds]);

  const gridItems = useMemo(() => {
    if (!hasWardrobe) return [];
    let list = WARDROBE_ITEMS.filter((it) => ownedSet.has(it.id));
    if (category !== 'Alle') {
      list = list.filter((it) => it.type === category);
    }
    return list;
  }, [hasWardrobe, ownedSet, category]);

  const categories = useMemo(() => {
    const u = new Set<string>();
    for (const it of WARDROBE_ITEMS) {
      if (ownedSet.has(it.id)) u.add(it.type);
    }
    return ['Alle', ...Array.from(u).sort()];
  }, [ownedSet]);

  const selectedItem = selectedId ? WARDROBE_ITEMS.find((i) => i.id === selectedId) : undefined;

  const dismissIntro = useCallback(() => {
    setHasSeenIntro(true);
    setShowIntro(false);
  }, [setHasSeenIntro]);

  const saveAndClose = useCallback(() => {
    setSavedAvatar(cloneAvatar(draft));
    flushGameSave();
    setOpen(false);
  }, [draft, setOpen, setSavedAvatar]);

  const trySetTab = (t: 'creator' | 'wardrobe') => {
    if (t === 'wardrobe' && !hasWardrobe) {
      setToastMessage('Køb klædeskabet i butikken for at bruge fundne ting.');
      return;
    }
    setTab(t);
  };

  const randomiseAll = useCallback(() => {
    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]!;
    const hairChoices = HAIR_STYLES.filter((h) => h.id !== 'bald');
    let next: AvatarSaveState = {
      skinTone: pick(SKIN_TONES).id,
      hairColor: pick(HAIR_COLORS).id,
      hairStyle: (hairChoices.length ? pick(hairChoices) : pick(HAIR_STYLES)).id,
      eyeStyle: pick(EYE_STYLES).id,
      equipped: {},
      heldItems: [],
      pet: null,
    };
    if (hasWardrobe) {
      const owned = WARDROBE_ITEMS.filter((i) => ownedSet.has(i.id));
      const byType: Record<string, typeof WARDROBE_ITEMS> = {};
      for (const it of owned) {
        if (!byType[it.type]) byType[it.type] = [];
        byType[it.type]!.push(it);
      }
      for (const group of Object.values(byType)) {
        if (group.length === 0) continue;
        const it = pick(group);
        if (it.slot === 'pet') next = { ...next, pet: it.id };
        else if (it.slot === 'held') {
          const hi = [...next.heldItems.filter((x) => x !== it.id)];
          hi.push(it.id);
          if (hi.length > 2) hi.shift();
          next = { ...next, heldItems: hi };
        } else if (it.slot && it.slot !== 'pet' && it.slot !== 'held') {
          next = { ...next, equipped: { ...next.equipped, [it.slot]: it.id } };
        }
      }
    }
    setDraft(next);
    setDevTargetId(null);
    setDevOffset({ x: 0, y: 0 });
    setDevScale(1);
    setDevFootGap(0);
  }, [hasWardrobe, ownedSet]);

  const toggleEquip = (item: (typeof WARDROBE_ITEMS)[number]) => {
    if (!hasWardrobe) return;
    const wasEquipped = isEquippedInDraft(draft, item);
    const next = applyToggleEquip(draft, item);
    setDraft(next);
    if (!wasEquipped && isEquippedInDraft(next, item)) {
      setDevTargetId(item.id);
      setDevOffset({ x: 0, y: 0 });
      setDevScale(1);
      setDevFootGap(0);
    }
  };

  const devNudge = (axis: 'x' | 'y', amount: number) => {
    setDevOffset((o) => ({ ...o, [axis]: o[axis] + amount }));
  };
  const devScaleStep = (amount: number) => {
    setDevScale((s) => Math.max(0.1, Math.round((s + amount) * 100) / 100));
  };
  const devGapStep = (amount: number) => setDevFootGap((g) => g + amount);
  const devReset = () => {
    setDevOffset({ x: 0, y: 0 });
    setDevScale(1);
    setDevFootGap(0);
  };

  const copyDevOutput = () => {
    if (devOutputText === '—') return;
    void navigator.clipboard.writeText(devOutputText);
    setToastMessage('Kopieret til udklipsholder');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10050] flex flex-col bg-[#0b1628] font-sans text-[#d4eef7]">
      {showIntro ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/75 p-4">
          <div className="max-w-md rounded-2xl border border-white/15 bg-[#132744] p-6 shadow-2xl">
            <h2 className="mb-3 text-xl font-bold text-[#f5eedc]">Velkommen til spejlet</h2>
            <p className="mb-4 text-sm leading-relaxed text-[#d4eef7]/80">
              Her kan du tilpasse dit udseende. Har du også klædeskabet, kan du tage fundet tøj på og se det i
              forhåndsvisningen.
            </p>
            <button
              type="button"
              onClick={dismissIntro}
              className="w-full rounded-xl bg-emerald-600 py-3 font-bold text-white hover:bg-emerald-500"
            >
              OK
            </button>
          </div>
        </div>
      ) : null}

      <header className="relative flex-shrink-0 border-b border-white/10 px-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 md:px-5 md:py-4">
        <button
          type="button"
          aria-label="Tilbage til hytten"
          onClick={() => setOpen(false)}
          className="absolute left-[max(0.75rem,env(safe-area-inset-left))] top-[max(0.75rem,env(safe-area-inset-top))] z-10 inline-flex items-center gap-2 rounded-2xl border-2 border-[#e6c12a] bg-[#1a2332] px-4 py-2.5 text-sm font-bold text-[#ffe94a] shadow-[0_4px_14px_rgba(0,0,0,0.45)] transition hover:brightness-110 active:scale-[0.98] md:text-base"
        >
          <span className="select-none" aria-hidden>
            🏠
          </span>
          Tilbage til hytten
        </button>
        <h1 className="pointer-events-none text-center text-lg font-bold text-[#e8d5a3] md:text-xl px-[min(8rem,22vw)] pt-1">
          Klædeskab & spejl
        </h1>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 md:flex-row md:items-stretch md:gap-6 md:p-6">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[rgba(19,39,68,0.85)] md:min-w-0 md:basis-1/2 md:flex-[1_1_50%]">
          <div className="flex border-b border-white/10">
            <button
              type="button"
              onClick={() => trySetTab('creator')}
              className={`flex-1 py-3 text-center text-sm font-bold md:text-base ${
                tab === 'creator' ? 'border-b-2 border-[#e8d5a3] text-[#e8d5a3]' : 'text-white/50'
              }`}
            >
              Grundlæggende
            </button>
            <button
              type="button"
              onClick={() => trySetTab('wardrobe')}
              className={`relative flex-1 py-3 text-center text-sm font-bold md:text-base ${
                tab === 'wardrobe' ? 'border-b-2 border-[#e8d5a3] text-[#e8d5a3]' : 'text-white/50'
              }`}
            >
              Klædeskab
              {!hasWardrobe ? <span className="ml-1 text-xs">🔒</span> : null}
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {tab === 'creator' ? (
              <div className="space-y-6">
                <section>
                  <div className="mb-2 text-sm font-semibold text-[#e8d5a3]">Hudtone</div>
                  <div className="flex flex-wrap gap-2">
                    {SKIN_TONES.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        title={s.id}
                        onClick={() => setDraft((d) => ({ ...d, skinTone: s.id }))}
                        className={`h-8 w-8 rounded-full border-2 ${
                          draft.skinTone === s.id ? 'border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'border-transparent'
                        }`}
                        style={{ background: s.color }}
                      />
                    ))}
                  </div>
                </section>
                <section>
                  <div className="mb-2 text-sm font-semibold text-[#e8d5a3]">Hårfarve</div>
                  <div className="flex flex-wrap gap-2">
                    {HAIR_COLORS.map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => setDraft((d) => ({ ...d, hairColor: h.id }))}
                        className={`h-8 w-8 rounded-full border-2 ${
                          draft.hairColor === h.id ? 'border-amber-400' : 'border-transparent'
                        }`}
                        style={{ background: h.color }}
                      />
                    ))}
                  </div>
                </section>
                <section>
                  <div className="mb-2 text-sm font-semibold text-[#e8d5a3]">Hårstil</div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {HAIR_STYLES.map((h) => {
                      const hc = (HAIR_COLORS.find((x) => x.id === draft.hairColor) ?? HAIR_COLORS[0]!).color;
                      const hairPreview =
                        h.id === 'bald'
                          ? (h.preview as () => string)()
                          : (h.preview as (c: string) => string)(hc);
                      return (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => setDraft((d) => ({ ...d, hairStyle: h.id }))}
                          className={`rounded-xl border-2 p-2 text-left text-xs ${
                            draft.hairStyle === h.id ? 'border-amber-400 bg-amber-400/10' : 'border-white/10'
                          }`}
                        >
                          <span dangerouslySetInnerHTML={{ __html: hairPreview }} />
                          <div className="mt-1 font-semibold">{h.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </section>
                <section>
                  <div className="mb-2 text-sm font-semibold text-[#e8d5a3]">Øjne</div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {EYE_STYLES.map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setDraft((d) => ({ ...d, eyeStyle: e.id }))}
                        className={`rounded-xl border-2 p-2 text-left text-xs ${
                          draft.eyeStyle === e.id ? 'border-amber-400 bg-amber-400/10' : 'border-white/10'
                        }`}
                      >
                        <span dangerouslySetInnerHTML={{ __html: e.preview }} />
                        <div className="mt-1 font-semibold">{e.label}</div>
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            ) : hasWardrobe ? (
              <div>
                <div className="mb-3 flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        category === c ? 'border-[#e8d5a3] bg-[#e8d5a3]/15 text-[#e8d5a3]' : 'border-white/15'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <div className="grid max-h-[50vh] grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2 overflow-y-auto pr-1 md:max-h-none md:min-h-0">
                  {gridItems.map((it) => {
                    const eq =
                      it.slot === 'held'
                        ? draft.heldItems.includes(it.id)
                        : it.slot === 'pet'
                          ? draft.pet === it.id
                          : draft.equipped[it.slot as string] === it.id;
                    return (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => {
                          setSelectedId(it.id);
                          toggleEquip(it);
                        }}
                        className={`relative rounded-xl border-2 p-2 text-center transition ${
                          selectedId === it.id ? 'border-amber-400' : 'border-white/10'
                        } ${eq ? 'border-emerald-500/80 bg-emerald-500/10' : ''}`}
                      >
                        <span
                          className="rarity-dot absolute top-1 right-1 h-2 w-2 rounded-full"
                          style={{ background: RC[it.rarity] ?? '#888' }}
                        />
                        <span className="mx-auto block [&>svg]:mx-auto [&>svg]:h-11 [&>svg]:w-11" dangerouslySetInnerHTML={{ __html: it.svgCard }} />
                        <div className="mt-1 line-clamp-2 text-[0.65rem] font-semibold">{it.name}</div>
                      </button>
                    );
                  })}
                </div>
                {gridItems.length === 0 ? (
                  <p className="py-8 text-center text-sm text-white/40">Ingen genstande endnu — åbn sunkne kister!</p>
                ) : null}
                {selectedItem ? (
                  <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                    <div className="font-bold text-[#f5eedc]">{selectedItem.name}</div>
                    <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: RC[selectedItem.rarity] }}>
                      {RN[selectedItem.rarity] ?? selectedItem.rarity}
                    </div>
                    <p className="mt-2 text-white/70">{selectedItem.desc}</p>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center text-white/50">
                <p className="max-w-sm">Køb klædeskabet i butikken for at bruge fundne ting.</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col md:basis-1/2 md:flex-[1_1_50%]">
          <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-[#e8d5a3]/25 bg-gradient-to-b from-[#e8d5a3]/10 to-transparent p-4">
            <div className="mb-2 flex flex-shrink-0 items-center gap-2">
              <h2 className="flex-1 text-lg font-bold text-[#e8d5a3]">Spejl</h2>
              <button
                type="button"
                title="Dev tools — justér valgt udstyr og kopier offset til wardrobeItemAdj"
                onClick={() => setDevOpen((v) => !v)}
                className={`flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-lg border text-[0.75rem] transition ${
                  devOpen
                    ? 'border-red-400/50 bg-red-500/20 text-red-300'
                    : 'border-transparent text-red-400/30 hover:border-red-400/35 hover:bg-red-500/10 hover:text-red-300/80'
                }`}
              >
                🔧
              </button>
              <button
                type="button"
                onClick={randomiseAll}
                className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold text-[#d4eef7] hover:bg-white/20 md:text-sm"
              >
                🎲 Tilfældig
              </button>
            </div>

            <div
              className={`mb-3 overflow-hidden transition-[max-height] duration-300 ease-out ${
                devOpen ? 'max-h-[400px]' : 'max-h-0'
              }`}
            >
              <div className="mb-3 rounded-xl border border-red-400/25 bg-red-500/[0.08] p-3 text-xs text-[#d4eef7]">
                <div className="mb-1.5 font-semibold text-red-300">🔧 DEV: Juster seneste udstyr</div>
                <div className="mb-2 opacity-50">{devTargetLabel}</div>
                <div className="mb-2 flex flex-wrap items-center gap-1">
                  <span className="w-8 text-white/50">X</span>
                  <button type="button" className="rounded-md border border-white/15 bg-white/[0.08] px-2 py-0.5 text-[0.7rem] font-semibold text-[#d4eef7] transition-colors hover:bg-white/20 active:bg-amber-400/15" onClick={() => devNudge('x', -5)}>
                    ◀◀
                  </button>
                  <button type="button" className="rounded-md border border-white/15 bg-white/[0.08] px-2 py-0.5 text-[0.7rem] font-semibold text-[#d4eef7] transition-colors hover:bg-white/20 active:bg-amber-400/15" onClick={() => devNudge('x', -1)}>
                    ◀
                  </button>
                  <span className="min-w-[2.25rem] text-center font-semibold text-amber-200">{devOffset.x}</span>
                  <button type="button" className="rounded-md border border-white/15 bg-white/[0.08] px-2 py-0.5 text-[0.7rem] font-semibold text-[#d4eef7] transition-colors hover:bg-white/20 active:bg-amber-400/15" onClick={() => devNudge('x', 1)}>
                    ▶
                  </button>
                  <button type="button" className="rounded-md border border-white/15 bg-white/[0.08] px-2 py-0.5 text-[0.7rem] font-semibold text-[#d4eef7] transition-colors hover:bg-white/20 active:bg-amber-400/15" onClick={() => devNudge('x', 5)}>
                    ▶▶
                  </button>
                </div>
                <div className="mb-2 flex flex-wrap items-center gap-1">
                  <span className="w-8 text-white/50">Y</span>
                  <button type="button" className="rounded-md border border-white/15 bg-white/[0.08] px-2 py-0.5 text-[0.7rem] font-semibold text-[#d4eef7] transition-colors hover:bg-white/20 active:bg-amber-400/15" onClick={() => devNudge('y', -5)}>
                    ▲▲
                  </button>
                  <button type="button" className="rounded-md border border-white/15 bg-white/[0.08] px-2 py-0.5 text-[0.7rem] font-semibold text-[#d4eef7] transition-colors hover:bg-white/20 active:bg-amber-400/15" onClick={() => devNudge('y', -1)}>
                    ▲
                  </button>
                  <span className="min-w-[2.25rem] text-center font-semibold text-amber-200">{devOffset.y}</span>
                  <button type="button" className="rounded-md border border-white/15 bg-white/[0.08] px-2 py-0.5 text-[0.7rem] font-semibold text-[#d4eef7] transition-colors hover:bg-white/20 active:bg-amber-400/15" onClick={() => devNudge('y', 1)}>
                    ▼
                  </button>
                  <button type="button" className="rounded-md border border-white/15 bg-white/[0.08] px-2 py-0.5 text-[0.7rem] font-semibold text-[#d4eef7] transition-colors hover:bg-white/20 active:bg-amber-400/15" onClick={() => devNudge('y', 5)}>
                    ▼▼
                  </button>
                </div>
                <div className="mb-2 flex flex-wrap items-center gap-1">
                  <span className="w-8 text-white/50">Sk</span>
                  <button type="button" className="rounded-md border border-white/15 bg-white/[0.08] px-2 py-0.5 text-[0.7rem] font-semibold text-[#d4eef7] transition-colors hover:bg-white/20 active:bg-amber-400/15" onClick={() => devScaleStep(-0.1)}>
                    −−
                  </button>
                  <button type="button" className="rounded-md border border-white/15 bg-white/[0.08] px-2 py-0.5 text-[0.7rem] font-semibold text-[#d4eef7] transition-colors hover:bg-white/20 active:bg-amber-400/15" onClick={() => devScaleStep(-0.05)}>
                    −
                  </button>
                  <span className="min-w-[2.25rem] text-center font-semibold text-amber-200">{devScale.toFixed(2)}</span>
                  <button type="button" className="rounded-md border border-white/15 bg-white/[0.08] px-2 py-0.5 text-[0.7rem] font-semibold text-[#d4eef7] transition-colors hover:bg-white/20 active:bg-amber-400/15" onClick={() => devScaleStep(0.05)}>
                    +
                  </button>
                  <button type="button" className="rounded-md border border-white/15 bg-white/[0.08] px-2 py-0.5 text-[0.7rem] font-semibold text-[#d4eef7] transition-colors hover:bg-white/20 active:bg-amber-400/15" onClick={() => devScaleStep(0.1)}>
                    ++
                  </button>
                </div>
                {showDevFootGap ? (
                  <div className="mb-2 flex flex-wrap items-center gap-1 border-t border-dashed border-red-400/20 pt-2">
                    <span className="w-8 text-white/50">Gap</span>
                    <button type="button" className="rounded-md border border-white/15 bg-white/[0.08] px-2 py-0.5 text-[0.7rem] font-semibold text-[#d4eef7] transition-colors hover:bg-white/20 active:bg-amber-400/15" onClick={() => devGapStep(-5)}>
                      ◁◁
                    </button>
                    <button type="button" className="rounded-md border border-white/15 bg-white/[0.08] px-2 py-0.5 text-[0.7rem] font-semibold text-[#d4eef7] transition-colors hover:bg-white/20 active:bg-amber-400/15" onClick={() => devGapStep(-1)}>
                      ◁
                    </button>
                    <span className="min-w-[2.25rem] text-center font-semibold text-amber-200">{devFootGap}</span>
                    <button type="button" className="rounded-md border border-white/15 bg-white/[0.08] px-2 py-0.5 text-[0.7rem] font-semibold text-[#d4eef7] transition-colors hover:bg-white/20 active:bg-amber-400/15" onClick={() => devGapStep(1)}>
                      ▷
                    </button>
                    <button type="button" className="rounded-md border border-white/15 bg-white/[0.08] px-2 py-0.5 text-[0.7rem] font-semibold text-[#d4eef7] transition-colors hover:bg-white/20 active:bg-amber-400/15" onClick={() => devGapStep(5)}>
                      ▷▷
                    </button>
                  </div>
                ) : null}
                <button
                  type="button"
                  title="Klik for at kopiere"
                  onClick={copyDevOutput}
                  className="mb-2 w-full cursor-pointer rounded-md bg-black/30 px-2 py-1.5 text-left font-mono text-[0.65rem] leading-snug text-cyan-300 break-all"
                >
                  {devOutputText}
                </button>
                <button
                  type="button"
                  className="w-full rounded-md border border-white/15 bg-white/[0.08] px-2 py-1.5 text-[0.7rem] font-semibold text-[#d4eef7] transition-colors hover:bg-white/20"
                  onClick={devReset}
                >
                  ↺ Nulstil
                </button>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 items-center justify-center py-2">
              <div
                className="flex h-full min-h-[min(42vh,320px)] w-full max-w-full items-center justify-center overflow-hidden rounded-t-[50%] border-2 border-[#e8d5a3]/30 bg-black/20 p-3 md:min-h-[min(55vh,520px)] md:max-w-[min(100%,420px)] [&_svg]:mx-auto [&_svg]:block [&_svg]:h-auto [&_svg]:max-h-full [&_svg]:w-full [&_svg]:max-w-full"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: svgHtml }}
              />
            </div>
            <CareerStatsBlock variant="mirror" className="mt-4 flex-shrink-0" />
            <button
              type="button"
              onClick={saveAndClose}
              className="mt-4 flex-shrink-0 w-full rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-700 py-3 text-lg font-bold text-white shadow-lg hover:brightness-110"
            >
              Gem
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
