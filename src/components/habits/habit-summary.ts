import type { TFunction } from 'i18next';

import type { Habit, WeekStart } from '@/lib/types';
import { formatNumber } from '@/lib/validation';
import { sortWeekdaysForDisplay } from '@/lib/week';

/** e.g. "매일", "매주 일·수", "격주 월·수", "주 3회". */
export function formatRecurrence(habit: Habit, t: TFunction, weekStart: WeekStart): string {
  switch (habit.recurrenceType) {
    case 'daily':
      return t('habits.recurrenceDaily');
    case 'weekly_count':
      return t('habits.recurrenceWeeklyCount', { count: habit.timesPerWeek ?? 0 });
    case 'weekdays': {
      const days = sortWeekdaysForDisplay(habit.daysOfWeek, weekStart)
        .map((d) => t(`weekday.${d}`))
        .join('·');
      return habit.recurrenceInterval === 2
        ? t('habits.recurrenceBiweekly', { days })
        : t('habits.recurrenceWeekdays', { days });
    }
  }
}

/** e.g. "8잔 이상"; null for check habits. */
export function formatGoal(habit: Habit, t: TFunction): string | null {
  if (habit.type === 'check') return null;
  const params = { value: formatNumber(habit.goalValue), unit: habit.unit ? habit.unit : '' };
  const text =
    habit.goalDirection === 'at_most' ? t('habits.goalAtMost', params) : t('habits.goalAtLeast', params);
  return text.trim(); // en template has a space before {{unit}}, which may be empty
}

/** "8잔 이상 · 매일" */
export function formatHabitSummary(habit: Habit, t: TFunction, weekStart: WeekStart): string {
  return [formatGoal(habit, t), formatRecurrence(habit, t, weekStart)].filter(Boolean).join(' · ');
}
