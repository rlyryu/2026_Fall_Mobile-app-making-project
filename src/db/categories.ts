import type { SQLiteDatabase } from 'expo-sqlite';

import type { Category } from '@/lib/types';

import { notifyDbChanged } from './events';
import { type CategoryRow, rowToCategory } from './mappers';

export async function listCategories(db: SQLiteDatabase): Promise<Category[]> {
  const rows = await db.getAllAsync<CategoryRow>(
    'SELECT * FROM categories ORDER BY sort_order, id',
  );
  return rows.map(rowToCategory);
}

export async function createCategory(db: SQLiteDatabase, name: string): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO categories (name, sort_order, created_at)
     VALUES (?, (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM categories), ?)`,
    name.trim(),
    Date.now(),
  );
  notifyDbChanged();
  return result.lastInsertRowId;
}

export async function renameCategory(db: SQLiteDatabase, id: number, name: string): Promise<void> {
  await db.runAsync('UPDATE categories SET name = ? WHERE id = ?', name.trim(), id);
  notifyDbChanged();
}

/** Habits in the category become uncategorized (FK `ON DELETE SET NULL`). */
export async function deleteCategory(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM categories WHERE id = ?', id);
  notifyDbChanged();
}
