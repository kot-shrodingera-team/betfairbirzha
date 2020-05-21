import { fireEvent } from '@kot-shrodingera-team/config/util';
import { stakeSumInputSelector } from '../selectors';
import { round } from '../util';

const setStakeSum = (sum: number): boolean => {
  worker.Helper.WriteLine(`Сумма ставки в боте - ${sum}`);
  if (window.stakeData.isFake) {
    return true;
  }
  const stakeSumInput = document.querySelector(
    stakeSumInputSelector
  ) as HTMLInputElement;
  if (!stakeSumInput) {
    worker.Helper.WriteLine(
      'Ошибка ввода суммы ставки: Не найдено поле ввода суммы ставки'
    );
    return false;
  }
  if (window.stakeData.isLay) {
    const backSum = round(sum / (window.stakeData.rawCoefficient - 1));
    worker.Helper.WriteLine(`Back сумма - ${backSum}`);
    stakeSumInput.value = String(backSum);
    window.stakeData.sum = backSum;
  } else {
    stakeSumInput.value = String(sum);
    window.stakeData.sum = sum;
  }
  fireEvent(stakeSumInput, 'input');
  return true;
};

export default setStakeSum;
