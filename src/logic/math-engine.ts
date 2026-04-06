import type {
  EmojiSizeLevel,
  FarvandDef,
  FarvandId,
  MathDifficulty,
  MathProblem,
  RegnehistorieTemplate,
} from '../types/math.js';
import {
  FARVANDE,
  getDifficultyMultiplier,
  LETTE_REGNEHISTORIE_TEMPLATES,
  REGNEHISTORIE_TEMPLATES,
} from '../data/math-config.js';

/** Hav/fiske-tema — delt af alle emoji-opgavetyper */
export const EMOJI_POOL: string[] = [
  '⚓',
  '🏴‍☠️',
  '🐟',
  '🐠',
  '🐡',
  '🐳',
  '🐋',
  '🐬',
  '🦭',
  '🦈',
  '🐙',
  '🦑',
  '🦀',
  '🦞',
  '🦐',
  '🪼',
  '🪸',
  '🐚',
  '🦪',
  '🐢',
  '🦦',
  '🪱',
  '🎣',
  '🪝',
  '⛵',
  '🚤',
  '🛥️',
  '🛶',
  '🏖️',
  '🏝️',
  '⛱️',
  '🌴',
  '🌅',
  '☀️',
  '☁️',
  '🧭',
  '🗺️',
  '🤿',
  '🛟',
  '🧜',
  '🧜‍♀️',
  '🧜‍♂️',
  '🦜',
  '🪙',
  '🚢',
  '💰',
  '🐦',
  '🌞',
  '🌤️',
  '🏄',
  '🏊',
];

export const EMOJI_SIZES = {
  small: { fontSize: '1.2rem', label: 'lille' },
  medium: { fontSize: '2rem', label: 'mellem' },
  large: { fontSize: '3.2rem', label: 'stor' },
} as const;

export const SIZE_PAIRS: [EmojiSizeLevel, EmojiSizeLevel][] = [
  ['small', 'medium'],
  ['small', 'large'],
  ['medium', 'large'],
];

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getCountForSize(size: EmojiSizeLevel): number {
  switch (size) {
    case 'small':
      return randInt(4, 7);
    case 'medium':
      return randInt(2, 5);
    case 'large':
      return randInt(1, 3);
    default:
      return randInt(2, 5);
  }
}

export function generateEmojiCountingProblem(
  selectedOps: string[],
  selectedFarvand: 'kysten' | 'aabenhav',
  mathDifficulty: MathDifficulty
): MathProblem {
  const valid = selectedOps.filter((o): o is '+' | '-' | '*' | '/' =>
    o === '+' || o === '-' || o === '*' || o === '/',
  );
  const ops: ('+' | '-' | '*' | '/')[] =
    valid.length > 0 ? valid : [selectedFarvand === 'kysten' ? '+' : '+'];
  const op = ops[Math.floor(Math.random() * ops.length)]!;

  const emoji = EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)]!;

  const maxResult =
    selectedFarvand === 'kysten' && mathDifficulty === 'beginner' ? 10 : 20;

  let a: number;
  let b: number;
  let answer: number;

  if (op === '+') {
    const maxA = maxResult === 10 ? 9 : 10;
    a = randInt(1, maxA);
    const maxB = Math.min(10, maxResult - a);
    b = randInt(1, maxB);
    answer = a + b;
  } else if (op === '-') {
    a = randInt(2, 10);
    b = randInt(1, a - 1);
    answer = a - b;
  } else if (op === '*') {
    a = randInt(1, 10);
    b = randInt(1, 10);
    answer = a * b;
  } else {
    b = randInt(1, 10);
    const maxQuotient = Math.floor(10 / b);
    const quotient = randInt(1, maxQuotient);
    a = b * quotient;
    answer = quotient;
  }

  const leftEmojis = emoji.repeat(a);
  const rightEmojis = emoji.repeat(b);
  const opSymbol = op === '*' ? '×' : op === '/' ? '÷' : op === '-' ? '−' : op;
  const question = `${leftEmojis} ${opSymbol} ${rightEmojis}`;

  return {
    question,
    answer,
    difficulty: selectedFarvand === 'kysten' ? 1 : 2,
    op,
    category: 'emoji-counting',
    displayType: 'emoji-counting',
    xpBonus: 15,
    isDecimal: false,
    emojiData: {
      emoji,
      leftCount: a,
      rightCount: b,
      operator: op,
    },
  };
}

export function generateEmojiMostLeastProblem(): MathProblem {
  const mode: 'most' | 'least' = Math.random() < 0.5 ? 'most' : 'least';
  const leftEmoji = EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)]!;
  const rightEmoji = EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)]!;
  const countA = randInt(1, 10);
  let countB = randInt(1, 10);
  while (countB === countA) {
    countB = randInt(1, 10);
  }
  const correctSide: 'left' | 'right' =
    mode === 'most' ? (countA > countB ? 'left' : 'right') : countA < countB ? 'left' : 'right';
  const question = mode === 'most' ? 'Tryk på den med FLEST!' : 'Tryk på den med FÆRREST!';
  return {
    question,
    answer: -1,
    difficulty: 1,
    op: '+',
    category: 'emoji-most-least',
    displayType: 'emoji-most-least',
    xpBonus: 10,
    isDecimal: false,
    emojiChoiceData: {
      mode,
      leftEmoji,
      rightEmoji,
      leftCount: countA,
      rightCount: countB,
      correctSide,
    },
  };
}

export function generateEmojiSizeCompareProblem(): MathProblem {
  const mode: 'biggest' | 'smallest' = Math.random() < 0.5 ? 'biggest' : 'smallest';
  const emoji = EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)]!;
  const pair = SIZE_PAIRS[Math.floor(Math.random() * SIZE_PAIRS.length)]!;
  const swapped = Math.random() < 0.5;
  const leftSize: EmojiSizeLevel = swapped ? pair[1]! : pair[0]!;
  const rightSize: EmojiSizeLevel = swapped ? pair[0]! : pair[1]!;
  const leftCount = getCountForSize(leftSize);
  const rightCount = getCountForSize(rightSize);
  const sizeRank: Record<EmojiSizeLevel, number> = { small: 1, medium: 2, large: 3 };
  const correctSide: 'left' | 'right' =
    mode === 'biggest'
      ? sizeRank[leftSize] > sizeRank[rightSize]
        ? 'left'
        : 'right'
      : sizeRank[leftSize] < sizeRank[rightSize]
        ? 'left'
        : 'right';
  const question = mode === 'biggest' ? 'Tryk på de STØRSTE!' : 'Tryk på de MINDSTE!';
  return {
    question,
    answer: -1,
    difficulty: 1,
    op: '+',
    category: 'emoji-size-compare',
    displayType: 'emoji-size-compare',
    xpBonus: 10,
    isDecimal: false,
    emojiSizeData: {
      mode,
      emoji,
      leftSize,
      rightSize,
      leftCount,
      rightCount,
      correctSide,
    },
  };
}

export function generateEmojiAntalProblem(mathDifficulty: MathDifficulty): MathProblem {
  const min = mathDifficulty === 'beginner' ? 1 : 11;
  const max = mathDifficulty === 'beginner' ? 10 : 20;
  const count = randInt(min, max);

  const emoji = EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)]!;
  const question = `${emoji.repeat(count)} — Hvor mange?`;

  return {
    question,
    answer: count,
    difficulty: 1,
    op: '+',
    category: 'emoji-antal',
    displayType: 'emoji-antal',
    xpBonus: 5,
    isDecimal: false,
    emojiAntalData: {
      emoji,
      count,
    },
  };
}

function retEntalFlertal(tekst: string): string {
  let resultat = tekst;
  const entalMap: Record<string, string> = {
    hajer: 'haj',
    krabber: 'krabbe',
    muslinger: 'musling',
    håndklæder: 'håndklæde',
    bølger: 'bølge',
    ispinde: 'ispind',
    måger: 'måge',
    både: 'båd',
    sandslotte: 'sandslot',
    skaller: 'skal',
    søstjerner: 'søstjerne',
    'kugler is': 'kugle is',
    dage: 'dag',
    tænder: 'tand',
    fiskere: 'fisker',
    akvarier: 'akvarie',
    tuber: 'tube',
    flasker: 'flaske',
    poser: 'pose',
    solcremer: 'solcreme',
  };
  for (const [flertal, ental] of Object.entries(entalMap)) {
    const regex = new RegExp(`\\b1 ${flertal}\\b`, 'gi');
    resultat = resultat.replace(regex, `1 ${ental}`);
  }
  const flertalMap: Record<string, string> = {
    tube: 'tuber',
    solcreme: 'solcremer',
    flaske: 'flasker',
    pose: 'poser',
  };
  for (const [ental, flertal] of Object.entries(flertalMap)) {
    const regex = new RegExp(`\\b([2-9]|[1-9][0-9]+) ${ental}\\b`, 'gi');
    resultat = resultat.replace(regex, `$1 ${flertal}`);
  }
  return resultat;
}

export function generateRegneHistorie(
  mathDifficulty: MathDifficulty,
  opsForType: string[]
): MathProblem | null {
  const opsToCheck =
    opsForType.length > 0
      ? opsForType.filter((o) => ['+', '-', '*', '/'].includes(o))
      : ['+', '-', '*', '/'];
  const possible = REGNEHISTORIE_TEMPLATES.filter((t) => opsToCheck.includes(t.type));
  if (possible.length === 0) return null;
  const tmpl = possible[Math.floor(Math.random() * possible.length)] as RegnehistorieTemplate;

  const mult = getDifficultyMultiplier(mathDifficulty);
  let a = 0;
  let b = 0;
  let total = 0;
  let div = 0;
  let answer = 0;

  if (tmpl.type === '+') {
    a = Math.floor(Math.random() * (tmpl.maxA * mult - tmpl.minA + 1)) + tmpl.minA;
    b = Math.floor(Math.random() * (tmpl.maxB * mult - tmpl.minB + 1)) + tmpl.minB;
    answer = a + b;
  } else if (tmpl.type === '-') {
    a = Math.floor(Math.random() * (tmpl.maxA * mult - tmpl.minA + 1)) + tmpl.minA;
    b = Math.floor(Math.random() * (tmpl.maxB * mult - tmpl.minB + 1)) + tmpl.minB;
    if (tmpl.cond && !tmpl.cond(a, b)) b = Math.floor(a * 0.6);
    answer = a - b;
  } else if (tmpl.type === '*') {
    a = Math.floor(Math.random() * (tmpl.maxA * mult - tmpl.minA + 1)) + tmpl.minA;
    b = Math.floor(Math.random() * (tmpl.maxB * mult - tmpl.minB + 1)) + tmpl.minB;
    answer = a * b;
  } else if (tmpl.type === '/') {
    div = tmpl.divOptions[Math.floor(Math.random() * tmpl.divOptions.length)];
    const base = mathDifficulty === 'beginner' ? 6 : mathDifficulty === 'intermediate' ? 9 : 12;
    answer = (base + Math.floor(Math.random() * 6)) * (mathDifficulty === 'expert' ? 3 : 1);
    total = answer * div;
  }

  let question = tmpl.template
    .replace('{a}', String(a || ''))
    .replace('{b}', String(b || ''))
    .replace('{total}', String(total || ''))
    .replace('{div}', String(div || ''));
  question = retEntalFlertal(question);

  return {
    question,
    answer,
    difficulty: 2,
    op: tmpl.type,
    category: 'regnehistorier',
    displayType: 'regnehistorie',
    unit: tmpl.unit,
    xpBonus: 20,
  };
}

export function generateLetRegneHistorie(mathDifficulty?: MathDifficulty): MathProblem {
  const tmpl =
    LETTE_REGNEHISTORIE_TEMPLATES[
      Math.floor(Math.random() * LETTE_REGNEHISTORIE_TEMPLATES.length)
    ];
  const mult = getDifficultyMultiplier(mathDifficulty || 'beginner');
  const a = Math.floor(Math.random() * (tmpl.maxA * mult - tmpl.minA + 1)) + tmpl.minA;
  const b = Math.floor(Math.random() * (tmpl.maxB * mult - tmpl.minB + 1)) + tmpl.minB;
  const answer = a + b;
  let question = tmpl.template.replace('{a}', String(a)).replace('{b}', String(b));
  question = retEntalFlertal(question);
  return {
    question,
    answer,
    difficulty: 1,
    op: '+',
    category: 'lette-historier',
    displayType: 'regnehistorie',
    unit: tmpl.unit,
    xpBonus: 10,
  };
}

export function generateNumbersForOp(
  op: string,
  mathDifficulty: MathDifficulty
): { a: number; b: number } {
  let a = 0;
  let b = 0;
  if (op === '+') {
    if (mathDifficulty === 'beginner') {
      a = Math.floor(Math.random() * 9) + 1;
      b = Math.floor(Math.random() * 9) + 1;
    } else if (mathDifficulty === 'intermediate') {
      a = Math.floor(Math.random() * 50) + 10;
      b = Math.floor(Math.random() * 40) + 5;
    } else {
      a = Math.floor(Math.random() * 600) + 100;
      b = Math.floor(Math.random() * 500) + 50;
    }
  } else if (op === '-') {
    if (mathDifficulty === 'beginner') {
      a = Math.floor(Math.random() * 9) + 1;
      b = Math.floor(Math.random() * a) + 1;
    } else if (mathDifficulty === 'intermediate') {
      a = Math.floor(Math.random() * 70) + 20;
      b = Math.floor(Math.random() * (a - 1)) + 1;
    } else {
      a = Math.floor(Math.random() * 700) + 200;
      b = Math.floor(Math.random() * (a - 1)) + 1;
    }
  } else if (op === '*') {
    if (mathDifficulty === 'beginner') {
      const easyTables = [1, 2, 5, 10];
      a = easyTables[Math.floor(Math.random() * easyTables.length)];
      b = Math.floor(Math.random() * 10) + 1;
    } else if (mathDifficulty === 'intermediate') {
      a = Math.floor(Math.random() * 7) + 3;
      b = Math.floor(Math.random() * 7) + 3;
    } else {
      a = Math.floor(Math.random() * 30) + 10;
      b = Math.floor(Math.random() * 9) + 2;
    }
  } else {
    if (mathDifficulty === 'beginner') {
      const easyDivisors = [1, 2, 5, 10];
      b = easyDivisors[Math.floor(Math.random() * easyDivisors.length)];
      const ans = Math.floor(Math.random() * 9) + 1;
      a = b * ans;
    } else if (mathDifficulty === 'intermediate') {
      b = Math.floor(Math.random() * 7) + 3;
      const ans = Math.floor(Math.random() * 9) + 2;
      a = b * ans;
    } else {
      b = Math.floor(Math.random() * 9) + 2;
      const ans = Math.floor(Math.random() * 15) + 5;
      a = b * ans;
    }
  }
  return { a, b };
}

export function generateTenFriendsProblem(mathDifficulty: MathDifficulty): MathProblem {
  void mathDifficulty;
  const a = Math.floor(Math.random() * 9) + 1;
  const b = 10 - a;
  const showLeft = Math.random() < 0.5;
  return {
    question: showLeft ? `? + ${b} = 10` : `${a} + ? = 10`,
    answer: showLeft ? a : b,
    difficulty: 1,
    op: 'tenfriends',
    category: 'tenfriends',
    displayType: 'text',
  };
}

export function generate100FriendsQuestion(): MathProblem {
  const tiere = [10, 20, 30, 40, 50, 60, 70, 80, 90];
  const valgtTal = tiere[Math.floor(Math.random() * tiere.length)];
  const svar = 100 - valgtTal;

  const typer = [
    `${valgtTal} + ? = 100`,
    `? + ${valgtTal} = 100`,
    `100 − ? = ${valgtTal}`,
    `100 − ${valgtTal} = ?`,
  ];
  const visTekst = typer[Math.floor(Math.random() * typer.length)];

  let answer: number;
  if (visTekst.startsWith('?')) {
    answer = 100 - valgtTal;
  } else if (visTekst.includes('+ ?')) {
    answer = svar;
  } else if (visTekst.endsWith('= ?')) {
    answer = svar;
  } else {
    answer = svar;
  }

  return {
    question: visTekst,
    answer,
    difficulty: 1,
    op: '100friends',
    category: '100friends',
    displayType: 'text',
  };
}

export function generateSkaeve100FriendsQuestion(): MathProblem {
  const valgtTal = Math.floor(Math.random() * 99) + 1;
  const svar = 100 - valgtTal;

  const typer = [
    `${valgtTal} + ? = 100`,
    `? + ${valgtTal} = 100`,
    `100 − ? = ${valgtTal}`,
    `100 − ${valgtTal} = ?`,
  ];
  const visTekst = typer[Math.floor(Math.random() * typer.length)];

  let answer: number;
  if (visTekst.startsWith('?')) {
    answer = 100 - valgtTal;
  } else if (visTekst.includes('+ ?')) {
    answer = svar;
  } else if (visTekst.endsWith('= ?')) {
    answer = svar;
  } else {
    answer = svar;
  }

  return {
    question: visTekst,
    answer,
    difficulty: 2,
    op: 'skaeve100friends',
    category: 'skaeve100friends',
    displayType: 'text',
    xpBonus: 20,
  };
}

export function generateMultiTermProblem(mathDifficulty: MathDifficulty): MathProblem {
  const ops = ['+', '-'];
  const op1 = ops[Math.floor(Math.random() * ops.length)];
  const op2 = ops[Math.floor(Math.random() * ops.length)];
  let a = 0;
  let b = 0;
  let c = 0;
  if (mathDifficulty === 'beginner') {
    a = Math.floor(Math.random() * 8) + 2;
    b = Math.floor(Math.random() * 5) + 1;
    c = Math.floor(Math.random() * 5) + 1;
  } else if (mathDifficulty === 'intermediate') {
    a = Math.floor(Math.random() * 30) + 10;
    b = Math.floor(Math.random() * 20) + 5;
    c = Math.floor(Math.random() * 15) + 1;
  } else {
    a = Math.floor(Math.random() * 200) + 50;
    b = Math.floor(Math.random() * 100) + 20;
    c = Math.floor(Math.random() * 80) + 10;
  }
  let result = a;
  result = op1 === '+' ? result + b : result - b;
  result = op2 === '+' ? result + c : result - c;
  if (result < 0) return generateMultiTermProblem(mathDifficulty);
  const sym1 = op1 === '-' ? '−' : '+';
  const sym2 = op2 === '-' ? '−' : '+';
  return {
    question: `${a} ${sym1} ${b} ${sym2} ${c}`,
    answer: result,
    difficulty: 3,
    op: '*',
    category: 'multi-term',
    displayType: 'text',
  };
}

export function generateEquationProblem(mathDifficulty: MathDifficulty): MathProblem {
  const mult = getDifficultyMultiplier(mathDifficulty);
  const type = Math.floor(Math.random() * 3);
  let question: string;
  let answer: number;
  if (type === 0) {
    const a = Math.floor(Math.random() * 15 * mult) + 1;
    const x = Math.floor(Math.random() * 15 * mult) + 1;
    const c = a + x;
    question = `${a} + x = ${c}`;
    answer = x;
  } else if (type === 1) {
    const x = Math.floor(Math.random() * 20 * mult) + 5;
    const b = Math.floor(Math.random() * (x - 1)) + 1;
    const c = x - b;
    question = `x − ${b} = ${c}`;
    answer = x;
  } else {
    const b =
      Math.floor(Math.random() * (mathDifficulty === 'expert' ? 15 : 8)) + 2;
    const x =
      Math.floor(
        Math.random() *
          (mathDifficulty === 'expert'
            ? 20
            : mathDifficulty === 'intermediate'
              ? 12
              : 10)
      ) + 1;
    const c = b * x;
    question = `${b} × x = ${c}`;
    answer = x;
  }
  return {
    question,
    answer,
    difficulty: 3,
    op: '*',
    category: 'equations',
    displayType: 'text',
  };
}

export function generateDecimalProblem(mathDifficulty: MathDifficulty): MathProblem {
  const mult = getDifficultyMultiplier(mathDifficulty);
  const isAdd = Math.random() < 0.6;
  const a = Math.round((Math.random() * 8 * mult + 1) * 10) / 10;
  const b = Math.round((Math.random() * 4 * mult + 0.5) * 10) / 10;
  let result: number;
  if (isAdd) {
    result = Math.round((a + b) * 10) / 10;
    return {
      question: `${a} ${isAdd ? '+' : '−'} ${b}`,
      answer: result,
      difficulty: 3,
      op: '+',
      category: 'decimals',
      displayType: 'text',
      isDecimal: true,
    };
  }
  const big = Math.max(a, b);
  const small = Math.min(a, b);
  result = Math.round((big - small) * 10) / 10;
  return {
    question: `${big} − ${small}`,
    answer: result,
    difficulty: 3,
      op: '-',
    category: 'decimals',
    displayType: 'text',
    isDecimal: true,
  };
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function difficultyTier(mathDifficulty: MathDifficulty): number {
  if (mathDifficulty === 'beginner') return 1;
  if (mathDifficulty === 'intermediate') return 2;
  return 3;
}

function resolveRegnehistorieOps(fv: FarvandDef, typeOps: Record<string, string[]>): string[] {
  const toa = fv.typeOpsAvailable as Record<string, string[]>;
  const avail = toa['regnehistorier'] ?? ['+', '-', '*', '/'];
  const sel = typeOps['regnehistorier']?.filter((o) => avail.includes(o)) ?? avail;
  return sel.length > 0 ? sel : avail;
}

function resolveEmojiCountingOps(fv: FarvandDef, typeOps: Record<string, string[]>): string[] {
  const toa = fv.typeOpsAvailable as Record<string, string[]>;
  const avail = toa['emoji-counting'] ?? ['+', '-'];
  const sel = typeOps['emoji-counting']?.filter((o) => avail.includes(o)) ?? avail;
  return sel.length > 0 ? sel : avail;
}

function generateBasicFromOp(
  op: string,
  mathDifficulty: MathDifficulty,
  difficultyNum: number
): MathProblem {
  const { a, b } = generateNumbersForOp(op, mathDifficulty);
  const answer = op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : a / b;
  const opSymbol = op === '*' ? '×' : op === '/' ? ':' : op;
  return {
    question: `${a} ${opSymbol} ${b}`,
    answer,
    difficulty: difficultyNum,
    op,
    category: 'basic',
    displayType: 'text',
  };
}

function generateForMathType(
  type: string,
  mathDifficulty: MathDifficulty,
  selectedFarvand: FarvandId,
  typeOps: Record<string, string[]>,
  fv: FarvandDef,
  difficultyNum: number
): MathProblem | null {
  if (type === 'plus') return generateBasicFromOp('+', mathDifficulty, difficultyNum);
  if (type === 'minus') return generateBasicFromOp('-', mathDifficulty, difficultyNum);
  if (type === 'gange') return generateBasicFromOp('*', mathDifficulty, difficultyNum);
  if (type === 'division') return generateBasicFromOp('/', mathDifficulty, difficultyNum);
  if (type === 'tenfriends') return generateTenFriendsProblem(mathDifficulty);
  if (type === '100friends') return generate100FriendsQuestion();
  if (type === 'skaeve100friends') return generateSkaeve100FriendsQuestion();
  if (type === 'multi-term') return generateMultiTermProblem(mathDifficulty);
  if (type === 'equations') return generateEquationProblem(mathDifficulty);
  if (type === 'decimals') return generateDecimalProblem(mathDifficulty);
  if (type === 'regnehistorier') {
    const ops = resolveRegnehistorieOps(fv, typeOps);
    return generateRegneHistorie(mathDifficulty, ops);
  }
  if (type === 'lette-historier') return generateLetRegneHistorie(mathDifficulty);
  if (type === 'emoji-antal') return generateEmojiAntalProblem(mathDifficulty);
  if (type === 'emoji-counting') {
    const fvKey: 'kysten' | 'aabenhav' = selectedFarvand === 'aabenhav' ? 'aabenhav' : 'kysten';
    const ops = resolveEmojiCountingOps(fv, typeOps);
    return generateEmojiCountingProblem(ops, fvKey, mathDifficulty);
  }
  if (type === 'emoji-most-least') return generateEmojiMostLeastProblem();
  if (type === 'emoji-size-compare') return generateEmojiSizeCompareProblem();
  return null;
}

export function generateMathProblem(
  activeMathTypes: string[],
  mathDifficulty: MathDifficulty,
  selectedFarvand: FarvandId,
  typeOps: Record<string, string[]>
): MathProblem {
  const fv = FARVANDE[selectedFarvand];
  const allowed = new Set<string>(fv.allowedMathTypes as string[]);
  const types = activeMathTypes.filter((t) => allowed.has(t));
  const pool: string[] = types.length > 0 ? [...types] : ['plus'];
  const difficultyNum = difficultyTier(mathDifficulty);

  for (let attempt = 0; attempt < 80; attempt++) {
    const mathType = pickRandom(pool);
    const p = generateForMathType(mathType, mathDifficulty, selectedFarvand, typeOps, fv, difficultyNum);
    if (p) return p;
  }
  return generateBasicFromOp('+', mathDifficulty, difficultyNum);
}
