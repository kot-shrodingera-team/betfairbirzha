import { ri } from '@kot-shrodingera-team/config/util';
import {
  receiptSelector,
  matchedBetsSelector,
  unmatchedBetsSelector,
  cancelUnmatchedAboveButtonSelector,
  receiptBetSizeSelector,
  openBetsTabSelector,
  openBetSelector,
  openBetRefIdSelector,
  cancelledBetsSelector,
  unplacedBetsSelector,
} from '../selectors';
import { convertToLaySum } from '../coefficientConvertions';
import { round } from '../util';

const enum StakePlaceResult {
  NOT_PLACED = 0,
  MATCHED = 1,
  PARTIAL = 2,
  UNMATCHED = 3,
  ERROR = 4,
}

let refId = 0;
let isCancelling = false;
let loadingCount = 0;
let openBetsDelay = false;
let stakePlaceResult = StakePlaceResult.ERROR;
let partialStakeNoOpenBetsCounter = 0;
let cancelledUnplaced = false;

export const clearLoadingStakeData = (): void => {
  refId = 0;
  isCancelling = false;
  loadingCount = 0;
  openBetsDelay = false;
  stakePlaceResult = StakePlaceResult.ERROR;
  partialStakeNoOpenBetsCounter = 0;
  cancelledUnplaced = false;
};

export const clearLoadingCount = (): void => {
  loadingCount = 0;
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

const getRefId = (): number => {
  const refIdElement = document.querySelector(openBetRefIdSelector);
  if (!refIdElement) {
    worker.Helper.WriteLine('Не найден RefId ставки');
    window.stakeData.enabled = false;
    return null;
  }
  const refIdMatch = refIdElement.textContent.trim().match(ri`^Ref: (\d+)$`);
  if (!refIdMatch) {
    worker.Helper.WriteLine(
      `RefId в непонятном формате: ${refIdElement.textContent.trim()}`
    );
    window.stakeData.enabled = false;
    return null;
  }
  return Number(refIdMatch[1]);
};

const getStakePlaceResult = (): StakePlaceResult => {
  if (document.querySelector(receiptSelector)) {
    const matchedBets = document.querySelector(matchedBetsSelector);
    const unmatchedBets = document.querySelector(unmatchedBetsSelector);
    const unplacedBets = document.querySelector(unplacedBetsSelector);
    if (matchedBets && !unmatchedBets) {
      worker.Helper.WriteLine(`matchedBets`);
      return StakePlaceResult.MATCHED;
    }
    if (matchedBets && unmatchedBets) {
      worker.Helper.WriteLine(`matchedBets && unmatchedBets`);
      return StakePlaceResult.PARTIAL;
    }
    if (!matchedBets && unmatchedBets) {
      worker.Helper.WriteLine(`unmatchedBets`);
      return StakePlaceResult.UNMATCHED;
    }
    if (unplacedBets) {
      worker.Helper.WriteLine(`Unplaced Bets`);
      return StakePlaceResult.UNMATCHED;
    }
    worker.Helper.WriteLine(
      'Ошибка получения результата принятия ставки: Не найдены ни принятые, ни непринятые ставки'
    );
    return StakePlaceResult.ERROR;
  }
  return StakePlaceResult.ERROR;
};

const isCancelCompleted = (): boolean => {
  if (document.querySelector(receiptSelector)) {
    worker.Helper.WriteLine('Receipt');
    const cancelledBets = document.querySelector(cancelledBetsSelector);
    const unplacedBets = document.querySelector(unplacedBetsSelector);
    if (cancelledBets) {
      worker.Helper.WriteLine('CancelledBets');
    }
    if (unplacedBets) {
      worker.Helper.WriteLine('UnplacedBets');
    }
    return Boolean(cancelledBets) || Boolean(unplacedBets);
  }
  return false;
};

const goToOpenBets = (): boolean => {
  const openBetsTab = document.querySelector(
    openBetsTabSelector
  ) as HTMLElement;
  if (!openBetsTab) {
    worker.Helper.WriteLine('Не найдена вкладка открытых ставок');
    return false;
  }
  openBetsTab.click();
  return true;
};

const cancellUnmatchedBets = (): boolean => {
  const cancelUnmatchedAboveButton = document.querySelector(
    cancelUnmatchedAboveButtonSelector
  ) as HTMLElement;
  if (!cancelUnmatchedAboveButton) {
    worker.Helper.WriteLine('Не найдена кнопка отмены ставки');
    return false;
  }
  worker.Helper.WriteLine('Нажали на отмену ставки');
  cancelUnmatchedAboveButton.click();
  clearLoadingCount();
  return true;
};

const getStakedSum = (): number => {
  const openBets = [...document.querySelectorAll(openBetSelector)];
  if (openBets.length === 0) {
    worker.Helper.WriteLine('Нет ставок в игре');
    return 0;
  }
  console.log('openBets');
  console.log(openBets);
  openBets.every((bet) => console.log(bet.outerHTML));
  const targetBets = openBets.filter((bet) => {
    const refIdElement = bet.querySelector(openBetRefIdSelector);
    if (!refIdElement) {
      worker.Helper.WriteLine('Не найден refId открытой ставки');
      return false;
    }
    return ri`^Ref: ${String(refId)}$`.test(refIdElement.textContent.trim());
  });
  console.log('targetBets');
  console.log(targetBets);
  if (targetBets.length === 0) {
    worker.Helper.WriteLine(`Нет ставки в игре с refId ${refId}`);
    return 0;
  }
  worker.Helper.WriteLine('Есть ставка в игре');
  const stakeSum = round(
    targetBets.reduce((sum, nextBet, index) => {
      const nextBetSumElement = nextBet.querySelector(receiptBetSizeSelector);
      if (!nextBetSumElement) {
        worker.Helper.WriteLine(`Не найдена сумма ${index + 1} ставки в игре`);
        return sum;
      }
      return sum + Number(nextBetSumElement.textContent.slice(1).trim());
    }, 0)
  );
  worker.Helper.WriteLine(`Сумма ставки в игре: ${stakeSum}`);
  return stakeSum;
};

const checkCouponLoading = (): boolean => {
  if (openBetsDelay) {
    openBetsDelay = false;
    const stakedSum = getStakedSum();
    worker.Helper.WriteLine(
      `${window.stakeData.isLay ? '(Lay) ' : ''}Ставилось: ${
        window.stakeData.sum
      }, поставилось: ${stakedSum}`
    );
    if (isCancelling) {
      isCancelling = false;
      if (stakedSum === 0) {
        if (cancelledUnplaced) {
          worker.Helper.WriteLine(
            'Ставок в игре нет, но была ошибка Unplaced Bets. Считаем ставку принятой'
          );
          window.stakeData.stakePlaced = true;
          return false;
        }
        worker.Helper.WriteLine('Ставка полностью отменилась');
        window.currentStakeButton.click();
        window.stakeData.isFake = false; // Могло ли быть true до этого?
      } else if (stakedSum === window.stakeData.sum) {
        worker.Helper.WriteLine('Ставка полностью принята');
        window.stakeData.stakePlaced = true;
      } else {
        worker.Helper.WriteLine('Ставка принята частично');
        fakeStake(stakedSum);
      }
      return false;
    }
    if (stakePlaceResult === StakePlaceResult.MATCHED) {
      if (stakedSum !== window.stakeData.sum) {
        worker.Helper.WriteLine(`${stakedSum} !== ${window.stakeData.sum}`);
      }
      window.stakeData.stakePlaced = true;
      return false;
    }
    if (stakePlaceResult === StakePlaceResult.PARTIAL) {
      if (stakedSum === 0) {
        if (partialStakeNoOpenBetsCounter === 10) {
          worker.Helper.WriteLine(
            'Ставки так и не появились, считаем ставку не сделанной'
          );
          return false;
        }
        worker.Helper.WriteLine(
          'Нет ставок, хотя была частичная проставка. Ожидаем ещё'
        );
        partialStakeNoOpenBetsCounter += 1;
        openBetsDelay = true;
        return true;
      }
      if (stakedSum === window.stakeData.sum) {
        window.stakeData.stakePlaced = true;
        return false;
      }
      fakeStake(stakedSum);
      if (!cancellUnmatchedBets()) {
        window.stakeData.enabled = false;
        return false;
      }
      isCancelling = true;
      return true;
    }
    if (stakePlaceResult === StakePlaceResult.ERROR) {
      if (stakedSum === window.stakeData.sum) {
        window.stakeData.stakePlaced = true;
        return false;
      }
      fakeStake(stakedSum);
      if (!cancellUnmatchedBets()) {
        window.stakeData.enabled = false;
        return false;
      }
      isCancelling = true;
      return true;
    }
  }

  loadingCount += 1;

  if (isCancelling) {
    if (loadingCount > 200) {
      worker.Helper.WriteLine('Зависла отмена. Переходим к открытым ставкам');
      if (!goToOpenBets()) {
        window.stakeData.enabled = false;
        return false;
      }
      openBetsDelay = true;
      return true;
    }
    const completed = isCancelCompleted();
    if (!completed) {
      worker.Helper.WriteLine('Ставка отменяется');
      return true;
    }
    if (document.querySelector(unplacedBetsSelector)) {
      cancelledUnplaced = true;
    }
    worker.Helper.WriteLine(
      'Отмена ставки завершена. Переходим к открытым ставкам'
    );
    worker.TakeScreenShot(false);
    // isCancelling = false;

    if (!goToOpenBets()) {
      window.stakeData.enabled = false;
      return false;
    }
    openBetsDelay = true;
    return true;
  }

  if (window.stakeData.isFake) {
    return false;
  }

  stakePlaceResult = getStakePlaceResult();
  if (stakePlaceResult === StakePlaceResult.ERROR) {
    if (loadingCount > 200) {
      worker.Helper.WriteLine(
        'Зависла обработка. Переходим к открытым ставкам'
      );
      worker.TakeScreenShot(false);
      if (!goToOpenBets()) {
        window.stakeData.enabled = false;
        return false;
      }
      openBetsDelay = true;
      return true;
    }
    worker.Helper.WriteLine('Обработка ставки');
    return true;
  }
  worker.Helper.WriteLine('Обработка ставки завершена');
  worker.TakeScreenShot(false);
  if (stakePlaceResult === StakePlaceResult.MATCHED) {
    worker.Helper.WriteLine('Ставка принята');
    refId = getRefId();
    if (refId) {
      if (goToOpenBets()) {
        worker.Helper.WriteLine('Переходим к открытым ставкам');
        openBetsDelay = true;
        return true;
      }
    } else {
      worker.Helper.WriteLine('Не найден refId');
    }
    window.stakeData.stakePlaced = true;
    return false;
  }
  if (stakePlaceResult === StakePlaceResult.UNMATCHED) {
    if (document.querySelector(unplacedBetsSelector)) {
      window.currentStakeButton.click();
      return false;
    }
    worker.Helper.WriteLine(`Ставка не принята, отменяем ставку`);
    refId = getRefId();
    if (!refId) {
      worker.Helper.WriteLine('Ошибка определения RefId');
      window.stakeData.enabled = false;
      return false;
    }
    if (!cancellUnmatchedBets()) {
      window.stakeData.enabled = false;
      return false;
    }
    isCancelling = true;
    return true;
  }
  if (stakePlaceResult === StakePlaceResult.PARTIAL) {
    worker.Helper.WriteLine(`Ставка принято частично, отменяем остаток`);
    refId = getRefId();
    if (!refId) {
      worker.Helper.WriteLine('Ошибка определения RefId');
      window.stakeData.enabled = false;
      return false;
    }
    if (!cancellUnmatchedBets()) {
      window.stakeData.enabled = false;
      return false;
    }
    isCancelling = true;
    return true;
  }
  worker.Helper.WriteLine(`Неизвестный результат ставки`);
  return false;
};

export default checkCouponLoading;
