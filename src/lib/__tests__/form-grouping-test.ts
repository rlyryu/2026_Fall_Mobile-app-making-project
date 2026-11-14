import { DEFAULT_HABIT_COLOR } from '../colors';
import { groupByCategory } from '../grouping';
import { DEFAULT_TIMES_PER_WEEK, emptyDraft, habitToDraft } from '../habit-draft';
import type { Category, Habit } from '../types';
import { normalizeHabitDraft, validateHabitDraft } from '../validation';
import { sortWeekdaysForDisplay } from '../week';

const habit: Habit = {
  id: 7,
  name: '물 마시기',
  categoryId: 2,
  color: '#43A047',
  type: 'quantity',
  goalValue: 1.5,
  unit: 'L',
  goalDirection: 'at_least',
  recurrenceType: 'weekdays',
  recurrenceInterval: 2,
  daysOfWeek: [1, 3],
  timesPerWeek: null,
  startDate: '2026-11-01',
  archivedAt: null,
  sortOrder: 0,
  createdAt: 0,
};

describe('emptyDraft', () => {
  it('starts as a daily check habit on the given date', () => {
    const d = emptyDraft('2026-11-14');
    expect(d).toMatchObject({
      name: '',
      type: 'check',
      recurrenceType: 'daily',
      color: DEFAULT_HABIT_COLOR,
      startDate: '2026-11-14',
      categoryId: null,
      timesPerWeek: DEFAULT_TIMES_PER_WEEK,
    });
    expect(validateHabitDraft(d).name).toBe('nameRequired'); // only the name is missing
    expect(Object.keys(validateHabitDraft(d))).toEqual(['name']);
  });
});

describe('habitToDraft', () => {
  it('round-trips through normalizeHabitDraft without changes', () => {
    const input = normalizeHabitDraft(habitToDraft(habit));
    expect(input).toEqual({
      name: habit.name,
      type: habit.type,
      goalValue: habit.goalValue,
      unit: habit.unit,
      goalDirection: habit.goalDirection,
      recurrenceType: habit.recurrenceType,
      recurrenceInterval: habit.recurrenceInterval,
      daysOfWeek: habit.daysOfWeek,
      timesPerWeek: habit.timesPerWeek,
      categoryId: habit.categoryId,
      color: habit.color,
      startDate: habit.startDate,
    });
  });

  it('check habits get an empty goal field; missing timesPerWeek gets the default', () => {
    const d = habitToDraft({ ...habit, type: 'check', goalValue: 1, unit: null, timesPerWeek: null });
    expect(d.goalValueText).toBe('');
    expect(d.unit).toBe('');
    expect(d.timesPerWeek).toBe(DEFAULT_TIMES_PER_WEEK);
  });
});

describe('groupByCategory', () => {
  const cats: Category[] = [
    { id: 1, name: 'A', sortOrder: 0, createdAt: 0 },
    { id: 2, name: 'B', sortOrder: 1, createdAt: 0 },
  ];
  const items = [
    { id: 1, c: 2 },
    { id: 2, c: null },
    { id: 3, c: 1 },
    { id: 4, c: 99 },
    { id: 5, c: 2 },
  ];

  it('orders by category, uncategorized (and unknown) last, keeping item order', () => {
    const g = groupByCategory(items, cats, (i) => i.c);
    expect(g.map((x) => [x.title, x.data.map((i) => i.id)])).toEqual([
      ['A', [3]],
      ['B', [1, 5]],
      [null, [2, 4]],
    ]);
  });

  it('omits empty groups', () => {
    expect(groupByCategory([{ id: 1, c: null }], cats, (i) => i.c).map((x) => x.key)).toEqual(['none']);
    expect(groupByCategory([], cats, (i: { c: number | null }) => i.c)).toEqual([]);
  });
});

describe('sortWeekdaysForDisplay', () => {
  it('follows week_start without changing the stored ISO values', () => {
    expect(sortWeekdaysForDisplay([5, 7, 1], 'sun')).toEqual([7, 1, 5]);
    expect(sortWeekdaysForDisplay([5, 7, 1], 'mon')).toEqual([1, 5, 7]);
  });
});
