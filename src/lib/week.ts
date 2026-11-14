/**
 * Week-boundary math. The ONLY place that knows how `week_start` ('sun' | 'mon') maps to
 * week boundaries. Storage is never affected by week_start: `days_of_week` stays ISO
 * (Mon=1 ... Sun=7); week_start only changes display order and where a week begins/ends.
 */
import { startOfWeek as dfStartOfWeek } from 'date-fns';

import { addDays, diffInDays, formatISODate, parseISODate } from './date';
import type { ISODate, IsoWeekday, WeekStart } from './types';

export interface WeekRange {
  /** First day of the week. */
  start: ISODate;
  /** Last day of the week (start + 6). */
  end: ISODate;
}

export function weekStartsOn(weekStart: WeekStart): 0 | 1 {
  return weekStart === 'sun' ? 0 : 1;
}

/** First day of the week containing `date`. */
export function getWeekStart(date: ISODate, weekStart: WeekStart): ISODate {
  return formatISODate(
    dfStartOfWeek(parseISODate(date), { weekStartsOn: weekStartsOn(weekStart) }),
  );
}

/** First and last day of the week containing `date`. */
export function getWeekRange(date: ISODate, weekStart: WeekStart): WeekRange {
  const start = getWeekStart(date, weekStart);
  return { start, end: addDays(start, 6) };
}

/** The 7 dates of the week containing `date`, in order. */
export function getWeekDates(date: ISODate, weekStart: WeekStart): ISODate[] {
  const start = getWeekStart(date, weekStart);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/**
 * Whole weeks from the week containing `from` to the week containing `to`
 * (0 = same week, negative if `to` is earlier).
 */
export function weeksBetween(from: ISODate, to: ISODate, weekStart: WeekStart): number {
  return Math.round(diffInDays(getWeekStart(to, weekStart), getWeekStart(from, weekStart)) / 7);
}

/**
 * Biweekly parity: true when `date` falls in the base week or every 14 days after it.
 * The base week is the week containing `startDate`; weeks are delimited by `weekStart`.
 * (Does not check `startDate <= date`; combine with the habit's active range.)
 */
export function isBiweeklyActive(startDate: ISODate, date: ISODate, weekStart: WeekStart): boolean {
  const offsetDays = diffInDays(getWeekStart(date, weekStart), getWeekStart(startDate, weekStart));
  return offsetDays % 14 === 0;
}

/** ISO weekdays in display order for the given week start. */
export function orderedWeekdays(weekStart: WeekStart): IsoWeekday[] {
  return weekStart === 'sun' ? [7, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6, 7];
}
