import {
  getContrastingTextColor,
  isValidHexColor,
  normalizeHexColor,
  PRESET_COLORS,
  withAlpha,
} from '../colors';
import { resolveLanguage } from '../locale';

describe('colors', () => {
  it('has 12 unique valid presets', () => {
    expect(PRESET_COLORS).toHaveLength(12);
    expect(new Set(PRESET_COLORS).size).toBe(12);
    PRESET_COLORS.forEach((c) => expect(isValidHexColor(c)).toBe(true));
  });

  it('normalizes hex input', () => {
    expect(normalizeHexColor('abcdef')).toBe('#ABCDEF');
    expect(normalizeHexColor(' #12ab9F ')).toBe('#12AB9F');
    expect(normalizeHexColor('#123')).toBeNull();
    expect(normalizeHexColor('zzzzzz')).toBeNull();
  });

  it('picks a readable text color', () => {
    expect(getContrastingTextColor('#FFFFFF')).toBe('#000000');
    expect(getContrastingTextColor('#000000')).toBe('#FFFFFF');
    expect(getContrastingTextColor('#F59E0B')).toBe('#000000');
    expect(getContrastingTextColor('#5C6BC0')).toBe('#FFFFFF');
  });

  it('appends alpha', () => {
    expect(withAlpha('#1E88E5', 1)).toBe('#1E88E5FF');
    expect(withAlpha('#1E88E5', 0)).toBe('#1E88E500');
  });
});

describe('resolveLanguage', () => {
  it.each([
    ['ko', 'en', 'ko'],
    ['en', 'ko', 'en'],
    ['system', 'ko', 'ko'],
    ['system', 'KO', 'ko'],
    ['system', 'en', 'en'],
    ['system', 'ja', 'en'],
    ['system', null, 'en'],
  ] as const)('%s + device %p -> %s', (setting, device, expected) => {
    expect(resolveLanguage(setting, device)).toBe(expected);
  });
});
