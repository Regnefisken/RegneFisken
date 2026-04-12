import { create } from 'zustand';
import {
  type BodyPattern,
  type FishModelConfig,
  DEFAULT_STANDARD_EYE_CONFIG,
} from '../types/fish.js';
import { CATCH_MASTER_DATA } from '../data/fish.js';
import { DEFAULT_BODY_SEGMENTS, normalizeBodySegments } from '../three/models/cuteFishUtils.js';
import {
  ALL_LOCKABLE_PARAM_KEYS,
  RANDOMIZE_RANGES,
  RANDOMIZE_SELECT_OPTIONS,
  RANDOMIZE_TEETH_TYPES,
  tailRequiresNormalSideFinMovement,
} from '../components/editor/editorConstants.js';

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

  /** Sæt af låste parameter-nøgler — beskyttes mod randomize */
  lockedParams: Set<string>;
  toggleLock: (paramKey: string) => void;
  lockAll: () => void;
  unlockAll: () => void;

  mutationDegree: number;
  setMutationDegree: (v: number) => void;
  randomizeFish: () => void;
}

/** Standard frem/tilbage for hale langs kroppen (`partAdjustments.tail.dx`) — forankrer halen i bagkroppen i editoren. */
export const EDITOR_DEFAULT_TAIL_DX = 0.26;

/** Standard rygfinne (pigget) — forankring på standard-fisk (`partAdjustments.dorsalFin`). */
export const EDITOR_DEFAULT_DORSAL_DX = -0.2;
export const EDITOR_DEFAULT_DORSAL_DY = -0.16;

/** Standard sidefinner-par (per-del justering) i editoren. */
export const EDITOR_DEFAULT_SIDE_FINS_PAIR = {
  dx: -0.16,
  dy: 0.09,
  dz: 0.11,
  sz: 0.9,
  rz: -Math.PI,
};

/**
 * Fælles baseline for standard fisk-mesh i editoren — samme motor som spillet
 * (`createFishBodyGeometry`: UV-søm mod hale; `createDorsalFinGeometry`: tykkelse centreret på ryg).
 * Bruges ved «Opret ny» og nulstil i create-mode.
 */
export const EDITOR_STANDARD_FISH_MESH_DEFAULTS: Pick<
  FishModelConfig,
  'bodyProfile' | 'dorsalFinType' | 'partAdjustments'
> = {
  bodyProfile: 'standard',
  dorsalFinType: 'spiked',
  partAdjustments: {
    tail: { dx: EDITOR_DEFAULT_TAIL_DX },
    dorsalFin: { dx: EDITOR_DEFAULT_DORSAL_DX, dy: EDITOR_DEFAULT_DORSAL_DY },
    sideFinsPair: { ...EDITOR_DEFAULT_SIDE_FINS_PAIR },
  },
};

/** Default model brugt i create-mode og som diff-baseline når der ikke findes original. */
export const EDITOR_DEFAULT_FISH_CONFIG: FishModelConfig = {
  color: 0x6699aa,
  bodyShape: [1.0, 1.0, 1.2],
  tail: 'sail',
  speed: 1.0,
  scale: 1.0,
  showPelvicFins: true,
  finColor: 0x5588aa,
  eyeConfig: { ...DEFAULT_STANDARD_EYE_CONFIG },
  ...EDITOR_STANDARD_FISH_MESH_DEFAULTS,
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
  lockedParams: new Set<string>(),
  mutationDegree: 0.7,

  setEditorPreviewSwimAnimation: (on) => set({ editorPreviewSwimAnimation: on }),

  toggleLock: (paramKey) =>
    set((s) => {
      const next = new Set(s.lockedParams);
      if (next.has(paramKey)) next.delete(paramKey);
      else next.add(paramKey);
      return { lockedParams: next };
    }),

  lockAll: () => set({ lockedParams: new Set(ALL_LOCKABLE_PARAM_KEYS) }),

  unlockAll: () => set({ lockedParams: new Set() }),

  setMutationDegree: (v) => set({ mutationDegree: v }),

  randomizeFish: () => {
    const { configOverride, lockedParams, mutationDegree } = get();
    if (!configOverride) return;

    const shouldMutate = (key: string) =>
      !lockedParams.has(key) && Math.random() < mutationDegree;

    const randRange = (key: string) => {
      const r = RANDOMIZE_RANGES[key];
      if (!r) return 0;
      return r.min + Math.random() * (r.max - r.min);
    };

    const randFrom = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]!;

    const randColor = () => Math.floor(Math.random() * 0xffffff);

    const randBool = (chance = 0.3) => Math.random() < chance;

    const cfg = structuredClone(configOverride);

    if (shouldMutate('bodyShape.0')) {
      cfg.bodyShape = [...cfg.bodyShape] as [number, number, number];
      cfg.bodyShape[0] = parseFloat(randRange('bodyShape.0').toFixed(2));
    }
    if (shouldMutate('bodyShape.1')) {
      cfg.bodyShape = [...cfg.bodyShape] as [number, number, number];
      cfg.bodyShape[1] = parseFloat(randRange('bodyShape.1').toFixed(2));
    }
    if (shouldMutate('bodyShape.2')) {
      cfg.bodyShape = [...cfg.bodyShape] as [number, number, number];
      cfg.bodyShape[2] = parseFloat(randRange('bodyShape.2').toFixed(2));
    }
    if (shouldMutate('scale')) {
      cfg.scale = parseFloat(randRange('scale').toFixed(2));
    }
    if (shouldMutate('speed')) {
      cfg.speed = parseFloat(randRange('speed').toFixed(1));
    }
    if (shouldMutate('tail')) {
      cfg.tail = randFrom(RANDOMIZE_SELECT_OPTIONS.tail);
    }
    if (shouldMutate('bodyProfile')) {
      const p = randFrom(RANDOMIZE_SELECT_OPTIONS.bodyProfile);
      cfg.bodyProfile = p === 'standard' ? undefined : p;
    }
    if (shouldMutate('bodySegments')) {
      const evens = [8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32] as const;
      const n = normalizeBodySegments(randFrom(evens));
      cfg.bodySegments = n === DEFAULT_BODY_SEGMENTS ? undefined : n;
      cfg.bodyLatheSegments = undefined;
    }

    if (shouldMutate('color')) {
      cfg.color = randBool(0.05) ? null : randColor();
    }
    if (shouldMutate('colorGradient')) {
      if (randBool(0.35)) {
        cfg.colorGradient = {
          back: randColor(),
          mid1: randColor(),
          mid2: randColor(),
          belly: randColor(),
        };
      } else {
        cfg.colorGradient = undefined;
      }
    }
    if (shouldMutate('useRainbow')) {
      cfg.useRainbow = randBool(0.08) ? true : undefined;
    }
    if (shouldMutate('chameleonMode')) {
      cfg.chameleonMode = randBool(0.08) ? true : undefined;
    }
    if (shouldMutate('bodyHemisphereTint')) {
      if (randBool(0.25)) {
        cfg.bodyHemisphereTint = {
          ventral: randColor(),
          dorsal: randColor(),
          softness: parseFloat((0.05 + Math.random() * 0.4).toFixed(2)),
        };
      } else {
        cfg.bodyHemisphereTint = undefined;
      }
    }
    if (shouldMutate('bodyOpacity')) {
      const op = parseFloat(randRange('bodyOpacity').toFixed(2));
      cfg.bodyOpacity = op >= 1 ? undefined : op;
    }
    if (shouldMutate('finOpacity')) {
      const op = parseFloat(randRange('finOpacity').toFixed(2));
      cfg.finOpacity = op >= 0.95 ? undefined : op;
    }
    if (shouldMutate('emissive')) {
      if (randBool(0.15)) {
        cfg.emissive = randColor();
        cfg.emissiveIntensity = parseFloat((0.1 + Math.random() * 0.8).toFixed(2));
      } else {
        cfg.emissive = undefined;
        cfg.emissiveIntensity = undefined;
      }
    }

    if (shouldMutate('dorsalFinType')) {
      const dt = randFrom(RANDOMIZE_SELECT_OPTIONS.dorsalFinType);
      cfg.dorsalFinType = dt;
    }
    if (shouldMutate('dorsalFinEmbed')) {
      const embed = parseFloat(randRange('dorsalFinEmbed').toFixed(2));
      cfg.dorsalFinEmbed = embed === 0 ? undefined : embed;
    }
    if (shouldMutate('sideFinScale')) {
      const s = parseFloat(randRange('sideFinScale').toFixed(2));
      cfg.sideFinScale = s === 1 ? undefined : s;
    }
    if (shouldMutate('sideFinPlacement')) {
      cfg.sideFinPlacement = randBool(0.2) ? 'sidevejs' : undefined;
    }
    if (shouldMutate('showPelvicFins')) {
      cfg.showPelvicFins = randBool(0.5) ? true : undefined;
    }
    if (shouldMutate('pelvicFinScale')) {
      if (cfg.showPelvicFins) {
        const s = parseFloat(randRange('pelvicFinScale').toFixed(2));
        cfg.pelvicFinScale = s === 1 ? undefined : s;
      }
    }
    if (shouldMutate('finColor')) {
      if (randBool(0.3)) {
        cfg.finColor = randColor();
      } else {
        cfg.finColor = undefined;
      }
    }

    if (shouldMutate('tailScale')) {
      const s = parseFloat(randRange('tailScale').toFixed(2));
      cfg.tailScale = s === 1 ? undefined : s;
    }
    if (shouldMutate('tailSwingAmplitude')) {
      const a = parseFloat(randRange('tailSwingAmplitude').toFixed(2));
      cfg.tailSwingAmplitude = Math.abs(a - 0.33) < 0.02 ? undefined : a;
    }
    if (shouldMutate('tailFinMovement')) {
      if (!tailRequiresNormalSideFinMovement(cfg.tail)) {
        cfg.tailFinMovement = randBool(0.15) ? 'paddle' : undefined;
      } else {
        cfg.tailFinMovement = undefined;
      }
    }

    if (shouldMutate('eyeConfig')) {
      if (randBool(0.5)) {
        cfg.eyeConfig = {
          size: parseFloat((0.15 + Math.random() * 0.3).toFixed(2)),
          scleraColor: randBool(0.7) ? 0xffffff : randColor(),
          pupilColor: randBool(0.7) ? 0x111111 : randColor(),
          pupilScale: parseFloat((0.4 + Math.random() * 1.6).toFixed(2)),
          pupilDepth: parseFloat((0.6 + Math.random() * 0.35).toFixed(2)),
          offsetX: parseFloat((-0.15 + Math.random() * 0.3).toFixed(2)),
          offsetY: parseFloat((-0.2 + Math.random() * 0.4).toFixed(2)),
        };
      } else {
        cfg.eyeConfig = undefined;
      }
    }

    if (shouldMutate('teeth')) {
      if (randBool(0.3)) {
        cfg.teeth = {
          type: randFrom(RANDOMIZE_TEETH_TYPES),
          count: Math.floor(4 + Math.random() * 20),
          size: parseFloat((0.02 + Math.random() * 0.06).toFixed(3)),
          color: randBool(0.8) ? 0xffffff : randColor(),
          zOffset: 0,
        };
      } else {
        cfg.teeth = undefined;
      }
    }
    if (shouldMutate('mouthType')) {
      const mt = randFrom(RANDOMIZE_SELECT_OPTIONS.mouthType);
      cfg.mouthType = mt === 'none' ? undefined : mt;
      if (cfg.mouthType) {
        cfg.mouthOpenness = parseFloat((0.2 + Math.random() * 0.7).toFixed(2));
        cfg.mouthColor = randBool(0.7) ? 0x2a0808 : randColor();
      } else {
        cfg.mouthOpenness = undefined;
        cfg.mouthColor = undefined;
      }
    }

    if (shouldMutate('bodyPattern')) {
      const pat = randFrom(RANDOMIZE_SELECT_OPTIONS.bodyPattern);
      cfg.bodyPattern = pat === 'solid' ? undefined : (pat as BodyPattern);
      if (cfg.bodyPattern) {
        cfg.patternColor = randColor();
        cfg.patternDensity = parseFloat(randRange('patternDensity').toFixed(2));
      } else {
        cfg.patternColor = undefined;
        cfg.patternDensity = undefined;
      }
    }

    if (shouldMutate('bioluminescent')) {
      if (randBool(0.12)) {
        cfg.bioluminescent = {
          enabled: true,
          color: randColor(),
          intensity: parseFloat((0.5 + Math.random() * 2).toFixed(2)),
        };
      } else {
        cfg.bioluminescent = undefined;
      }
    }
    if (shouldMutate('electricSparks')) {
      cfg.electricSparks = randBool(0.08) ? true : undefined;
    }
    if (shouldMutate('electricBolts')) {
      cfg.electricBolts = randBool(0.08) ? true : undefined;
    }
    if (shouldMutate('pufferInflation')) {
      if (randBool(0.08)) {
        cfg.pufferInflation = {
          puff: parseFloat((0.1 + Math.random() * 0.7).toFixed(2)),
          spikeDensity: parseFloat((0.4 + Math.random() * 0.8).toFixed(2)),
        };
      } else {
        cfg.pufferInflation = undefined;
      }
    }

    if (shouldMutate('bodyClearcoat')) {
      const c = parseFloat(randRange('bodyClearcoat').toFixed(2));
      cfg.bodyClearcoat = Math.abs(c - 0.5) < 0.03 ? undefined : c;
    }
    if (shouldMutate('bodyClearcoatRoughness')) {
      const r = parseFloat(randRange('bodyClearcoatRoughness').toFixed(2));
      cfg.bodyClearcoatRoughness = Math.abs(r - 0.08) < 0.015 ? undefined : r;
    }

    set({ configOverride: cfg });
  },

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
      lockedParams: new Set(),
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
      } else if (partName === 'sideFinsPair') {
        const sidevejs = s.configOverride.sideFinPlacement === 'sidevejs';
        current.sideFinsPair = sidevejs
          ? { ...EDITOR_DEFAULT_SIDE_FINS_PAIR, rz: 0 }
          : { ...EDITOR_DEFAULT_SIDE_FINS_PAIR };
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
      lockedParams: new Set(),
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
      lockedParams: new Set(),
    });
  },
}));
