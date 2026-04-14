import type { CollectibleId, CollectiblesRegistry, CompanionDef } from '../types/collectibles.js';

export { PIRATE_QUOTES } from './pirate-quotes.js';

export const COLLECTIBLES = {
  fossil: {
    id: 'fossil', invKey: 'fossilCount', icon: '🦴', name: 'Fossil', namePlural: 'Fossiler',
    npcId: 'pirate', npcName: 'Kaptajn Rotteskæg', npcIcon: '🏴‍☠️',
    color: '#d97706', bgColor: 'rgba(80,60,30,0.85)', borderColor: 'rgba(168,130,80,0.4)',
    modalBg: 'rgba(20,10,5,0.97)', modalBorder: 'rgba(180,83,9,0.5)',
    btnBg: '#78350f', btnBorder: '#451a03', btnColor: '#fde68a',
    milestoneRewards: {
      1: { type: 'hvalbof', toast: '🏴‍☠️🥩 Piraten er imponeret! Her – tag en Kæmpe Hvalbøf! Brug den til at lokke Krakenen frem i Dybet!', particles: 40 },
      5: { type: 'xp_coins', xp: 1200, coins: 1200, toast: '🏴‍☠️💰 Splitte mine bramsejl! 5 fossiler – her er en skat fra kisten! +1200 mønter & +1200 XP', particles: 60 },
      10: { type: 'xp_coins', xp: 2500, coins: 2500, toast: '🏴‍☠️💰 TI fossiler!! Du er en legende, matros! +2500 mønter & +2500 XP', particles: 80 },
    },
    dialogs: (d) => {
      if (d === 0) return '"Arrr! Har du knogle-rester til kaptajnen, matros?"';
      if (d === 1) return '"Et fossil! Godt gået, matros! Tag denne hvalbøf – den lugter af eventyr!"';
      if (d < 5) return `"${d} fossiler! Du er en rigtig skatte-rotte!"`;
      if (d === 5) return '"FEM fossiler! Splitte mine bramsejl – her er guld fra skattekisten!"';
      if (d < 10) return `"${d} fossiler! Du sejler snart bedre end mig!"`;
      if (d === 10) return '"TI fossiler!! Du er en legende, matros – tag dette skatte-guld! 🏴‍☠️"';
      return `"${d} fossiler – du er den største skattejæger siden Sorte Skæg!"`;
    },
    emptyText: 'Ingen fossiler? Prøv Skovsøen eller Den Forbudte Sø, matros!',
    returnText: 'Kom tilbage med flere fossiler fra fortiden!',
  },
  conch: {
    id: 'conch', invKey: 'conchCount', icon: '🐚', name: 'Konkylie', namePlural: 'Konkylier',
    npcId: 'penguin', npcName: 'Den Kolde Pingvin', npcIcon: '🐧',
    color: '#38bdf8', bgColor: 'rgba(10,25,40,0.85)', borderColor: 'rgba(125,211,252,0.4)',
    modalBg: 'rgba(10,25,40,0.97)', modalBorder: 'rgba(125,211,252,0.4)',
    btnBg: '#0284c7', btnBorder: '#075985', btnColor: 'white',
    milestoneRewards: {
      1: { type: 'cheese', toast: '🐧 Pingvinen gylper en OST op! 🧀 (Rotten låses op som ven!)', particles: 30 },
      5: { type: 'koedklump', toast: '🐧🍖 GAKGAK! Pingvinen graver en Klistret Kødklump frem fra sneen! Brug den til at lokke Søuhyret frem i Ørkensøen!', particles: 50 },
      10: { type: 'xp_coins', xp: 2000, coins: 2000, toast: '🐧 Pingvinen laver en dans for dig! +2000 mønter & +2000 XP', particles: 80 },
    },
    dialogs: (d) => {
      if (d === 0) return '"Brrr… det er koldt! Har du en konkylie til mit hus?"';
      if (d === 1) return '"Gak gak! Første konkylie! Jeg er så glad!! 🐧"';
      if (d < 5) return `"${d} konkylier! Mit hus bliver større og større!"`;
      if (d === 5) return '"FEM!! GAKGAK! Se hvad jeg fandt under isen – en klistret kødklump! Tag den!!"';
      if (d < 10) return `"${d} konkylier! Det er det flotteste pingvin-palads!"`;
      if (d === 10) return '"TI konkylier!! Mit hus er nu et SLOT! Du er min bedste ven!"';
      return `"${d} konkylier – jeg elsker dig for evigt! 🐧❤️"`;
    },
    emptyText: 'Brrr… ingen konkylier? De ligger på molen og på øerne!',
    returnText: 'Kom tilbage med flere konkylier til pingvinen!',
  },
  pearl: {
    id: 'pearl', invKey: 'pearlCount', icon: '💎', name: 'Perle', namePlural: 'Perler',
    npcId: 'mermaid', npcName: 'Havfruen', npcIcon: '🧜‍♀️',
    color: '#e2e8f0', bgColor: 'rgba(60,65,85,0.85)', borderColor: 'rgba(248,248,255,0.3)',
    modalBg: 'rgba(15,20,40,0.97)', modalBorder: 'rgba(200,200,255,0.4)',
    btnBg: '#6366f1', btnBorder: '#4338ca', btnColor: 'white',
    milestoneRewards: {
      1: { type: 'bait', toast: '🧜‍♀️🎣 Havfruen smiler og rækker dig en Mystisk Madding fra havets bund! Nu kan du fiske i Dybet!', particles: 30 },
      5: { type: 'xp_coins', xp: 1500, coins: 1500, toast: '🧜‍♀️ Havfruen giver dig et perle-kys! +1500 mønter & +1500 XP', particles: 50 },
      10: { type: 'xp_coins', xp: 2500, coins: 2500, toast: '🧜‍♀️ Havfruen synger en smuk sang for dig! +2500 mønter & +2500 XP', particles: 80 },
    },
    dialogs: (d) => {
      if (d === 0) return '"Åh… en gæst fra overfladen! Har du en lille perle til mig?"';
      if (d === 1) return '"En perle! Tag denne mystiske madding som tak – den virker i Dybet! ✨"';
      if (d < 5) return `"${d} perler… Mit hjerte svømmer af glæde!"`;
      if (d === 5) return '"FEM perler! Nu kan jeg næsten lave mit halsbånd! 💖"';
      if (d < 10) return `"${d} perler! Havet synger dit navn, lille fisker!"`;
      if (d === 10) return '"TI perler!! Det bliver det smukkeste smykke nogensinde! 🌊"';
      return `"${d} perler i alt – du er en ægte ven af havet! 🧜‍♀️"`;
    },
    emptyText: 'Ingen perler endnu? Fang østers i Dybet – jeg venter på dig! 💙',
    returnText: 'Havfruen venter tålmodigt på din næste perle...',
  },
} as CollectiblesRegistry;

export const COMPANIONS_DATABASE: CompanionDef[] = [
  { id: 'rat',     name: 'Rotten',      icon: '🐀', emoji: '🐀', color: '#78716c', description: 'Fortæller fiskefakta og holder dig selskab', unlockType: 'collectibles', unlockValue: 'cheeses' },
  { id: 'parrot',  name: 'Papegøjen',   icon: '🦜', emoji: '🦜', color: '#34d399', description: 'Siger kloge (og fjollede) ting fra din skulder', unlockType: 'collectibles', unlockValue: 'feathers' },
  { id: 'turtle',  name: 'Skildpadden', icon: '🐢', emoji: '🐢', color: '#4ade80', description: 'Bor i fiskehytten og elsker blade', unlockType: 'turtle_hatch' },
  { id: 'monkey',  name: 'Aben',        icon: '🐒', emoji: '🐒', color: '#f59e0b', description: 'Din sjældne matematik-hjælper i regnestykker!', unlockType: 'wish' },
  { id: 'balloon', name: 'Hjerte-ballon', icon: '🎈', emoji: '❤️', color: '#f472b6', description: 'Elsker gemmeleg – find den overalt i spillet!', unlockType: 'wish' },
  { id: 'golden_frog', name: 'Den Gyldne Frø', icon: '🐸', emoji: '🐸', color: '#fbbf24', description: 'Din gyldne ven der bor i fiskehytten – kan flyttes rundt!', unlockType: 'golden_frog_catch' },
  // Ny: Glødende Axolotl tilføjet til kæledyr-systemet
  { id: 'axolotl', name: 'Glødende Axolotl', icon: '🦎', emoji: '🦎', color: '#FFB6C1', description: 'Et lysende padde-dyr, der bor i fiskehytten!', unlockType: 'axolotl_catch' },
  { id: 'cheese_pet', name: 'Gammel Ost', icon: '🧀', emoji: '🧀', color: '#f59e0b', description: 'En købt ost der bor i fiskehytten.', unlockType: 'cheese_bought' },
];

export function getNextMilestone(type: CollectibleId, delivered: number): number | null {
  const cfg = COLLECTIBLES[type];
  if (!cfg) return null;
  const milestones = Object.keys(cfg.milestoneRewards)
    .map(Number)
    .sort((a, b) => a - b);
  for (const m of milestones) {
    if (delivered < m) return m;
  }
  return null;
}
