import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Dialog, HelperText, Portal, TextInput } from 'react-native-paper';

import { MAX_NAME_LENGTH } from '@/lib/validation';

interface Props {
  title: string;
  label: string;
  initialValue?: string;
  confirmLabel: string;
  /** Message shown when the user tries to confirm an empty value. */
  emptyError: string;
  onDismiss: () => void;
  /** Receives the trimmed, non-empty value. */
  onConfirm: (value: string) => void;
}

/**
 * Single-line text dialog (new category, rename category). Mount only while open:
 * its text is initialised from `initialValue` on mount.
 * Uncontrolled transforms are avoided so Korean IME composition works normally.
 */
export function TextPromptDialog({
  title,
  label,
  initialValue = '',
  confirmLabel,
  emptyError,
  onDismiss,
  onConfirm,
}: Props) {
  const { t } = useTranslation();
  const [text, setText] = useState(initialValue);
  const [tried, setTried] = useState(false);
  const empty = text.trim().length === 0;

  const confirm = () => {
    if (empty) {
      setTried(true);
      return;
    }
    onConfirm(text.trim());
  };

  return (
    <Portal>
      <Dialog visible onDismiss={onDismiss}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <TextInput
            mode="outlined"
            label={label}
            value={text}
            onChangeText={setText}
            maxLength={MAX_NAME_LENGTH}
            autoFocus
            onSubmitEditing={confirm}
            error={tried && empty}
          />
          <HelperText type="error" visible={tried && empty}>
            {emptyError}
          </HelperText>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>{t('common.cancel')}</Button>
          <Button onPress={confirm}>{confirmLabel}</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
