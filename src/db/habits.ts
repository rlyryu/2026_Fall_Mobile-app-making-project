import type { SQLiteDatabase } from 'expo-sqlite';

import type { Habit, ISODate } from '@/lib/types';
import type { HabitInput } from '@/lib/validation';

import { notifyDbChanged } from './events';
import { type HabitRow, rowToHabit, serializeDaysOfWeek } from './mappers';

const ORDER = 'ORDER BY sort_order, id';

export async function listHabits(
  db: SQLiteDatabase,
  { archived }: { archived: boolean },
): Promise<Habit[]> {
  const rows = await db.getAllAsync<HabitRow>(
    `SELECT * FROM habits WHERE archived_at IS ${archived ? 'NOT NULL' : 'NULL'} ${ORDER}`,
  );
  return rows.map(rowToHabit);
}

/**
 * Habits whose active range contains `date` (start_date <= date < archived_at), including
 * habits archived later than `date`. Recurrence filtering happens in `src/lib/recurrence.ts`.
 */
export async function listHabitsActiveOn(db: SQLiteDatabase, date: ISODate): Promise<Habit[]> {
  const rows = await db.getAllAsync<HabitRow>(
    `SELECT * FROM habits
     WHERE start_date <= ? AND (archived_at IS NULL OR archived_at > ?) ${ORDER}`,
    date,
    date,
  );
  return rows.map(rowToHabit);
}

export async function getHabit(db: SQLiteDatabase, id: number): Promise<Habit | null> {
  const row = await db.getFirstAsync<HabitRow>('SELECT * FROM habits WHERE id = ?', id);
  return row ? rowToHabit(row) : null;
}

function inputParams(input: HabitInput) {
  return [
    input.name,
    input.categoryId,
    input.color,
    input.type,
    input.goalValue,
    input.unit,
    input.goalDirection,
    input.recurrenceType,
    input.recurrenceInterval,
    serializeDaysOfWeek(input.daysOfWeek),
    input.timesPerWeek,
    input.startDate,
  ] as const;
}

export async function createHabit(db: SQLiteDatabase, input: HabitInput): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO habits (
       name, category_id, color, type, goal_value, unit, goal_direction,
       recurrence_type, recurrence_interval, days_of_week, times_per_week, start_date,
       sort_order, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
       (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM habits), ?)`,
    ...inputParams(input),
    Date.now(),
  );
  notifyDbChanged();
  return result.lastInsertRowId;
}

export async function updateHabit(
  db: SQLiteDatabase,
  id: number,
  input: HabitInput,
): Promise<void> {
  await db.runAsync(
    `UPDATE habits SET
       name = ?, category_id = ?, color = ?, type = ?, goal_value = ?, unit = ?,
       goal_direction = ?, recurrence_type = ?, recurrence_interval = ?, days_of_week = ?,
       times_per_week = ?, start_date = ?
     WHERE id = ?`,
    ...inputParams(input),
    id,
  );
  notifyDbChanged();
}

/** `archivedAt` is the logical date of archiving; the habit is not due from that date on. */
export async function archiveHabit(
  db: SQLiteDatabase,
  id: number,
  archivedAt: ISODate,
): Promise<void> {
  await db.runAsync('UPDATE habits SET archived_at = ? WHERE id = ?', archivedAt, id);
  notifyDbChanged();
}

export async function restoreHabit(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('UPDATE habits SET archived_at = NULL WHERE id = ?', id);
  notifyDbChanged();
}

/** Permanently deletes the habit and (via `ON DELETE CASCADE`) all of its logs. */
export async function deleteHabit(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM habits WHERE id = ?', id);
  notifyDbChanged();
}
