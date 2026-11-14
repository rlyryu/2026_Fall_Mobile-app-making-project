/** Builds the Today screen's list from raw habits/categories/logs. Pure: no DB, no UI. */
import { compareISODate, isValidISODate } from './date';
import { type CategoryGroup, groupByCategory } from './grouping';
import { getWeeklyProgress, type WeeklyProgress } from './progress';
import { isHabitDueOn } from './recurrence';
import { type DayState, getDayState, type LogsByHabit } from './stats';
import type { Category, Habit, ISODate, WeekStart } from './types';

export interface TodayItem {
  habit: Habit;
  /** Recorded value for the date, or null when unrecorded. */
  value: number | null;
  state: DayState;
  /** Only for weekly_count habits: this week's progress. */
  week: WeeklyProgress | null;
}

export type TodaySection = CategoryGroup<TodayItem>;

/** A valid, non-future date from a route param, else `today`. */
export function resolveSelectedDate(param: string | undefined, today: ISODate): ISODate {
  if (param && isValidISODate(param) && compareISODate(param, today) <= 0) return param;
  return today;
}

/**
 * Habits due on `date`, grouped by category (category order, uncategorized last),
 * ordered by habit sort order within a group. Empty groups are omitted.
 */
export function buildTodaySections(
  habits: readonly Habit[],
  categories: readonly Category[],
  logs: LogsByHabit,
  date: ISODate,
  today: ISODate,
  weekStart: WeekStart,
): TodaySection[] {
  const sortedHabits = [...habits].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);

  const toItem = (habit: Habit): TodayItem => {
    const values = logs[habit.id] ?? {};
    return {
      habit,
      value: values[date] ?? null,
      state: getDayState(habit, date, values, today, weekStart),
      week:
        habit.recurrenceType === 'weekly_count'
          ? getWeeklyProgress(habit, values, date, weekStart)
          : null,
    };
  };

  const items = sortedHabits.filter((h) => isHabitDueOn(h, date, weekStart)).map(toItem);
  return groupByCategory(items, categories, (i) => i.habit.categoryId);
}
