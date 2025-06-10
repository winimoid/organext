// src/i18n/index.ts

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'react-native-localize';
import en from './en';
import fr from './fr';

const resources = {
  en: {
    translation: en,
  },
  fr: {
    translation: fr,
  },
};

// Trouve la première langue disponible sur l'appareil
const fallback = { languageTag: 'en', isRTL: false };
const { languageTag } = getLocales()[0] || fallback;

// Utilise la langue détectée si elle est disponible, sinon fallback vers 'en'
const bestLanguage = Object.keys(resources).includes(languageTag) ? languageTag : 'en';

export const initI18n = () => {
  return i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: bestLanguage,
      fallbackLng: 'en',
      compatibilityJSON: 'v4',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false, // Important pour React Native
      },
    });
};

export { i18n };
