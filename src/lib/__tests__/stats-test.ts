import { makeRule } from '../__fixtures__/habit-rule';
import { addDays } from '../date';
import {
  calcPct,
  getDayAggregate,
  getDayState,
  getMonthHistory,
  getRate,
  getStreaks,
  getWeekResult,
  groupLogsByHabit,
  sumRates,
  type ValuesByDate,
} from '../stats';
import type { HabitRule, WeekStart } from '../types';

/**
 * Calendar used below (today = Sat 2026-11-14):
 *   Sun 11-01  Mon 11-02 ... Sat 11-07 | Sun 11-08  Mon 11-09 Tue 11-10 Wed 11-11 Thu 11-12 Fri 11-13 Sat 11-14
 * sun-start weeks: [11-01..11-07] [11-08..11-14]; mon-start weeks: [11-02..11-08] [11-09..11-15]
 */
const TODAY = '2026-11-14';

const state = (
  rule: ReturnType<typeof makeRule>,
  date: string,
  values: ValuesByDate = {},
  weekStart: WeekStart = 'sun',
) => getDayState(rule, date, values, TODAY, weekStart);

const daily = (o: Partial<HabitRule> = {}) => makeRule({ startDate: '2026-11-01', ...o });
const done = (...dates: string[]): ValuesByDate => Object.fromEntries(dates.map((d) => [d, 1]));
const range = (from: string, to: string) => {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
};

describe('getDayState: daily check', () => {
  it('done / missed / today_pending / future', () => {
    const v = done('2026-11-10', '2026-11-14');
    expect(state(daily(), '2026-11-10', v)).toBe('done');
    expect(state(daily(), '2026-11-11', v)).toBe('missed');
    expect(state(daily(), '2026-11-14', v)).toBe('done'); // today, done
    expect(state(daily(), '2026-11-14', {})).toBe('today_pending');
    expect(state(daily(), '2026-11-15', {})).toBe('future');
  });

  it('a logged 0 on a check habit counts as nothing recorded', () => {
    expect(state(daily(), '2026-11-10', { '2026-11-10': 0 })).toBe('missed');
    expect(state(daily(), '2026-11-14', { '2026-11-14': 0 })).toBe('today_pending');
  });

  it('before start_date is not_scheduled, even with a stray log', () => {
    const r = daily({ startDate: '2026-11-10' });
    expect(state(r, '2026-11-09', done('2026-11-09'))).toBe('not_scheduled');
    expect(state(r, '2026-11-10', {})).toBe('missed');
  });

  it('on/after archived_at is not_scheduled (past and future), the day before still counts', () => {
    const r = daily({ archivedAt: '2026-11-12' });
    expect(state(r, '2026-11-11', {})).toBe('missed');
    expect(state(r, '2026-11-12', done('2026-11-12'))).toBe('not_scheduled');
    expect(state(r, '2026-11-13', {})).toBe('not_scheduled');
    expect(state(r, '2026-11-15', {})).toBe('not_scheduled');
  });
});

describe('getDayState: quantity at_least', () => {
  const r = daily({ type: 'quantity', goalValue: 8 });
  it('partial when below goal, done at/above goal', () => {
    expect(state(r, '2026-11-10', { '2026-11-10': 5 })).toBe('partial');
    expect(state(r, '2026-11-10', { '2026-11-10': 8 })).toBe('done');
    expect(state(r, '2026-11-10', { '2026-11-10': 12 })).toBe('done');
    expect(state(r, '2026-11-14', { '2026-11-14': 5 })).toBe('partial'); // today
  });
  it('0 or no log is missed (past) / pending (today)', () => {
    expect(state(r, '2026-11-10', { '2026-11-10': 0 })).toBe('missed');
    expect(state(r, '2026-11-10', {})).toBe('missed');
    expect(state(r, '2026-11-14', {})).toBe('today_pending');
  });
});

describe('getDayState: quantity at_most', () => {
  const r = daily({ type: 'quantity', goalValue: 3, goalDirection: 'at_most' });
  it('no log is NOT success: missed in the past, pending today', () => {
    expect(state(r, '2026-11-10', {})).toBe('missed');
    expect(state(r, '2026-11-14', {})).toBe('today_pending');
  });
  it('value 0 and value == goal are done', () => {
    expect(state(r, '2026-11-10', { '2026-11-10': 0 })).toBe('done');
    expect(state(r, '2026-11-10', { '2026-11-10': 3 })).toBe('done');
    expect(state(r, '2026-11-14', { '2026-11-14': 2 })).toBe('done');
  });
  it('over the goal is missed (even today), never partial', () => {
    expect(state(r, '2026-11-10', { '2026-11-10': 4 })).toBe('missed');
    expect(state(r, '2026-11-14', { '2026-11-14': 4 })).toBe('missed');
  });
});

describe('getDayState: weekdays', () => {
  const r = makeRule({ recurrenceType: 'weekdays', daysOfWeek: [1, 3, 5], startDate: '2026-11-01' });
  it('scheduled weekdays can be done/missed; other days are not_scheduled', () => {
    expect(state(r, '2026-11-09', {})).toBe('missed'); // Mon
    expect(state(r, '2026-11-10', {})).toBe('not_scheduled'); // Tue
    expect(state(r, '2026-11-10', done('2026-11-10'))).toBe('not_scheduled'); // stray log
    expect(state(r, '2026-11-11', done('2026-11-11'))).toBe('done'); // Wed
  });

  it('biweekly: off week is not_scheduled; parity follows week_start', () => {
    const bi = makeRule({
      recurrenceType: 'weekdays',
      recurrenceInterval: 2,
      daysOfWeek: [1, 3],
      startDate: '2026-11-01', // a Sunday
    });
    // sun start: base week [11-01..11-07] on, [11-08..11-14] off
    expect(state(bi, '2026-11-02', {}, 'sun')).toBe('missed');
    expect(state(bi, '2026-11-11', {}, 'sun')).toBe('not_scheduled');
    // mon start: Sunday 11-01 ends the base week [10-26..11-01]; [11-02..11-08] off, [11-09..11-15] on
    expect(state(bi, '2026-11-02', {}, 'mon')).toBe('not_scheduled');
    expect(state(bi, '2026-11-11', {}, 'mon')).toBe('missed');
  });
});

describe('getDayState: weekly_count', () => {
  const r = makeRule({ recurrenceType: 'weekly_count', timesPerWeek: 2, startDate: '2026-11-01' });
  it('only days that were done are shown; other past days are not_scheduled', () => {
    expect(state(r, '2026-11-10', done('2026-11-10'))).toBe('done');
    expect(state(r, '2026-11-09', {})).toBe('not_scheduled');
  });
  it('unrecorded today is pending; future is future; before start is not_scheduled', () => {
    expect(state(r, '2026-11-14', {})).toBe('today_pending');
    expect(state(r, '2026-11-15', {})).toBe('future');
    expect(state(r, '2026-10-31', done('2026-10-31'))).toBe('not_scheduled');
  });
});

describe('getRate: daily/weekdays', () => {
  it('excludes an unrecorded today and future days from the denominator', () => {
    const rate = getRate(daily(), done('2026-11-02', '2026-11-03'), '2026-11-01', '2026-11-30', TODAY, 'sun');
    expect(rate).toEqual({ done: 2, scheduled: 13, pct: 15 }); // 11-01..11-13
  });

  it('includes today once it is done', () => {
    const rate = getRate(daily(), done('2026-11-14'), '2026-11-01', '2026-11-30', TODAY, 'sun');
    expect(rate).toEqual({ done: 1, scheduled: 14, pct: 7 });
  });

  it('ignores days before start_date', () => {
    const rate = getRate(daily(), {}, '2026-10-01', '2026-11-14', TODAY, 'sun');
    expect(rate.scheduled).toBe(13);
  });

  it('ignores days on/after archived_at', () => {
    const rate = getRate(daily({ archivedAt: '2026-11-08' }), {}, '2026-11-01', '2026-11-30', TODAY, 'sun');
    expect(rate.scheduled).toBe(7); // 11-01..11-07
  });

  it('at_most: unrecorded days are scheduled but never done', () => {
    const r = daily({ type: 'quantity', goalValue: 3, goalDirection: 'at_most' });
    const values = { '2026-11-01': 0, '2026-11-02': 3, '2026-11-03': 5 };
    expect(getRate(r, values, '2026-11-01', '2026-11-13', TODAY, 'sun')).toEqual({
      done: 2,
      scheduled: 13,
      pct: 15,
    });
  });

  it('at_most over the limit today is not counted (today only counts when done)', () => {
    const r = daily({ type: 'quantity', goalValue: 3, goalDirection: 'at_most' });
    expect(getRate(r, { '2026-11-14': 5 }, '2026-11-14', '2026-11-14', TODAY, 'sun')).toEqual({
      done: 0,
      scheduled: 0,
      pct: null,
    });
  });

  it('weekdays: only scheduled days count', () => {
    const r = makeRule({ recurrenceType: 'weekdays', daysOfWeek: [1, 3, 5], startDate: '2026-11-01' });
    // Mon 11-02, Wed 11-04, Fri 11-06, Mon 11-09, Wed 11-11, Fri 11-13 are scheduled
    const rate = getRate(r, done('2026-11-02', '2026-11-04', '2026-11-09'), '2026-11-01', '2026-11-14', TODAY, 'sun');
    expect(rate).toEqual({ done: 3, scheduled: 6, pct: 50 });
  });

  it('nothing scheduled -> pct is null', () => {
    expect(getRate(daily(), {}, '2026-11-20', '2026-11-30', TODAY, 'sun').pct).toBeNull();
  });

  it('done count always equals the number of getDayState === "done" days', () => {
    const habits = [
      daily(),
      daily({ type: 'quantity', goalValue: 8 }),
      daily({ type: 'quantity', goalValue: 3, goalDirection: 'at_most' }),
      makeRule({ recurrenceType: 'weekdays', daysOfWeek: [1, 3, 5], startDate: '2026-11-01' }),
    ];
    const values: ValuesByDate = { '2026-11-02': 1, '2026-11-03': 9, '2026-11-04': 0, '2026-11-09': 3, '2026-11-14': 1 };
    for (const h of habits) {
      const days = range('2026-11-01', '2026-11-30');
      const byState = days.filter((d) => getDayState(h, d, values, TODAY, 'sun') === 'done').length;
      expect(getRate(h, values, '2026-11-01', '2026-11-30', TODAY, 'sun').done).toBe(byState);
    }
  });
});

describe('getWeekResult / getRate: weekly_count', () => {
  const r = makeRule({ recurrenceType: 'weekly_count', timesPerWeek: 2, startDate: '2026-11-01' });

  it('a finished week below N is missed; in-progress below N is pending', () => {
    const v = done('2026-11-02', '2026-11-09');
    expect(getWeekResult(r, v, '2026-11-01', TODAY, 'sun')).toBe('missed');
    expect(getWeekResult(r, v, '2026-11-08', TODAY, 'sun')).toBe('pending');
    expect(getWeekResult(r, done('2026-11-09', '2026-11-10'), '2026-11-08', TODAY, 'sun')).toBe('done');
    expect(getWeekResult(r, {}, '2026-10-25', TODAY, 'sun')).toBe('inactive');
  });

  it('in-progress week is excluded until achieved', () => {
    const v = done('2026-11-02', '2026-11-04', '2026-11-09');
    expect(getRate(r, v, '2026-11-01', '2026-11-30', TODAY, 'sun')).toEqual({ done: 1, scheduled: 1, pct: 100 });
    const achieved = { ...v, '2026-11-10': 1 };
    expect(getRate(r, achieved, '2026-11-01', '2026-11-30', TODAY, 'sun')).toEqual({ done: 2, scheduled: 2, pct: 100 });
  });

  it('a finished under-N week counts against the rate', () => {
    expect(getRate(r, done('2026-11-02'), '2026-11-01', '2026-11-30', TODAY, 'sun')).toEqual({
      done: 0,
      scheduled: 1,
      pct: 0,
    });
  });

  it('week boundary follows week_start (Sat 11-07 + Sun 11-08)', () => {
    const v = done('2026-11-07', '2026-11-08');
    // sun start: split across two weeks -> first week missed (1/2), second pending
    expect(getRate(r, v, '2026-11-01', '2026-11-14', TODAY, 'sun')).toEqual({ done: 0, scheduled: 1, pct: 0 });
    // mon start: both days in [11-02..11-08] -> achieved
    expect(getRate(r, v, '2026-11-01', '2026-11-14', TODAY, 'mon')).toEqual({ done: 1, scheduled: 1, pct: 100 });
  });

  it('ignores archived weeks', () => {
    const arch = { ...r, archivedAt: '2026-11-08' };
    expect(getWeekResult(arch, {}, '2026-11-08', TODAY, 'sun')).toBe('inactive');
  });
});

describe('getStreaks: daily', () => {
  it('counts consecutive done days; today done is included', () => {
    const s = getStreaks(daily(), done(...range('2026-11-10', '2026-11-14')), TODAY, 'sun');
    expect(s).toEqual({
      current: 5,
      best: 5,
      top3: [{ start: '2026-11-10', end: '2026-11-14', length: 5 }],
    });
  });

  it('an unrecorded today does not break the current streak', () => {
    const s = getStreaks(daily(), done(...range('2026-11-10', '2026-11-13')), TODAY, 'sun');
    expect(s.current).toBe(4);
  });

  it('a missed past day breaks it', () => {
    const s = getStreaks(daily(), done('2026-11-10', '2026-11-11', '2026-11-13'), TODAY, 'sun');
    expect(s.current).toBe(1);
    expect(s.best).toBe(2);
    expect(s.top3.map((r) => r.length)).toEqual([2, 1]);
  });

  it('the latest resolved day missed -> current is 0', () => {
    const s = getStreaks(daily(), done('2026-11-10', '2026-11-11'), TODAY, 'sun');
    expect(s.current).toBe(0);
    expect(s.best).toBe(2);
  });

  it('returns only the top 3, longest first', () => {
    const v = done(
      '2026-11-01', '2026-11-02', '2026-11-03', // 3
      '2026-11-05', '2026-11-06', // 2
      '2026-11-08', // 1
      '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', // 4
    );
    const s = getStreaks(daily(), v, TODAY, 'sun');
    expect(s.top3.map((r) => r.length)).toEqual([4, 3, 2]);
    expect(s.best).toBe(4);
    expect(s.current).toBe(4);
  });

  it('ties are ordered most recent first', () => {
    const s = getStreaks(daily(), done('2026-11-01', '2026-11-02', '2026-11-04', '2026-11-05'), TODAY, 'sun');
    expect(s.top3[0]).toEqual({ start: '2026-11-04', end: '2026-11-05', length: 2 });
    expect(s.top3[1]).toEqual({ start: '2026-11-01', end: '2026-11-02', length: 2 });
  });

  it('at_most: a day with no record breaks the streak', () => {
    const r = daily({ type: 'quantity', goalValue: 3, goalDirection: 'at_most' });
    const s = getStreaks(r, { '2026-11-10': 0, '2026-11-11': 2, '2026-11-13': 1 }, TODAY, 'sun');
    expect(s.top3.map((x) => x.length)).toEqual([2, 1]);
    expect(s.current).toBe(1);
  });

  it('ignores logs before start_date', () => {
    const r = daily({ startDate: '2026-11-10' });
    const s = getStreaks(r, done('2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11'), TODAY, 'sun');
    expect(s.top3[0]).toEqual({ start: '2026-11-10', end: '2026-11-11', length: 2 });
  });

  it('archived habit: streak ends at the last active day', () => {
    const r = daily({ archivedAt: '2026-11-12' });
    const s = getStreaks(r, done('2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12'), TODAY, 'sun');
    expect(s.best).toBe(3); // the 12th is after archiving
    expect(s.current).toBe(3);
  });
});

describe('getStreaks: weekdays', () => {
  const r = makeRule({ recurrenceType: 'weekdays', daysOfWeek: [1, 3, 5], startDate: '2026-11-01' });

  it('non-scheduled days are skipped, not broken', () => {
    const v = done('2026-11-02', '2026-11-04', '2026-11-06', '2026-11-09', '2026-11-11', '2026-11-13');
    const s = getStreaks(r, v, TODAY, 'sun');
    expect(s.current).toBe(6);
    expect(s.top3[0]).toEqual({ start: '2026-11-02', end: '2026-11-13', length: 6 });
  });

  it('a missed scheduled day breaks the run', () => {
    const v = done('2026-11-02', '2026-11-04', '2026-11-09', '2026-11-11', '2026-11-13');
    const s = getStreaks(r, v, TODAY, 'sun');
    expect(s.top3.map((x) => x.length)).toEqual([3, 2]);
    expect(s.current).toBe(3);
  });
});

describe('getStreaks: weekly_count (unit = weeks)', () => {
  // sun weeks from 10-04: 10-04, 10-11, 10-18, 10-25, 11-01, 11-08(current)
  const r = makeRule({ recurrenceType: 'weekly_count', timesPerWeek: 2, startDate: '2026-10-04' });
  const base = done(
    '2026-10-05', '2026-10-06', // week 10-04 achieved
    '2026-10-12', '2026-10-13', // week 10-11 achieved
    '2026-10-19', // week 10-18 missed (1/2)
    '2026-10-26', '2026-10-27', // week 10-25 achieved
    '2026-11-02', '2026-11-03', // week 11-01 achieved
    '2026-11-09', // week 11-08 in progress (1/2)
  );

  it('counts consecutive achieved weeks; the in-progress week does not break it', () => {
    const s = getStreaks(r, base, TODAY, 'sun');
    expect(s.current).toBe(2);
    expect(s.best).toBe(2);
    expect(s.top3).toEqual([
      { start: '2026-10-25', end: '2026-11-07', length: 2 },
      { start: '2026-10-04', end: '2026-10-17', length: 2 },
    ]);
  });

  it('achieving the current week extends the streak', () => {
    const s = getStreaks(r, { ...base, '2026-11-10': 1 }, TODAY, 'sun');
    expect(s.current).toBe(3);
    expect(s.top3[0]).toEqual({ start: '2026-10-25', end: '2026-11-14', length: 3 });
  });

  it('a finished week below N resets the current streak', () => {
    const s = getStreaks(r, done('2026-10-05', '2026-10-06', '2026-10-12'), TODAY, 'sun');
    expect(s.current).toBe(0);
    expect(s.best).toBe(1);
  });
});

describe('getMonthHistory', () => {
  it('returns n months oldest-first with done counts; only the current month is in progress', () => {
    const r = daily({ startDate: '2026-06-01' });
    const v = done(
      '2026-06-01', '2026-06-02', '2026-06-03',
      ...range('2026-07-01', '2026-07-05'),
      '2026-09-01',
      '2026-10-01', '2026-10-02',
      '2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04',
    );
    const h = getMonthHistory(r, v, '2026-11', TODAY, 'sun');
    expect(h.map((m) => m.month)).toEqual(['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11']);
    expect(h.map((m) => m.done)).toEqual([3, 5, 0, 1, 2, 4]);
    expect(h.map((m) => m.scheduled)).toEqual([30, 31, 31, 30, 31, 13]);
    expect(h.map((m) => m.inProgress)).toEqual([false, false, false, false, false, true]);
  });

  it('crosses a year boundary and respects start_date', () => {
    const r = daily({ startDate: '2025-12-15' });
    const h = getMonthHistory(r, {}, '2026-02', TODAY, 'sun', 4);
    expect(h.map((m) => m.month)).toEqual(['2025-11', '2025-12', '2026-01', '2026-02']);
    expect(h.map((m) => m.scheduled)).toEqual([0, 17, 31, 28]);
    expect(h[0].pct).toBeNull();
  });

  it('weekly_count counts achieved weeks, attributed to the month the week starts in', () => {
    const r = makeRule({ recurrenceType: 'weekly_count', timesPerWeek: 2, startDate: '2026-10-04' });
    const v = done(
      '2026-10-05', '2026-10-06', '2026-10-12', '2026-10-13', '2026-10-19',
      '2026-10-26', '2026-10-27', '2026-11-02', '2026-11-03', '2026-11-09',
    );
    const h = getMonthHistory(r, v, '2026-11', TODAY, 'sun', 2);
    // Oct weeks start 10-04, 10-11, 10-18, 10-25 -> 3 of 4 achieved
    expect(h[0]).toMatchObject({ month: '2026-10', done: 3, scheduled: 4 });
    // Nov: week 11-01 achieved; 11-08 still in progress -> excluded
    expect(h[1]).toMatchObject({ month: '2026-11', done: 1, scheduled: 1, inProgress: true });
  });
});

describe('getDayAggregate', () => {
  const habits = [
    { id: 1, ...daily() }, // done
    { id: 2, ...daily() }, // missed
    { id: 3, ...makeRule({ recurrenceType: 'weekdays', daysOfWeek: [1], startDate: '2026-11-01' }) }, // Thu: not scheduled
    { id: 4, ...makeRule({ recurrenceType: 'weekly_count', timesPerWeek: 2, startDate: '2026-11-01' }) }, // not done: not scheduled
    { id: 5, ...daily({ type: 'quantity', goalValue: 8 }) }, // partial
  ];
  const logs = groupLogsByHabit([
    { id: 1, habitId: 1, date: '2026-11-12', value: 1, source: 'manual', updatedAt: 0 },
    { id: 2, habitId: 5, date: '2026-11-12', value: 3, source: 'manual', updatedAt: 0 },
  ]);

  it('counts done and scheduled across habits', () => {
    expect(getDayAggregate('2026-11-12', habits, logs, TODAY, 'sun')).toEqual({ done: 1, scheduled: 3 });
  });

  it('weekly_count counts on days it was done', () => {
    const withWeekly = groupLogsByHabit([
      { id: 1, habitId: 4, date: '2026-11-12', value: 1, source: 'manual', updatedAt: 0 },
    ]);
    expect(getDayAggregate('2026-11-12', [habits[3]], withWeekly, TODAY, 'sun')).toEqual({ done: 1, scheduled: 1 });
  });

  it('today includes pending habits in scheduled; future is empty', () => {
    expect(getDayAggregate(TODAY, habits, logs, TODAY, 'sun')).toEqual({ done: 0, scheduled: 4 }); // 1,2,4(pending),5
    expect(getDayAggregate('2026-11-20', habits, logs, TODAY, 'sun')).toEqual({ done: 0, scheduled: 0 });
  });
});

describe('helpers', () => {
  it('calcPct / sumRates', () => {
    expect(calcPct(1, 3)).toBe(33);
    expect(calcPct(0, 0)).toBeNull();
    expect(sumRates([{ done: 1, scheduled: 2, pct: 50 }, { done: 3, scheduled: 4, pct: 75 }])).toEqual({
      done: 4,
      scheduled: 6,
      pct: 67,
    });
  });
});
