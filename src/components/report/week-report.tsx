import { format } from 'date-fns';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/common/empty-state';
import { Spacing } from '@/constants/theme';
import { useReportData } from '@/hooks/use-report-data';
import { useSettings } from '@/hooks/use-settings';
import { buildWeekDays, getReportRates, getWeeklyGoals } from '@/lib/calendar';
import { addDays, compareISODate, parseISODate } from '@/lib/date';
import type { ISODate } from '@/lib/types';
import { getWeekRange, getWeekStart } from '@/lib/week';

import { ReportHeader } from './report-header';
import { WeekBlock } from './week-block';
import { WeekdayRow } from './weekday-row';
import { WeeklyGoals } from './weekly-goals';

interface Props {
  /** Any date inside the shown week (the week itself follows the week_start setting). */
  anchor: ISODate;
  today: ISODate;
  onChangeAnchor: (date: ISODate) => void;
}

/** Weekly report: one week block plus the week's times-per-week goals. */
export function WeekReport({ anchor, today, onChangeAnchor }: Props) {
  const { t } = useTranslation();
  const { settings, dateLocale } = useSettings();
  const { weekStart } = settings;
  const { start, end } = getWeekRange(anchor, weekStart);
  const data = useReportData(start, end);

  const view = useMemo(
    () =>
      data && {
        days: buildWeekDays(start, weekStart),
        rates: getReportRates(data.habits, data.logs, start, end, today, weekStart),
        goals: getWeeklyGoals(data.habits, data.logs, start, today, weekStart),
      },
    [data, start, end, today, weekStart],
  );

  const short = (d: ISODate) => format(parseISODate(d), t('dateFormat.short'), { locale: dateLocale });

  return (
    <View style={styles.screen}>
      <ReportHeader
        label={t('report.weekRange', { start: short(start), end: short(end) })}
        prevLabel={t('report.prevWeek')}
        nextLabel={t('report.nextWeek')}
        canGoNext={compareISODate(start, getWeekStart(today, weekStart)) < 0}
        onPrev={() => onChangeAnchor(addDays(start, -7))}
        onNext={() => onChangeAnchor(addDays(start, 7))}
        rates={view?.rates}
      />
      <WeekdayRow weekStart={weekStart} />

      {data === undefined || view === undefined ? (
        <View style={styles.center}>
          <ActivityIndicator accessibilityLabel={t('common.loading')} />
        </View>
      ) : data.habits.length === 0 ? (
        <EmptyState title={t('report.emptyWeek')} icon="calendar-week-outline" />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <WeekBlock week={view.days} habits={data.habits} logs={data.logs} today={today} weekStart={weekStart} />
          <WeeklyGoals goals={view.goals} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingBottom: Spacing.lg },
});
