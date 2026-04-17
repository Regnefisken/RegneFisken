import type { GoalDef } from '../types/progression.js';
import { COMPANIONS_DATABASE } from './collectibles.js';
import { CATCH_MASTER_DATA } from './fish.js';
import { GLOBETROTTER_TARGET_COUNT } from './locations.js';
import { SHOP_ITEMS } from './shop.js';

export const DESERT_SET = ['desert_sunglasses', 'desert_waterbottle', 'desert_sunhat', 'desert_sunscreen'] as const;

export const ARCTIC_SET = ['arctic_beanie', 'arctic_gloves', 'arctic_hotwater', 'arctic_scarf'] as const;

/** Antal unikke fiske-arter på Den Tropiske Ø (til mål Tropeekspert). */
export const TROPICAL_SPECIES_COUNT = CATCH_MASTER_DATA.filter(
  (f) => f.primaryAreas.includes('tropical_island') && f.type === 'fish'
).length;

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
  { id: 'no_junk', title: 'Rent vand', description: 'Fang 10 fisk i træk uden skrald.', icon: '✨', category: 'matematik', condition: (s) => s.bestJunkStreak >= 10, reward: { xp: 75, coins: 50 }, secret: false },
  { id: 'earn_500', title: 'God start', description: 'Tjen 500 kr fra salg i alt.', icon: '💰', category: 'økonomi', condition: (s) => s.totalEarned >= 500, reward: { xp: 60, coins: 0 }, secret: false },
  { id: 'earn_5000', title: 'Fiskerikonge', description: 'Tjen 5.000 kr fra salg i alt.', icon: '👑', category: 'økonomi', condition: (s) => s.totalEarned >= 5000, reward: { xp: 200, coins: 0 }, secret: false },
  { id: 'full_upgrade', title: 'Fuldt udrustet', description: 'Køb alle opgraderinger i butikken.', icon: '🛠', category: 'økonomi', condition: (s) => s.upgradesBought >= SHOP_ITEMS.length, reward: { xp: 250, coins: 300 }, secret: false },
  { id: 'reach_5', title: 'Veteran', description: 'Nå level 5.', icon: '⭐', category: 'udforskning', condition: (s) => s.maxLevel >= 5, reward: { xp: 0, coins: 100 }, secret: false },
  { id: 'reach_10', title: 'Sand Mesterfisker', description: 'Nå level 10 — du er en sand mesterfisker!', icon: '🌟', category: 'udforskning', condition: (s) => s.maxLevel >= 10, reward: { xp: 0, coins: 300 }, secret: false },
  { id: 'reach_20', title: 'Havets Herre', description: 'Nå level 20.', icon: '💫', category: 'udforskning', condition: (s) => s.maxLevel >= 20, reward: { xp: 0, coins: 1000 }, secret: true },
  { id: 'explore_smaragd', title: 'Udforsker', description: 'Besøg Skovsøen.', icon: '🗺', category: 'udforskning', condition: (s) => s.areasVisited.includes('smaragd'), reward: { xp: 50, coins: 0 }, secret: false },
  { id: 'speed_catch', title: 'Lynfisker', description: 'Løs et regnestykke med over 80% tid tilbage.', icon: '⚡', category: 'matematik', condition: (s) => s.speedSolves >= 1, reward: { xp: 30, coins: 0 }, secret: false },
  { id: 'boss_slayer', title: 'Bossbesejrer', description: 'Vind 5 boss-kampe.', icon: '💀', category: 'matematik', condition: (s) => s.bossWins >= 5, reward: { xp: 120, coins: 200 }, secret: false },
  { id: 'fossil_1', title: 'Fossiljæger', description: 'Indlever dit første fossil til Kaptajn Rotteskæg.', icon: '🦴', category: 'samling', condition: (s) => (s.fossilCount ?? 0) >= 1, reward: { xp: 50, coins: 0 }, secret: false },
  { id: 'fossil_30', title: 'Sørøverens Ven', description: 'Indlever 30 fossiler til Kaptajn Rotteskæg.', icon: '🏴‍☠️', category: 'samling', condition: (s) => (s.fossilCount ?? 0) >= 30, reward: { xp: 300, coins: 500 }, secret: true },

  { id: 'globetrotter', title: 'Globetrotter', description: `Besøg alle ${GLOBETROTTER_TARGET_COUNT} lokationer i verden.`, icon: '🌍', category: 'udforskning', condition: (s) => (s.areasVisited?.length ?? 0) >= GLOBETROTTER_TARGET_COUNT, reward: { xp: 200, coins: 500 }, secret: false },
  { id: 'turtle_dad', title: 'Nyt Liv', description: 'Udrug skildpaddeægget fra Den Tropiske Ø.', icon: '🐢', category: 'samling', condition: (s) => !!s.hasTurtleHatched, reward: { xp: 300, coins: 0 }, secret: true },

  { id: 'scavenger', title: 'Skattejægeren', description: 'Find alle 3 oste og alle 3 fjer i verden.', icon: '🔍', category: 'samling', condition: (s) => (s.collectiblesFound ?? 0) >= 6, reward: { xp: 250, coins: 250 }, secret: false },
  { id: 'conch_king', title: 'Strandvasker', description: 'Saml 10 konkylier i din taske.', icon: '🐚', category: 'samling', condition: (s) => (s.conchCount ?? 0) >= 10, reward: { xp: 100, coins: 100 }, secret: false },

  { id: 'combo_master', title: 'Matematik Ninja', description: 'Opnå en streak på 5 ved at svare rigtigt i streg.', icon: '🔥', category: 'matematik', condition: (s) => (s.maxCombo ?? 0) >= 5, reward: { xp: 400, coins: 0 }, secret: false },

  { id: 'cave_axolotl', title: 'Lysende Venskab', description: 'Fang den sjældne Glødende Axolotl i Den Mørke Grotte.', icon: '🦎', category: 'fangst', condition: (s) => s.axolotlCaught, reward: { xp: 400, coins: 0 }, secret: true },
  { id: 'cave_crystal', title: 'Grottens Hjerte', description: 'Find en Ur-Krystal i Den Mørke Grotte og bring den hjem til hytten.', icon: '💠', category: 'fangst', condition: (s) => s.crystalFound, reward: { xp: 200, coins: 500 }, secret: true },
  { id: 'cave_gorm', title: 'Vred og Besejret', description: 'Besejr den frygtede Gnavne-Gorm i grotten.', icon: '🐡', category: 'matematik', condition: (s) => s.gormDefeated, reward: { xp: 600, coins: 1000 }, secret: true },
  { id: 'cave_complete', title: 'Grotteudforsker', description: 'Find axolotlen, krystallen og besejr Gnavne-Gorm.', icon: '🔦', category: 'matematik', condition: (s) => s.axolotlCaught && s.crystalFound && s.gormDefeated, reward: { xp: 1000, coins: 2000 }, secret: true },
  { id: 'ouch_jellyfish', title: 'Av, det brænder!', description: 'Mist din fangst til en giftig brandmand.', icon: '🪼', category: 'fangst', condition: (s) => (s.jellyfishCaught ?? 0) >= 1, reward: { xp: 50, coins: 100 }, secret: true },
  { id: 'wish_master', title: 'Ønskebrønden', description: 'Brug alle 3 ønsker fra Helleflynderen.', icon: '🌟', category: 'udforskning', condition: (s) => (s.wishesUsed ?? 0) >= 3, reward: { xp: 1000, coins: 1000 }, secret: true },

  // --- NYE FANGST-MÅL ---
  { id: 'catch_25', title: 'Halvvejs', description: 'Fang 25 fisk i alt.', icon: '🎣', category: 'fangst', condition: (s) => s.totalCatches >= 25, reward: { xp: 80, coins: 50 }, secret: false },
  { id: 'catch_100', title: 'Hundredmanden', description: 'Fang 100 fisk i alt.', icon: '💯', category: 'fangst', condition: (s) => s.totalCatches >= 100, reward: { xp: 300, coins: 200 }, secret: false },
  { id: 'catch_250', title: 'Utrættelig fisker', description: 'Fang 250 fisk i alt.', icon: '🌊', category: 'fangst', condition: (s) => s.totalCatches >= 250, reward: { xp: 600, coins: 500 }, secret: false },
  { id: 'first_junk', title: 'Hvad er det her?!', description: 'Fang dit første stykke skrald.', icon: '🗑️', category: 'fangst', condition: (s) => s.junkCatches >= 1, reward: { xp: 10, coins: 0 }, secret: false },
  { id: 'catch_frog', title: 'Ribbid!', description: 'Fang din første frø.', icon: '🐸', category: 'fangst', condition: (s) => s.frogCatches >= 1, reward: { xp: 20, coins: 20 }, secret: false },
  { id: 'catch_shark', title: 'Havets Røver', description: 'Fang en haj.', icon: '🦈', category: 'fangst', condition: (s) => s.sharkCaught, reward: { xp: 200, coins: 300 }, secret: true },
  { id: 'catch_narwhale', title: 'Ensomme Horn', description: 'Fang en narhval i Ishavet.', icon: '🦄', category: 'fangst', condition: (s) => s.narwhalCaught, reward: { xp: 250, coins: 400 }, secret: true },
  { id: 'catch_plesiosaur', title: 'Forhistorisk fangst', description: 'Fang en Plesiosaurus i Dybet.', icon: '🦕', category: 'fangst', condition: (s) => s.plesiosaurCaught, reward: { xp: 400, coins: 600 }, secret: true },
  { id: 'catch_golden_carp', title: 'Ønsket opfyldt', description: 'Fang Den Gyldne Karpe.', icon: '✨', category: 'fangst', condition: (s) => s.goldenCarpCaught, reward: { xp: 300, coins: 750 }, secret: true },
  { id: 'catch_all_tropisk', title: 'Tropeekspert', description: 'Fang alle fisk på Den Tropiske Ø.', icon: '🌴', category: 'fangst', condition: (s) => s.tropicalSpeciesCaught >= TROPICAL_SPECIES_COUNT, reward: { xp: 500, coins: 500 }, secret: false },
  { id: 'junk_tire', title: 'Hvad laver det her!?', description: 'Fang et gammelt bildæk.', icon: '🛞', category: 'fangst', condition: (s) => s.tireCaught >= 1, reward: { xp: 15, coins: 10 }, secret: true },
  { id: 'junk_teddy', title: 'Blød landing', description: 'Fang en våd bamse.', icon: '🧸', category: 'fangst', condition: (s) => s.teddyCaught >= 1, reward: { xp: 20, coins: 0 }, secret: true },
  { id: 'catch_bottle', title: 'Postmanden reddede ikke pakken', description: 'Fang en flaskepost.', icon: '📜', category: 'fangst', condition: (s) => s.bottleCatches >= 1, reward: { xp: 50, coins: 50 }, secret: true },
  { id: 'catch_5_junk', title: 'Miljøvagt', description: 'Fang 5 stykker skrald i alt.', icon: '♻️', category: 'fangst', condition: (s) => s.junkCatches >= 5, reward: { xp: 40, coins: 0 }, secret: false },

  // --- NYE MATEMATIK-MÅL ---
  { id: 'math_streak_3', title: 'På rette vej', description: 'Svar rigtigt 3 gange i træk.', icon: '🔥', category: 'matematik', condition: (s) => (s.maxCombo ?? 0) >= 3, reward: { xp: 50, coins: 30 }, secret: false },
  { id: 'math_streak_10', title: 'Regneguru', description: 'Svar rigtigt 10 gange i træk.', icon: '🧮', category: 'matematik', condition: (s) => (s.maxCombo ?? 0) >= 10, reward: { xp: 600, coins: 200 }, secret: false },
  { id: 'math_speed_5', title: 'Lynhjerne', description: 'Løs 5 regnestykker med over 80% tid tilbage.', icon: '⚡', category: 'matematik', condition: (s) => s.speedSolves >= 5, reward: { xp: 150, coins: 100 }, secret: false },
  { id: 'math_perfect_boss', title: 'Fejlfri kæmper', description: 'Vind en boss-kamp uden at svare forkert én gang.', icon: '💎', category: 'matematik', condition: (s) => s.perfectBossWins >= 1, reward: { xp: 200, coins: 250 }, secret: true },
  { id: 'math_boss_10', title: 'Mesterkæmper', description: 'Vind 10 boss-kampe.', icon: '⚔️', category: 'matematik', condition: (s) => s.bossWins >= 10, reward: { xp: 300, coins: 400 }, secret: false },
  { id: 'jellyfish_10', title: 'Gentagende uheld', description: 'Mist fangst til brandmand 10 gange.', icon: '🪼', category: 'matematik', condition: (s) => (s.jellyfishCaught ?? 0) >= 10, reward: { xp: 100, coins: 200 }, secret: true },

  // --- EMOJI-OPGAVETYPE MÅL ---
  {
    id: 'first_halvdel',
    title: 'Delt i to!',
    description: 'Løs din første halveringsopgave.',
    icon: '✂️',
    category: 'matematik',
    condition: (s) => (s.solvedCategories ?? []).includes('emoji-half'),
    reward: { xp: 30, coins: 20 },
    secret: false,
  },
  {
    id: 'first_dobbelt',
    title: 'Dobbelt op!',
    description: 'Løs din første fordoblingsopgave.',
    icon: '🔄',
    category: 'matematik',
    condition: (s) => (s.solvedCategories ?? []).includes('emoji-double'),
    reward: { xp: 30, coins: 20 },
    secret: false,
  },
  {
    id: 'first_pattern',
    title: 'Mønsterbryder',
    description: 'Løs din første mønsteropgave.',
    icon: '🔮',
    category: 'matematik',
    condition: (s) => (s.solvedCategories ?? []).includes('emoji-pattern'),
    reward: { xp: 40, coins: 30 },
    secret: false,
  },
  {
    id: 'first_fraction',
    title: 'Brøk-begynder',
    description: 'Løs din første brøkopgave.',
    icon: '🍕',
    category: 'matematik',
    condition: (s) => (s.solvedCategories ?? []).includes('emoji-fraction'),
    reward: { xp: 50, coins: 40 },
    secret: false,
  },
  {
    id: 'first_percent',
    title: 'Procent-debutant',
    description: 'Løs din første procentopgave.',
    icon: '📈',
    category: 'matematik',
    condition: (s) => (s.solvedCategories ?? []).includes('emoji-percent'),
    reward: { xp: 50, coins: 40 },
    secret: false,
  },
  {
    id: 'halvdel_dobbelt_10',
    title: 'Halvdels- & dobbeltmester',
    description: 'Løs 10 halvdel- eller dobbeltopgaver korrekt.',
    icon: '🪞',
    category: 'matematik',
    condition: (s) => (s.halvdelDobbeltSolves ?? 0) >= 10,
    reward: { xp: 100, coins: 75 },
    secret: false,
  },
  {
    id: 'pattern_10',
    title: 'Mønsterjæger',
    description: 'Løs 10 mønsteropgaver korrekt.',
    icon: '🔮',
    category: 'matematik',
    condition: (s) => (s.patternSolves ?? 0) >= 10,
    reward: { xp: 120, coins: 100 },
    secret: false,
  },
  {
    id: 'fraction_master',
    title: 'Brøkmester',
    description: 'Løs 15 brøkopgaver korrekt.',
    icon: '🍕',
    category: 'matematik',
    condition: (s) => (s.fractionSolves ?? 0) >= 15,
    reward: { xp: 200, coins: 150 },
    secret: false,
  },
  {
    id: 'percent_master',
    title: 'Procentkonge',
    description: 'Løs 15 procentopgaver korrekt.',
    icon: '👑',
    category: 'matematik',
    condition: (s) => (s.percentSolves ?? 0) >= 15,
    reward: { xp: 200, coins: 150 },
    secret: false,
  },
  {
    id: 'emoji_master',
    title: 'Emoji-mester',
    description: 'Løs mindst én opgave af hver emoji-type (alle 12).',
    icon: '🏆',
    category: 'matematik',
    condition: (s) => {
      const cats = s.solvedCategories ?? [];
      const allEmojiCats = [
        'emoji-antal',
        'emoji-counting',
        'emoji-most-least',
        'emoji-size-compare',
        'emoji-half',
        'emoji-double',
        'emoji-even-odd',
        'emoji-pattern',
        'emoji-sort',
        'emoji-equalize',
        'emoji-fraction',
        'emoji-percent',
      ];
      return allEmojiCats.every((c) => cats.includes(c));
    },
    reward: { xp: 500, coins: 500 },
    secret: true,
  },

  // --- NYE ØKONOMI-MÅL ---
  { id: 'earn_1000', title: 'God dag på molen', description: 'Tjen 1.000 kr fra salg i alt.', icon: '💵', category: 'økonomi', condition: (s) => s.totalEarned >= 1000, reward: { xp: 100, coins: 0 }, secret: false },
  { id: 'earn_25000', title: 'Fiskeri-milliardær', description: 'Tjen 25.000 kr fra salg i alt.', icon: '💰', category: 'økonomi', condition: (s) => s.totalEarned >= 25000, reward: { xp: 500, coins: 0 }, secret: true },
  { id: 'first_upgrade', title: 'Første investering', description: 'Køb din første opgradering i butikken.', icon: '🛒', category: 'økonomi', condition: (s) => s.upgradesBought >= 1, reward: { xp: 30, coins: 0 }, secret: false },
  { id: 'buy_luxury_boat', title: 'Skipper!', description: 'Køb den flotte sejlbåd.', icon: '⛵', category: 'økonomi', condition: (s) => s.hasLuxuryBoat, reward: { xp: 400, coins: 500 }, secret: false },
  { id: 'sell_legendary', title: 'Med stor fortjeneste', description: 'Sælg din første legendariske fisk.', icon: '🤑', category: 'økonomi', condition: (s) => s.legendarySold >= 1, reward: { xp: 80, coins: 100 }, secret: false },

  // --- NYE UDFORSKNING-MÅL ---
  { id: 'visit_cave', title: 'Ind i mørket', description: 'Besøg Den Mørke Grotte.', icon: '🪨', category: 'udforskning', condition: (s) => s.areasVisited.includes('cave'), reward: { xp: 60, coins: 0 }, secret: false },
  { id: 'visit_arctic', title: 'Frostvægt', description: 'Besøg Ishavet.', icon: '🧊', category: 'udforskning', condition: (s) => s.areasVisited.includes('arctic_sea'), reward: { xp: 60, coins: 0 }, secret: false },
  { id: 'visit_desert', title: 'Varmblodet fisker', description: 'Besøg Ørkensøen.', icon: '🏜️', category: 'udforskning', condition: (s) => s.areasVisited.includes('desert_lake'), reward: { xp: 60, coins: 0 }, secret: false },
  { id: 'visit_forbidden', title: 'Den forbudte passage', description: 'Besøg Den Forbudte Sø.', icon: '🏴‍☠️', category: 'udforskning', condition: (s) => s.areasVisited.includes('forbidden'), reward: { xp: 80, coins: 100 }, secret: false },
  { id: 'visit_jungle', title: 'Dinosaurernes Ø', description: 'Find Jungleøen — opdaget via Plesiosaurus.', icon: '🦕', category: 'udforskning', condition: (s) => s.areasVisited.includes('jungle_island'), reward: { xp: 200, coins: 200 }, secret: true },
  { id: 'visit_cabin', title: 'Hjemme igen', description: 'Find og besøg Fiskehytten.', icon: '🏠', category: 'udforskning', condition: (s) => s.areasVisited.includes('cabin_living'), reward: { xp: 100, coins: 0 }, secret: false },
  { id: 'wish_first', title: 'Et ønske', description: 'Brug dit første ønske fra Helleflynderen.', icon: '🌠', category: 'udforskning', condition: (s) => (s.wishesUsed ?? 0) >= 1, reward: { xp: 100, coins: 0 }, secret: true },

  { id: 'reach_3', title: 'Ny fisker', description: 'Nå level 3.', icon: '⭐', category: 'udforskning', condition: (s) => s.maxLevel >= 3, reward: { xp: 0, coins: 50 }, secret: false },
  { id: 'reach_15', title: 'Havets Veteran', description: 'Nå level 15.', icon: '🌊', category: 'udforskning', condition: (s) => s.maxLevel >= 15, reward: { xp: 0, coins: 500 }, secret: false },
  { id: 'reach_25', title: 'Havlegenden', description: 'Nå level 25.', icon: '🏆', category: 'udforskning', condition: (s) => s.maxLevel >= 25, reward: { xp: 0, coins: 2000 }, secret: true },

  { id: 'reach_30', title: 'Havets Mester', description: 'Nå level 30.', icon: '🌟', category: 'udforskning', condition: (s) => s.maxLevel >= 30, reward: { xp: 0, coins: 100 }, secret: true },
  { id: 'reach_35', title: 'Havets Legende', description: 'Nå level 35.', icon: '🏅', category: 'udforskning', condition: (s) => s.maxLevel >= 35, reward: { xp: 0, coins: 150 }, secret: true },
  { id: 'reach_40', title: 'Uovervindelig Fisker', description: 'Nå level 40.', icon: '🔱', category: 'udforskning', condition: (s) => s.maxLevel >= 40, reward: { xp: 0, coins: 200 }, secret: true },
  { id: 'reach_45', title: 'Evig Fisker', description: 'Nå level 45.', icon: '♾️', category: 'udforskning', condition: (s) => s.maxLevel >= 45, reward: { xp: 0, coins: 200 }, secret: true },
  { id: 'reach_50', title: 'Guddommelig Fisker', description: 'Nå level 50.', icon: '✨', category: 'udforskning', condition: (s) => s.maxLevel >= 50, reward: { xp: 0, coins: 200 }, secret: true },

  // --- NYE SAMLING-MÅL ---
  { id: 'first_companion', title: 'Nye venner', description: 'Lås op for dit første kæledyr.', icon: '🐾', category: 'samling', condition: (s) => (s.companionsUnlocked ?? 0) >= 1, reward: { xp: 50, coins: 0 }, secret: false },
  { id: 'rat_friend', title: 'Rottemester', description: 'Lås op for Rotten som kæledyr.', icon: '🐀', category: 'samling', condition: (s) => s.ratUnlocked, reward: { xp: 80, coins: 0 }, secret: false },
  { id: 'parrot_friend', title: 'Fuglehvisker', description: 'Lås op for Papegøjen som kæledyr.', icon: '🦜', category: 'samling', condition: (s) => s.parrotUnlocked, reward: { xp: 80, coins: 0 }, secret: false },
  { id: 'fossil_10', title: 'Dinosaursamler', description: 'Aflever 10 fossiler til Kaptajn Rotteskæg.', icon: '🦴', category: 'samling', condition: (s) => (s.fossilCount ?? 0) >= 10, reward: { xp: 150, coins: 150 }, secret: false },
  { id: 'pearl_5', title: 'Havets Perle', description: 'Aflever 5 perler til Havfruen.', icon: '💎', category: 'samling', condition: (s) => (s.pearlCount ?? 0) >= 5, reward: { xp: 200, coins: 250 }, secret: false },
  { id: 'conch_5', title: 'Pingvinens Ven', description: 'Aflever 5 konkylier til Pingvinen.', icon: '🐧', category: 'samling', condition: (s) => (s.conchCount ?? 0) >= 5, reward: { xp: 100, coins: 100 }, secret: false },
  { id: 'conch_first', title: 'Sneglemand', description: 'Saml din første konkylie.', icon: '🐚', category: 'samling', condition: (s) => (s.conchCount ?? 0) >= 1, reward: { xp: 20, coins: 0 }, secret: false },
  {
    id: 'all_companions',
    title: 'Dyrehord',
    description: `Lås op for alle ${COMPANIONS_DATABASE.length} kæledyr i spillet.`,
    icon: '🐾',
    category: 'samling',
    condition: (s) => (s.companionsUnlocked ?? 0) >= COMPANIONS_DATABASE.length,
    reward: { xp: 500, coins: 500 },
    secret: true,
  },

  // --- NYE VEJR-MÅL (kategori: fangst) ---
  { id: 'catch_night', title: 'Natteravnen', description: 'Fang en fisk om natten.', icon: '🌙', category: 'fangst', condition: (s) => s.nightCatches >= 1, reward: { xp: 60, coins: 50 }, secret: false },
  { id: 'catch_10_rain', title: 'Regnvejrsfisk', description: 'Fang 10 fisk mens det regner.', icon: '🌧️', category: 'fangst', condition: (s) => s.rainCatches >= 10, reward: { xp: 150, coins: 100 }, secret: false },
  { id: 'catch_snow', title: 'Sneregnsfisker', description: 'Fang en fisk i snefald.', icon: '❄️', category: 'fangst', condition: (s) => s.snowCatches >= 1, reward: { xp: 80, coins: 75 }, secret: false },

  // --- ENDGAME NPC-MÅL ---
  { id: 'pirate_cat_unlocked', title: 'Skibskatten', description: 'Lås Skibskatten Kradse op fra Kaptajn Rotteskæg.', icon: '🐱', category: 'samling', condition: (s) => s.pirateCatUnlocked, reward: { xp: 200, coins: 200 }, secret: true },
  { id: 'pirate_chest_obtained', title: 'Sørøverens Skat', description: 'Modtag Piratens Skattekiste som møbel.', icon: '📦', category: 'samling', condition: (s) => s.pirateChestUnlocked, reward: { xp: 250, coins: 0 }, secret: true },
  { id: 'jungle_key_obtained', title: 'Havfruens Gave', description: 'Modtag den mystiske nøgle fra Havfruen.', icon: '🗝️', category: 'samling', condition: (s) => s.jungleKeyObtained, reward: { xp: 300, coins: 300 }, secret: true },
  { id: 'pearl_10', title: 'Perlesmykket', description: 'Aflever 10 perler til Havfruen.', icon: '💎', category: 'samling', condition: (s) => (s.pearlCount ?? 0) >= 10, reward: { xp: 250, coins: 300 }, secret: false },
  { id: 'conch_20', title: 'Pingvinpaladset', description: 'Aflever 20 konkylier til Pingvinen.', icon: '🐧', category: 'samling', condition: (s) => (s.conchDelivered ?? 0) >= 20, reward: { xp: 300, coins: 400 }, secret: true },
  { id: 'npc_master', title: 'Havets Mesterfisker', description: 'Aflever 10 samleobjekter til alle tre NPC-samlere.', icon: '🏆', category: 'samling', condition: (s) => (s.fossilCount ?? 0) >= 10 && (s.conchDelivered ?? 0) >= 10 && (s.pearlCount ?? 0) >= 10, reward: { xp: 1000, coins: 2000 }, secret: true },
  { id: 'haps_friend', title: 'Mågeven', description: 'Bliv venner med Havnemågen Haps ved at give ham 10 sardiner.', icon: '🐦', category: 'samling', condition: (s) => s.hapsUnlocked, reward: { xp: 500, coins: 500 }, secret: true },
];
