import {
  getWeekDates,
  getWeekRange,
  getWeekStart,
  isBiweeklyActive,
  orderedWeekdays,
  weeksBetween,
} from '../week';

describe('getWeekStart / getWeekRange', () => {
  // Sun 2025-12-28, Mon 2025-12-29, Thu 2026-01-01
  it('sun start: Sunday begins the week', () => {
    expect(getWeekStart('2025-12-28', 'sun')).toBe('2025-12-28');
    expect(getWeekStart('2025-12-27', 'sun')).toBe('2025-12-21'); // Sat -> previous Sunday
    expect(getWeekStart('2026-01-01', 'sun')).toBe('2025-12-28');
    expect(getWeekRange('2026-01-01', 'sun')).toEqual({ start: '2025-12-28', end: '2026-01-03' });
  });

  it('mon start: Sunday ends the week', () => {
    expect(getWeekStart('2025-12-28', 'mon')).toBe('2025-12-22');
    expect(getWeekStart('2025-12-29', 'mon')).toBe('2025-12-29');
    expect(getWeekRange('2025-12-28', 'mon')).toEqual({ start: '2025-12-22', end: '2025-12-28' });
  });

  it('week range crosses month and year boundaries', () => {
    expect(getWeekRange('2026-02-01', 'sun')).toEqual({ start: '2026-02-01', end: '2026-02-07' });
    expect(getWeekRange('2026-01-31', 'sun')).toEqual({ start: '2026-01-25', end: '2026-01-31' });
    expect(getWeekRange('2026-01-31', 'mon')).toEqual({ start: '2026-01-26', end: '2026-02-01' });
  });

  it('lists the 7 dates', () => {
    expect(getWeekDates('2026-01-01', 'mon')).toEqual([
      '2025-12-29',
      '2025-12-30',
      '2025-12-31',
      '2026-01-01',
      '2026-01-02',
      '2026-01-03',
      '2026-01-04',
    ]);
    expect(getWeekDates('2026-01-01', 'sun')[0]).toBe('2025-12-28');
  });
});

describe('weeksBetween', () => {
  it('counts whole weeks between week starts', () => {
    expect(weeksBetween('2025-12-17', '2025-12-21', 'mon')).toBe(0);
    expect(weeksBetween('2025-12-17', '2025-12-22', 'mon')).toBe(1);
    expect(weeksBetween('2025-12-17', '2026-01-01', 'mon')).toBe(2);
    expect(weeksBetween('2025-12-17', '2025-12-21', 'sun')).toBe(1);
    expect(weeksBetween('2026-01-01', '2025-12-17', 'mon')).toBe(-2);
  });
});

describe('isBiweeklyActive (14-day steps from the base week)', () => {
  // Base: Wed 2025-12-17.
  //   sun weeks: base [12-14..12-20], off [12-21..12-27], on [12-28..01-03], off [01-04..01-10], on [01-11..01-17]
  //   mon weeks: base [12-15..12-21], off [12-22..12-28], on [12-29..01-04], off [01-05..01-11], on [01-12..01-18]
  it('base week is active, next off, one after on (sun start)', () => {
    expect(isBiweeklyActive('2025-12-17', '2025-12-14', 'sun')).toBe(true); // same week, earlier day
    expect(isBiweeklyActive('2025-12-17', '2025-12-20', 'sun')).toBe(true);
    expect(isBiweeklyActive('2025-12-17', '2025-12-21', 'sun')).toBe(false);
    expect(isBiweeklyActive('2025-12-17', '2025-12-27', 'sun')).toBe(false);
    expect(isBiweeklyActive('2025-12-17', '2025-12-28', 'sun')).toBe(true);
    expect(isBiweeklyActive('2025-12-17', '2026-01-03', 'sun')).toBe(true);
    expect(isBiweeklyActive('2025-12-17', '2026-01-04', 'sun')).toBe(false);
    expect(isBiweeklyActive('2025-12-17', '2026-01-11', 'sun')).toBe(true);
  });

  it('same dates differ under mon start (Sunday belongs to the previous week)', () => {
    expect(isBiweeklyActive('2025-12-17', '2025-12-21', 'mon')).toBe(true); // Sun ends base week
    expect(isBiweeklyActive('2025-12-17', '2025-12-22', 'mon')).toBe(false);
    expect(isBiweeklyActive('2025-12-17', '2025-12-28', 'mon')).toBe(false); // Sun ends off week
    expect(isBiweeklyActive('2025-12-17', '2025-12-29', 'mon')).toBe(true);
    expect(isBiweeklyActive('2025-12-17', '2026-01-04', 'mon')).toBe(true);
    expect(isBiweeklyActive('2025-12-17', '2026-01-05', 'mon')).toBe(false);
  });

  it('start_date on a week boundary day', () => {
    // start = Sunday 2025-12-28: sun-start base week is [12-28..01-03]; mon-start base week is [12-22..12-28]
    expect(isBiweeklyActive('2025-12-28', '2025-12-28', 'sun')).toBe(true);
    expect(isBiweeklyActive('2025-12-28', '2026-01-04', 'sun')).toBe(false);
    expect(isBiweeklyActive('2025-12-28', '2026-01-11', 'sun')).toBe(true);
    expect(isBiweeklyActive('2025-12-28', '2025-12-28', 'mon')).toBe(true);
    expect(isBiweeklyActive('2025-12-28', '2025-12-29', 'mon')).toBe(false);
    expect(isBiweeklyActive('2025-12-28', '2026-01-05', 'mon')).toBe(true);
  });

  it('month and year boundaries', () => {
    // start Fri 2026-01-30
    expect(isBiweeklyActive('2026-01-30', '2026-01-31', 'mon')).toBe(true);
    expect(isBiweeklyActive('2026-01-30', '2026-02-01', 'mon')).toBe(true); // Sun still base week
    expect(isBiweeklyActive('2026-01-30', '2026-02-02', 'mon')).toBe(false);
    expect(isBiweeklyActive('2026-01-30', '2026-02-09', 'mon')).toBe(true);
    expect(isBiweeklyActive('2026-01-30', '2026-02-01', 'sun')).toBe(false); // new sun-week
    expect(isBiweeklyActive('2026-01-30', '2026-02-08', 'sun')).toBe(true);
  });

  it('is symmetric before the base week (used only with the active-range check)', () => {
    expect(isBiweeklyActive('2025-12-17', '2025-12-07', 'sun')).toBe(false);
    expect(isBiweeklyActive('2025-12-17', '2025-11-30', 'sun')).toBe(true);
  });
});

describe('orderedWeekdays', () => {
  it('follows week_start', () => {
    expect(orderedWeekdays('sun')).toEqual([7, 1, 2, 3, 4, 5, 6]);
    expect(orderedWeekdays('mon')).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});

describe('week_start never changes stored data', () => {
  it('days_of_week stays ISO; only the grouping of dates into weeks changes', () => {
    // Sunday (ISO 7) is the last day of a mon-week and the first day of a sun-week.
    expect(getWeekDates('2025-12-28', 'mon').at(-1)).toBe('2025-12-28');
    expect(getWeekDates('2025-12-28', 'sun')[0]).toBe('2025-12-28');
  });
});
