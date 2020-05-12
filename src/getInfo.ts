/* eslint-disable no-cond-assign */
import {
  ri,
  normalizeDiactric,
  getElement,
  awaiter,
} from '@kot-shrodingera-team/config/util';
import {
  accountPanelSelector,
  betsSelector,
  balanceElementSelector,
  stakeSumInputSelector,
  eventSelector,
  competitionSelector,
  betNameSelector,
} from './selectors';
import {
  getCoefficientFromLay,
  getCoefIncludingCommission,
  convertToLaySum,
} from './coefficientConvertions';
import { round } from './util';

export const checkLogin = (): boolean => {
  return Boolean(document.querySelector(accountPanelSelector));
};

export const getStakeCount = (): number => {
  if (window.stakeData.isFake) {
    return 1;
  }
  return document.querySelectorAll(betsSelector).length;
};

export const checkStakeEnabled = (): boolean => {
  if (window.stakeData.isFake) {
    return true;
  }
  return window.stakeData.enabled;
};

export const getCoefficientFromCoupon = (): number => {
  if (window.stakeData.isFake) {
    return window.stakeData.fakeCoefficient;
  }
  window.stakeData.rawCoefficient = getCoefficientFromCoupon();
  if (window.stakeData.isLay) {
    window.stakeData.layCoefficient = getCoefficientFromLay(
      window.stakeData.rawCoefficient
    );
    window.stakeData.realCoefficient = getCoefIncludingCommission(
      window.stakeData.layCoefficient
    );
  } else {
    window.stakeData.realCoefficient = getCoefIncludingCommission(
      window.stakeData.rawCoefficient
    );
  }
  return window.stakeData.realCoefficient;
};

export const getBalance = (): number => {
  const balanceElement = document.querySelector(balanceElementSelector);
  if (!balanceElement) {
    worker.Helper.WriteLine('Ошибка получения баланса: Не найден баланс');
    return -1;
  }
  const balanceText = balanceElement.textContent.replace(',', '');
  if (!/^[$€]\d+\.\d+/.test(balanceText)) {
    worker.Helper.WriteLine(
      `Ошибка получения баланса: Непонятный формат баланса - ${balanceText}`
    );
    return -1;
  }
  let balance;
  try {
    balance = parseFloat(balanceText.substr(1));
  } catch (e) {
    worker.Helper.WriteLine(
      `Ошибка получения баланса: Не удалось спарсить - ${e}`
    );
    return -1;
  }
  // Если продаём часть ставки, нужно скорректировать баланс, иначе бот может решить, что нельзя сделать ставку
  if (window.stakeData.isFake) {
    // if (stakeData.isLay) {
    //     return parseFloat((balance + convertToLaySum(stakeData.fakeSum, stakeData.rawCoefficient)).toFixed(2));
    // } else {
    //     return parseFloat((balance + stakeData.fakeSum).toFixed(2));
    // }
    return round(balance + window.stakeData.fakeSum);
  }
  return balance;
};

const balanceOk = async (): Promise<boolean> => {
  const balanceElement = await getElement(balanceElementSelector);
  if (!balanceElement) {
    worker.Helper.WriteLine('Ошибка получения баланса: Не найден баланс');
    return null;
  }
  return awaiter(
    () =>
      /^[$€]\d+\.\d+&/.test(balanceElement.textContent.trim().replace(',', '')),
    10000
  );
};

export const updateBalance = async (): Promise<void> => {
  await balanceOk();
  const balance = getBalance();
  console.log(`balance = ${balance}`);
  worker.JSBalanceChange(balance);
};

export const getMinimumStake = (): number => {
  if (window.stakeData.isFake) {
    // return window.stakeData.fakeSum;
    return 0;
  }
  if (window.stakeData.isLay) {
    return round(3 / (window.stakeData.layCoefficient - 1));
  }
  return 3;
};

export const getMaximumStake = (): number => {
  if (window.stakeData.isFake) {
    // if (stakeData.isLay) {
    //     return convertToLaySum(stakeData.fakeSum, stakeData.rawCoefficient);
    // } else {
    //     return stakeData.fakeSum;
    // }
    return window.stakeData.fakeSum;
  }
  if (!window.currentStakeButton) {
    worker.Helper.WriteLine(
      `Ошибка получения максимальной ставки: Нет текущей ставки`
    );
    return -1;
  }
  const size = window.currentStakeButton.getAttribute('size');
  if (!size) {
    worker.Helper.WriteLine(
      `Ошибка получения максимальной ставки: Не найден аттрибут максимальной ставки`
    );
    return -1;
  }
  try {
    const rawMax = Number(size.substr(1));
    if (window.stakeData.isLay) {
      return convertToLaySum(rawMax, window.stakeData.rawCoefficient);
    }
    return rawMax;
  } catch (e) {
    worker.Helper.WriteLine(
      `Ошибка получения максимальной ставки: Не удалось спарсить - ${e}`
    );
    return -1;
  }
};

export const getSumFromCoupon = (): number => {
  if (window.stakeData.isFake) {
    // if (stakeData.isLay) {
    //     return convertToLaySum(stakeData.fakeSum, stakeData.rawCoefficient);
    // } else {
    //     return stakeData.fakeSum;
    // }
    return window.stakeData.fakeSum;
  }
  const stakeSumInput = document.querySelector(
    stakeSumInputSelector
  ) as HTMLInputElement;
  if (!stakeSumInput) {
    worker.Helper.WriteLine(
      'Ошибка получения текущей суммы ставки: Не найдено поле ввода суммы ставки'
    );
    return NaN;
  }
  try {
    const value = parseFloat(stakeSumInput.value);
    if (window.stakeData.isLay) {
      return value / (window.stakeData.layCoefficient - 1);
    }
    return value;
  } catch (e) {
    worker.Helper.WriteLine(
      `Ошибка получения текущей суммы ставки: Не удалось спарсить - ${e}`
    );
    return NaN;
  }
};

const isBetNameOfMatchOdds = (betName: string, teams: string[]): boolean => {
  const teamsNormalized = teams.map((team) =>
    normalizeDiactric(team.replace(/-/g, ' '))
  );
  const normalizedBetName = normalizeDiactric(betName);
  if (teamsNormalized.some((team) => ri`${team}`.test(normalizedBetName))) {
    return true;
  }
  // Сокращения, обычно в теннисе
  // Zhizhen Zhang -> Zh Zhang
  // Mikael Ymer -> M Ymer
  // Evgeny Donskoy -> Donskoy
  const betNameSplited = normalizedBetName.split(' ');
  if (betNameSplited.length > 1) {
    betNameSplited[0] = betNameSplited[0].substr(0, 2);
    if (
      teamsNormalized.some((team) => ri`${team}`.test(betNameSplited.join(' ')))
    ) {
      worker.Helper.WriteLine(
        'Первое слово в заголовке события сокращено до двух символов'
      );
      return true;
    }
    betNameSplited[0] = betNameSplited[0].substr(0, 1);
    if (
      teamsNormalized.some((team) => ri`${team}`.test(betNameSplited.join(' ')))
    ) {
      worker.Helper.WriteLine(
        'Первое слово в заголовке события сокращено до одного сивола'
      );
      return true;
    }
    betNameSplited.splice(0, 1);
    if (
      teamsNormalized.some((team) => ri`${team}`.test(betNameSplited.join(' ')))
    ) {
      worker.Helper.WriteLine('Первое слово в заголовке события опущено');
      return true;
    }
  }
  return false;
};

export const getParameterFromCoupon = (): number => {
  if (window.stakeData.isFake) {
    return worker.StakeInfo.Parametr;
  }
  const event = document.querySelector(eventSelector);
  if (!event) {
    worker.Helper.WriteLine(
      'Ошибка получения параметра ставки: Не найден заголовок события'
    );
    return -9999;
  }
  const teamsString = event.textContent.trim();
  worker.Helper.WriteLine(`Заголовок события - '${teamsString}'`);
  const competitionElement = document.querySelector(competitionSelector);
  let competition = '';
  if (!competitionElement) {
    worker.Helper.WriteLine('Не найден заголовок соревнования (лиги)');
  } else {
    competition = competitionElement.textContent.trim();
    worker.Helper.WriteLine(`Заголовок соревнования (лиги) - '${competition}'`);
  }
  const teams =
    competition === 'NHL Matches'
      ? teamsString.split(' @ ')
      : teamsString.split(' v ');
  if (teams.length !== 2) {
    worker.Helper.WriteLine(
      'Ошибка получения параметра ставки: Не удалось получить команды из росписи события'
    );
    return -9999;
  }
  const betNameElement = document.querySelector(betNameSelector);
  if (!betNameElement) {
    worker.Helper.WriteLine(
      'Ошибка получения параметра ставки: Не найдена роспись ставки'
    );
    return -9999;
  }
  const betName = betNameElement.textContent;
  worker.Helper.WriteLine(`Роспись ставки - ${betName}`);
  let match;
  const handicapParameterRegex = `(0|[-+]\\d+(?:\\.\\d+)?)`;
  try {
    if ((match = betName.match(`^(?:Under|Over) (\\d+\\.\\d+)(?: Goals)?$`))) {
      worker.Helper.WriteLine(`Тип ставки - Тотал. Параметр = ${match[1]}`);
      return parseFloat(match[1]);
    }
    if (
      (match = betName.match(`^(.*) ${handicapParameterRegex}$`)) &&
      isBetNameOfMatchOdds(match[1], teams)
    ) {
      worker.Helper.WriteLine(`Тип ставки - Фора. Параметр = ${match[2]}`);
      return window.stakeData.isLay
        ? -parseFloat(match[2])
        : parseFloat(match[2]);
    }
    if (
      (match = betName.match(
        `^(.*) ${handicapParameterRegex} & ${handicapParameterRegex}$`
      )) &&
      isBetNameOfMatchOdds(match[1], teams)
    ) {
      const firstHandicapParameter = parseFloat(match[2]);
      const secondHandicapParameter = parseFloat(match[3]);
      if (
        Math.abs(secondHandicapParameter) - Math.abs(firstHandicapParameter) !==
        0.5
      ) {
        worker.Helper.WriteLine(
          `Ошибка получения параметра ставки: Непонятная азиатская фора - ${betName}`
        );
        return -9999;
      }
      const resultHandicapParameter =
        (firstHandicapParameter + secondHandicapParameter) / 2;
      worker.Helper.WriteLine(
        `Тип ставки - Фора (азиатская). Параметр = ${resultHandicapParameter}`
      );
      return window.stakeData.isLay
        ? -resultHandicapParameter
        : resultHandicapParameter;
    }
    if (betName === 'Home or Draw') {
      worker.Helper.WriteLine(`Тип ставки - Double Chance 1X (Без параметра)`);
      return -6666;
    }
    if (betName === 'Draw or Away') {
      worker.Helper.WriteLine(`Тип ставки - Double Chance X2 (Без параметра)`);
      return -6666;
    }
    if (betName === 'Home or Away') {
      worker.Helper.WriteLine(`Тип ставки - Double Chance 12 (Без параметра)`);
      return -6666;
    }
    if (betName === 'The Draw') {
      worker.Helper.WriteLine(`Тип ставки - Ничья (Без параметра)`);
      return -6666;
    }
    if (isBetNameOfMatchOdds(betName, teams)) {
      worker.Helper.WriteLine(`Тип ставки - Победа (Без параметра)`);
      return -6666;
    }
  } catch (e) {
    worker.Helper.WriteLine(
      `Ошибка получения параметра ставки: Не удалось спарсить - ${e}`
    );
    return -9999;
  }
  worker.Helper.WriteLine(`Неизвестный тип ставки - ${betName}`);
  return -9999;
};
