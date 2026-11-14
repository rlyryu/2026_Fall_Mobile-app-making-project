/** Builds the Today screen's list from raw habits/categories/logs. Pure: no DB, no UI. */
import { compareISODate, isValidISODate } from './date';
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

export interface TodaySection {
  /** Stable key for list rendering. */
  key: string;
  categoryId: number | null;
  /** Category name; null = uncategorized (UI supplies the translated label). */
  title: string | null;
  data: TodayItem[];
}

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
  const categoryIds = new Set(categories.map((c) => c.id));

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

  const due = sortedHabits.filter((h) => isHabitDueOn(h, date, weekStart));
  const sections: TodaySection[] = [];

  for (const category of categories) {
    const data = due.filter((h) => h.categoryId === category.id).map(toItem);
    if (data.length > 0) {
      sections.push({ key: `c${category.id}`, categoryId: category.id, title: category.name, data });
    }
  }

  const uncategorized = due
    .filter((h) => h.categoryId === null || !categoryIds.has(h.categoryId))
    .map(toItem);
  if (uncategorized.length > 0) {
    sections.push({ key: 'none', categoryId: null, title: null, data: uncategorized });
  }
  return sections;
}
