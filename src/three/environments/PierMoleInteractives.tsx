import { useGameStore } from '../../store/useGameStore.js';
import { useCollectionStore } from '../../store/useCollectionStore.js';
import { AmbientPierPlesiosaurus } from './AmbientPierPlesiosaurus.js';
import { HarborRat } from '../models/HarborRat.js';
import { ParrotCompanion } from '../models/ParrotCompanion.js';
import { SeagullFeather } from '../models/SeagullFeather.js';

/** Rotte + måge-fjer + papegøje (efter 3 fjer) på Den Gamle Mole — samme undergruppe som `Pier` ([0, 0.1, 0]). */
export function PierMoleInteractives() {
  const locationId = useGameStore((s) => s.currentLocation);
  const showParrot = useCollectionStore((s) => s.unlockedCompanions.includes('parrot'));
  if (locationId !== 'pier') return null;

  return (
    <group position={[0, 0.1, 0]}>
      <AmbientPierPlesiosaurus />
      <HarborRat />
      <SeagullFeather />
      {showParrot ? <ParrotCompanion /> : null}
    </group>
  );
}
