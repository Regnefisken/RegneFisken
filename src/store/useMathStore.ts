import { create } from 'zustand';
import type { FarvandId, MathDifficulty, MathProblem } from '../types/math.js';

interface MathState {
  activeMathTypes: string[];
  typeOps: Record<string, string[]>;
  mathDifficulty: MathDifficulty;
  showMathSettings: boolean;
  mathSettingsTab: string;
  zenMode: boolean;
  zenSkipDelay: number;
  showNumberPad: boolean;
  showSpecialKeys: boolean;
  isMobile: boolean;
  selectedFarvand: FarvandId | string;
  showSkipButton: boolean;
  revealingAnswer: boolean;
  /** Dansk standard: komma. Kan skiftes til punktum under Avanceret. */
  decimalSeparator: ',' | '.';
  problem: MathProblem | null;
  userAnswer: string;
  timeLeft: number;
  initialTime: number;
  setActiveMathTypes: (v: string[] | ((p: string[]) => string[])) => void;
  setTypeOps: (v: Record<string, string[]> | ((p: Record<string, string[]>) => Record<string, string[]>)) => void;
  setMathDifficulty: (v: MathDifficulty) => void;
  setShowMathSettings: (v: boolean) => void;
  setMathSettingsTab: (v: string) => void;
  setZenMode: (v: boolean) => void;
  setZenSkipDelay: (v: number) => void;
  setShowNumberPad: (v: boolean) => void;
  setShowSpecialKeys: (v: boolean) => void;
  setIsMobile: (v: boolean) => void;
  setSelectedFarvand: (v: FarvandId | string) => void;
  setShowSkipButton: (v: boolean) => void;
  setRevealingAnswer: (v: boolean) => void;
  setDecimalSeparator: (v: ',' | '.') => void;
  setProblem: (v: MathProblem | null) => void;
  setUserAnswer: (v: string | ((p: string) => string)) => void;
  setTimeLeft: (v: number) => void;
  setInitialTime: (v: number) => void;
}

function resolve<T>(next: T | ((prev: T) => T), prev: T): T {
  return typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
}

/** Synkroniseres ved spilstart med `uiMode` / small-screen (StartScreen), ikke hardkodet 768px. */
export const useMathStore = create<MathState>((set) => ({
  activeMathTypes: ['plus'],
  typeOps: {},
  mathDifficulty: 'beginner',
  showMathSettings: false,
  mathSettingsTab: 'farvand',
  zenMode: false,
  zenSkipDelay: 10,
  showNumberPad: false,
  showSpecialKeys: false,
  isMobile: false,
  selectedFarvand: 'kysten',
  showSkipButton: false,
  revealingAnswer: false,
  decimalSeparator: ',',
  problem: null,
  userAnswer: '',
  timeLeft: 0,
  initialTime: 1,
  setActiveMathTypes: (v) => set((s) => ({ activeMathTypes: resolve(v, s.activeMathTypes) })),
  setTypeOps: (v) => set((s) => ({ typeOps: resolve(v, s.typeOps) })),
  setMathDifficulty: (mathDifficulty) => set({ mathDifficulty }),
  setShowMathSettings: (showMathSettings) => set({ showMathSettings }),
  setMathSettingsTab: (mathSettingsTab) => set({ mathSettingsTab }),
  setZenMode: (zenMode) => set({ zenMode }),
  setZenSkipDelay: (zenSkipDelay) => set({ zenSkipDelay }),
  setShowNumberPad: (showNumberPad) => set({ showNumberPad }),
  setShowSpecialKeys: (showSpecialKeys) => set({ showSpecialKeys }),
  setIsMobile: (isMobile) => set({ isMobile }),
  setSelectedFarvand: (selectedFarvand) => set({ selectedFarvand }),
  setShowSkipButton: (showSkipButton) => set({ showSkipButton }),
  setRevealingAnswer: (revealingAnswer) => set({ revealingAnswer }),
  setDecimalSeparator: (decimalSeparator) => set({ decimalSeparator }),
  setProblem: (problem) => set({ problem }),
  setUserAnswer: (v) => set((s) => ({ userAnswer: resolve(v, s.userAnswer) })),
  setTimeLeft: (timeLeft) => set({ timeLeft }),
  setInitialTime: (initialTime) => set({ initialTime }),
}));
