import type { LocationConfig } from '../types/game.js';
import type { LocationId } from '../types/locations.js';

export const LOCATION_DISPLAY = {
  pier: 'Den Gamle Mole',
  smaragd: 'Skovsøen',
  abyss: 'Dybet',
  tropical_island: 'Den Tropiske Ø',
  desert_lake: 'Ørkensøen',
  arctic_sea: 'Ishavet',
  forbidden: 'Den Forbudte Sø',           // ← NYT NAVN
  cave: 'Den Mørke Grotte',
  jungle_island: 'Jungleøen'
} as const;

export const FORBIDDEN_DESCRIPTION =
  'Farlig piratsø med legendariske skatte og mystiske væsener';

export const LOCATIONS = {
  pier: {
    id: 'pier', name: 'Den Gamle Mole', emoji: '🏚', unlockLevel: 1, requiresItem: null,
    type: 'fishing', description: '',
    bgColor: 0x87CEEB, waterColor: 0x0099cc, fogColor: 0x87CEEB,
    fogNear: 20, fogFar: 60,
    specialRules: { nothingChance: 0, hasSeagulls: true },
    collectibleTypes: ['cheese', 'feather'],
    lockReason: null
  },
  // ==================== ÆNDRET TIL TO-TRINS ADGANGSSYSTEM + START-FIX ====================
  smaragd: {
    id: 'smaragd', name: 'Skovsøen', emoji: '🌲', unlockLevel: 3, requiresItem: 'travel_pass', // Ændret til level 3 (tidligere 5)
    type: 'fishing', description: '',
    travelRequires: 'travel_pass',
    fishRequires: 'license_smaragd',
    bgColor: 0x0a2a1a, waterColor: 0x1e9a8a, fogColor: 0x0a2a1a,
    fogNear: 20, fogFar: 60,
    specialRules: { nothingChance: 0, fossilBonus: 0.006, hasSeagulls: true },
    collectibleTypes: ['cheese'],
    lockReason: 'Kræver Rejsekort fra butikken'
  },
  // ====================================================================================
  abyss: {
    id: 'abyss',
    name: 'Dybet',
    emoji: '🌊',
    unlockLevel: 8,
    requiresItem: 'travel_pass',
    travelRequires: 'travel_pass',
    fishRequires: 'license_abyss',
    type: 'fishing',
    description: '',
    lockReason: 'Kræver Rejsekort fra butikken',
    bgColor: 0x050520,
    waterColor: 0x001133,
    fogColor: 0x050520,
    fogNear: 20,
    fogFar: 60,
    specialRules: {
      nothingChance: 0,
      plesioChance: 0.04,
      fossilBonus: 0.015,
      darkLocation: true,
      requiresBambus: true,
      hasSeagulls: true,
    },
    collectibleTypes: []
  },
  forbidden: {
    id: 'forbidden', name: 'Den Forbudte Sø', emoji: '🏴‍☠️', unlockLevel: 1, requiresItem: 'map_right',
    type: 'fishing', description: '',
    bgColor: 0x1a0a2e, waterColor: 0x3b0066, fogColor: 0x1a0a2e,
    fogNear: 20, fogFar: 60,
    specialRules: { nothingChance: 0, fossilBonus: 0.03, darkLocation: true, hasSeagulls: true },
    collectibleTypes: ['feather'],
    lockReason: 'Kræver komplet skattekort'
  },
  desert_lake: {
    id: 'desert_lake', name: 'Ørkensøen', emoji: '🏜️', unlockLevel: 1, requiresItem: 'desert_set',
    type: 'fishing', description: '',
    bgColor: 0xDEB887, waterColor: 0x7FB3D3, fogColor: 0xD2B48C,
    fogNear: 25, fogFar: 70,
    specialRules: { nothingChance: 0, hasSeagulls: true },
    collectibleTypes: [],
    lockReason: 'Køb alt ørkenudstyr i butikken'
  },
  arctic_sea: {
    id: 'arctic_sea', name: 'Ishavet', emoji: '🧊', unlockLevel: 1, requiresItem: 'arctic_set',
    type: 'fishing', description: '',
    bgColor: 0xB0D4E8, waterColor: 0x4682B4, fogColor: 0xADD8E6,
    fogNear: 10, fogFar: 45,
    specialRules: { nothingChance: 0, hasSeagulls: true },
    collectibleTypes: ['feather'],
    lockReason: 'Køb alt ishavsudstyr i butikken'
  },
  fishing_cabin: {
    id: 'fishing_cabin', name: 'Fiskehytten', emoji: '🏠', unlockLevel: 1, requiresItem: 'cabin_key',
    type: 'base', description: 'Dit hjem — slap af med dine kæledyr',
    bgColor: 0x8B7355, waterColor: 0x5F9EA0, fogColor: 0x8B7355,
    fogNear: 15, fogFar: 35, bgOverride: 0x3E1F0A,
    specialRules: { nothingChance: 0, noFishing: true, hasSeagulls: true },
    collectibleTypes: [],
    lockReason: 'Find nøglen med magneten'
  },
  tropical_island: {
    id: 'tropical_island', name: 'Den Tropiske Ø', emoji: '🌴', unlockLevel: 1, requiresItem: 'rowboat',
    type: 'fishing', description: '',
    bgColor: 0x87CEEB, waterColor: 0x20B2AA, fogColor: 0x87CEEB,
    fogNear: 30, fogFar: 80,
    specialRules: { nothingChance: 0, turtleEgg: true, requiresMahogni: true, hasSeagulls: true },
    collectibleTypes: [],
    lockReason: 'Køb robåden i butikken'
  },
  cave: {
    id: 'cave', name: 'Den Mørke Grotte', emoji: '🪨', unlockLevel: 1, requiresItem: 'headlamp',
    type: 'fishing', description: '',
    bgColor: 0x020202, waterColor: 0x040a0a, fogColor: 0x020202,
    fogNear: 8, fogFar: 28, bgOverride: 0x010101, fogOverride: 0x020202,
    specialRules: {
      nothingChance: 0,
      biolumBoost: true,
      requiresMahogni: true,
      requiresHeadlamp: true,
      hasSeagulls: false,
    },
    collectibleTypes: ['crystal'],
    lockReason: 'Køb robåd + pandelampe i butikken'
  },
  jungle_island: {
    id: 'jungle_island', name: 'Jungleøen', emoji: '🦕', unlockLevel: 1, requiresItem: '__jungle_discovered__',
    type: 'world', description: 'En forhistorisk jungleø — opdaget med Plesiosaurus',
    bgColor: 0x1a4a1a, waterColor: 0x228855, fogColor: 0x1a3a1a,
    fogNear: 15, fogFar: 50,
    specialRules: { nothingChance: 0, hasSeagulls: true },
    collectibleTypes: [],
    lockReason: 'Opdag øen via Plesiosaurus'
  }
  // ← NYE LOKATIONER TILFØJES HER – kun ét sted!
} as const satisfies Record<LocationId, LocationConfig>;

export const AREAS: LocationConfig[] = Object.values(LOCATIONS);

export function getLocation(id: string): LocationConfig {
  return (LOCATIONS as Record<string, LocationConfig>)[id] ?? LOCATIONS.pier;
}
