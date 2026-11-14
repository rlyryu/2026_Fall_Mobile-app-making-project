import { enUS, ko as koLocale, type Locale } from 'date-fns/locale';
import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { resolveLanguage } from '@/lib/locale';
import type { AppLanguage, LanguageSetting } from '@/lib/types';

import en from './locales/en';
import ko from './locales/ko';

export const resources = {
  ko: { translation: ko },
  en: { translation: en },
} as const;

export function getDeviceLanguageCode(): string | null {
  return getLocales()[0]?.languageCode ?? null;
}

const i18n = createInstance();

i18n.use(initReactI18next).init({
  resources,
  lng: resolveLanguage('system', getDeviceLanguageCode()),
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React already escapes
  initAsync: false, // resources are bundled; initialize synchronously
});

/** Applies the language setting (called by SettingsProvider when settings load/change). */
export function applyLanguageSetting(setting: LanguageSetting): AppLanguage {
  const lang = resolveLanguage(setting, getDeviceLanguageCode());
  if (i18n.language !== lang) void i18n.changeLanguage(lang);
  return lang;
}

const DATE_FNS_LOCALES: Record<AppLanguage, Locale> = { ko: koLocale, en: enUS };

export function getDateFnsLocale(lang: AppLanguage): Locale {
  return DATE_FNS_LOCALES[lang];
}

export default i18n;
