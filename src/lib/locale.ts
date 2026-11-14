import type { AppLanguage, LanguageSetting } from './types';

/** Resolves the language setting against the device language code (e.g. "ko", "en", "ja"). */
export function resolveLanguage(
  setting: LanguageSetting,
  deviceLanguageCode: string | null | undefined,
): AppLanguage {
  if (setting !== 'system') return setting;
  return deviceLanguageCode?.toLowerCase() === 'ko' ? 'ko' : 'en';
}
