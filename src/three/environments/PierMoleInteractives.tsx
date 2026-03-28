import { useGameStore } from '../../store/useGameStore.js';
import { HarborRat } from '../models/HarborRat.js';
import { SeagullFeather } from '../models/SeagullFeather.js';

/** Rotte + måge-fjer på Den Gamle Mole — samme undergruppe som `Pier` ([0, 0.1, 0]). */
export function PierMoleInteractives() {
  const locationId = useGameStore((s) => s.currentLocation);
  if (locationId !== 'pier') return null;

  return (
    <group position={[0, 0.1, 0]}>
      <HarborRat />
      <SeagullFeather />
    </group>
  );
}
