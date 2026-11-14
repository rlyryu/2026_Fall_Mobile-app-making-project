import { StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import { Border, Radius, Size } from '@/constants/theme';
import type { DayState } from '@/lib/stats';

interface Props {
  state: DayState;
  /** The habit's marker color. */
  color: string;
  size?: number;
}

/**
 * Visual for one habit on one day. Shared by the monthly view and the habit detail calendar so
 * a given `getDayState` result always looks the same. Distinguished by SHAPE, not color:
 * - done: filled circle
 * - partial: half-filled circle
 * - missed: empty circle (solid outline)
 * - today_pending: empty circle (dashed outline)
 * - not_scheduled: tiny dot
 * - future: nothing
 * Decorative only: put the accessibility label on the containing cell.
 */
export function DayStateMark({ state, color, size = Size.dayStateMark }: Props) {
  const theme = useTheme();
  const circle = { width: size, height: size, borderRadius: Radius.pill };

  let mark = null;
  switch (state) {
    case 'done':
      mark = <View style={[circle, { backgroundColor: color }]} />;
      break;
    case 'partial':
      mark = (
        <View style={[circle, styles.outline, styles.clip, { borderColor: color }]}>
          <View style={[styles.half, { backgroundColor: color }]} />
        </View>
      );
      break;
    case 'missed':
      mark = <View style={[circle, styles.outline, { borderColor: color }]} />;
      break;
    case 'today_pending':
      mark = (
        <View style={[circle, styles.outline, styles.dashed, { borderColor: theme.colors.outline }]} />
      );
      break;
    case 'not_scheduled': {
      const dot = Math.max(2, Math.round(size / 4));
      mark = (
        <View
          style={{ width: dot, height: dot, borderRadius: Radius.pill, backgroundColor: theme.colors.outlineVariant }}
        />
      );
      break;
    }
    case 'future':
      mark = null;
      break;
  }

  return (
    <View
      style={[styles.box, { width: size, height: size }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {mark}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
  outline: { borderWidth: Border.markerWidth },
  dashed: { borderStyle: 'dashed' },
  clip: { overflow: 'hidden' },
  half: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '50%' },
});
