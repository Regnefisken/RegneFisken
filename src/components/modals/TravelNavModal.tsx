import { useAudio } from '../../audio/useAudio';
import { getLocation, LOCATIONS } from '../../data/locations';
import type { LocationConfig } from '../../types/game';
import type { LocationId } from '../../types/locations';
import { CABIN_LOCATIONS } from '../../logic/location-helpers';
import { isTravelBetweenCabinRooms, runLocationTravel } from '../../logic/cabin-room-travel';
import { destinationAllowsTravel, isAreaUnlocked } from '../../logic/travel-unlock';
import { useFishingStore } from '../../store/useFishingStore';
import { useGameStore } from '../../store/useGameStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useUIStore } from '../../store/useUIStore';

const TABS = [
  { id: 'fishing', label: '🎣 Fiskepladser' },
  { id: 'base', label: '🏠 Dine Steder' },
  { id: 'world', label: '🌍 Nye Verdener' },
] as const;

export function TravelNavModal() {
  const { play } = useAudio();
  const showNavPicker = useUIStore((s) => s.showNavPicker);
  const setShowNavPicker = useUIStore((s) => s.setShowNavPicker);
  const activeTravelTab = useUIStore((s) => s.activeTravelTab);
  const setActiveTravelTab = useUIStore((s) => s.setActiveTravelTab);
  const setToastMessage = useUIStore((s) => s.setToastMessage);

  const progression = usePlayerStore((s) => s.progression);
  const upgrades = usePlayerStore((s) => s.upgrades);
  const questItems = usePlayerStore((s) => s.questItems);

  const currentLocation = useGameStore((s) => s.currentLocation);
  const setCurrentLocation = useGameStore((s) => s.setCurrentLocation);
  const resetWeatherForTravel = useGameStore((s) => s.resetWeatherForTravel);

  const setCurrentStreak = useFishingStore((s) => s.setCurrentStreak);
  const setStreakMilestoneToast = useFishingStore((s) => s.setStreakMilestoneToast);

  const jungleDiscovered = questItems.includes('jungle_discovered');

  if (!showNavPicker) return null;

  function travelTo(areaId: string) {
    const gate = destinationAllowsTravel(areaId, upgrades);
    if (!gate.ok) {
      play('error');
      setToastMessage(gate.message);
      return;
    }
    play('ui');
    const dest = areaId as LocationId;
    const from = useGameStore.getState().currentLocation;
    const proceed = () => {
      setCurrentLocation(dest);
      if (!isTravelBetweenCabinRooms(from, dest)) {
        setCurrentStreak(0);
        setStreakMilestoneToast(null);
      }
      resetWeatherForTravel(!!getLocation(dest).specialRules?.darkLocation);
      setShowNavPicker(false);
    };
    runLocationTravel(dest, proceed);
  }

  function rowForArea(area: LocationConfig) {
    const unlocked = isAreaUnlocked(area, progression.level, upgrades, questItems);
    const isCurrent = currentLocation === area.id;
    const lockReason = !unlocked
      ? progression.level < area.unlockLevel
        ? `Kræver level ${area.unlockLevel}`
        : (area.lockReason ?? 'Kræver fiskekort fra butikken')
      : null;
    const accent = isCurrent
      ? '2px solid rgba(56,189,248,0.7)'
      : unlocked
        ? '1px solid rgba(255,255,255,0.1)'
        : '1px solid rgba(255,255,255,0.05)';
    const bg = isCurrent
      ? 'rgba(56,189,248,0.12)'
      : unlocked
        ? 'rgba(255,255,255,0.04)'
        : 'rgba(0,0,0,0.2)';

    return (
      <button
        key={area.id}
        type="button"
        disabled={!unlocked}
        onClick={() => {
          if (!unlocked) return;
          travelTo(area.id);
        }}
        className="flex w-full cursor-pointer items-center gap-4 rounded-2xl px-4 py-3.5 text-left transition-all disabled:cursor-not-allowed"
        style={{
          border: accent,
          background: bg,
          opacity: unlocked ? 1 : 0.45,
        }}
      >
        <span className="w-10 shrink-0 text-center text-3xl">
          {unlocked ? (area.emoji ?? '🗺') : '🔒'}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="text-sm font-extrabold"
              style={{ color: unlocked ? 'white' : '#6b7280' }}
            >
              {area.name}
            </span>
            {isCurrent && (
              <span
                className="rounded-lg px-2 py-0.5 text-[0.65rem] font-black tracking-wide uppercase"
                style={{ background: 'rgba(56,189,248,0.2)', color: '#38bdf8' }}
              >
                Du er her
              </span>
            )}
          </div>
          {unlocked && area.description ? (
            <div className="mt-1 text-[0.78rem] text-slate-400">{area.description}</div>
          ) : null}
          {lockReason ? (
            <div className="mt-1 text-[0.75rem] text-slate-500">{lockReason}</div>
          ) : null}
        </div>
      </button>
    );
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[9997] flex items-center justify-center"
      style={{
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
      onClick={() => setShowNavPicker(false)}
      onKeyDown={(e) => e.key === 'Escape' && setShowNavPicker(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="panel-dark flex h-[clamp(440px,75dvh,720px)] w-[94%] max-w-[520px] flex-col rounded-3xl border-2 border-sky-400/35 p-6 shadow-2xl"
        style={{
          animation: 'zoomIn 0.25s ease-out forwards',
          boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 40px rgba(56,189,248,0.08)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex shrink-0 items-center justify-between">
          <h3 className="flex items-center gap-2 text-xl font-black text-sky-100">
            ⛵ Vælg destination
          </h3>
          <button
            type="button"
            className="cursor-pointer border-none bg-transparent text-2xl text-slate-400 leading-none"
            onClick={() => setShowNavPicker(false)}
            aria-label="Luk"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 flex shrink-0 gap-1.5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTravelTab(tab.id)}
              className="flex-1 rounded-xl px-1.5 py-2.5 text-[0.8rem] font-bold whitespace-nowrap transition-all"
              style={{
                border:
                  activeTravelTab === tab.id
                    ? '2px solid #38bdf8'
                    : '1px solid rgba(255,255,255,0.1)',
                background:
                  activeTravelTab === tab.id
                    ? 'rgba(56,189,248,0.15)'
                    : 'rgba(255,255,255,0.04)',
                color: activeTravelTab === tab.id ? '#7dd3fc' : '#94a3b8',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-1">
          {activeTravelTab === 'fishing' &&
            Object.values(LOCATIONS)
              .filter((a) => a.type === 'fishing')
              .map((area) => rowForArea(area as LocationConfig))}

          {activeTravelTab === 'base' &&
            (() => {
              const baseAreas = Object.values(LOCATIONS).filter((a) => a.type === 'base');
              const cabinAreas = baseAreas
                .filter((a) => a.parentGroup === 'fishing_cabin')
                .slice()
                .sort((a, b) => {
                  const ia = CABIN_LOCATIONS.indexOf(a.id as (typeof CABIN_LOCATIONS)[number]);
                  const ib = CABIN_LOCATIONS.indexOf(b.id as (typeof CABIN_LOCATIONS)[number]);
                  return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
                });
              const otherBase = baseAreas.filter((a) => a.parentGroup !== 'fishing_cabin');

              if (baseAreas.length === 0) {
                return (
                  <div className="px-4 py-8 text-center text-slate-500">
                    <div className="mb-3 text-4xl">🏠</div>
                    <div className="mb-1 font-bold text-slate-400">Ingen steder endnu</div>
                    <div className="text-sm">
                      Find nøglen med magneten for at låse Fiskehytten op!
                    </div>
                  </div>
                );
              }

              const cabinSample =
                cabinAreas[0] != null ? (cabinAreas[0] as LocationConfig) : null;
              const cabinUnlocked =
                cabinSample != null &&
                isAreaUnlocked(cabinSample, progression.level, upgrades, questItems);

              return (
                <>
                  {cabinAreas.length > 0 &&
                    (cabinUnlocked ? (
                      <div
                        className="flex flex-col gap-2 rounded-2xl p-1"
                        style={{
                          border: '1px solid rgba(255,255,255,0.12)',
                          background: 'rgba(255,255,255,0.03)',
                        }}
                      >
                        <div className="flex items-center gap-2 px-3 pt-2 pb-0.5">
                          <span className="text-2xl">🏠</span>
                          <span className="text-sm font-extrabold text-white">
                            {cabinSample?.name ?? 'Fiskehytten'}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1.5 px-2 pb-2">
                          {cabinAreas.map((area) => {
                            const a = area as LocationConfig;
                            const isCurrent = currentLocation === a.id;
                            const label = a.subtitle ?? a.name;
                            return (
                              <button
                                key={a.id}
                                type="button"
                                onClick={() => travelTo(a.id)}
                                className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-all"
                                style={{
                                  border: isCurrent
                                    ? '2px solid rgba(74,222,128,0.55)'
                                    : '1px solid rgba(255,255,255,0.08)',
                                  background: isCurrent
                                    ? 'rgba(74,222,128,0.1)'
                                    : 'rgba(0,0,0,0.15)',
                                }}
                              >
                                <span className="text-sm font-bold text-slate-100">{label}</span>
                                {isCurrent ? (
                                  <span
                                    className="shrink-0 rounded-lg px-2 py-0.5 text-[0.65rem] font-black tracking-wide uppercase"
                                    style={{
                                      background: 'rgba(74,222,128,0.22)',
                                      color: '#4ade80',
                                    }}
                                  >
                                    Du er her
                                  </span>
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div
                        className="flex w-full items-center gap-4 rounded-2xl px-4 py-4 text-left"
                        style={{
                          border: '1px solid rgba(255,255,255,0.05)',
                          background: 'rgba(0,0,0,0.2)',
                          opacity: 0.45,
                        }}
                      >
                        <span className="w-10 shrink-0 text-center text-3xl">🔒</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-extrabold text-slate-500">???</div>
                          <div className="mt-1 text-[0.78rem] leading-snug text-slate-500">
                            En faldefærdig hytte gemmer sig mellem træerne. Døren er låst.
                          </div>
                        </div>
                      </div>
                    ))}

                  {otherBase.map((area) => {
                    const unlocked = isAreaUnlocked(
                      area as LocationConfig,
                      progression.level,
                      upgrades,
                      questItems,
                    );
                    const isCurrent = currentLocation === area.id;
                    const lockReason = !unlocked ? (area.lockReason ?? 'Låst') : null;
                    return (
                      <button
                        key={area.id}
                        type="button"
                        disabled={!unlocked}
                        onClick={() => unlocked && travelTo(area.id)}
                        className="flex w-full cursor-pointer items-center gap-4 rounded-2xl px-4 py-4 text-left transition-all disabled:cursor-not-allowed"
                        style={{
                          border: isCurrent
                            ? '2px solid rgba(251,191,36,0.7)'
                            : unlocked
                              ? '1px solid rgba(255,255,255,0.1)'
                              : '1px solid rgba(255,255,255,0.05)',
                          background: isCurrent
                            ? 'rgba(251,191,36,0.1)'
                            : unlocked
                              ? 'rgba(255,255,255,0.04)'
                              : 'rgba(0,0,0,0.2)',
                          opacity: unlocked ? 1 : 0.45,
                        }}
                      >
                        <span className="w-10 shrink-0 text-center text-3xl">
                          {unlocked ? (area.emoji ?? '🏠') : '🔒'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className="text-sm font-extrabold"
                              style={{ color: unlocked ? 'white' : '#6b7280' }}
                            >
                              {area.name}
                            </span>
                            {isCurrent && (
                              <span
                                className="rounded-lg px-2 py-0.5 text-[0.65rem] font-black tracking-wide uppercase"
                                style={{
                                  background: 'rgba(251,191,36,0.2)',
                                  color: '#fbbf24',
                                }}
                              >
                                Du er her
                              </span>
                            )}
                          </div>
                          {unlocked && area.description ? (
                            <div className="mt-1 text-[0.78rem] text-slate-400">{area.description}</div>
                          ) : null}
                          {lockReason ? (
                            <div className="mt-1 text-[0.75rem] text-slate-500">{lockReason}</div>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </>
              );
            })()}

          {activeTravelTab === 'world' && (
            <div className="px-4 py-6 text-center">
              {jungleDiscovered ? (
                <>
                  <button
                    type="button"
                    onClick={() => travelTo('jungle_island')}
                    className="mb-4 flex w-full cursor-pointer items-center gap-4 rounded-2xl px-4 py-4 text-left transition-all"
                    style={{
                      border:
                        currentLocation === 'jungle_island'
                          ? '2px solid rgba(74,222,128,0.7)'
                          : '1px solid rgba(255,255,255,0.1)',
                      background:
                        currentLocation === 'jungle_island'
                          ? 'rgba(74,222,128,0.1)'
                          : 'rgba(255,255,255,0.04)',
                    }}
                  >
                    <span className="w-10 shrink-0 text-center text-3xl">🦕</span>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold text-white">Jungleøen</span>
                        {currentLocation === 'jungle_island' && (
                          <span
                            className="rounded-lg px-2 py-0.5 text-[0.65rem] font-black tracking-wide uppercase"
                            style={{
                              background: 'rgba(74,222,128,0.2)',
                              color: '#4ade80',
                            }}
                          >
                            Du er her
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-[0.78rem] text-slate-400">
                        En forhistorisk jungleø — opdaget med Plesiosaurus
                      </div>
                    </div>
                  </button>
                  <div className="mt-4 flex justify-center gap-2">
                    {['🏰', '🌋', '🪐'].map((e, i) => (
                      <div
                        key={i}
                        className="flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-white/10 text-2xl opacity-40"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                      >
                        {e}
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-slate-500">Flere verdener kommer snart...</p>
                </>
              ) : (
                <>
                  <div className="mb-4 animate-bounce text-5xl">🌍</div>
                  <div className="mb-2 text-lg font-black text-sky-100">
                    Nye verdener kommer snart!
                  </div>
                  <p className="mx-auto max-w-[280px] text-sm leading-relaxed text-slate-500">
                    Her vil du snart kunne rejse til helt nye verdener med nye eventyr, fisk og
                    udfordringer.
                  </p>
                  <div className="mt-6 flex justify-center gap-2">
                    {['🏰', '🌋', '🪐'].map((e, i) => (
                      <div
                        key={i}
                        className="flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-white/10 text-2xl opacity-40"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                      >
                        {e}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
