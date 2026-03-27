export interface GoalReward {
  xp: number;
  coins: number;
}

/**
 * Løs save-payload — udvider efterhånden som persist partializes flere felter (Fase 3+).
 * `migrateSave` sørger for at `version` matcher SAVE_FORMAT_VERSION.
 */
export interface SaveData {
  version?: number;
  v?: number;
  [key: string]: unknown;
}
