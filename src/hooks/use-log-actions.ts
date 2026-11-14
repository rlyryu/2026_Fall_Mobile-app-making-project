import { useSQLiteContext } from 'expo-sqlite';
import { useMemo } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

import { deleteLog, setLogValue } from '@/db/logs';
import { getStep, nextQuantityValue, roundValue } from '@/lib/quantity';
import type { TodayItem } from '@/lib/today';
import type { ISODate } from '@/lib/types';

/**
 * Writes for the Today screen. Each action saves to `habit_logs` for the given date
 * (source = 'manual') and the data hooks refresh themselves via `notifyDbChanged()`.
 */
export function useLogActions(date: ISODate) {
  const db = useSQLiteContext();
  const { t } = useTranslation();

  return useMemo(() => {
    const guard = async (task: () => Promise<void>) => {
      try {
        await task();
      } catch {
        Alert.alert(t('common.errorTitle'), t('common.errorGeneric'));
      }
    };

    return {
      /** check habit: tap toggles done <-> unrecorded. */
      toggleCheck: (item: TodayItem) =>
        guard(() =>
          item.value !== null && item.value >= 1
            ? deleteLog(db, item.habit.id, date)
            : setLogValue(db, item.habit.id, date, 1),
        ),

      /** quantity habit: +/- by one step. */
      step: (item: TodayItem, direction: 1 | -1) =>
        guard(async () => {
          const next = nextQuantityValue(item.habit, item.value, direction * getStep(item.habit));
          if (next === null) await deleteLog(db, item.habit.id, date);
          else await setLogValue(db, item.habit.id, date, next);
        }),

      /** quantity habit: value typed in the dialog. */
      setValue: (item: TodayItem, value: number) =>
        guard(async () => {
          const v = roundValue(value);
          // For at_least, 0 is the same as "nothing recorded"; keep the DB clean.
          if (v === 0 && item.habit.goalDirection === 'at_least') {
            await deleteLog(db, item.habit.id, date);
          } else {
            await setLogValue(db, item.habit.id, date, v);
          }
        }),

      /** Back to "unrecorded". */
      clear: (item: TodayItem) => guard(() => deleteLog(db, item.habit.id, date)),
    };
  }, [db, date, t]);
}
