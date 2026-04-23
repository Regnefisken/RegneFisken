import { create } from 'zustand';

const SESSION_KEY = 'regnefisken_teacher_dash_unlocked';

/**
 * Lærerdashboard: client-side "hemmelighed" — ikke sikkerhed, kun skjult UI.
 * Double-boost persisteres ikke i save; unlock kan holdes for browser-sessionen.
 */
interface TeacherState {
  /** Sættes ved korrekt kode; læses også fra sessionStorage ved opstart. */
  sessionUnlocked: boolean;
  doubleCatchMoneyXp: boolean;
  setSessionUnlocked: (v: boolean) => void;
  setDoubleCatchMoneyXp: (v: boolean) => void;
  /** Ryd lås (fx ved logout-knap senere). */
  clearSessionUnlock: () => void;
}

function readSessionUnlockedFromStorage(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem(SESSION_KEY) === '1';
}

function writeSessionUnlockedToStorage(v: boolean): void {
  if (typeof sessionStorage === 'undefined') return;
  if (v) sessionStorage.setItem(SESSION_KEY, '1');
  else sessionStorage.removeItem(SESSION_KEY);
}

export const TEACHER_DASH_CODE = '123123';

export const useTeacherStore = create<TeacherState>((set) => ({
  sessionUnlocked: readSessionUnlockedFromStorage(),
  doubleCatchMoneyXp: false,
  setSessionUnlocked: (sessionUnlocked) => {
    writeSessionUnlockedToStorage(sessionUnlocked);
    set({ sessionUnlocked });
  },
  setDoubleCatchMoneyXp: (doubleCatchMoneyXp) => set({ doubleCatchMoneyXp }),
  clearSessionUnlock: () => {
    writeSessionUnlockedToStorage(false);
    set({ sessionUnlocked: false, doubleCatchMoneyXp: false });
  },
}));
