import type { FarvandeMap, RegnehistorieTemplate, LetteRegnehistorieTemplate, OpMultipliersMap } from '../types/math.js';

export const FARVANDE = {
  kysten: {
    name: "🏖️ Kysten",
    desc: "0.–3. klasse",
    allowedOps: ['+','-','tenfriends','100friends'],
    allowedCategories: ['basic','lette-historier'],
    canUseDecimal: false,
    canUseNegative: false
  },
  aabenhav: {
    name: "⛵ Det Åbne Hav",
    desc: "4.–6. klasse – regnehistorier med hajer & fisk",
    allowedOps: ['+','-','*','/','multi-term','skaeve100friends'],
    allowedCategories: ['basic','multi-term','regnehistorier'],
    canUseDecimal: false,
    canUseNegative: false
  },
  dybet: {
    name: "🐋 Dybet",
    desc: "7.–9. klasse",
    allowedOps: ['+','-','*','/','multi-term','decimal','equation'],
    allowedCategories: ['basic','multi-term','equations','decimals'],
    canUseDecimal: true,
    canUseNegative: true
  }
} as const satisfies FarvandeMap;

export function getDifficultyMultiplier(difficulty: string): number {
  if (difficulty === 'expert') return 10;
  if (difficulty === 'intermediate') return 4;
  return 1;
}

export const REGNEHISTORIE_TEMPLATES: RegnehistorieTemplate[] = [
  // + (addition)
  { type: '+', template: "Der svømmer {a} fisk i havet, og {b} gemmer sig i tangen – hvor mange fisk er der i alt?", unit: "fisk", minA:8, maxA:35, minB:3, maxB:18 },
  { type: '+', template: "{a} hajer kredser om båden, og der kommer {b} mere – hvor mange hajer er der nu?", unit: "hajer", minA:2, maxA:8, minB:4, maxB:15 },
  { type: '+', template: "En dykker ser {a} hajer om formiddagen og {b} om eftermiddagen – hvor mange i alt?", unit: "hajer", minA:5, maxA:22, minB:3, maxB:14 },

  // − (subtraction)
  { type: '-', template: "En haj koster {a} kr., og du har {b} kr. – hvor mange mangler du?", unit: "kr.", minA:45, maxA:220, minB:10, maxB:180, cond: (a,b)=>a>b },
  { type: '-', template: "En fisker fanger {a} fisk og sælger {b} – hvor mange har han tilbage?", unit: "fisk", minA:18, maxA:65, minB:5, maxB:28 },
  { type: '-', template: "En haj har {a} tænder – den mister {b} under jagten. Hvor mange har den nu?", unit: "tænder", minA:50, maxA:150, minB:8, maxB:35 },

  // × (multiplication)
  { type: '*', template: "En fiskebutik sælger {a} fisk om dagen – hvor mange på {b} dage?", unit: "fisk", minA:12, maxA:35, minB:3, maxB:7 },
  { type: '*', template: "En haj svømmer {a} km om dagen – hvor langt på {b} dage?", unit: "km", minA:7, maxA:22, minB:3, maxB:6 },
  { type: '*', template: "{b} både fanger hver {a} fisk – hvor mange fisk fanger de tilsammen?", unit: "fisk", minA:8, maxA:25, minB:3, maxB:6 },

  // ÷ (division – altid præcis)
  { type: '/', template: "En båd fanger {total} fisk og deler dem ligeligt mellem {div} fiskere – hvor mange får hver?", unit: "fisk", totalMin:24, totalMax:96, divOptions:[3,4,6,8] },
  { type: '/', template: "{total} liter saltvand fordeles på {div} akvarier – hvor mange liter er der i hvert?", unit: "liter", totalMin:36, totalMax:120, divOptions:[4,6,9] },
  { type: '/', template: "{total} hajtænder fordeles på {div} hajer – hvor mange tænder har hver?", unit: "tænder", totalMin:48, totalMax:96, divOptions:[6,8] }
];

export const LETTE_REGNEHISTORIE_TEMPLATES: LetteRegnehistorieTemplate[] = [
  // ── Generelle lette kyst-historier (strand & hav) ──
  { type: '+', template: "Der svømmer {a} fisk. Der kommer {b} mere. Hvor mange er der nu?", unit: "fisk", minA:1, maxA:3, minB:1, maxB:3 },
  { type: '+', template: "Du ser {a} krabber. Din ven ser {b} krabber. Hvor mange krabber ser I?", unit: "krabber", minA:1, maxA:4, minB:1, maxB:3 },
  { type: '+', template: "Vi finder {a} muslinger. Så finder vi {b} mere. Hvor mange muslinger har vi?", unit: "muslinger", minA:2, maxA:4, minB:1, maxB:2 },
  { type: '+', template: "Der ligger {a} håndklæder på stranden. Nogen lægger {b} mere. Hvor mange håndklæder er der nu?", unit: "håndklæder", minA:1, maxA:3, minB:1, maxB:3 },
  { type: '+', template: "Du ser {a} bølger. Så kommer der {b} mere. Hvor mange bølger er det i alt?", unit: "bølger", minA:2, maxA:4, minB:1, maxB:3 },
  { type: '+', template: "Der er {a} ispinde i fryseren. Far køber {b} mere. Hvor mange ispinde er der nu?", unit: "ispinde", minA:1, maxA:3, minB:1, maxB:3 },
  { type: '+', template: "Du tæller {a} måger på molen. Der lander {b} mere. Hvor mange måger er der nu?", unit: "måger", minA:2, maxA:4, minB:1, maxB:3 },
  { type: '+', template: "Der sejler {a} både i havnen. Der kommer {b} mere. Hvor mange både er der nu?", unit: "både", minA:1, maxA:3, minB:1, maxB:3 },
  { type: '+', template: "Du samler {a} sten på stranden. Din søster finder {b} mere. Hvor mange sten har I?", unit: "sten", minA:2, maxA:4, minB:1, maxB:3 },
  { type: '+', template: "Der er {a} sandslotte. I bygger {b} mere. Hvor mange sandslotte er der nu?", unit: "sandslotte", minA:1, maxA:3, minB:1, maxB:2 },
  { type: '+', template: "Du har {a} skaller i lommen. Du finder {b} mere. Hvor mange skaller har du nu?", unit: "skaller", minA:1, maxA:3, minB:1, maxB:3 },
  { type: '+', template: "Der er {a} søstjerner i vandkanten. Du opdager {b} mere. Hvor mange søstjerner er der i alt?", unit: "søstjerner", minA:1, maxA:3, minB:1, maxB:2 },

  // ── Solbriller, is og sandaler (12 stk) ──
  { type: '+', template: "Du har {a} solbriller. Din ven giver dig {b} mere. Hvor mange solbriller har du nu?", unit: "solbriller", minA:1, maxA:4, minB:1, maxB:3 },
  { type: '+', template: "Der er {a} solbriller i tasken. Mor lægger {b} mere i. Hvor mange solbriller er der nu?", unit: "solbriller", minA:1, maxA:3, minB:1, maxB:2 },
  { type: '+', template: "Du ser {a} par solbriller i butikken. Du finder {b} par mere. Hvor mange par er der i alt?", unit: "par solbriller", minA:2, maxA:4, minB:1, maxB:3 },
  { type: '+', template: "Du køber {a} kugler is. Din ven køber {b} kugler is. Hvor mange kugler is har I tilsammen?", unit: "kugler is", minA:1, maxA:3, minB:1, maxB:3 },
  { type: '+', template: "Der er {a} is i fryseren. Far lægger {b} mere derind. Hvor mange is er der nu?", unit: "is", minA:2, maxA:4, minB:1, maxB:3 },
  { type: '+', template: "Du spiser {a} kugler is. Så får du {b} kugler mere. Hvor mange kugler is har du spist i alt?", unit: "kugler is", minA:1, maxA:3, minB:1, maxB:2 },
  { type: '+', template: "Der står {a} is i kiosken. Manden sætter {b} flere frem. Hvor mange is er der nu?", unit: "is", minA:2, maxA:4, minB:1, maxB:3 },
  { type: '+', template: "Du har {a} par sandaler. Du får {b} nye par. Hvor mange par sandaler har du nu?", unit: "par sandaler", minA:1, maxA:3, minB:1, maxB:2 },
  { type: '+', template: "Der står {a} par sandaler ved døren. Nogen stiller {b} par mere. Hvor mange par er der nu?", unit: "par sandaler", minA:1, maxA:3, minB:1, maxB:3 },
  { type: '+', template: "Du tæller {a} par sandaler i butikken. Du finder {b} par mere. Hvor mange par er der i alt?", unit: "par sandaler", minA:2, maxA:4, minB:1, maxB:2 },
  { type: '+', template: "Der ligger {a} par sandaler på stranden. Der kommer {b} par mere. Hvor mange par er der nu?", unit: "par sandaler", minA:1, maxA:3, minB:1, maxB:3 },

  // ── Solcreme (5 stk) ──
  { type: '+', template: "Du har {a} tube solcreme. Mor giver dig {b} mere. Hvor mange tuber har du nu?", unit: "tuber solcreme", minA:1, maxA:4, minB:1, maxB:2 },
  { type: '+', template: "Der er {a} tuber solcreme i strandtasken. Far putter {b} mere i. Hvor mange tuber er der nu?", unit: "tuber solcreme", minA:1, maxA:3, minB:1, maxB:2 },
  { type: '+', template: "Du ser {a} tuber solcreme i butikken. Din ven finder {b} mere. Hvor mange tuber er der i alt?", unit: "tuber solcreme", minA:2, maxA:4, minB:1, maxB:2 },
  { type: '+', template: "Der ligger {a} tube solcreme på håndklædet. Nogen lægger {b} mere. Hvor mange tuber er der nu?", unit: "tuber solcreme", minA:1, maxA:3, minB:1, maxB:2 },
  { type: '+', template: "Du pakker {a} tube solcreme i tasken. Mor pakker {b} mere. Hvor mange tuber er der i tasken?", unit: "tuber solcreme", minA:1, maxA:3, minB:1, maxB:3 },
];

export const OP_MULTIPLIERS = { '+': 1, '-': 2, '*': 3, '/': 4, 'tenfriends': 1, '100friends': 1.25, 'skaeve100friends': 1.5 } as const satisfies OpMultipliersMap;
