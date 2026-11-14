import { makeRule } from '../__fixtures__/habit-rule';
import { describeQuantity, getStep, nextQuantityValue, roundValue } from '../quantity';
import { buildTodaySections, resolveSelectedDate } from '../today';
import type { Category, Habit } from '../types';

const atLeast = { type: 'quantity', goalValue: 8, goalDirection: 'at_least' } as const;
const atMost = { type: 'quantity', goalValue: 3, goalDirection: 'at_most' } as const;

describe('nextQuantityValue', () => {
  it('at_least: adds, subtracts, and deletes the log at 0', () => {
    expect(nextQuantityValue(atLeast, null, 1)).toBe(1);
    expect(nextQuantityValue(atLeast, 5, 1)).toBe(6);
    expect(nextQuantityValue(atLeast, 5, -1)).toBe(4);
    expect(nextQuantityValue(atLeast, 1, -1)).toBeNull();
    expect(nextQuantityValue(atLeast, null, -1)).toBeNull();
  });

  it('at_most: 0 is a real record; - on unrecorded records 0', () => {
    expect(nextQuantityValue(atMost, null, -1)).toBe(0);
    expect(nextQuantityValue(atMost, null, 1)).toBe(1);
    expect(nextQuantityValue(atMost, 1, -1)).toBe(0);
    expect(nextQuantityValue(atMost, 0, -1)).toBe(0);
  });

  it('never goes negative and removes float noise', () => {
    expect(nextQuantityValue(atMost, 0.5, -2)).toBe(0);
    expect(nextQuantityValue(atLeast, 0.1, 0.2)).toBe(0.3);
    expect(roundValue(0.1 + 0.2)).toBe(0.3);
  });

  it('step is 1 for now', () => {
    expect(getStep({ type: 'quantity' })).toBe(1);
  });
});

describe('describeQuantity', () => {
  it('at_least ratio is clamped to 1', () => {
    expect(describeQuantity(atLeast, 4)).toEqual({ recorded: true, ratio: 0.5, over: false });
    expect(describeQuantity(atLeast, 20)).toMatchObject({ ratio: 1, over: false });
    expect(describeQuantity(atLeast, null)).toEqual({ recorded: false, ratio: 0, over: false });
  });

  it('at_most flags over-limit and distinguishes unrecorded from 0', () => {
    expect(describeQuantity(atMost, null).recorded).toBe(false);
    expect(describeQuantity(atMost, 0)).toEqual({ recorded: true, ratio: 0, over: false });
    expect(describeQuantity(atMost, 3).over).toBe(false);
    expect(describeQuantity(atMost, 4)).toMatchObject({ over: true, ratio: 1 });
  });
});

describe('resolveSelectedDate', () => {
  const today = '2026-11-14';
  it.each([
    [undefined, today],
    ['2026-11-10', '2026-11-10'],
    ['2026-11-14', '2026-11-14'],
    ['2026-11-15', today], // future is not allowed
    ['garbage', today],
    ['2026-02-30', today],
  ])('%p -> %p', (param, expected) => {
    expect(resolveSelectedDate(param, today)).toBe(expected);
  });
});

describe('buildTodaySections', () => {
  const today = '2026-11-14'; // Saturday
  const habit = (id: number, over: Partial<Habit> = {}): Habit => ({
    ...makeRule({ startDate: '2026-11-01' }),
    id,
    name: `h${id}`,
    categoryId: null,
    color: '#1E88E5',
    unit: null,
    sortOrder: id,
    createdAt: 0,
    ...over,
  });
  const cat = (id: number, name: string): Category => ({ id, name, sortOrder: id, createdAt: 0 });

  it('groups by category in category order, uncategorized last, omitting empty groups', () => {
    const sections = buildTodaySections(
      [habit(1), habit(2, { categoryId: 2 }), habit(3, { categoryId: 1 }), habit(4, { categoryId: 9 })],
      [cat(1, '건강'), cat(2, '공부'), cat(3, '빈 카테고리')],
      {},
      today,
      today,
      'sun',
    );
    expect(sections.map((s) => s.title)).toEqual(['건강', '공부', null]);
    expect(sections[2].data.map((i) => i.habit.id)).toEqual([1, 4]); // unknown category -> uncategorized
  });

  it('only includes habits due on the date', () => {
    const weekdays = habit(1, { recurrenceType: 'weekdays', daysOfWeek: [1], startDate: '2026-11-01' }); // Mondays
    const archived = habit(2, { archivedAt: '2026-11-10' });
    const notStarted = habit(3, { startDate: '2026-11-20' });
    const daily = habit(4);
    const sections = buildTodaySections([weekdays, archived, notStarted, daily], [], {}, today, today, 'sun');
    expect(sections.flatMap((s) => s.data.map((i) => i.habit.id))).toEqual([4]);
  });

  it('past dates show habits that were active then, with that day\'s value and state', () => {
    const archivedLater = habit(1, { archivedAt: '2026-11-12' });
    const logs = { 1: { '2026-11-10': 1 } };
    const sections = buildTodaySections([archivedLater], [], logs, '2026-11-10', today, 'sun');
    expect(sections[0].data[0]).toMatchObject({ value: 1, state: 'done' });
    expect(buildTodaySections([archivedLater], [], logs, '2026-11-12', today, 'sun')).toEqual([]);
  });

  it('weekly_count items carry this week\'s progress (even when already achieved)', () => {
    const weekly = habit(1, { recurrenceType: 'weekly_count', timesPerWeek: 2 });
    const logs = { 1: { '2026-11-09': 1, '2026-11-10': 1 } };
    const [section] = buildTodaySections([weekly], [], logs, today, today, 'sun');
    expect(section.data[0].week).toMatchObject({ completedDays: 2, target: 2, achieved: true });
    expect(section.data[0].state).toBe('today_pending'); // today itself is still unrecorded
  });

  it('non weekly_count items have no week progress', () => {
    const [section] = buildTodaySections([habit(1)], [], {}, today, today, 'sun');
    expect(section.data[0].week).toBeNull();
  });

  it('orders habits by sort order within a group', () => {
    const sections = buildTodaySections(
      [habit(1, { sortOrder: 5 }), habit(2, { sortOrder: 1 })],
      [],
      {},
      today,
      today,
      'sun',
    );
    expect(sections[0].data.map((i) => i.habit.id)).toEqual([2, 1]);
  });
});
