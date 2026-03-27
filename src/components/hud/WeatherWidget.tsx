import { WEATHER_TYPES } from '../../data/weather';
import { useGameStore } from '../../store/useGameStore';

export function WeatherWidget() {
  const weatherType = useGameStore((s) => s.weatherType);
  const timePhase = useGameStore((s) => s.timePhase);

  const wData =
    Object.values(WEATHER_TYPES).find((w) => w.id === weatherType) ?? WEATHER_TYPES.CLEAR;
  const isStorm = wData.id === 'storm';

  return (
    <div
      className={`pointer-events-none flex w-full flex-col items-end gap-1 ${isStorm ? 'animate-pulse' : ''}`}
    >
      <div className="panel-hud flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-700/50 px-4 py-2 shadow-xl">
        <div className="flex flex-col items-center">
          <span className="mb-1 text-xl leading-none">{timePhase.icon}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase">{timePhase.name}</span>
        </div>
        <div className="mx-1 h-8 w-px bg-slate-600/50" />
        <div className="flex flex-col items-center">
          <span className="mb-1 text-xl leading-none">{wData.icon}</span>
          <span
            className={`text-[10px] font-bold uppercase ${isStorm ? 'text-red-400' : 'text-slate-300'}`}
          >
            {wData.name}
          </span>
        </div>
      </div>
    </div>
  );
}
