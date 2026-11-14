import { StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import { Radius, Size } from '@/constants/theme';

interface Props {
  /** 0-1 */
  ratio: number;
  color: string;
}

/** Thin progress bar drawn with plain Views (no chart library). */
export function ProgressBar({ ratio, color }: Props) {
  const theme = useTheme();
  const pct = `${Math.round(Math.max(0, Math.min(1, ratio)) * 100)}%` as const;
  return (
    <View
      style={[styles.track, { backgroundColor: theme.colors.surfaceVariant }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <View style={[styles.fill, { width: pct, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: Size.progressBar, borderRadius: Radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.pill },
});
