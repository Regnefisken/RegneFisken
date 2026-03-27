import { create } from 'zustand';
import type { FarvandId, MathDifficulty, MathProblem } from '../types/math.js';

interface MathState {
  activeOps: string[];
  mathDifficulty: MathDifficulty;
  mathCategory: string;
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
  problem: MathProblem | null;
  userAnswer: string;
  timeLeft: number;
  initialTime: number;
  setActiveOps: (v: string[] | ((p: string[]) => string[])) => void;
  setMathDifficulty: (v: MathDifficulty) => void;
  setMathCategory: (v: string) => void;
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
  setProblem: (v: MathProblem | null) => void;
  setUserAnswer: (v: string | ((p: string) => string)) => void;
  setTimeLeft: (v: number) => void;
  setInitialTime: (v: number) => void;
}

function resolve<T>(next: T | ((prev: T) => T), prev: T): T {
  return typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
}

const initialShowNumpad =
  typeof window !== 'undefined' && typeof window.innerWidth === 'number'
    ? window.innerWidth < 768
    : false;

export const useMathStore = create<MathState>((set) => ({
  activeOps: ['+'],
  mathDifficulty: 'beginner',
  mathCategory: 'basic',
  showMathSettings: false,
  mathSettingsTab: 'farvand',
  zenMode: false,
  zenSkipDelay: 10,
  showNumberPad: initialShowNumpad,
  showSpecialKeys: false,
  isMobile: false,
  selectedFarvand: 'kysten',
  showSkipButton: false,
  revealingAnswer: false,
  problem: null,
  userAnswer: '',
  timeLeft: 0,
  initialTime: 1,
  setActiveOps: (v) => set((s) => ({ activeOps: resolve(v, s.activeOps) })),
  setMathDifficulty: (mathDifficulty) => set({ mathDifficulty }),
  setMathCategory: (mathCategory) => set({ mathCategory }),
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
  setProblem: (problem) => set({ problem }),
  setUserAnswer: (v) => set((s) => ({ userAnswer: resolve(v, s.userAnswer) })),
  setTimeLeft: (timeLeft) => set({ timeLeft }),
  setInitialTime: (initialTime) => set({ initialTime }),
}));
