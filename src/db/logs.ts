import type { SQLiteDatabase } from 'expo-sqlite';

import type { HabitLog, ISODate } from '@/lib/types';

import { notifyDbChanged } from './events';
import { type HabitLogRow, rowToHabitLog } from './mappers';

/** Logs with `from <= date <= to`. */
export async function listLogsInRange(
  db: SQLiteDatabase,
  from: ISODate,
  to: ISODate,
): Promise<HabitLog[]> {
  const rows = await db.getAllAsync<HabitLogRow>(
    'SELECT * FROM habit_logs WHERE date BETWEEN ? AND ? ORDER BY date',
    from,
    to,
  );
  return rows.map(rowToHabitLog);
}

/** Inserts or replaces the manual record for (habit, date). */
export async function setLogValue(
  db: SQLiteDatabase,
  habitId: number,
  date: ISODate,
  value: number,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO habit_logs (habit_id, date, value, source, updated_at)
     VALUES (?, ?, ?, 'manual', ?)
     ON CONFLICT (habit_id, date) DO UPDATE SET
       value = excluded.value, source = 'manual', updated_at = excluded.updated_at`,
    habitId,
    date,
    value,
    Date.now(),
  );
  notifyDbChanged();
}

/** Removes the record for (habit, date), returning it to "unrecorded". */
export async function deleteLog(db: SQLiteDatabase, habitId: number, date: ISODate): Promise<void> {
  await db.runAsync('DELETE FROM habit_logs WHERE habit_id = ? AND date = ?', habitId, date);
  notifyDbChanged();
}
