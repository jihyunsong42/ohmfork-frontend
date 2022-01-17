import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import English from './locales/english';
import Korean from './locales/korean';
import { i18nextPlugin } from 'translation-check';

i18n
  // detect user language
  // learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  .use(i18nextPlugin)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    debug: false,

    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    resources: {
      en: English,
      kr: Korean,
    },
  });

export default i18n;
