import { updateBalance } from '../getInfo';

const checkStakeStatus = (): boolean => {
  if (window.stakeData.stakePlaced) {
    worker.Helper.WriteLine('Ставка принята');
    updateBalance();
    return true;
  }
  if (window.stakeData.isFake) {
    if (window.stakeData.fakeReloaded) {
      window.stakeData.isFake = false;
      return true;
    }
    worker.Helper.WriteLine(
      'Нужно обновить данные о ставке (частичная ставка)'
    );
    window.stakeData.fakeReloaded = true;
    return false;
  }
  worker.Helper.WriteLine('Ставка не принята');
  return false;
};

export default checkStakeStatus;
