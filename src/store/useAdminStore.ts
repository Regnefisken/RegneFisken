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
  /** Museklik-pick (dev): kun aktiv når sandt + panel åbent. */
  clickPickEnabled: boolean;
  /** Klik-pick må bruge vandfladens geometri som træf (ellers springes vand over som ved jord-raycast). */
  clickPickIncludeWater: boolean;
  pickedCoords: AdminCoords | null;
  setClickPickEnabled: (v: boolean) => void;
  setClickPickIncludeWater: (v: boolean) => void;
  setPickedCoords: (c: AdminCoords | null) => void;
  /** Skjul midters «Kast snøren» (dev admin). Nulstilles ved luk af panel. */
  hideKastSnorenUi: boolean;
  setHideKastSnorenUi: (v: boolean) => void;
  setCoords: (c: AdminCoords) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  isOpen: false,
  freeRoamActive: false,
  freeRoamGroundLock: false,
  coordRecordActive: false,
  coordRecordSamples: [],
  clickPickEnabled: false,
  clickPickIncludeWater: false,
  pickedCoords: null,
  hideKastSnorenUi: false,
  coords: { x: 0, y: 4.6, z: 13 },
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  close: () =>
    set({
      isOpen: false,
      coordRecordActive: false,
      clickPickEnabled: false,
      hideKastSnorenUi: false,
    }),
  setFreeRoamActive: (freeRoamActive) => set({ freeRoamActive }),
  setFreeRoamGroundLock: (freeRoamGroundLock) => set({ freeRoamGroundLock }),
  startCoordRecord: () => set({ coordRecordActive: true, coordRecordSamples: [] }),
  stopCoordRecord: () => set({ coordRecordActive: false }),
  clearCoordRecordSamples: () => set({ coordRecordSamples: [] }),
  appendCoordRecordSample: (c) =>
    set((s) => ({ coordRecordSamples: [...s.coordRecordSamples, { ...c }] })),
  setClickPickEnabled: (clickPickEnabled) => set({ clickPickEnabled }),
  setClickPickIncludeWater: (clickPickIncludeWater) => set({ clickPickIncludeWater }),
  setPickedCoords: (pickedCoords) => set({ pickedCoords }),
  setHideKastSnorenUi: (hideKastSnorenUi) => set({ hideKastSnorenUi }),
  setCoords: (coords) => set({ coords }),
}));
