import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Text, TouchableRipple, useTheme } from 'react-native-paper';

import { Border, Opacity, Radius, Size, Spacing } from '@/constants/theme';
import { useSettings } from '@/hooks/use-settings';
import type { Habit } from '@/lib/types';

import { formatHabitSummary } from './habit-summary';

interface Props {
  habit: Habit;
  onPress?: () => void;
  /** Extra line under the summary (e.g. archived date). */
  note?: string;
  /** Trailing actions (e.g. restore/delete in the archive). */
  right?: ReactNode;
}

export function HabitListRow({ habit, onPress, note, right }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { weekStart } = useSettings().settings;
  const secondary = { color: theme.colors.onSurfaceVariant, opacity: Opacity.secondaryText };

  const content = (
    <View style={styles.content}>
      <View style={[styles.dot, { backgroundColor: habit.color }]} />
      <View style={styles.body}>
        <Text variant="bodyLarge" numberOfLines={1}>
          {habit.name}
        </Text>
        <Text variant="bodySmall" style={secondary} numberOfLines={1}>
          {formatHabitSummary(habit, t, weekStart)}
        </Text>
        {note ? (
          <Text variant="bodySmall" style={secondary}>
            {note}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );

  const rowStyle = [styles.row, { borderBottomColor: theme.colors.outlineVariant }];
  return onPress ? (
    <TouchableRipple onPress={onPress} accessibilityRole="button" style={rowStyle}>
      {content}
    </TouchableRipple>
  ) : (
    <View style={rowStyle}>{content}</View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: Size.touch + Spacing.sm,
    justifyContent: 'center',
    borderBottomWidth: Border.width,
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  body: { flex: 1, gap: Spacing.xs / 2 },
  dot: { width: Size.habitDot, height: Size.habitDot, borderRadius: Radius.pill },
});
