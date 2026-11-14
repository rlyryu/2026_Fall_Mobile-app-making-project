import { isValidHexColor } from './colors';
import { isValidISODate } from './date';
import type {
  GoalDirection,
  HabitType,
  ISODate,
  IsoWeekday,
  RecurrenceInterval,
  RecurrenceType,
} from './types';

/** Raw state of the habit add/edit form. Numeric fields are kept as text while editing. */
export interface HabitDraft {
  name: string;
  type: HabitType;
  goalValueText: string;
  unit: string;
  goalDirection: GoalDirection;
  recurrenceType: RecurrenceType;
  recurrenceInterval: RecurrenceInterval;
  daysOfWeek: IsoWeekday[];
  timesPerWeek: number;
  categoryId: number | null;
  color: string;
  startDate: ISODate;
}

/** Normalized values ready to be written to the DB. */
export interface HabitInput {
  name: string;
  type: HabitType;
  goalValue: number;
  unit: string | null;
  goalDirection: GoalDirection;
  recurrenceType: RecurrenceType;
  recurrenceInterval: RecurrenceInterval;
  daysOfWeek: IsoWeekday[];
  timesPerWeek: number | null;
  categoryId: number | null;
  color: string;
  startDate: ISODate;
}

/** i18n keys under `validation.*`. */
export type HabitFieldError =
  | 'nameRequired'
  | 'goalInvalid'
  | 'daysRequired'
  | 'timesPerWeekRange'
  | 'colorInvalid'
  | 'startDateInvalid';

export type HabitDraftErrors = Partial<
  Record<'name' | 'goalValue' | 'daysOfWeek' | 'timesPerWeek' | 'color' | 'startDate', HabitFieldError>
>;

export const MAX_NAME_LENGTH = 50;

/**
 * Parses a user-typed decimal. Accepts `,` as decimal separator (e.g. "1,5").
 * Returns NaN for empty or malformed input.
 */
export function parseDecimal(text: string): number {
  const t = text.trim().replace(',', '.');
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(t)) return NaN;
  return Number(t);
}

export function validateHabitDraft(draft: HabitDraft): HabitDraftErrors {
  const errors: HabitDraftErrors = {};

  if (draft.name.trim().length === 0) errors.name = 'nameRequired';

  if (draft.type === 'quantity') {
    const goal = parseDecimal(draft.goalValueText);
    if (!Number.isFinite(goal) || goal <= 0) errors.goalValue = 'goalInvalid';
  }

  if (draft.recurrenceType === 'weekdays' && draft.daysOfWeek.length === 0) {
    errors.daysOfWeek = 'daysRequired';
  }

  if (
    draft.recurrenceType === 'weekly_count' &&
    !(Number.isInteger(draft.timesPerWeek) && draft.timesPerWeek >= 1 && draft.timesPerWeek <= 7)
  ) {
    errors.timesPerWeek = 'timesPerWeekRange';
  }

  if (!isValidHexColor(draft.color)) errors.color = 'colorInvalid';
  if (!isValidISODate(draft.startDate)) errors.startDate = 'startDateInvalid';

  return errors;
}

export function hasErrors(errors: HabitDraftErrors): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Converts a *valid* draft into DB-ready values, clearing fields that don't apply to the
 * chosen type/recurrence (check -> goal 1/at_least/no unit, etc.).
 */
export function normalizeHabitDraft(draft: HabitDraft): HabitInput {
  const isCheck = draft.type === 'check';
  const isWeekdays = draft.recurrenceType === 'weekdays';
  const unit = draft.unit.trim();

  return {
    name: draft.name.trim().slice(0, MAX_NAME_LENGTH),
    type: draft.type,
    goalValue: isCheck ? 1 : parseDecimal(draft.goalValueText),
    unit: isCheck || unit.length === 0 ? null : unit,
    goalDirection: isCheck ? 'at_least' : draft.goalDirection,
    recurrenceType: draft.recurrenceType,
    recurrenceInterval: isWeekdays ? draft.recurrenceInterval : 1,
    daysOfWeek: isWeekdays ? [...new Set(draft.daysOfWeek)].sort((a, b) => a - b) : [],
    timesPerWeek: draft.recurrenceType === 'weekly_count' ? draft.timesPerWeek : null,
    categoryId: draft.categoryId,
    color: draft.color.toUpperCase(),
    startDate: draft.startDate,
  };
}

/** Formats a number for display/editing without float noise (e.g. 0.30000000000000004 -> "0.3"). */
export function formatNumber(value: number): string {
  return String(Math.round(value * 1000) / 1000);
}
