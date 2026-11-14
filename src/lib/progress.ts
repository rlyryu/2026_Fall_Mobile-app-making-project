import { isValueCompleted } from './completion';
import { getWeekDates } from './date';
import { isHabitDueOn } from './recurrence';
import type { HabitRule, ISODate, WeekStart } from './types';

export interface WeeklyProgress {
  /** Dates of the week (per `weekStart`) containing the reference date. */
  weekDates: ISODate[];
  /** Days in that week on which the habit was due and completed. */
  completedDays: number;
  /** weekly_count: N. Other types: number of due days in the week. */
  target: number;
  /** `completedDays >= target` (false when target is 0). */
  achieved: boolean;
  /** completedDays / target, clamped to [0, 1]. */
  ratio: number;
}

/** Map from date to recorded value. Missing key = no log. */
export type ValuesByDate = Readonly<Record<ISODate, number | undefined>>;

/**
 * Weekly progress for the week containing `date`.
 * For weekly_count this is "completed days / N"; extra completions beyond N still count.
 */
export function getWeeklyProgress(
  habit: HabitRule,
  values: ValuesByDate,
  date: ISODate,
  weekStart: WeekStart,
): WeeklyProgress {
  const weekDates = getWeekDates(date, weekStart);
  const dueDates = weekDates.filter((d) => isHabitDueOn(habit, d, weekStart));

  const completedDays = dueDates.filter((d) => isValueCompleted(habit, values[d] ?? null)).length;

  const target =
    habit.recurrenceType === 'weekly_count' ? (habit.timesPerWeek ?? 0) : dueDates.length;

  return {
    weekDates,
    completedDays,
    target,
    achieved: target > 0 && completedDays >= target,
    ratio: target > 0 ? Math.min(1, completedDays / target) : 0,
  };
}
