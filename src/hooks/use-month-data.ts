import type { SQLiteDatabase } from 'expo-sqlite';
import { useCallback } from 'react';

import { listCategories } from '@/db/categories';
import { listHabitsActiveBetween } from '@/db/habits';
import { listLogsInRange } from '@/db/logs';
import { addDays, getMonthRange, type ISOMonth } from '@/lib/date';
import { groupLogsByHabit } from '@/lib/stats';

import { useDbQuery } from './use-db-query';

/**
 * Habits active at some point in `month`, categories, and logs for the month.
 * Logs extend 6 days past month end because a weekly_count week that *starts* in the month
 * belongs to it (see getRate). `undefined` while loading.
 */
export function useMonthData(month: ISOMonth) {
  const query = useCallback(
    async (db: SQLiteDatabase) => {
      const { start, end } = getMonthRange(month);
      const [habits, categories, logs] = await Promise.all([
        listHabitsActiveBetween(db, start, end),
        listCategories(db),
        listLogsInRange(db, start, addDays(end, 6)),
      ]);
      return { habits, categories, logs: groupLogsByHabit(logs) };
    },
    [month],
  );
  return useDbQuery(query).data;
}
