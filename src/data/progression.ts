import type { GoalDef } from '../types/progression.js';
import { LOCATIONS } from './locations.js';
import { SHOP_ITEMS } from './shop.js';

export const DESERT_SET = ['desert_sunglasses','desert_waterbottle','desert_sunhat','desert_sunscreen'] as const;

export const ARCTIC_SET = ['arctic_beanie','arctic_gloves','arctic_hotwater','arctic_scarf'] as const;

export const GOALS: GoalDef[] = [
  { id: 'first_catch', title: 'Første fangst', description: 'Fang din første fisk.', icon: '🐟', category: 'fangst', condition: (s) => s.totalCatches >= 1, reward: { xp: 20, coins: 0 }, secret: false },
  { id: 'catch_rain', title: 'Regnvejrsfisker', description: 'Fang en fisk mens det regner.', icon: '🌧️', category: 'fangst', condition: (s) => s.rainCatches >= 1, reward: { xp: 40, coins: 50 }, secret: false },
  { id: 'catch_storm', title: 'Stormfanger', description: 'Fang en fisk i stormvejr.', icon: '⛈️', category: 'fangst', condition: (s) => s.stormCatches >= 1, reward: { xp: 80, coins: 100 }, secret: false },
  { id: 'catch_10', title: 'Begynderfisker', description: 'Fang 10 fisk i alt.', icon: '🎣', category: 'fangst', condition: (s) => s.totalCatches >= 10, reward: { xp: 50, coins: 25 }, secret: false },
  { id: 'catch_50', title: 'Erfaren fisker', description: 'Fang 50 fisk i alt.', icon: '🏅', category: 'fangst', condition: (s) => s.totalCatches >= 50, reward: { xp: 150, coins: 100 }, secret: false },
  { id: 'first_rare', title: 'Sjælden fornemmelse', description: 'Fang din første sjældne fisk.', icon: '🔵', category: 'fangst', condition: (s) => s.rareCatches >= 1, reward: { xp: 40, coins: 50 }, secret: false },
  { id: 'first_legendary', title: 'Legendarisk øjeblik', description: 'Fang din første legendariske fisk.', icon: '🟣', category: 'fangst', condition: (s) => s.legendaryCatches >= 1, reward: { xp: 100, coins: 150 }, secret: false },
  { id: 'first_treasure', title: 'Skat!', description: 'Find en sunket kiste.', icon: '💎', category: 'fangst', condition: (s) => s.treasureCatches >= 1, reward: { xp: 80, coins: 200 }, secret: false },
  { id: 'kraken', title: 'Du mødte Krakken', description: 'Fang den legendariske Kraken.', icon: '🦑', category: 'fangst', condition: (s) => s.krakenCaught, reward: { xp: 300, coins: 500 }, secret: true },
  { id: 'no_junk', title: 'Rent vand', description: 'Fang 10 fisk i træk uden skrald.', icon: '✨', category: 'udfordring', condition: (s) => s.bestJunkStreak >= 10, reward: { xp: 75, coins: 50 }, secret: false },
  { id: 'earn_500', title: 'Første tusindlap', description: 'Tjen 500 kr. fra salg i alt.', icon: '💰', category: 'økonomi', condition: (s) => s.totalEarned >= 500, reward: { xp: 60, coins: 0 }, secret: false },
  { id: 'earn_5000', title: 'Fiskerikonge', description: 'Tjen 5.000 kr. fra salg i alt.', icon: '👑', category: 'økonomi', condition: (s) => s.totalEarned >= 5000, reward: { xp: 200, coins: 0 }, secret: false },
  { id: 'full_upgrade', title: 'Fuldt udrustet', description: 'Køb alle opgraderinger i butikken.', icon: '🛠', category: 'økonomi', condition: (s) => s.upgradesBought >= SHOP_ITEMS.length, reward: { xp: 250, coins: 300 }, secret: false },
  { id: 'reach_5', title: 'Veteran', description: 'Nå level 5.', icon: '⭐', category: 'progression', condition: (s) => s.maxLevel >= 5, reward: { xp: 0, coins: 100 }, secret: false },
  { id: 'reach_10', title: 'Sand Mesterfisker', description: 'Nå level 10 — du er en sand mesterfisker!', icon: '⭐', category: 'progression', condition: (s) => s.maxLevel >= 10, reward: { xp: 0, coins: 300 }, secret: false },
  { id: 'reach_20', title: 'Havets Herre', description: 'Nå level 20.', icon: '🌊', category: 'progression', condition: (s) => s.maxLevel >= 20, reward: { xp: 0, coins: 1000 }, secret: true },
  { id: 'explore_smaragd', title: 'Udforsker', description: 'Besøg Skovsøen.', icon: '🗺', category: 'progression', condition: (s) => s.areasVisited.includes('smaragd'), reward: { xp: 50, coins: 0 }, secret: false },
  { id: 'speed_catch', title: 'Lynfisker', description: 'Løs et regnestykke med over 80% tid tilbage.', icon: '⚡', category: 'udfordring', condition: (s) => s.speedSolves >= 1, reward: { xp: 30, coins: 0 }, secret: false },
  { id: 'boss_slayer', title: 'Bossbesejrer', description: 'Vind 5 boss-kampe.', icon: '💀', category: 'udfordring', condition: (s) => s.bossWins >= 5, reward: { xp: 120, coins: 200 }, secret: false },
  { id: 'fossil_1', title: 'Fossiljæger', description: 'Indlever dit første fossil til Kaptajn Rotteskæg.', icon: '🦴', category: 'udfordring', condition: (s) => (s.fossilCount ?? 0) >= 1, reward: { xp: 50, coins: 0 }, secret: false },
  { id: 'fossil_30', title: 'Sørøverens Ven', description: 'Indlever 30 fossiler til Kaptajn Rotteskæg.', icon: '🏴‍☠️', category: 'udfordring', condition: (s) => (s.fossilCount ?? 0) >= 30, reward: { xp: 300, coins: 500 }, secret: true },

  // --- NYE UDFORSKNINGS-MÅL ---
  { id: 'globetrotter', title: 'Globetrotter', description: `Besøg alle ${Object.keys(LOCATIONS).length} lokationer i verden.`, icon: '🌍', category: 'progression', condition: (s) => (s.areasVisited?.length ?? 0) >= Object.keys(LOCATIONS).length, reward: { xp: 200, coins: 500 }, secret: false },
  { id: 'turtle_dad', title: 'Nyt Liv', description: 'Udrug skildpaddeægget fra Den Tropiske Ø.', icon: '🐢', category: 'progression', condition: (s) => !!s.hasTurtleHatched, reward: { xp: 300, coins: 0 }, secret: true },

  // --- NYE SAMLE-MÅL ---
  { id: 'scavenger', title: 'Skattejægeren', description: 'Find alle 3 oste og alle 3 fjer i verden.', icon: '🔍', category: 'udfordring', condition: (s) => (s.collectiblesFound ?? 0) >= 6, reward: { xp: 250, coins: 250 }, secret: false },
  { id: 'conch_king', title: 'Strandvasker', description: 'Saml 10 konkylier i din taske.', icon: '🐚', category: 'samling', condition: (s) => (s.conchCount ?? 0) >= 10, reward: { xp: 100, coins: 100 }, secret: false },
  { id: 'companion_master', title: 'Dyrehvisker', description: 'Lås op for alle 5 kæledyr.', icon: '🐾', category: 'progression', condition: (s) => (s.companionsUnlocked ?? 0) >= 5, reward: { xp: 150, coins: 0 }, secret: false },

  // --- NYE EVENT/KAMP-MÅL ---
  { id: 'combo_master', title: 'Matematik Ninja', description: 'Opnå en streak på 5 ved at svare rigtigt i streg.', icon: '🔥', category: 'udfordring', condition: (s) => (s.maxCombo ?? 0) >= 5, reward: { xp: 400, coins: 0 }, secret: false },

  // --- GROTTE-MÅL ---
  { id: 'cave_axolotl', title: 'Lysende Venskab', description: 'Fang den sjældne Glødende Axolotl i Den Mørke Grotte.', icon: '🦎', category: 'fangst', condition: (s) => s.axolotlCaught, reward: { xp: 400, coins: 0 }, secret: true },
  { id: 'cave_crystal', title: 'Grottens Hjerte', description: 'Find en Ur-Krystal dybt i Den Mørke Grotte.', icon: '💠', category: 'fangst', condition: (s) => s.crystalFound, reward: { xp: 200, coins: 500 }, secret: true },
  { id: 'cave_gorm', title: 'Vred og Besejret', description: 'Besejr den frygtede Gnavne-Gorm i grotten.', icon: '🐡', category: 'udfordring', condition: (s) => s.gormDefeated, reward: { xp: 600, coins: 1000 }, secret: true },
  { id: 'cave_complete', title: 'Grotteudforsker', description: 'Find axolotlen, krystallen og besejr Gnavne-Gorm.', icon: '🔦', category: 'udfordring', condition: (s) => s.axolotlCaught && s.crystalFound && s.gormDefeated, reward: { xp: 1000, coins: 2000 }, secret: true },
  { id: 'ouch_jellyfish', title: 'Av, det brænder!', description: 'Mist din fangst til en giftig brandmand.', icon: '🪼', category: 'fangst', condition: (s) => (s.jellyfishCaught ?? 0) >= 1, reward: { xp: 50, coins: 100 }, secret: true },
  { id: 'wish_master', title: 'Ønskebrønden', description: 'Brug alle 3 ønsker fra Helleflynderen.', icon: '🌟', category: 'progression', condition: (s) => (s.wishesUsed ?? 0) >= 3, reward: { xp: 1000, coins: 1000 }, secret: true },
];
