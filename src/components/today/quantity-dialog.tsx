import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Dialog, HelperText, Portal, TextInput } from 'react-native-paper';

import type { TodayItem } from '@/lib/today';
import { formatNumber, parseDecimal } from '@/lib/validation';

interface Props {
  item: TodayItem;
  onDismiss: () => void;
  onSubmit: (value: number) => void;
  onClear: () => void;
}

/**
 * Direct numeric entry for a quantity habit. Mount it only while open (conditional render):
 * its text state is initialised from the item's current value on mount.
 */
export function QuantityDialog({ item, onDismiss, onSubmit, onClear }: Props) {
  const { t } = useTranslation();
  const { habit } = item;
  const [text, setText] = useState(item.value === null ? '' : formatNumber(item.value));

  const parsed = parseDecimal(text);
  const valid = Number.isFinite(parsed) && parsed >= 0;
  const showError = text.trim() !== '' && !valid;

  return (
    <Portal>
      <Dialog visible onDismiss={onDismiss}>
        <Dialog.Title numberOfLines={2}>{habit.name}</Dialog.Title>
        <Dialog.Content>
          <TextInput
            mode="outlined"
            label={t('today.valueLabel')}
            value={text}
            onChangeText={setText}
            inputMode="decimal"
            autoFocus
            selectTextOnFocus
            error={showError}
            right={habit.unit ? <TextInput.Affix text={habit.unit} /> : undefined}
          />
          <HelperText type="error" visible={showError}>
            {t('today.invalidValue')}
          </HelperText>
        </Dialog.Content>
        <Dialog.Actions>
          {item.value !== null ? <Button onPress={onClear}>{t('today.clearRecord')}</Button> : null}
          <Button onPress={onDismiss}>{t('common.cancel')}</Button>
          <Button disabled={!valid} onPress={() => onSubmit(parsed)}>
            {t('common.save')}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
