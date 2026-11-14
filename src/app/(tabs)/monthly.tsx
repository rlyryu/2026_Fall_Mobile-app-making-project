import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { EmptyState } from '@/components/common/empty-state';
import { MonthHeader } from '@/components/monthly/month-header';
import { WeekBlock } from '@/components/monthly/week-block';
import { Border, Size, Spacing } from '@/constants/theme';
import { useLogicalToday } from '@/hooks/use-logical-today';
import { useMonthData } from '@/hooks/use-month-data';
import { useSettings } from '@/hooks/use-settings';
import { buildMonthWeeks, getMonthRate } from '@/lib/calendar';
import { addMonths, getMonthOf, type ISOMonth } from '@/lib/date';
import { groupByCategory } from '@/lib/grouping';
import type { ISODate } from '@/lib/types';
import { orderedWeekdays } from '@/lib/week';

export default function MonthlyScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const today = useLogicalToday();
  const { weekStart } = useSettings().settings;
  const currentMonth = getMonthOf(today);
  const [month, setMonth] = useState<ISOMonth>(currentMonth);
  const data = useMonthData(month);

  const view = useMemo(() => {
    if (!data) return undefined;
    // Same order as elsewhere: by category, uncategorized last, then habit sort order.
    const habits = groupByCategory(data.habits, data.categories, (h) => h.categoryId).flatMap((g) => g.data);
    return {
      habits,
      weeks: buildMonthWeeks(month, weekStart),
      rate: getMonthRate(habits, data.logs, month, today, weekStart),
    };
  }, [data, month, today, weekStart]);

  const openDay = (date: ISODate) => router.navigate({ pathname: '/', params: { date } });

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <MonthHeader
        month={month}
        rate={view?.rate}
        canGoNext={month < currentMonth}
        onPrev={() => setMonth((m) => addMonths(m, -1))}
        onNext={() => setMonth((m) => addMonths(m, 1))}
      />

      {/* Weekday labels, in week_start order */}
      <View style={[styles.weekdays, { borderBottomColor: theme.colors.outlineVariant }]}>
        <View style={styles.nameSpacer} />
        {orderedWeekdays(weekStart).map((d) => (
          <Text
            key={d}
            variant="labelSmall"
            style={[styles.weekday, { color: theme.colors.onSurfaceVariant }]}
            accessibilityLabel={t(`weekdayLong.${d}`)}>
            {t(`weekday.${d}`)}
          </Text>
        ))}
      </View>

      {view === undefined ? (
        <View style={styles.center}>
          <ActivityIndicator accessibilityLabel={t('common.loading')} />
        </View>
      ) : view.habits.length === 0 ? (
        <EmptyState title={t('monthly.empty')} icon="calendar-month-outline" />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {view.weeks.map((week) => (
            <WeekBlock
              key={week[0].date}
              week={week}
              habits={view.habits}
              logs={data?.logs ?? {}}
              today={today}
              weekStart={weekStart}
              onOpenDay={openDay}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingBottom: Spacing.lg },
  weekdays: { flexDirection: 'row', paddingVertical: Spacing.xs, borderBottomWidth: Border.width },
  nameSpacer: { width: Size.monthNameColumn },
  weekday: { flex: 1, textAlign: 'center' },
});
