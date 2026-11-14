import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';

import { ProgressBar } from '@/components/common/progress-bar';
import { Border, Opacity, Size, Spacing } from '@/constants/theme';
import { useSettings } from '@/hooks/use-settings';
import { getMonthRange, type ISOMonth, parseISODate } from '@/lib/date';
import type { Rate } from '@/lib/stats';

interface Props {
  month: ISOMonth;
  rate: Rate | undefined;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function MonthHeader({ month, rate, canGoNext, onPrev, onNext }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { dateLocale } = useSettings();
  const label = format(parseISODate(getMonthRange(month).start), t('dateFormat.month'), { locale: dateLocale });
  const pct = rate?.pct ?? null;

  return (
    <View style={[styles.container, { borderBottomColor: theme.colors.outlineVariant }]}>
      <View style={styles.nav}>
        <IconButton icon="chevron-left" onPress={onPrev} accessibilityLabel={t('monthly.prevMonth')} style={styles.icon} />
        <Text variant="titleMedium" style={styles.label} accessibilityRole="header">
          {label}
        </Text>
        <IconButton
          icon="chevron-right"
          onPress={onNext}
          disabled={!canGoNext}
          accessibilityLabel={t('monthly.nextMonth')}
          style={styles.icon}
        />
      </View>
      <View style={styles.rate}>
        <ProgressBar ratio={pct === null ? 0 : pct / 100} color={theme.colors.onSurface} />
        <View style={styles.rateText}>
          <Text variant="bodySmall">{pct === null ? t('monthly.rateNone') : t('monthly.rate', { pct })}</Text>
          {rate && rate.scheduled > 0 ? (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, opacity: Opacity.secondaryText }}>
              {t('monthly.rateDetail', { done: rate.done, scheduled: rate.scheduled })}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm, borderBottomWidth: Border.width },
  nav: { flexDirection: 'row', alignItems: 'center' },
  label: { flex: 1, textAlign: 'center' },
  icon: { width: Size.touch, height: Size.touch },
  rate: { gap: Spacing.xs },
  rateText: { flexDirection: 'row', justifyContent: 'space-between' },
});
