import { create } from 'zustand';

export interface AdminCoords {
  x: number;
  y: number;
  z: number;
}

interface AdminState {
  isOpen: boolean;
  freeRoamActive: boolean;
  /** WASD på vandret plan + Y fra raycast (dev free-roam). */
  freeRoamGroundLock: boolean;
  /** Free-roam: optag positionsprøver (bruges af admin-panelet). */
  coordRecordActive: boolean;
  coordRecordSamples: AdminCoords[];
  coords: AdminCoords;
  toggle: () => void;
  close: () => void;
  setFreeRoamActive: (v: boolean) => void;
  setFreeRoamGroundLock: (v: boolean) => void;
  startCoordRecord: () => void;
  stopCoordRecord: () => void;
  clearCoordRecordSamples: () => void;
  appendCoordRecordSample: (c: AdminCoords) => void;
  setCoords: (c: AdminCoords) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  isOpen: false,
  freeRoamActive: false,
  freeRoamGroundLock: false,
  coordRecordActive: false,
  coordRecordSamples: [],
  coords: { x: 0, y: 4.6, z: 13 },
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  close: () => set({ isOpen: false, coordRecordActive: false }),
  setFreeRoamActive: (freeRoamActive) => set({ freeRoamActive }),
  setFreeRoamGroundLock: (freeRoamGroundLock) => set({ freeRoamGroundLock }),
  startCoordRecord: () => set({ coordRecordActive: true, coordRecordSamples: [] }),
  stopCoordRecord: () => set({ coordRecordActive: false }),
  clearCoordRecordSamples: () => set({ coordRecordSamples: [] }),
  appendCoordRecordSample: (c) =>
    set((s) => ({ coordRecordSamples: [...s.coordRecordSamples, { ...c }] })),
  setCoords: (coords) => set({ coords }),
}));
