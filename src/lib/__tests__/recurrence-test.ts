import { addDays } from '../date';
import { isHabitActiveOn, isHabitDueOn } from '../recurrence';
import { makeRule } from '../__fixtures__/habit-rule';

const dueDatesBetween = (
  rule: ReturnType<typeof makeRule>,
  from: string,
  to: string,
  weekStart: 'mon' | 'sun',
) => {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) {
    if (isHabitDueOn(rule, d, weekStart)) out.push(d);
  }
  return out;
};

describe('active range (start_date / archived_at)', () => {
  const rule = makeRule({ startDate: '2026-03-10', archivedAt: '2026-03-20' });

  it.each([
    ['2026-03-09', false],
    ['2026-03-10', true],
    ['2026-03-19', true],
    ['2026-03-20', false],
    ['2026-04-01', false],
  ])('%s -> %p', (date, expected) => {
    expect(isHabitActiveOn(rule, date)).toBe(expected);
    expect(isHabitDueOn(rule, date, 'mon')).toBe(expected);
  });

  it('is open-ended when not archived', () => {
    expect(isHabitActiveOn(makeRule({ startDate: '2026-03-10' }), '2099-01-01')).toBe(true);
  });

  it('applies to weekdays and weekly_count too', () => {
    const weekdays = makeRule({
      recurrenceType: 'weekdays',
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      startDate: '2026-03-10',
      archivedAt: '2026-03-20',
    });
    const weekly = makeRule({
      recurrenceType: 'weekly_count',
      timesPerWeek: 3,
      startDate: '2026-03-10',
      archivedAt: '2026-03-20',
    });
    for (const r of [weekdays, weekly]) {
      expect(isHabitDueOn(r, '2026-03-09', 'mon')).toBe(false);
      expect(isHabitDueOn(r, '2026-03-10', 'mon')).toBe(true);
      expect(isHabitDueOn(r, '2026-03-20', 'mon')).toBe(false);
    }
  });
});

describe('daily', () => {
  it('is due every day from start', () => {
    const rule = makeRule({ startDate: '2025-12-30' });
    expect(dueDatesBetween(rule, '2025-12-28', '2026-01-02', 'mon')).toEqual([
      '2025-12-30',
      '2025-12-31',
      '2026-01-01',
      '2026-01-02',
    ]);
  });
});

describe('weekdays, every week', () => {
  it('is due only on selected ISO weekdays', () => {
    const rule = makeRule({ recurrenceType: 'weekdays', daysOfWeek: [1, 3, 5] }); // Mon/Wed/Fri
    expect(dueDatesBetween(rule, '2026-11-16', '2026-11-22', 'mon')).toEqual([
      '2026-11-16',
      '2026-11-18',
      '2026-11-20',
    ]);
  });

  it('handles Sunday (7)', () => {
    const rule = makeRule({ recurrenceType: 'weekdays', daysOfWeek: [7] });
    expect(isHabitDueOn(rule, '2025-12-28', 'mon')).toBe(true);
    expect(isHabitDueOn(rule, '2025-12-28', 'sun')).toBe(true);
    expect(isHabitDueOn(rule, '2025-12-29', 'mon')).toBe(false);
  });
});

describe('weekdays, every other week', () => {
  // Start: Wed 2025-12-17. Mon/Wed selected.
  const rule = makeRule({
    recurrenceType: 'weekdays',
    recurrenceInterval: 2,
    daysOfWeek: [1, 3],
    startDate: '2025-12-17',
  });

  describe('week_start = mon', () => {
    it('base week: due on/after start only', () => {
      expect(isHabitDueOn(rule, '2025-12-15', 'mon')).toBe(false); // Mon, before start
      expect(isHabitDueOn(rule, '2025-12-17', 'mon')).toBe(true); // Wed, start
    });

    it('next week: not due', () => {
      expect(isHabitDueOn(rule, '2025-12-22', 'mon')).toBe(false);
      expect(isHabitDueOn(rule, '2025-12-24', 'mon')).toBe(false);
    });

    it('week after next (spans year end): due', () => {
      expect(isHabitDueOn(rule, '2025-12-29', 'mon')).toBe(true);
      expect(isHabitDueOn(rule, '2025-12-31', 'mon')).toBe(true);
    });

    it('keeps alternating into the new year', () => {
      expect(dueDatesBetween(rule, '2025-12-15', '2026-01-21', 'mon')).toEqual([
        '2025-12-17',
        '2025-12-29',
        '2025-12-31',
        '2026-01-12',
        '2026-01-14',
      ]);
    });
  });

  describe('week_start = sun', () => {
    const sunRule = { ...rule, daysOfWeek: [7, 1] as (1 | 7)[] }; // Sun/Mon

    it('Sunday 2025-12-28 starts a due week under sun, but belongs to an off week under mon', () => {
      // sun-start weeks: [12-14..12-20] base, [12-21..12-27] off, [12-28..01-03] due
      expect(isHabitDueOn(sunRule, '2025-12-28', 'sun')).toBe(true);
      expect(isHabitDueOn(sunRule, '2025-12-29', 'sun')).toBe(true);
      // mon-start weeks: [12-22..12-28] off, so Sun 12-28 is not due
      expect(isHabitDueOn(sunRule, '2025-12-28', 'mon')).toBe(false);
      expect(isHabitDueOn(sunRule, '2025-12-29', 'mon')).toBe(true);
    });

    it('lists due dates across the year boundary', () => {
      expect(dueDatesBetween(sunRule, '2025-12-14', '2026-01-17', 'sun')).toEqual([
        '2025-12-28',
        '2025-12-29',
        '2026-01-11',
        '2026-01-12',
      ]);
    });
  });

  it('month-end boundary (start Fri 2026-01-30, every day selected)', () => {
    const r = makeRule({
      recurrenceType: 'weekdays',
      recurrenceInterval: 2,
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      startDate: '2026-01-30',
    });
    const due = dueDatesBetween(r, '2026-01-26', '2026-02-15', 'mon');
    expect(due).toEqual([
      '2026-01-30',
      '2026-01-31',
      '2026-02-01',
      '2026-02-09',
      '2026-02-10',
      '2026-02-11',
      '2026-02-12',
      '2026-02-13',
      '2026-02-14',
      '2026-02-15',
    ]);
    // Under sun-start the base week ends Sat 01-31, so Sun 02-01 is in an off week.
    expect(isHabitDueOn(r, '2026-02-01', 'sun')).toBe(false);
    expect(isHabitDueOn(r, '2026-02-08', 'sun')).toBe(true);
  });
});

describe('weekly_count', () => {
  it('is due every day regardless of weekday', () => {
    const rule = makeRule({ recurrenceType: 'weekly_count', timesPerWeek: 2 });
    expect(dueDatesBetween(rule, '2026-11-16', '2026-11-22', 'mon')).toHaveLength(7);
  });
});
