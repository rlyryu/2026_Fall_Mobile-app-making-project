import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';

import { ProgressBar } from '@/components/common/progress-bar';
import { Border, Opacity, Size, Spacing } from '@/constants/theme';
import type { ReportRates } from '@/lib/calendar';
import type { Rate } from '@/lib/stats';

interface Props {
  /** Period label, e.g. "2026년 11월" or "11월 8일 – 11월 14일". */
  label: string;
  prevLabel: string;
  nextLabel: string;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  rates: ReportRates | undefined;
}

/** Period navigation plus the period's completion, one line per unit (days / weeks). */
export function ReportHeader({ label, prevLabel, nextLabel, canGoNext, onPrev, onNext, rates }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={[styles.container, { borderBottomColor: theme.colors.outlineVariant }]}>
      <View style={styles.nav}>
        <IconButton icon="chevron-left" onPress={onPrev} accessibilityLabel={prevLabel} style={styles.icon} />
        <Text variant="titleMedium" style={styles.label} accessibilityRole="header">
          {label}
        </Text>
        <IconButton
          icon="chevron-right"
          onPress={onNext}
          disabled={!canGoNext}
          accessibilityLabel={nextLabel}
          style={styles.icon}
        />
      </View>
      {rates?.hasDaily ? (
        <RateLine label={t('report.dailyRate')} rate={rates.daily} detailKey="report.rateDays" />
      ) : null}
      {rates?.hasWeekly ? (
        <RateLine label={t('report.weeklyRate')} rate={rates.weekly} detailKey="report.rateWeeks" />
      ) : null}
    </View>
  );
}

function RateLine({
  label,
  rate,
  detailKey,
}: {
  label: string;
  rate: Rate;
  detailKey: 'report.rateDays' | 'report.rateWeeks';
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const pctText = rate.pct === null ? t('report.rateNone') : t('report.rate', { pct: rate.pct });
  const detail = t(detailKey, { done: rate.done, scheduled: rate.scheduled });

  return (
    <View
      style={styles.rateLine}
      accessible
      accessibilityLabel={t('report.rateA11y', { label, pct: pctText, detail })}>
      <View style={styles.rateText}>
        <Text variant="bodySmall" style={styles.rateLabel}>
          {label}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, opacity: Opacity.secondaryText }}>
          {detail}
        </Text>
        <Text variant="labelLarge" style={styles.pct}>
          {pctText}
        </Text>
      </View>
      <ProgressBar ratio={rate.pct === null ? 0 : rate.pct / 100} color={theme.colors.onSurface} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
    borderBottomWidth: Border.width,
  },
  nav: { flexDirection: 'row', alignItems: 'center' },
  label: { flex: 1, textAlign: 'center' },
  icon: { width: Size.touch, height: Size.touch },
  rateLine: { gap: Spacing.xs },
  rateText: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  rateLabel: { flex: 1 },
  pct: { minWidth: Size.pctColumn, textAlign: 'right' },
});
