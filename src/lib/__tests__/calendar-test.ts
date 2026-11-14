import { makeRule } from '../__fixtures__/habit-rule';
import { buildMonthWeeks, buildWeekDays, getReportRates, getWeeklyGoals, isActiveInRange } from '../calendar';

describe('buildMonthWeeks', () => {
  // November 2026: Sun 11-01 ... Mon 11-30
  it('sun start: Nov 2026 begins on a Sunday -> 5 weeks, no leading blanks', () => {
    const weeks = buildMonthWeeks('2026-11', 'sun');
    expect(weeks).toHaveLength(5);
    expect(weeks[0][0]).toEqual({ date: '2026-11-01', inMonth: true });
    // last week: Sun 11-29, Mon 11-30, then Dec days are outside the month
    expect(weeks[4].map((d) => d.inMonth)).toEqual([true, true, false, false, false, false, false]);
    expect(weeks[4][2].date).toBe('2026-12-01');
  });

  it('mon start: Sunday 11-01 sits at the end of the first row -> 6 weeks', () => {
    const weeks = buildMonthWeeks('2026-11', 'mon');
    expect(weeks).toHaveLength(6);
    expect(weeks[0][0]).toEqual({ date: '2026-10-26', inMonth: false });
    expect(weeks[0][6]).toEqual({ date: '2026-11-01', inMonth: true });
    expect(weeks[5][0]).toEqual({ date: '2026-11-30', inMonth: true });
  });

  it('every row has 7 consecutive days and all month days appear exactly once', () => {
    for (const ws of ['sun', 'mon'] as const) {
      const weeks = buildMonthWeeks('2026-02', ws);
      weeks.forEach((w) => expect(w).toHaveLength(7));
      const inMonth = weeks.flat().filter((d) => d.inMonth).map((d) => d.date);
      expect(inMonth).toHaveLength(28);
      expect(inMonth[0]).toBe('2026-02-01');
      expect(inMonth.at(-1)).toBe('2026-02-28');
    }
  });

  it('crosses a year boundary (Dec 2025 / Jan 2026)', () => {
    const dec = buildMonthWeeks('2025-12', 'sun');
    expect(dec.at(-1)?.map((d) => d.date)).toEqual([
      '2025-12-28', '2025-12-29', '2025-12-30', '2025-12-31', '2026-01-01', '2026-01-02', '2026-01-03',
    ]);
    expect(dec.at(-1)?.filter((d) => d.inMonth)).toHaveLength(4);
  });
});

describe('isActiveInRange', () => {
  const from = '2026-11-01';
  const to = '2026-11-30';
  it.each([
    [{ startDate: '2026-10-01', archivedAt: null }, true],
    [{ startDate: '2026-11-30', archivedAt: null }, true],
    [{ startDate: '2026-12-01', archivedAt: null }, false],
    [{ startDate: '2026-10-01', archivedAt: '2026-11-01' }, false], // archived on the 1st: never active in Nov
    [{ startDate: '2026-10-01', archivedAt: '2026-11-02' }, true],
  ])('%p -> %p', (h, expected) => {
    expect(isActiveInRange(h, from, to)).toBe(expected);
  });
});

describe('buildWeekDays', () => {
  it('returns the 7 days of the week in week_start order, all shown', () => {
    // 2026-11-14 is a Saturday
    expect(buildWeekDays('2026-11-14', 'sun').map((d) => d.date)).toEqual([
      '2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14',
    ]);
    expect(buildWeekDays('2026-11-14', 'mon')[0].date).toBe('2026-11-09');
    expect(buildWeekDays('2026-11-14', 'mon').at(-1)?.date).toBe('2026-11-15');
    expect(buildWeekDays('2026-11-14', 'sun').every((d) => d.inMonth)).toBe(true);
  });
});

describe('getReportRates', () => {
  const today = '2026-11-14';
  const weekly = (id: number, timesPerWeek: number) => ({
    id,
    ...makeRule({ startDate: '2026-11-01', recurrenceType: 'weekly_count', timesPerWeek }),
  });

  it('sums day-based habits into `daily`', () => {
    const habits = [
      { id: 1, ...makeRule({ startDate: '2026-11-01' }) }, // 13 scheduled past days
      { id: 2, ...makeRule({ startDate: '2026-11-10' }) }, // 4 scheduled past days (10..13)
    ];
    const logs = { 1: { '2026-11-01': 1, '2026-11-02': 1 }, 2: { '2026-11-10': 1, '2026-11-14': 1 } };
    // habit 2: today is done -> counted: 5 scheduled, 2 done
    const r = getReportRates(habits, logs, '2026-11-01', '2026-11-30', today, 'sun');
    expect(r.daily).toEqual({ done: 4, scheduled: 18, pct: 22 });
    expect(r.weekly).toEqual({ done: 0, scheduled: 0, pct: null });
    expect(r).toMatchObject({ hasDaily: true, hasWeekly: false });
  });

  it('keeps weekly_count weeks separate from days', () => {
    const habits = [{ id: 1, ...makeRule({ startDate: '2026-11-01' }) }, weekly(2, 2)];
    // weekly habit: week of 11-01 achieved (2 days), week of 11-08 in progress (not counted)
    const logs = { 1: {}, 2: { '2026-11-02': 1, '2026-11-03': 1 } };
    const r = getReportRates(habits, logs, '2026-11-01', '2026-11-30', today, 'sun');
    expect(r.weekly).toEqual({ done: 1, scheduled: 1, pct: 100 });
    expect(r.daily).toEqual({ done: 0, scheduled: 13, pct: 0 });
    expect(r).toMatchObject({ hasDaily: true, hasWeekly: true });
  });

  it('one week range: the week counts once finished', () => {
    const habits = [weekly(1, 3)];
    const logs = { 1: { '2026-11-02': 1 } };
    expect(getReportRates(habits, logs, '2026-11-01', '2026-11-07', today, 'sun').weekly).toEqual({
      done: 0,
      scheduled: 1,
      pct: 0,
    });
  });

  it('is null when nothing is scheduled (future month)', () => {
    const habits = [{ id: 1, ...makeRule({ startDate: '2026-11-01' }) }];
    expect(getReportRates(habits, {}, '2026-12-01', '2026-12-31', today, 'sun').daily.pct).toBeNull();
  });
});

describe('getWeeklyGoals', () => {
  const today = '2026-11-14'; // Saturday
  const habits = [
    { id: 1, ...makeRule({ startDate: '2026-11-01' }) }, // daily: ignored
    { id: 2, ...makeRule({ startDate: '2026-11-01', recurrenceType: 'weekly_count', timesPerWeek: 2 }) },
    { id: 3, ...makeRule({ startDate: '2026-11-20', recurrenceType: 'weekly_count', timesPerWeek: 2 }) },
  ];
  const logs = { 2: { '2026-11-03': 1, '2026-11-10': 1 } };

  it('lists active weekly_count habits with progress and result', () => {
    const goals = getWeeklyGoals(habits, logs, '2026-11-14', today, 'sun');
    expect(goals.map((g) => g.habit.id)).toEqual([2]); // 3 starts later
    expect(goals[0]).toMatchObject({ completedDays: 1, target: 2, ratio: 0.5, result: 'pending' });
  });

  it('a finished week below target is missed', () => {
    const [goal] = getWeeklyGoals(habits, logs, '2026-11-01', today, 'sun');
    expect(goal).toMatchObject({ completedDays: 1, result: 'missed' });
  });
});
