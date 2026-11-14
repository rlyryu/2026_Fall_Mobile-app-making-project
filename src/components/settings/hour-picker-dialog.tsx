import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { Button, Dialog, Portal, RadioButton } from 'react-native-paper';

const HOURS = Array.from({ length: 24 }, (_, h) => h);

interface Props {
  value: number;
  onDismiss: () => void;
  onSelect: (hour: number) => void;
}

/** Pick the day-start hour (0-23). Mount only while open. */
export function HourPickerDialog({ value, onDismiss, onSelect }: Props) {
  const { t } = useTranslation();
  return (
    <Portal>
      <Dialog visible onDismiss={onDismiss}>
        <Dialog.Title>{t('settings.dayStartHour')}</Dialog.Title>
        <Dialog.ScrollArea>
          <ScrollView>
            <RadioButton.Group value={String(value)} onValueChange={(v) => onSelect(Number(v))}>
              {HOURS.map((h) => (
                <RadioButton.Item key={h} value={String(h)} label={formatHour(h, t)} />
              ))}
            </RadioButton.Group>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onDismiss}>{t('common.cancel')}</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

export function formatHour(hour: number, t: ReturnType<typeof useTranslation>['t']): string {
  return hour === 0 ? t('settings.midnight') : t('settings.hour', { hour });
}
