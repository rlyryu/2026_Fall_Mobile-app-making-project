import { getWeeklyProgress } from '../progress';
import { makeRule } from '../__fixtures__/habit-rule';

describe('weekly_count progress', () => {
  const rule = makeRule({ recurrenceType: 'weekly_count', timesPerWeek: 3 });
  // Fri 2025-12-26, Sat 12-27, Sun 12-28, then Mon 12-29
  const values = { '2025-12-26': 1, '2025-12-27': 1, '2025-12-28': 1 };

  it('counts completed days in the week (mon start)', () => {
    const p = getWeeklyProgress(rule, values, '2025-12-24', 'mon');
    expect(p.weekDates[0]).toBe('2025-12-22');
    expect(p).toMatchObject({ completedDays: 3, target: 3, achieved: true, ratio: 1 });
  });

  it('resets at the week boundary: Sunday -> Monday (mon start)', () => {
    expect(getWeeklyProgress(rule, values, '2025-12-28', 'mon').completedDays).toBe(3);
    const monday = getWeeklyProgress(rule, values, '2025-12-29', 'mon');
    expect(monday).toMatchObject({ completedDays: 0, achieved: false, ratio: 0 });
  });

  it('resets at the week boundary: Saturday -> Sunday (sun start)', () => {
    const sat = getWeeklyProgress(rule, values, '2025-12-27', 'sun');
    expect(sat).toMatchObject({ completedDays: 2, achieved: false });
    expect(sat.ratio).toBeCloseTo(2 / 3);
    const sun = getWeeklyProgress(rule, values, '2025-12-28', 'sun');
    expect(sun.weekDates[0]).toBe('2025-12-28');
    expect(sun).toMatchObject({ completedDays: 1, achieved: false });
  });

  it('counts extra completions beyond N but clamps ratio', () => {
    const many = {
      '2026-11-16': 1,
      '2026-11-17': 1,
      '2026-11-18': 1,
      '2026-11-19': 1,
    };
    const p = getWeeklyProgress(rule, many, '2026-11-18', 'mon');
    expect(p).toMatchObject({ completedDays: 4, target: 3, achieved: true, ratio: 1 });
  });

  it('ignores logs that do not complete the habit', () => {
    const p = getWeeklyProgress(rule, { '2026-11-16': 0 }, '2026-11-16', 'mon');
    expect(p.completedDays).toBe(0);
  });

  it('uses the per-day completion rule for quantity habits', () => {
    const q = makeRule({
      recurrenceType: 'weekly_count',
      timesPerWeek: 2,
      type: 'quantity',
      goalValue: 30,
      goalDirection: 'at_least',
    });
    const p = getWeeklyProgress(q, { '2026-11-16': 30, '2026-11-17': 10 }, '2026-11-17', 'mon');
    expect(p.completedDays).toBe(1);
  });

  it('ignores logs before start_date and on/after archived_at', () => {
    const r = makeRule({
      recurrenceType: 'weekly_count',
      timesPerWeek: 3,
      startDate: '2026-11-18',
      archivedAt: '2026-11-21',
    });
    const v = {
      '2026-11-16': 1, // before start
      '2026-11-18': 1,
      '2026-11-20': 1,
      '2026-11-21': 1, // archived
    };
    expect(getWeeklyProgress(r, v, '2026-11-18', 'mon').completedDays).toBe(2);
  });
});

describe('progress for other recurrence types', () => {
  it('weekdays: target is the number of due days in the week', () => {
    const r = makeRule({ recurrenceType: 'weekdays', daysOfWeek: [1, 3, 5] });
    const p = getWeeklyProgress(r, { '2026-11-16': 1, '2026-11-17': 1 }, '2026-11-16', 'mon');
    // 11-17 is Tuesday (not due), so it does not count
    expect(p).toMatchObject({ completedDays: 1, target: 3, achieved: false });
  });

  it('daily: target is 7 in a full week', () => {
    const p = getWeeklyProgress(makeRule(), {}, '2026-11-16', 'mon');
    expect(p.target).toBe(7);
  });
});
