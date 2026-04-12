import { create } from 'zustand';
import { DAY_NIGHT_CYCLE } from '../data/world.js';
import type { WeatherTypeId } from '../data/weather.js';
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
  weatherType: WeatherTypeId;
  prevWeather: WeatherTypeId;
  weatherOverrideUntil: number;
  timePhase: DayNightPhase;
  showLightning: boolean;
  thunderActive: boolean;
  sceneReady: boolean;
  furnitureMode: boolean;
  selectedFurniture: string | null;
  headlampOn: boolean;
  showAquariumGame: boolean;
  jungleFishing: boolean;
  nearJungleBucket: boolean;
  /** Strandparasol — skjules under E→fiskeri-fade, vises igen efter Q (eller ved rejse væk). */
  jungleParasolVisible: boolean;
  /** Touch-knapper / fælles request-kø til jungle fiskeri (E/Q) — ikke-tastatur. */
  jungleFishRequest: 'enter' | 'exit' | null;
  setJungleFishRequest: (v: 'enter' | 'exit' | null) => void;
  setJungleFishing: (v: boolean) => void;
  setNearJungleBucket: (v: boolean) => void;
  setJungleParasolVisible: (v: boolean) => void;
  setGameState: (s: GameFlowState) => void;
  setShopInitialTab: (t: string) => void;
  setCurrentLocation: (id: LocationId | string) => void;
  setWeatherType: (w: WeatherTypeId) => void;
  setPrevWeather: (w: WeatherTypeId) => void;
  setWeatherOverride: (until: number) => void;
  resetWeatherForTravel: (isDarkLocation: boolean) => void;
  setTimePhase: (p: DayNightPhase) => void;
  setShowLightning: (v: boolean) => void;
  setThunderActive: (v: boolean) => void;
  setSceneReady: (v: boolean) => void;
  setFurnitureMode: (v: boolean) => void;
  setSelectedFurniture: (id: string | null) => void;
  setHeadlampOn: (v: boolean) => void;
  setShowAquariumGame: (show: boolean) => void;
}

const defaultPhase = DAY_NIGHT_CYCLE.phases[1] as DayNightPhase;

export const useGameStore = create<GameState>((set) => ({
  gameState: 'idle',
  shopInitialTab: 'fishing_gear',
  currentLocation: 'pier',
  weatherType: 'clear',
  prevWeather: 'clear',
  weatherOverrideUntil: 0,
  timePhase: defaultPhase,
  showLightning: false,
  thunderActive: false,
  sceneReady: false,
  furnitureMode: false,
  selectedFurniture: null,
  headlampOn: false,
  showAquariumGame: false,
  jungleFishing: false,
  nearJungleBucket: false,
  jungleParasolVisible: true,
  jungleFishRequest: null,
  setJungleFishRequest: (jungleFishRequest) => set({ jungleFishRequest }),
  setJungleFishing: (jungleFishing) => set({ jungleFishing }),
  setNearJungleBucket: (nearJungleBucket) => set({ nearJungleBucket }),
  setJungleParasolVisible: (jungleParasolVisible) => set({ jungleParasolVisible }),
  setGameState: (gameState) => set({ gameState }),
  setShopInitialTab: (shopInitialTab) => set({ shopInitialTab }),
  setCurrentLocation: (currentLocation) => {
    const id = String(currentLocation);
    // legacy-game.html: når man forlader grotten, slukkes pandelampen automatisk
    set({
      currentLocation,
      ...(id !== 'cave' ? { headlampOn: false } : {}),
      ...(id !== 'jungle_island'
        ? {
            jungleFishing: false,
            nearJungleBucket: false,
            jungleParasolVisible: true,
            jungleFishRequest: null,
          }
        : {}),
    });
    usePlayerStore.getState().setStats((s) => {
      if (s.areasVisited.includes(id)) return s;
      return { ...s, areasVisited: [...s.areasVisited, id] };
    });
  },
  setWeatherType: (weatherType) => set({ weatherType }),
  setPrevWeather: (prevWeather) => set({ prevWeather }),
  setWeatherOverride: (weatherOverrideUntil) => set({ weatherOverrideUntil }),
  resetWeatherForTravel: (isDarkLocation) =>
    set({
      weatherType: 'clear',
      prevWeather: 'clear',
      thunderActive: false,
      showLightning: false,
      weatherOverrideUntil:
        Date.now() + (isDarkLocation ? 30_000 + Math.random() * 30_000 : 240_000),
    }),
  setTimePhase: (timePhase) => set({ timePhase }),
  setShowLightning: (showLightning) => set({ showLightning }),
  setThunderActive: (thunderActive) => set({ thunderActive }),
  setSceneReady: (sceneReady) => set({ sceneReady }),
  setFurnitureMode: (furnitureMode) => set({ furnitureMode }),
  setSelectedFurniture: (selectedFurniture) => set({ selectedFurniture }),
  setHeadlampOn: (headlampOn) => set({ headlampOn }),
  setShowAquariumGame: (showAquariumGame) => set({ showAquariumGame }),
}));
