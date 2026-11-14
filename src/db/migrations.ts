/**
 * Schema versioning with `PRAGMA user_version`.
 *
 * To change the schema: append a new entry to MIGRATIONS with the next version number.
 * Never edit a migration that has already shipped.
 */

/** Minimal DB surface used by the migration runner (keeps it testable without expo-sqlite). */
export interface MigrationDb {
  execAsync(sql: string): Promise<void>;
  getFirstAsync<T>(sql: string): Promise<T | null>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}

export interface Migration {
  version: number;
  sql: string;
}

export const MIGRATIONS: readonly Migration[] = [
  {
    version: 1,
    sql: `
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE habits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  color TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('check', 'quantity')),
  goal_value REAL NOT NULL DEFAULT 1 CHECK (goal_value > 0),
  unit TEXT,
  goal_direction TEXT NOT NULL DEFAULT 'at_least' CHECK (goal_direction IN ('at_least', 'at_most')),
  recurrence_type TEXT NOT NULL CHECK (recurrence_type IN ('daily', 'weekdays', 'weekly_count')),
  recurrence_interval INTEGER NOT NULL DEFAULT 1 CHECK (recurrence_interval IN (1, 2)),
  days_of_week TEXT NOT NULL DEFAULT '[]',
  times_per_week INTEGER CHECK (times_per_week IS NULL OR times_per_week BETWEEN 1 AND 7),
  start_date TEXT NOT NULL,
  archived_at TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_habits_category ON habits(category_id);

CREATE TABLE habit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  value REAL NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'auto')),
  updated_at INTEGER NOT NULL,
  UNIQUE (habit_id, date)
);
CREATE INDEX idx_habit_logs_date ON habit_logs(date);

CREATE TABLE settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
`,
  },
];

export const LATEST_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;

/** Applies every migration newer than the DB's `user_version`, each in its own transaction. */
export async function migrateDbIfNeeded(db: MigrationDb): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let current = row?.user_version ?? 0;

  if (current > LATEST_VERSION) {
    throw new Error(
      `Database version ${current} is newer than this app supports (${LATEST_VERSION}).`,
    );
  }

  for (const m of MIGRATIONS) {
    if (m.version <= current) continue;
    await db.withTransactionAsync(async () => {
      await db.execAsync(m.sql);
      await db.execAsync(`PRAGMA user_version = ${m.version}`);
    });
    current = m.version;
  }
  return current;
}

/**
 * Passed to `<SQLiteProvider onInit>`. Connection-level pragmas must run outside a
 * transaction (foreign_keys is a no-op inside one) and on every app start.
 */
export async function initDatabase(db: MigrationDb): Promise<void> {
  await db.execAsync(`PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;`);
  await migrateDbIfNeeded(db);
}
