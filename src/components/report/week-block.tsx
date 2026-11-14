import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { DayStateMark } from '@/components/common/day-state-mark';
import { Border, Radius, Size, Spacing } from '@/constants/theme';
import { useSettings } from '@/hooks/use-settings';
import type { CalendarDay } from '@/lib/calendar';
import { compareISODate, parseISODate } from '@/lib/date';
import { getDayAggregate, getDayState, type LogsByHabit } from '@/lib/stats';
import type { Habit, ISODate, WeekStart } from '@/lib/types';

interface Props {
  week: CalendarDay[];
  habits: Habit[];
  logs: LogsByHabit;
  today: ISODate;
  weekStart: WeekStart;
}

/**
 * One week of the report: 7 day columns × one row per habit, plus a per-day aggregate bar.
 * Everything is view-only. Days with `inMonth: false` are left blank.
 */
export function WeekBlock({ week, habits, logs, today, weekStart }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { dateLocale } = useSettings();

  const label = (date: ISODate) => format(parseISODate(date), t('dateFormat.short'), { locale: dateLocale });
  const todayTone = (date: ISODate) => (date === today ? { backgroundColor: theme.colors.surfaceVariant } : null);

  return (
    <View style={[styles.block, { borderBottomColor: theme.colors.outlineVariant }]}>
      {/* Date header row (view-only) */}
      <View style={styles.row}>
        <View style={styles.nameCell} />
        {week.map((d) => {
          if (!d.inMonth) return <View key={d.date} style={styles.cell} />;
          const future = compareISODate(d.date, today) > 0;
          return (
            <View
              key={d.date}
              accessible
              accessibilityLabel={label(d.date)}
              style={[styles.cell, styles.headerCell, todayTone(d.date)]}>
              <Text
                variant="labelMedium"
                style={[
                  d.date === today && styles.bold,
                  future && { color: theme.colors.onSurfaceDisabled },
                ]}>
                {Number(d.date.slice(8))}
              </Text>
            </View>
          );
        })}
      </View>

      {/* One row per habit */}
      {habits.map((h) => (
        <View key={h.id} style={styles.row}>
          <View style={styles.nameCell}>
            <View style={[styles.dot, { backgroundColor: h.color }]} />
            <Text variant="bodySmall" numberOfLines={1} style={styles.name}>
              {h.name}
            </Text>
          </View>
          {week.map((d) => {
            if (!d.inMonth) return <View key={d.date} style={styles.cell} />;
            const state = getDayState(h, d.date, logs[h.id] ?? {}, today, weekStart);
            return (
              <View
                key={d.date}
                accessible
                accessibilityLabel={t('report.cell', {
                  date: label(d.date),
                  name: h.name,
                  state: t(`dayState.${state}`),
                })}
                style={[styles.cell, todayTone(d.date)]}>
                <DayStateMark state={state} color={h.color} />
              </View>
            );
          })}
        </View>
      ))}

      {/* Per-day aggregate (done / scheduled across habits) */}
      <View style={styles.row}>
        <View style={styles.nameCell} />
        {week.map((d) => {
          if (!d.inMonth) return <View key={d.date} style={styles.barCell} />;
          const agg = getDayAggregate(d.date, habits, logs, today, weekStart);
          const ratio = agg.scheduled > 0 ? agg.done / agg.scheduled : 0;
          return (
            <View
              key={d.date}
              accessible={agg.scheduled > 0}
              accessibilityLabel={t('report.dayAggregate', {
                date: label(d.date),
                done: agg.done,
                scheduled: agg.scheduled,
              })}
              style={[styles.barCell, todayTone(d.date)]}>
              <View style={[styles.barTrack, { borderBottomColor: theme.colors.outlineVariant }]}>
                {agg.scheduled > 0 ? (
                  <View
                    style={[
                      styles.barFill,
                      { height: `${Math.round(ratio * 100)}%`, backgroundColor: theme.colors.onSurfaceVariant },
                    ]}
                  />
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { paddingVertical: Spacing.sm, borderBottomWidth: Border.width },
  row: { flexDirection: 'row', alignItems: 'center' },
  nameCell: {
    width: Size.monthNameColumn,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
  },
  name: { flex: 1 },
  dot: { width: Size.habitDot / 2, height: Size.habitDot / 2, borderRadius: Radius.pill },
  cell: { flex: 1, height: Size.monthCell, alignItems: 'center', justifyContent: 'center' },
  headerCell: { borderRadius: Radius.sm },
  barCell: { flex: 1, height: Size.dayBarHeight + Spacing.xs, alignItems: 'center', justifyContent: 'flex-end' },
  barTrack: {
    width: Size.dayBarWidth * 2,
    height: Size.dayBarHeight,
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderBottomWidth: Border.width,
  },
  barFill: { width: Size.dayBarWidth, borderTopLeftRadius: Radius.sm, borderTopRightRadius: Radius.sm },
  bold: { fontWeight: '700' },
});
