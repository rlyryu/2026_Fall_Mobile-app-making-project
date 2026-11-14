import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { ProgressBar } from '@/components/common/progress-bar';
import { Radius, Size, Spacing } from '@/constants/theme';
import type { WeeklyGoal } from '@/lib/calendar';
import type { Habit } from '@/lib/types';

const RESULT_KEY = {
  done: 'report.goalDone',
  missed: 'report.goalMissed',
  pending: 'report.goalPending',
} as const;

/** Weekly report: progress of each times-per-week habit in the shown week. */
export function WeeklyGoals({ goals }: { goals: WeeklyGoal<Habit>[] }) {
  const { t } = useTranslation();
  const theme = useTheme();
  if (goals.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }} accessibilityRole="header">
        {t('report.weeklyGoals')}
      </Text>
      {goals.map(({ habit, completedDays, target, ratio, result }) => {
        const progress = t('report.goalProgress', { done: completedDays, target });
        const resultText = t(RESULT_KEY[result]);
        return (
          <View
            key={habit.id}
            style={styles.goal}
            accessible
            accessibilityLabel={t('report.goalA11y', {
              name: habit.name,
              done: completedDays,
              target,
              result: resultText,
            })}>
            <View style={styles.goalText}>
              <View style={[styles.dot, { backgroundColor: habit.color }]} />
              <Text variant="bodyMedium" numberOfLines={1} style={styles.name}>
                {habit.name}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {progress}
              </Text>
              <Text variant="labelMedium" style={result === 'done' ? styles.bold : null}>
                {resultText}
              </Text>
            </View>
            <ProgressBar ratio={ratio} color={habit.color} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, gap: Spacing.md },
  goal: { gap: Spacing.xs },
  goalText: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dot: { width: Size.habitDot, height: Size.habitDot, borderRadius: Radius.pill },
  name: { flex: 1 },
  bold: { fontWeight: '700' },
});
