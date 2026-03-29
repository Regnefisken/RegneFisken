import type { RollCatchResult } from '../../types/fish.js';
import { CUTE_FISH_CONFIG } from '../../data/fish.js';
import { Brandmand } from './Brandmand.js';
import { CuteFishModel } from './CuteFishModel.js';
import { FishModel } from './FishModel.js';
import { GoldenFrog } from './GoldenFrog.js';
import { Kraken } from './Kraken.js';
import { Soeuhyre } from './Soeuhyre.js';
import { Spirit } from './Spirit.js';
import { resolveCuteFishId } from './resolveCatchModelId.js';
import {
  CabinKeyModel,
  CrystalJunkModel,
  JunkCatchModel,
  TreasureChestModel,
} from './junkAndTreasureModels.js';
import {
  AxolotlCatchModel,
  GnavneGormCatchModel,
  PlesiosaurusCatchModel,
} from './bossCatchMiniModels.js';

/** 3D-model for krog/spand — `bucketIdle` dæmper svømme-animation i spanden (som legacy). */
export function HookedCatchModel({
  fish,
  bucketIdle,
}: {
  fish: RollCatchResult;
  bucketIdle?: boolean;
}) {
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
    case 'junk':
      return <JunkCatchModel fish={fish} bucketIdle={bucketIdle} />;
    case 'treasure':
      return <TreasureChestModel />;
    case 'crystal_junk':
      return <CrystalJunkModel bucketIdle={bucketIdle} />;
    case 'cabin_key':
      return <CabinKeyModel bucketIdle={bucketIdle} />;
    case 'plesiosaur':
      return <PlesiosaurusCatchModel bucketIdle={bucketIdle} />;
    case 'axolotl':
      return <AxolotlCatchModel bucketIdle={bucketIdle} />;
    case 'gnavne_gorm':
      return <GnavneGormCatchModel bucketIdle={bucketIdle} />;
    case 'pearl':
      return (
        <mesh castShadow scale={0.42}>
          <sphereGeometry args={[0.35, 24, 24]} />
          <meshStandardMaterial
            color={fish.color}
            metalness={0.65}
            roughness={0.18}
          />
        </mesh>
      );
    default: {
      const modelId = resolveCuteFishId(fish);
      const cfg = modelId ? CUTE_FISH_CONFIG[modelId] : undefined;
      if (cfg && modelId) {
        return (
          <CuteFishModel
            config={cfg}
            fishModelId={modelId}
            instanceId={fish.id}
            rollColor={fish.color}
            bucketIdle={bucketIdle}
          />
        );
      }
      return <FishModel color={fish.color} bucketIdle={bucketIdle} />;
    }
  }
}
