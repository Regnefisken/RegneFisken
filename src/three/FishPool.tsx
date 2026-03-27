import type { RollCatchResult } from '../types/fish.js';
import { useGameStore } from '../store/useGameStore.js';
import { useFishingStore } from '../store/useFishingStore.js';
import { FishModel } from './models/FishModel.js';
import { Brandmand } from './models/Brandmand.js';
import { Kraken } from './models/Kraken.js';
import { Soeuhyre } from './models/Soeuhyre.js';
import { Spirit } from './models/Spirit.js';
import { GoldenFrog } from './models/GoldenFrog.js';

/** Vises når der er bid / kamp / fangst — model valgt ud fra `itemType`. */
export function FishPool() {
  const gameState = useGameStore((s) => s.gameState);
  const hookedFish = useFishingStore((s) => s.hookedFish);

  const show =
    (gameState === 'fighting' || gameState === 'catch') && hookedFish !== null;

  if (!show || !hookedFish) return null;

  return (
    <group position={[0, 3.2, -0.5]}>
      <HookedCatchModel fish={hookedFish} />
    </group>
  );
}

function HookedCatchModel({ fish }: { fish: RollCatchResult }) {
  switch (fish.itemType) {
    case 'jellyfish':
      return <Brandmand />;
    case 'kraken':
      return <Kraken catchMode />;
    case 'soeuhyre':
      return <Soeuhyre catchMode />;
    case 'halibut':
      return <Spirit />;
    case 'golden_frog':
      return <GoldenFrog />;
    default:
      return <FishModel color={fish.color} />;
  }
}
