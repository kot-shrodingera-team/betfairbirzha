import { awaiter, getElement } from '@kot-shrodingera-team/config/util';
import { getStakeCount } from './getInfo';
import { submitButtonSelector } from './selectors';

const openBet = async (): Promise<boolean> => {
  window.stakeData.openningBet = true;
  window.currentStakeButton = (await getElement(
    window.stakeData.betSelector
  )) as HTMLElement;
  if (!window.currentStakeButton) {
    worker.Helper.WriteLine('Ошибка открытия купона: Ставка не найдена');
    window.stakeData.openningBet = false;
    return false;
  }
  (window.currentStakeButton.parentNode as HTMLElement).style.border =
    '2px solid red';
  const priceAppeared = await awaiter(() => {
    return (
      window.currentStakeButton.getAttribute('price') &&
      window.currentStakeButton.getAttribute('price') !== '0'
    );
  }, 1000);
  if (!priceAppeared) {
    worker.Helper.WriteLine(
      'Ошибка открытия купона: Коэффициент так и не появился'
    );
    window.stakeData.openningBet = false;
    return false;
  }
  worker.Helper.WriteLine('Нажимаем на ставку');
  window.currentStakeButton.click();
  const betAdded = await awaiter(() => getStakeCount() === 1);
  if (!betAdded) {
    worker.Helper.WriteLine('Ошибка открытия купона: Ставка не попала в купон');
    window.stakeData.openningBet = false;
    return false;
  }
  worker.Helper.WriteLine('Купон открыт');
  worker.Helper.WriteLine(
    `Текущий макс (back): ${window.currentStakeButton.getAttribute('size')}`
  );
  window.stakeData.openningBet = false;
  return true;
};

export default openBet;
