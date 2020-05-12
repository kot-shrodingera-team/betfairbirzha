import { getElement } from '@kot-shrodingera-team/config/util';
import {
  receiptSelector,
  matchedBetsSelector,
  unmatchedBetsSelector,
  cancelledBetsSelector,
  unplacedBetsSelector,
  spinnerSelector,
  cancelUnmatchedAboveButtonSelector,
  spinnerInvertSelector,
  receiptBetSizeSelector,
} from '../selectors';
import { getBalance } from '../getInfo';
import { round } from '../util';
import { convertToLaySum } from '../coefficientConvertions';
import { getCurrentLiability } from './doStake';

const enum StakePlaceResult {
  NOT_PLACED = 0,
  MATCHED = 1,
  PARTIAL = 2,
  UNMATCHED = 3,
  ERROR = 4,
}

const enum StakeCancellationResult {
  FULL = 1,
  PARTIAL = 2,
  MATCHED = 3,
  ERROR = 4,
}

const getStakePlaceResult = (): StakePlaceResult => {
  if (document.querySelector(receiptSelector)) {
    const matchedBets = document.querySelector(matchedBetsSelector);
    const unmatchedBets = document.querySelector(unmatchedBetsSelector);
    if (matchedBets && !unmatchedBets) {
      worker.Helper.WriteLine(`Полная ставка`);
      return StakePlaceResult.MATCHED;
    }
    if (matchedBets && unmatchedBets) {
      worker.Helper.WriteLine(`Частичная ставка`);
      return StakePlaceResult.PARTIAL;
    }
    if (!matchedBets && unmatchedBets) {
      worker.Helper.WriteLine(`Непарная ставка`);
      return StakePlaceResult.UNMATCHED;
    }
    worker.Helper.WriteLine(
      'Ошибка получения результата принятия ставки: Не найдены ни принятые, ни непринятые ставки'
    );
    return StakePlaceResult.ERROR;
  }
  worker.Helper.WriteLine(
    'Ошибка получения результата принятия ставки: Не найден чек ставки'
  );
  return StakePlaceResult.ERROR;
};

const getCancellationResult = (): StakeCancellationResult => {
  if (document.querySelector(receiptSelector)) {
    const cancelledBets = document.querySelector(cancelledBetsSelector);
    const unplacedBets = document.querySelector(unplacedBetsSelector);
    if (unplacedBets && cancelledBets) {
      worker.Helper.WriteLine(
        `Ошибка получения результата отмены ставки: Одновременно отменённые и неразмещённые ставки`
      );
      return StakeCancellationResult.ERROR;
    }
    if (unplacedBets) {
      // const receiptError = unplacedBets.querySelector(receiptErrorSelector);
      // if (!receiptError) {
      //     worker.Helper.WriteLine(`Ошибка получения результата отмены ставки: Нет сообщения об ошибке неразмещённой ставки`);
      //     return StakeCancellationResult.ERROR;
      // }
      // if (receiptError.textContent.trim() !== 'This bet may have lapsed or been matched') {
      //     worker.Helper.WriteLine(`Ошибка получения результата отмены ставки: Сообщение об ошибке не равно 'This bet may have lapsed or been matched'`);
      //     return StakeCancellationResult.ERROR;
      // }
      return StakeCancellationResult.MATCHED;
    }
    if (cancelledBets) {
      // let cancelledBetSize;
      // if (window.stakeData.isNewBetslip) {
      const currentLiability = getCurrentLiability();
      const currentBalance = getBalance();
      worker.Helper.WriteLine(`Текущее обязательство: ${currentLiability}`);
      worker.Helper.WriteLine(`Текущий баланс: ${currentBalance}`);
      // if (currentLiability === window.stakeData.liability) {
      //     cancelledBetSize = window.stakeData.cancelSum;
      // } else {
      //     cancelledBetSize = round(window.stakeData.cancelSum - (currentLiability - window.stakeData.liability));
      // }
      const cancelledBetSize = round(
        window.stakeData.cancelSum -
          (window.stakeData.balanceBeforeStake - currentBalance)
      );
      // cancelledBetSize = round(currentBalance - window.stakeData.balanceBeforeCancel);
      worker.Helper.WriteLine(
        `Обязательство до отмены: ${window.stakeData.liability}, после: ${currentLiability}`
      );
      worker.Helper.WriteLine(
        `Баланс до ставки: ${window.stakeData.balanceBeforeStake}, после: ${currentBalance}`
      );
      // } else {
      //     let cancelledBetSizeElement = cancelledBets.querySelector(receiptBetSizeSelector);
      //     if (!cancelledBetSizeElement) {
      //         worker.Helper.WriteLine('Ошибка получения результата отмены ставки: Не найдены отменённые ставки');
      //         return StakeCancellationResult.ERROR;
      //     }
      //     let cancelledBetSizeText = cancelledBetSizeElement.textContent;
      //     let match = cancelledBetSizeText.match(/[$€](\d+\.\d+)/);
      //     if (!match) {
      //         worker.Helper.WriteLine(`Ошибка получения результата отмены ставки: Некорректный формат суммы отменённой части - ${cancelledBetSizeText}`);
      //         return StakeCancellationResult.ERROR;
      //     }
      //     cancelledBetSize = parseFloat(match[1]);
      //     if (window.stakeData.isLay) {
      //         cancelledBetSize = convertToLaySum(cancelledBetSize, window.stakeData.rawCoefficient);
      //     }
      // }
      worker.Helper.WriteLine(
        `Отменялось: ${window.stakeData.cancelSum}, отменилось: ${cancelledBetSize}`
      );
      if (cancelledBetSize === window.stakeData.cancelSum) {
        worker.Helper.WriteLine(`Полная отмена`);
        return StakeCancellationResult.FULL;
      }
      worker.Helper.WriteLine(`Частичная отмена`);
      if (window.stakeData.fakeSum !== 0) {
        worker.Helper.WriteLine(
          `Уже была частичная проставка (${window.stakeData.fakeSum})`
        );

        window.stakeData.fakeSum = round(
          window.stakeData.fakeSum +
            window.stakeData.cancelSum -
            cancelledBetSize
        );
      } else {
        window.stakeData.fakeSum = round(
          window.stakeData.cancelSum - cancelledBetSize
        );
      }
      worker.Helper.WriteLine(
        `Реально проставлено: ${window.stakeData.fakeSum}`
      );
      return StakeCancellationResult.PARTIAL;
    }
    worker.Helper.WriteLine(
      'Ошибка получения результата отмены ставки: Не найдены ни отменённые, ни неразмещённые ставки'
    );
    return StakeCancellationResult.ERROR;
  }
  worker.Helper.WriteLine(
    'Ошибка получения результата отмены ставки: Не найден чек ставки'
  );
  return StakeCancellationResult.ERROR;
};

const isSpinnerVisible = (): boolean => {
  return Boolean(document.querySelector(spinnerSelector));
};

let unmatchedCancelled = false;
let partialCancelled = false;
let cancelResult = false;
let cancellationWaited = false;

let stakePlaceResultTest: StakePlaceResult;

const checkCouponLoading = (): boolean => {
  console.log('checkCouponLoading()');
  if (unmatchedCancelled) {
    worker.TakeScreenShot(true);
    if (cancelResult === null) {
      worker.Helper.WriteLine(
        'Ошибка отмены ставки: результат так и не появился'
      );
      window.stakeData.isCancelling = false;
      window.stakeData.isCancelled = true;
      window.stakeData.enabled = false;
      const message =
        `Зависла отмена в БФ (возможно неперекрытая)\n` +
        `Lay: ${window.stakeData.isLay ? 'Да' : 'Нет'}\n` +
        `Событие: '${worker.TeamOne} - ${worker.TeamTwo}'\n` +
        `Ставка: ${worker.BetName}\n` +
        `Отменялось: ${window.stakeData.cancelSum}\n` +
        `Коэффициент(с учётом комиссии): ${worker.StakeInfo.Coef}\n`;
      worker.Helper.WriteLine(message);
      worker.Helper.SendInformedMessage(message);
      return false;
    }
    if (window.stakeData.isNewBetslip && !cancellationWaited) {
      worker.Helper.WriteLine('Пауза после отмены');
      cancellationWaited = true;
      return true;
    }

    window.stakeData.isCancelling = false;
    window.stakeData.isCancelled = true;
    const cancellationResult = getCancellationResult();
    if (cancellationResult === StakeCancellationResult.ERROR) {
      // worker.Helper.WriteLine('Ошибка отмены ставки');
      window.stakeData.enabled = false;
    } else if (cancellationResult === StakeCancellationResult.FULL) {
      // worker.Helper.WriteLine(`Полная отмена`);
      window.currentStakeButton.click();
    } else if (cancellationResult === StakeCancellationResult.MATCHED) {
      window.stakeData.stakePlaced = true;
    } else if (cancellationResult === StakeCancellationResult.PARTIAL) {
      window.stakeData.isFake = true;
      window.stakeData.fakeEvent = `${worker.TeamOne} - ${worker.TeamTwo}`;
      window.stakeData.fakeBetName = worker.BetName;
      window.stakeData.fakeCoefficient = worker.StakeInfo.Coef;
    }
    unmatchedCancelled = false;
  } else if (partialCancelled) {
    worker.TakeScreenShot(true);
    if (cancelResult === null) {
      worker.Helper.WriteLine(
        'Ошибка отмены ставки: результат так и не появился'
      );
      window.stakeData.isCancelling = false;
      window.stakeData.isCancelled = true;
      window.stakeData.enabled = false;
      const message =
        `Зависла отмена в БФ (возможно неперекрытая)\n` +
        `Lay: ${window.stakeData.isLay ? 'Да' : 'Нет'}\n` +
        `Событие: '${worker.TeamOne} - ${worker.TeamTwo}'\n` +
        `Ставка: ${worker.BetName}\n` +
        `Отменялось: ${window.stakeData.cancelSum}\n` +
        `Коэффициент(с учётом комиссии): ${worker.StakeInfo.Coef}\n`;
      worker.Helper.WriteLine(message);
      worker.Helper.SendInformedMessage(message);
      return false;
    }
    if (window.stakeData.isNewBetslip && !cancellationWaited) {
      worker.Helper.WriteLine('Пауза после отмены');
      cancellationWaited = true;
      return true;
    }
    window.stakeData.isCancelling = false;
    window.stakeData.isCancelled = true;
    const cancellationResult = getCancellationResult();
    if (cancellationResult === StakeCancellationResult.ERROR) {
      // worker.Helper.WriteLine('Ошибка отмены ставки');
    } else if (cancellationResult === StakeCancellationResult.FULL) {
      // worker.Helper.WriteLine(`Полная отмена`);
    } else if (cancellationResult === StakeCancellationResult.MATCHED) {
      window.stakeData.stakePlaced = true;
    } else if (cancellationResult === StakeCancellationResult.PARTIAL) {
      //
    }
    partialCancelled = false;
  }
  if (window.stakeData.isCancelling && window.stakeData.isNewBetslip) {
    const currentLiability = getCurrentLiability();
    // const currentBalance = getBalance();
    if (currentLiability - window.stakeData.liability > 0) {
      // if (window.stakeData.balanceBefore - currentBalance > 0) {
      if (
        round(currentLiability - window.stakeData.liability) ===
        window.stakeData.sum
      ) {
        // if (round(window.stakeData.balanceBefore - currentBalance) === window.stakeData.sum) {
        if (stakePlaceResultTest === StakePlaceResult.UNMATCHED) {
          window.stakeData.isCancelling = false;
          window.stakeData.isCancelled = false;
          window.stakeData.stakePlaced = true;
          const message =
            `Зависла отмена в БФ (учтена, как принятая)\n` +
            `Lay: ${window.stakeData.isLay ? 'Да' : 'Нет'}\n` +
            `Событие: '${worker.TeamOne} - ${worker.TeamTwo}'\n` +
            `Ставка: ${worker.BetName}\n` +
            `Сумма: ${window.stakeData.sum}\n` +
            `Коэффициент(с учётом комиссии): ${worker.StakeInfo.Coef}\n`;
          worker.Helper.WriteLine(message);
          worker.Helper.SendInformedMessage(message);
          return false;
        }
      }
    }
  }
  if (window.stakeData.isCancelling) {
    worker.Helper.WriteLine('Ставка отменяется');
    return true;
  }
  if (window.stakeData.isCancelled) {
    window.stakeData.isCancelled = false;
    return false;
  }
  if (window.stakeData.isFake) {
    return false;
  }
  if (!window.stakeData.isCheckDelayed) {
    worker.Helper.WriteLine('Задержка обработки');
    window.stakeData.isCheckDelayed = true;
    return true;
  }
  if (isSpinnerVisible()) {
    worker.Helper.WriteLine('Обработка');
    return true;
  }
  worker.Helper.WriteLine('Обработка ставки завершена');
  const stakePlaceResult = getStakePlaceResult();
  stakePlaceResultTest = stakePlaceResult;
  if (stakePlaceResult === StakePlaceResult.ERROR) {
    worker.Helper.WriteLine('Ошибка ставки');
    window.stakeData.enabled = false;
    return false;
  }
  if (stakePlaceResult === StakePlaceResult.MATCHED) {
    worker.Helper.WriteLine('Ставка принята');
    window.stakeData.stakePlaced = true;
    return false;
  }
  if (stakePlaceResult === StakePlaceResult.UNMATCHED) {
    worker.TakeScreenShot(true);
    worker.Helper.WriteLine(`Ставка не принята, отменяем ставку`);
    const cancelUnmatchedAboveButton = document.querySelector(
      cancelUnmatchedAboveButtonSelector
    ) as HTMLElement;
    if (!cancelUnmatchedAboveButton) {
      worker.Helper.WriteLine('Не найдена кнопка отмены ставки');
      window.stakeData.enabled = false;
      return false;
    }
    window.stakeData.balanceBeforeCancel = getBalance();
    // worker.Helper.WriteLine(`Текущее обязательство: ${window.stakeData.liability}`);
    worker.Helper.WriteLine(
      `Баланс до отмены: ${window.stakeData.balanceBeforeCancel}`
    );
    worker.Helper.WriteLine('Нажали на отмену ставки');
    cancelUnmatchedAboveButton.click();
    cancellationWaited = false;
    window.stakeData.isCancelling = true;
    window.stakeData.cancelSum = window.stakeData.sum;
    getElement(spinnerInvertSelector, 15000).then((result) => {
      unmatchedCancelled = true;
      cancelResult = Boolean(result);
      // worker.TakeScreenShot(true);
      // if (result === null) {
      //     worker.Helper.WriteLine('Ошибка отмены ставки: результат так и не появился');
      // }
      // window.stakeData.isCancelling = false;
      // window.stakeData.isCancelled = true;
      // let cancellationResult = getCancellationResult();
      // if (cancellationResult === StakeCancellationResult.ERROR) {
      //     // worker.Helper.WriteLine('Ошибка отмены ставки');
      //     window.stakeData.enabled = false;
      // } else if (cancellationResult === StakeCancellationResult.FULL) {
      //     // worker.Helper.WriteLine(`Полная отмена`);
      //     currentStakeButton.click();
      // } else if (cancellationResult === StakeCancellationResult.MATCHED) {
      //     window.stakeData.stakePlaced = true;
      // } else if (cancellationResult === StakeCancellationResult.PARTIAL) {
      //     window.stakeData.isFake = true;
      //     window.stakeData.fakeEvent = `${worker.TeamOne} - ${worker.TeamTwo}`;
      //     window.stakeData.fakeCoefficient = worker.StakeInfo.Coef;
      // }
    });
    return true;
  }
  if (stakePlaceResult === StakePlaceResult.PARTIAL) {
    worker.TakeScreenShot(true);
    worker.Helper.WriteLine(`Ставка принято частично`);
    const matchedBets = document.querySelector(matchedBetsSelector);
    const matchedBetSizeElement = matchedBets.querySelector(
      receiptBetSizeSelector
    );
    if (!matchedBetSizeElement) {
      worker.Helper.WriteLine(
        'Ошибка получения результата принятия ставки: Не найдена сумма проставленной части'
      );
      window.stakeData.enabled = false;
      return false;
    }
    const matchedBetSizeText = matchedBetSizeElement.textContent;
    const match = matchedBetSizeText.match(/[$€](\d+\.\d+)/);
    if (!match) {
      worker.Helper.WriteLine(
        `Ошибка получения результата принятия ставки: Некорректный формат суммы принятой части - ${matchedBetSizeText}`
      );
      return false;
    }
    let matchedBetSize = parseFloat(match[1]);
    if (window.stakeData.isLay) {
      matchedBetSize = convertToLaySum(
        matchedBetSize,
        window.stakeData.rawCoefficient
      );
    }
    worker.Helper.WriteLine(`Принято: ${matchedBetSize}`);
    window.stakeData.isFake = true;
    window.stakeData.fakeEvent = `${worker.TeamOne} - ${worker.TeamTwo}`;
    window.stakeData.fakeBetName = worker.BetName;
    window.stakeData.fakeSum = matchedBetSize;
    window.stakeData.fakeCoefficient = worker.StakeInfo.Coef;
    const cancelUnmatchedAboveButton = document.querySelector(
      cancelUnmatchedAboveButtonSelector
    ) as HTMLElement;
    if (!cancelUnmatchedAboveButton) {
      worker.Helper.WriteLine('Не найдена кнопка отмены ставки');
    } else {
      // window.stakeData.liability = getCurrentLiability();
      window.stakeData.balanceBeforeCancel = getBalance();
      // worker.Helper.WriteLine(`Текущее обязательство: ${window.stakeData.liability}`);
      worker.Helper.WriteLine(
        `Баланс до отмены: ${window.stakeData.balanceBeforeCancel}`
      );
      worker.Helper.WriteLine('Нажали на отмену ставки');
      cancelUnmatchedAboveButton.click();
      cancellationWaited = false;
      window.stakeData.isCancelling = true;
      window.stakeData.cancelSum = round(
        window.stakeData.sum - window.stakeData.fakeSum
      );
      getElement(spinnerInvertSelector, 15000).then((result) => {
        partialCancelled = true;
        cancelResult = Boolean(result);
        // worker.TakeScreenShot(true);
        // if (result === null) {
        //     worker.Helper.WriteLine('Ошибка отмены ставки: результат так и не появился');
        // }
        // window.stakeData.isCancelling = false;
        // window.stakeData.isCancelled = true;
        // let cancellationResult = getCancellationResult();
        // if (cancellationResult === StakeCancellationResult.ERROR) {
        //     // worker.Helper.WriteLine('Ошибка отмены ставки');
        // } else if (cancellationResult === StakeCancellationResult.FULL) {
        //     // worker.Helper.WriteLine(`Полная отмена`);
        // } else if (cancellationResult === StakeCancellationResult.MATCHED) {
        //     window.stakeData.stakePlaced = true;
        // } else if (cancellationResult === StakeCancellationResult.PARTIAL) {
        // }
      });
      return true;
    }
    return false;
  }
  return true;
};

export default checkCouponLoading;
