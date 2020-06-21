import './workerCheck';
import { getElement, awaiter } from '@kot-shrodingera-team/config/util';
import getStakeInfo from './callbacks/getStakeInfo';
import setStakeSum from './callbacks/setStakeSum';
import doStake from './callbacks/doStake';
import checkCouponLoading, {
  clearLoadingStakeData,
} from './callbacks/checkCouponLoading';
import checkStakeStatus from './callbacks/checkStakeStatus';
import authorize from './authorize';
import showStake from './showStake';
import clearCoupon from './clearCoupon';
import { getStakeCount } from './getInfo';
import clearStakeData from './initializeStakeData';

let hiddenLink: HTMLAnchorElement = null;
clearStakeData();

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

const fastLoad = async (): Promise<void> => {
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
  clearStakeData();
  clearLoadingStakeData();
  if (document.querySelector('[selected-tab-id]')) {
    if (!document.querySelector('[selected-tab-id="POTENTIAL"]')) {
      const potentialTab = document.querySelector('.POTENTIAL') as HTMLElement;
      if (!potentialTab) {
        worker.Helper.WriteLine('Не найдена вкладка потенциальных ставок');
        worker.JSFail();
        return;
      }
      potentialTab.click();
    }
    const couponCleared = await clearCoupon();
    if (!couponCleared) {
      worker.JSFail();
      return;
    }
  }
  if (window.location.href !== worker.EventUrl) {
    if (!hiddenLink) {
      hiddenLink = document.createElement('a');
      const body = document.querySelector('body');
      body.insertBefore(hiddenLink, body.childNodes[0]);
    }
    hiddenLink.href = worker.EventUrl;
    if (
      document.querySelector('[selected-tab-id]') &&
      !document.querySelector('[selected-tab-id="POTENTIAL"]')
    ) {
      const potentialTab = document.querySelector('.POTENTIAL') as HTMLElement;
      if (!potentialTab) {
        worker.Helper.WriteLine('Не найдена вкладка потенциальных ставок');
        worker.JSFail();
        return;
      }
      potentialTab.click();
    }
    hiddenLink.click();
    await Promise.race([
      getElement('[selected-tab-id="OPEN"]'),
      awaiter(() => getStakeCount() > 0, 5000),
    ]);
    console.log(`getStakeCount = ${getStakeCount()}`);
    if (getStakeCount() > 0) {
      const couponCleared = await clearCoupon();
      if (!couponCleared) {
        worker.JSFail();
        return;
      }
    } else {
      const openBetsOpened = await getElement('[selected-tab-id="OPEN"]');
      if (!openBetsOpened) {
        worker.Helper.WriteLine(
          'Не дождались открытия вкладки открытых ставок'
        );
        worker.JSFail();
        return;
      }
      worker.Helper.WriteLine('Новый маркет открыт');
    }
  }
  showStake();
};

worker.SetFastCallback(fastLoad);
