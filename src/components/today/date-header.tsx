import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, IconButton, Text, useTheme } from 'react-native-paper';

import { Border, Size, Spacing } from '@/constants/theme';
import { useSettings } from '@/hooks/use-settings';
import { parseISODate } from '@/lib/date';
import type { ISODate } from '@/lib/types';

interface Props {
  date: ISODate;
  today: ISODate;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function DateHeader({ date, today, onPrev, onNext, onToday }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { dateLocale } = useSettings();
  const isToday = date === today;

  return (
    <View style={[styles.container, { borderBottomColor: theme.colors.outlineVariant }]}>
      <IconButton
        icon="chevron-left"
        onPress={onPrev}
        accessibilityLabel={t('today.prevDay')}
        style={styles.iconButton}
      />
      <View style={styles.center}>
        <Text variant="titleMedium">
          {format(parseISODate(date), t('dateFormat.header'), { locale: dateLocale })}
        </Text>
        {isToday ? (
          <Text variant="labelSmall" style={{ color: theme.colors.primary }}>
            {t('today.todayBadge')}
          </Text>
        ) : (
          <Button compact onPress={onToday}>
            {t('today.goToday')}
          </Button>
        )}
      </View>
      <IconButton
        icon="chevron-right"
        onPress={onNext}
        disabled={isToday}
        accessibilityLabel={t('today.nextDay')}
        style={styles.iconButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomWidth: Border.width,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: Size.touch },
  iconButton: { width: Size.touch, height: Size.touch },
});
