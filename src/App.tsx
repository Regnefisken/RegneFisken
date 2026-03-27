import { ChestMenu } from './components/chest/ChestMenu';
import { CatchResult } from './components/fishing/CatchResult';
import { FishingControls } from './components/fishing/FishingControls';
import { MathChallenge } from './components/fishing/MathChallenge';
import { Toast } from './components/common/Toast';
import { HUD } from './components/hud/HUD';
import { CollectibleModal } from './components/modals/CollectibleModal';
import { ContactModal } from './components/modals/ContactModal';
import { GoalNotification } from './components/modals/GoalNotification';
import { LevelUpOverlay } from './components/modals/LevelUpOverlay';
import { ResetConfirm } from './components/modals/ResetConfirm';
import { WishModal } from './components/modals/WishModal';
import { GoalsScreen } from './components/screens/GoalsScreen';
import { JournalScreen } from './components/screens/JournalScreen';
import { MathSettingsScreen } from './components/screens/MathSettingsScreen';
import { ScreenSettings } from './components/screens/ScreenSettings';
import { ShopScreen } from './components/screens/ShopScreen';
import { StartScreen } from './components/screens/StartScreen';
import { GoalProgressSync } from './components/sync/GoalProgressSync';
import { useFishingStore } from './store/useFishingStore';
import { useGameStore } from './store/useGameStore';
import { useMathStore } from './store/useMathStore';
import { useUIStore } from './store/useUIStore';
import { GameCanvas } from './three/GameCanvas';

function ModalLayer() {
  const gameState = useGameStore((s) => s.gameState);
  const showMathSettings = useMathStore((s) => s.showMathSettings);
  const showScreenSettings = useUIStore((s) => s.showScreenSettings);
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
      {gameState === 'journal' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <JournalScreen />
        </div>
      )}
      {showMathSettings && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <MathSettingsScreen />
        </div>
      )}
      {showScreenSettings && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <ScreenSettings />
        </div>
      )}
      <ChestMenu />
      <ContactModal />
      <CollectibleModal />
      <ResetConfirm />
      <WishModal />
      <CatchResult />
      <LevelUpOverlay />
      {streakMilestoneToast && (
        <div
          className="pointer-events-none fixed top-[18%] right-0 left-0 z-50 flex justify-center"
          style={{ animation: 'levelUpBurst 2.8s ease-out forwards' }}
        >
          <div
            className="anim-fire rounded-3xl px-8 py-4 text-center shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(234,88,12,0.95), rgba(220,38,38,0.95))',
              border: '2px solid #fde047',
            }}
          >
            <div className="text-3xl font-black text-yellow-200">{streakMilestoneToast}</div>
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  const hasStarted = useUIStore((s) => s.hasStarted);
  const fontSize = useUIStore((s) => s.fontSize);
  if (!hasStarted) {
    return (
      <div className="game-root">
        <StartScreen />
        <ContactModal />
        <Toast />
      </div>
    );
  }

  return (
    <div
      className="game-root text-white"
      style={{
        fontSize: `${fontSize}%`,
      }}
    >
      <GoalProgressSync />
      <GameCanvas />
      <HUD />
      <div
        className="pointer-events-none absolute right-0 bottom-0 left-0 z-20 flex flex-col items-center gap-3"
        style={{
          paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div className="pointer-events-auto flex flex-col items-center gap-2">
          <FishingControls />
          <MathChallenge />
        </div>
        <div className="pointer-events-none flex w-full max-w-sm justify-center px-4">
          <GoalNotification />
        </div>
      </div>
      <ModalLayer />
      <Toast />
    </div>
  );
}
