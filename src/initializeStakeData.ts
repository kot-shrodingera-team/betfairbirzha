const clearStakeData = (): void => {
  window.stakeData = {
    isLay: false,
    sum: 0,
    isFake: false,
    fakeReloaded: false,
    fakeSum: 0,
    fakeCoefficient: 0,
    fakeEvent: '',
    fakeBetName: '',
    stakePlaced: false,
    rawCoefficient: 0,
    enabled: true,
    isNewBetslip: false,
  };
};

export default clearStakeData;
