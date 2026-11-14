/** Report (monthly / weekly) layout and aggregates. Pure. */
import { addDays, compareISODate, getMonthOf, getMonthRange, type ISOMonth } from './date';
import { getWeeklyProgress } from './progress';
import { getRate, getWeekResult, type LogsByHabit, type Rate, sumRates, type WeekResult } from './stats';
import type { HabitRule, ISODate, WeekStart } from './types';
import { getWeekDates, getWeekStart } from './week';

type HabitWithId = HabitRule & { id: number };

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

/** The 7 days of the week containing `date`, all shown (`inMonth: true`). */
export function buildWeekDays(date: ISODate, weekStart: WeekStart): CalendarDay[] {
  return getWeekDates(date, weekStart).map((d) => ({ date: d, inMonth: true }));
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

export interface ReportRates {
  /** daily / weekdays / biweekly habits. Unit: days. */
  daily: Rate;
  /** weekly_count habits. Unit: weeks (a week belongs to the period its first day is in). */
  weekly: Rate;
  hasDaily: boolean;
  hasWeekly: boolean;
}

/**
 * Achievement over `from..to`, kept separate by unit so days and weeks are never added
 * together: each part is the sum of the habits' `getRate`.
 */
export function getReportRates(
  habits: readonly HabitWithId[],
  logs: LogsByHabit,
  from: ISODate,
  to: ISODate,
  today: ISODate,
  weekStart: WeekStart,
): ReportRates {
  const weeklyHabits = habits.filter((h) => h.recurrenceType === 'weekly_count');
  const dailyHabits = habits.filter((h) => h.recurrenceType !== 'weekly_count');
  const rate = (list: readonly HabitWithId[]) =>
    sumRates(list.map((h) => getRate(h, logs[h.id] ?? {}, from, to, today, weekStart)));
  return {
    daily: rate(dailyHabits),
    weekly: rate(weeklyHabits),
    hasDaily: dailyHabits.length > 0,
    hasWeekly: weeklyHabits.length > 0,
  };
}

export interface WeeklyGoal<H extends HabitWithId = HabitWithId> {
  habit: H;
  completedDays: number;
  target: number;
  /** 0-1 */
  ratio: number;
  result: Exclude<WeekResult, 'inactive'>;
}

/** Progress of every weekly_count habit active in the week containing `date`. */
export function getWeeklyGoals<H extends HabitWithId>(
  habits: readonly H[],
  logs: LogsByHabit,
  date: ISODate,
  today: ISODate,
  weekStart: WeekStart,
): WeeklyGoal<H>[] {
  const start = getWeekStart(date, weekStart);
  const goals: WeeklyGoal<H>[] = [];
  for (const habit of habits) {
    if (habit.recurrenceType !== 'weekly_count') continue;
    const values = logs[habit.id] ?? {};
    const result = getWeekResult(habit, values, start, today, weekStart);
    if (result === 'inactive') continue;
    const p = getWeeklyProgress(habit, values, start, weekStart);
    goals.push({ habit, completedDays: p.completedDays, target: p.target, ratio: p.ratio, result });
  }
  return goals;
}
