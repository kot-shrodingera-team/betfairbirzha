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
  invertCoefficient,
  getCoefIncludingCommission,
  getRawCoefficientFromCupon,
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
  window.stakeData.rawCoefficient = getRawCoefficientFromCupon();
  let botCoefficient: number;
  if (window.stakeData.isLay) {
    botCoefficient = getCoefIncludingCommission(
      invertCoefficient(window.stakeData.rawCoefficient)
    );
  } else {
    botCoefficient = getCoefIncludingCommission(
      window.stakeData.rawCoefficient
    );
  }
  return botCoefficient;
};

export const getBalance = (): number => {
  const balanceElement = document.querySelector(balanceElementSelector);
  if (!balanceElement) {
    worker.Helper.WriteLine('Ошибка получения баланса: Не найден баланс');
    return -1;
  }
  const balanceText = balanceElement.textContent.trim();
  const balance = Number(balanceText.replace(',', '').substr(1));
  if (!balance) {
    worker.Helper.WriteLine(
      `Ошибка получения баланса: Непонятный формат баланса - ${balanceText}`
    );
    return -1;
  }
  // Если фейковая (частичная) ставка, нужно скорректировать баланс, иначе бот может решить, что не хватит баланса
  if (window.stakeData.isFake) {
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
      /^[$€]\d+\.\d+$/.test(balanceElement.textContent.trim().replace(',', '')),
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
    return round(3 * (window.stakeData.rawCoefficient - 1));
  }
  return 3;
};

export const getMaximumStake = (): number => {
  if (window.stakeData.isFake) {
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
  const rawMax = Number(size.substr(1));
  if (!rawMax) {
    worker.Helper.WriteLine(
      `Ошибка получения максимальной ставки: Не удалось спарсить - ${size}`
    );
    return -1;
  }
  if (window.stakeData.isLay) {
    return round(rawMax * (window.stakeData.rawCoefficient - 1));
  }
  return rawMax;
};

export const getSumFromCoupon = (): number => {
  if (window.stakeData.isFake) {
    return window.stakeData.fakeSum;
  }
  const stakeSumInput = document.querySelector(
    stakeSumInputSelector
  ) as HTMLInputElement;
  if (!stakeSumInput) {
    worker.Helper.WriteLine(
      'Ошибка получения текущей суммы ставки: Не найдено поле ввода суммы ставки'
    );
    return -1;
  }
  const value = Number(stakeSumInput.value);
  if (Number.isNaN(value)) {
    worker.Helper.WriteLine(
      `Ошибка получения текущей суммы ставки: Не удалось спарсить - '${stakeSumInput.value}'`
    );
    return -1;
  }
  if (window.stakeData.isLay) {
    return round(value * window.stakeData.rawCoefficient);
  }
  return value;
};

const isBetNameOfMatchOdds = (betName: string, teams: string[]): boolean => {
  const teamsNormalized = teams.map((team) =>
    normalizeDiactric(team.replace(/-/g, ' '))
  );
  const normalizedBetName = normalizeDiactric(betName.replace(/-/g, ' '));
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
    teamsString.split(' @ ').length === 2
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
    if (
      (match = betName.match(`^(.*) ${handicapParameterRegex}$`)) &&
      isBetNameOfMatchOdds(match[1], teams)
    ) {
      worker.Helper.WriteLine(`Тип ставки - Фора. Параметр = ${match[2]}`);
      return window.stakeData.isLay
        ? -parseFloat(match[2])
        : parseFloat(match[2]);
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
