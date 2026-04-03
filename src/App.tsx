import { ChestMenu } from './components/chest/ChestMenu';
import { CatchResult } from './components/fishing/CatchResult';
import { LostFightModal } from './components/fishing/LostFightModal';
import { FishingControls } from './components/fishing/FishingControls';
import { MathChallenge } from './components/fishing/MathChallenge';
import { DayNightToast } from './components/common/DayNightToast';
import { Toast } from './components/common/Toast';
import { GameCornerUI } from './components/hud/GameCornerUI';
import { MobileHUD } from './components/hud/MobileHUD';
import { HUD } from './components/hud/HUD';
import { TropicalCaveSign } from './components/hud/TropicalCaveSign';
import { PierCabinHint } from './components/hud/PierCabinHint';
import { HeartBalloonOverlay } from './components/hud/HeartBalloonOverlay';
import { CabinFirstVisitModal } from './components/modals/CabinFirstVisitModal';
import { CollectibleModal } from './components/modals/CollectibleModal';
import { RatModal } from './components/modals/RatModal';
import { ContactModal } from './components/modals/ContactModal';
import { LevelUpOverlay } from './components/modals/LevelUpOverlay';
import { AboutGameModal } from './components/modals/AboutGameModal';
import { CreditsOverlay } from './components/modals/CreditsOverlay';
import { ResetConfirm } from './components/modals/ResetConfirm';
import { SettingsMenuModal } from './components/modals/SettingsMenuModal';
import { TravelNavModal } from './components/modals/TravelNavModal';
import { WishModal } from './components/modals/WishModal';
import { GoalsScreen } from './components/screens/GoalsScreen';
import { MathSettingsScreen } from './components/screens/MathSettingsScreen';
import { ScreenSettings } from './components/screens/ScreenSettings';
import { ShopScreen } from './components/screens/ShopScreen';
import { StartScreen } from './components/screens/StartScreen';
import { EggInspectModal } from './components/modals/EggInspectModal';
import { WildTurtleModal } from './components/modals/WildTurtleModal';
import { ParrotModal } from './components/modals/ParrotModal';
import { PlesioNpcModal } from './components/modals/PlesioNpcModal';
import { JunglePlesioNpcModal } from './components/modals/JunglePlesioNpcModal';
import { JunglePirateWelcomeModal } from './components/modals/JunglePirateWelcomeModal';
import { MapRevealModal } from './components/modals/MapRevealModal';
import { lazy, Suspense, useEffect } from 'react';
import { GoalProgressSync } from './components/sync/GoalProgressSync';
import { CabinRoomTravelFade } from './components/effects/CabinRoomTravelFade';
import { LightningOverlay } from './components/effects/LightningOverlay';
import { useEscapePriorityHandler } from './hooks/useEscapePriorityHandler';
import { useScreenSettingsEffects } from './hooks/useScreenSettingsEffects';
import { useWeatherEngine } from './hooks/useWeatherEngine';
import { TurtleEggEffects } from './hooks/useTurtleEggTimer';
import { useFishingStore } from './store/useFishingStore';
import { useEditorStore } from './store/useEditorStore';
import { useGameStore } from './store/useGameStore';
import { useMathStore } from './store/useMathStore';
import { useSaveStore } from './store/useSaveStore';
import { useUIStore } from './store/useUIStore';
import { BagButton } from './components/mobile/BagButton';
import { MobileBag } from './components/mobile/MobileBag';
import { GameCanvas } from './three/GameCanvas';
import { CabinFurnitureBar } from './components/hud/CabinFurnitureBar';
import { AquariumGameOverlay } from './three/cabin/AquariumGameOverlay';

const FishEditorPanelLazy = import.meta.env.DEV
  ? lazy(() =>
      import('./components/editor/FishEditorPanel.js').then((m) => ({ default: m.FishEditorPanel })),
    )
  : null;

const AdminPanelLazy = import.meta.env.DEV
  ? lazy(() =>
      import('./components/admin/AdminPanel.js').then((m) => ({ default: m.AdminPanel })),
    )
  : null;

function ModalLayer() {
  const gameState = useGameStore((s) => s.gameState);
  const showMathSettings = useMathStore((s) => s.showMathSettings);
  const showScreenSettings = useUIStore((s) => s.showScreenSettings);
  const setShowScreenSettings = useUIStore((s) => s.setShowScreenSettings);
  const streakMilestoneToast = useFishingStore((s) => s.streakMilestoneToast);

  return (
    <>
      {gameState === 'shop' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <ShopScreen />
        </div>
      )}
      {gameState === 'goals' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <GoalsScreen />
        </div>
      )}
      {showMathSettings && <MathSettingsScreen />}
      {showScreenSettings && (
        <div
          className="absolute inset-0 z-[99999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-[10px]"
          style={{ WebkitBackdropFilter: 'blur(10px)' }}
          onClick={() => setShowScreenSettings(false)}
          onKeyDown={(e) => e.key === 'Escape' && setShowScreenSettings(false)}
          role="presentation"
        >
          <ScreenSettings />
        </div>
      )}
      <ChestMenu />
      <TravelNavModal />
      <ContactModal />
      <CollectibleModal />
      <RatModal />
      <ResetConfirm />
      <SettingsMenuModal />
      <CreditsOverlay />
      <AboutGameModal />
      <WishModal />
      <LostFightModal />
      <EggInspectModal />
      <WildTurtleModal />
      <ParrotModal />
      <PlesioNpcModal />
      <JunglePlesioNpcModal />
      <JunglePirateWelcomeModal />
      <MapRevealModal />
      <CatchResult />
      <CabinFirstVisitModal />
      <LevelUpOverlay />
      {streakMilestoneToast && (
        <div
          className="pointer-events-none fixed top-[26%] right-0 left-0 z-50 flex justify-center"
          style={{ animation: 'levelUpBurst 2.8s ease-out forwards' }}
        >
          <div
            className="anim-fire rounded-3xl px-8 py-4 text-center shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(234,88,12,0.95), rgba(220,38,38,0.95))',
              border: '2px solid #fde047',
            }}
          >
            <div
              className="font-black text-yellow-200"
              style={{ fontSize: 'clamp(1.35rem, 4.2vw, 1.9rem)', textShadow: '0 0 12px rgba(250,204,21,0.8)' }}
            >
              {streakMilestoneToast}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  useEscapePriorityHandler();
  useScreenSettingsEffects();
  useWeatherEngine();
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
        e.preventDefault();
        void import('./store/useEditorStore.js').then(({ useEditorStore }) => {
          useEditorStore.getState().toggle();
        });
      }
      if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        void import('./store/useAdminStore.js').then(({ useAdminStore }) => {
          useAdminStore.getState().toggle();
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  const hydrated = useSaveStore((s) => s.hydrated);
  const lastLoaded = useSaveStore((s) => s.lastLoaded);
  useEffect(() => {
    if (!hydrated) return;
    if (lastLoaded !== null) return;
    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mqMotion.matches) useUIStore.getState().setReducedMotion(true);
    const mqContrast = window.matchMedia('(prefers-contrast: more)');
    if (mqContrast.matches) useUIStore.getState().setHighContrast(true);
  }, [hydrated, lastLoaded]);

  const hasStarted = useUIStore((s) => s.hasStarted);
  const showScreenSettings = useUIStore((s) => s.showScreenSettings);
  const setShowScreenSettings = useUIStore((s) => s.setShowScreenSettings);
  const fishEditorOpen = import.meta.env.DEV ? useEditorStore((s) => s.isOpen) : false;
  const currentLocation = useGameStore((s) => s.currentLocation);
  if (!hasStarted) {
    return (
      <div className="game-root">
        <StartScreen />
        {showScreenSettings && (
          <div
            className="absolute inset-0 z-[99999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-[10px]"
            style={{ WebkitBackdropFilter: 'blur(10px)' }}
            onClick={() => setShowScreenSettings(false)}
            onKeyDown={(e) => e.key === 'Escape' && setShowScreenSettings(false)}
            role="presentation"
          >
            <ScreenSettings />
          </div>
        )}
        <ContactModal />
        <Toast />
        <SettingsMenuModal />
        <CreditsOverlay />
        <AboutGameModal />
      </div>
    );
  }

  return (
    <div className="game-root text-white">
      <LightningOverlay />
      <CabinRoomTravelFade />
      <GoalProgressSync />
      <TurtleEggEffects />
      <GameCanvas />
      <HUD />
      <MobileHUD />
      <GameCornerUI />
      <BagButton />
      <MobileBag />
      <PierCabinHint />
      <HeartBalloonOverlay />
      <CabinFurnitureBar />
      {currentLocation === 'cabin_living' && <AquariumGameOverlay />}
      {/* Legacy idle/fiske-UI: fuld højde, justify-center + mt-32 på kast-knap (legacy-game.html ~11765–11962). */}
      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center">
        {!fishEditorOpen && (
          <>
            <div className="pointer-events-auto mt-32 flex flex-col items-center gap-2">
              <FishingControls />
            </div>
            <TropicalCaveSign />
          </>
        )}
      </div>
      <DayNightToast />
      <div
        className="pointer-events-none absolute right-0 bottom-0 left-0 z-20"
        style={{
          paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div className="pointer-events-auto flex flex-col items-center gap-3 pt-2">
          <MathChallenge />
        </div>
      </div>
      <ModalLayer />
      {import.meta.env.DEV && FishEditorPanelLazy ? (
        <Suspense fallback={null}>
          <FishEditorPanelLazy />
        </Suspense>
      ) : null}
      {import.meta.env.DEV && AdminPanelLazy ? (
        <Suspense fallback={null}>
          <AdminPanelLazy />
        </Suspense>
      ) : null}
      <Toast />
    </div>
  );
}
