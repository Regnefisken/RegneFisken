import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SAVE_FORMAT_VERSION } from '../src/data/version.js';
import {
  applyGameSave,
  bootstrapPersistence,
  buildGameSave,
  flushGameSave,
  startPersistenceSubscription,
} from '../src/logic/game-persistence.js';
import { startGoalProgressSubscription } from '../src/logic/goal-progress.js';
import { SAVE_KEY, loadGame, migrateSave, saveGame } from '../src/logic/save-load.js';
import { emptyStats } from '../src/logic/xp-engine.js';
import { useCollectionStore } from '../src/store/useCollectionStore.js';
import { useGameStore } from '../src/store/useGameStore.js';
import { useMathStore } from '../src/store/useMathStore.js';
import { usePlayerStore } from '../src/store/usePlayerStore.js';
import { useSaveStore } from '../src/store/useSaveStore.js';
import { useUIStore } from '../src/store/useUIStore.js';
import type { SaveData } from '../src/types/save.js';

/** Lyd kræver en browser; mål-systemet afspiller lyd, når et mål nås. */
vi.mock('../src/audio/audioEngine.js');

class MemoryStorage {
  private map = new Map<string, string>();
  getItem(k: string): string | null {
    return this.map.has(k) ? this.map.get(k)! : null;
  }
  setItem(k: string, v: string): void {
    this.map.set(k, String(v));
  }
  removeItem(k: string): void {
    this.map.delete(k);
  }
  clear(): void {
    this.map.clear();
  }
}

const STORES = [
  usePlayerStore,
  useMathStore,
  useUIStore,
  useCollectionStore,
  useGameStore,
  useSaveStore,
] as const;

function resetStores(): void {
  for (const store of STORES) {
    (store as unknown as { setState: (s: unknown, replace: true) => void }).setState(
      store.getInitialState(),
      true,
    );
  }
}

function stopSubscriptions(): void {
  startPersistenceSubscription()();
  startGoalProgressSubscription()();
}

let storage: MemoryStorage;

beforeEach(() => {
  storage = new MemoryStorage();
  vi.stubGlobal('localStorage', storage);
  /** Auto-gem bruger `window.setTimeout`; i Node peger vi `window` på det globale objekt. */
  vi.stubGlobal('window', globalThis);
  vi.useFakeTimers();
  resetStores();
});

afterEach(() => {
  stopSubscriptions();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** Simulerer at spillet lukkes og åbnes igen: gem → JSON → nulstil → indlæs. */
function saveAndReload(): SaveData {
  const json = JSON.stringify(buildGameSave());
  resetStores();
  const data = migrateSave(JSON.parse(json));
  applyGameSave(data);
  return data;
}

describe('migrateSave', () => {
  it('giver et tomt gem med aktuel version for ugyldigt input', () => {
    for (const bad of [null, undefined, 42, 'tekst', true]) {
      expect(migrateSave(bad)).toEqual({ version: SAVE_FORMAT_VERSION });
    }
  });

  it('bevarer alle felter og stempler aktuel version', () => {
    const out = migrateSave({ coins: 12, upgrades: ['magnet'], version: 3 });
    expect(out).toEqual({ coins: 12, upgrades: ['magnet'], version: SAVE_FORMAT_VERSION });
  });

  it('ændrer ikke det objekt, der sendes ind', () => {
    const input = { coins: 5, version: 1 };
    migrateSave(input);
    expect(input).toEqual({ coins: 5, version: 1 });
  });
});

describe('saveGame / loadGame', () => {
  it('returnerer null når der ikke er gemt noget', () => {
    expect(loadGame()).toBeNull();
  });

  it('gemmer under den faste nøgle og kan læse det samme tilbage', () => {
    saveGame({ coins: 77, questItems: ['map_left'] });
    expect(storage.getItem(SAVE_KEY)).not.toBeNull();
    expect(loadGame()).toEqual({
      coins: 77,
      questItems: ['map_left'],
      version: SAVE_FORMAT_VERSION,
    });
  });

  it('returnerer null i stedet for at fejle på ødelagt JSON', () => {
    storage.setItem(SAVE_KEY, '{"coins": 12, "upg');
    expect(loadGame()).toBeNull();
  });

  it('fejler ikke uden localStorage', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(loadGame()).toBeNull();
    expect(() => saveGame({ coins: 1 })).not.toThrow();
  });
});

describe('buildGameSave', () => {
  it('stempler formatversionen og kan laves til JSON', () => {
    const save = buildGameSave();
    expect(save.v).toBe(SAVE_FORMAT_VERSION);
    expect(save._saveFormatVersion).toBe(SAVE_FORMAT_VERSION);
    expect(() => JSON.stringify(save)).not.toThrow();
    expect(JSON.parse(JSON.stringify(save))).toEqual(save);
  });

  it('gemmer ikke lokation og vejr (spillet starter altid på molen)', () => {
    useGameStore.getState().setCurrentLocation('abyss');
    const save = buildGameSave();
    expect(save).not.toHaveProperty('currentLocation');
    expect(save).not.toHaveProperty('weatherType');
  });
});

describe('gem og genindlæs — intet går tabt', () => {
  it('spillerens fremskridt overlever', () => {
    const inventory = [
      {
        id: 'abc',
        fishModelId: 'fisk_torsk',
        species: 'Torsk',
        weight: 2.4,
        value: 30,
        rarity: 'Almindelig',
        color: 0x8faab3,
        itemType: 'fish',
      },
    ];
    const stats = { ...emptyStats(), totalCatches: 41, bossWins: 2, areasVisited: ['pier', 'abyss'] };
    const avatar = {
      skinTone: 'dark',
      hairColor: 'red',
      hairStyle: 'long',
      eyeStyle: 'happy',
      equipped: { hat: 'pirate_hat' },
      heldItems: ['rod'],
      pet: 'cat',
    };
    const expected = {
      inventory,
      coins: 1234,
      upgrades: ['rod_havblaa', 'magnet', 'travel_pass'],
      questItems: ['map_left', 'cabin_key'],
      progression: { level: 9, xp: 310 },
      stats,
      completedGoals: ['first_catch'],
      cheeseSources: ['pier'],
      featherSources: ['forbidden'],
      activeBait: 'bait',
      furniturePositions: { sofa: { x: 1, y: 0, z: -2, rot: 1.5 } },
      unlockedFurniture: ['sofa', 'gulvplante'],
      hiddenFurniture: ['sofa'],
      furnitureRoomAssignment: { sofa: 'kitchen' as const },
      koedklumpActive: true,
      soeuhyreDefeated: true,
      hvalbofActive: true,
      krakenDefeated: true,
      jungleDiscovered: true,
      krakenLoss: 3,
      ownedWardrobeItemIds: ['hat_1', 'shirt_2'],
      avatar,
      hasSeenWardrobeIntro: true,
      totalSuccessfulCatches: 55,
      pierGoldenHintUnlocked: true,
      baitExpiry: 111,
      conchBaitExpiry: 222,
      fossilBaitExpiry: 333,
      flyBaitExpiry: 444,
      hajBloodExpiry: 555,
      perleLimExpiry: 666,
      eggHatchAt: 777,
      eggCountdown: '02:10',
      eggLeftTimestamp: 888,
      wildTurtleSpawned: true,
    };
    usePlayerStore.setState(expected);

    saveAndReload();

    const after = usePlayerStore.getState() as unknown as Record<string, unknown>;
    for (const [key, value] of Object.entries(expected)) {
      expect(after[key], key).toEqual(value);
    }
  });

  it('matematik-indstillinger overlever', () => {
    const expected = {
      activeMathTypes: ['gange', 'division', 'decimals'],
      typeOps: { regnehistorier: ['+', '-'] },
      mathDifficulty: 'expert' as const,
      selectedFarvand: 'dybet',
      zenMode: true,
      zenSkipDelay: 25,
      showNumberPad: false,
      numpadAscendingLayout: false,
      showSpecialKeys: true,
    };
    useMathStore.setState(expected);

    saveAndReload();

    const after = useMathStore.getState() as unknown as Record<string, unknown>;
    for (const [key, value] of Object.entries(expected)) {
      expect(after[key], key).toEqual(value);
    }
  });

  it('skærm- og tilgængelighedsindstillinger overlever', () => {
    const expected = {
      uiMode: 'mobile' as const,
      fontSize: 22,
      fontSizeMobile: 17,
      uiScale: 1.25,
      graphicsQuality: 'low' as const,
      pmremExposure: 0.7,
      skyExposure: 0.4,
      reducedMotion: true,
      highContrast: true,
      colorBlindMode: 'protanopia' as const,
      graphicsAutoDetected: false,
      autoQualityEnabled: false,
      ultraBloomEnabled: true,
      showInGameFps: true,
      isMuted: true,
    };
    useUIStore.setState(expected);

    saveAndReload();

    const after = useUIStore.getState() as unknown as Record<string, unknown>;
    for (const [key, value] of Object.entries(expected)) {
      expect(after[key], key).toEqual(value);
    }
  });

  it('samlinger, følgesvende og ønsker overlever', () => {
    const expected = {
      hasVisitedCabin: true,
      hasVisitedCabinKitchen: true,
      hasVisitedCabinBedroom: true,
      hasGoldenFrog: true,
      goldenFrogCount: 3,
      unlockedCompanions: ['rat', 'parrot', 'monkey'],
      helleflynderCaught: 2,
      collectibleInventory: { fossilCount: 4, conchCount: 5, pearlCount: 6, sardineCount: 7 },
      collectibleDelivered: { fossil: 1, conch: 2, pearl: 3, sardine: 4 },
      usedWishes: ['friend', 'wealth'] as ('friend' | 'wealth')[],
      hasMonkeyOnPier: true,
      hasHeartBalloon: true,
      balloonPopped: true,
      balloonCurrentHideout: 'abyss',
    };
    useCollectionStore.setState(expected);

    saveAndReload();

    const after = useCollectionStore.getState() as unknown as Record<string, unknown>;
    for (const [key, value] of Object.entries(expected)) {
      expect(after[key], key).toEqual(value);
    }
  });

  it('et helt nyt spil er uændret efter gem og genindlæs', () => {
    const before = JSON.parse(JSON.stringify(buildGameSave()));
    saveAndReload();
    const after = JSON.parse(JSON.stringify(buildGameSave()));
    delete before.savedAt;
    delete after.savedAt;
    expect(after).toEqual(before);
  });

  it('starter altid på molen i klart vejr efter indlæsning', () => {
    useGameStore.setState({ currentLocation: 'abyss', weatherType: 'storm' });
    saveAndReload();
    useGameStore.setState({ currentLocation: 'cave', weatherType: 'rain' });
    applyGameSave({ coins: 1 });
    expect(useGameStore.getState().currentLocation).toBe('pier');
    expect(useGameStore.getState().weatherType).toBe('clear');
  });
});

describe('applyGameSave — tåler ødelagte eller ufuldstændige gem', () => {
  it('gør ingenting ved null', () => {
    usePlayerStore.setState({ coins: 50 });
    expect(() => applyGameSave(null)).not.toThrow();
    expect(usePlayerStore.getState().coins).toBe(50);
  });

  it('ignorerer felter med forkert type i stedet for at ødelægge spillet', () => {
    usePlayerStore.setState({ coins: 50, upgrades: ['magnet'] });
    const garbage = {
      coins: 'mange',
      upgrades: 'magnet',
      inventory: { 0: 'fisk' },
      questItems: null,
      progression: 'level 9',
      stats: 7,
      completedGoals: {},
      unlockedFurniture: [1, 2, 3],
      hiddenFurniture: [null],
      furnitureRoomAssignment: ['kitchen'],
      ownedWardrobeItemIds: [5],
      avatar: 'pæn',
      totalSuccessfulCatches: -4,
      krakenLoss: '2',
      activeMathTypes: [],
      typeOps: [],
      mathDifficulty: 'umulig',
      graphicsQuality: 'episk',
      colorBlindMode: 'alt',
      uiMode: 'tv',
      goldenFrogCount: Number.NaN,
      unlockedCompanions: [1],
      collectibleInventory: [],
      collectibleDelivered: 'ingen',
      balloonCurrentHideout: 12,
    } as unknown as SaveData;

    expect(() => applyGameSave(garbage)).not.toThrow();

    const p = usePlayerStore.getState();
    expect(p.coins).toBe(50);
    expect(p.upgrades).toEqual(['magnet']);
    expect(p.inventory).toEqual([]);
    expect(p.questItems).toEqual([]);
    expect(p.progression).toEqual({ level: 1, xp: 0 });
    expect(p.stats).toEqual(emptyStats());
    expect(p.unlockedFurniture).toEqual([]);
    expect(p.furnitureRoomAssignment).toEqual({});
    expect(p.ownedWardrobeItemIds).toEqual([]);
    expect(p.avatar.skinTone).toBe('light');
    expect(p.totalSuccessfulCatches).toBe(0);
    expect(p.krakenLoss).toBe(0);

    const m = useMathStore.getState();
    expect(m.activeMathTypes).toEqual(['plus']);
    expect(m.typeOps).toEqual({});
    expect(m.mathDifficulty).toBe('beginner');

    const u = useUIStore.getState();
    expect(['low', 'medium', 'high', 'ultra']).toContain(u.graphicsQuality);
    expect(u.colorBlindMode).toBe('none');
    expect(['desktop', 'mobile']).toContain(u.uiMode);

    const c = useCollectionStore.getState();
    expect(c.goldenFrogCount).toBe(0);
    expect(c.unlockedCompanions).toEqual([]);
    expect(c.collectibleInventory).toEqual({ fossilCount: 0, conchCount: 0, pearlCount: 0, sardineCount: 0 });
  });

  it('udfylder manglende statistikfelter fra ældre gem med standardværdier', () => {
    applyGameSave({ stats: { totalCatches: 9 } });
    const s = usePlayerStore.getState().stats;
    expect(s.totalCatches).toBe(9);
    expect(s.areasVisited).toEqual(['pier']);
    expect(s.solvedCategories).toEqual([]);
    expect(Object.keys(s).sort()).toEqual(Object.keys(emptyStats()).sort());
  });

  it('retter negative og skæve tal i samlingen', () => {
    applyGameSave({
      collectibleInventory: { fossilCount: -3, conchCount: 2.9, pearlCount: 'x' },
      collectibleDelivered: { fossil: 4.2, conch: -1 },
      totalSuccessfulCatches: 12.8,
      helleflynderCaught: 2.5,
    });
    const c = useCollectionStore.getState();
    expect(c.collectibleInventory).toEqual({ fossilCount: 0, conchCount: 2, pearlCount: 0, sardineCount: 0 });
    expect(c.collectibleDelivered).toEqual({ fossil: 4, conch: 0, pearl: 0, sardine: 0 });
    expect(c.helleflynderCaught).toBe(2);
    expect(usePlayerStore.getState().totalSuccessfulCatches).toBe(12);
  });

  it('fjerner ukendte rum og ukendte ønsker', () => {
    applyGameSave({
      furnitureRoomAssignment: { sofa: 'kitchen', lampe: 'garage', bord: 3 },
      usedWishes: ['friend', 'verdensherredømme'],
    });
    expect(usePlayerStore.getState().furnitureRoomAssignment).toEqual({ sofa: 'kitchen' });
    expect(useCollectionStore.getState().usedWishes).toEqual(['friend']);
  });
});

describe('applyGameSave — ældre gem rettes til', () => {
  it('sværhedsgraden "easy" bliver til begynder', () => {
    useMathStore.setState({ mathDifficulty: 'expert' });
    applyGameSave({ mathDifficulty: 'easy' });
    expect(useMathStore.getState().mathDifficulty).toBe('beginner');
  });

  it('Selvlysende Prop gemt som madding flyttes til udstyr', () => {
    applyGameSave({ activeBait: 'biolum_floats', upgrades: ['magnet'] });
    const p = usePlayerStore.getState();
    expect(p.activeBait).toBeNull();
    expect(p.upgrades).toEqual(['magnet', 'biolum_floats']);
  });

  it('købt papegøjefjer tælles med som fundet i butikken', () => {
    applyGameSave({ upgrades: ['feather_bought'], featherSources: ['forbidden'] });
    expect(usePlayerStore.getState().featherSources).toEqual(['forbidden', 'shop']);
    applyGameSave({ upgrades: ['feather_bought'], featherSources: ['forbidden', 'shop'] });
    expect(usePlayerStore.getState().featherSources).toEqual(['forbidden', 'shop']);
  });

  it('køkkenstolen bliver til gulvplanten og beholder sin plads', () => {
    applyGameSave({
      unlockedFurniture: ['kitchen_chair', 'sofa'],
      furniturePositions: { kitchen_chair: { x: 1, y: 2, z: 3 } },
      furnitureRoomAssignment: { kitchen_chair: 'bedroom' },
      hiddenFurniture: ['kitchen_chair'],
    });
    const p = usePlayerStore.getState();
    expect(p.unlockedFurniture).toEqual(['sofa', 'gulvplante']);
    expect(p.furniturePositions).toEqual({ gulvplante: { x: 1, y: 2, z: 3 } });
    expect(p.furnitureRoomAssignment).toEqual({ gulvplante: 'bedroom' });
    expect(p.hiddenFurniture).toEqual(['gulvplante']);
  });

  it('den gamle vinderpokal bliver til guldpokalen', () => {
    applyGameSave({
      unlockedFurniture: ['winner_trophy'],
      furniturePositions: { winner_trophy: { x: 4, y: 5, z: 6 } },
      furnitureRoomAssignment: { winner_trophy: 'living' },
      hiddenFurniture: ['winner_trophy'],
    });
    const p = usePlayerStore.getState();
    expect(p.unlockedFurniture).toEqual(['winner_trophy_gold']);
    expect(p.furniturePositions).toEqual({ winner_trophy_gold: { x: 4, y: 5, z: 6 } });
    expect(p.furnitureRoomAssignment).toEqual({ winner_trophy_gold: 'living' });
    expect(p.hiddenFurniture).toEqual(['winner_trophy_gold']);
  });

  it('ballonens gamle gemmested i hytten flyttes til stuen', () => {
    applyGameSave({ hasHeartBalloon: true, balloonCurrentHideout: 'fishing_cabin' });
    expect(useCollectionStore.getState().balloonCurrentHideout).toBe('cabin_living');
  });

  it('en ballon uden gemmested placeres på molen', () => {
    applyGameSave({ hasHeartBalloon: true, balloonCurrentHideout: null });
    expect(useCollectionStore.getState().balloonCurrentHideout).toBe('pier');
  });

  it('aben står på molen, hvis venne-ønsket er brugt', () => {
    applyGameSave({ usedWishes: ['friend'], hasMonkeyOnPier: false });
    expect(useCollectionStore.getState().hasMonkeyOnPier).toBe(true);
  });

  it('gem uden talblok-felter får talblokken slået til med 1-2-3 øverst', () => {
    useMathStore.setState({ showNumberPad: false, numpadAscendingLayout: false });
    applyGameSave({ coins: 3 });
    expect(useMathStore.getState().showNumberPad).toBe(true);
    expect(useMathStore.getState().numpadAscendingLayout).toBe(true);
  });
});

describe('bootstrapPersistence — opstart', () => {
  it('starter et nyt spil når der ikke er gemt noget', () => {
    bootstrapPersistence();
    expect(useSaveStore.getState().hydrated).toBe(true);
    expect(useSaveStore.getState().lastLoaded).toBeNull();
    expect(useUIStore.getState().needsReset).toBe(false);
    expect(usePlayerStore.getState().coins).toBe(0);
  });

  it('starter et nyt spil uden at fejle, hvis gemmet er ødelagt', () => {
    storage.setItem(SAVE_KEY, 'ikke json {{{');
    expect(() => bootstrapPersistence()).not.toThrow();
    expect(useSaveStore.getState().hydrated).toBe(true);
    expect(useSaveStore.getState().lastLoaded).toBeNull();
  });

  it('indlæser et gem i aktuelt format', () => {
    // Level 1, så ingen mål opfyldes ved opstart og udbetaler ekstra mønter.
    usePlayerStore.setState({ coins: 900, upgrades: ['magnet'], progression: { level: 1, xp: 12 } });
    const json = JSON.stringify(buildGameSave());
    resetStores();
    storage.setItem(SAVE_KEY, json);

    bootstrapPersistence();

    expect(usePlayerStore.getState().coins).toBe(900);
    expect(usePlayerStore.getState().upgrades).toEqual(['magnet']);
    expect(usePlayerStore.getState().progression).toEqual({ level: 1, xp: 12 });
    expect(useUIStore.getState().needsReset).toBe(false);
    expect(useSaveStore.getState().hydrated).toBe(true);
    expect(storage.getItem(SAVE_KEY)).toBe(json);
  });

  it('et gem i ældre format nulstilles, men skærmindstillinger bevares', () => {
    storage.setItem(
      SAVE_KEY,
      JSON.stringify({
        v: SAVE_FORMAT_VERSION - 1,
        coins: 5000,
        upgrades: ['rod_mahogni'],
        isMuted: true,
        uiMode: 'mobile',
        fontSize: 21,
        graphicsQuality: 'low',
        highContrast: true,
        colorBlindMode: 'tritanopia',
      }),
    );

    bootstrapPersistence();

    expect(storage.getItem(SAVE_KEY)).toBeNull();
    expect(usePlayerStore.getState().coins).toBe(0);
    expect(usePlayerStore.getState().upgrades).toEqual([]);
    const u = useUIStore.getState();
    expect(u.needsReset).toBe(true);
    expect(u.isMuted).toBe(true);
    expect(u.uiMode).toBe('mobile');
    expect(u.fontSize).toBe(21);
    expect(u.graphicsQuality).toBe('low');
    expect(u.highContrast).toBe(true);
    expect(u.colorBlindMode).toBe('tritanopia');
  });

  it('et gem uden versionsnummer regnes som ældre format', () => {
    storage.setItem(SAVE_KEY, JSON.stringify({ coins: 5000 }));
    bootstrapPersistence();
    expect(storage.getItem(SAVE_KEY)).toBeNull();
    expect(useUIStore.getState().needsReset).toBe(true);
  });
});

describe('auto-gem', () => {
  it('gemmer kort efter at fremskridt ændres', () => {
    bootstrapPersistence();
    expect(storage.getItem(SAVE_KEY)).toBeNull();

    usePlayerStore.getState().setCoins(321);
    expect(storage.getItem(SAVE_KEY)).toBeNull();
    vi.advanceTimersByTime(1000);

    const saved = JSON.parse(storage.getItem(SAVE_KEY)!);
    expect(saved.coins).toBe(321);
    expect(saved.v).toBe(SAVE_FORMAT_VERSION);
  });

  it('samler flere hurtige ændringer i ét gem med den seneste værdi', () => {
    bootstrapPersistence();
    const setItem = vi.spyOn(storage, 'setItem');
    for (let i = 1; i <= 10; i++) {
      usePlayerStore.getState().setCoins(i);
      vi.advanceTimersByTime(100);
    }
    expect(setItem).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(JSON.parse(storage.getItem(SAVE_KEY)!).coins).toBe(10);
  });

  it('gemmer ikke når kun midlertidig tilstand ændres', () => {
    bootstrapPersistence();
    useMathStore.setState({ userAnswer: '42' });
    useUIStore.getState().setNeedsReset(false);
    vi.advanceTimersByTime(5000);
    expect(storage.getItem(SAVE_KEY)).toBeNull();
  });

  it('flushGameSave gemmer med det samme og kan indlæses igen ved næste opstart', () => {
    usePlayerStore.setState({ coins: 64, questItems: ['map_left'] });
    flushGameSave();
    expect(useSaveStore.getState().lastLoaded?.coins).toBe(64);

    resetStores();
    bootstrapPersistence();

    expect(usePlayerStore.getState().coins).toBe(64);
    expect(usePlayerStore.getState().questItems).toEqual(['map_left']);
    expect(useUIStore.getState().needsReset).toBe(false);
  });
});
