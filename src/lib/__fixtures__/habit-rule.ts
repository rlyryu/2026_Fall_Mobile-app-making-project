import type { HabitRule } from '../types';

export function makeRule(overrides: Partial<HabitRule> = {}): HabitRule {
  return {
    type: 'check',
    goalValue: 1,
    goalDirection: 'at_least',
    recurrenceType: 'daily',
    recurrenceInterval: 1,
    daysOfWeek: [],
    timesPerWeek: null,
    startDate: '2025-01-01',
    archivedAt: null,
    ...overrides,
  };
}
