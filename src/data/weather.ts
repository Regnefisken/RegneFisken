export type WeatherTypeId = 'clear' | 'overcast' | 'rain' | 'storm' | 'fog';

export interface WeatherData {
  id: WeatherTypeId;
  name: string;
  icon: string;
  waveAmp: number;
  rain: boolean;
  storm: boolean;
  fogDens: number;
  lightMod: number;
}

export const WEATHER_TYPES = {
  CLEAR: { id: 'clear', name: 'Klar Himmel', icon: '☀️', waveAmp: 0.2, rain: false, storm: false, fogDens: 0.005, lightMod: 1.0 },
  OVERCAST: { id: 'overcast', name: 'Overskyet', icon: '☁️', waveAmp: 0.25, rain: false, storm: false, fogDens: 0.015, lightMod: 0.8 },
  RAIN: { id: 'rain', name: 'Regnvejr', icon: '🌧️', waveAmp: 0.45, rain: true, storm: false, fogDens: 0.03, lightMod: 0.6 },
  STORM: { id: 'storm', name: 'Storm', icon: '⛈️', waveAmp: 0.75, rain: true, storm: true, fogDens: 0.05, lightMod: 0.35 },
  FOG: { id: 'fog', name: 'Tæt Tåge', icon: '🌫️', waveAmp: 0.05, rain: false, storm: false, fogDens: 0.08, lightMod: 0.7 },
} as const satisfies Record<string, WeatherData>;

const WEATHER_IDS: readonly WeatherTypeId[] = ['clear', 'overcast', 'rain', 'storm', 'fog'];

export function isWeatherTypeId(v: string): v is WeatherTypeId {
  return (WEATHER_IDS as readonly string[]).includes(v);
}
