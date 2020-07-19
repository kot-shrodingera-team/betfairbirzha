import './workerCheck';
import {
  getElement,
  awaiter,
  pipeHwlToConsole,
} from '@kot-shrodingera-team/config/util';
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
import {
  getActiveTab,
  goToPotentialBetsTab,
  goToOpenBetsTab,
  openBetsTabActiveSelector,
} from './utils';

pipeHwlToConsole();

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
  const betslip = document.querySelector('bf-betslip');
  if (betslip) {
    worker.Helper.WriteLine('Мы на странице с купоном');
    if (getActiveTab() === 'potential') {
      worker.Helper.WriteLine(
        'На вкладке потенциальных ставок. Переходим на вкладку открытых ставок'
      );
      const goneToOpenBetsTab = await goToOpenBetsTab();
      if (!goneToOpenBetsTab) {
        worker.JSFail();
        return;
      }
    }
    if (getActiveTab() === 'open') {
      worker.Helper.WriteLine(
        'На вкладке открытых ставок. Переходим на вкладку потенциальных ставок'
      );
      const goneToPotentialBetsTab = await goToPotentialBetsTab();
      if (!goneToPotentialBetsTab) {
        worker.JSFail();
        return;
      }
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
    worker.Helper.WriteLine('Переходим на новый маркет');
    hiddenLink.click();
    const leaveMarketButton = document.querySelector(
      '.nav-modal-dialog:not(.ng-hide) [ng-click="events.navigateAway()"]'
    ) as HTMLElement;
    if (leaveMarketButton) {
      worker.Helper.WriteLine(
        'Нажимаем на кнопку подтверждения перехода на новый маркет'
      );
      leaveMarketButton.click();
    }
    // await sleep(1000);
    // Ждём либо открытия вкладки открытых ставок, либо когда количество потенциальных ставок в купоне будет больше 0
    await Promise.race([
      getElement(openBetsTabActiveSelector),
      awaiter(() => getStakeCount() > 0),
    ]);
    if (getStakeCount() > 0) {
      worker.Helper.WriteLine(
        'Перешли на новый маркет. Есть ставки в купоне. Очищаем купон'
      );
      const couponCleared = await clearCoupon();
      if (!couponCleared) {
        worker.JSFail();
        return;
      }
    } else if (document.querySelector(openBetsTabActiveSelector)) {
      worker.Helper.WriteLine('Успешно перешли на новый маркет');
    } else {
      worker.Helper.WriteLine('Не удалось перейти на новый маркет');
      worker.JSFail();
      return;
    }
  }
  showStake();
};

worker.SetFastCallback(fastLoad);
