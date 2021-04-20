import { fireEvent } from '@kot-shrodingera-team/config/util';
import {
  coefficientInputSelector,
  submitButtonSelector,
  betConfirmCheckboxSelector,
} from '../selectors';
import { getRawCoefficientFromCupon } from '../coefficientConvertions';
import { round } from '../util';
import { clearLoadingStakeData } from './checkCouponLoading';

// export const getCurrentLiability = (): number => {
//   const liabilityElement = document.querySelector(liabilitySelector);
//   if (liabilityElement) {
//     const liabilityText = liabilityElement.textContent.trim();
//     const liabilityRegex = /^.*?(\d+\.\d+)$/;
//     const match = liabilityText.match(liabilityRegex);
//     if (match) {
//       return parseFloat(match[1]);
//     }
//   }
//   return 0;
// };

const doStake = (): boolean => {
  worker.Helper.WriteLine('Делаем ставку');
  if (window.stakeData.isFake) {
    return true;
  }
  const actualCoefficient = getRawCoefficientFromCupon();
  const difference = round(
    actualCoefficient - window.stakeData.rawCoefficient,
    3
  );
  worker.Helper.WriteLine(
    `${window.stakeData.isLay ? '(Lay) ' : ''}Коэфициент (без комиссии) был: ${
      window.stakeData.rawCoefficient
    }, сейчас: ${actualCoefficient}, разница: ${difference}`
  );
  const coefficientInput = document.querySelector(
    coefficientInputSelector
  ) as HTMLInputElement;
  if (!coefficientInput) {
    worker.Helper.WriteLine('Не найдено поле ввода коэффициента');
    return false;
  }
  if (
    (window.stakeData.isLay && difference > 0) ||
    (!window.stakeData.isLay && difference < 0)
  ) {
    worker.Helper.WriteLine(`Коэффициент упал. Ставку не делаем`);
    return false;
  }
  if (
    (window.stakeData.isLay && difference < 0) ||
    (!window.stakeData.isLay && difference > 0)
  ) {
    worker.Helper.WriteLine(`Коэффициент вырос. Ставку делаем`);
    // window.stakeData.rawCoefficient = actualCoefficient;
  }
  if (coefficientInput.value !== String(actualCoefficient)) {
    coefficientInput.value = String(actualCoefficient);
    fireEvent(coefficientInput, 'input');
  }
  const submitButton = document.querySelector(
    submitButtonSelector
  ) as HTMLElement;
  if (!submitButton) {
    worker.Helper.WriteLine(
      'Ошибка принятия ставки: Не найдена кнопка принятия ставки'
    );
    return false;
  }
  if (submitButton.getAttribute('disabled')) {
    worker.Helper.WriteLine('Кнопка ставки недоступна');
    return false;
  }
  const betConfirmCheckbox = document.querySelector(
    betConfirmCheckboxSelector
  ) as HTMLInputElement;
  if (!betConfirmCheckbox) {
    worker.Helper.WriteLine('Не найден чекбокс подтверждения ставки');
  } else if (betConfirmCheckbox.checked) {
    worker.Helper.WriteLine('Выключаем подтверждение ставки');
    betConfirmCheckbox.click();
  }
  clearLoadingStakeData();
  worker.Helper.WriteLine('Нажимаем на кнопку принятия ставки');
  submitButton.click();
  return true;
};

export default doStake;
