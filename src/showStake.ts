import { getElement } from '@kot-shrodingera-team/config/util';
import { updateBalance } from './getInfo';
import { languageCheck, changeLanguage, checkLoginAsync } from './authorize';
import openBet from './openBet';

const showStake = async (): Promise<void> => {
  if (!(await languageCheck())) {
    worker.Helper.WriteLine('Язык не английский. Переключаем');
    if (!(await changeLanguage())) {
      worker.Helper.WriteLine('Не найдена иконка английского языка');
      worker.JSFail();
    }
    return;
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
  await updateBalance();

  const pageContent = await getElement('.page-content');
  if (!pageContent) {
    worker.Helper.WriteLine(
      'Ошибка открытия купона: Не найден основной контент страницы'
    );
    worker.JSFail();
    return;
  }
  // Костыль. По-хорошему явно определять, когда появились ставки и купон
  // await sleep(500);
  // console.log(`stakeCount = ${getStakeCount()}`);
  // if (getStakeCount() !== 0) {
  //   worker.Helper.WriteLine('В купоне есть ставки. Очищаем');
  //   const cancelAllSelectionsButton = document.querySelector(
  //     cancelAllSelectionsButtonSelector
  //   ) as HTMLElement;
  //   if (!cancelAllSelectionsButton) {
  //     worker.Helper.WriteLine(
  //       'Ошибка открытия купона: Не найдена кнопка очистки купона'
  //     );
  //     worker.JSFail();
  //     return;
  //   }
  //   cancelAllSelectionsButton.click();
  //   if (!(await awaiter(() => getStakeCount() === 0))) {
  //     worker.Helper.WriteLine(
  //       'Ошибка открытия купона: Не удалось очистить купон'
  //     );
  //     worker.JSFail();
  //     return;
  //   }
  // }
  const mainContainer = await getElement('.main-mv-container');
  if (!mainContainer) {
    worker.Helper.WriteLine(
      'Ошибка открытия купона: Не найден основной контейнер'
    );
    worker.JSFail();
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
  const betSelectionId = betData[1];
  const betHandicap = betData[2] === 'null' ? 0 : betData[2];
  window.stakeData.betSelector =
    `[bet-handicap='${betHandicap}']` +
    `[bet-selection-id='${betSelectionId}']` +
    `[bet-type='${betType}']` +
    ` > button.${betType}-selection-button, ` +
    `[bet-handicap='0']` +
    `[bet-selection-id='${betSelectionId}']` +
    `[bet-type='${betType}']` +
    ` > button.${betType}-selection-button`;
  if (!(await openBet())) {
    worker.JSFail();
    return;
  }
  worker.JSStop();
};

export default showStake;
