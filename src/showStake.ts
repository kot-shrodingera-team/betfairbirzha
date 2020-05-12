import { getElement, awaiter, sleep } from '@kot-shrodingera-team/config/util';
import { updateBalance, getStakeCount } from './getInfo';
import { languageCheck, changeLanguage, checkLoginAsync } from './authorize';
import {
  cancelAllSelectionsButtonSelector,
  liabilitySelector,
} from './selectors';

const showStake = async (): Promise<void> => {
  if (!(await languageCheck())) {
    worker.Helper.WriteLine('Язык не английский. Переключаем');
    if (!(await changeLanguage())) {
      worker.Helper.WriteLine('Не найдена иконка английского языка');
      worker.JSFail();
    }
    return;
  }
  const betData = worker.BetId.split('|');
  // let isLay = betData[0] === 'True';
  const betType = betData[0] === 'True' ? 'lay' : 'back';
  if (betType === 'lay') {
    worker.Helper.WriteLine('Lay ставка');
    window.stakeData.isLay = true;
  } else {
    worker.Helper.WriteLine('Back ставка');
    window.stakeData.isLay = false;
  }
  if (!(await checkLoginAsync())) {
    worker.Helper.WriteLine('Ошибка открытия купона: Нет авторизации');
    worker.Islogin = false;
    worker.JSLogined();
    return;
  }
  if (!worker.Islogin) {
    worker.Islogin = true;
    worker.JSLogined();
  }
  updateBalance();

  const pageContent = await getElement('.page-content');
  if (!pageContent) {
    worker.Helper.WriteLine(
      'Ошибка открытия купона: Не найден основной контент страницы'
    );
    worker.JSFail();
    return;
  }
  // Костыль. По-хорошему явно определять, когда появились ставки и купон
  await sleep(500);
  console.log(`stakeCount = ${getStakeCount()}`);
  if (getStakeCount() !== 0) {
    worker.Helper.WriteLine('В купоне есть ставки. Очищаем');
    const cancelAllSelectionsButton = document.querySelector(
      cancelAllSelectionsButtonSelector
    ) as HTMLElement;
    if (!cancelAllSelectionsButton) {
      worker.Helper.WriteLine(
        'Ошибка открытия купона: Не найдена кнопка очистки купона'
      );
      worker.JSFail();
      return;
    }
    cancelAllSelectionsButton.click();
    if (!(await awaiter(() => getStakeCount() === 0))) {
      worker.Helper.WriteLine(
        'Ошибка открытия купона: Не удалось очистить купон'
      );
      worker.JSFail();
      return;
    }
  }
  const betSelectionId = betData[2];
  const betHandicap = parseFloat(betData[3]);
  const mainContainer = await getElement('.main-mv-container');
  if (!mainContainer) {
    worker.Helper.WriteLine(
      'Ошибка открытия купона: Не найден основной контейнер'
    );
    worker.JSFail();
    return;
  }
  const betSelector =
    `[bet-handicap='${betHandicap}']` +
    `[bet-selection-id='${betSelectionId}']` +
    `[bet-type='${betType}']` +
    ` > button.${betType}-selection-button`;
  console.log(`betSelector = ${betSelector}`);
  window.currentStakeButton = (await getElement(
    betSelector,
    1000,
    mainContainer
  )) as HTMLElement;

  if (!window.currentStakeButton) {
    worker.Helper.WriteLine('Ошибка открытия купона: Ставка не найдена');
    worker.JSFail();
    return;
  }
  (window.currentStakeButton.parentNode as HTMLElement).style.border =
    '2px solid red';
  console.log('currentStakeButton');
  console.log(window.currentStakeButton);
  console.log(
    `price = ${window.currentStakeButton.getAttribute(
      'price'
    )}, size = ${window.currentStakeButton.getAttribute('size')}`
  );
  if (window.currentStakeButton.getAttribute('price') === '0') {
    worker.Helper.WriteLine('Коэффициент не появился, ждём ещё секунду');
    await sleep(1000);
    console.log(
      `price = ${window.currentStakeButton.getAttribute(
        'price'
      )}, size = ${window.currentStakeButton.getAttribute('size')}`
    );
    if (window.currentStakeButton.getAttribute('price') === '0') {
      worker.Helper.WriteLine(
        'Ошибка открытия купона: Коэффициент так и не появился'
      );
      worker.JSFail();
      return;
    }
  }
  worker.Helper.WriteLine('Нажимаем на ставку');
  window.currentStakeButton.click();
  console.log(`stakeCount = ${getStakeCount()}`);
  if (window.stakeData.isNewBetslip) {
    await getElement(liabilitySelector, 1000);
  }
  worker.JSStop();
};

export default showStake;
