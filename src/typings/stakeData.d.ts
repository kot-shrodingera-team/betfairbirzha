interface StakeData {
  isLay: boolean;
  betSelector: string;
  openningBet: boolean;
  sum: number;
  isFake: boolean;
  fakeReloaded: boolean;
  fakeSum: number;
  fakeCoefficient: number;
  fakeEvent: string;
  fakeBetName: string;
  stakePlaced: boolean;
  rawCoefficient: number;
  enabled: boolean;
  isNewBetslip: boolean;
}

declare global {
  interface Window {
    stakeData: StakeData;
  }
}

export {};
