/**
 * 12 preset habit colors. Mid-tone (Material 400-600) so they stay legible on both the
 * light (#FEF7FF-ish) and dark (#141218-ish) MD3 surfaces.
 */
export const PRESET_COLORS = [
  '#E53935', // red
  '#F4511E', // deep orange
  '#F59E0B', // amber
  '#7CB342', // light green
  '#43A047', // green
  '#00897B', // teal
  '#00ACC1', // cyan
  '#1E88E5', // blue
  '#5C6BC0', // indigo
  '#AB47BC', // purple
  '#EC407A', // pink
  '#8D6E63', // brown
] as const;

export const DEFAULT_HABIT_COLOR = PRESET_COLORS[7];

const HEX_RE = /^#?([0-9a-fA-F]{6})$/;

export function isValidHexColor(s: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(s);
}

/** Accepts `RRGGBB` / `#rrggbb` and returns `#RRGGBB`, or null if invalid. */
export function normalizeHexColor(s: string): string | null {
  const m = HEX_RE.exec(s.trim());
  return m ? `#${m[1].toUpperCase()}` : null;
}

/** WCAG relative luminance of `#RRGGBB`. */
export function relativeLuminance(hex: string): number {
  const n = normalizeHexColor(hex);
  if (!n) throw new Error(`Invalid hex color: ${hex}`);
  const channel = (i: number) => {
    const c = parseInt(n.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/** Black or white, whichever reads better on top of `hex`. */
export function getContrastingTextColor(hex: string): '#000000' | '#FFFFFF' {
  const l = relativeLuminance(hex);
  const contrastWhite = 1.05 / (l + 0.05);
  const contrastBlack = (l + 0.05) / 0.05;
  return contrastBlack > contrastWhite ? '#000000' : '#FFFFFF';
}

/** `#RRGGBB` + alpha (0-1) -> `#RRGGBBAA`. */
export function withAlpha(hex: string, alpha: number): string {
  const n = normalizeHexColor(hex) ?? '#000000';
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();
  return `${n}${a}`;
}
