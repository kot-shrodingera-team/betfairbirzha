import { minVersion } from '@kot-shrodingera-team/config/util';

const afterSuccesfulStake = (): void => {
  if (minVersion('0.1.814.0')) {
    worker.Helper.WriteLine('Обновление данных об успешной ставке');
    const lastStakeCoefficient = document.querySelector(
      '.coupon__table-stake--rkHNN'
    );
    if (!lastStakeCoefficient) {
      worker.Helper.WriteLine('Не найден коеффициент последней ставки');
      return;
    }
    const coefficient = Number(lastStakeCoefficient.textContent);
    if (Number.isNaN(coefficient)) {
      worker.Helper.WriteLine(
        `Непонятный формат коеффициента последней ставки: ${lastStakeCoefficient.textContent}`
      );
      return;
    }
    if (coefficient !== worker.StakeInfo.Coef) {
      worker.Helper.WriteLine(
        `Коеффициент изменился: ${worker.StakeInfo.Coef} => ${coefficient}`
      );
      worker.StakeInfo.Coef = coefficient;
      return;
    }
    worker.Helper.WriteLine('Коеффициент не изменился');
  }
};

export default afterSuccesfulStake;
