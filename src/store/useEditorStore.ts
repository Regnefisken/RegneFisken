import { create } from 'zustand';
import type { FishModelConfig } from '../types/fish.js';
import { CATCH_MASTER_DATA } from '../data/fish.js';

export type EditorMode = 'edit' | 'create';

interface NewFishMeta {
  id: string;
  name: string;
  rarity: string;
  type: string;
  primaryAreas: string[];
  itemType: string;
}

interface EditorState {
  isOpen: boolean;
  mode: EditorMode;

  selectedFishId: string | null;
  originalConfig: FishModelConfig | null;

  configOverride: FishModelConfig | null;

  newFishMeta: NewFishMeta;

  selectedPart: string | null;

  /** Når sand: preview-fisk svømmer som i spillet. Standard: falsk (stille model). */
  editorPreviewSwimAnimation: boolean;
  setEditorPreviewSwimAnimation: (on: boolean) => void;

  toggle: () => void;
  close: () => void;
  setMode: (mode: EditorMode) => void;
  selectFish: (id: string) => void;
  updateConfig: (partial: Partial<FishModelConfig>) => void;
  updatePartAdjustment: (
    partName: string,
    adj: {
      dx?: number;
      dy?: number;
      dz?: number;
      sx?: number;
      sy?: number;
      sz?: number;
      rx?: number;
      ry?: number;
      rz?: number;
    },
  ) => void;
  resetPartAdjustment: (partName: string) => void;
  selectPart: (name: string | null) => void;
  resetConfig: () => void;
  setNewFishMeta: (partial: Partial<NewFishMeta>) => void;
  startNewFish: () => void;
  cloneFromExisting: (id: string) => void;
}

/** Standard frem/tilbage for hale langs kroppen (`partAdjustments.tail.dx`) — forankrer halen i bagkroppen i editoren. */
export const EDITOR_DEFAULT_TAIL_DX = 0.26;

/** Standard rygfinne (pigget) — forankring på standard-fisk (`partAdjustments.dorsalFin`). */
export const EDITOR_DEFAULT_DORSAL_DX = -0.2;
export const EDITOR_DEFAULT_DORSAL_DY = -0.16;

/** Default model brugt i create-mode og som diff-baseline når der ikke findes original. */
export const EDITOR_DEFAULT_FISH_CONFIG: FishModelConfig = {
  color: 0x6699aa,
  bodyShape: [1.0, 1.0, 1.2],
  tail: 'sail',
  speed: 1.0,
  scale: 1.0,
  showPelvicFins: true,
  finColor: 0x5588aa,
  bodyProfile: 'standard',
  dorsalFinType: 'spiked',
  eyeConfig: {
    size: 0.14,
    pupilScale: 1.0,
    pupilShape: 'sphere',
    pupilDepth: 0.85,
    scleraColor: 0xffffff,
    pupilColor: 0x111111,
  },
  partAdjustments: {
    tail: { dx: EDITOR_DEFAULT_TAIL_DX },
    dorsalFin: { dx: EDITOR_DEFAULT_DORSAL_DX, dy: EDITOR_DEFAULT_DORSAL_DY },
  },
};

const DEFAULT_META: NewFishMeta = {
  id: 'fisk_ny_',
  name: '',
  rarity: 'Almindelig',
  type: 'fish',
  primaryAreas: ['pier'],
  itemType: 'fish',
};

export const useEditorStore = create<EditorState>((set, get) => ({
  isOpen: false,
  mode: 'edit',
  selectedFishId: null,
  originalConfig: null,
  configOverride: null,
  newFishMeta: { ...DEFAULT_META },
  selectedPart: null,
  editorPreviewSwimAnimation: false,

  setEditorPreviewSwimAnimation: (on) => set({ editorPreviewSwimAnimation: on }),

  toggle: () =>
    set((s) => {
      if (s.isOpen) return { isOpen: false, selectedPart: null };
      return { isOpen: true };
    }),
  close: () => set({ isOpen: false, selectedPart: null }),

  setMode: (mode) =>
    set({
      mode,
      selectedFishId: null,
      originalConfig: null,
      configOverride: mode === 'create' ? structuredClone(EDITOR_DEFAULT_FISH_CONFIG) : null,
      newFishMeta: { ...DEFAULT_META },
      selectedPart: null,
    }),

  selectFish: (id) => {
    const entry = CATCH_MASTER_DATA.find((c) => c.id === id);
    if (!entry?.model) return;
    set({
      selectedFishId: id,
      originalConfig: structuredClone(entry.model),
      configOverride: structuredClone(entry.model),
      selectedPart: null,
    });
  },

  updateConfig: (partial) =>
    set((s) => {
      if (!s.configOverride) return s;
      return { configOverride: { ...s.configOverride, ...partial } };
    }),

  updatePartAdjustment: (partName, adj) =>
    set((s) => {
      if (!s.configOverride) return s;
      const current = s.configOverride.partAdjustments ?? {};
      return {
        configOverride: {
          ...s.configOverride,
          partAdjustments: {
            ...current,
            [partName]: { ...(current[partName] ?? {}), ...adj },
          },
        },
      };
    }),

  resetPartAdjustment: (partName) =>
    set((s) => {
      if (!s.configOverride) return s;
      const current = { ...(s.configOverride.partAdjustments ?? {}) };
      if (partName === 'tail') {
        current.tail = { dx: EDITOR_DEFAULT_TAIL_DX };
      } else if (partName === 'dorsalFin') {
        current.dorsalFin = { dx: EDITOR_DEFAULT_DORSAL_DX, dy: EDITOR_DEFAULT_DORSAL_DY };
      } else {
        delete current[partName];
      }
      const keys = Object.keys(current);
      return {
        configOverride: {
          ...s.configOverride,
          partAdjustments: keys.length > 0 ? current : undefined,
        },
      };
    }),

  selectPart: (name) => set({ selectedPart: name }),

  resetConfig: () => {
    const { mode, originalConfig } = get();
    if (mode === 'edit' && originalConfig) {
      set({ configOverride: structuredClone(originalConfig), selectedPart: null });
    } else {
      set({ configOverride: structuredClone(EDITOR_DEFAULT_FISH_CONFIG), selectedPart: null });
    }
  },

  setNewFishMeta: (partial) =>
    set((s) => ({ newFishMeta: { ...s.newFishMeta, ...partial } })),

  startNewFish: () =>
    set({
      mode: 'create',
      selectedFishId: null,
      originalConfig: null,
      configOverride: structuredClone(EDITOR_DEFAULT_FISH_CONFIG),
      newFishMeta: { ...DEFAULT_META },
      selectedPart: null,
    }),

  cloneFromExisting: (id) => {
    const entry = CATCH_MASTER_DATA.find((c) => c.id === id);
    if (!entry?.model) return;
    set({
      mode: 'create',
      selectedFishId: null,
      originalConfig: null,
      configOverride: structuredClone(entry.model),
      newFishMeta: {
        id: `${entry.id}_klon`,
        name: `${entry.name} (klon)`,
        rarity: entry.rarity,
        type: entry.type,
        primaryAreas: [...entry.primaryAreas],
        itemType: entry.itemType,
      },
      selectedPart: null,
    });
  },
}));
