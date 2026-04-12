import { isGraphicsCriticalParamKey } from './editorConstants.js';

/** Rødt udråbstegn ved grafik-tunge parametre (vises ved siden af låse-knappen). */
export function GraphicsCriticalMarker({ paramKey }: { paramKey: string }) {
  if (!isGraphicsCriticalParamKey(paramKey)) return null;
  return (
    <span
      className="inline-flex h-4 min-w-[1rem] shrink-0 items-center justify-center rounded-full bg-red-600 px-0.5 text-[9px] font-black leading-none text-white shadow-sm"
      title="Grafik-tung indstilling — låst mod «Tilfældig fisk» som standard. Tryk 🔓 for at inkludere i tilfældig generering."
      aria-label="Grafik-tung parameter"
    >
      !
    </span>
  );
}
