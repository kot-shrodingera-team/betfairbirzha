import { ri } from '@kot-shrodingera-team/config/util';
import { convertToLaySum } from '../coefficientConvertions';
import openBet from '../openBet';
import {
  cancelledBetsSelector,
  cancelUnmatchedAboveButtonSelector,
  matchedBetsSelector,
  unmatchedBetsSelector,
  openBetRefIdSelector,
  openBetSelector,
  openBetsTabSelector,
  receiptBetSizeSelector,
  unplacedBetsSelector,
} from '../selectors';
import { round } from '../util';
import { getActiveTab } from '../utils';

let couponLoadingState: string = null;
let refId: number = null;

const log = worker.Helper.WriteLine;

export const clearLoadingStakeData = (): void => {
  refId = 0;
  couponLoadingState = 'processing';
};

const getRefId = (): number => {
  const refIdElement = document.querySelector(openBetRefIdSelector);
  if (!refIdElement) {
    log('Не найден RefId ставки');
    return null;
  }
  const refIdMatch = refIdElement.textContent.trim().match(ri`^Ref: (\d+)$`);
  if (!refIdMatch) {
    log(`RefId в непонятном формате: ${refIdElement.textContent.trim()}`);
    return null;
  }
  return Number(refIdMatch[1]);
};

const fakeStake = (stakedSum: number): void => {
  window.stakeData.isFake = true;
  window.stakeData.fakeEvent = `${worker.TeamOne} - ${worker.TeamTwo}`;
  window.stakeData.fakeBetName = worker.BetName;
  window.stakeData.fakeSum = window.stakeData.isLay
    ? convertToLaySum(stakedSum, window.stakeData.rawCoefficient)
    : stakedSum;
  window.stakeData.fakeCoefficient = worker.StakeInfo.Coef;
};

// ======================================================================================

const processingHandler = (): boolean => {
  const spinner = document.querySelector('bf-spinner');
  const matchedBets = document.querySelector(matchedBetsSelector);
  const unmatchedBets = document.querySelector(unmatchedBetsSelector);
  const unplacedBets = document.querySelector(unplacedBetsSelector);

  if (spinner) {
    log('Обработка ставки (индикатор)');
    return true;
  }

  if (matchedBets && unmatchedBets) {
    log('Обработка ставки завершена (частичная ставка)');
    worker.TakeScreenShot(false);
    couponLoadingState = 'unmatched';
    return true;
  }

  if (matchedBets) {
    log('Обработка ставки завершена (ставка принята)');
    worker.TakeScreenShot(false);
    window.stakeData.stakePlaced = true;
    return false;
  }

  if (unmatchedBets) {
    log('Ставка не принята (Unmatched)');
    worker.TakeScreenShot(false);
    couponLoadingState = 'unmatched';
    return true;
  }

  if (unplacedBets) {
    log('Ставка не принята (Unplaced)');
    worker.TakeScreenShot(false);
    couponLoadingState = 'openBets';
    return true;
  }

  log('Обработка ставки (нет индикатора)');
  return true;
};

const unmatchedHandler = (): boolean => {
  refId = getRefId();
  const cancelUnmatchedAboveButton = document.querySelector(
    cancelUnmatchedAboveButtonSelector
  ) as HTMLElement;
  if (!cancelUnmatchedAboveButton) {
    log('Не найдена кнопка отмены ставки');
    // Отправить информ
    return false;
  }
  log('Отменяем ставку');
  cancelUnmatchedAboveButton.click();
  couponLoadingState = 'cancelling';
  return true;
};

const cancellingHandler = (): boolean => {
  const spinner = document.querySelector('bf-spinner');
  const cancelledBets = document.querySelector(cancelledBetsSelector);
  const unplacedBets = document.querySelector(unplacedBetsSelector);

  if (spinner) {
    log('Отмена ставки в процессе (индикатор)');
    return true;
  }

  if (cancelledBets) {
    log('Отмена ставки завершена (Cancelled)');
    worker.TakeScreenShot(false);
    couponLoadingState = 'openBets';
    return true;
  }

  if (unplacedBets) {
    log('Отмена ставки завершена (Unplaced)');
    worker.TakeScreenShot(false);
    couponLoadingState = 'openBets';
    return true;
  }

  log('Отмена ставки в процессе (нет индикатора)');
  return true;
};

const openBetsHandler = (): boolean => {
  const openBetsTab = document.querySelector(
    openBetsTabSelector
  ) as HTMLElement;
  if (!openBetsTab) {
    log('Не найдена вкладка открытых ставок');
    // информ ?
    return false;
  }
  log('Переходим на вкладку открытых ставок');
  openBetsTab.click();
  couponLoadingState = 'openBetsCheck';
  return true;
};

const openBetsCheckHandler = (): boolean => {
  const activeTab = getActiveTab();
  if (activeTab !== 'open') {
    log(`Открыта не вкладка открытых ставок (${activeTab})`);
    return true;
  }
  worker.TakeScreenShot(false);
  const cancelUnmatchedAboveButton = document.querySelector(
    cancelUnmatchedAboveButtonSelector
  ) as HTMLElement;
  if (cancelUnmatchedAboveButton) {
    log('Есть неотменённые ставки. Отменяем');
    cancelUnmatchedAboveButton.click();
    couponLoadingState = 'cancelling';
    return true;
  }
  couponLoadingState = 'getStakedSum';
  return true;
};

const getStakedSumHandler = (): boolean => {
  const openBets = [...document.querySelectorAll(openBetSelector)];
  if (openBets.length === 0) {
    log('Нет ставок в игре. Считаем ставку не принятой');
    couponLoadingState = 'reopenBet';
    return true;
  }
  if (!refId) {
    log(
      'refId текущей ставки не определён, невозможно определить сумму ставок в игре. Считаем ставку непринятой'
    );
    // информ ?
    couponLoadingState = 'reopenBet';
    return true;
  }
  const targetBets = openBets.filter((bet) => {
    const refIdElement = bet.querySelector(openBetRefIdSelector);
    if (!refIdElement) {
      log('Не найден refId открытой ставки');
      return false;
    }
    return ri`^Ref: ${String(refId)}$`.test(refIdElement.textContent.trim());
  });
  if (targetBets.length === 0) {
    log(`Нет ставкок в игре с refId "${refId}". Считаем ставку не принятой`);
    couponLoadingState = 'reopenBet';
    return true;
  }
  log(`Ставок в игре с refId "${refId}": ${targetBets.length}`);
  const stakedSum = round(
    targetBets.reduce((sum, nextBet, index) => {
      const nextBetSumElement = nextBet.querySelector(receiptBetSizeSelector);
      if (!nextBetSumElement) {
        log(`Не найдена сумма ставки в игре (индекс: ${index + 1})`);
        return sum;
      }
      return sum + Number(nextBetSumElement.textContent.slice(1).trim());
    }, 0)
  );
  log(`Сумма ставок в игре: ${stakedSum}`);
  log(
    `${window.stakeData.isLay ? '(Lay) ' : ''}Ставилось: ${
      window.stakeData.sum
    }, поставилось: ${stakedSum}`
  );
  if (stakedSum === 0) {
    log('Сумма ставок в игре равна 0. Ставка не принята');
    couponLoadingState = 'reopenBet';
    return true;
  }
  if (stakedSum === window.stakeData.sum) {
    log('Сумма ставок в игре равна совпадает с желаемой. Ставка принята');
    window.stakeData.stakePlaced = true;
    return false;
  }
  if (stakedSum > window.stakeData.sum) {
    log('Сумма ставок в игре больше желаемой. Считаем ставку принятой');
    // информ
    window.stakeData.stakePlaced = true;
    return false;
  }
  log('Сумма ставок в игре равна не совпадает. Ставка принята частично');
  fakeStake(stakedSum);
  return false;
};

const reopenBetHandler = (): boolean => {
  log('Переоткрываем купон');
  openBet();
  couponLoadingState = 'reopenBetCheck';
  return true;
};

const reopenBetCheckHandler = (): boolean => {
  if (window.stakeData.openningBet) {
    return true;
  }
  log('Купон переоткрыт');
  return false;
};

const checkCouponLoading = (): boolean => {
  if (window.stakeData.isFake) {
    return false;
  }
  if (couponLoadingState === 'processing') {
    return processingHandler();
  }
  if (couponLoadingState === 'unmatched') {
    return unmatchedHandler();
  }
  if (couponLoadingState === 'cancelling') {
    return cancellingHandler();
  }
  if (couponLoadingState === 'openBets') {
    return openBetsHandler();
  }
  if (couponLoadingState === 'openBetsCheck') {
    return openBetsCheckHandler();
  }
  if (couponLoadingState === 'getStakedSum') {
    return getStakedSumHandler();
  }
  if (couponLoadingState === 'reopenBet') {
    return reopenBetHandler();
  }
  if (couponLoadingState === 'reopenBetCheck') {
    return reopenBetCheckHandler();
  }
  log(`Неизвестное состояние обработки (${couponLoadingState})`);
  log(`Обработка ставки завершена`);
  return false;
};

export default checkCouponLoading;
