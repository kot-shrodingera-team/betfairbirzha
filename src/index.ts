import './workerCheck';
import './initializeStakeData';
import getStakeInfo from './callbacks/getStakeInfo';
import setStakeSum from './callbacks/setStakeSum';
import doStake from './callbacks/doStake';
import checkCouponLoading from './callbacks/checkCouponLoading';
import checkStakeStatus from './callbacks/checkStakeStatus';
import authorize from './authorize';
import showStake from './showStake';

worker.SetCallBacks(
  console.log,
  getStakeInfo,
  setStakeSum,
  doStake,
  checkCouponLoading,
  checkStakeStatus
);

(async (): Promise<void> => {
  worker.Helper.WriteLine('Начали');
  // await domLoaded();
  // console.log('DOM загружен');
  if (!worker.IsShowStake) {
    authorize();
  } else {
    showStake();
  }
})();

const fastLoad = (): void => {
  if (window.stakeData.isFake) {
    const message =
      `Возможно неперекрытая ставка в БФ\n` +
      `Lay: ${window.stakeData.isLay ? 'Да' : 'Нет'}\n` +
      `Событие: '${window.stakeData.fakeEvent}'\n` +
      `Ставка: ${window.stakeData.fakeBetName}\n` +
      `Сумма: ${window.stakeData.fakeSum}\n` +
      `Коэффициент(с учётом комиссии): ${window.stakeData.fakeCoefficient}\n`;
    worker.Helper.WriteLine(message);
    worker.Helper.SendInformedMessage(message);
  }
  worker.Helper.LoadUrl(worker.EventUrl);
};

worker.SetFastCallback(fastLoad);
