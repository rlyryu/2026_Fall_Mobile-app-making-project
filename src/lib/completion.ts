import type { HabitRule } from './types';

/**
 * - `completed`: a log exists and meets the goal
 * - `incomplete`: a log exists but does not meet the goal
 * - `unrecorded`: no log for that date (never counts as completed, even for `at_most`)
 */
export type DayStatus = 'completed' | 'incomplete' | 'unrecorded';

type CompletionRule = Pick<HabitRule, 'type' | 'goalValue' | 'goalDirection'>;

/** Whether a recorded value (or `null` = no log) completes the habit for that day. */
export function isValueCompleted(habit: CompletionRule, value: number | null): boolean {
  if (value === null) return false;
  if (habit.type === 'check') return value >= 1;
  return habit.goalDirection === 'at_most' ? value <= habit.goalValue : value >= habit.goalValue;
}

export function getDayStatus(habit: CompletionRule, value: number | null): DayStatus {
  if (value === null) return 'unrecorded';
  return isValueCompleted(habit, value) ? 'completed' : 'incomplete';
}
