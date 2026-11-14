import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button } from 'react-native-paper';

import { useSettings } from '@/hooks/use-settings';
import { formatISODate, parseISODate } from '@/lib/date';
import type { ISODate } from '@/lib/types';

interface Props {
  value: ISODate;
  onChange: (date: ISODate) => void;
}

/**
 * Opens the native Android date dialog. The picked `Date` is read back through its *local*
 * calendar fields (formatISODate), so no UTC shift can occur.
 */
export function StartDateField({ value, onChange }: Props) {
  const { t } = useTranslation();
  const { dateLocale } = useSettings();

  const open = () =>
    DateTimePickerAndroid.open({
      value: parseISODate(value),
      mode: 'date',
      onChange: (event, date) => {
        if (event.type === 'set' && date) onChange(formatISODate(date));
      },
    });

  return (
    <View style={styles.row}>
      <Button
        mode="outlined"
        icon="calendar"
        onPress={open}
        accessibilityLabel={`${t('habitForm.startDate')} ${format(parseISODate(value), t('dateFormat.full'), { locale: dateLocale })}`}>
        {format(parseISODate(value), t('dateFormat.full'), { locale: dateLocale })}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
});
