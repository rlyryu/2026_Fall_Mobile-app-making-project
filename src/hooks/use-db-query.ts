import { type SQLiteDatabase, useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import { subscribeDbChanges } from '@/db/events';

interface QueryState<T> {
  /** The query function this result belongs to (guards against showing stale params' data). */
  query: unknown;
  data?: T;
  error?: Error;
}

/**
 * Runs `query` against the DB, and re-runs it whenever any write calls `notifyDbChanged()`.
 *
 * `query` MUST be referentially stable (wrap it in `useCallback` with its inputs as deps);
 * a new function means "different query" and refetches. While a new query is loading,
 * `data` is `undefined` — never the previous query's result.
 */
export function useDbQuery<T>(query: (db: SQLiteDatabase) => Promise<T>): {
  data: T | undefined;
  error: Error | undefined;
} {
  const db = useSQLiteContext();
  const [state, setState] = useState<QueryState<T>>({ query: null });

  useEffect(() => {
    let cancelled = false;
    let latest = 0;

    const run = () => {
      const mine = ++latest;
      query(db).then(
        (data) => {
          if (!cancelled && mine === latest) setState({ query, data });
        },
        (error: unknown) => {
          if (!cancelled && mine === latest) {
            setState({ query, error: error instanceof Error ? error : new Error(String(error)) });
          }
        },
      );
    };

    run();
    const unsubscribe = subscribeDbChanges(run);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [db, query]);

  if (state.query !== query) return { data: undefined, error: undefined };
  return { data: state.data, error: state.error };
}
