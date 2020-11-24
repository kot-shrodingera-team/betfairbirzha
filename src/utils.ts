import { getElement } from '@kot-shrodingera-team/config/util';

export const openBetsTabActiveSelector =
  'betslip ul.tabs-container > li.active.OPEN, bf-betslip:not(.ng-hide) ul.generic-tabs-container > li.generic-tab-selected#betslip-tab-open';
export const potentialBetsTabActiveSelector =
  'betslip ul.tabs-container > li.active.POTENTIAL, bf-betslip:not(.ng-hide) ul.generic-tabs-container > li.generic-tab-selected#betslip-tab-potential';

export const isNewBetSlip = (): boolean => {
  return true;
  // const betslip = document.querySelector('bf-betslip');
  // if (!betslip) {
  //   return false;
  // }
  // return betslip.classList.contains('ng-hide');
};

export const getActiveTab = (): string => {
  const activeTab = document.querySelector(
    isNewBetSlip()
      ? 'betslip ul.tabs-container > li.active'
      : 'bf-betslip:not(.ng-hide) ul.generic-tabs-container > li.generic-tab-selected'
  );
  if (
    isNewBetSlip()
      ? [...activeTab.classList].includes('OPEN')
      : activeTab.getAttribute('id') === 'betslip-tab-open'
  ) {
    return 'open';
  }
  if (
    isNewBetSlip()
      ? [...activeTab.classList].includes('POTENTIAL')
      : activeTab.getAttribute('id') === 'betslip-tab-potential'
  ) {
    return 'potential';
  }
  return null;
};

export const goToOpenBetsTab = async (): Promise<boolean> => {
  const potentialTab = document.querySelector(
    isNewBetSlip()
      ? 'betslip ul.tabs-container > li.OPEN'
      : 'bf-betslip:not(.ng-hide) ul.generic-tabs-container > li#betslip-tab-open .tab-title'
  ) as HTMLElement;
  if (!potentialTab) {
    worker.Helper.WriteLine('Не найдена вкладка открытых ставок');
    return false;
  }
  potentialTab.click();
  const openBetsActive = await getElement(openBetsTabActiveSelector);
  if (!openBetsActive) {
    worker.Helper.WriteLine('Вкладка открытых ставок так и не открылась');
    return false;
  }
  return true;
};

export const goToPotentialBetsTab = async (): Promise<boolean> => {
  const potentialTab = document.querySelector(
    isNewBetSlip()
      ? 'betslip ul.tabs-container > li.POTENTIAL'
      : 'bf-betslip:not(.ng-hide) ul.generic-tabs-container > li#betslip-tab-potential .tab-title'
  ) as HTMLElement;
  if (!potentialTab) {
    worker.Helper.WriteLine('Не найдена вкладка потенциальных ставок');
    return false;
  }
  potentialTab.click();
  const potentialBetsActive = await getElement(potentialBetsTabActiveSelector);
  if (!potentialBetsActive) {
    worker.Helper.WriteLine('Вкладка потенциальных ставок так и не открылась');
    return false;
  }
  return true;
};
