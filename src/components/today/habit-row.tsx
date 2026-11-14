import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { IconButton, Text, TouchableRipple, useTheme } from 'react-native-paper';

import { CheckMark } from '@/components/common/check-mark';
import { ProgressBar } from '@/components/common/progress-bar';
import { Border, Opacity, Radius, Size, Spacing } from '@/constants/theme';
import { describeQuantity } from '@/lib/quantity';
import type { TodayItem } from '@/lib/today';
import { formatNumber } from '@/lib/validation';

interface Props {
  item: TodayItem;
  onToggle: () => void;
  onStep: (direction: 1 | -1) => void;
  onEditValue: () => void;
}

export function HabitRow({ item, onToggle, onStep, onEditValue }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { habit, state, week } = item;
  const done = state === 'done';
  const secondary = { color: theme.colors.onSurfaceVariant, opacity: Opacity.secondaryText };

  const weekLine = week ? (
    <Text variant="bodySmall" style={secondary}>
      {t('today.weekProgress', { done: week.completedDays, target: week.target })}
      {week.achieved ? ` · ${t('today.weekAchieved')}` : ''}
    </Text>
  ) : null;

  const rowStyle = [styles.row, { borderBottomColor: theme.colors.outlineVariant }];

  if (habit.type === 'check') {
    return (
      <TouchableRipple
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={habit.name}
        style={rowStyle}>
        <View style={styles.content}>
          <CheckMark checked={done} color={habit.color} />
          <View style={styles.body}>
            <Text variant="bodyLarge" numberOfLines={2}>
              {habit.name}
            </Text>
            {weekLine}
          </View>
        </View>
      </TouchableRipple>
    );
  }

  // quantity
  const atMost = habit.goalDirection === 'at_most';
  const q = describeQuantity(habit, item.value);
  const unit = habit.unit ? ` ${habit.unit}` : '';
  const valueText = q.recorded
    ? formatNumber(item.value ?? 0)
    : atMost
      ? t('today.unrecorded')
      : '0';
  const goalText = `${atMost ? '≤' : '/'} ${formatNumber(habit.goalValue)}${unit}`;
  const barColor = q.over ? theme.colors.error : habit.color;

  return (
    <View style={rowStyle}>
      <View style={styles.content}>
        <View style={[styles.dot, { backgroundColor: habit.color }]} />
        <View style={styles.body}>
          <Text variant="bodyLarge" numberOfLines={2}>
            {habit.name}
          </Text>
          {weekLine}
          <ProgressBar ratio={q.ratio} color={barColor} />
        </View>
        <View style={styles.stepper}>
          <IconButton
            icon="minus"
            onPress={() => onStep(-1)}
            accessibilityLabel={t('today.decrease')}
            style={styles.iconButton}
          />
          <TouchableRipple
            onPress={onEditValue}
            accessibilityRole="button"
            accessibilityLabel={`${habit.name} ${valueText} ${goalText}`}
            style={styles.value}>
            <View style={styles.valueInner}>
              <Text
                variant="titleMedium"
                style={[
                  done && styles.bold,
                  q.over && { color: theme.colors.error },
                  !q.recorded && { color: theme.colors.onSurfaceVariant },
                ]}>
                {valueText}
              </Text>
              <Text variant="labelSmall" style={secondary}>
                {goalText}
              </Text>
            </View>
          </TouchableRipple>
          <IconButton
            icon="plus"
            onPress={() => onStep(1)}
            accessibilityLabel={t('today.increase')}
            style={styles.iconButton}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: Border.width,
    minHeight: Size.touch + Spacing.sm,
    justifyContent: 'center',
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  body: { flex: 1, gap: Spacing.xs },
  dot: { width: Size.habitDot, height: Size.habitDot, borderRadius: Radius.pill },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { width: Size.touch, height: Size.touch, margin: 0 },
  value: { minWidth: Size.touch + Spacing.md, minHeight: Size.touch, justifyContent: 'center', borderRadius: Radius.md },
  valueInner: { alignItems: 'center', paddingHorizontal: Spacing.xs },
  bold: { fontWeight: '700' },
});
