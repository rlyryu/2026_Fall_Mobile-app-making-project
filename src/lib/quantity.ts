import type { Habit } from './types';

type QuantityRule = Pick<Habit, 'type' | 'goalValue' | 'goalDirection'>;

/** Amount a single +/- press changes a quantity habit by. (Per-habit step arrives in patch D.) */
export function getStep(_habit: Pick<Habit, 'type'>): number {
  return 1;
}

/** Rounds away float noise from repeated +/- on decimals. */
export function roundValue(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * The value to store after pressing +/- (`delta` = +step or -step), or `null` to delete the log.
 * - Never below 0.
 * - at_least: reaching 0 deletes the log (0 and "nothing" are equivalent for the goal).
 * - at_most: 0 is a meaningful record ("did none today"), so it is kept. Pressing - on an
 *   unrecorded at_most habit therefore records 0.
 */
export function nextQuantityValue(
  habit: QuantityRule,
  current: number | null,
  delta: number,
): number | null {
  const next = roundValue(Math.max(0, (current ?? 0) + delta));
  if (next === 0 && habit.goalDirection === 'at_least') return null;
  return next;
}

export interface QuantityView {
  recorded: boolean;
  /** 0-1 fill for a progress bar. */
  ratio: number;
  /** at_most and the recorded value exceeds the goal. */
  over: boolean;
}

export function describeQuantity(habit: QuantityRule, value: number | null): QuantityView {
  const v = value ?? 0;
  const ratio = habit.goalValue > 0 ? Math.min(1, v / habit.goalValue) : 0;
  return {
    recorded: value !== null,
    ratio,
    over: habit.goalDirection === 'at_most' && value !== null && value > habit.goalValue,
  };
}
