import * as SplashScreen from 'expo-splash-screen';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { getSettings } from '@/db/settings';
import { applyLanguageSetting, getDateFnsLocale } from '@/i18n';
import type { AppLanguage, AppSettings } from '@/lib/types';
import type { Locale } from 'date-fns';

import { useDbQuery } from './use-db-query';

interface SettingsContextValue {
  settings: AppSettings;
  /** Language actually in use (`system` resolved against the device). */
  language: AppLanguage;
  dateLocale: Locale;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

/**
 * Loads settings from SQLite, applies the language, and renders children only once both are
 * ready (so the first frame is already in the right language). Hides the splash screen then.
 * Changing a setting = write to the DB; this provider re-queries and updates automatically.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const { data: settings } = useDbQuery(getSettings);
  const [language, setLanguage] = useState<AppLanguage | null>(null);

  const languageSetting = settings?.language;
  useEffect(() => {
    if (languageSetting === undefined) return;
    let cancelled = false;
    applyLanguageSetting(languageSetting).then((lang) => {
      if (!cancelled) setLanguage(lang);
    });
    return () => {
      cancelled = true;
    };
  }, [languageSetting]);

  const ready = settings !== undefined && language !== null;
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  const value = useMemo<SettingsContextValue | null>(
    () =>
      settings && language
        ? { settings, language, dateLocale: getDateFnsLocale(language) }
        : null,
    [settings, language],
  );

  if (!value) return null;
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
}
