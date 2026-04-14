import { tryCompleteNextGoal } from './goal-progress.js';
import { usePlayerStore } from '../store/usePlayerStore.js';

export const JUNGLE_CHEST_OPENED_QUEST = 'jungle_chest_opened';

/** Efter første episke pergament-afsløring fra jungle-kisten (modal lukket). */
export function markJungleChestParchmentSeen(): void {
  usePlayerStore.getState().setQuestItems((prev) =>
    prev.includes(JUNGLE_CHEST_OPENED_QUEST) ? prev : [...prev, JUNGLE_CHEST_OPENED_QUEST],
  );
  tryCompleteNextGoal();
}
