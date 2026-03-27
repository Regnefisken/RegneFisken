export type CollectibleId = 'fossil' | 'conch' | 'pearl';

export type MilestoneRewardType =
  | 'hvalbof'
  | 'koedklump'
  | 'bait'
  | 'cheese'
  | 'xp_coins';

export interface MilestoneRewardBase {
  type: MilestoneRewardType | string;
  toast: string;
  particles?: number;
}

export interface MilestoneRewardXpCoins extends MilestoneRewardBase {
  type: 'xp_coins';
  xp: number;
  coins: number;
}

export type MilestoneReward = MilestoneRewardBase | MilestoneRewardXpCoins;

export type MilestoneRewardsMap = Record<number, MilestoneReward>;

export interface CollectibleConfig {
  id: CollectibleId;
  invKey: string;
  icon: string;
  name: string;
  namePlural: string;
  npcId: string;
  npcName: string;
  npcIcon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  modalBg: string;
  modalBorder: string;
  btnBg: string;
  btnBorder: string;
  btnColor: string;
  milestoneRewards: MilestoneRewardsMap;
  dialogs: (delivered: number) => string;
  emptyText: string;
  returnText: string;
}

export type CollectiblesRegistry = Record<CollectibleId, CollectibleConfig>;

export interface CompanionDef {
  id: string;
  name: string;
  icon: string;
  emoji: string;
  color: string;
  description: string;
  unlockType: string;
  unlockValue?: string;
}
