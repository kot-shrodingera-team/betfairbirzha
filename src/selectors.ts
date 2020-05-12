export const loginInputSelector = 'input#ssc-liu';
export const passwordInputSelector = 'input#ssc-lipw';
export const signInButtonSelector = 'input#ssc-lis';
export const accountPanelSelector = 'form.ssc-lof';
export const balanceElementSelector = '.ssc-wla[rel="main"]';
export const languageIconSelector = '.ssc-lsf';
export const englishIconClass = 'ssc-fGB';
export const englishIconSelector = '.ssc-GBR';
export const liabilitySelector = '.main-mv-container .cashout-liability-value';
export const competitionSelector = '.COMP';
export const eventSelector = '.EVENT';
export const newBetslipSelector = 'betslip';
export const cancelAllSelectionsButtonSelector =
  '[on-click="$ctrl.onCancelBetsClick()"] > button, button[ng-click="potentialsCtrl.events.clearSelections()"]';
export const betsSelector = 'betslip-potential-bet, ul.bet-wrapper > li';
export const coefficientInputSelector =
  'input[ng-model="$ctrl.price"], input[ng-model="bet.price"]';
export const stakeSumInputSelector =
  'input[ng-model="$ctrl.size"], input[ng-model="bet.size"]';
export const betNameSelector =
  'span[ng-bind="$ctrl.bet.runner.name"], span.bet-runner-name';
export const betConfirmCheckboxSelector =
  'input[type="checkbox"][ng-model="$ctrl.verifyBet"], input[type="checkbox"][ng-model="betslipCtrl.data.betslipContext.preferences.displayConfirmation"]';
export const submitButtonSelector =
  '[on-click="$ctrl.onPlaceBetsClick()"] > button, button[ng-click="potentialsCtrl.events.placeBetsHandler(true)"]';
export const receiptSelector = 'receipt, subpane-id="RECEIPT"].active';
export const matchedBetsSelector =
  'receipt .receipt__matched-bets, subpane-id="RECEIPT"] .matched-wrapper';
export const unmatchedBetsSelector =
  'receipt .receipt__unmatched-bets, subpane-id="RECEIPT"] .unmatched-wrapper';
export const cancelledBetsSelector =
  'receipt .receipt__cancelled-bets, subpane-id="RECEIPT"] .cancelled-wrapper';
export const unplacedBetsSelector =
  'receipt .receipt__unplaced-bets, subpane-id="RECEIPT"] .unplaced-wrapper';
export const spinnerSelector = 'countdown, subpane-id="LOADING"].active';
// export const spinnerInvertSelector = 'betslip [ng-switch-when]:not([ng-switch-when="LOADING"]), [subpane-id="LOADING"]:not(.active)';
export const spinnerInvertSelector =
  'receipt, subpane-id="LOADING"]:not(.active)';
export const cancelUnmatchedAboveButtonSelector =
  '[on-click="$ctrl.onCancelAllAbove()"] > button, button[ng-click="receiptCtrl.events.cancelUnmatchedBetsOnReceipt()"]';
export const receiptErrorSelector = 'betslip-error-message, receipt-error';
export const receiptBetSizeSelector =
  '.betslip-bet__runner-detail:nth-child(2), bet-size';
