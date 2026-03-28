export type WeatherTypeId = 'clear' | 'overcast' | 'rain' | 'storm' | 'fog' | 'snow' | 'snowstorm';

export interface WeatherData {
  id: WeatherTypeId;
  name: string;
  icon: string;
  waveAmp: number;
  rain: boolean;
  storm: boolean;
  snow: boolean;
  fogDens: number;
  lightMod: number;
}

export const WEATHER_TYPES = {
  CLEAR: { id: 'clear', name: 'Klar Himmel', icon: '☀️', waveAmp: 0.2, rain: false, storm: false, snow: false, fogDens: 0.005, lightMod: 1.0 },
  OVERCAST: { id: 'overcast', name: 'Overskyet', icon: '☁️', waveAmp: 0.25, rain: false, storm: false, snow: false, fogDens: 0.015, lightMod: 0.8 },
  RAIN: { id: 'rain', name: 'Regnvejr', icon: '🌧️', waveAmp: 0.45, rain: true, storm: false, snow: false, fogDens: 0.03, lightMod: 0.6 },
  STORM: { id: 'storm', name: 'Storm', icon: '⛈️', waveAmp: 0.75, rain: true, storm: true, snow: false, fogDens: 0.05, lightMod: 0.35 },
  FOG: { id: 'fog', name: 'Tæt Tåge', icon: '🌫️', waveAmp: 0.05, rain: false, storm: false, snow: false, fogDens: 0.08, lightMod: 0.7 },
  SNOW: { id: 'snow', name: 'Snevejr', icon: '🌨️', waveAmp: 0.25, rain: false, storm: false, snow: true, fogDens: 0.025, lightMod: 0.7 },
  SNOWSTORM: { id: 'snowstorm', name: 'Snestorm', icon: '❄️', waveAmp: 0.55, rain: false, storm: true, snow: true, fogDens: 0.06, lightMod: 0.35 },
} as const satisfies Record<string, WeatherData>;

const WEATHER_IDS: readonly WeatherTypeId[] = ['clear', 'overcast', 'rain', 'storm', 'fog', 'snow', 'snowstorm'];

export function isWeatherTypeId(v: string): v is WeatherTypeId {
  return (WEATHER_IDS as readonly string[]).includes(v);
}
