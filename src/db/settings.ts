import type { SQLiteDatabase } from 'expo-sqlite';

import type { AppSettings } from '@/lib/types';

import { notifyDbChanged } from './events';
import { rowsToSettings, SETTING_KEYS } from './mappers';

export async function getSettings(db: SQLiteDatabase): Promise<AppSettings> {
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM settings',
  );
  return rowsToSettings(rows);
}

export async function setSetting<K extends keyof AppSettings>(
  db: SQLiteDatabase,
  key: K,
  value: AppSettings[K],
): Promise<void> {
  await db.runAsync(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
    SETTING_KEYS[key],
    String(value),
  );
  notifyDbChanged();
}
