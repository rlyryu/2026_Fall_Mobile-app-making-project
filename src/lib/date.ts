/**
 * Logical-date utilities.
 *
 * Rules (see CLAUDE.md):
 * - A date is a local `YYYY-MM-DD` string. Never use `toISOString()` or
 *   `new Date('YYYY-MM-DD')` (both go through UTC).
 * - "Today" is computed only by `getLogicalDate(now, dayStartHour)`.
 * - Date arithmetic goes through local-midnight `Date`s and date-fns
 *   calendar-day functions, so DST transitions cannot shift a date.
 */
import { addDays as dfAddDays, differenceInCalendarDays } from 'date-fns';

import type { ISODate, IsoWeekday } from './types';

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad2 = (n: number) => String(n).padStart(2, '0');

/** True if `s` is a real calendar date in `YYYY-MM-DD` form. */
export function isValidISODate(s: string): boolean {
  const m = ISO_DATE_RE.exec(s);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const date = new Date(y, mo - 1, d);
  return date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d;
}

/** Parses `YYYY-MM-DD` into a `Date` at local midnight. Throws on invalid input. */
export function parseISODate(s: ISODate): Date {
  if (!isValidISODate(s)) throw new Error(`Invalid date string: ${s}`);
  const [y, mo, d] = s.split('-').map(Number);
  return new Date(y, mo - 1, d);
}

/** Formats the local calendar date of `date` as `YYYY-MM-DD`. */
export function formatISODate(date: Date): ISODate {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/**
 * The single source of truth for "which day is it".
 * Times before `dayStartHour` (local) belong to the previous calendar day.
 */
export function getLogicalDate(now: Date, dayStartHour = 0): ISODate {
  if (!Number.isInteger(dayStartHour) || dayStartHour < 0 || dayStartHour > 23) {
    throw new Error(`dayStartHour must be an integer 0-23, got ${dayStartHour}`);
  }
  const calendarDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const logical = now.getHours() < dayStartHour ? dfAddDays(calendarDay, -1) : calendarDay;
  return formatISODate(logical);
}

export function addDays(date: ISODate, amount: number): ISODate {
  return formatISODate(dfAddDays(parseISODate(date), amount));
}

/** Calendar-day difference `later - earlier`. */
export function diffInDays(later: ISODate, earlier: ISODate): number {
  return differenceInCalendarDays(parseISODate(later), parseISODate(earlier));
}

/** `YYYY-MM-DD` strings sort lexicographically in date order. */
export function compareISODate(a: ISODate, b: ISODate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** ISO weekday of a date: 1 = Monday ... 7 = Sunday. */
export function getIsoWeekday(date: ISODate): IsoWeekday {
  const jsDay = parseISODate(date).getDay(); // 0 = Sunday
  return (jsDay === 0 ? 7 : jsDay) as IsoWeekday;
}

/** Calendar month, `YYYY-MM`. */
export type ISOMonth = string;

export function getMonthOf(date: ISODate): ISOMonth {
  return date.slice(0, 7);
}

function parseMonth(month: ISOMonth): { year: number; monthIndex: number } {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m || Number(m[2]) < 1 || Number(m[2]) > 12) throw new Error(`Invalid month: ${month}`);
  return { year: Number(m[1]), monthIndex: Number(m[2]) - 1 };
}

/** First and last date of a month. */
export function getMonthRange(month: ISOMonth): { start: ISODate; end: ISODate } {
  const { year, monthIndex } = parseMonth(month);
  return {
    start: formatISODate(new Date(year, monthIndex, 1)),
    end: formatISODate(new Date(year, monthIndex + 1, 0)),
  };
}

export function addMonths(month: ISOMonth, amount: number): ISOMonth {
  const { year, monthIndex } = parseMonth(month);
  return getMonthOf(formatISODate(new Date(year, monthIndex + amount, 1)));
}
