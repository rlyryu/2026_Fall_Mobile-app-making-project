import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { SegmentedButtons, useTheme } from 'react-native-paper';

import { MonthReport } from '@/components/report/month-report';
import { WeekReport } from '@/components/report/week-report';
import { Spacing } from '@/constants/theme';
import { useLogicalToday } from '@/hooks/use-logical-today';
import { getMonthOf, type ISOMonth } from '@/lib/date';
import type { ISODate } from '@/lib/types';

type ViewMode = 'month' | 'week';

/** Report tab: monthly / weekly views. Each keeps its own period while switching. */
export default function ReportScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const today = useLogicalToday();
  const currentMonth = getMonthOf(today);

  const [mode, setMode] = useState<ViewMode>('month');
  const [month, setMonth] = useState<ISOMonth>(currentMonth);
  const [weekAnchor, setWeekAnchor] = useState<ISODate>(today);

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <SegmentedButtons
        value={mode}
        onValueChange={(v) => setMode(v as ViewMode)}
        buttons={[
          { value: 'month', label: t('report.viewMonth'), icon: 'calendar-month-outline' },
          { value: 'week', label: t('report.viewWeek'), icon: 'calendar-week-outline' },
        ]}
        style={styles.toggle}
      />
      {mode === 'month' ? (
        <MonthReport month={month} currentMonth={currentMonth} today={today} onChangeMonth={setMonth} />
      ) : (
        <WeekReport anchor={weekAnchor} today={today} onChangeAnchor={setWeekAnchor} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  toggle: { marginHorizontal: Spacing.md, marginTop: Spacing.sm },
});
