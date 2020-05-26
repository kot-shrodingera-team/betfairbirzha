export const loginInputSelector = 'input#ssc-liu';
export const passwordInputSelector = 'input#ssc-lipw';
export const signInButtonSelector = 'input#ssc-lis';
export const accountPanelSelector = 'form.ssc-lof';
export const balanceElementSelector = '.ssc-wla[rel="main"]';
export const languageIconSelector = '.ssc-lsf';
export const englishIconClass = 'ssc-fen_gb';
export const englishIconSelector = '.ssc-en_GB';
export const liabilitySelector = '.main-mv-container .cashout-liability-value';
export const competitionSelector = '.COMP';
export const eventSelector = '.EVENT';
export const newBetslipSelector = 'betslip';
export const cancelAllSelectionsButtonSelector =
  '[on-click="$ctrl.onCancelBetsClick()"] > button, bf-betslip:not(.ng-hide) button[ng-click="potentialsCtrl.events.clearSelections()"]';
export const betsSelector =
  'betslip-potential-bet, bf-betslip:not(.ng-hide) ul.bet-wrapper > li';
export const coefficientInputSelector =
  'input[ng-model="$ctrl.price"], bf-betslip:not(.ng-hide) input[ng-model="bet.price"]';
export const stakeSumInputSelector =
  'input[ng-model="$ctrl.size"], bf-betslip:not(.ng-hide) input[ng-model="bet.size"]';
export const betNameSelector =
  'span[ng-bind="$ctrl.bet.runner.name"], bf-betslip:not(.ng-hide) span.bet-runner-name';
export const betConfirmCheckboxSelector =
  'input[type="checkbox"][ng-model="$ctrl.verifyBet"], bf-betslip:not(.ng-hide) input[type="checkbox"][ng-model="betslipCtrl.data.betslipContext.preferences.displayConfirmation"]';
export const submitButtonSelector =
  '[on-click="$ctrl.onPlaceBetsClick()"] > button, bf-betslip:not(.ng-hide) button[ng-click="potentialsCtrl.events.placeBetsHandler(true)"]';
export const receiptSelector =
  'receipt, bf-betslip:not(.ng-hide) [subpane-id="RECEIPT"].active';
export const matchedBetsSelector =
  'receipt .receipt__matched-bets, bf-betslip:not(.ng-hide) [subpane-id="RECEIPT"] .matched-wrapper';
export const unmatchedBetsSelector =
  'receipt .receipt__unmatched-bets, bf-betslip:not(.ng-hide) [subpane-id="RECEIPT"] .unmatched-wrapper';
export const cancelledBetsSelector =
  'receipt .receipt__cancelled-bets, bf-betslip:not(.ng-hide) [subpane-id="RECEIPT"] .cancelled-wrapper';
export const unplacedBetsSelector =
  'receipt .receipt__unplaced-bets, bf-betslip:not(.ng-hide) [subpane-id="RECEIPT"] .unplaced-wrapper';
export const spinnerSelector =
  'countdown, bf-betslip:not(.ng-hide) [subpane-id="LOADING"].active';
// export const spinnerInvertSelector = 'betslip [ng-switch-when]:not([ng-switch-when="LOADING"]), bf-betslip:not(.ng-hide) [subpane-id="LOADING"]:not(.active)';
export const spinnerInvertSelector =
  'receipt, bf-betslip:not(.ng-hide) [subpane-id="LOADING"]:not(.active)';
export const cancelUnmatchedAboveButtonSelector =
  // '[on-click="$ctrl.onCancelAllAbove()"] > button, bf-betslip:not(.ng-hide) button[ng-click="receiptCtrl.events.cancelUnmatchedBetsOnReceipt()"]';
  '[on-click="$ctrl.onCancelBetsClick()"] > button, [on-click="$ctrl.onCancelAllAbove()"] > button, bf-betslip:not(.ng-hide) button[ng-click="receiptCtrl.events.cancelUnmatchedBetsOnReceipt()"]';
export const receiptErrorSelector =
  'betslip-error-message, bf-betslip:not(.ng-hide) .receipt-error';
export const receiptBetSizeSelector =
  '.betslip-bet__runner-detail:nth-child(2), bf-betslip:not(.ng-hide) .bet-size';
export const openBetsTabSelector =
  '.OPEN, bf-betslip:not(.ng-hide) #betslip-tab-open > div';
export const openBetSelector = 'betslip-bet, bf-betslip:not(.ng-hide) .bet';
export const openBetRefIdSelector =
  '.bet-placed-information__reference, bf-betslip:not(.ng-hide) .bet-ref';
