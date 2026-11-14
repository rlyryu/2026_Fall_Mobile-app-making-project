import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { Border, Size, Spacing } from '@/constants/theme';
import type { WeekStart } from '@/lib/types';
import { orderedWeekdays } from '@/lib/week';

/** Weekday labels above the report grid, in week_start order, aligned with `WeekBlock` columns. */
export function WeekdayRow({ weekStart }: { weekStart: WeekStart }) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: theme.colors.outlineVariant }]}>
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
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', paddingVertical: Spacing.xs, borderBottomWidth: Border.width },
  nameSpacer: { width: Size.monthNameColumn },
  weekday: { flex: 1, textAlign: 'center' },
});
