import {
  addDays,
  diffInDays,
  formatISODate,
  getIsoWeekday,
  getLogicalDate,
  isValidISODate,
  parseISODate,
} from '../date';

const at = (y: number, mo: number, d: number, h: number, mi = 0) => new Date(y, mo - 1, d, h, mi);

describe('getLogicalDate', () => {
  describe('dayStartHour = 0 (midnight)', () => {
    it.each([
      [at(2026, 3, 10, 0, 30), '2026-03-10'],
      [at(2026, 3, 10, 3, 59), '2026-03-10'],
      [at(2026, 3, 10, 4, 0), '2026-03-10'],
      [at(2026, 3, 10, 23, 59), '2026-03-10'],
    ])('%s -> %s', (now, expected) => {
      expect(getLogicalDate(now, 0)).toBe(expected);
    });

    it('defaults to 0', () => {
      expect(getLogicalDate(at(2026, 3, 10, 0, 30))).toBe('2026-03-10');
    });
  });

  describe('dayStartHour = 4', () => {
    it.each([
      [at(2026, 3, 10, 0, 30), '2026-03-09'],
      [at(2026, 3, 10, 3, 59), '2026-03-09'],
      [at(2026, 3, 10, 4, 0), '2026-03-10'],
      [at(2026, 3, 10, 23, 59), '2026-03-10'],
    ])('%s -> %s', (now, expected) => {
      expect(getLogicalDate(now, 4)).toBe(expected);
    });

    it('rolls back across month and year boundaries', () => {
      expect(getLogicalDate(at(2026, 3, 1, 3, 0), 4)).toBe('2026-02-28');
      expect(getLogicalDate(at(2024, 3, 1, 3, 0), 4)).toBe('2024-02-29');
      expect(getLogicalDate(at(2026, 1, 1, 1, 0), 4)).toBe('2025-12-31');
    });
  });

  it('works with dayStartHour = 23', () => {
    expect(getLogicalDate(at(2026, 3, 10, 22, 59), 23)).toBe('2026-03-09');
    expect(getLogicalDate(at(2026, 3, 10, 23, 0), 23)).toBe('2026-03-10');
  });

  it.each([-1, 24, 1.5, NaN])('rejects invalid dayStartHour %p', (h) => {
    expect(() => getLogicalDate(new Date(), h)).toThrow();
  });
});

describe('ISO date parsing/formatting', () => {
  it('round-trips without UTC shift', () => {
    for (const s of ['2026-01-01', '2026-03-08', '2025-12-31', '2024-02-29']) {
      expect(formatISODate(parseISODate(s))).toBe(s);
    }
  });

  it('parses to local midnight', () => {
    const d = parseISODate('2026-03-10');
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 2, 10, 0]);
  });

  it.each(['2026-02-30', '2026-13-01', '2026-1-01', '20260101', '', '2025-02-29'])(
    'rejects %p',
    (s) => {
      expect(isValidISODate(s)).toBe(false);
      expect(() => parseISODate(s)).toThrow();
    },
  );
});

describe('date arithmetic', () => {
  it('adds days across month/year boundaries', () => {
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('diffs calendar days', () => {
    expect(diffInDays('2026-01-01', '2025-12-31')).toBe(1);
    expect(diffInDays('2025-12-31', '2026-01-01')).toBe(-1);
  });

  it('computes ISO weekday', () => {
    expect(getIsoWeekday('2026-11-16')).toBe(1); // Mon
    expect(getIsoWeekday('2026-11-14')).toBe(6); // Sat
    expect(getIsoWeekday('2025-12-28')).toBe(7); // Sun
  });
});

// jest.global-setup.js sets TZ=America/New_York. If the suite runs in another zone,
// these are skipped (visibly) rather than passing without exercising DST.
const runsInNewYork =
  new Date(2026, 0, 15).getTimezoneOffset() === 300 &&
  new Date(2026, 6, 15).getTimezoneOffset() === 240;

(runsInNewYork ? describe : describe.skip)('DST safety (America/New_York)', () => {
  it('does not skip or repeat a day across spring-forward / fall-back', () => {
    // US DST 2026: starts 2026-03-08, ends 2026-11-01
    expect(addDays('2026-03-07', 1)).toBe('2026-03-08');
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09');
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-11-01', 1)).toBe('2026-11-02');
    expect(diffInDays('2026-03-09', '2026-03-07')).toBe(2);
  });

  it('computes logical date on a DST day', () => {
    expect(getLogicalDate(new Date(2026, 2, 8, 3, 30), 4)).toBe('2026-03-07');
    expect(getLogicalDate(new Date(2026, 2, 8, 4, 0), 4)).toBe('2026-03-08');
  });
});
