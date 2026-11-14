/**
 * Statistics derived from habit logs. Pure functions, no UI.
 *
 * Every screen (monthly view, habit detail, today) must derive a day's display from
 * `getDayState` so the same habit/date can never look different in two places.
 *
 * `today` is always the *logical* today (`getLogicalDate`). `weekStart` is the week_start
 * setting; it is needed for biweekly parity and for weekly_count week boundaries.
 */
import { isValueCompleted } from './completion';
import {
  addDays,
  addMonths,
  compareISODate,
  getMonthRange,
  type ISOMonth,
  getMonthOf,
} from './date';
import { getWeeklyProgress, type ValuesByDate } from './progress';
import { isHabitActiveOn, isHabitDueOn } from './recurrence';
import type { HabitLog, HabitRule, ISODate, WeekStart } from './types';
import { getWeekStart } from './week';

export type { ValuesByDate };

export type DayState =
  | 'done'
  | 'missed'
  | 'partial'
  | 'not_scheduled'
  | 'future'
  | 'today_pending';

export type HabitWithId = HabitRule & { id: number };
/** habitId -> (date -> value). */
export type LogsByHabit = Readonly<Record<number, ValuesByDate | undefined>>;

/** Groups raw log rows for fast per-habit/date lookup. */
export function groupLogsByHabit(logs: readonly HabitLog[]): Record<number, Record<ISODate, number>> {
  const out: Record<number, Record<ISODate, number>> = {};
  for (const l of logs) (out[l.habitId] ??= {})[l.date] = l.value;
  return out;
}

const isWeeklyCount = (h: HabitRule) => h.recurrenceType === 'weekly_count';

/**
 * State of one habit on one date.
 *
 * - Before `startDate` / on-or-after `archivedAt` -> `not_scheduled` (logs are kept, not shown).
 * - After `today` -> `future`.
 * - daily/weekdays on a scheduled day: `done` if the goal is met; `partial` if something
 *   was recorded but the goal is not met; otherwise `today_pending` (today) or `missed` (past).
 *   For `at_most`, a recorded value over the goal is `missed` (even today); no record is NOT
 *   success: it stays `missed`/`today_pending`.
 * - Not a scheduled weekday (incl. the off week of a biweekly habit) -> `not_scheduled`,
 *   even if a stray log exists.
 * - weekly_count has no scheduled days: only days that meet the goal are `done`, other past
 *   days are `not_scheduled`. Weekly success is judged by `getWeekResult`.
 *   Unrecorded *today* is `today_pending` so the Today screen can show it as actionable.
 */
export function getDayState(
  habit: HabitRule,
  date: ISODate,
  values: ValuesByDate,
  today: ISODate,
  weekStart: WeekStart,
): DayState {
  if (!isHabitActiveOn(habit, date)) return 'not_scheduled';
  if (compareISODate(date, today) > 0) return 'future';

  const weekly = isWeeklyCount(habit);
  if (!weekly && !isHabitDueOn(habit, date, weekStart)) return 'not_scheduled';

  const value = values[date] ?? null;
  if (isValueCompleted(habit, value)) return 'done';

  const atMost = habit.type === 'quantity' && habit.goalDirection === 'at_most';
  const overLimit = atMost && value !== null && value > habit.goalValue;
  if (overLimit && !weekly) return 'missed';

  if (!atMost && value !== null && value > 0) return 'partial';

  if (date === today) return 'today_pending';
  return weekly ? 'not_scheduled' : 'missed';
}

// ---------------------------------------------------------------------------
// Weekly (weekly_count) results
// ---------------------------------------------------------------------------

export type WeekResult = 'done' | 'missed' | 'pending' | 'inactive';

/**
 * Result of the week that starts on `weekStartDate` for a weekly_count habit:
 * `done` when completed days >= times_per_week; `missed` when the week is over without
 * reaching it; `pending` while still in progress; `inactive` when the habit is not active
 * on any day of that week.
 */
export function getWeekResult(
  habit: HabitRule,
  values: ValuesByDate,
  weekStartDate: ISODate,
  today: ISODate,
  weekStart: WeekStart,
): WeekResult {
  const weekEnd = addDays(weekStartDate, 6);
  const activeSomeDay =
    compareISODate(weekEnd, habit.startDate) >= 0 &&
    (habit.archivedAt === null || compareISODate(weekStartDate, habit.archivedAt) < 0);
  if (!activeSomeDay) return 'inactive';

  if (getWeeklyProgress(habit, values, weekStartDate, weekStart).achieved) return 'done';
  return compareISODate(weekEnd, today) < 0 ? 'missed' : 'pending';
}

// ---------------------------------------------------------------------------
// Rate
// ---------------------------------------------------------------------------

export interface Rate {
  done: number;
  scheduled: number;
  /** Integer 0-100, or null when nothing is scheduled. */
  pct: number | null;
}

export function calcPct(done: number, scheduled: number): number | null {
  return scheduled > 0 ? Math.round((done / scheduled) * 100) : null;
}

export function sumRates(rates: readonly Rate[]): Rate {
  const done = rates.reduce((s, r) => s + r.done, 0);
  const scheduled = rates.reduce((s, r) => s + r.scheduled, 0);
  return { done, scheduled, pct: calcPct(done, scheduled) };
}

/**
 * Achievement rate over `from..to` (inclusive).
 * Denominator = scheduled days in the past, plus today only if already done (an unrecorded
 * today is not counted against you). Unrecorded `at_most` days are in the denominator but
 * never in the numerator.
 *
 * weekly_count: unit is weeks. A week belongs to the range when its first day is in
 * `from..to`; it counts once finished, or earlier if already achieved.
 */
export function getRate(
  habit: HabitRule,
  values: ValuesByDate,
  from: ISODate,
  to: ISODate,
  today: ISODate,
  weekStart: WeekStart,
): Rate {
  let done = 0;
  let scheduled = 0;

  if (isWeeklyCount(habit)) {
    let w = getWeekStart(from, weekStart);
    if (compareISODate(w, from) < 0) w = addDays(w, 7);
    for (; compareISODate(w, to) <= 0 && compareISODate(w, today) <= 0; w = addDays(w, 7)) {
      const result = getWeekResult(habit, values, w, today, weekStart);
      if (result === 'done') {
        done++;
        scheduled++;
      } else if (result === 'missed') {
        scheduled++;
      }
    }
  } else {
    const first = compareISODate(from, habit.startDate) > 0 ? from : habit.startDate;
    const last = compareISODate(to, today) < 0 ? to : today;
    for (let d = first; compareISODate(d, last) <= 0; d = addDays(d, 1)) {
      const state = getDayState(habit, d, values, today, weekStart);
      if (state === 'done') {
        done++;
        scheduled++;
      } else if (d !== today && (state === 'missed' || state === 'partial')) {
        scheduled++;
      }
    }
  }
  return { done, scheduled, pct: calcPct(done, scheduled) };
}

// ---------------------------------------------------------------------------
// Streaks
// ---------------------------------------------------------------------------

export interface StreakRun {
  start: ISODate;
  end: ISODate;
  /** Days (daily/weekdays) or weeks (weekly_count). */
  length: number;
}

export interface Streaks {
  current: number;
  best: number;
  top3: StreakRun[];
}

/**
 * Streaks of consecutive successes.
 * - daily/weekdays: consecutive *scheduled* days that are `done`; unscheduled days are skipped
 *   (they never break a run). A `missed`/`partial` day breaks it. An unrecorded today does not.
 * - weekly_count: consecutive achieved weeks (length counts weeks; start/end are the first day
 *   of the first week and last day of the last week). The in-progress week does not break it.
 * `current` is the run that is still alive as of today (0 if the latest resolved day/week failed).
 * `top3` is sorted by length, then by recency.
 */
export function getStreaks(
  habit: HabitRule,
  values: ValuesByDate,
  today: ISODate,
  weekStart: WeekStart,
): Streaks {
  const last =
    habit.archivedAt !== null && compareISODate(addDays(habit.archivedAt, -1), today) < 0
      ? addDays(habit.archivedAt, -1)
      : today;

  const runs: StreakRun[] = [];
  let cur: StreakRun | null = null;
  const extend = (start: ISODate, end: ISODate) => {
    cur = cur ? { ...cur, end, length: cur.length + 1 } : { start, end, length: 1 };
  };
  const breakRun = () => {
    if (cur) runs.push(cur);
    cur = null;
  };

  if (isWeeklyCount(habit)) {
    let w = getWeekStart(habit.startDate, weekStart);
    for (; compareISODate(w, last) <= 0; w = addDays(w, 7)) {
      const result = getWeekResult(habit, values, w, last, weekStart);
      if (result === 'done') extend(w, addDays(w, 6));
      else if (result === 'missed') breakRun();
    }
  } else {
    for (let d = habit.startDate; compareISODate(d, last) <= 0; d = addDays(d, 1)) {
      const state = getDayState(habit, d, values, today, weekStart);
      if (state === 'done') extend(d, d);
      else if (state === 'missed' || state === 'partial') breakRun();
    }
  }

  const current = (cur as StreakRun | null)?.length ?? 0;
  breakRun();

  const sorted = [...runs].sort(
    (a, b) => b.length - a.length || compareISODate(b.end, a.end),
  );
  return { current, best: sorted[0]?.length ?? 0, top3: sorted.slice(0, 3) };
}

// ---------------------------------------------------------------------------
// Month history / day aggregate
// ---------------------------------------------------------------------------

export interface MonthStat extends Rate {
  month: ISOMonth;
  /** True for the month containing `today` (still accumulating). */
  inProgress: boolean;
}

/**
 * Achievement per month for the `n` months ending at `endMonth`, oldest first.
 * `done` = achieved days (weekly_count: achieved weeks), using the same rules as `getRate`.
 */
export function getMonthHistory(
  habit: HabitRule,
  values: ValuesByDate,
  endMonth: ISOMonth,
  today: ISODate,
  weekStart: WeekStart,
  n = 6,
): MonthStat[] {
  const currentMonth = getMonthOf(today);
  return Array.from({ length: n }, (_, i) => {
    const month = addMonths(endMonth, i - (n - 1));
    const { start, end } = getMonthRange(month);
    return {
      month,
      inProgress: month === currentMonth,
      ...getRate(habit, values, start, end, today, weekStart),
    };
  });
}

/**
 * Done/scheduled across habits on one date (for the monthly view's per-day bar).
 * `scheduled` counts every habit whose state is done, partial, missed or today_pending
 * (so today's bar shows progress so far); weekly_count habits only count on days they were done.
 */
export function getDayAggregate(
  date: ISODate,
  habits: readonly HabitWithId[],
  logs: LogsByHabit,
  today: ISODate,
  weekStart: WeekStart,
): { done: number; scheduled: number } {
  let done = 0;
  let scheduled = 0;
  for (const h of habits) {
    const state = getDayState(h, date, logs[h.id] ?? {}, today, weekStart);
    if (state === 'done') {
      done++;
      scheduled++;
    } else if (state === 'missed' || state === 'partial' || state === 'today_pending') {
      scheduled++;
    }
  }
  return { done, scheduled };
}
