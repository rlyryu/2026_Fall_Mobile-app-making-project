import { parseDaysOfWeek, rowsToSettings, rowToHabit, type HabitRow } from '../mappers';
import { LATEST_VERSION, MIGRATIONS, migrateDbIfNeeded, type MigrationDb } from '../migrations';

describe('migrations', () => {
  it('versions are consecutive starting at 1', () => {
    MIGRATIONS.forEach((m, i) => expect(m.version).toBe(i + 1));
    expect(LATEST_VERSION).toBe(MIGRATIONS.length);
  });

  const fakeDb = (userVersion: number) => {
    const executed: string[] = [];
    const db: MigrationDb = {
      execAsync: async (sql) => {
        executed.push(sql);
      },
      getFirstAsync: async <T,>() => ({ user_version: userVersion }) as T,
      withTransactionAsync: async (task) => task(),
    };
    return { db, executed };
  };

  it('applies all migrations to a fresh DB and bumps user_version', async () => {
    const { db, executed } = fakeDb(0);
    await expect(migrateDbIfNeeded(db)).resolves.toBe(LATEST_VERSION);
    expect(executed.filter((s) => s.includes('CREATE TABLE habits'))).toHaveLength(1);
    expect(executed.at(-1)).toBe(`PRAGMA user_version = ${LATEST_VERSION}`);
  });

  it('does nothing when already up to date', async () => {
    const { db, executed } = fakeDb(LATEST_VERSION);
    await migrateDbIfNeeded(db);
    expect(executed).toHaveLength(0);
  });

  it('refuses a DB from a newer app version', async () => {
    const { db } = fakeDb(LATEST_VERSION + 1);
    await expect(migrateDbIfNeeded(db)).rejects.toThrow();
  });
});

describe('mappers', () => {
  it('parses days_of_week defensively', () => {
    expect(parseDaysOfWeek('[5,1,3,1]')).toEqual([1, 3, 5]);
    expect(parseDaysOfWeek('[0,8,"2",2]')).toEqual([2]);
    expect(parseDaysOfWeek('not json')).toEqual([]);
    expect(parseDaysOfWeek('{"a":1}')).toEqual([]);
  });

  it('maps a habit row', () => {
    const row: HabitRow = {
      id: 1,
      name: '운동',
      category_id: null,
      color: '#1E88E5',
      type: 'check',
      goal_value: 5,
      unit: null,
      goal_direction: 'at_most',
      recurrence_type: 'weekdays',
      recurrence_interval: 2,
      days_of_week: '[1,3]',
      times_per_week: null,
      start_date: '2026-11-01',
      archived_at: null,
      sort_order: 0,
      created_at: 0,
    };
    expect(rowToHabit(row)).toMatchObject({
      name: '운동',
      goalValue: 1, // check is always 1
      goalDirection: 'at_least', // check is always at_least
      recurrenceType: 'weekdays',
      recurrenceInterval: 2,
      daysOfWeek: [1, 3],
    });
  });

  it('builds settings with defaults for missing/invalid values', () => {
    expect(rowsToSettings([])).toEqual({ language: 'system', weekStart: 'sun', dayStartHour: 0 });
    expect(
      rowsToSettings([
        { key: 'language', value: 'ko' },
        { key: 'week_start', value: 'mon' },
        { key: 'day_start_hour', value: '4' },
      ]),
    ).toEqual({ language: 'ko', weekStart: 'mon', dayStartHour: 4 });
    expect(
      rowsToSettings([
        { key: 'language', value: 'fr' },
        { key: 'week_start', value: 'tue' },
        { key: 'day_start_hour', value: '24' },
      ]),
    ).toEqual({ language: 'system', weekStart: 'sun', dayStartHour: 0 });
  });
});
