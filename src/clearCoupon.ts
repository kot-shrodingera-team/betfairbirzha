import { awaiter } from '@kot-shrodingera-team/config/util';
import { getStakeCount } from './getInfo';
import { cancelAllSelectionsButtonSelector } from './selectors';

const clearCoupon = async (): Promise<boolean> => {
  if (getStakeCount() !== 0) {
    worker.Helper.WriteLine('В купоне есть ставки. Очищаем');
    const cancelAllSelectionsButton = document.querySelector(
      cancelAllSelectionsButtonSelector
    ) as HTMLElement;
    if (!cancelAllSelectionsButton) {
      worker.Helper.WriteLine(
        'Ошибка открытия купона: Не найдена кнопка очистки купона'
      );
      return false;
    }
    cancelAllSelectionsButton.click();
    if (!(await awaiter(() => getStakeCount() === 0))) {
      worker.Helper.WriteLine(
        'Ошибка открытия купона: Не удалось очистить купон'
      );

      return false;
    }
  }
  return true;
};

export default clearCoupon;
