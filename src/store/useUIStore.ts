import { create } from 'zustand';
import type { GraphicsQuality } from '../types/game.js';

export type ColorBlindMode = 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';

/** Faner i mobil Fisketaske-overlay */
export type BagTab = 'menu' | 'spand' | 'kiste' | 'maal';

interface UIState {
  showKisteMenu: boolean;
  kisteTab: string;
  showNavPicker: boolean;
  activeTravelTab: string;
  pendingGoal: string | null;
  pendingLevelUps: number[];
  showLevelUp: number | null;
  isMuted: boolean;
  hasStartedAudio: boolean;
  hasStarted: boolean;
  isFadingOut: boolean;
  toastMessage: string | null;
  xpToast: string | null;
  dayNightToast: string | null;
  isFullscreen: boolean;
  showResetConfirm: boolean;
  needsReset: boolean;
  showVersionModal: boolean;
  showSettingsMenu: boolean;
  uiMode: 'desktop' | 'mobile';
  isBagOpen: boolean;
  bagTab: BagTab;
  mobileGoalCategory: string;
  /** Når true: skjul primær HUD (vejr, XP, spand, menu-knapper) for ren 3D-visning. */
  uiHidden: boolean;
  showScreenSettings: boolean;
  bucketOpen: boolean;
  showEggInspectModal: boolean;
  showWildTurtleModal: boolean;
  worldParticleBurst: null | 'confetti' | 'levelup';
  showCollectibleModal: 'fossil' | 'conch' | 'pearl' | null;
  /** Jungleø: velkomstdialog fra pirat-NPC. */
  showJunglePirateDialog: boolean;
  showCreditsOverlay: boolean;
  showAboutModal: boolean;
  showContactModal: boolean;
  fontSize: number;
  uiScale: number;
  graphicsQuality: GraphicsQuality;
  pmremExposure: number;
  skyExposure: number;
  reducedMotion: boolean;
  highContrast: boolean;
  colorBlindMode: ColorBlindMode;
  /** Efter første GPU-auto-detect ved spilstart; gemmes i save. */
  graphicsAutoDetected: boolean;
  setShowKisteMenu: (v: boolean) => void;
  setKisteTab: (v: string) => void;
  setShowNavPicker: (v: boolean) => void;
  setActiveTravelTab: (v: string) => void;
  setPendingGoal: (v: string | null) => void;
  setPendingLevelUps: (v: number[] | ((p: number[]) => number[])) => void;
  setShowLevelUp: (v: number | null) => void;
  setIsMuted: (v: boolean) => void;
  setHasStartedAudio: (v: boolean) => void;
  setHasStarted: (v: boolean) => void;
  setIsFadingOut: (v: boolean) => void;
  setToastMessage: (v: string | null) => void;
  setXpToast: (v: string | null) => void;
  setDayNightToast: (v: string | null) => void;
  setIsFullscreen: (v: boolean) => void;
  setShowResetConfirm: (v: boolean) => void;
  setNeedsReset: (v: boolean) => void;
  setShowVersionModal: (v: boolean) => void;
  setShowSettingsMenu: (v: boolean) => void;
  setUiMode: (v: 'desktop' | 'mobile') => void;
  setIsBagOpen: (v: boolean) => void;
  setBagTab: (v: BagTab) => void;
  setMobileGoalCategory: (v: string) => void;
  setUiHidden: (v: boolean) => void;
  setShowScreenSettings: (v: boolean) => void;
  setBucketOpen: (v: boolean) => void;
  setShowEggInspectModal: (v: boolean) => void;
  setShowWildTurtleModal: (v: boolean) => void;
  setWorldParticleBurst: (v: null | 'confetti' | 'levelup') => void;
  setShowCollectibleModal: (v: 'fossil' | 'conch' | 'pearl' | null) => void;
  setShowJunglePirateDialog: (v: boolean) => void;
  setShowCreditsOverlay: (v: boolean) => void;
  setShowAboutModal: (v: boolean) => void;
  setShowContactModal: (v: boolean) => void;
  setFontSize: (v: number) => void;
  setUiScale: (v: number) => void;
  setGraphicsQuality: (v: GraphicsQuality) => void;
  setPmremExposure: (v: number) => void;
  setSkyExposure: (v: number) => void;
  setReducedMotion: (v: boolean) => void;
  setHighContrast: (v: boolean) => void;
  setColorBlindMode: (v: ColorBlindMode) => void;
  setGraphicsAutoDetected: (v: boolean) => void;
}

function resolve<T>(next: T | ((prev: T) => T), prev: T): T {
  return typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
}

export const useUIStore = create<UIState>((set) => ({
  showKisteMenu: false,
  kisteTab: 'udstyr',
  showNavPicker: false,
  activeTravelTab: 'fishing',
  pendingGoal: null,
  pendingLevelUps: [],
  showLevelUp: null,
  isMuted: false,
  hasStartedAudio: false,
  hasStarted: false,
  isFadingOut: false,
  toastMessage: null,
  xpToast: null,
  dayNightToast: null,
  isFullscreen: false,
  showResetConfirm: false,
  needsReset: false,
  showVersionModal: false,
  showSettingsMenu: false,
  uiMode: 'desktop',
  isBagOpen: false,
  bagTab: 'menu',
  mobileGoalCategory: 'alle',
  uiHidden: false,
  showScreenSettings: false,
  bucketOpen: true,
  showEggInspectModal: false,
  showWildTurtleModal: false,
  worldParticleBurst: null,
  showCollectibleModal: null,
  showJunglePirateDialog: false,
  showCreditsOverlay: false,
  showAboutModal: false,
  showContactModal: false,
  fontSize: 100,
  uiScale: 100,
  graphicsQuality: 'medium',
  pmremExposure: 0.78,
  skyExposure: 0.40,
  reducedMotion: false,
  highContrast: false,
  colorBlindMode: 'none',
  graphicsAutoDetected: false,
  setShowKisteMenu: (showKisteMenu) => set({ showKisteMenu }),
  setKisteTab: (kisteTab) => set({ kisteTab }),
  setShowNavPicker: (showNavPicker) => set({ showNavPicker }),
  setActiveTravelTab: (activeTravelTab) => set({ activeTravelTab }),
  setPendingGoal: (pendingGoal) => set({ pendingGoal }),
  setPendingLevelUps: (v) => set((s) => ({ pendingLevelUps: resolve(v, s.pendingLevelUps) })),
  setShowLevelUp: (showLevelUp) => set({ showLevelUp }),
  setIsMuted: (isMuted) => set({ isMuted }),
  setHasStartedAudio: (hasStartedAudio) => set({ hasStartedAudio }),
  setHasStarted: (hasStarted) => set({ hasStarted }),
  setIsFadingOut: (isFadingOut) => set({ isFadingOut }),
  setToastMessage: (toastMessage) => set({ toastMessage }),
  setXpToast: (xpToast) => set({ xpToast }),
  setDayNightToast: (dayNightToast) => set({ dayNightToast }),
  setIsFullscreen: (isFullscreen) => set({ isFullscreen }),
  setShowResetConfirm: (showResetConfirm) => set({ showResetConfirm }),
  setNeedsReset: (needsReset) => set({ needsReset }),
  setShowVersionModal: (showVersionModal) => set({ showVersionModal }),
  setShowSettingsMenu: (showSettingsMenu) => set({ showSettingsMenu }),
  setUiMode: (uiMode) => set({ uiMode }),
  setIsBagOpen: (isBagOpen) => set({ isBagOpen }),
  setBagTab: (bagTab) => set({ bagTab }),
  setMobileGoalCategory: (mobileGoalCategory) => set({ mobileGoalCategory }),
  setUiHidden: (uiHidden) => set({ uiHidden }),
  setShowScreenSettings: (showScreenSettings) => set({ showScreenSettings }),
  setBucketOpen: (bucketOpen) => set({ bucketOpen }),
  setShowEggInspectModal: (showEggInspectModal) => set({ showEggInspectModal }),
  setShowWildTurtleModal: (showWildTurtleModal) => set({ showWildTurtleModal }),
  setWorldParticleBurst: (worldParticleBurst) => set({ worldParticleBurst }),
  setShowCollectibleModal: (showCollectibleModal) => set({ showCollectibleModal }),
  setShowJunglePirateDialog: (showJunglePirateDialog) => set({ showJunglePirateDialog }),
  setShowCreditsOverlay: (showCreditsOverlay) => set({ showCreditsOverlay }),
  setShowAboutModal: (showAboutModal) => set({ showAboutModal }),
  setShowContactModal: (showContactModal) => set({ showContactModal }),
  setFontSize: (fontSize) => set({ fontSize }),
  setUiScale: (uiScale) => set({ uiScale }),
  setGraphicsQuality: (graphicsQuality) => set({ graphicsQuality }),
  setPmremExposure: (pmremExposure) => set({ pmremExposure }),
  setSkyExposure: (skyExposure) => set({ skyExposure }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setHighContrast: (highContrast) => set({ highContrast }),
  setColorBlindMode: (colorBlindMode) => set({ colorBlindMode }),
  setGraphicsAutoDetected: (graphicsAutoDetected) => set({ graphicsAutoDetected }),
}));
