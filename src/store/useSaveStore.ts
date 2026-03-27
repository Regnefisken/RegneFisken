import { create } from 'zustand';
import type { SaveData } from '../types/save.js';
import { saveGame } from '../logic/save-load.js';

interface SaveState {
  hydrated: boolean;
  lastLoaded: SaveData | null;
  setHydrated: (v: boolean) => void;
  hydrateFromStorage: () => SaveData | null;
  persist: (partial: SaveData) => void;
}

export const useSaveStore = create<SaveState>((set, get) => ({
  hydrated: false,
  lastLoaded: null,
  setHydrated: (hydrated) => set({ hydrated }),
  hydrateFromStorage: () => get().lastLoaded,
  persist: (partial) => {
    const merged = { ...(get().lastLoaded ?? {}), ...partial } as SaveData;
    saveGame(merged);
    set({ lastLoaded: merged });
  },
}));
