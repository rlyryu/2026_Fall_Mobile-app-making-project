import type { SQLiteDatabase } from 'expo-sqlite';
import { useCallback } from 'react';

import { listCategories } from '@/db/categories';
import { getHabit, listHabits } from '@/db/habits';
import type { Category, Habit } from '@/lib/types';

import { useDbQuery } from './use-db-query';

const activeHabits = (db: SQLiteDatabase) => listHabits(db, { archived: false });
const archivedHabits = (db: SQLiteDatabase) => listHabits(db, { archived: true });

/** Non-archived (or archived) habits; `undefined` while loading. Auto-refreshes after writes. */
export function useHabits({ archived }: { archived: boolean }): Habit[] | undefined {
  return useDbQuery(archived ? archivedHabits : activeHabits).data;
}

/** One habit by id: `undefined` while loading, `null` if it doesn't exist. */
export function useHabit(id: number): Habit | null | undefined {
  const query = useCallback((db: SQLiteDatabase) => getHabit(db, id), [id]);
  return useDbQuery(query).data;
}

export function useCategories(): Category[] | undefined {
  return useDbQuery(listCategories).data;
}
