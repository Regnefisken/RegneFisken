export type FarvandId = 'kysten' | 'aabenhav' | 'dybet';

export interface FarvandDef {
  name: string;
  desc: string;
  allowedOps: string[];
  allowedCategories: string[];
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

export type OpMultipliersMap = Record<string, number>;

export type MathDifficulty = 'beginner' | 'intermediate' | 'expert';

/** Legacy 1–3 sværhed til tilfældig op-vælger i basic-mode */
export type BasicDifficultyTier = 1 | 2 | 3;

/** Genereret regnestykke til MathChallenge / zen */
export interface MathProblem {
  question: string;
  answer: number;
  difficulty: number;
  op: string;
  multiplier: number;
  category: string;
  displayType: string;
  unit?: string;
  xpBonus?: number;
  rarityBoost?: number;
  isDecimal?: boolean;
}
