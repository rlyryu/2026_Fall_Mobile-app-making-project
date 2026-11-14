import { format } from 'date-fns';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/common/empty-state';
import { Spacing } from '@/constants/theme';
import { useReportData } from '@/hooks/use-report-data';
import { useSettings } from '@/hooks/use-settings';
import { buildMonthWeeks, getReportRates } from '@/lib/calendar';
import { addMonths, getMonthRange, type ISOMonth, parseISODate } from '@/lib/date';
import type { ISODate } from '@/lib/types';

import { ReportHeader } from './report-header';
import { WeekBlock } from './week-block';
import { WeekdayRow } from './weekday-row';

interface Props {
  month: ISOMonth;
  currentMonth: ISOMonth;
  today: ISODate;
  onChangeMonth: (month: ISOMonth) => void;
}

/** Monthly report: the month as stacked week blocks. */
export function MonthReport({ month, currentMonth, today, onChangeMonth }: Props) {
  const { t } = useTranslation();
  const { settings, dateLocale } = useSettings();
  const { weekStart } = settings;
  const { start, end } = getMonthRange(month);
  const data = useReportData(start, end);

  const view = useMemo(
    () =>
      data && {
        weeks: buildMonthWeeks(month, weekStart),
        rates: getReportRates(data.habits, data.logs, start, end, today, weekStart),
      },
    [data, month, start, end, today, weekStart],
  );

  return (
    <View style={styles.screen}>
      <ReportHeader
        label={format(parseISODate(start), t('dateFormat.month'), { locale: dateLocale })}
        prevLabel={t('report.prevMonth')}
        nextLabel={t('report.nextMonth')}
        canGoNext={month < currentMonth}
        onPrev={() => onChangeMonth(addMonths(month, -1))}
        onNext={() => onChangeMonth(addMonths(month, 1))}
        rates={view?.rates}
      />
      <WeekdayRow weekStart={weekStart} />

      {data === undefined || view === undefined ? (
        <View style={styles.center}>
          <ActivityIndicator accessibilityLabel={t('common.loading')} />
        </View>
      ) : data.habits.length === 0 ? (
        <EmptyState title={t('report.emptyMonth')} icon="calendar-month-outline" />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {view.weeks.map((week) => (
            <WeekBlock
              key={week[0].date}
              week={week}
              habits={data.habits}
              logs={data.logs}
              today={today}
              weekStart={weekStart}
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
});
