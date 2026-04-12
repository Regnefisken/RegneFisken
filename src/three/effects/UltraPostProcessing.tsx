import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { isCabinLocation } from '../../logic/location-helpers.js';
import { useGameStore } from '../../store/useGameStore.js';
import { useUIStore } from '../../store/useUIStore.js';

/** Subtil bloom kun på Ultra — sol/glanz uden at male hele scenen. */
export function UltraPostProcessing() {
  const quality = useUIStore((s) => s.graphicsQuality);
  const ultraBloomEnabled = useUIStore((s) => s.ultraBloomEnabled);
  const locationId = useGameStore((s) => s.currentLocation);
  if (quality !== 'ultra') return null;
  if (!ultraBloomEnabled) return null;
  /* Indendørs: meget lyst vindue → bloom kan smitte ned på gulvet som en himmelblå “plet”. */
  if (isCabinLocation(locationId)) return null;

  return (
    <EffectComposer>
      <Bloom
        luminanceThreshold={0.85}
        luminanceSmoothing={0.3}
        intensity={0.25}
        mipmapBlur
      />
    </EffectComposer>
  );
}
