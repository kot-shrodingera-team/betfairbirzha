import { fireEvent } from '@kot-shrodingera-team/config/util';
import {
  liabilitySelector,
  coefficientInputSelector,
  submitButtonSelector,
  betConfirmCheckboxSelector,
} from '../selectors';
import { getBalance, getCoefficientFromCoupon } from '../getInfo';
import { getRawCoefficientFromCupon } from '../coefficientConvertions';

export const getCurrentLiability = (): number => {
  const liabilityElement = document.querySelector(liabilitySelector);
  if (liabilityElement) {
    const liabilityText = liabilityElement.textContent.trim();
    const liabilityRegex = /^.*?(\d+\.\d+)$/;
    const match = liabilityText.match(liabilityRegex);
    if (match) {
      return parseFloat(match[1]);
    }
  }
  return 0;
};

const doStake = (): boolean => {
  console.log('doStake()');
  worker.Helper.WriteLine('Делаем ставку');
  if (window.stakeData.isFake) {
    return true;
  }
  // if (window.stakeData.isNewBetslip) {
  window.stakeData.liability = getCurrentLiability();
  window.stakeData.balanceBeforeStake = getBalance();
  worker.Helper.WriteLine(
    `Обязательство до ставки: ${window.stakeData.liability}`
  );
  worker.Helper.WriteLine(
    `Баланс до ставки: ${window.stakeData.balanceBeforeStake}`
  );
  // }
  const actualCoefficient = getRawCoefficientFromCupon();
  worker.Helper.WriteLine(`Актуальный коэффициент: ${actualCoefficient}`);
  worker.Helper.WriteLine(
    `Разница: ${parseFloat(
      (window.stakeData.rawCoefficient - actualCoefficient).toFixed(2)
    )}`
  );
  const coefficientInput = document.querySelector(
    coefficientInputSelector
  ) as HTMLInputElement;
  if (
    (window.stakeData.isLay &&
      actualCoefficient > window.stakeData.rawCoefficient) ||
    (!window.stakeData.isLay &&
      actualCoefficient < window.stakeData.rawCoefficient)
  ) {
    worker.Helper.WriteLine(
      `Коэффициент упал ${window.stakeData.rawCoefficient} -> ${actualCoefficient}`
    );
    return false;
  }
  if (
    (window.stakeData.isLay &&
      actualCoefficient < window.stakeData.rawCoefficient) ||
    (!window.stakeData.isLay &&
      actualCoefficient > window.stakeData.rawCoefficient)
  ) {
    worker.Helper.WriteLine(
      `Коэффициент вырос ${window.stakeData.rawCoefficient} -> ${actualCoefficient}`
    );
    if (!coefficientInput) {
      worker.Helper.WriteLine(
        'Ошибка принятия ставки: Не найдено поле ввода коэффициента'
      );
      return false;
    }
    coefficientInput.value = String(actualCoefficient);
    fireEvent(coefficientInput, 'input');
    worker.StakeInfo.Coef = getCoefficientFromCoupon();
    worker.Helper.WriteLine(
      `${window.stakeData.realCoefficient} с учётом комиссии`
    );
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
  const betConfirmCheckbox = document.querySelector(
    betConfirmCheckboxSelector
  ) as HTMLInputElement;
  if (!betConfirmCheckbox) {
    worker.Helper.WriteLine('Не найден чекбокс подтверждения ставки');
  } else if (betConfirmCheckbox.checked) {
    worker.Helper.WriteLine('Выключаем подтверждение ставки');
    betConfirmCheckbox.click();
  }
  worker.Helper.WriteLine('Нажимаем на кнопку принятия ставки');
  submitButton.click();
  window.stakeData.isCheckDelayed = false;
  return true;
};

export default doStake;
