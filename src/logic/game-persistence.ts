import { SAVE_FORMAT_VERSION } from '../data/version.js';
import type { SaveData } from '../types/save.js';
import { useGameStore } from '../store/useGameStore.js';
import { useMathStore } from '../store/useMathStore.js';
import { usePlayerStore } from '../store/usePlayerStore.js';
import { useSaveStore } from '../store/useSaveStore.js';
import { useUIStore } from '../store/useUIStore.js';
import { SAVE_KEY, migrateSave, saveGame } from './save-load.js';

function shallowSame(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const ka = Object.keys(a);
  if (ka.length !== Object.keys(b).length) return false;
  for (const k of ka) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}

function pickMath(s: ReturnType<typeof useMathStore.getState>) {
  return {
    activeOps: s.activeOps,
    mathDifficulty: s.mathDifficulty,
    mathCategory: s.mathCategory,
    selectedFarvand: s.selectedFarvand,
    zenMode: s.zenMode,
    zenSkipDelay: s.zenSkipDelay,
    showNumberPad: s.showNumberPad,
    showSpecialKeys: s.showSpecialKeys,
  } as Record<string, unknown>;
}

function pickUi(s: ReturnType<typeof useUIStore.getState>) {
  return {
    fontSize: s.fontSize,
    uiScale: s.uiScale,
    graphicsQuality: s.graphicsQuality,
    pmremExposure: s.pmremExposure,
    reducedMotion: s.reducedMotion,
    highContrast: s.highContrast,
    colorBlindMode: s.colorBlindMode,
    isMuted: s.isMuted,
  } as Record<string, unknown>;
}

function pickGame(s: ReturnType<typeof useGameStore.getState>) {
  return {
    currentLocation: s.currentLocation,
    weatherType: s.weatherType,
    headlampOn: s.headlampOn,
  } as Record<string, unknown>;
}

/** Serialiserer Zustand-stores til `regnefisken_save` (samme nøgler som legacy hvor muligt). */
export function buildGameSave(): SaveData {
  const p = usePlayerStore.getState();
  const m = useMathStore.getState();
  const u = useUIStore.getState();
  const g = useGameStore.getState();
  return {
    v: SAVE_FORMAT_VERSION,
    _saveFormatVersion: SAVE_FORMAT_VERSION,
    inventory: p.inventory,
    coins: p.coins,
    upgrades: p.upgrades,
    questItems: p.questItems,
    progression: p.progression,
    stats: p.stats,
    completedGoals: p.completedGoals,
    cheeseSources: p.cheeseSources,
    featherSources: p.featherSources,
    activeBait: p.activeBait,
    furniturePositions: p.furniturePositions,
    koedklumpActive: p.koedklumpActive,
    soeuhyreDefeated: p.soeuhyreDefeated,
    hvalbofActive: p.hvalbofActive,
    krakenDefeated: p.krakenDefeated,
    jungleDiscovered: p.jungleDiscovered,
    krakenLoss: p.krakenLoss,
    baitExpiry: p.baitExpiry,
    conchBaitExpiry: p.conchBaitExpiry,
    fossilBaitExpiry: p.fossilBaitExpiry,
    flyBaitExpiry: p.flyBaitExpiry,
    hajBloodExpiry: p.hajBloodExpiry,
    perleLimExpiry: p.perleLimExpiry,
    eggHatchAt: p.eggHatchAt,
    eggCountdown: p.eggCountdown,
    activeOps: m.activeOps,
    mathDifficulty: m.mathDifficulty,
    mathCategory: m.mathCategory === 'fractions' ? 'basic' : m.mathCategory,
    selectedFarvand: m.selectedFarvand,
    zenMode: m.zenMode,
    zenSkipDelay: m.zenSkipDelay,
    showNumberPad: m.showNumberPad,
    showSpecialKeys: m.showSpecialKeys,
    fontSize: u.fontSize,
    uiScale: u.uiScale,
    graphicsQuality: u.graphicsQuality,
    pmremExposure: u.pmremExposure,
    reducedMotion: u.reducedMotion,
    highContrast: u.highContrast,
    colorBlindMode: u.colorBlindMode,
    isMuted: u.isMuted,
    currentLocation: g.currentLocation,
    weatherType: g.weatherType,
    headlampOn: g.headlampOn,
    savedAt: Date.now(),
  } as SaveData;
}

/** Anvender gemt JSON til Zustand (kaldt ved opstart). */
export function applyGameSave(data: SaveData | null): void {
  if (!data || typeof data !== 'object') return;

  const p = usePlayerStore.getState();
  const m = useMathStore.getState();
  const u = useUIStore.getState();
  const g = useGameStore.getState();

  if (Array.isArray((data as { inventory?: unknown }).inventory)) {
    p.setInventory((data as { inventory: typeof p.inventory }).inventory);
  }
  if (typeof (data as { coins?: unknown }).coins === 'number') {
    p.setCoins((data as { coins: number }).coins);
  }
  if (Array.isArray((data as { upgrades?: unknown }).upgrades)) {
    p.setUpgrades((data as { upgrades: string[] }).upgrades);
  }
  if (Array.isArray((data as { questItems?: unknown }).questItems)) {
    p.setQuestItems((data as { questItems: string[] }).questItems);
  }
  if ((data as { progression?: unknown }).progression && typeof (data as { progression: unknown }).progression === 'object') {
    p.setProgression((data as { progression: typeof p.progression }).progression);
  }
  if ((data as { stats?: unknown }).stats && typeof (data as { stats: unknown }).stats === 'object') {
    p.setStats((data as { stats: typeof p.stats }).stats);
  }
  if (Array.isArray((data as { completedGoals?: unknown }).completedGoals)) {
    p.setCompletedGoals((data as { completedGoals: string[] }).completedGoals);
  }
  if (Array.isArray((data as { cheeseSources?: unknown }).cheeseSources)) {
    p.setCheeseSources((data as { cheeseSources: string[] }).cheeseSources);
  }
  if (Array.isArray((data as { featherSources?: unknown }).featherSources)) {
    p.setFeatherSources((data as { featherSources: string[] }).featherSources);
  }
  const ab = (data as { activeBait?: string | null }).activeBait;
  if (ab !== undefined) p.setActiveBait(ab);
  if ((data as { furniturePositions?: unknown }).furniturePositions && typeof (data as { furniturePositions: unknown }).furniturePositions === 'object') {
    p.setFurniturePositions((data as { furniturePositions: typeof p.furniturePositions }).furniturePositions);
  }
  if (typeof (data as { koedklumpActive?: boolean }).koedklumpActive === 'boolean') {
    p.setKoedklumpActive((data as { koedklumpActive: boolean }).koedklumpActive);
  }
  if (typeof (data as { soeuhyreDefeated?: boolean }).soeuhyreDefeated === 'boolean') {
    p.setSoeuhyreDefeated((data as { soeuhyreDefeated: boolean }).soeuhyreDefeated);
  }
  if (typeof (data as { hvalbofActive?: boolean }).hvalbofActive === 'boolean') {
    p.setHvalbofActive((data as { hvalbofActive: boolean }).hvalbofActive);
  }
  if (typeof (data as { krakenDefeated?: boolean }).krakenDefeated === 'boolean') {
    p.setKrakenDefeated((data as { krakenDefeated: boolean }).krakenDefeated);
  }
  if (typeof (data as { jungleDiscovered?: boolean }).jungleDiscovered === 'boolean') {
    p.setJungleDiscovered((data as { jungleDiscovered: boolean }).jungleDiscovered);
  }
  if (typeof (data as { krakenLoss?: number }).krakenLoss === 'number') {
    p.setKrakenLoss((data as { krakenLoss: number }).krakenLoss);
  }
  const num = (x: unknown) => (typeof x === 'number' ? x : undefined);
  const be = num((data as { baitExpiry?: number }).baitExpiry);
  if (be !== undefined) p.setBaitExpiry(be);
  const cbe = num((data as { conchBaitExpiry?: number }).conchBaitExpiry);
  if (cbe !== undefined) p.setConchBaitExpiry(cbe);
  const fbe = num((data as { fossilBaitExpiry?: number }).fossilBaitExpiry);
  if (fbe !== undefined) p.setFossilBaitExpiry(fbe);
  const fly = num((data as { flyBaitExpiry?: number }).flyBaitExpiry);
  if (fly !== undefined) p.setFlyBaitExpiry(fly);
  const hbe = num((data as { hajBloodExpiry?: number }).hajBloodExpiry);
  if (hbe !== undefined) p.setHajBloodExpiry(hbe);
  const ple = num((data as { perleLimExpiry?: number }).perleLimExpiry);
  if (ple !== undefined) p.setPerleLimExpiry(ple);
  const eh = num((data as { eggHatchAt?: number }).eggHatchAt);
  if (eh !== undefined) p.setEggHatchAt(eh);
  if (typeof (data as { eggCountdown?: string }).eggCountdown === 'string') {
    p.setEggCountdown((data as { eggCountdown: string }).eggCountdown);
  }

  const ao = (data as { activeOps?: string[] }).activeOps;
  if (Array.isArray(ao)) {
    const SPECIALS = ['tenfriends', '100friends', 'skaeve100friends'];
    const hasSpecial = ao.find((o) => SPECIALS.includes(o));
    m.setActiveOps(hasSpecial ? [hasSpecial] : ao);
  }
  const md = (data as { mathDifficulty?: string }).mathDifficulty;
  if (md === 'easy') m.setMathDifficulty('beginner');
  else if (md === 'beginner' || md === 'intermediate' || md === 'expert') m.setMathDifficulty(md);
  const mc = (data as { mathCategory?: string }).mathCategory;
  if (mc === 'fractions') m.setMathCategory('basic');
  else if (typeof mc === 'string') m.setMathCategory(mc);
  const sf = (data as { selectedFarvand?: string }).selectedFarvand;
  if (typeof sf === 'string') m.setSelectedFarvand(sf);
  if (typeof (data as { zenMode?: boolean }).zenMode === 'boolean') {
    m.setZenMode((data as { zenMode: boolean }).zenMode);
  }
  const zsd = num((data as { zenSkipDelay?: number }).zenSkipDelay);
  if (zsd !== undefined) m.setZenSkipDelay(zsd);
  if (typeof (data as { showNumberPad?: boolean }).showNumberPad === 'boolean') {
    m.setShowNumberPad((data as { showNumberPad: boolean }).showNumberPad);
  }
  if (typeof (data as { showSpecialKeys?: boolean }).showSpecialKeys === 'boolean') {
    m.setShowSpecialKeys((data as { showSpecialKeys: boolean }).showSpecialKeys);
  }

  const fs = num((data as { fontSize?: number }).fontSize);
  if (fs !== undefined) u.setFontSize(fs);
  const us = num((data as { uiScale?: number }).uiScale);
  if (us !== undefined) u.setUiScale(us);
  const gq = (data as { graphicsQuality?: 'low' | 'medium' | 'high' }).graphicsQuality;
  if (gq) u.setGraphicsQuality(gq);
  const pe = num((data as { pmremExposure?: number }).pmremExposure);
  if (pe !== undefined) {
    u.setPmremExposure(pe);
    if (typeof window !== 'undefined') (window as unknown as { pmremExposure?: number }).pmremExposure = pe;
  }
  if (typeof (data as { reducedMotion?: boolean }).reducedMotion === 'boolean') {
    u.setReducedMotion((data as { reducedMotion: boolean }).reducedMotion);
  }
  if (typeof (data as { highContrast?: boolean }).highContrast === 'boolean') {
    u.setHighContrast((data as { highContrast: boolean }).highContrast);
  }
  const cbm = (data as { colorBlindMode?: string }).colorBlindMode;
  if (cbm === 'none' || cbm === 'deuteranopia' || cbm === 'protanopia' || cbm === 'tritanopia') {
    u.setColorBlindMode(cbm);
  }
  if (typeof (data as { isMuted?: boolean }).isMuted === 'boolean') {
    u.setIsMuted((data as { isMuted: boolean }).isMuted);
  }

  const cl = (data as { currentLocation?: string }).currentLocation;
  if (typeof cl === 'string') g.setCurrentLocation(cl);
  const wt = (data as { weatherType?: string }).weatherType;
  if (typeof wt === 'string') g.setWeatherType(wt);
  if (typeof (data as { headlampOn?: boolean }).headlampOn === 'boolean') {
    g.setHeadlampOn((data as { headlampOn: boolean }).headlampOn);
  }
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let unsubAll: (() => void) | null = null;

export function flushGameSave(): void {
  const payload = buildGameSave();
  saveGame(payload);
  useSaveStore.setState({ lastLoaded: migrateSave(payload) });
}

/** Debounced auto-save når progression ændres (≈ som legacy 800 ms). */
export function startPersistenceSubscription(): () => void {
  if (unsubAll) return unsubAll;
  const schedule = () => {
    if (persistTimer) window.clearTimeout(persistTimer);
    persistTimer = window.setTimeout(() => {
      persistTimer = null;
      flushGameSave();
    }, 650);
  };

  let prevM = pickMath(useMathStore.getState());
  let prevU = pickUi(useUIStore.getState());
  let prevG = pickGame(useGameStore.getState());

  const u1 = usePlayerStore.subscribe(schedule);
  const u2 = useMathStore.subscribe((s) => {
    const next = pickMath(s);
    if (shallowSame(prevM, next)) return;
    prevM = next;
    schedule();
  });
  const u3 = useUIStore.subscribe((s) => {
    const next = pickUi(s);
    if (shallowSame(prevU, next)) return;
    prevU = next;
    schedule();
  });
  const u4 = useGameStore.subscribe((s) => {
    const next = pickGame(s);
    if (shallowSame(prevG, next)) return;
    prevG = next;
    schedule();
  });

  unsubAll = () => {
    u1();
    u2();
    u3();
    u4();
    if (persistTimer) window.clearTimeout(persistTimer);
    persistTimer = null;
    unsubAll = null;
  };
  return unsubAll;
}

/** Kør synkron ved app-opstart (før første React-render). */
export function bootstrapPersistence(): void {
  if (typeof localStorage === 'undefined') {
    useSaveStore.setState({ lastLoaded: null, hydrated: true });
    startPersistenceSubscription();
    return;
  }
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) {
    useSaveStore.setState({ lastLoaded: null, hydrated: true });
    startPersistenceSubscription();
    return;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    useSaveStore.setState({ lastLoaded: null, hydrated: true });
    startPersistenceSubscription();
    return;
  }
  const o = parsed as Record<string, unknown>;
  const savedFmt =
    typeof o._saveFormatVersion === 'number'
      ? o._saveFormatVersion
      : typeof o.v === 'number'
        ? o.v
        : 0;
  if (savedFmt < SAVE_FORMAT_VERSION) {
    useUIStore.getState().setNeedsReset(true);
    useSaveStore.setState({ lastLoaded: migrateSave(parsed), hydrated: true });
    startPersistenceSubscription();
    return;
  }
  const data = migrateSave(parsed);
  applyGameSave(data);
  useSaveStore.setState({ lastLoaded: data, hydrated: true });
  startPersistenceSubscription();
}
