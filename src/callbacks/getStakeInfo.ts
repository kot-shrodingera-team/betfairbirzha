import {
  checkLogin,
  getStakeCount,
  checkStakeEnabled,
  getCoefficientFromCoupon,
  getBalance,
  getMinimumStake,
  getMaximumStake,
  getSumFromCoupon,
  getParameterFromCoupon,
} from '../getInfo';
import showStake from '../showStake';

const getStakeInfo = (): string => {
  worker.StakeInfo.Auth = checkLogin();
  worker.StakeInfo.StakeCount = getStakeCount();
  worker.StakeInfo.IsEnebled = checkStakeEnabled();
  worker.StakeInfo.Coef = getCoefficientFromCoupon();
  worker.StakeInfo.Balance = getBalance();
  worker.StakeInfo.MinSumm = getMinimumStake();
  worker.StakeInfo.MaxSumm = getMaximumStake();
  worker.StakeInfo.Summ = getSumFromCoupon();
  worker.StakeInfo.Parametr = getParameterFromCoupon();
  if (getStakeCount() !== 1) {
    showStake();
  }
  return JSON.stringify(worker.StakeInfo);
};

export default getStakeInfo;
