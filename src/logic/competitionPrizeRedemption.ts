import type { CompetitionPrizeCodeEntry } from '../data/competitionPrizeCodes.js';
import { usePlayerStore } from '../store/usePlayerStore.js';

export type TryApplyPrizeResult =
  | { success: true }
  | { success: false; code: 'already_has_trophy' };

/**
 * Udfører side effects for en indløst konkurrencerække (mønter + møbel).
 * Ny præmietype: udvid `CompetitionPrizeReward` + forgren her (ént sted).
 * Kaldes efter kodevalidering; lyd/ toast håndteres af kalderen.
 */
export function tryApplyCompetitionPrize(entry: CompetitionPrizeCodeEntry): TryApplyPrizeResult {
  const { coins, furnitureId } = entry.reward;
  const p = usePlayerStore.getState();
  if (p.unlockedFurniture.includes(furnitureId)) {
    return { success: false, code: 'already_has_trophy' };
  }
  p.setCoins((c) => c + coins);
  p.unlockFurniture(furnitureId);
  return { success: true };
}

/** Toast-tekst efter succesfuld indløsning (dansk). */
export function competitionPrizeSuccessToastMessage(entry: CompetitionPrizeCodeEntry): string {
  const c = entry.reward.coins.toLocaleString('da-DK');
  return entry.reward.furnitureId === 'winner_trophy_gold'
    ? `🏆🎉 Tillykke! +${c} kr, og guldvindertrofæet hænger over kamin!`
    : `🎉 Præmie indløst! +${c} kr, og podietrofæet står i hytten!`;
}
