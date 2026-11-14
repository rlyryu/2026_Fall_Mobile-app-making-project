import { useCallback, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { getLogicalDate } from '@/lib/date';
import type { ISODate } from '@/lib/types';

import { useSettings } from './use-settings';

const CHECK_INTERVAL_MS = 30_000;

/**
 * The logical "today" (respects the day-start-hour setting). Re-evaluated every 30s and when
 * the app returns to the foreground, so the screen rolls over at the day boundary.
 */
export function useLogicalToday(): ISODate {
  const { dayStartHour } = useSettings().settings;

  const subscribe = useCallback((onChange: () => void) => {
    const timer = setInterval(onChange, CHECK_INTERVAL_MS);
    const sub = AppState.addEventListener('change', onChange);
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, []);

  const getSnapshot = useCallback(() => getLogicalDate(new Date(), dayStartHour), [dayStartHour]);

  return useSyncExternalStore(subscribe, getSnapshot);
}
