/**
 * Domain types shared by the DB layer, hooks, and UI.
 *
 * Dates: every calendar date in the app is a *logical* local date string
 * `YYYY-MM-DD` (see `src/lib/date.ts`). Timestamps that are pure metadata
 * (`createdAt`, `updatedAt`) are epoch milliseconds.
 */

/** Logical local date, `YYYY-MM-DD`. Never a UTC conversion. */
export type ISODate = string;

/** ISO weekday: 1 = Monday ... 7 = Sunday. */
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type WeekStart = 'mon' | 'sun';
export type LanguageSetting = 'system' | 'ko' | 'en';
export type AppLanguage = 'ko' | 'en';

export type HabitType = 'check' | 'quantity';
export type GoalDirection = 'at_least' | 'at_most';
export type RecurrenceType = 'daily' | 'weekdays' | 'weekly_count';
export type RecurrenceInterval = 1 | 2;
export type LogSource = 'manual' | 'auto';

export interface Category {
  id: number;
  name: string;
  sortOrder: number;
  createdAt: number;
}

export interface Habit {
  id: number;
  name: string;
  categoryId: number | null;
  /** `#RRGGBB` */
  color: string;
  type: HabitType;
  /** Always 1 for `check`. */
  goalValue: number;
  unit: string | null;
  /** Always `at_least` for `check`. */
  goalDirection: GoalDirection;
  recurrenceType: RecurrenceType;
  /** Only meaningful for `weekdays`: 1 = every week, 2 = every other week. */
  recurrenceInterval: RecurrenceInterval;
  /** Only meaningful for `weekdays`. */
  daysOfWeek: IsoWeekday[];
  /** Only meaningful for `weekly_count` (1-7). */
  timesPerWeek: number | null;
  startDate: ISODate;
  /** Logical date the habit was archived; the habit is not due on/after it. */
  archivedAt: ISODate | null;
  sortOrder: number;
  createdAt: number;
}

/** Fields of a habit that the rule functions need. */
export type HabitRule = Pick<
  Habit,
  | 'type'
  | 'goalValue'
  | 'goalDirection'
  | 'recurrenceType'
  | 'recurrenceInterval'
  | 'daysOfWeek'
  | 'timesPerWeek'
  | 'startDate'
  | 'archivedAt'
>;

export interface HabitLog {
  id: number;
  habitId: number;
  date: ISODate;
  value: number;
  source: LogSource;
  updatedAt: number;
}

export interface AppSettings {
  language: LanguageSetting;
  weekStart: WeekStart;
  /** 0-23. A day "starts" at this local hour; earlier hours belong to the previous day. */
  dayStartHour: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'system',
  weekStart: 'sun',
  dayStartHour: 0,
};
