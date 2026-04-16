export type RoomId = 'living' | 'kitchen' | 'bedroom';

export interface FurnitureShopItem {
  id: string;
  name: string;
  emoji: string;
  description: string;
  room: RoomId;
  price: number;
  /** Fremhævet i butikken (kant + diskret baggrund). */
  featured?: boolean;
}

export const QUEST_COMPANION_DEFAULTS: Record<string, RoomId> = {
  turtle: 'living',
  axolotl: 'living',
  cheese: 'living',
  golden_frog: 'living',
  pirate_cat: 'living',
  pirate_chest: 'living',
  ice_cube: 'kitchen',
  music_box: 'living',
  ur_krystal: 'bedroom',
  winner_trophy: 'living',
};

const COMPANION_DISPLAY: Record<string, { emoji: string; name: string }> = {
  turtle: { emoji: '🐢', name: 'Skildpadde' },
  axolotl: { emoji: '🦎', name: 'Axolotl' },
  cheese: { emoji: '🧀', name: 'Ost' },
  golden_frog: { emoji: '🐸', name: 'Gylden frø' },
  pirate_cat: { emoji: '🐱', name: 'Skibskatten Kradse' },
  pirate_chest: { emoji: '📦', name: 'Piratens Skattekiste' },
  ice_cube: { emoji: '🧊', name: 'Mystisk Isterning' },
  music_box: { emoji: '🎵', name: 'Spilledåse' },
  ur_krystal: { emoji: '💠', name: 'Ur-Krystal' },
  winner_trophy: { emoji: '🏆', name: 'Vindertrofæ' },
};

/** Dansk label til UI (butik eller kompagnon). */
export function getFurnitureDisplayLabel(type: string): string {
  const shop = FURNITURE_SHOP_ITEMS.find((f) => f.id === type);
  if (shop) return `${shop.emoji} ${shop.name}`;
  const c = COMPANION_DISPLAY[type];
  if (c) return `${c.emoji} ${c.name}`;
  return type;
}

export const FURNITURE_SHOP_ITEMS: FurnitureShopItem[] = [
  {
    id: 'fireplace',
    name: 'Brændeovn',
    emoji: '🔥',
    description: 'Stenpejs med animerede flammer',
    room: 'living',
    price: 600,
    featured: true,
  },
  { id: 'table', name: 'Bord', emoji: '🪵', description: 'Stort træbord med fire ben', room: 'living', price: 400 },
  { id: 'rug', name: 'Gulvtæppe', emoji: '🟫', description: 'Stribet tæppe i varme farver', room: 'living', price: 300 },
  { id: 'chair', name: 'Stol', emoji: '🪑', description: 'Trægstol med ryglæn', room: 'living', price: 300 },
  { id: 'shelf', name: 'Bogreol', emoji: '📚', description: 'Reol med tre hylder og farvede bøger', room: 'living', price: 500 },
  { id: 'rod_wall', name: 'Fiskestangsholder', emoji: '🎣', description: 'Vægmonteret holder med fire stænger', room: 'living', price: 400 },
  { id: 'table_vase', name: 'Vase med blomster', emoji: '💐', description: 'Glasvase med gul og blå blomst', room: 'living', price: 200 },
  { id: 'mounted_fish', name: 'Vægfisk', emoji: '🐟', description: 'Vægmonteret trofæ-fisk', room: 'living', price: 500 },
  {
    id: 'aquarium',
    name: 'Akvarium',
    emoji: '🐠',
    description: 'Glas-akvarium med guldfisk og bobler',
    room: 'living',
    price: 800,
    featured: true,
  },

  { id: 'kitchen_table', name: 'Køkkenbord', emoji: '🪵', description: 'Langt træbord langs vinduet', room: 'kitchen', price: 500 },
  { id: 'kitchen_stove', name: 'Komfur', emoji: '🍳', description: 'Fritstående ovn med fire kogeplader', room: 'kitchen', price: 600 },
  { id: 'kitchen_sink', name: 'Køkkenvask', emoji: '🚰', description: 'Vask med messinghane og underskab', room: 'kitchen', price: 500 },
  {
    id: 'gulvplante',
    name: 'Gulvplante',
    emoji: '🪴',
    description: 'Stor grøn plante i glaseret vase til køkkenet',
    room: 'kitchen',
    price: 350,
  },
  { id: 'kitchen_shelf', name: 'Hængehylde', emoji: '🫖', description: 'Vægmonteret hylde med krus og krukker', room: 'kitchen', price: 600 },
  { id: 'kitchen_rug', name: 'Køkkentæppe', emoji: '🟫', description: 'Varmt gulvtæppe i gyldenbrun', room: 'kitchen', price: 500 },
  { id: 'kitchen_lamp', name: 'Loftslampe', emoji: '💡', description: 'Messing-hængelampe fra loftet', room: 'kitchen', price: 700 },
  {
    id: 'kitchen_telescope',
    name: 'Stjernekikkert',
    emoji: '🔭',
    description: 'Antik stjernekikkert på stativ — et smukt relikvie fra en svunden tid',
    room: 'kitchen',
    price: 1200,
    featured: true,
  },

  {
    id: 'bedroom_bed',
    name: 'Seng',
    emoji: '🛏️',
    description: 'Træseng med madras, pude og bordeaux-dyne',
    room: 'bedroom',
    price: 1000,
    featured: true,
  },
  { id: 'bedroom_nightstand', name: 'Natbord', emoji: '🗄️', description: 'Lille natbord med skuffe', room: 'bedroom', price: 500 },
  { id: 'bedroom_lamp', name: 'Natbordslampe', emoji: '🛋️', description: 'Bordlampe med messing-fod og cremé skærm', room: 'bedroom', price: 600 },
  { id: 'bedroom_dresser', name: 'Kommode', emoji: '🗃️', description: 'Bred kommode med tre skuffer', room: 'bedroom', price: 800 },
  { id: 'bedroom_rug', name: 'Soveværelsetæppe', emoji: '🟥', description: 'Bordeaux gulvtæppe med dobbelt ramme', room: 'bedroom', price: 500 },
  { id: 'bedroom_frame', name: 'Billedramme', emoji: '🖼️', description: 'Vægmonteret ramme med havmotiv', room: 'bedroom', price: 600 },
  {
    id: 'bedroom_mirror',
    name: 'Gulvspejl',
    emoji: '🪞',
    description: 'Klassisk stående spejl i mørkt træ med messing',
    room: 'bedroom',
    price: 700,
    featured: true,
  },
  {
    id: 'bedroom_wardrobe',
    name: 'Klædeskab',
    emoji: '🚪',
    description: 'Højt klædeskab med to låger og dekorative paneler',
    room: 'bedroom',
    price: 900,
    featured: true,
  },
];

/** Default-rum for shop-møbler og kompagnoner (når ikke overskrevet i furnitureRoomAssignment). */
export function getDefaultRoomForType(type: string): RoomId {
  const shopItem = FURNITURE_SHOP_ITEMS.find((f) => f.id === type);
  if (shopItem) return shopItem.room;
  return QUEST_COMPANION_DEFAULTS[type] ?? 'living';
}

export function getCurrentRoom(
  type: string,
  furnitureRoomAssignment: Record<string, string>,
): RoomId {
  const assigned = furnitureRoomAssignment[type];
  if (assigned === 'living' || assigned === 'kitchen' || assigned === 'bedroom') {
    return assigned;
  }
  return getDefaultRoomForType(type);
}
