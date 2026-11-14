import { useCallback, useMemo } from 'react';

import { listCategories } from '@/db/categories';
import { listHabitsActiveOn } from '@/db/habits';
import { listLogsInRange } from '@/db/logs';
import { groupLogsByHabit } from '@/lib/stats';
import { buildTodaySections, type TodaySection } from '@/lib/today';
import type { ISODate } from '@/lib/types';
import { getWeekRange } from '@/lib/week';

import { useDbQuery } from './use-db-query';
import { useSettings } from './use-settings';

/**
 * Habits due on `date`, grouped by category, with that date's values and this week's progress.
 * Returns `undefined` while loading. Refreshes automatically after any DB write.
 */
export function useTodaySections(date: ISODate, today: ISODate): TodaySection[] | undefined {
  const { weekStart } = useSettings().settings;

  const query = useCallback(
    async (db: Parameters<typeof listCategories>[0]) => {
      const week = getWeekRange(date, weekStart);
      const [habits, categories, logs] = await Promise.all([
        listHabitsActiveOn(db, date),
        listCategories(db),
        listLogsInRange(db, week.start, week.end),
      ]);
      return { habits, categories, logs };
    },
    [date, weekStart],
  );

  const { data } = useDbQuery(query);

  return useMemo(
    () =>
      data &&
      buildTodaySections(
        data.habits,
        data.categories,
        groupLogsByHabit(data.logs),
        date,
        today,
        weekStart,
      ),
    [data, date, today, weekStart],
  );
}
