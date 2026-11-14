import type { Category } from './types';

export interface CategoryGroup<T> {
  /** Stable key for list rendering. */
  key: string;
  categoryId: number | null;
  /** Category name; null = uncategorized (UI supplies the translated label). */
  title: string | null;
  data: T[];
}

/**
 * Groups items by category: categories in the given order, uncategorized last.
 * Items whose category no longer exists count as uncategorized. Empty groups are omitted.
 * Item order within a group is preserved.
 */
export function groupByCategory<T>(
  items: readonly T[],
  categories: readonly Category[],
  getCategoryId: (item: T) => number | null,
): CategoryGroup<T>[] {
  const known = new Set(categories.map((c) => c.id));
  const groups: CategoryGroup<T>[] = [];

  for (const c of categories) {
    const data = items.filter((i) => getCategoryId(i) === c.id);
    if (data.length > 0) groups.push({ key: `c${c.id}`, categoryId: c.id, title: c.name, data });
  }

  const rest = items.filter((i) => {
    const id = getCategoryId(i);
    return id === null || !known.has(id);
  });
  if (rest.length > 0) groups.push({ key: 'none', categoryId: null, title: null, data: rest });

  return groups;
}
