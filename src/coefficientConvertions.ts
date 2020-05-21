import { round } from './util';

export const getRawCoefficientFromCupon = (): number => {
  if (!window.currentStakeButton) {
    worker.Helper.WriteLine(
      `Ошибка получения коэффициента: Нет текущей ставки`
    );
    return -1;
  }
  const price = window.currentStakeButton.getAttribute('price');
  if (!price) {
    worker.Helper.WriteLine(
      `Ошибка получения коэффициента: Не найден аттрибут коэффициента`
    );
    return -1;
  }
  try {
    const result = Number(price);
    worker.Helper.WriteLine(`Raw коэффициент: ${result}`);
    return result;
  } catch (e) {
    worker.Helper.WriteLine(
      `Ошибка получения коэффициента: Не удалось спарсить - ${e}`
    );
    return -1;
  }
};

export const invertCoefficient = (coefficient: number): number => {
  return round(coefficient / (coefficient - 1), 3);
};

// export const getCoefficientFromLay = (coefficient: number): number => {
//   return round(coefficient / (coefficient - 1), 3);
// };

export const getCoefIncludingCommission = (coefficient: number): number => {
  if (coefficient === 0) {
    return 0;
  }
  return (
    Math.floor(
      1000 * (1 + (coefficient - 1) * (1 - worker.ProfitCommission / 100))
    ) / 1000
  );
};

export const convertToLaySum = (
  sum: number,
  layCoefficient: number
): number => {
  return round(sum * (layCoefficient - 1));
};
