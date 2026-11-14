/** Conversions between stored habits and the add/edit form's draft state. */
import { DEFAULT_HABIT_COLOR } from './colors';
import type { Habit, ISODate } from './types';
import { formatNumber, type HabitDraft } from './validation';

export const DEFAULT_TIMES_PER_WEEK = 3;

/** Draft for a brand-new habit. */
export function emptyDraft(startDate: ISODate, categoryId: number | null = null): HabitDraft {
  return {
    name: '',
    type: 'check',
    goalValueText: '',
    unit: '',
    goalDirection: 'at_least',
    recurrenceType: 'daily',
    recurrenceInterval: 1,
    daysOfWeek: [],
    timesPerWeek: DEFAULT_TIMES_PER_WEEK,
    categoryId,
    color: DEFAULT_HABIT_COLOR,
    startDate,
  };
}

/** Draft pre-filled from an existing habit (for editing). */
export function habitToDraft(habit: Habit): HabitDraft {
  return {
    name: habit.name,
    type: habit.type,
    goalValueText: habit.type === 'quantity' ? formatNumber(habit.goalValue) : '',
    unit: habit.unit ?? '',
    goalDirection: habit.goalDirection,
    recurrenceType: habit.recurrenceType,
    recurrenceInterval: habit.recurrenceInterval,
    daysOfWeek: [...habit.daysOfWeek],
    timesPerWeek: habit.timesPerWeek ?? DEFAULT_TIMES_PER_WEEK,
    categoryId: habit.categoryId,
    color: habit.color,
    startDate: habit.startDate,
  };
}
