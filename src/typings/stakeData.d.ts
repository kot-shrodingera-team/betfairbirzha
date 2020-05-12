interface StakeData {
  isLay: boolean;
  sum: number;
  laySum: number;
  liability: number;
  balanceBeforeStake: number;
  balanceBeforeCancel: number;
  cancelSum: number;
  layCancelSum: number;
  isFake: boolean;
  fakeReloaded: boolean;
  fakeSum: number;
  fakeCoefficient: number;
  fakeEvent: string;
  fakeBetName: string;
  stakePlaced: boolean;
  rawCoefficient: number;
  layCoefficient: number;
  realCoefficient: number;
  enabled: boolean;
  isNewBetslip: boolean;
  isCancelling: boolean;
  isCancelled: boolean;
  isCheckDelayed: boolean;
}

declare global {
  interface Window {
    stakeData: StakeData;
  }
}

export {};
