import { getDayStatus, isValueCompleted } from '../completion';
import { makeRule } from '../__fixtures__/habit-rule';

describe('check', () => {
  const rule = makeRule({ type: 'check' });
  it.each([
    [null, false, 'unrecorded'],
    [0, false, 'incomplete'],
    [1, true, 'completed'],
  ] as const)('value %p -> %p / %s', (value, done, status) => {
    expect(isValueCompleted(rule, value)).toBe(done);
    expect(getDayStatus(rule, value)).toBe(status);
  });
});

describe('quantity at_least', () => {
  const rule = makeRule({ type: 'quantity', goalValue: 8, goalDirection: 'at_least' });
  it.each([
    [null, false, 'unrecorded'],
    [0, false, 'incomplete'],
    [7.9, false, 'incomplete'],
    [8, true, 'completed'],
    [12, true, 'completed'],
  ] as const)('value %p -> %p / %s', (value, done, status) => {
    expect(isValueCompleted(rule, value)).toBe(done);
    expect(getDayStatus(rule, value)).toBe(status);
  });
});

describe('quantity at_most', () => {
  const rule = makeRule({ type: 'quantity', goalValue: 3, goalDirection: 'at_most' });

  it('no log is "unrecorded", never completed', () => {
    expect(isValueCompleted(rule, null)).toBe(false);
    expect(getDayStatus(rule, null)).toBe('unrecorded');
  });

  it('value = 0 is completed', () => {
    expect(isValueCompleted(rule, 0)).toBe(true);
    expect(getDayStatus(rule, 0)).toBe('completed');
  });

  it('value = goal is completed', () => {
    expect(isValueCompleted(rule, 3)).toBe(true);
    expect(getDayStatus(rule, 3)).toBe('completed');
  });

  it('value over goal is incomplete', () => {
    expect(isValueCompleted(rule, 3.5)).toBe(false);
    expect(getDayStatus(rule, 4)).toBe('incomplete');
  });
});
