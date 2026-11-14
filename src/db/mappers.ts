/** Row <-> domain conversion. Pure (no expo-sqlite import) so it can be unit tested. */
import type {
  AppSettings,
  Category,
  Habit,
  HabitLog,
  IsoWeekday,
  LanguageSetting,
  WeekStart,
} from '@/lib/types';
import { DEFAULT_SETTINGS } from '@/lib/types';

export interface CategoryRow {
  id: number;
  name: string;
  sort_order: number;
  created_at: number;
}

export interface HabitRow {
  id: number;
  name: string;
  category_id: number | null;
  color: string;
  type: string;
  goal_value: number;
  unit: string | null;
  goal_direction: string;
  recurrence_type: string;
  recurrence_interval: number;
  days_of_week: string;
  times_per_week: number | null;
  start_date: string;
  archived_at: string | null;
  sort_order: number;
  created_at: number;
}

export interface HabitLogRow {
  id: number;
  habit_id: number;
  date: string;
  value: number;
  source: string;
  updated_at: number;
}

export function rowToCategory(r: CategoryRow): Category {
  return { id: r.id, name: r.name, sortOrder: r.sort_order, createdAt: r.created_at };
}

/** Parses the `days_of_week` JSON column; ignores anything that isn't an ISO weekday. */
export function parseDaysOfWeek(json: string): IsoWeekday[] {
  try {
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    const days = parsed.filter(
      (d): d is IsoWeekday => Number.isInteger(d) && d >= 1 && d <= 7,
    );
    return [...new Set(days)].sort((a, b) => a - b);
  } catch {
    return [];
  }
}

export function serializeDaysOfWeek(days: readonly IsoWeekday[]): string {
  return JSON.stringify([...days]);
}

export function rowToHabit(r: HabitRow): Habit {
  const type = r.type === 'quantity' ? 'quantity' : 'check';
  return {
    id: r.id,
    name: r.name,
    categoryId: r.category_id,
    color: r.color,
    type,
    goalValue: type === 'check' ? 1 : r.goal_value,
    unit: r.unit,
    goalDirection: type === 'quantity' && r.goal_direction === 'at_most' ? 'at_most' : 'at_least',
    recurrenceType:
      r.recurrence_type === 'weekdays' || r.recurrence_type === 'weekly_count'
        ? r.recurrence_type
        : 'daily',
    recurrenceInterval: r.recurrence_interval === 2 ? 2 : 1,
    daysOfWeek: parseDaysOfWeek(r.days_of_week),
    timesPerWeek: r.times_per_week,
    startDate: r.start_date,
    archivedAt: r.archived_at,
    sortOrder: r.sort_order,
    createdAt: r.created_at,
  };
}

export function rowToHabitLog(r: HabitLogRow): HabitLog {
  return {
    id: r.id,
    habitId: r.habit_id,
    date: r.date,
    value: r.value,
    source: r.source === 'auto' ? 'auto' : 'manual',
    updatedAt: r.updated_at,
  };
}

/** Builds settings from key/value rows, falling back to defaults for missing/invalid values. */
export function rowsToSettings(rows: readonly { key: string; value: string }[]): AppSettings {
  const map = new Map(rows.map((r) => [r.key, r.value]));

  const language = map.get('language');
  const weekStart = map.get('week_start');
  const dayStartHour = Number(map.get('day_start_hour'));

  return {
    language: (['system', 'ko', 'en'] as const).includes(language as LanguageSetting)
      ? (language as LanguageSetting)
      : DEFAULT_SETTINGS.language,
    weekStart:
      weekStart === 'mon' || weekStart === 'sun'
        ? (weekStart as WeekStart)
        : DEFAULT_SETTINGS.weekStart,
    dayStartHour:
      map.has('day_start_hour') &&
      Number.isInteger(dayStartHour) &&
      dayStartHour >= 0 &&
      dayStartHour <= 23
        ? dayStartHour
        : DEFAULT_SETTINGS.dayStartHour,
  };
}

export const SETTING_KEYS = {
  language: 'language',
  weekStart: 'week_start',
  dayStartHour: 'day_start_hour',
} as const satisfies Record<keyof AppSettings, string>;
