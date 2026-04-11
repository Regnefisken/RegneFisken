import type { ShopItem } from '../types/shop.js';

export const SHOP_ITEMS: ShopItem[] = [
  // ── RODS (stigende pris + krav) ── // CATEGORY: fishing_gear
  { id: 'rod_havblaa',  name: 'Havblå Stang',     description: 'Bedre tid og chance på almindelige områder', cost: 450,  icon: '🌊', requiredLevel: 3,  requiresUpgrade: null, category: 'fishing_gear' },
  { id: 'rod_bambus',   name: 'Bambus Stang',     description: 'God til mellem-områder og hurtigere fiskeri', cost: 1250, icon: '🎍', requiredLevel: 7,  requiresUpgrade: 'rod_havblaa', category: 'fishing_gear' },
  { id: 'rod_mahogni',  name: 'Mahogni Stang',    description: 'KRÆVES til Tropisk Ø, Dybet og Grotte', cost: 2500, icon: '✨', requiredLevel: 10, requiresUpgrade: 'rod_bambus', category: 'fishing_gear' },

  // ── LURE + REEL ── // CATEGORY: fishing_gear
  { id: 'heldig_firkloever', name: 'Heldigt Firkløver', description: 'En magisk firkløver der bringer held ved fiskeri. (+8 Held)', cost: 850, icon: '🍀', requiredLevel: 6, category: 'fishing_gear' },
  { id: 'reel_upgrade', name: 'Turbo Hjul', description: 'Fiskene bider hurtigere på krogen.', cost: 525, icon: '⚡', requiredLevel: 1, category: 'fishing_gear' },

  // ── LICENSER & ADGANG ── // CATEGORY: travel
  // ==================== ÆNDRET TIL TO-TRINS ADGANGSSYSTEM + START-FIX ====================
  { id: 'travel_pass', name: 'Rejsekort', description: 'Lås op for rejsemenuen', cost: 650, icon: '🗺️', requiredLevel: 3, category: 'travel' },
  { id: 'license_smaragd', name: 'Fisketilladelse: Skovsøen', description: 'Giver tilladelse til at fiske i Skovsøen', cost: 1150, icon: '🎟️', requiredLevel: 3, category: 'travel' },
  // ====================================================================================
  { id: 'license_abyss', name: 'Fisketilladelse: Dybet', description: 'Giver tilladelse til at fiske i de mørke dybder med kraftige strømme og sjældne væsener.', cost: 2500, icon: '🎫', requiredLevel: 8, category: 'travel' },

  // ── LEGENDARISK ── // CATEGORY: legendary
  { id: 'map_right', name: 'Halvt Skattekort (højre)', description: 'Højre halvdel af et mystisk skattekort.', cost: 2000, icon: '🗺', requiredLevel: 10, category: 'legendary' },
  { id: 'pirate_hat', name: 'Sørøverens Hat', description: 'En ægte sørøverhat. Bringer held på havet!', cost: 0, icon: '🏴‍☠️', requiredLevel: 99, category: 'legendary' },

  // ── BUCKETS (kapacitet) ── // CATEGORY: fishing_gear
  // PHASE 6: Spand-opgraderinger matcher nye tiers (5-10-15-20-25)
  { id: 'bucket_iron',   name: 'Jernspand',      description: 'Holder 10 fisk',  cost: 200,  icon: '🪣', requiredLevel: 4, category: 'fishing_gear' },
  { id: 'bucket_copper', name: 'Kobberspand',    description: 'Holder 15 fisk',  cost: 500,  icon: '🪣', requiredLevel: 9,  requiresUpgrade: 'bucket_iron', category: 'fishing_gear' },
  { id: 'bucket_silver', name: 'Sølvspand',      description: 'Holder 20 fisk',  cost: 1100, icon: '🪣', requiredLevel: 13, requiresUpgrade: 'bucket_copper', category: 'fishing_gear' },
  { id: 'bucket_gold',   name: 'Guldspand',      description: 'Holder 25 fisk',  cost: 2400, icon: '🪣', requiredLevel: 18, requiresUpgrade: 'bucket_silver', category: 'fishing_gear' },

  // ── ØRKEN-SÆT ── // CATEGORY: travel
  { id: 'desert_sunglasses', name: 'Solbriller', description: 'Beskytter dine øjne i ørkensolen. Kræves til Ørkensøen.', cost: 200, icon: '🕶️', requiredLevel: 1, category: 'travel' },
  { id: 'desert_waterbottle', name: 'Vandflaske', description: 'Holder dig hydreret i varmen. Kræves til Ørkensøen.', cost: 150, icon: '🍶', requiredLevel: 1, category: 'travel' },
  { id: 'desert_sunhat', name: 'Solhat', description: 'Skygger for den brændende sol. Kræves til Ørkensøen.', cost: 175, icon: '👒', requiredLevel: 1, category: 'travel' },
  { id: 'desert_sunscreen', name: 'Solcreme', description: 'SPF 50+ til lange fiskedage. Kræves til Ørkensøen.', cost: 125, icon: '🧴', requiredLevel: 1, category: 'travel' },
  // ── ISHAV-SÆT ── // CATEGORY: travel
  { id: 'arctic_beanie', name: 'Hue', description: 'Holder varmen i det kolde ishav. Kræves til Ishavet.', cost: 200, icon: '🧢', requiredLevel: 1, category: 'travel' },
  { id: 'arctic_gloves', name: 'Handsker', description: 'Varme handsker til de kolde fingre. Kræves til Ishavet.', cost: 175, icon: '🧤', requiredLevel: 1, category: 'travel' },
  { id: 'arctic_hotwater', name: 'Varmedunk', description: 'Holder dig varm i kulden. Kræves til Ishavet.', cost: 150, icon: '♨️', requiredLevel: 1, category: 'travel' },
  { id: 'arctic_scarf', name: 'Halstørklæde', description: 'Holder halsen varm. Kræves til Ishavet.', cost: 125, icon: '🧣', requiredLevel: 1, category: 'travel' },
  // ── ADGANG: Magnet, Robåd, Pandelampe ── // CATEGORY: travel
  { id: 'magnet', name: 'Magnet', description: 'En kraftig magnet. Kan måske trække noget metalisk op fra vandet...', cost: 650, icon: '🧲', requiredLevel: 6, category: 'travel' },
  { id: 'rowboat', name: 'Robåd', description: 'Adgang til fjerne øer', cost: 980, icon: '🚣‍♂️', requiredLevel: 8, category: 'travel' },
  { id: 'headlamp', name: 'Pandelampe', description: 'En kraftig lygte til mørke steder. Giver adgang til Den Mørke Grotte via Den Tropiske Ø.', cost: 2500, icon: '🔦', requiredLevel: 5, category: 'travel' },
  // ── SEJLBÅD ── // CATEGORY: travel
  { id: 'luxury_boat', name: 'Sejlbåd', description: 'En flot sejlbåd. (+15 Erfaring)', cost: 12500, icon: '⛵', requiredLevel: 20, permanent: true, category: 'travel' },

  // ── CONSUMABLES (madding) ── // CATEGORY: bait
  { id: 'bait_fly',      name: 'Farverig Flue',         description: 'Tiltrækker frøer! (+12 Held)', cost: 300, icon: '🪰', requiredLevel: 3, consumable: true, duration: 600, category: 'bait' },
  { id: 'bait_conch',    name: 'Sød Madding',           description: 'Sød madding der tiltrækker sjældne fisk. (+6 Held)',         cost: 85,  icon: '🍯', requiredLevel: 5,  consumable: true, duration: 600, category: 'bait' },
  { id: 'bait_fossil', name: 'Fossil-slam', description: '25% chance for fossil pr. kast i 10 min.', cost: 160, icon: '🌑', requiredLevel: 8, consumable: true, duration: 600, category: 'bait' },
  { id: 'biolum_floats', name: 'Selvlysende Prop', description: 'Prop der lyser i mørket. Tiltrækker Glødende Axolotl i Den Mørke Grotte.', cost: 1350, icon: '🌟', requiredLevel: 15, permanent: true, category: 'fishing_gear' },
  { id: 'legendary_bait', name: 'Legendarisk Maddingspakke', description: 'Engangs: Garanteret 1 legendarisk fisk', cost: 4500, icon: '🌈', requiredLevel: 16, consumable: true, category: 'bait' },
  { id: 'haj_blod', name: 'Hajblod', description: 'Hajer kan lugte blod på flere hundrede meters afstand! Tiltrækker Hvidhaj. (+15 Held)', cost: 1850, icon: '🩸', requiredLevel: 12, consumable: true, duration: 600, category: 'bait' },
  { id: 'perle_lim', name: 'Perlelim', description: 'Specielt perlelim fra dybet. Tiltrækker Østers med Perle. (+15 Held)', cost: 2200, icon: '🦪', requiredLevel: 14, consumable: true, duration: 600, category: 'bait' },

  // ── LEGENDARISK: Permanent Guld Krog ── // CATEGORY: legendary
  { id: 'golden_hook', name: 'Guld Krog', description: 'En legendarisk guldkrog. Låser op for Den Gyldne Karpe overalt! (+15 Rigdom)', cost: 3950, icon: '🪝', requiredLevel: 18, permanent: true, category: 'legendary' },
  // v2.0: Gammel stærk ost
  { id: 'cheese_bought', name: 'Gammel Stærk Ost', description: 'En ildelugtende delikatesse. Rotter elsker den!', cost: 850, icon: '🧀', requiredLevel: 1, category: 'legendary' },
  { id: 'feather_bought', name: 'Tropisk Papegøjefjer', description: 'En farvestrålende fjer fra en tropisk papegøje. Samler du alle tre fjer, tilkalder du papegøjen!', cost: 1500, icon: '🪶', requiredLevel: 8, category: 'legendary' },
];
