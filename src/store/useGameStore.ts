import { create } from 'zustand';
import { DAY_NIGHT_CYCLE } from '../data/world.js';
import type { DayNightPhase } from '../types/game.js';
import type { LocationId } from '../types/locations.js';
import { usePlayerStore } from './usePlayerStore.js';

export type GameFlowState =
  | 'idle'
  | 'casting'
  | 'waiting'
  | 'math'
  | 'reeling'
  | 'catch'
  | 'fight'
  | string;

interface GameState {
  gameState: GameFlowState;
  shopInitialTab: string;
  currentLocation: LocationId | string;
  weatherType: string;
  timePhase: DayNightPhase;
  showLightning: boolean;
  thunderActive: boolean;
  sceneReady: boolean;
  furnitureMode: boolean;
  selectedFurniture: string | null;
  headlampOn: boolean;
  setGameState: (s: GameFlowState) => void;
  setShopInitialTab: (t: string) => void;
  setCurrentLocation: (id: LocationId | string) => void;
  setWeatherType: (w: string) => void;
  setTimePhase: (p: DayNightPhase) => void;
  setShowLightning: (v: boolean) => void;
  setThunderActive: (v: boolean) => void;
  setSceneReady: (v: boolean) => void;
  setFurnitureMode: (v: boolean) => void;
  setSelectedFurniture: (id: string | null) => void;
  setHeadlampOn: (v: boolean) => void;
}

const defaultPhase = DAY_NIGHT_CYCLE.phases[1] as DayNightPhase;

export const useGameStore = create<GameState>((set) => ({
  gameState: 'idle',
  shopInitialTab: 'fishing_gear',
  currentLocation: 'pier',
  weatherType: 'clear',
  timePhase: defaultPhase,
  showLightning: false,
  thunderActive: false,
  sceneReady: false,
  furnitureMode: false,
  selectedFurniture: null,
  headlampOn: false,
  setGameState: (gameState) => set({ gameState }),
  setShopInitialTab: (shopInitialTab) => set({ shopInitialTab }),
  setCurrentLocation: (currentLocation) => {
    set({ currentLocation });
    const id = String(currentLocation);
    usePlayerStore.getState().setStats((s) => {
      if (s.areasVisited.includes(id)) return s;
      return { ...s, areasVisited: [...s.areasVisited, id] };
    });
  },
  setWeatherType: (weatherType) => set({ weatherType }),
  setTimePhase: (timePhase) => set({ timePhase }),
  setShowLightning: (showLightning) => set({ showLightning }),
  setThunderActive: (thunderActive) => set({ thunderActive }),
  setSceneReady: (sceneReady) => set({ sceneReady }),
  setFurnitureMode: (furnitureMode) => set({ furnitureMode }),
  setSelectedFurniture: (selectedFurniture) => set({ selectedFurniture }),
  setHeadlampOn: (headlampOn) => set({ headlampOn }),
}));
