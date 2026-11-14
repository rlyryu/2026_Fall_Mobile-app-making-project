import type { SQLiteDatabase } from 'expo-sqlite';
import { useCallback } from 'react';

import { listCategories } from '@/db/categories';
import { listHabitsActiveBetween } from '@/db/habits';
import { listLogsInRange } from '@/db/logs';
import { addDays } from '@/lib/date';
import { groupByCategory } from '@/lib/grouping';
import { groupLogsByHabit } from '@/lib/stats';
import type { ISODate } from '@/lib/types';

import { useDbQuery } from './use-db-query';

/**
 * Habits active at some point in `from..to` (in display order) and logs for the period.
 * Logs extend 6 days past `to` because a weekly_count week that *starts* in the period
 * belongs to it (see getRate). `undefined` while loading.
 */
export function useReportData(from: ISODate, to: ISODate) {
  const query = useCallback(
    async (db: SQLiteDatabase) => {
      const [habits, categories, logs] = await Promise.all([
        listHabitsActiveBetween(db, from, to),
        listCategories(db),
        listLogsInRange(db, from, addDays(to, 6)),
      ]);
      return {
        // Same order as elsewhere: by category, uncategorized last, then habit sort order.
        habits: groupByCategory(habits, categories, (h) => h.categoryId).flatMap((g) => g.data),
        logs: groupLogsByHabit(logs),
      };
    },
    [from, to],
  );
  return useDbQuery(query).data;
}
