import { SAVE_FORMAT_VERSION } from '../data/version.js';
import type { SaveData } from '../types/save.js';

export const SAVE_KEY = 'regnefisken_save';

export function migrateSave(data: unknown): SaveData {
  if (data === null || typeof data !== 'object') {
    return { version: SAVE_FORMAT_VERSION };
  }
  const o = data as Record<string, unknown>;
  const versionRaw = o.version ?? o.v;
  const version = typeof versionRaw === 'number' ? versionRaw : 1;
  void version;
  return {
    ...o,
    version: SAVE_FORMAT_VERSION,
  } as SaveData;
}

export function loadGame(): SaveData | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return migrateSave(parsed);
  } catch {
    return null;
  }
}

export function saveGame(state: SaveData): void {
  if (typeof localStorage === 'undefined') return;
  const payload = migrateSave(state);
  localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
}
