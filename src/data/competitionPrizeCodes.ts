/**
 * Fælles kilde for fiskekonkurrence-præmiekoder (elever + læreroversigt).
 * Opdater begge steder samtidig i praksis: kun her.
 *
 * Hver plads: kontanter + fysisk podietrofæ (guld/sølv/bronze) i hytten.
 */
export type PodiumTrophyFurnitureId =
  | 'winner_trophy_gold'
  | 'winner_trophy_silver'
  | 'winner_trophy_bronze';

export type CompetitionPrizeReward = {
  type: 'podium';
  coins: number;
  furnitureId: PodiumTrophyFurnitureId;
};

export type CompetitionPrizeCodeEntry = {
  codes: string[];
  shortLabel: string;
  description: string;
  reward: CompetitionPrizeReward;
};

export const COMPETITION_PRIZE_CODE_ENTRIES: CompetitionPrizeCodeEntry[] = [
  {
    codes: ['456456'],
    shortLabel: '1. plads – 10.000 kr + guld',
    description:
      'Førsteplads: 10.000 kr i spillet plus guldvindertrofæ over kamin. Bruges når læreren udnævner vinderen af fiskekonkurrencen.',
    reward: {
      type: 'podium',
      coins: 10_000,
      furnitureId: 'winner_trophy_gold',
    },
  },
  {
    codes: ['567567'],
    shortLabel: '2. plads – 5.000 kr + sølv',
    description:
      'Andenplads: 5.000 kr i spillet plus sølvfarvet trofæ over kamin.',
    reward: {
      type: 'podium',
      coins: 5_000,
      furnitureId: 'winner_trophy_silver',
    },
  },
  {
    codes: ['678678'],
    shortLabel: '3. plads – 3.000 kr + bronze',
    description:
      'Tredjeplads: 3.000 kr i spillet plus bronzefarvet trofæ over kamin.',
    reward: {
      type: 'podium',
      coins: 3_000,
      furnitureId: 'winner_trophy_bronze',
    },
  },
];

/** Kode (eksakt match) → præmie, hvis gyldig. */
export function findCompetitionPrizeByCode(
  code: string,
): CompetitionPrizeCodeEntry | null {
  for (const e of COMPETITION_PRIZE_CODE_ENTRIES) {
    if (e.codes.includes(code)) return e;
  }
  return null;
}
