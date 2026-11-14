import { DEFAULT_HABIT_COLOR } from '../colors';
import {
  formatNumber,
  type HabitDraft,
  hasErrors,
  normalizeHabitDraft,
  parseDecimal,
  validateHabitDraft,
} from '../validation';

const draft = (overrides: Partial<HabitDraft> = {}): HabitDraft => ({
  name: '물 마시기',
  type: 'check',
  goalValueText: '',
  unit: '',
  goalDirection: 'at_least',
  recurrenceType: 'daily',
  recurrenceInterval: 1,
  daysOfWeek: [],
  timesPerWeek: 3,
  categoryId: null,
  color: DEFAULT_HABIT_COLOR,
  startDate: '2026-11-14',
  ...overrides,
});

describe('parseDecimal', () => {
  it.each([
    ['8', 8],
    [' 1.5 ', 1.5],
    ['1,5', 1.5],
    ['.5', 0.5],
    ['10.', 10],
  ])('%p -> %p', (s, n) => expect(parseDecimal(s)).toBe(n));

  it.each(['', 'abc', '1.2.3', '1e3', '--1'])('%p -> NaN', (s) => {
    expect(parseDecimal(s)).toBeNaN();
  });
});

describe('validateHabitDraft', () => {
  it('accepts a valid check habit with a Korean name', () => {
    expect(hasErrors(validateHabitDraft(draft()))).toBe(false);
  });

  it('rejects an empty / whitespace name', () => {
    expect(validateHabitDraft(draft({ name: '   ' })).name).toBe('nameRequired');
  });

  it('rejects weekdays with no day selected', () => {
    expect(
      validateHabitDraft(draft({ recurrenceType: 'weekdays', daysOfWeek: [] })).daysOfWeek,
    ).toBe('daysRequired');
    expect(
      validateHabitDraft(draft({ recurrenceType: 'weekdays', daysOfWeek: [2] })).daysOfWeek,
    ).toBeUndefined();
  });

  it.each(['0', '-1', '', 'abc'])('rejects quantity goal %p', (goalValueText) => {
    expect(validateHabitDraft(draft({ type: 'quantity', goalValueText })).goalValue).toBe(
      'goalInvalid',
    );
  });

  it('ignores goal text for check habits', () => {
    expect(validateHabitDraft(draft({ type: 'check', goalValueText: '' })).goalValue).toBeUndefined();
  });

  it.each([0, 8, 2.5])('rejects times per week %p', (timesPerWeek) => {
    expect(
      validateHabitDraft(draft({ recurrenceType: 'weekly_count', timesPerWeek })).timesPerWeek,
    ).toBe('timesPerWeekRange');
  });

  it('rejects invalid color and start date', () => {
    const e = validateHabitDraft(draft({ color: 'red', startDate: '2026-02-30' }));
    expect(e.color).toBe('colorInvalid');
    expect(e.startDate).toBe('startDateInvalid');
  });
});

describe('normalizeHabitDraft', () => {
  it('forces check habits to goal 1 / at_least / no unit', () => {
    const n = normalizeHabitDraft(
      draft({ type: 'check', goalValueText: '5', unit: 'km', goalDirection: 'at_most' }),
    );
    expect(n).toMatchObject({ goalValue: 1, goalDirection: 'at_least', unit: null });
  });

  it('keeps quantity settings and trims', () => {
    const n = normalizeHabitDraft(
      draft({
        name: '  담배  ',
        type: 'quantity',
        goalValueText: '3',
        unit: ' 개비 ',
        goalDirection: 'at_most',
      }),
    );
    expect(n).toMatchObject({ name: '담배', goalValue: 3, unit: '개비', goalDirection: 'at_most' });
  });

  it('clears recurrence fields that do not apply', () => {
    const daily = normalizeHabitDraft(
      draft({ recurrenceType: 'daily', recurrenceInterval: 2, daysOfWeek: [1], timesPerWeek: 4 }),
    );
    expect(daily).toMatchObject({ recurrenceInterval: 1, daysOfWeek: [], timesPerWeek: null });

    const weekdays = normalizeHabitDraft(
      draft({ recurrenceType: 'weekdays', recurrenceInterval: 2, daysOfWeek: [5, 1, 5] }),
    );
    expect(weekdays).toMatchObject({ recurrenceInterval: 2, daysOfWeek: [1, 5], timesPerWeek: null });

    const weekly = normalizeHabitDraft(
      draft({ recurrenceType: 'weekly_count', recurrenceInterval: 2, daysOfWeek: [1], timesPerWeek: 4 }),
    );
    expect(weekly).toMatchObject({ recurrenceInterval: 1, daysOfWeek: [], timesPerWeek: 4 });
  });

  it('uppercases color and turns empty unit into null', () => {
    const n = normalizeHabitDraft(
      draft({ type: 'quantity', goalValueText: '2', unit: '  ', color: '#abcdef' }),
    );
    expect(n.color).toBe('#ABCDEF');
    expect(n.unit).toBeNull();
  });
});

describe('formatNumber', () => {
  it('removes float noise', () => {
    expect(formatNumber(0.1 + 0.2)).toBe('0.3');
    expect(formatNumber(8)).toBe('8');
    expect(formatNumber(1.25)).toBe('1.25');
  });
});
