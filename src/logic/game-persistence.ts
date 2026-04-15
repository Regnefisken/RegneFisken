import { SAVE_FORMAT_VERSION } from '../data/version.js';
import type { SaveData } from '../types/save.js';
import { useCollectionStore, type WishId } from '../store/useCollectionStore.js';
import { useGameStore } from '../store/useGameStore.js';
import { useMathStore } from '../store/useMathStore.js';
import { defaultAvatarSaveState, usePlayerStore } from '../store/usePlayerStore.js';
import { useSaveStore } from '../store/useSaveStore.js';
import type { GraphicsQuality } from '../types/game.js';
import { useUIStore } from '../store/useUIStore.js';
import { startGoalProgressSubscription } from './goal-progress.js';
import { emptyStats } from './xp-engine.js';
import { SAVE_KEY, migrateSave, saveGame } from './save-load.js';
import type { RoomId } from '../data/furnitureShopItems.js';

const ROOM_IDS: RoomId[] = ['living', 'kitchen', 'bedroom'];

/** Tidligere `kitchen_chair` er erstattet af `gulvplante`; migrer gemte nøgler. */
function migrateKitchenChairToGulvplante(): void {
  usePlayerStore.setState((s) => {
    const hadChairUnlock = s.unlockedFurniture.includes('kitchen_chair');
    let unlockedFurniture = s.unlockedFurniture.filter((x) => x !== 'kitchen_chair');
    if (hadChairUnlock && !unlockedFurniture.includes('gulvplante')) {
      unlockedFurniture = [...unlockedFurniture, 'gulvplante'];
    }

    const furniturePositions = { ...s.furniturePositions };
    if (furniturePositions.kitchen_chair !== undefined) {
      const prev = furniturePositions.kitchen_chair;
      delete furniturePositions.kitchen_chair;
      if (furniturePositions.gulvplante === undefined) {
        furniturePositions.gulvplante = prev;
      }
    }

    const furnitureRoomAssignment = { ...s.furnitureRoomAssignment };
    if (furnitureRoomAssignment.kitchen_chair !== undefined) {
      const prev = furnitureRoomAssignment.kitchen_chair;
      delete furnitureRoomAssignment.kitchen_chair;
      if (furnitureRoomAssignment.gulvplante === undefined) {
        furnitureRoomAssignment.gulvplante = prev;
      }
    }

    const hiddenFurniture = [
      ...new Set(s.hiddenFurniture.map((h) => (h === 'kitchen_chair' ? 'gulvplante' : h))),
    ];

    return {
      unlockedFurniture,
      furniturePositions,
      furnitureRoomAssignment,
      hiddenFurniture,
    };
  });
}

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
    activeMathTypes: s.activeMathTypes,
    typeOps: s.typeOps,
    mathDifficulty: s.mathDifficulty,
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
    fontSizeMobile: s.fontSizeMobile,
    uiScale: s.uiScale,
    graphicsQuality: s.graphicsQuality,
    pmremExposure: s.pmremExposure,
    skyExposure: s.skyExposure,
    reducedMotion: s.reducedMotion,
    highContrast: s.highContrast,
    colorBlindMode: s.colorBlindMode,
    graphicsAutoDetected: s.graphicsAutoDetected,
    autoQualityEnabled: s.autoQualityEnabled,
    ultraBloomEnabled: s.ultraBloomEnabled,
    showInGameFps: s.showInGameFps,
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

function pickPlayer(s: ReturnType<typeof usePlayerStore.getState>) {
  return {
    inventory: s.inventory,
    coins: s.coins,
    upgrades: s.upgrades,
    questItems: s.questItems,
    progression: s.progression,
    stats: s.stats,
    completedGoals: s.completedGoals,
    cheeseSources: s.cheeseSources,
    featherSources: s.featherSources,
    activeBait: s.activeBait,
    furniturePositions: s.furniturePositions,
    unlockedFurniture: s.unlockedFurniture,
    hiddenFurniture: s.hiddenFurniture,
    furnitureRoomAssignment: s.furnitureRoomAssignment,
    koedklumpActive: s.koedklumpActive,
    soeuhyreDefeated: s.soeuhyreDefeated,
    hvalbofActive: s.hvalbofActive,
    krakenDefeated: s.krakenDefeated,
    jungleDiscovered: s.jungleDiscovered,
    krakenLoss: s.krakenLoss,
    ownedWardrobeItemIds: s.ownedWardrobeItemIds,
    avatar: s.avatar,
    hasSeenWardrobeIntro: s.hasSeenWardrobeIntro,
    totalSuccessfulCatches: s.totalSuccessfulCatches,
    baitExpiry: s.baitExpiry,
    conchBaitExpiry: s.conchBaitExpiry,
    fossilBaitExpiry: s.fossilBaitExpiry,
    flyBaitExpiry: s.flyBaitExpiry,
    hajBloodExpiry: s.hajBloodExpiry,
    perleLimExpiry: s.perleLimExpiry,
    eggHatchAt: s.eggHatchAt,
    eggCountdown: s.eggCountdown,
    eggLeftTimestamp: s.eggLeftTimestamp,
    wildTurtleSpawned: s.wildTurtleSpawned,
  } as Record<string, unknown>;
}

function pickCollection(s: ReturnType<typeof useCollectionStore.getState>) {
  return {
    hasVisitedCabin: s.hasVisitedCabin,
    hasVisitedCabinKitchen: s.hasVisitedCabinKitchen,
    hasVisitedCabinBedroom: s.hasVisitedCabinBedroom,
    hasGoldenFrog: s.hasGoldenFrog,
    goldenFrogCount: s.goldenFrogCount,
    unlockedCompanions: s.unlockedCompanions,
    helleflynderCaught: s.helleflynderCaught,
    collectibleInventory: s.collectibleInventory,
    collectibleDelivered: s.collectibleDelivered,
    usedWishes: s.usedWishes,
    hasMonkeyOnPier: s.hasMonkeyOnPier,
    hasHeartBalloon: s.hasHeartBalloon,
    balloonPopped: s.balloonPopped,
    balloonCurrentHideout: s.balloonCurrentHideout,
  } as Record<string, unknown>;
}

/**
 * Serialiserer Zustand til `regnefisken_save`.
 * Lokation, vejr og pandelampe persisteres ikke (session-entry sætter molen + klart vejr ved load).
 */
export function buildGameSave(): SaveData {
  const p = usePlayerStore.getState();
  const m = useMathStore.getState();
  const u = useUIStore.getState();
  const c = useCollectionStore.getState();
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
    unlockedFurniture: p.unlockedFurniture,
    hiddenFurniture: p.hiddenFurniture,
    furnitureRoomAssignment: p.furnitureRoomAssignment,
    koedklumpActive: p.koedklumpActive,
    soeuhyreDefeated: p.soeuhyreDefeated,
    hvalbofActive: p.hvalbofActive,
    krakenDefeated: p.krakenDefeated,
    jungleDiscovered: p.jungleDiscovered,
    krakenLoss: p.krakenLoss,
    ownedWardrobeItemIds: p.ownedWardrobeItemIds,
    avatar: p.avatar,
    hasSeenWardrobeIntro: p.hasSeenWardrobeIntro,
    totalSuccessfulCatches: p.totalSuccessfulCatches,
    baitExpiry: p.baitExpiry,
    conchBaitExpiry: p.conchBaitExpiry,
    fossilBaitExpiry: p.fossilBaitExpiry,
    flyBaitExpiry: p.flyBaitExpiry,
    hajBloodExpiry: p.hajBloodExpiry,
    perleLimExpiry: p.perleLimExpiry,
    eggHatchAt: p.eggHatchAt,
    eggCountdown: p.eggCountdown,
    eggLeftTimestamp: p.eggLeftTimestamp,
    wildTurtleSpawned: p.wildTurtleSpawned,
    activeMathTypes: m.activeMathTypes,
    typeOps: m.typeOps,
    mathDifficulty: m.mathDifficulty,
    selectedFarvand: m.selectedFarvand,
    zenMode: m.zenMode,
    zenSkipDelay: m.zenSkipDelay,
    showNumberPad: m.showNumberPad,
    showSpecialKeys: m.showSpecialKeys,
    fontSize: u.fontSize,
    fontSizeMobile: u.fontSizeMobile,
    uiScale: u.uiScale,
    graphicsQuality: u.graphicsQuality,
    pmremExposure: u.pmremExposure,
    skyExposure: u.skyExposure,
    reducedMotion: u.reducedMotion,
    highContrast: u.highContrast,
    colorBlindMode: u.colorBlindMode,
    graphicsAutoDetected: u.graphicsAutoDetected,
    autoQualityEnabled: u.autoQualityEnabled,
    ultraBloomEnabled: u.ultraBloomEnabled,
    showInGameFps: u.showInGameFps,
    isMuted: u.isMuted,
    hasVisitedCabin: c.hasVisitedCabin,
    hasVisitedCabinKitchen: c.hasVisitedCabinKitchen,
    hasVisitedCabinBedroom: c.hasVisitedCabinBedroom,
    hasGoldenFrog: c.hasGoldenFrog,
    goldenFrogCount: c.goldenFrogCount,
    unlockedCompanions: c.unlockedCompanions,
    helleflynderCaught: c.helleflynderCaught,
    collectibleInventory: c.collectibleInventory,
    collectibleDelivered: c.collectibleDelivered,
    usedWishes: c.usedWishes,
    hasMonkeyOnPier: c.hasMonkeyOnPier,
    hasHeartBalloon: c.hasHeartBalloon,
    balloonPopped: c.balloonPopped,
    balloonCurrentHideout: c.balloonCurrentHideout,
    savedAt: Date.now(),
  } as SaveData;
}

/**
 * Efter hydrering fra save: altid Den Gamle Mole og klart vejr.
 * Lokation/vejr/lampe persisteres ikke — legacy-nøgler i gamle filer ignoreres ved load.
 */
function applySessionEntryState(): void {
  const g = useGameStore.getState();
  g.setCurrentLocation('pier');
  g.resetWeatherForTravel(false);
}

/** Anvender gemt JSON til Zustand (kaldt ved opstart). */
export function applyGameSave(data: SaveData | null): void {
  if (!data || typeof data !== 'object') return;

  const p = usePlayerStore.getState();
  const m = useMathStore.getState();
  const u = useUIStore.getState();

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
    const loaded = data as { stats: Record<string, unknown> };
    p.setStats({ ...emptyStats(), ...loaded.stats } as typeof p.stats);
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
  {
    /* Købt papegøjefjer i butikken satte feather_bought i upgrades men tilføjede ikke 'shop' i featherSources. */
    const st = usePlayerStore.getState();
    if (st.upgrades.includes('feather_bought') && !st.featherSources.includes('shop')) {
      p.setFeatherSources([...st.featherSources, 'shop']);
    }
  }
  const ab = (data as { activeBait?: string | null }).activeBait;
  if (ab === 'biolum_floats') {
    /* Legacy: Selvlysende Prop blev fejlagtigt gemt som "aktiv madding" — skal ligge i upgrades. */
    p.setActiveBait(null);
    p.setUpgrades((u) => (u.includes('biolum_floats') ? u : [...u, 'biolum_floats']));
  } else if (ab !== undefined) {
    p.setActiveBait(ab);
  }
  if ((data as { furniturePositions?: unknown }).furniturePositions && typeof (data as { furniturePositions: unknown }).furniturePositions === 'object') {
    p.setFurniturePositions((data as { furniturePositions: typeof p.furniturePositions }).furniturePositions);
  }
  const ufu = (data as { unlockedFurniture?: unknown }).unlockedFurniture;
  if (Array.isArray(ufu) && ufu.every((x) => typeof x === 'string')) {
    usePlayerStore.setState({ unlockedFurniture: ufu });
  }
  const hfu = (data as { hiddenFurniture?: unknown }).hiddenFurniture;
  if (Array.isArray(hfu) && hfu.every((x) => typeof x === 'string')) {
    usePlayerStore.setState({ hiddenFurniture: hfu });
  }
  const fra = (data as { furnitureRoomAssignment?: unknown }).furnitureRoomAssignment;
  if (fra && typeof fra === 'object' && !Array.isArray(fra)) {
    const next: Record<string, RoomId> = {};
    for (const [k, v] of Object.entries(fra as Record<string, unknown>)) {
      if (typeof v === 'string' && ROOM_IDS.includes(v as RoomId)) {
        next[k] = v as RoomId;
      }
    }
    usePlayerStore.setState({ furnitureRoomAssignment: next });
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
  const owi = (data as { ownedWardrobeItemIds?: unknown }).ownedWardrobeItemIds;
  if (Array.isArray(owi) && owi.every((x) => typeof x === 'string')) {
    usePlayerStore.setState({ ownedWardrobeItemIds: owi });
  }
  const av = (data as { avatar?: unknown }).avatar;
  if (
    av &&
    typeof av === 'object' &&
    av !== null &&
    typeof (av as { skinTone?: unknown }).skinTone === 'string'
  ) {
    const a = av as Record<string, unknown>;
    const equipped = a.equipped;
    const eq =
      equipped && typeof equipped === 'object' && !Array.isArray(equipped)
        ? (equipped as Record<string, string>)
        : {};
    const held = a.heldItems;
    const heldItems = Array.isArray(held) && held.every((x) => typeof x === 'string') ? (held as string[]) : [];
    usePlayerStore.setState({
      avatar: {
        skinTone: a.skinTone as string,
        hairColor: typeof a.hairColor === 'string' ? a.hairColor : defaultAvatarSaveState().hairColor,
        hairStyle: typeof a.hairStyle === 'string' ? a.hairStyle : defaultAvatarSaveState().hairStyle,
        eyeStyle: typeof a.eyeStyle === 'string' ? a.eyeStyle : defaultAvatarSaveState().eyeStyle,
        equipped: eq,
        heldItems,
        pet: typeof a.pet === 'string' || a.pet === null ? (a.pet as string | null) : null,
      },
    });
  }
  if (typeof (data as { hasSeenWardrobeIntro?: boolean }).hasSeenWardrobeIntro === 'boolean') {
    p.setHasSeenWardrobeIntro((data as { hasSeenWardrobeIntro: boolean }).hasSeenWardrobeIntro);
  }
  const tsc = (data as { totalSuccessfulCatches?: unknown }).totalSuccessfulCatches;
  if (typeof tsc === 'number' && tsc >= 0 && Number.isFinite(tsc)) {
    p.setTotalSuccessfulCatches(Math.floor(tsc));
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
  const rawElt = (data as { eggLeftTimestamp?: number | null }).eggLeftTimestamp;
  if (rawElt === null) p.setEggLeftTimestamp(null);
  else if (typeof rawElt === 'number') p.setEggLeftTimestamp(rawElt);
  if (typeof (data as { wildTurtleSpawned?: boolean }).wildTurtleSpawned === 'boolean') {
    p.setWildTurtleSpawned((data as { wildTurtleSpawned: boolean }).wildTurtleSpawned);
  }

  const amt = (data as { activeMathTypes?: string[] }).activeMathTypes;
  if (Array.isArray(amt) && amt.length > 0 && amt.every((x) => typeof x === 'string')) {
    m.setActiveMathTypes(amt);
  }
  const to = (data as { typeOps?: Record<string, unknown> }).typeOps;
  if (to && typeof to === 'object' && !Array.isArray(to)) {
    const next: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(to)) {
      if (Array.isArray(v) && v.every((x) => typeof x === 'string')) next[k] = v as string[];
    }
    if (Object.keys(next).length > 0) m.setTypeOps(next);
  }
  const md = (data as { mathDifficulty?: string }).mathDifficulty;
  if (md === 'easy') m.setMathDifficulty('beginner');
  else if (md === 'beginner' || md === 'intermediate' || md === 'expert') m.setMathDifficulty(md);
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
  const fsm = num((data as { fontSizeMobile?: number }).fontSizeMobile);
  if (fsm !== undefined) u.setFontSizeMobile(fsm);
  const us = num((data as { uiScale?: number }).uiScale);
  if (us !== undefined) u.setUiScale(us);
  const gq = (data as { graphicsQuality?: GraphicsQuality }).graphicsQuality;
  if (gq === 'low' || gq === 'medium' || gq === 'high' || gq === 'ultra') u.setGraphicsQuality(gq);
  const pe = num((data as { pmremExposure?: number }).pmremExposure);
  if (pe !== undefined) {
    u.setPmremExposure(pe);
    if (typeof window !== 'undefined') (window as unknown as { pmremExposure?: number }).pmremExposure = pe;
  }
  const se = num((data as { skyExposure?: number }).skyExposure);
  if (se !== undefined) u.setSkyExposure(se);
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
  const gad = (data as { graphicsAutoDetected?: boolean }).graphicsAutoDetected;
  if (typeof gad === 'boolean') {
    u.setGraphicsAutoDetected(gad);
  } else {
    u.setGraphicsAutoDetected(true);
  }
  const aqe = (data as { autoQualityEnabled?: boolean }).autoQualityEnabled;
  if (typeof aqe === 'boolean') {
    u.setAutoQualityEnabled(aqe);
  } else {
    u.setAutoQualityEnabled(true);
  }
  const ube = (data as { ultraBloomEnabled?: boolean }).ultraBloomEnabled;
  if (typeof ube === 'boolean') {
    u.setUltraBloomEnabled(ube);
  } else {
    u.setUltraBloomEnabled(false);
  }
  const sigf = (data as { showInGameFps?: boolean }).showInGameFps;
  if (typeof sigf === 'boolean') {
    u.setShowInGameFps(sigf);
  } else {
    u.setShowInGameFps(false);
  }
  if (typeof (data as { isMuted?: boolean }).isMuted === 'boolean') {
    u.setIsMuted((data as { isMuted: boolean }).isMuted);
  }

  if (typeof (data as { hasVisitedCabin?: boolean }).hasVisitedCabin === 'boolean') {
    useCollectionStore
      .getState()
      .setHasVisitedCabin((data as { hasVisitedCabin: boolean }).hasVisitedCabin);
  }
  if (typeof (data as { hasVisitedCabinKitchen?: boolean }).hasVisitedCabinKitchen === 'boolean') {
    useCollectionStore
      .getState()
      .setHasVisitedCabinKitchen(
        (data as { hasVisitedCabinKitchen: boolean }).hasVisitedCabinKitchen,
      );
  }
  if (typeof (data as { hasVisitedCabinBedroom?: boolean }).hasVisitedCabinBedroom === 'boolean') {
    useCollectionStore
      .getState()
      .setHasVisitedCabinBedroom(
        (data as { hasVisitedCabinBedroom: boolean }).hasVisitedCabinBedroom,
      );
  }
  if (typeof (data as { hasGoldenFrog?: boolean }).hasGoldenFrog === 'boolean') {
    useCollectionStore.getState().setHasGoldenFrog((data as { hasGoldenFrog: boolean }).hasGoldenFrog);
  }
  const gfc = (data as { goldenFrogCount?: unknown }).goldenFrogCount;
  if (typeof gfc === 'number' && gfc >= 0 && Number.isFinite(gfc)) {
    useCollectionStore.getState().setGoldenFrogCount(Math.floor(gfc));
  }
  const uc = (data as { unlockedCompanions?: unknown }).unlockedCompanions;
  if (Array.isArray(uc) && uc.every((x) => typeof x === 'string')) {
    useCollectionStore.getState().setUnlockedCompanions(uc as string[]);
  }
  const hf = (data as { helleflynderCaught?: unknown }).helleflynderCaught;
  if (typeof hf === 'number' && hf >= 0 && Number.isFinite(hf)) {
    useCollectionStore.getState().setHelleflynderCaught(Math.floor(hf));
  }
  const uw = (data as { usedWishes?: unknown }).usedWishes;
  if (Array.isArray(uw)) {
    const valid: WishId[] = ['friend', 'love', 'wealth'];
    const next = uw.filter((x): x is WishId => typeof x === 'string' && valid.includes(x as WishId));
    if (next.length > 0 || uw.length === 0) {
      useCollectionStore.getState().setUsedWishes(next);
    }
  }
  if (typeof (data as { hasMonkeyOnPier?: boolean }).hasMonkeyOnPier === 'boolean') {
    useCollectionStore.getState().setHasMonkeyOnPier((data as { hasMonkeyOnPier: boolean }).hasMonkeyOnPier);
  }
  if (typeof (data as { hasHeartBalloon?: boolean }).hasHeartBalloon === 'boolean') {
    useCollectionStore.getState().setHasHeartBalloon((data as { hasHeartBalloon: boolean }).hasHeartBalloon);
  }
  if (typeof (data as { balloonPopped?: boolean }).balloonPopped === 'boolean') {
    useCollectionStore.getState().setBalloonPopped((data as { balloonPopped: boolean }).balloonPopped);
  }
  const bch = (data as { balloonCurrentHideout?: string | null }).balloonCurrentHideout;
  if (bch === null || typeof bch === 'string') {
    useCollectionStore.getState().setBalloonCurrentHideout(
      bch === 'fishing_cabin' ? 'cabin_living' : bch,
    );
  }

  const ci = (data as { collectibleInventory?: unknown }).collectibleInventory;
  if (ci && typeof ci === 'object' && ci !== null && !Array.isArray(ci)) {
    const o = ci as Record<string, unknown>;
    const d0 = { fossilCount: 0, conchCount: 0, pearlCount: 0, sardineCount: 0 };
    useCollectionStore.getState().setCollectibleInventory({
      fossilCount:
        typeof o.fossilCount === 'number' ? Math.max(0, Math.floor(o.fossilCount)) : d0.fossilCount,
      conchCount:
        typeof o.conchCount === 'number' ? Math.max(0, Math.floor(o.conchCount)) : d0.conchCount,
      pearlCount:
        typeof o.pearlCount === 'number' ? Math.max(0, Math.floor(o.pearlCount)) : d0.pearlCount,
      sardineCount:
        typeof o.sardineCount === 'number' ? Math.max(0, Math.floor(o.sardineCount)) : d0.sardineCount,
    });
  }
  const cd = (data as { collectibleDelivered?: unknown }).collectibleDelivered;
  if (cd && typeof cd === 'object' && cd !== null && !Array.isArray(cd)) {
    const o = cd as Record<string, unknown>;
    const d0 = { fossil: 0, conch: 0, pearl: 0, sardine: 0 };
    useCollectionStore.getState().setCollectibleDelivered({
      fossil: typeof o.fossil === 'number' ? Math.max(0, Math.floor(o.fossil)) : d0.fossil,
      conch: typeof o.conch === 'number' ? Math.max(0, Math.floor(o.conch)) : d0.conch,
      pearl: typeof o.pearl === 'number' ? Math.max(0, Math.floor(o.pearl)) : d0.pearl,
      sardine: typeof o.sardine === 'number' ? Math.max(0, Math.floor(o.sardine)) : d0.sardine,
    });
  }

  const col = useCollectionStore.getState();
  if (col.usedWishes.includes('friend') || col.unlockedCompanions.includes('monkey')) {
    col.setHasMonkeyOnPier(true);
  }
  if (col.hasHeartBalloon && col.balloonCurrentHideout == null) {
    col.setBalloonCurrentHideout('pier');
  }

  migrateKitchenChairToGulvplante();
  applySessionEntryState();
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
  let prevP = pickPlayer(usePlayerStore.getState());
  let prevC = pickCollection(useCollectionStore.getState());

  const u1 = usePlayerStore.subscribe((s) => {
    const next = pickPlayer(s);
    if (shallowSame(prevP, next)) return;
    prevP = next;
    schedule();
  });
  const u1b = useCollectionStore.subscribe((s) => {
    const next = pickCollection(s);
    if (shallowSame(prevC, next)) return;
    prevC = next;
    schedule();
  });
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
    u1b();
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
    startGoalProgressSubscription();
    return;
  }
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) {
    useSaveStore.setState({ lastLoaded: null, hydrated: true });
    startPersistenceSubscription();
    startGoalProgressSubscription();
    return;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    useSaveStore.setState({ lastLoaded: null, hydrated: true });
    startPersistenceSubscription();
    startGoalProgressSubscription();
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
    const preserveKeys = [
      'isMuted',
      'fontSize',
      'fontSizeMobile',
      'uiScale',
      'graphicsQuality',
      'reducedMotion',
      'highContrast',
      'colorBlindMode',
    ] as const;
    const preserved: Record<string, unknown> = {};
    for (const key of preserveKeys) {
      if (o[key] !== undefined) preserved[key] = o[key];
    }

    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem('regnefisken_gpu_bench');
    localStorage.removeItem('regnefisken_jungle_orientation_hint_dismissed');

    const u = useUIStore.getState();
    if (typeof preserved.isMuted === 'boolean') u.setIsMuted(preserved.isMuted);
    if (typeof preserved.fontSize === 'number') u.setFontSize(preserved.fontSize);
    if (typeof preserved.fontSizeMobile === 'number') u.setFontSizeMobile(preserved.fontSizeMobile);
    if (typeof preserved.uiScale === 'number') u.setUiScale(preserved.uiScale);
    if (typeof preserved.reducedMotion === 'boolean') u.setReducedMotion(preserved.reducedMotion);
    if (typeof preserved.highContrast === 'boolean') u.setHighContrast(preserved.highContrast);
    const gq = preserved.graphicsQuality;
    if (gq === 'low' || gq === 'medium' || gq === 'high' || gq === 'ultra') u.setGraphicsQuality(gq);
    const cbm = preserved.colorBlindMode;
    if (cbm === 'none' || cbm === 'deuteranopia' || cbm === 'protanopia' || cbm === 'tritanopia') {
      u.setColorBlindMode(cbm);
    }

    u.setNeedsReset(true);
    useSaveStore.setState({ lastLoaded: null, hydrated: true });
    startPersistenceSubscription();
    startGoalProgressSubscription();
    return;
  }
  const data = migrateSave(parsed);
  applyGameSave(data);
  useSaveStore.setState({ lastLoaded: data, hydrated: true });
  startPersistenceSubscription();
  startGoalProgressSubscription();
}
