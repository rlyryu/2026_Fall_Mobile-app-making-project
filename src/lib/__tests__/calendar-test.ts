import { makeRule } from '../__fixtures__/habit-rule';
import { buildMonthWeeks, getMonthRate, isActiveInRange } from '../calendar';

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

describe('getMonthRate', () => {
  it('sums per-habit rates for the month', () => {
    const today = '2026-11-14';
    const habits = [
      { id: 1, ...makeRule({ startDate: '2026-11-01' }) }, // 13 scheduled past days
      { id: 2, ...makeRule({ startDate: '2026-11-10' }) }, // 4 scheduled past days (10..13)
    ];
    const logs = { 1: { '2026-11-01': 1, '2026-11-02': 1 }, 2: { '2026-11-10': 1, '2026-11-14': 1 } };
    // habit 2: today is done -> counted: 5 scheduled, 2 done
    expect(getMonthRate(habits, logs, '2026-11', today, 'sun')).toEqual({ done: 4, scheduled: 18, pct: 22 });
  });

  it('is null when nothing is scheduled (future month)', () => {
    const habits = [{ id: 1, ...makeRule({ startDate: '2026-11-01' }) }];
    expect(getMonthRate(habits, {}, '2026-12', '2026-11-14', 'sun').pct).toBeNull();
  });
});
