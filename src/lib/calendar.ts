/** Month-calendar layout and month-level aggregates. Pure. */
import { addDays, compareISODate, getMonthOf, getMonthRange, type ISOMonth } from './date';
import { getRate, type LogsByHabit, type Rate, sumRates } from './stats';
import type { HabitRule, ISODate, WeekStart } from './types';
import { getWeekStart } from './week';

export interface CalendarDay {
  date: ISODate;
  /** False for leading/trailing days that belong to the neighbouring month (rendered blank). */
  inMonth: boolean;
}

/**
 * The weeks (rows of 7 days, ordered by `weekStart`) that cover `month`.
 * Days outside the month are included with `inMonth: false` so columns stay aligned.
 */
export function buildMonthWeeks(month: ISOMonth, weekStart: WeekStart): CalendarDay[][] {
  const { start, end } = getMonthRange(month);
  const weeks: CalendarDay[][] = [];
  for (let w = getWeekStart(start, weekStart); compareISODate(w, end) <= 0; w = addDays(w, 7)) {
    weeks.push(
      Array.from({ length: 7 }, (_, i) => {
        const date = addDays(w, i);
        return { date, inMonth: getMonthOf(date) === month };
      }),
    );
  }
  return weeks;
}

/** Whether a habit is active on at least one day of `from..to`. */
export function isActiveInRange(
  habit: Pick<HabitRule, 'startDate' | 'archivedAt'>,
  from: ISODate,
  to: ISODate,
): boolean {
  return (
    compareISODate(habit.startDate, to) <= 0 &&
    (habit.archivedAt === null || compareISODate(habit.archivedAt, from) > 0)
  );
}

/**
 * Overall achievement for a month: the sum of each habit's `getRate` over the month
 * (days for daily/weekdays habits, weeks for weekly_count habits).
 */
export function getMonthRate(
  habits: readonly (HabitRule & { id: number })[],
  logs: LogsByHabit,
  month: ISOMonth,
  today: ISODate,
  weekStart: WeekStart,
): Rate {
  const { start, end } = getMonthRange(month);
  return sumRates(habits.map((h) => getRate(h, logs[h.id] ?? {}, start, end, today, weekStart)));
}
