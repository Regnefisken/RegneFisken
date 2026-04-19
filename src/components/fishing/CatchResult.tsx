import { useAudio } from '../../audio/useAudio';
import { catchPanelGradTop, fangetBadgeForCatch } from '../../logic/catch-fanget-badge';
import { applyXP, getFinalStreakBonus, xpForCatch } from '../../logic/xp-engine';
import type { RollCatchResult } from '../../types/fish';
import { useBucketDropStore } from '../../store/useBucketDropStore';
import { useCollectionStore } from '../../store/useCollectionStore';
import { useGameStore } from '../../store/useGameStore';
import { useFishingStore } from '../../store/useFishingStore';
import { useMathStore } from '../../store/useMathStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useUIStore } from '../../store/useUIStore';
import { rarityTextClass } from '../hud/rarityColor';
import { CatchLegendaryCompanionPreview } from './CatchLegendaryCompanionPreview';
import { CATCH_OVERLAY_BOTTOM_PAD, CATCH_OVERLAY_SHELL } from './catchOverlayLayout';
import { SunketChestCatchPanel } from './SunketChestCatchPanel';
import { isSunketChestFishId } from '../../logic/wardrobeLoot';

/** Som legacy `keepFish` — `animateFishToBucket` undtagen flaske/plesio/helleflynder + companion-specialer. */
function shouldAnimateFishToBucket(fish: RollCatchResult): boolean {
  return (
    fish.itemType !== 'bottle' &&
    fish.itemType !== 'plesiosaur' &&
    fish.itemType !== 'halibut' &&
    fish.itemType !== 'golden_frog' &&
    fish.itemType !== 'axolotl' &&
    fish.itemType !== 'fossil' &&
    fish.itemType !== 'conch' &&
    fish.itemType !== 'sardine' &&
    fish.itemType !== 'boss_hvidhaj' &&
    fish.itemType !== 'crystal_junk'
  );
}

export function CatchResult() {
  const { play } = useAudio();
  const gameState = useGameStore((s) => s.gameState);
  const setGameState = useGameStore((s) => s.setGameState);
  const lastCatch = useFishingStore((s) => s.lastCatch);
  const setLastCatch = useFishingStore((s) => s.setLastCatch);
  const currentStreak = useFishingStore((s) => s.currentStreak);
  const upgrades = usePlayerStore((s) => s.upgrades);
  const zenMode = useMathStore((s) => s.zenMode);
  const conchBaitExpiry = usePlayerStore((s) => s.conchBaitExpiry);
  const flyBaitExpiry = usePlayerStore((s) => s.flyBaitExpiry);
  const hajBloodExpiry = usePlayerStore((s) => s.hajBloodExpiry);
  const perleLimExpiry = usePlayerStore((s) => s.perleLimExpiry);
  const setInventory = usePlayerStore((s) => s.setInventory);
  const helleflynderCaught = useCollectionStore((s) => s.helleflynderCaught);
  const setHelleflynderCaught = useCollectionStore((s) => s.setHelleflynderCaught);
  const usedWishes = useCollectionStore((s) => s.usedWishes);
  const setWishOptions = useCollectionStore((s) => s.setWishOptions);
  const setShowWishModal = useCollectionStore((s) => s.setShowWishModal);
  const hasGoldenFrog = useCollectionStore((s) => s.hasGoldenFrog);
  const goldenFrogCount = useCollectionStore((s) => s.goldenFrogCount);
  const setHasGoldenFrog = useCollectionStore((s) => s.setHasGoldenFrog);
  const setGoldenFrogCount = useCollectionStore((s) => s.setGoldenFrogCount);
  const progression = usePlayerStore((s) => s.progression);
  const setProgression = usePlayerStore((s) => s.setProgression);
  const setCoins = usePlayerStore((s) => s.setCoins);
  const questItems = usePlayerStore((s) => s.questItems);
  const setQuestItems = usePlayerStore((s) => s.setQuestItems);
  const setStats = usePlayerStore((s) => s.setStats);
  const setToastMessage = useUIStore((s) => s.setToastMessage);
  const setXpToast = useUIStore((s) => s.setXpToast);
  const setShowLevelUp = useUIStore((s) => s.setShowLevelUp);
  const uiMode = useUIStore((s) => s.uiMode);
  const { isPortrait } = useIsMobile();
  const isMobileCatchPanel = uiMode === 'mobile';
  const mobileLandscapeCatch = isMobileCatchPanel && !isPortrait;
  const collectibleInventory = useCollectionStore((s) => s.collectibleInventory);

  if (gameState !== 'catch' || !lastCatch) return null;

  if (lastCatch.itemType === 'cabin_key') {
    function keepKey() {
      play('ui');
      setQuestItems((prev) => (prev.includes('cabin_key') ? prev : [...prev, 'cabin_key']));
      setLastCatch(null);
      setGameState('idle');
    }

    const cabinKeyPanelStyle = {
      borderColor: '#DAA520',
      background: 'rgba(18,11,4,0.98)',
      boxShadow: '0 0 60px rgba(218,165,32,0.35)',
    } as const;

    const cabinKeyBody = (
      <>
        <div
          className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[0.65rem] font-black tracking-widest uppercase md:mb-5 md:px-6 md:text-xs"
          style={{ background: 'rgba(120,80,10,0.85)', color: '#fde68a' }}
        >
          🗝️ Quest-genstand fundet!
        </div>
        <h2 className="mb-2 text-2xl font-black text-amber-100 md:text-4xl">Fiskehyttens Nøgle</h2>
        <p className="mb-0 text-xs leading-relaxed text-amber-300/80 md:mb-6 md:text-sm">
          En tung, gammel messingnøgle dækket af havtang.
          <br />
          Den passer perfekt til den gamle fiskehyttes dør…
        </p>
      </>
    );

    const cabinKeyButtonClass =
      'w-full rounded-2xl border-b-4 font-bold text-white shadow-xl transition-all hover:scale-105 active:scale-95';
    const cabinKeyButtonStyle = {
      background: 'linear-gradient(to bottom, #d97706, #b45309)',
      borderColor: '#78350f',
    } as const;

    if (isMobileCatchPanel) {
      return (
        <div
          className={`pointer-events-none fixed inset-0 z-[10040] flex min-h-0 flex-col px-4 pt-[max(0.75rem,env(safe-area-inset-top))] ${CATCH_OVERLAY_BOTTOM_PAD}${
            mobileLandscapeCatch ? ' !pt-0 !pb-[max(0.5rem,env(safe-area-inset-bottom))]' : ''
          }`}
        >
          {/* Øverst: plads til 3D-nøgle (`FishPool` + `CabinKeyModel`) — i landskab mindre flex så panelet får luft */}
          <div
            className={
              mobileLandscapeCatch ? 'min-h-0 flex-[1] basis-0' : 'min-h-0 flex-[2.2]'
            }
            aria-hidden
          />
          <div className="flex w-full flex-none justify-center">
            <div
              className={
                mobileLandscapeCatch
                  ? 'anim-zoom-in pointer-events-auto relative mt-0 mb-0 flex w-full max-w-md flex-shrink-0 flex-col overflow-hidden rounded-3xl border-4 p-4 text-center shadow-2xl max-h-[min(85dvh,calc(100svh-max(0.5rem,env(safe-area-inset-top))-max(0.5rem,env(safe-area-inset-bottom))))]'
                  : 'anim-zoom-in pointer-events-auto relative mt-auto mb-[5.5rem] flex max-h-[min(92dvh,calc(100svh-max(0.75rem,env(safe-area-inset-top))-max(0.75rem,env(safe-area-inset-bottom))))] w-full max-w-md flex-col overflow-hidden rounded-3xl border-4 p-4 text-center shadow-2xl'
              }
              style={cabinKeyPanelStyle}
            >
              <div
                className="pointer-events-none absolute inset-0 rounded-3xl"
                style={{
                  background: 'radial-gradient(ellipse at top, rgba(218,165,32,0.18), transparent 65%)',
                }}
              />
              <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">{cabinKeyBody}</div>
                <button
                  type="button"
                  onClick={keepKey}
                  className={`${cabinKeyButtonClass} mt-3 flex-shrink-0 py-3 text-lg`}
                  style={cabinKeyButtonStyle}
                >
                  🗝️ Tag nøglen med
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`pointer-events-none fixed inset-0 z-[10040] flex min-h-0 flex-col px-4 pt-[max(0.75rem,env(safe-area-inset-top))] ${CATCH_OVERLAY_BOTTOM_PAD}`}
      >
        {/* Øverst: plads til 3D-nøgle (`FishPool` + `CabinKeyModel`) — samme idé som axolotl/gylden frø */}
        <div className="min-h-0 flex-[2.2]" aria-hidden />
        <div className="flex w-full flex-none justify-center">
          <div
            className="anim-zoom-in pointer-events-auto relative max-h-[min(68dvh,28rem)] w-full max-w-md overflow-y-auto rounded-3xl border-4 p-8 text-center shadow-2xl scrollbar-hide"
            style={cabinKeyPanelStyle}
          >
            <div
              className="pointer-events-none absolute inset-0 rounded-3xl"
              style={{
                background: 'radial-gradient(ellipse at top, rgba(218,165,32,0.18), transparent 65%)',
              }}
            />
            <div className="relative z-10">
              {cabinKeyBody}
              <button
                type="button"
                onClick={keepKey}
                className={`${cabinKeyButtonClass} mt-4 py-4 text-xl`}
                style={cabinKeyButtonStyle}
              >
                🗝️ Tag nøglen med
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (lastCatch.itemType === 'halibut') {
    const halibutId = lastCatch.id;
    const allWishes = [
      {
        id: 'friend' as const,
        label: '🐵 Venskab',
        description: 'En abe-ven bliver din matematik-hjælper for evigt!',
      },
      {
        id: 'love' as const,
        label: '❤️ Kærlighed',
        description: 'Kærlighed fra dybet! En magisk hjerteballon der elsker gemmeleg.',
      },
      {
        id: 'wealth' as const,
        label: '💰 Rigdom',
        description: '+1.000 kroner direkte i lommen!',
      },
    ];

    function dismissKongFlynder() {
      play('splash');
      setInventory((prev) => prev.filter((f) => f.id !== halibutId));
      setLastCatch(null);
      setGameState('idle');
    }

    function releaseForWish() {
      play('ui');
      setInventory((prev) => prev.filter((f) => f.id !== halibutId));
      const catchNum = helleflynderCaught + 1;
      setHelleflynderCaught(catchNum);
      const available = allWishes.filter((w) => !usedWishes.includes(w.id));
      const maxChoices = 4 - catchNum;
      setWishOptions(available.slice(0, Math.max(1, maxChoices)));
      setShowWishModal(true);
      setLastCatch(null);
      setGameState('idle');
    }

    const kongFlynderShell =
      'anim-zoom-in pointer-events-auto relative rounded-2xl border-2 border-yellow-500/50 bg-slate-800/95 text-center shadow-[0_0_30px_rgba(234,179,8,0.15)]';

    const kongFlynderBody = (
      <>
        <div className="mb-3 animate-bounce text-5xl md:mb-4 md:text-6xl">👑</div>
        <h3 className="mb-2 text-lg font-black tracking-wide text-yellow-400 md:mb-3 md:text-2xl">
          KONG FLYNDER SIGER HEJ
        </h3>
        <p className="text-sm leading-relaxed font-medium text-slate-300 md:text-base">
          Et kæmpe plask! Det er Kong Flynder. Han lod sig fange med vilje, bare for at kigge forbi og sige hej.
          <br />
          Du har allerede fået alle hans gaver, så i dag er det bare et hyggeligt besøg fra en gammel ven. Han
          blinker med sit ene øje.
        </p>
      </>
    );

    if (helleflynderCaught >= 3) {
      if (isMobileCatchPanel) {
        return (
          <div
            className={`${CATCH_OVERLAY_SHELL}${
              mobileLandscapeCatch ? ' !pt-0 !pb-[max(0.5rem,env(safe-area-inset-bottom))]' : ''
            }`}
          >
            <div
              className={
                mobileLandscapeCatch
                  ? `${kongFlynderShell} mt-0 mb-0 flex w-full max-w-md flex-shrink-0 flex-col overflow-hidden p-4 max-h-[min(85dvh,calc(100svh-max(0.5rem,env(safe-area-inset-top))-max(0.5rem,env(safe-area-inset-bottom))))]`
                  : `${kongFlynderShell} mt-auto mb-[5.5rem] flex max-h-[min(92dvh,calc(100svh-max(0.75rem,env(safe-area-inset-top))-max(0.75rem,env(safe-area-inset-bottom))))] w-full max-w-md flex-col overflow-hidden p-4`
              }
            >
              <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">{kongFlynderBody}</div>
                <button
                  type="button"
                  onClick={dismissKongFlynder}
                  className="mt-3 flex w-full flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 text-base font-black text-white shadow-[0_4px_0_#0284c7,0_10px_20px_rgba(0,0,0,0.3)] transition-all hover:bg-sky-500 active:translate-y-1 active:shadow-none"
                >
                  Vink farvel og slip Kongen fri 👋🌊
                </button>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className={CATCH_OVERLAY_SHELL}>
          <div
            className={`${kongFlynderShell} mt-auto mb-2 max-h-[85dvh] w-full max-w-md overflow-y-auto p-6 md:mt-80`}
          >
            <div className="mb-4 animate-bounce text-6xl">👑</div>
            <h3 className="mb-3 text-2xl font-black tracking-wide text-yellow-400">
              KONG FLYNDER SIGER HEJ
            </h3>
            <p className="mb-6 text-base leading-relaxed font-medium text-slate-300">
              Et kæmpe plask! Det er Kong Flynder. Han lod sig fange med vilje, bare for at kigge forbi og sige
              hej.
              <br />
              Du har allerede fået alle hans gaver, så i dag er det bare et hyggeligt besøg fra en gammel ven. Han
              blinker med sit ene øje.
            </p>
            <button
              type="button"
              onClick={dismissKongFlynder}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-4 text-lg font-black text-white shadow-[0_4px_0_#0284c7,0_10px_20px_rgba(0,0,0,0.3)] transition-all hover:bg-sky-500 active:translate-y-1 active:shadow-none"
            >
              Vink farvel og slip Kongen fri 👋🌊
            </button>
          </div>
        </div>
      );
    }

    const helleflynderPanelStyle = {
      borderColor: '#DEB887',
      background: 'rgba(15,10,5,0.97)',
    } as const;

    const helleflynderBody = (
      <>
        <div className="mb-3 text-5xl md:mb-4 md:text-7xl" style={{ filter: 'drop-shadow(0 0 20px #DEB887)' }}>
          🐟
        </div>
        <h2 className="mb-2 text-2xl font-black text-amber-200 md:text-4xl">Helleflynder!</h2>
        <p className="mb-2 text-xs text-slate-300 md:text-base">En magisk fisk... den taler til dig.</p>
        <p className="mb-3 text-sm font-bold italic text-amber-300 md:mb-6 md:text-base">
          &quot;Fang mig 3 gange, og du må ønske dig noget...&quot;
        </p>
        <p className="text-xs text-slate-500 md:text-sm">
          Fanget {helleflynderCaught} / 3 gange
        </p>
      </>
    );

    if (isMobileCatchPanel) {
      return (
        <div
          className={`${CATCH_OVERLAY_SHELL}${
            mobileLandscapeCatch ? ' !pt-0 !pb-[max(0.5rem,env(safe-area-inset-bottom))]' : ''
          }`}
        >
          <div
            className={
              mobileLandscapeCatch
                ? 'anim-zoom-in panel-dark pointer-events-auto relative mt-0 mb-0 flex w-full max-w-md flex-shrink-0 flex-col overflow-hidden rounded-3xl border-4 p-4 text-center shadow-2xl max-h-[min(85dvh,calc(100svh-max(0.5rem,env(safe-area-inset-top))-max(0.5rem,env(safe-area-inset-bottom))))]'
                : 'anim-zoom-in panel-dark pointer-events-auto relative mt-auto mb-[5.5rem] flex max-h-[min(92dvh,calc(100svh-max(0.75rem,env(safe-area-inset-top))-max(0.75rem,env(safe-area-inset-bottom))))] w-full max-w-md flex-col overflow-hidden rounded-3xl border-4 p-4 text-center shadow-2xl'
            }
            style={helleflynderPanelStyle}
          >
            <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">{helleflynderBody}</div>
              <button
                type="button"
                onClick={releaseForWish}
                className="mt-3 w-full flex-shrink-0 rounded-2xl border-b-4 border-amber-900 bg-amber-800 py-3 text-lg font-bold text-white hover:bg-amber-700"
              >
                Smid ud og ønsker... 🌟
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={CATCH_OVERLAY_SHELL}>
        <div
          className="anim-zoom-in panel-dark pointer-events-auto relative mt-auto mb-2 max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-3xl border-4 p-8 text-center shadow-2xl scrollbar-hide md:mt-80"
          style={helleflynderPanelStyle}
        >
          <div className="mb-4 text-7xl" style={{ filter: 'drop-shadow(0 0 20px #DEB887)' }}>
            🐟
          </div>
          <h2 className="mb-2 text-4xl font-black text-amber-200">Helleflynder!</h2>
          <p className="mb-2 text-slate-300">En magisk fisk... den taler til dig.</p>
          <p className="mb-6 font-bold italic text-amber-300">
            &quot;Fang mig 3 gange, og du må ønske dig noget...&quot;
          </p>
          <p className="mb-6 text-sm text-slate-500">
            Fanget {helleflynderCaught} / 3 gange
          </p>
          <button
            type="button"
            onClick={releaseForWish}
            className="w-full rounded-2xl border-b-4 border-amber-900 bg-amber-800 py-4 text-xl font-bold text-white hover:bg-amber-700"
          >
            Smid ud og ønsker... 🌟
          </button>
        </div>
      </div>
    );
  }

  if (lastCatch.itemType === 'golden_frog') {
    const catchId = lastCatch.id;
    function keepGoldenFrog() {
      play('ui');
      setInventory((prev) => prev.filter((f) => f.id !== catchId));
      setGoldenFrogCount((c) => c + 1);
      if (!hasGoldenFrog) {
        setHasGoldenFrog(true);
        play('legendary');
        setToastMessage(
          '🐸 Den Gyldne Frø! Den flytter ind i fiskehytten — du kan flytte den rundt!',
        );
        const xpGained = 250;
        const { level, xp, levelUps } = applyXP(progression.level, progression.xp, xpGained);
        setProgression({ level, xp });
        if (levelUps.length > 0) setShowLevelUp(levelUps[levelUps.length - 1]!);
        setXpToast(`+${xpGained} XP`);
      } else {
        play('win');
        setToastMessage(
          `🐸 Den Gyldne Frø igen! Du sætter den nænsomt ud igen. (Fangst #${goldenFrogCount + 1})`,
        );
      }
      setLastCatch(null);
      setGameState('idle');
    }

    const goldenFrogPanelStyle = {
      borderColor: '#fbbf24',
      background: 'rgba(15,12,5,0.98)',
      boxShadow: '0 0 40px rgba(251,191,36,0.3)',
    } as const;

    const goldenFrogBody = (
      <>
        <div className="mb-3 animate-pulse text-5xl md:mb-4 md:text-7xl">🐸</div>
        <div
          className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1 text-[0.65rem] font-black uppercase tracking-wider md:mb-4 md:px-5 md:text-xs"
          style={{ background: '#fbbf24', color: '#78350f' }}
        >
          ✨ Legendarisk fund!
        </div>
        <h2 className="mb-2 text-2xl font-black md:text-4xl" style={{ color: '#fde68a' }}>
          Den Gyldne Frø
        </h2>
        <p className="mb-2 text-xs text-slate-400 md:text-sm">
          En mystisk frø der glimter af rent guld. Dens øjne er kloge og rolige.
        </p>
        {!hasGoldenFrog ? (
          <>
            <p className="mb-2 text-xs font-bold md:text-sm" style={{ color: '#fbbf24' }}>
              📍 Nyt kæledyr til hytten!
            </p>
            <p className="mb-0 text-xs text-yellow-200 md:mb-6 md:text-sm">
              Den flytter ind i fiskehytten — du kan flytte den rundt som de andre møbler!
            </p>
          </>
        ) : (
          <p className="mb-0 text-xs text-yellow-400 md:mb-6 md:text-sm">
            Du har allerede en. Du sætter den nænsomt ud igen. (Fangst #{goldenFrogCount + 1})
          </p>
        )}
      </>
    );

    const goldenFrogButtonStyle = {
      background: '#fbbf24',
      borderColor: '#92400e',
    } as const;

    /** Mobil som axolotl: bund-forankret shell + kun panel (ingen 3D-preview / bund-spacer som på desktop). */
    if (isMobileCatchPanel) {
      return (
        <div
          className={`${CATCH_OVERLAY_SHELL}${
            mobileLandscapeCatch ? ' !pt-0 !pb-[max(0.5rem,env(safe-area-inset-bottom))]' : ''
          }`}
        >
          <div
            className={
              mobileLandscapeCatch
                ? 'anim-zoom-in pointer-events-auto relative mt-0 mb-0 flex w-full max-w-md flex-shrink-0 flex-col overflow-hidden rounded-3xl border-4 p-4 text-center shadow-2xl max-h-[min(85dvh,calc(100svh-max(0.5rem,env(safe-area-inset-top))-max(0.5rem,env(safe-area-inset-bottom))))]'
                : 'anim-zoom-in pointer-events-auto relative mt-auto mb-[5.5rem] flex max-h-[min(92dvh,calc(100svh-max(0.75rem,env(safe-area-inset-top))-max(0.75rem,env(safe-area-inset-bottom))))] w-full max-w-md flex-col overflow-hidden rounded-3xl border-4 p-4 text-center shadow-2xl'
            }
            style={goldenFrogPanelStyle}
          >
            <div
              className="pointer-events-none absolute inset-0 rounded-3xl"
              style={{
                background: 'radial-gradient(ellipse at top, rgba(255,215,0,0.15), transparent 70%)',
              }}
            />
            <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">{goldenFrogBody}</div>
              <button
                type="button"
                onClick={keepGoldenFrog}
                className="mt-3 w-full flex-shrink-0 rounded-2xl border-b-4 py-3 text-lg font-bold text-black"
                style={goldenFrogButtonStyle}
              >
                {!hasGoldenFrog ? '🐸 Tag den med til hytten' : '💧 Sæt ud igen'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`pointer-events-none fixed inset-0 z-[10031] flex min-h-0 flex-col px-4 pt-[max(0.75rem,env(safe-area-inset-top))] ${CATCH_OVERLAY_BOTTOM_PAD}`}
      >
        {/* Samme opdeling som glødende axolotl: 3D i øvre felt (bundjusteret), panel med max-højde uden at skubbe frø til top) */}
        <div className="flex min-h-0 min-w-0 flex-[2.4] flex-col items-center justify-end">
          <CatchLegendaryCompanionPreview variant="golden_frog" />
        </div>
        <div className="flex w-full flex-none justify-center">
          <div
            className="anim-zoom-in pointer-events-auto relative max-h-[min(68dvh,28rem)] w-full max-w-md overflow-y-auto rounded-3xl border-4 p-8 text-center shadow-2xl scrollbar-hide"
            style={goldenFrogPanelStyle}
          >
            <div
              className="pointer-events-none absolute inset-0 rounded-3xl"
              style={{
                background: 'radial-gradient(ellipse at top, rgba(255,215,0,0.15), transparent 70%)',
              }}
            />
            <div className="relative z-10">
              {goldenFrogBody}
              <button
                type="button"
                onClick={keepGoldenFrog}
                className="mt-4 w-full rounded-2xl border-b-4 py-4 text-xl font-bold text-black"
                style={goldenFrogButtonStyle}
              >
                {!hasGoldenFrog ? '🐸 Tag den med til hytten' : '💧 Sæt ud igen'}
              </button>
            </div>
          </div>
        </div>
        <div className="min-h-0 flex-[1]" aria-hidden />
      </div>
    );
  }

  if (lastCatch.itemType === 'axolotl') {
    const catchId = lastCatch.id;
    const hasAxolotl = questItems.includes('has_axolotl');
    function keepAxolotl() {
      play('ui');
      setInventory((prev) => prev.filter((f) => f.id !== catchId));
      if (!hasAxolotl) {
        setQuestItems((prev) => (prev.includes('has_axolotl') ? prev : [...prev, 'has_axolotl']));
        setStats((s) => ({ ...s, axolotlCaught: true }));
        play('legendary');
        setToastMessage(
          '🦎 Den Glødende Axolotl! Den er så smuk, at du ikke kan sælge den — den flytter ind i fiskehytten!',
        );
        const xpGained = 300;
        const { level, xp, levelUps } = applyXP(progression.level, progression.xp, xpGained);
        setProgression({ level, xp });
        if (levelUps.length > 0) setShowLevelUp(levelUps[levelUps.length - 1]!);
        setXpToast(`+${xpGained} XP`);
      } else {
        play('win');
        setToastMessage(
          '🦎 Axolotlen igen! Du sætter den nænsomt tilbage i vandet — den ser ud til at sætte pris på det.',
        );
      }
      setLastCatch(null);
      setGameState('idle');
    }

    const axolotlPanelStyle = {
      borderColor: '#FF69B4',
      background: 'rgba(15,5,12,0.98)',
      boxShadow: '0 0 40px rgba(255,20,147,0.3)',
    } as const;

    const axolotlBody = (
      <>
        <div className="mb-3 animate-pulse text-5xl md:mb-4 md:text-7xl">🦎</div>
        <div
          className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1 text-[0.65rem] font-black uppercase tracking-wider text-white md:mb-4 md:px-5 md:text-xs"
          style={{ background: '#FF1493' }}
        >
          ✨ Legendarisk fund!
        </div>
        <h2 className="mb-2 text-2xl font-black md:text-4xl" style={{ color: '#FFB6C1' }}>
          Glødende Axolotl
        </h2>
        <p className="mb-2 text-xs text-slate-400 md:text-sm">
          Et smilende padde-dyr der nægter at blive voksen. Dens fjer-gæller lyser svagt af en
          uforklarlig energi.
        </p>
        {!hasAxolotl ? (
          <p className="mb-4 text-xs font-bold text-pink-300 md:mb-6 md:text-sm">
            🏠 Den er for smuk til at sælge — den flytter ind i fiskehytten!
          </p>
        ) : (
          <p className="mb-4 text-xs text-pink-400 md:mb-6 md:text-sm">
            Du har allerede en. Du sætter den nænsomt tilbage i vandet.
          </p>
        )}
      </>
    );

    if (isMobileCatchPanel) {
      return (
        <div
          className={`${CATCH_OVERLAY_SHELL}${
            mobileLandscapeCatch ? ' !pt-0 !pb-[max(0.5rem,env(safe-area-inset-bottom))]' : ''
          }`}
        >
          <div
            className={
              mobileLandscapeCatch
                ? 'anim-zoom-in pointer-events-auto relative mt-0 mb-0 flex w-full max-w-md flex-shrink-0 flex-col overflow-hidden rounded-3xl border-4 p-4 text-center shadow-2xl max-h-[min(85dvh,calc(100svh-max(0.5rem,env(safe-area-inset-top))-max(0.5rem,env(safe-area-inset-bottom))))]'
                : 'anim-zoom-in pointer-events-auto relative mt-auto mb-[5.5rem] flex max-h-[min(92dvh,calc(100svh-max(0.75rem,env(safe-area-inset-top))-max(0.75rem,env(safe-area-inset-bottom))))] w-full max-w-md flex-col overflow-hidden rounded-3xl border-4 p-4 text-center shadow-2xl'
            }
            style={axolotlPanelStyle}
          >
            <div
              className="pointer-events-none absolute inset-0 rounded-3xl"
              style={{
                background: 'radial-gradient(ellipse at top, rgba(255,20,147,0.12), transparent 70%)',
              }}
            />
            <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">{axolotlBody}</div>
              <button
                type="button"
                onClick={keepAxolotl}
                className="mt-3 w-full flex-shrink-0 rounded-2xl border-b-4 py-3 text-lg font-bold text-white"
                style={{
                  background: '#C71585',
                  borderColor: '#8B0057',
                }}
              >
                {!hasAxolotl ? '🦎 Tag den med til hytten' : '💧 Sæt tilbage i vandet'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`pointer-events-none fixed inset-0 z-[10031] flex min-h-0 flex-col px-4 pt-[max(0.75rem,env(safe-area-inset-top))] ${CATCH_OVERLAY_BOTTOM_PAD}`}
      >
        {/* Øverst: luft til 3D-axolotl — større end bund, så panel lander mellem fisk og skærmbund */}
        <div className="min-h-0 flex-[2.4]" aria-hidden />
        <div className="flex flex-none justify-center">
          <div
            className="anim-zoom-in pointer-events-auto relative max-h-[min(68dvh,28rem)] w-full max-w-md overflow-y-auto rounded-3xl border-4 p-8 text-center shadow-2xl scrollbar-hide"
            style={axolotlPanelStyle}
          >
            <div
              className="pointer-events-none absolute inset-0 rounded-3xl"
              style={{
                background: 'radial-gradient(ellipse at top, rgba(255,20,147,0.12), transparent 70%)',
              }}
            />
            <div className="relative z-10">
              <div className="mb-4 animate-pulse text-7xl">🦎</div>
              <div
                className="mb-4 inline-flex items-center gap-2 rounded-full px-5 py-1 text-xs font-black uppercase tracking-wider text-white"
                style={{ background: '#FF1493' }}
              >
                ✨ Legendarisk fund!
              </div>
              <h2 className="mb-2 text-4xl font-black" style={{ color: '#FFB6C1' }}>
                Glødende Axolotl
              </h2>
              <p className="mb-2 text-sm text-slate-400">
                Et smilende padde-dyr der nægter at blive voksen. Dens fjer-gæller lyser svagt af en
                uforklarlig energi.
              </p>
              {!hasAxolotl ? (
                <p className="mb-6 text-sm font-bold text-pink-300">
                  🏠 Den er for smuk til at sælge — den flytter ind i fiskehytten!
                </p>
              ) : (
                <p className="mb-6 text-sm text-pink-400">
                  Du har allerede en. Du sætter den nænsomt tilbage i vandet.
                </p>
              )}
              <button
                type="button"
                onClick={keepAxolotl}
                className="w-full rounded-2xl border-b-4 py-4 text-xl font-bold text-white"
                style={{
                  background: '#C71585',
                  borderColor: '#8B0057',
                }}
              >
                {!hasAxolotl ? '🦎 Tag den med til hytten' : '💧 Sæt tilbage i vandet'}
              </button>
            </div>
          </div>
        </div>
        <div className="min-h-0 flex-[1]" aria-hidden />
      </div>
    );
  }

  /** Legacy `legacy-game.html` ~12380–12388 */
  if (lastCatch.itemType === 'fossil') {
    const fossilId = lastCatch.id;
    function dismissFossil() {
      play('ui');
      setInventory((prev) => prev.filter((f) => f.id !== fossilId));
      setToastMessage(`🦴 Fossil lagt i samlingen! (${collectibleInventory.fossilCount} i alt)`);
      setLastCatch(null);
      setGameState('idle');
    }
    const fossilPanelStyle = {
      borderColor: '#78716c',
      background: 'rgba(20,15,10,0.97)',
    } as const;

    const fossilBody = (
      <>
        <div className="mb-3 text-5xl md:mb-4 md:text-7xl">🦴</div>
        <h2 className="mb-2 text-2xl font-black text-amber-200 md:text-4xl">Mystisk Fossil!</h2>
        <p className="text-xs text-slate-400 md:text-base">
          Et urgammelt fossil. Du har nu {collectibleInventory.fossilCount} i din samling.
        </p>
      </>
    );

    if (isMobileCatchPanel) {
      return (
        <div
          className={`${CATCH_OVERLAY_SHELL}${
            mobileLandscapeCatch ? ' !pt-0 !pb-[max(0.5rem,env(safe-area-inset-bottom))]' : ''
          }`}
        >
          <div
            className={
              mobileLandscapeCatch
                ? 'anim-zoom-in panel-dark pointer-events-auto relative mt-0 mb-0 flex w-full max-w-md flex-shrink-0 flex-col overflow-hidden rounded-3xl border-4 p-4 text-center shadow-2xl max-h-[min(85dvh,calc(100svh-max(0.5rem,env(safe-area-inset-top))-max(0.5rem,env(safe-area-inset-bottom))))]'
                : 'anim-zoom-in panel-dark pointer-events-auto relative mt-auto mb-[5.5rem] flex max-h-[min(92dvh,calc(100svh-max(0.75rem,env(safe-area-inset-top))-max(0.75rem,env(safe-area-inset-bottom))))] w-full max-w-md flex-col overflow-hidden rounded-3xl border-4 p-4 text-center shadow-2xl'
            }
            style={fossilPanelStyle}
          >
            <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">{fossilBody}</div>
              <button
                type="button"
                onClick={dismissFossil}
                className="mt-3 w-full flex-shrink-0 rounded-2xl border-b-4 py-3 text-lg font-bold text-amber-100"
                style={{ background: '#78350f', borderColor: '#451a03' }}
              >
                Læg i samlingen 🦴
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={CATCH_OVERLAY_SHELL}>
        <div
          className="anim-zoom-in panel-dark pointer-events-auto relative mt-auto mb-2 max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-3xl border-4 p-8 text-center shadow-2xl scrollbar-hide md:mt-80"
          style={fossilPanelStyle}
        >
          <div className="mb-4 text-7xl">🦴</div>
          <h2 className="mb-2 text-4xl font-black text-amber-200">Mystisk Fossil!</h2>
          <p className="mb-6 text-slate-400">
            Et urgammelt fossil. Du har nu {collectibleInventory.fossilCount} i din samling.
          </p>
          <button
            type="button"
            onClick={dismissFossil}
            className="mt-4 w-full rounded-2xl border-b-4 py-4 text-xl font-bold text-amber-100"
            style={{ background: '#78350f', borderColor: '#451a03' }}
          >
            Læg i samlingen 🦴
          </button>
        </div>
      </div>
    );
  }

  if (lastCatch.itemType === 'sardine') {
    const sardineId = lastCatch.id;
    function dismissSardine() {
      play('ui');
      setInventory((prev) => prev.filter((f) => f.id !== sardineId));
      setToastMessage(`🐟 Sardin lagt i lommen! (${collectibleInventory.sardineCount} i alt)`);
      setLastCatch(null);
      setGameState('idle');
    }

    const sardinePanelStyle = {
      borderColor: '#7A9AB5',
      background: 'rgba(15,25,35,0.97)',
      borderWidth: 2,
    } as const;

    const sardineButtonStyle = {
      background: '#2a4a60',
      border: '1px solid #4a7a98',
      color: '#c8e0f0',
    } as const;

    const sardineBody = (
      <>
        <h2 className="mb-2 text-2xl font-black md:text-4xl" style={{ color: '#A8C8E0' }}>
          🐟 Lille Sardin!
        </h2>
        <p className="mb-2 text-xs md:mb-4 md:text-base" style={{ color: '#8ab0cc' }}>
          En lille sølvblå sardin! Mon der er nogen der kan lide dem...
        </p>
        <p className="mb-0 text-xs md:mb-6 md:text-base" style={{ color: '#6a90a8' }}>
          Du har nu {collectibleInventory.sardineCount} sardiner.
        </p>
      </>
    );

    if (isMobileCatchPanel) {
      return (
        <div
          className={`${CATCH_OVERLAY_SHELL}${
            mobileLandscapeCatch ? ' !pt-0 !pb-[max(0.5rem,env(safe-area-inset-bottom))]' : ''
          }`}
        >
          <div
            className={
              mobileLandscapeCatch
                ? 'anim-zoom-in panel-dark pointer-events-auto relative mt-0 mb-0 flex w-full max-w-md flex-shrink-0 flex-col overflow-hidden rounded-3xl border-4 p-4 text-center shadow-2xl max-h-[min(85dvh,calc(100svh-max(0.5rem,env(safe-area-inset-top))-max(0.5rem,env(safe-area-inset-bottom))))]'
                : 'anim-zoom-in panel-dark pointer-events-auto relative mt-auto mb-[5.5rem] flex max-h-[min(92dvh,calc(100svh-max(0.75rem,env(safe-area-inset-top))-max(0.75rem,env(safe-area-inset-bottom))))] w-full max-w-md flex-col overflow-hidden rounded-3xl border-4 p-4 text-center shadow-2xl'
            }
            style={sardinePanelStyle}
          >
            <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">{sardineBody}</div>
              <button
                type="button"
                onClick={dismissSardine}
                className="mt-3 w-full flex-shrink-0 rounded-2xl border py-3 text-lg font-bold"
                style={sardineButtonStyle}
              >
                Læg i lommen 🐟
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={CATCH_OVERLAY_SHELL}>
        <div
          className="anim-zoom-in panel-dark pointer-events-auto mt-auto mb-2 max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-3xl border-4 p-8 text-center shadow-2xl scrollbar-hide md:mt-80"
          style={sardinePanelStyle}
        >
          <h2 className="mb-2 text-4xl font-black" style={{ color: '#A8C8E0' }}>
            🐟 Lille Sardin!
          </h2>
          <p className="mb-4" style={{ color: '#8ab0cc' }}>
            En lille sølvblå sardin! Mon der er nogen der kan lide dem...
          </p>
          <p className="mb-6" style={{ color: '#6a90a8' }}>
            Du har nu {collectibleInventory.sardineCount} sardiner.
          </p>
          <button
            type="button"
            onClick={dismissSardine}
            className="mt-4 w-full rounded-2xl border py-4 text-xl font-bold"
            style={sardineButtonStyle}
          >
            Læg i lommen 🐟
          </button>
        </div>
      </div>
    );
  }

  /** Legacy ~12474–12488: dedikeret boss-panel (ikke generisk vægt/værdi + «Læg i Spanden»). */
  if (lastCatch.itemType === 'soeuhyre') {
    const SOE_UHYRE_COINS = 8000;
    const SOE_UHYRE_XP = 1000;

    function tameSoeuhyre() {
      play('legendary');
      play('coin');
      setCoins((c) => c + SOE_UHYRE_COINS);
      setToastMessage(
        '🐉 Søuhyret er besejret! Det mægtige uhyre bukker under! +8000 kr!',
      );
      const prev = usePlayerStore.getState().progression;
      const { level, xp, levelUps } = applyXP(prev.level, prev.xp, SOE_UHYRE_XP);
      setProgression({ level, xp });
      setStats((st) => ({ ...st, maxLevel: Math.max(st.maxLevel, level) }));
      if (levelUps.length > 0) setShowLevelUp(levelUps[levelUps.length - 1]!);
      setXpToast(`+${SOE_UHYRE_XP} XP`);
      setLastCatch(null);
      setGameState('idle');
    }

    const soePanelStyle = {
      borderColor: '#22c55e',
      background: 'rgba(0,15,5,0.99)',
      boxShadow: '0 0 50px rgba(34,197,94,0.25)',
    } as const;

    const soePanelInner = (
      <>
        <div className="mb-3 text-6xl leading-none md:mb-4 md:text-7xl" style={{ filter: 'drop-shadow(0 0 15px #22c55e)' }}>
          🐉
        </div>
        <div
          className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1 text-[0.65rem] font-black tracking-wider uppercase md:mb-4 md:px-5 md:text-xs"
          style={{ background: '#052e16', color: '#4ade80' }}
        >
          🏆 Boss besejret!
        </div>
        <h2 className="mb-2 text-2xl font-black md:text-4xl" style={{ color: '#4ade80' }}>
          Søuhyret
        </h2>
        <p className="mb-2 text-xs text-slate-400 md:text-sm">
          Det mægtige søuhyre fra Ørkensøen er besejret! Dets tænder gnistrede i solens sidste lys, mens det
          bukkede under for din stang.
        </p>
        <p className="mb-4 text-lg font-bold text-yellow-400 md:mb-6 md:text-xl">+8.000 kr 🐉</p>
      </>
    );

    return (
      <div
        className={`${CATCH_OVERLAY_SHELL}${
          mobileLandscapeCatch ? ' !pt-0 !pb-[max(0.5rem,env(safe-area-inset-bottom))]' : ''
        }`}
      >
        <div
          className={
            isMobileCatchPanel
              ? mobileLandscapeCatch
                ? 'anim-zoom-in panel-dark pointer-events-auto relative mt-0 mb-0 flex w-full max-w-md flex-shrink-0 flex-col overflow-hidden rounded-3xl border-4 p-4 text-center shadow-2xl scrollbar-hide max-h-[min(85dvh,calc(100svh-max(0.5rem,env(safe-area-inset-top))-max(0.5rem,env(safe-area-inset-bottom))))]'
                : 'anim-zoom-in panel-dark pointer-events-auto relative mt-auto mb-[5.5rem] flex max-h-[min(92dvh,calc(100svh-max(0.75rem,env(safe-area-inset-top))-max(0.75rem,env(safe-area-inset-bottom))))] w-full max-w-md flex-col overflow-hidden rounded-3xl border-4 p-4 text-center shadow-2xl scrollbar-hide'
              : 'anim-zoom-in panel-dark pointer-events-auto relative mt-auto mb-2 max-h-[85dvh] w-full max-w-md overflow-y-auto overflow-x-hidden rounded-3xl border-4 p-8 text-center shadow-2xl scrollbar-hide md:mt-80'
          }
          style={soePanelStyle}
        >
          <div
            className="pointer-events-none absolute inset-0 rounded-3xl"
            style={{
              background: 'radial-gradient(ellipse at top, rgba(34,197,94,0.12), transparent 70%)',
            }}
          />
          {isMobileCatchPanel ? (
            <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">{soePanelInner}</div>
              <button
                type="button"
                onClick={tameSoeuhyre}
                className="mt-3 w-full flex-shrink-0 rounded-2xl border-b-4 py-3 text-lg font-bold transition-all hover:opacity-95 active:translate-y-0.5"
                style={{ background: '#052e16', color: '#4ade80', borderColor: '#022c22' }}
              >
                ⚔️ Du tæmmede uhyret!
              </button>
            </div>
          ) : (
            <div className="relative z-10">
              {soePanelInner}
              <button
                type="button"
                onClick={tameSoeuhyre}
                className="w-full rounded-2xl border-b-4 py-4 text-xl font-bold transition-all hover:opacity-95 active:translate-y-0.5"
                style={{ background: '#052e16', color: '#4ade80', borderColor: '#022c22' }}
              >
                ⚔️ Du tæmmede uhyret!
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  /** Legacy ~12457–12471 */
  if (lastCatch.itemType === 'gnavne_gorm') {
    const GNAVNE_COINS = 5000;
    const GNAVNE_XP = 750;
    function dismissGnavneGorm() {
      play('legendary');
      play('coin');
      setCoins((c) => c + GNAVNE_COINS);
      setToastMessage('😤 Gnavne-Gorm er besejret! Den gnaven kæmpe gav op til sidst. +5000 kr!');
      const prev = usePlayerStore.getState().progression;
      const { level, xp, levelUps } = applyXP(prev.level, prev.xp, GNAVNE_XP);
      setProgression({ level, xp });
      setStats((st) => ({ ...st, maxLevel: Math.max(st.maxLevel, level) }));
      if (levelUps.length > 0) setShowLevelUp(levelUps[levelUps.length - 1]!);
      setXpToast(`+${GNAVNE_XP} XP`);
      setLastCatch(null);
      setGameState('idle');
    }
    const gnavneGormPanelStyle = {
      borderColor: '#39FF14',
      background: 'rgba(0,8,0,0.99)',
      boxShadow: '0 0 50px rgba(57,255,20,0.2)',
    } as const;

    const gnavneGormBody = (
      <>
        <div
          className="mb-3 text-5xl leading-none md:mb-4 md:text-7xl"
          style={{ filter: 'drop-shadow(0 0 15px #39FF14)' }}
        >
          🐡
        </div>
        <div
          className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1 text-[0.65rem] font-black uppercase tracking-wider md:mb-4 md:px-5 md:text-xs"
          style={{ background: '#1a3300', color: '#39FF14' }}
        >
          😤 Boss besejret!
        </div>
        <h2 className="mb-2 text-2xl font-black md:text-4xl" style={{ color: '#39FF14' }}>
          Gnavne-Gorm
        </h2>
        <p className="mb-2 text-xs text-slate-400 md:text-sm">
          Det ældgamle uhyre med det gigantiske underbid gav sig til sidst! Den var utroligt gnaven over dig.
        </p>
        <p className="text-lg font-bold text-yellow-400 md:text-xl">+5.000 kr 👑</p>
      </>
    );

    if (isMobileCatchPanel) {
      return (
        <div
          className={`${CATCH_OVERLAY_SHELL}${
            mobileLandscapeCatch ? ' !pt-0 !pb-[max(0.5rem,env(safe-area-inset-bottom))]' : ''
          }`}
        >
          <div
            className={
              mobileLandscapeCatch
                ? 'anim-zoom-in panel-dark pointer-events-auto relative mt-0 mb-0 flex w-full max-w-md flex-shrink-0 flex-col overflow-hidden rounded-3xl border-4 p-4 text-center shadow-2xl max-h-[min(85dvh,calc(100svh-max(0.5rem,env(safe-area-inset-top))-max(0.5rem,env(safe-area-inset-bottom))))]'
                : 'anim-zoom-in panel-dark pointer-events-auto relative mt-auto mb-[5.5rem] flex max-h-[min(92dvh,calc(100svh-max(0.75rem,env(safe-area-inset-top))-max(0.75rem,env(safe-area-inset-bottom))))] w-full max-w-md flex-col overflow-hidden rounded-3xl border-4 p-4 text-center shadow-2xl'
            }
            style={gnavneGormPanelStyle}
          >
            <div
              className="pointer-events-none absolute inset-0 rounded-3xl"
              style={{
                background: 'radial-gradient(ellipse at top, rgba(57,255,20,0.1), transparent 70%)',
              }}
            />
            <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">{gnavneGormBody}</div>
              <button
                type="button"
                onClick={dismissGnavneGorm}
                className="mt-3 w-full flex-shrink-0 rounded-2xl border-b-4 py-3 text-lg font-bold"
                style={{ background: '#1a3300', color: '#39FF14', borderColor: '#0a1a00' }}
              >
                ⚔️ Du er en legende!
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={CATCH_OVERLAY_SHELL}>
        <div
          className="anim-zoom-in panel-dark pointer-events-auto relative mt-auto mb-2 max-h-[85dvh] w-full max-w-md overflow-y-auto overflow-x-hidden rounded-3xl border-4 p-8 text-center shadow-2xl scrollbar-hide md:mt-80"
          style={gnavneGormPanelStyle}
        >
          <div
            className="pointer-events-none absolute inset-0 rounded-3xl"
            style={{
              background: 'radial-gradient(ellipse at top, rgba(57,255,20,0.1), transparent 70%)',
            }}
          />
          <div className="relative z-10">
            <div className="mb-4 text-7xl leading-none" style={{ filter: 'drop-shadow(0 0 15px #39FF14)' }}>
              🐡
            </div>
            <div
              className="mb-4 inline-flex items-center gap-2 rounded-full px-5 py-1 text-xs font-black tracking-wider uppercase"
              style={{ background: '#1a3300', color: '#39FF14' }}
            >
              😤 Boss besejret!
            </div>
            <h2 className="mb-2 text-4xl font-black" style={{ color: '#39FF14' }}>
              Gnavne-Gorm
            </h2>
            <p className="mb-2 text-sm text-slate-400">
              Det ældgamle uhyre med det gigantiske underbid gav sig til sidst! Den var utroligt gnaven over dig.
            </p>
            <p className="mb-6 text-xl font-bold text-yellow-400">+5.000 kr 👑</p>
            <button
              type="button"
              onClick={dismissGnavneGorm}
              className="w-full rounded-2xl border-b-4 py-4 text-xl font-bold"
              style={{ background: '#1a3300', color: '#39FF14', borderColor: '#0a1a00' }}
            >
              ⚔️ Du er en legende!
            </button>
          </div>
        </div>
      </div>
    );
  }

  /** Legacy ~12557–12566 */
  if (lastCatch.itemType === 'kraken') {
    const KRAKEN_XP = 500;
    function dismissKraken() {
      play('legendary');
      setToastMessage('🐙 Du besejrede Krakenen! Helten på molen!');
      const prev = usePlayerStore.getState().progression;
      const { level, xp, levelUps } = applyXP(prev.level, prev.xp, KRAKEN_XP);
      setProgression({ level, xp });
      setStats((st) => ({
        ...st,
        maxLevel: Math.max(st.maxLevel, level),
        krakenCaught: true,
      }));
      if (levelUps.length > 0) setShowLevelUp(levelUps[levelUps.length - 1]!);
      setXpToast(`+${KRAKEN_XP} XP`);
      setLastCatch(null);
      setGameState('idle');
    }
    const krakenPanelStyle = {
      borderColor: '#6B006B',
      background: 'rgba(20,0,30,0.97)',
    } as const;

    const krakenBody = (
      <>
        <div
          className="mb-3 animate-bounce text-3xl md:mb-4 md:text-4xl"
          style={{ filter: 'drop-shadow(0 0 20px purple)' }}
        >
          🐙
        </div>
        <h2 className="mb-2 text-2xl font-black text-purple-300 md:text-4xl">Krakenen er besejret!</h2>
        <p className="mb-1 text-xs text-slate-300 md:text-base">Du kæmpede mod dybet og vandt!</p>
        <p className="mb-2 text-base font-bold text-purple-300 md:text-lg">+500 XP</p>
        <p className="text-xs italic text-slate-400 md:text-sm">Krakenen forsvandt tilbage i dybet...</p>
      </>
    );

    if (isMobileCatchPanel) {
      return (
        <div
          className={`${CATCH_OVERLAY_SHELL}${
            mobileLandscapeCatch ? ' !pt-0 !pb-[max(0.5rem,env(safe-area-inset-bottom))]' : ''
          }`}
        >
          <div
            className={
              mobileLandscapeCatch
                ? 'anim-zoom-in pointer-events-auto relative mt-0 mb-0 flex w-full max-w-md flex-shrink-0 flex-col overflow-hidden rounded-3xl border-4 p-4 text-center shadow-2xl max-h-[min(85dvh,calc(100svh-max(0.5rem,env(safe-area-inset-top))-max(0.5rem,env(safe-area-inset-bottom))))]'
                : 'anim-zoom-in pointer-events-auto relative mt-auto mb-[5.5rem] flex max-h-[min(92dvh,calc(100svh-max(0.75rem,env(safe-area-inset-top))-max(0.75rem,env(safe-area-inset-bottom))))] w-full max-w-md flex-col overflow-hidden rounded-3xl border-4 p-4 text-center shadow-2xl'
            }
            style={krakenPanelStyle}
          >
            <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">{krakenBody}</div>
              <button
                type="button"
                onClick={dismissKraken}
                className="mt-3 w-full flex-shrink-0 rounded-2xl border-b-4 border-purple-950 bg-purple-900 py-3 text-lg font-bold text-white hover:bg-purple-800"
              >
                ⚔️ Du er en legende!
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={CATCH_OVERLAY_SHELL}>
        <div
          className="anim-zoom-in pointer-events-auto relative mt-auto mb-2 w-full max-w-md rounded-3xl border-4 p-8 text-center shadow-2xl md:mt-80"
          style={krakenPanelStyle}
        >
          <div className="mb-4 animate-bounce text-4xl" style={{ filter: 'drop-shadow(0 0 20px purple)' }}>
            🐙
          </div>
          <h2 className="mb-2 text-4xl font-black text-purple-300">Krakenen er besejret!</h2>
          <p className="mb-1 text-slate-300">Du kæmpede mod dybet og vandt!</p>
          <p className="mb-2 text-lg font-bold text-purple-300">+500 XP</p>
          <p className="mb-6 text-sm italic text-slate-400">Krakenen forsvandt tilbage i dybet...</p>
          <button
            type="button"
            onClick={dismissKraken}
            className="w-full rounded-2xl border-b-4 border-purple-950 bg-purple-900 py-4 text-xl font-bold text-white hover:bg-purple-800"
          >
            ⚔️ Du er en legende!
          </button>
        </div>
      </div>
    );
  }

  if (lastCatch.itemType === 'boss_hvidhaj') {
    const HVIDHAJ_COINS = 3000;
    const HVIDHAJ_XP = 500;
    function dismissHvidhaj() {
      play('legendary');
      play('coin');
      setCoins((c) => c + HVIDHAJ_COINS);
      setToastMessage('🦈 Hvidhajen er besejret! Havets hersker bøjede sig! +3000 kr!');
      const prev = usePlayerStore.getState().progression;
      const { level, xp, levelUps } = applyXP(prev.level, prev.xp, HVIDHAJ_XP);
      setProgression({ level, xp });
      setStats((st) => ({ ...st, maxLevel: Math.max(st.maxLevel, level) }));
      if (levelUps.length > 0) setShowLevelUp(levelUps[levelUps.length - 1]!);
      setXpToast(`+${HVIDHAJ_XP} XP`);
      setLastCatch(null);
      setGameState('idle');
    }
    const hvidhajPanelStyle = {
      borderColor: '#94a3b8',
      background: 'rgba(8,15,28,0.99)',
      boxShadow: '0 0 50px rgba(148,163,184,0.25)',
    } as const;

    const hvidhajBody = (
      <>
        <div
          className="mb-3 text-5xl leading-none md:mb-4 md:text-7xl"
          style={{ filter: 'drop-shadow(0 0 18px rgba(148,163,184,0.6))' }}
        >
          🦈
        </div>
        <div
          className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1 text-[0.65rem] font-black uppercase tracking-wider md:mb-4 md:px-5 md:text-xs"
          style={{ background: '#0f172a', color: '#e2e8f0' }}
        >
          🏆 Boss besejret!
        </div>
        <h2 className="mb-2 text-2xl font-black text-slate-100 md:text-4xl">Hvidhaj</h2>
        <p className="mb-2 text-xs text-slate-400 md:text-sm">
          Den legendariske rovfish er besejret. Belønningen for sejren over havets dronning er din.
        </p>
        <p className="mb-1 text-lg font-bold text-yellow-400 md:text-xl">+3.000 kr 💰</p>
        <p className="text-base font-bold text-cyan-300 md:text-lg">+500 XP</p>
      </>
    );

    if (isMobileCatchPanel) {
      return (
        <div
          className={`${CATCH_OVERLAY_SHELL}${
            mobileLandscapeCatch ? ' !pt-0 !pb-[max(0.5rem,env(safe-area-inset-bottom))]' : ''
          }`}
        >
          <div
            className={
              mobileLandscapeCatch
                ? 'anim-zoom-in panel-dark pointer-events-auto relative mt-0 mb-0 flex w-full max-w-md flex-shrink-0 flex-col overflow-hidden rounded-3xl border-4 p-4 text-center shadow-2xl max-h-[min(85dvh,calc(100svh-max(0.5rem,env(safe-area-inset-top))-max(0.5rem,env(safe-area-inset-bottom))))]'
                : 'anim-zoom-in panel-dark pointer-events-auto relative mt-auto mb-[5.5rem] flex max-h-[min(92dvh,calc(100svh-max(0.75rem,env(safe-area-inset-top))-max(0.75rem,env(safe-area-inset-bottom))))] w-full max-w-md flex-col overflow-hidden rounded-3xl border-4 p-4 text-center shadow-2xl'
            }
            style={hvidhajPanelStyle}
          >
            <div
              className="pointer-events-none absolute inset-0 rounded-3xl"
              style={{
                background: 'radial-gradient(ellipse at top, rgba(148,163,184,0.12), transparent 70%)',
              }}
            />
            <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">{hvidhajBody}</div>
              <button
                type="button"
                onClick={dismissHvidhaj}
                className="mt-3 w-full flex-shrink-0 rounded-2xl border-b-4 py-3 text-lg font-bold text-white transition-all hover:opacity-95 active:translate-y-0.5"
                style={{ background: '#1e3a5f', borderColor: '#0f172a' }}
              >
                ⚔️ Hent belønningen
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={CATCH_OVERLAY_SHELL}>
        <div
          className="anim-zoom-in panel-dark pointer-events-auto relative mt-auto mb-2 max-h-[85dvh] w-full max-w-md overflow-y-auto overflow-x-hidden rounded-3xl border-4 p-8 text-center shadow-2xl scrollbar-hide md:mt-80"
          style={hvidhajPanelStyle}
        >
          <div
            className="pointer-events-none absolute inset-0 rounded-3xl"
            style={{
              background: 'radial-gradient(ellipse at top, rgba(148,163,184,0.12), transparent 70%)',
            }}
          />
          <div className="relative z-10">
            <div className="mb-4 text-7xl leading-none" style={{ filter: 'drop-shadow(0 0 18px rgba(148,163,184,0.6))' }}>
              🦈
            </div>
            <div
              className="mb-4 inline-flex items-center gap-2 rounded-full px-5 py-1 text-xs font-black tracking-wider uppercase"
              style={{ background: '#0f172a', color: '#e2e8f0' }}
            >
              🏆 Boss besejret!
            </div>
            <h2 className="mb-2 text-4xl font-black text-slate-100">Hvidhaj</h2>
            <p className="mb-2 text-sm text-slate-400">
              Den legendariske rovfish er besejret. Belønningen for sejren over havets dronning er din.
            </p>
            <p className="mb-1 text-xl font-bold text-yellow-400">+3.000 kr 💰</p>
            <p className="mb-6 text-lg font-bold text-cyan-300">+500 XP</p>
            <button
              type="button"
              onClick={dismissHvidhaj}
              className="w-full rounded-2xl border-b-4 py-4 text-xl font-bold text-white transition-all hover:opacity-95 active:translate-y-0.5"
              style={{ background: '#1e3a5f', borderColor: '#0f172a' }}
            >
              ⚔️ Hent belønningen
            </button>
          </div>
        </div>
      </div>
    );
  }

  /** Ur-Krystal — unlocks som møbel i hytten i stedet for at sælges. */
  if (lastCatch.itemType === 'crystal_junk') {
    const CRYSTAL_XP = 200;
    const alreadyFound = usePlayerStore.getState().stats.crystalFound;
    function dismissCrystal() {
      play('legendary');
      /* Krystallen lægges ikke i spanden — den bliver direkte til et møbel i hytten. */
      const prev = usePlayerStore.getState().progression;
      const { level, xp, levelUps } = applyXP(prev.level, prev.xp, CRYSTAL_XP);
      setProgression({ level, xp });
      setStats((st) => ({
        ...st,
        maxLevel: Math.max(st.maxLevel, level),
        crystalFound: true,
      }));
      if (levelUps.length > 0) setShowLevelUp(levelUps[levelUps.length - 1]!);
      setXpToast(`+${CRYSTAL_XP} XP`);
      if (!alreadyFound) {
        setToastMessage(
          '💠 Ur-Krystallen lyser op i soveværelset! Du kan flytte den rundt som de andre møbler.',
        );
      } else {
        setToastMessage(
          '💠 Endnu en Ur-Krystal! Dens energi smelter sammen med den du allerede har.',
        );
      }
      setLastCatch(null);
      setGameState('idle');
    }
    const crystalPanelStyle = {
      borderColor: '#00FFFF',
      background: 'rgba(0,10,20,0.98)',
      boxShadow: '0 0 50px rgba(0,255,255,0.25)',
    } as const;

    const crystalBody = (
      <>
        <div
          className="mb-3 text-5xl leading-none md:mb-4 md:text-7xl"
          style={{ filter: 'drop-shadow(0 0 20px #00FFFF)' }}
        >
          💠
        </div>
        <div
          className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1 text-[0.65rem] font-black uppercase tracking-wider md:mb-4 md:px-5 md:text-xs"
          style={{ background: '#007799', color: '#00FFFF' }}
        >
          ✨ Mystisk fund!
        </div>
        <h2 className="mb-2 text-2xl font-black md:text-4xl" style={{ color: '#00FFFF' }}>
          Ur-Krystal
        </h2>
        <p className="mb-2 text-xs text-slate-400 md:text-sm">
          Pulserende og geometrisk perfekt. Rykket fri fra grottebunden. Den summer af en mærkelig, gammel energi.
        </p>
        {!alreadyFound ? (
          <>
            <p className="mb-2 text-xs font-bold md:text-sm" style={{ color: '#00FFFF' }}>
              🏠 Nyt møbel til hytten!
            </p>
            <p className="mb-4 text-xs text-cyan-200 md:mb-6 md:text-sm">
              Krystallen flytter med hjem og stilles op i soveværelset — du kan flytte den rundt som de andre møbler!
            </p>
          </>
        ) : (
          <p className="mb-4 text-xs font-bold leading-relaxed md:mb-6 md:text-sm" style={{ color: '#00FFFF' }}>
            Du har allerede en Ur-Krystal i hytten. Dens energi forstærker den eksisterende krystal!
          </p>
        )}
      </>
    );

    if (isMobileCatchPanel) {
      return (
        <div
          className={`${CATCH_OVERLAY_SHELL}${
            mobileLandscapeCatch ? ' !pt-0 !pb-[max(0.5rem,env(safe-area-inset-bottom))]' : ''
          }`}
        >
          <div
            className={
              mobileLandscapeCatch
                ? 'anim-zoom-in panel-dark pointer-events-auto relative mt-0 mb-0 flex w-full max-w-md flex-shrink-0 flex-col overflow-hidden rounded-3xl border-4 p-4 text-center shadow-2xl max-h-[min(85dvh,calc(100svh-max(0.5rem,env(safe-area-inset-top))-max(0.5rem,env(safe-area-inset-bottom))))]'
                : 'anim-zoom-in panel-dark pointer-events-auto relative mt-auto mb-[5.5rem] flex max-h-[min(92dvh,calc(100svh-max(0.75rem,env(safe-area-inset-top))-max(0.75rem,env(safe-area-inset-bottom))))] w-full max-w-md flex-col overflow-hidden rounded-3xl border-4 p-4 text-center shadow-2xl'
            }
            style={crystalPanelStyle}
          >
            <div
              className="pointer-events-none absolute inset-0 rounded-3xl"
              style={{
                background: 'radial-gradient(ellipse at top, rgba(0,200,255,0.15), transparent 70%)',
              }}
            />
            <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">{crystalBody}</div>
              <button
                type="button"
                onClick={dismissCrystal}
                className="mt-3 w-full flex-shrink-0 rounded-2xl border-b-4 py-3 text-lg font-bold text-black"
                style={{ background: '#00CCCC', borderColor: '#007788' }}
              >
                💠 Tag den med hjem
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={CATCH_OVERLAY_SHELL}>
        <div
          className="anim-zoom-in panel-dark pointer-events-auto relative mt-auto mb-2 max-h-[85dvh] w-full max-w-md overflow-y-auto overflow-x-hidden rounded-3xl border-4 p-8 text-center shadow-2xl scrollbar-hide md:mt-80"
          style={crystalPanelStyle}
        >
          <div
            className="pointer-events-none absolute inset-0 rounded-3xl"
            style={{
              background: 'radial-gradient(ellipse at top, rgba(0,200,255,0.15), transparent 70%)',
            }}
          />
          <div className="relative z-10">
            <div className="mb-4 text-7xl leading-none" style={{ filter: 'drop-shadow(0 0 20px #00FFFF)' }}>
              💠
            </div>
            <div
              className="mb-4 inline-flex items-center gap-2 rounded-full px-5 py-1 text-xs font-black tracking-wider uppercase"
              style={{ background: '#007799', color: '#00FFFF' }}
            >
              ✨ Mystisk fund!
            </div>
            <h2 className="mb-2 text-4xl font-black" style={{ color: '#00FFFF' }}>
              Ur-Krystal
            </h2>
            <p className="mb-2 text-sm text-slate-400">
              Pulserende og geometrisk perfekt. Rykket fri fra grottebunden. Den summer af en mærkelig, gammel energi.
            </p>
            {!alreadyFound ? (
              <>
                <p className="mb-2 text-sm font-bold" style={{ color: '#00FFFF' }}>
                  🏠 Nyt møbel til hytten!
                </p>
                <p className="mb-6 text-sm text-cyan-200">
                  Krystallen flytter med hjem og stilles op i soveværelset — du kan flytte den rundt som de andre møbler!
                </p>
              </>
            ) : (
              <p className="mb-6 text-sm font-bold leading-relaxed" style={{ color: '#00FFFF' }}>
                Du har allerede en Ur-Krystal i hytten. Dens energi forstærker den eksisterende krystal!
              </p>
            )}
            <button
              type="button"
              onClick={dismissCrystal}
              className="w-full rounded-2xl border-b-4 py-4 text-xl font-bold text-black"
              style={{ background: '#00CCCC', borderColor: '#007788' }}
            >
              💠 Tag den med hjem
            </button>
          </div>
        </div>
      </div>
    );
  }

  /** Østers-boss → perle (legacy ~12548–12555); `lastCatch` er allerede `pearl` i React. */
  if (lastCatch.itemType === 'pearl') {
    const PEARL_XP = 150;
    const pearlRowId = lastCatch.id;
    function dismissPearl() {
      play('legendary');
      setToastMessage(`💎 Perle lagt i samlingen! (${collectibleInventory.pearlCount} i alt)`);
      const prev = usePlayerStore.getState().progression;
      const { level, xp, levelUps } = applyXP(prev.level, prev.xp, PEARL_XP);
      setProgression({ level, xp });
      setStats((st) => ({ ...st, maxLevel: Math.max(st.maxLevel, level) }));
      if (levelUps.length > 0) setShowLevelUp(levelUps[levelUps.length - 1]!);
      setXpToast(`+${PEARL_XP} XP`);
      setInventory((prev) => prev.filter((f) => f.id !== pearlRowId));
      setLastCatch(null);
      setGameState('idle');
    }

    const pearlPanelStyle = {
      borderColor: '#EEE8CD',
      background: 'rgba(5,10,20,0.97)',
    } as const;

    const pearlBody = (
      <>
        <div
          className="mb-3 text-5xl leading-none md:mb-4 md:text-7xl"
          style={{ filter: 'drop-shadow(0 0 20px rgba(238,238,205,0.8))' }}
        >
          🦪
        </div>
        <h2 className="mb-2 text-2xl font-black text-slate-100 md:text-4xl">Østers med Perle!</h2>
        <p className="mb-1 text-xs text-slate-300 md:text-sm">Du åbner østersskallen og finder en glinsende perle.</p>
        <p className="mb-0 text-base font-bold text-cyan-200 md:mb-6 md:text-xl">Perlen ryger i din samling!</p>
      </>
    );

    if (isMobileCatchPanel) {
      return (
        <div
          className={`${CATCH_OVERLAY_SHELL}${
            mobileLandscapeCatch ? ' !pt-0 !pb-[max(0.5rem,env(safe-area-inset-bottom))]' : ''
          }`}
        >
          <div
            className={
              mobileLandscapeCatch
                ? 'anim-zoom-in panel-dark pointer-events-auto relative mt-0 mb-0 flex w-full max-w-md flex-shrink-0 flex-col overflow-hidden rounded-3xl border-4 p-4 text-center shadow-2xl max-h-[min(85dvh,calc(100svh-max(0.5rem,env(safe-area-inset-top))-max(0.5rem,env(safe-area-inset-bottom))))]'
                : 'anim-zoom-in panel-dark pointer-events-auto relative mt-auto mb-[5.5rem] flex max-h-[min(92dvh,calc(100svh-max(0.75rem,env(safe-area-inset-top))-max(0.75rem,env(safe-area-inset-bottom))))] w-full max-w-md flex-col overflow-hidden rounded-3xl border-4 p-4 text-center shadow-2xl'
            }
            style={pearlPanelStyle}
          >
            <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">{pearlBody}</div>
              <button
                type="button"
                onClick={dismissPearl}
                className="mt-3 w-full flex-shrink-0 rounded-2xl border-b-4 border-slate-800 bg-slate-600 py-3 text-lg font-bold text-white hover:bg-slate-500"
              >
                💎 Læg i samlingen
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={CATCH_OVERLAY_SHELL}>
        <div
          className="anim-zoom-in panel-dark pointer-events-auto mt-auto mb-2 max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-3xl border-4 p-8 text-center shadow-2xl scrollbar-hide md:mt-80"
          style={pearlPanelStyle}
        >
          <div className="mb-4 text-7xl leading-none" style={{ filter: 'drop-shadow(0 0 20px rgba(238,238,205,0.8))' }}>
            🦪
          </div>
          <h2 className="mb-2 text-4xl font-black text-slate-100">Østers med Perle!</h2>
          <p className="mb-1 text-slate-300">Du åbner østersskallen og finder en glinsende perle.</p>
          <p className="mb-6 text-xl font-bold text-cyan-200">Perlen ryger i din samling!</p>
          <button
            type="button"
            onClick={dismissPearl}
            className="w-full rounded-2xl border-b-4 border-slate-800 bg-slate-600 py-4 text-xl font-bold text-white hover:bg-slate-500"
          >
            💎 Læg i samlingen
          </button>
        </div>
      </div>
    );
  }

  /** Legacy ~12537–12545 */
  if (lastCatch.itemType === 'jellyfish') {
    function dismissJellyfish() {
      const inv = usePlayerStore.getState().inventory;
      const fishLost = inv.filter((f) => f.itemType !== 'plesiosaur').length;
      play('error');
      setStats((st) => ({ ...st, jellyfishCaught: (st.jellyfishCaught ?? 0) + 1 }));
      setInventory((prev) => prev.filter((f) => f.itemType === 'plesiosaur'));
      useBucketDropStore.getState().clearAllBucketVisuals();
      setToastMessage(
        `🪼 Brandmanden brændte dig! ${fishLost > 0 ? `${fishLost} fisk tabt fra spanden!` : 'Heldigvis var spanden tom!'}`,
      );
      setLastCatch(null);
      setGameState('idle');
    }

    const jellyfishPanelStyle = {
      borderColor: '#FF4500',
      background: 'rgba(30,5,0,0.97)',
    } as const;

    const jellyfishBody = (
      <>
        <div className="mb-3 animate-pulse text-5xl md:mb-4 md:text-7xl">🪼</div>
        <h2 className="mb-2 text-2xl font-black text-orange-300 md:text-4xl">Brandmand!</h2>
        <p className="mb-0 text-xs text-slate-300 md:mb-6 md:text-sm">
          Av! Du brænder dig på de giftige tentakler, og kommer til at vælte spanden!
        </p>
      </>
    );

    if (isMobileCatchPanel) {
      return (
        <div
          className={`${CATCH_OVERLAY_SHELL}${
            mobileLandscapeCatch ? ' !pt-0 !pb-[max(0.5rem,env(safe-area-inset-bottom))]' : ''
          }`}
        >
          <div
            className={
              mobileLandscapeCatch
                ? 'anim-zoom-in panel-dark pointer-events-auto relative mt-0 mb-0 flex w-full max-w-md flex-shrink-0 flex-col overflow-hidden rounded-3xl border-4 p-4 text-center shadow-2xl max-h-[min(85dvh,calc(100svh-max(0.5rem,env(safe-area-inset-top))-max(0.5rem,env(safe-area-inset-bottom))))]'
                : 'anim-zoom-in panel-dark pointer-events-auto relative mt-auto mb-[5.5rem] flex max-h-[min(92dvh,calc(100svh-max(0.75rem,env(safe-area-inset-top))-max(0.75rem,env(safe-area-inset-bottom))))] w-full max-w-md flex-col overflow-hidden rounded-3xl border-4 p-4 text-center shadow-2xl'
            }
            style={jellyfishPanelStyle}
          >
            <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">{jellyfishBody}</div>
              <button
                type="button"
                onClick={dismissJellyfish}
                className="mt-3 w-full flex-shrink-0 rounded-2xl border-b-4 border-red-950 bg-red-900 py-3 text-lg font-bold text-white hover:bg-red-800"
              >
                😬 Se skaden
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={CATCH_OVERLAY_SHELL}>
        <div
          className="anim-zoom-in panel-dark pointer-events-auto mt-auto mb-2 max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-3xl border-4 p-8 text-center shadow-2xl scrollbar-hide md:mt-80"
          style={jellyfishPanelStyle}
        >
          <div className="mb-4 animate-pulse text-7xl">🪼</div>
          <h2 className="mb-2 text-4xl font-black text-orange-300">Brandmand!</h2>
          <p className="mb-6 text-slate-300">
            Av! Du brænder dig på de giftige tentakler, og kommer til at vælte spanden!
          </p>
          <button
            type="button"
            onClick={dismissJellyfish}
            className="w-full rounded-2xl border-b-4 border-red-950 bg-red-900 py-4 text-xl font-bold text-white hover:bg-red-800"
          >
            😬 Se skaden
          </button>
        </div>
      </div>
    );
  }

  /** Legacy ~12372–12378 (flaskepost) */
  if (lastCatch.itemType === 'bottle') {
    function dismissBottle() {
      play('ui');
      setLastCatch(null);
      setGameState('idle');
    }
    const bottlePanelStyle = {
      borderColor: 'purple',
      background: 'rgba(20,15,10,0.97)',
    } as const;

    const bottleBody = <h2 className="text-2xl font-black text-white">{lastCatch.species}</h2>;

    if (isMobileCatchPanel) {
      return (
        <div
          className={`${CATCH_OVERLAY_SHELL}${
            mobileLandscapeCatch ? ' !pt-0 !pb-[max(0.5rem,env(safe-area-inset-bottom))]' : ''
          }`}
        >
          <div
            className={
              mobileLandscapeCatch
                ? 'anim-zoom-in panel-dark pointer-events-auto relative mt-0 mb-0 flex w-full max-w-md flex-shrink-0 flex-col overflow-hidden rounded-3xl border-4 p-4 text-center shadow-2xl max-h-[min(85dvh,calc(100svh-max(0.5rem,env(safe-area-inset-top))-max(0.5rem,env(safe-area-inset-bottom))))]'
                : 'anim-zoom-in panel-dark pointer-events-auto relative mt-auto mb-[5.5rem] flex max-h-[min(92dvh,calc(100svh-max(0.75rem,env(safe-area-inset-top))-max(0.75rem,env(safe-area-inset-bottom))))] w-full max-w-md flex-col overflow-hidden rounded-3xl border-4 p-4 text-center shadow-2xl'
            }
            style={bottlePanelStyle}
          >
            <div
              className="pointer-events-none absolute inset-0 rounded-3xl"
              style={{
                background: 'radial-gradient(ellipse at top, rgba(168,85,247,0.12), transparent 68%)',
              }}
            />
            <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">{bottleBody}</div>
              <button
                type="button"
                onClick={dismissBottle}
                className="mt-3 w-full flex-shrink-0 rounded-2xl border-b-4 border-slate-800 bg-slate-600 py-3 text-lg font-bold text-white shadow-xl transition hover:bg-slate-500"
              >
                Fortsæt
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={CATCH_OVERLAY_SHELL}>
        <div
          className="anim-zoom-in panel-dark pointer-events-auto relative mt-auto mb-2 max-h-[85dvh] w-full max-w-md overflow-y-auto overflow-x-hidden rounded-3xl border-4 p-8 text-center shadow-2xl scrollbar-hide md:mt-80"
          style={bottlePanelStyle}
        >
          <div
            className="pointer-events-none absolute inset-0 rounded-3xl"
            style={{
              background: 'radial-gradient(ellipse at top, rgba(168,85,247,0.12), transparent 68%)',
            }}
          />
          <div className="relative z-10">
            <h2 className="mb-3 text-4xl font-black text-white">{lastCatch.species}</h2>
            <button
              type="button"
              onClick={dismissBottle}
              className="mt-4 w-full rounded-2xl border-b-4 border-slate-800 bg-slate-600 py-4 text-xl font-bold text-white hover:bg-slate-500"
            >
              Fortsæt
            </button>
          </div>
        </div>
      </div>
    );
  }

  /** Plesiosaurus — som legacy-toast + NPC-modal (grøn), 3D-skala i `displayScaleForCatch`. */
  if (lastCatch.itemType === 'plesiosaur') {
    const plesioXp =
      xpForCatch(lastCatch) + (upgrades.includes('luxury_boat') ? 15 : 0);
    function dismissPlesio() {
      play('ui');
      setLastCatch(null);
      setGameState('idle');
    }
    const plesioPanelStyle = {
      borderColor: '#2d6a4f',
      background: 'rgba(5,22,14,0.98)',
      boxShadow: '0 0 48px rgba(45,106,79,0.35)',
    } as const;

    const plesioBody = (
      <>
        <div
          className="mb-2 text-5xl md:mb-3 md:text-7xl"
          style={{ filter: 'drop-shadow(0 0 18px rgba(34,197,94,0.45))' }}
        >
          🦕
        </div>
        <div
          className="mb-2 inline-flex items-center rounded-full px-3 py-1 text-[0.65rem] font-black uppercase tracking-widest md:mb-3 md:px-4 md:text-xs"
          style={{ background: 'rgba(22,101,52,0.9)', color: '#86efac' }}
        >
          Forhistorisk fanget
        </div>
        <h2 className="mb-2 text-2xl font-black text-emerald-100 md:text-4xl">{lastCatch.species}</h2>
        <p className="mb-2 text-xs leading-relaxed text-slate-300 md:text-sm">
          Mystisk madding er brugt op. Den forhistoriske jæger ligger i spanden — mød den ved den gamle
          mole, når du vil videre mod Jungleøen.
        </p>
        <p className="text-base font-bold text-emerald-300 md:text-lg">+{plesioXp} XP</p>
      </>
    );

    if (isMobileCatchPanel) {
      return (
        <div
          className={`${CATCH_OVERLAY_SHELL}${
            mobileLandscapeCatch ? ' !pt-0 !pb-[max(0.5rem,env(safe-area-inset-bottom))]' : ''
          }`}
        >
          <div
            className={
              mobileLandscapeCatch
                ? 'anim-zoom-in panel-dark pointer-events-auto relative mt-0 mb-0 flex w-full max-w-md flex-shrink-0 flex-col overflow-hidden rounded-3xl border-4 p-4 text-center shadow-2xl max-h-[min(85dvh,calc(100svh-max(0.5rem,env(safe-area-inset-top))-max(0.5rem,env(safe-area-inset-bottom))))]'
                : 'anim-zoom-in panel-dark pointer-events-auto relative mt-auto mb-[5.5rem] flex max-h-[min(92dvh,calc(100svh-max(0.75rem,env(safe-area-inset-top))-max(0.75rem,env(safe-area-inset-bottom))))] w-full max-w-md flex-col overflow-hidden rounded-3xl border-4 p-4 text-center shadow-2xl'
            }
            style={plesioPanelStyle}
          >
            <div
              className="pointer-events-none absolute inset-0 rounded-3xl"
              style={{
                background: 'radial-gradient(ellipse at top, rgba(34,197,94,0.14), transparent 68%)',
              }}
            />
            <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">{plesioBody}</div>
              <button
                type="button"
                onClick={dismissPlesio}
                className="mt-3 w-full flex-shrink-0 rounded-2xl border-b-4 py-3 text-lg font-bold text-white shadow-xl transition hover:brightness-110"
                style={{
                  background: 'linear-gradient(135deg, #166534, #22c55e)',
                  borderColor: '#14532d',
                }}
              >
                Fortsæt
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={CATCH_OVERLAY_SHELL}>
        <div
          className="anim-zoom-in panel-dark pointer-events-auto relative mt-auto mb-2 max-h-[85dvh] w-full max-w-md overflow-y-auto overflow-x-hidden rounded-3xl border-4 p-8 text-center shadow-2xl scrollbar-hide md:mt-80"
          style={plesioPanelStyle}
        >
          <div
            className="pointer-events-none absolute inset-0 rounded-3xl"
            style={{
              background: 'radial-gradient(ellipse at top, rgba(34,197,94,0.14), transparent 68%)',
            }}
          />
          <div className="relative z-10">
            <div className="mb-3 text-7xl" style={{ filter: 'drop-shadow(0 0 18px rgba(34,197,94,0.45))' }}>
              🦕
            </div>
            <div
              className="mb-3 inline-flex items-center rounded-full px-4 py-1 text-xs font-black uppercase tracking-widest"
              style={{ background: 'rgba(22,101,52,0.9)', color: '#86efac' }}
            >
              Forhistorisk fanget
            </div>
            <h2 className="mb-2 text-4xl font-black text-emerald-100">{lastCatch.species}</h2>
            <p className="mb-2 text-sm leading-relaxed text-slate-300">
              Mystisk madding er brugt op. Den forhistoriske jæger ligger i spanden — mød den ved den gamle
              mole, når du vil videre mod Jungleøen.
            </p>
            <p className="mb-6 text-lg font-bold text-emerald-300">+{plesioXp} XP</p>
            <button
              type="button"
              onClick={dismissPlesio}
              className="w-full rounded-2xl border-b-4 py-4 text-xl font-bold text-white shadow-xl transition hover:brightness-110"
              style={{
                background: 'linear-gradient(135deg, #166534, #22c55e)',
                borderColor: '#14532d',
              }}
            >
              Fortsæt
            </button>
          </div>
        </div>
      </div>
    );
  }

  /** Legacy ~12491–12498 */
  if (lastCatch.itemType === 'conch') {
    const conchId = lastCatch.id;
    function dismissConch() {
      play('ui');
      setInventory((prev) => prev.filter((f) => f.id !== conchId));
      setToastMessage(`🐚 Konkylie lagt i samlingen! (${collectibleInventory.conchCount} i alt)`);
      setLastCatch(null);
      setGameState('idle');
    }
    const conchCatchPanelStyle = {
      borderColor: '#f4a460',
      background: 'rgba(20,12,5,0.97)',
    } as const;

    const conchBody = (
      <>
        <div className="mb-3 text-5xl md:mb-4 md:text-7xl">🐚</div>
        <h2 className="mb-2 text-2xl font-black text-amber-300 md:text-4xl">Konkylie!</h2>
        <p className="text-xs text-slate-400 md:text-base">
          En smuk konkylie. Du har nu {collectibleInventory.conchCount} i din samling.
        </p>
      </>
    );

    if (isMobileCatchPanel) {
      return (
        <div
          className={`${CATCH_OVERLAY_SHELL}${
            mobileLandscapeCatch ? ' !pt-0 !pb-[max(0.5rem,env(safe-area-inset-bottom))]' : ''
          }`}
        >
          <div
            className={
              mobileLandscapeCatch
                ? 'anim-zoom-in panel-dark pointer-events-auto relative mt-0 mb-0 flex w-full max-w-md flex-shrink-0 flex-col overflow-hidden rounded-3xl border-4 p-4 text-center shadow-2xl max-h-[min(85dvh,calc(100svh-max(0.5rem,env(safe-area-inset-top))-max(0.5rem,env(safe-area-inset-bottom))))]'
                : 'anim-zoom-in panel-dark pointer-events-auto relative mt-auto mb-[5.5rem] flex max-h-[min(92dvh,calc(100svh-max(0.75rem,env(safe-area-inset-top))-max(0.75rem,env(safe-area-inset-bottom))))] w-full max-w-md flex-col overflow-hidden rounded-3xl border-4 p-4 text-center shadow-2xl'
            }
            style={conchCatchPanelStyle}
          >
            <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">{conchBody}</div>
              <button
                type="button"
                onClick={dismissConch}
                className="mt-3 w-full flex-shrink-0 rounded-2xl border-b-4 border-amber-900 bg-amber-700 py-3 text-lg font-bold text-white hover:bg-amber-600"
              >
                Læg i samlingen 🐚
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={CATCH_OVERLAY_SHELL}>
        <div
          className="anim-zoom-in panel-dark pointer-events-auto relative mt-auto mb-2 max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-3xl border-4 p-8 text-center shadow-2xl scrollbar-hide md:mt-80"
          style={conchCatchPanelStyle}
        >
          <div className="mb-4 text-7xl">🐚</div>
          <h2 className="mb-2 text-4xl font-black text-amber-300">Konkylie!</h2>
          <p className="mb-6 text-slate-400">
            En smuk konkylie. Du har nu {collectibleInventory.conchCount} i din samling.
          </p>
          <button
            type="button"
            onClick={dismissConch}
            className="w-full rounded-2xl border-b-4 border-amber-900 bg-amber-700 py-4 text-xl font-bold text-white hover:bg-amber-600"
          >
            Læg i samlingen 🐚
          </button>
        </div>
      </div>
    );
  }

  if (
    lastCatch.itemType === 'treasure' &&
    lastCatch.fishModelId &&
    isSunketChestFishId(lastCatch.fishModelId)
  ) {
    return <SunketChestCatchPanel lastCatch={lastCatch} />;
  }

  const xpEarned = xpForCatch(lastCatch) + (upgrades.includes('luxury_boat') ? 15 : 0);
  const streakBonusShown = getFinalStreakBonus(currentStreak, zenMode, lastCatch.value);

  const upgradeBadges: { icon: string; text: string; color: string }[] = [];
  if (upgrades.includes('heldig_firkloever'))
    upgradeBadges.push({ icon: '🍀', text: '+8 Held', color: '#4ade80' });
  if (upgrades.includes('pirate_hat')) upgradeBadges.push({ icon: '🏴‍☠️', text: '+5 Held', color: '#fbbf24' });
  if (upgrades.includes('golden_hook')) upgradeBadges.push({ icon: '🪝', text: '+15 Rigdom', color: '#fde047' });
  if (upgrades.includes('luxury_boat')) upgradeBadges.push({ icon: '⛵', text: '+15 Erfaring', color: '#a78bfa' });
  if (Date.now() < conchBaitExpiry) upgradeBadges.push({ icon: '🍯', text: '+6 Held', color: '#f9a8d4' });
  if (Date.now() < hajBloodExpiry) upgradeBadges.push({ icon: '🩸', text: '+15 Held', color: '#fca5a5' });
  if (Date.now() < flyBaitExpiry) upgradeBadges.push({ icon: '🪰', text: '+12 Held', color: '#a3e635' });
  if (Date.now() < perleLimExpiry) upgradeBadges.push({ icon: '🦪', text: '+15 Held', color: '#c4b5fd' });

  function keepFish() {
    const caught = lastCatch;
    play('ui');
    if (caught && shouldAnimateFishToBucket(caught)) {
      useBucketDropStore.getState().enqueue(caught);
    }
    setLastCatch(null);
    setGameState('idle');
  }

  const badge = fangetBadgeForCatch(lastCatch);
  const gradTop = catchPanelGradTop(lastCatch);

  return (
    <div
      className={`${CATCH_OVERLAY_SHELL}${
        mobileLandscapeCatch
          ? ' !pt-0 !pb-[max(0.5rem,env(safe-area-inset-bottom))]'
          : ''
      }`}
    >
      <div
        className={
          isMobileCatchPanel
            ? mobileLandscapeCatch
              ? 'anim-zoom-in panel-black pointer-events-auto relative mt-0 mb-0 flex w-full max-w-md flex-shrink-0 flex-col overflow-hidden rounded-3xl border border-white/10 p-4 text-center shadow-2xl max-h-[min(85dvh,calc(100svh-max(0.5rem,env(safe-area-inset-top))-max(0.5rem,env(safe-area-inset-bottom))))]'
              : 'anim-zoom-in panel-black pointer-events-auto relative mt-auto mb-[5.5rem] flex max-h-[min(92dvh,calc(100svh-max(0.75rem,env(safe-area-inset-top))-max(0.75rem,env(safe-area-inset-bottom))))] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-white/10 p-4 text-center shadow-2xl'
            : 'anim-zoom-in panel-black pointer-events-auto relative mt-auto mb-2 w-full max-w-md overflow-hidden rounded-3xl border border-white/10 p-8 text-center shadow-2xl md:mt-80'
        }
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-3xl opacity-20"
          style={{
            background: `linear-gradient(to bottom, ${gradTop}, transparent)`,
          }}
        />
        {!isMobileCatchPanel && (
          <>
            <div className="pointer-events-none absolute top-3 left-3 z-20 max-w-[44%]">
              <div
                className={`inline-flex max-w-full items-center gap-1 rounded-full px-3 py-1 font-black uppercase tracking-wider shadow-sm -rotate-1 text-xs ${badge.className}`}
              >
                {badge.label}
              </div>
            </div>
            {currentStreak > 0 && lastCatch.value > 0 && (
              <div className="pointer-events-none absolute top-3 right-3 z-20 max-w-[min(55%,16rem)]">
                <div
                  className={`ml-auto inline-flex max-w-full items-center gap-1.5 rounded-2xl border px-3 py-1.5 font-black text-xs shadow-lg ${
                    currentStreak >= 5
                      ? 'anim-fire border-yellow-400 bg-orange-600/80 text-yellow-100'
                      : 'border-slate-500 bg-slate-700/80 text-slate-300'
                  }`}
                >
                  <span className="flex-shrink-0">{currentStreak >= 5 ? '🔥' : '⚡'}</span>
                  <span className="min-w-0 text-left">
                    {currentStreak >= 5
                      ? `Perfekt streak: +${streakBonusShown} Rigdom`
                      : `Streak: ${currentStreak}`}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
        <div
          className={
            isMobileCatchPanel
              ? 'relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden'
              : 'relative z-10'
          }
        >
          <div
            className={
              isMobileCatchPanel
                ? 'min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide'
                : undefined
            }
          >
            {isMobileCatchPanel && (
              <div className="mb-2 flex justify-center">
                <div
                  className={`inline-flex max-w-full items-center gap-1 rounded-full px-3 py-1 font-black uppercase tracking-wider shadow-sm text-[0.65rem] ${badge.className}`}
                >
                  {badge.label}
                </div>
              </div>
            )}
            <h2
              className={`min-w-0 max-w-full break-words font-black leading-tight ${isMobileCatchPanel ? 'mb-2 text-3xl' : 'mb-2 pt-11 text-5xl'} ${rarityTextClass(lastCatch)}`}
            >
              {lastCatch.species}
            </h2>
            <div
              className={`grid grid-cols-2 ${isMobileCatchPanel ? 'my-4 gap-2' : 'my-8 gap-4'}`}
            >
              <div
                className={`rounded-2xl border border-white/5 ${isMobileCatchPanel ? 'p-3' : 'p-4'}`}
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <span
                  className={`mb-0.5 block font-bold text-slate-400 uppercase ${isMobileCatchPanel ? 'text-[0.65rem]' : 'mb-1 text-xs'}`}
                >
                  Vægt
                </span>
                <span
                  className={`font-mono font-bold text-white ${isMobileCatchPanel ? 'text-lg' : 'text-2xl'}`}
                >
                  {lastCatch.weight} kg
                </span>
              </div>
              <div
                className={`rounded-2xl border border-white/5 ${isMobileCatchPanel ? 'p-3' : 'p-4'}`}
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <span
                  className={`mb-0.5 block font-bold text-slate-400 uppercase ${isMobileCatchPanel ? 'text-[0.65rem]' : 'mb-1 text-xs'}`}
                >
                  Værdi
                </span>
                <span
                  className={`font-mono font-bold ${lastCatch.value > 0 ? 'text-yellow-400' : 'text-red-400'} ${isMobileCatchPanel ? 'text-lg' : 'text-2xl'}`}
                >
                  {lastCatch.value} kr
                </span>
              </div>
              <div
                className={`rounded-2xl border border-white/5 ${isMobileCatchPanel ? 'p-3' : 'p-4'}`}
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <span
                  className={`mb-0.5 block font-bold text-slate-400 uppercase ${isMobileCatchPanel ? 'text-[0.65rem]' : 'mb-1 text-xs'}`}
                >
                  Bonus
                </span>
                <div
                  className={`flex flex-wrap content-center justify-center gap-1 ${isMobileCatchPanel ? 'min-h-[1.5rem]' : 'min-h-[2.25rem]'}`}
                >
                  {upgradeBadges.length > 0 ? (
                    upgradeBadges.map((b, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-0.5 rounded-full border font-bold leading-none"
                        style={{
                          padding: isMobileCatchPanel ? '0.15rem 0.4rem' : '0.2rem 0.55rem',
                          fontSize: isMobileCatchPanel ? '0.6rem' : '0.7rem',
                          background: 'rgba(0,0,0,0.35)',
                          borderColor: `${b.color}44`,
                          color: b.color,
                        }}
                      >
                        {b.icon} {b.text}
                      </span>
                    ))
                  ) : (
                    <span
                      className={`text-slate-500 ${isMobileCatchPanel ? 'text-[0.7rem]' : 'text-sm'}`}
                    >
                      Ingen
                    </span>
                  )}
                </div>
              </div>
              <div
                className={`rounded-2xl border border-white/5 ${isMobileCatchPanel ? 'p-3' : 'p-4'}`}
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <span
                  className={`mb-0.5 block font-bold text-slate-400 uppercase ${isMobileCatchPanel ? 'text-[0.65rem]' : 'mb-1 text-xs'}`}
                >
                  XP
                </span>
                {isMobileCatchPanel ? (
                  <span className="flex items-baseline justify-center gap-1 font-mono text-lg font-bold text-emerald-400">
                    <span aria-hidden>⭐</span>
                    <span>+{xpEarned}</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5 font-mono text-2xl font-bold text-emerald-400">
                    <span aria-hidden>⭐</span>
                    <span>+{xpEarned}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={keepFish}
            className={`w-full rounded-2xl border-b-4 font-bold shadow-xl transition-all hover:scale-105 active:scale-95 active:border-b-0 ${
              isMobileCatchPanel ? 'mt-3 flex-shrink-0 py-3 text-lg' : 'py-4 text-xl'
            } ${
              lastCatch.itemType === 'junk'
                ? 'border-stone-800 bg-stone-600 text-white hover:bg-stone-500'
                : 'border-sky-800 bg-sky-600 text-white hover:bg-sky-500'
            }`}
          >
            {lastCatch.itemType === 'junk' ? 'Smid i spanden' : 'Læg i Spanden'}
          </button>
        </div>
      </div>
    </div>
  );
}
