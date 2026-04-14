export type FarvandId = 'kysten' | 'aabenhav' | 'dybet';

export interface EmojiData {
  emoji: string;
  leftCount: number;
  rightCount: number;
  operator: '+' | '-' | '*' | '/';
}

export interface EmojiChoiceData {
  mode: 'most' | 'least';
  leftEmoji: string;
  rightEmoji: string;
  leftCount: number;
  rightCount: number;
  correctSide: 'left' | 'right';
}

export type EmojiSizeLevel = 'small' | 'medium' | 'large';

export interface EmojiSizeData {
  mode: 'biggest' | 'smallest';
  emoji: string;
  leftSize: EmojiSizeLevel;
  rightSize: EmojiSizeLevel;
  leftCount: number;
  rightCount: number;
  correctSide: 'left' | 'right';
}

export interface EmojiAntalData {
  emoji: string;
  count: number;
}

/** D: Find halvdelen + E: Find det dobbelte + H: Gør dem lige mange (delt layout) */
export interface EmojiHalvdelData {
  emoji: string;
  count: number;
  mode: 'half' | 'double';
}

/** F: Lige eller ulige */
export interface EmojiEvenOddData {
  emoji: string;
  count: number;
  isEven: boolean;
}

/** G: Fortsæt mønsteret */
export interface EmojiPatternData {
  sequence: string[];
  correctNext: string;
  choices: string[];
  patternType: 'AB' | 'ABB' | 'AAB' | 'ABC' | 'ABAC';
}

/** C: Sorter i rækkefølge */
export interface EmojiSortData {
  boxes: { emoji: string; count: number }[];
  mode: 'asc' | 'desc';
  correctOrder: number[];
}

/** H: Gør dem lige mange */
export interface EmojiEqualizeData {
  emoji: string;
  leftCount: number;
  rightCount: number;
  difference: number;
}

/** I: Brøkdele visuelt */
export interface EmojiFractionData {
  emoji: string;
  total: 10;
  highlighted: number;
  correctFraction: string;
  choices: string[];
}

/** J: Procentdel */
export interface EmojiPercentData {
  emoji: string;
  total: 10;
  highlighted: number;
  correctPercent: number;
}

export type MathTypeGroup = 'regnearter' | 'talforståelse' | 'speciale' | 'historier' | 'emoji';

export interface MathTypeDefinition {
  id: string;
  label: string;
  icon: string;
  desc: string;
  group: MathTypeGroup;
  /** Vis operator-pills under togglen når typen er slået til */
  supportsOps: boolean;
}

export interface FarvandDef {
  name: string;
  desc: string;
  allowedMathTypes: string[];
  /** Hvilke operatorer pills-UI må tilbyde per opgavetype i dette farvand */
  typeOpsAvailable: Record<string, string[]>;
  canUseDecimal: boolean;
  canUseNegative: boolean;
}

export type FarvandeMap = Record<FarvandId, FarvandDef>;

export type RegnehistorieOp = '+' | '-' | '*' | '/';

/** Addition/subtraktion/multiplikation-skabeloner */
export interface RegnehistorieTemplateBase {
  type: RegnehistorieOp;
  template: string;
  unit: string;
}

export interface RegnehistorieAddSubMul extends RegnehistorieTemplateBase {
  type: '+' | '-' | '*';
  minA: number;
  maxA: number;
  minB: number;
  maxB: number;
  cond?: (a: number, b: number) => boolean;
}

export interface RegnehistorieDiv extends RegnehistorieTemplateBase {
  type: '/';
  totalMin: number;
  totalMax: number;
  divOptions: number[];
}

export type RegnehistorieTemplate = RegnehistorieAddSubMul | RegnehistorieDiv;

export interface LetteRegnehistorieTemplate {
  type: '+';
  template: string;
  unit: string;
  minA: number;
  maxA: number;
  minB: number;
  maxB: number;
}

export type MathDifficulty = 'beginner' | 'intermediate' | 'expert';

/** Legacy 1–3 sværhed til tilfældig op-vælger i basic-mode */
export type BasicDifficultyTier = 1 | 2 | 3;

/** Genereret regnestykke til MathChallenge / zen */
export interface MathProblem {
  question: string;
  answer: number;
  difficulty: number;
  op: string;
  category: string;
  displayType: string;
  unit?: string;
  xpBonus?: number;
  isDecimal?: boolean;
  emojiData?: EmojiData;
  emojiChoiceData?: EmojiChoiceData;
  emojiSizeData?: EmojiSizeData;
  emojiAntalData?: EmojiAntalData;
  emojiHalvdelData?: EmojiHalvdelData;
  emojiEvenOddData?: EmojiEvenOddData;
  emojiPatternData?: EmojiPatternData;
  emojiSortData?: EmojiSortData;
  emojiEqualizeData?: EmojiEqualizeData;
  emojiFractionData?: EmojiFractionData;
  emojiPercentData?: EmojiPercentData;
}
