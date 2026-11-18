import { tryCompleteNextGoal } from './goal-progress.js';
import { usePlayerStore } from '../store/usePlayerStore.js';

export const JUNGLE_CHEST_OPENED_QUEST = 'jungle_chest_opened';

/** Ligger i jungle-kisten; kræves for at købe akvariet i møbelbutikken. */
export const AQUARIUM_PUMP_QUEST = 'aquarium_pump';

/**
 * Giver akvariepumpen fra jungle-kisten. Kaldes, når kisten åbnes — også for spillere, der åbnede
 * kisten, før pumpen blev lagt i den. Returnerer `true`, hvis spilleren ikke havde den i forvejen.
 */
export function grantAquariumPump(): boolean {
  const p = usePlayerStore.getState();
  if (p.questItems.includes(AQUARIUM_PUMP_QUEST)) return false;
  p.setQuestItems((prev) => (prev.includes(AQUARIUM_PUMP_QUEST) ? prev : [...prev, AQUARIUM_PUMP_QUEST]));
  return true;
}

/** Efter første episke pergament-afsløring fra jungle-kisten (modal lukket). */
export function markJungleChestParchmentSeen(): void {
  usePlayerStore.getState().setQuestItems((prev) =>
    prev.includes(JUNGLE_CHEST_OPENED_QUEST) ? prev : [...prev, JUNGLE_CHEST_OPENED_QUEST],
  );
  grantAquariumPump();
  tryCompleteNextGoal();
}
