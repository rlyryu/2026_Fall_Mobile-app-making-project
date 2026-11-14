import { compareISODate, getIsoWeekday } from './date';
import { isBiweeklyActive } from './week';
import type { HabitRule, ISODate, WeekStart } from './types';

/**
 * A habit is active from `startDate` (inclusive) until `archivedAt` (exclusive).
 * Logs outside this range are kept but the habit is not due there.
 */
export function isHabitActiveOn(
  habit: Pick<HabitRule, 'startDate' | 'archivedAt'>,
  date: ISODate,
): boolean {
  if (compareISODate(date, habit.startDate) < 0) return false;
  if (habit.archivedAt !== null && compareISODate(date, habit.archivedAt) >= 0) return false;
  return true;
}

/**
 * Whether the habit should appear on `date`.
 * - daily: every day
 * - weekdays: listed ISO weekdays; with interval 2, only in even-numbered weeks counted
 *   from the week containing `startDate` (week 0), weeks delimited by `weekStart`
 * - weekly_count: every day (progress is tracked per week, see progress.ts)
 */
export function isHabitDueOn(habit: HabitRule, date: ISODate, weekStart: WeekStart): boolean {
  if (!isHabitActiveOn(habit, date)) return false;

  switch (habit.recurrenceType) {
    case 'daily':
    case 'weekly_count':
      return true;
    case 'weekdays': {
      if (!habit.daysOfWeek.includes(getIsoWeekday(date))) return false;
      if (habit.recurrenceInterval === 2) {
        return isBiweeklyActive(habit.startDate, date, weekStart);
      }
      return true;
    }
  }
}
