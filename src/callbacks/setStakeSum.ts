import { fireEvent } from '@kot-shrodingera-team/config/util';
import { stakeSumInputSelector } from '../selectors';
import { convertToLaySum } from '../coefficientConvertions';

const setStakeSum = (sum: number): boolean => {
  console.log(`setStakeSumm(${sum})`);
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
    const laySum = convertToLaySum(sum, window.stakeData.layCoefficient);
    worker.Helper.WriteLine(`Сумма lay ставки - ${laySum}`);
    stakeSumInput.value = String(laySum);
    window.stakeData.laySum = laySum;
    // window.stakeData.sum = laySum;
  } else {
    stakeSumInput.value = String(sum);
    // window.stakeData.sum = sum;
  }
  window.stakeData.sum = sum;
  fireEvent(stakeSumInput, 'input');
  return true;
};

export default setStakeSum;
