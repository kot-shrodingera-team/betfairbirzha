import { getElement, fireEvent } from '@kot-shrodingera-team/config/util';
import {
  loginInputSelector,
  accountPanelSelector,
  passwordInputSelector,
  signInButtonSelector,
  languageIconSelector,
  englishIconClass,
  englishIconSelector,
} from './selectors';
import { updateBalance } from './getInfo';

export const checkLoginAsync = async (): Promise<boolean> => {
  await Promise.race([
    getElement(loginInputSelector, 10000),
    getElement(accountPanelSelector, 10000),
  ]);
  const loginInput = document.querySelector(accountPanelSelector);
  if (loginInput) {
    return true;
  }
  return false;
};

export const languageCheck = async (): Promise<boolean> => {
  const languageIcon = await getElement(languageIconSelector, 10000);
  if (!languageIcon) {
    worker.Helper.WriteLine('Не найдена иконка текущего языка');
    return false;
  }
  return [...languageIcon.classList].includes(englishIconClass);
};

export const changeLanguage = async (): Promise<boolean> => {
  const englishIcon = (await getElement(englishIconSelector)) as HTMLElement;
  if (!englishIcon) {
    worker.Helper.WriteLine('Не найдена иконка английского языка');
    return false;
  }
  englishIcon.click();
  return true;
};

const authorize = async (): Promise<void> => {
  const isLogin = await checkLoginAsync();
  if (isLogin) {
    worker.Helper.WriteLine('Уже авторизованы');
    worker.Islogin = true;
    worker.JSLogined();
    await updateBalance();
    if (!(await languageCheck())) {
      worker.Helper.WriteLine('Язык не английский. Переключаем');
      if (!(await changeLanguage())) {
        worker.Helper.WriteLine('Не найдена иконка английского языка');
      }
    }
  } else {
    worker.Helper.WriteLine('Нет авторизации. Ищем поле ввода логина');
    const loginInput = document.querySelector(
      loginInputSelector
    ) as HTMLInputElement;
    if (loginInput) {
      worker.Helper.WriteLine('Вводим данные');
      const passwordInput = document.querySelector(
        passwordInputSelector
      ) as HTMLInputElement;
      loginInput.value = worker.Login;
      fireEvent(loginInput, 'keyup');
      passwordInput.value = worker.Password;
      fireEvent(passwordInput, 'keyup');
      const loginButton = document.querySelector(
        signInButtonSelector
      ) as HTMLElement;
      worker.Helper.WriteLine('Входим');
      loginButton.click();
    } else {
      worker.Helper.WriteLine(
        'Ошибка инициализации: Не найдено поле ввода логина'
      );
      worker.Islogin = false;
      worker.JSLogined();
    }
  }
};

export default authorize;
