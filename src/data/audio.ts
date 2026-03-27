/**
 * Lyd-id'er — matcher legacy `playSoundEffect` (Web Audio, ingen base64/URL i legacy).
 * Bruges til type-sikre `play()`-kald i UI og spil-logik.
 */
export const SOUND_IDS = [
  'ui',
  'error',
  'junk',
  'cast',
  'splash',
  'bite',
  'coin',
  'win',
  'legendary',
  'lose',
  'tick',
  'boss_hit',
  'seagull',
  'xp',
  'levelup',
  'unlock',
  'purchase',
  'thunder',
  'boss_ambience',
] as const;

export type SoundId = (typeof SOUND_IDS)[number];
