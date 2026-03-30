import { create } from 'zustand';

export interface AdminCoords {
  x: number;
  y: number;
  z: number;
}

interface AdminState {
  isOpen: boolean;
  freeRoamActive: boolean;
  coords: AdminCoords;
  toggle: () => void;
  close: () => void;
  setFreeRoamActive: (v: boolean) => void;
  setCoords: (c: AdminCoords) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  isOpen: false,
  freeRoamActive: false,
  coords: { x: 0, y: 4.6, z: 13 },
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  close: () => set({ isOpen: false }),
  setFreeRoamActive: (freeRoamActive) => set({ freeRoamActive }),
  setCoords: (coords) => set({ coords }),
}));
