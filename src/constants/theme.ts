/**
 * Design tokens. The ONLY place for spacing, radius, line widths and sizes — components must
 * not hard-code these. (Colors come from the Paper theme in `src/theme/index.ts`, plus each
 * habit's own marker color.) The visual design is not final; change values here.
 */

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const Radius = {
  sm: 4,
  md: 8,
  pill: 999,
} as const;

export const Border = {
  /** Thin hairline-ish rule used for dividers and outlines. */
  width: 1,
  /** Outline of a filled/empty marker shape. */
  markerWidth: 1.5,
} as const;

export const Size = {
  /** Minimum touch target. */
  touch: 48,
  checkMark: 28,
  habitDot: 10,
  progressBar: 4,
  tabIcon: 24,
  colorSwatch: 36,
  emptyStateIcon: 40,
  /** Height of the color picker's saturation/brightness panel. */
  colorPanel: 180,
  /** Space reserved at the bottom of lists so the FAB doesn't cover the last row. */
  fabClearance: 88,
} as const;

export const Opacity = {
  disabled: 0.38,
  secondaryText: 0.7,
} as const;

export const Animation = {
  /** ms */
  fast: 150,
} as const;
