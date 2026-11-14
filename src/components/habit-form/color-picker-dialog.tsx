import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, Dialog, HelperText, Portal, TextInput } from 'react-native-paper';
import ColorPicker, { HueSlider, Panel1, Preview } from 'reanimated-color-picker';

import { Radius, Size, Spacing } from '@/constants/theme';
import { normalizeHexColor } from '@/lib/colors';

interface Props {
  initialColor: string;
  onDismiss: () => void;
  onConfirm: (hex: string) => void;
}

/**
 * Free color selection: saturation/brightness panel + hue slider (reanimated-color-picker,
 * pure JS on reanimated + gesture-handler, so it runs in Expo Go) plus a HEX text field.
 * Mount only while open.
 */
export function ColorPickerDialog({ initialColor, onDismiss, onConfirm }: Props) {
  const { t } = useTranslation();
  const [hex, setHex] = useState(initialColor);
  const [hexText, setHexText] = useState(initialColor);
  const normalizedText = normalizeHexColor(hexText);

  const onHexText = (text: string) => {
    setHexText(text);
    const n = normalizeHexColor(text);
    if (n) setHex(n);
  };

  return (
    <Portal>
      <Dialog visible onDismiss={onDismiss}>
        <Dialog.Title>{t('habitForm.customColor')}</Dialog.Title>
        <Dialog.Content style={styles.content}>
          <ColorPicker
            value={hex}
            onCompleteJS={(c) => {
              const n = normalizeHexColor(c.hex.slice(0, 7));
              if (n) {
                setHex(n);
                setHexText(n);
              }
            }}
            style={styles.picker}>
            <Preview hideInitialColor style={styles.preview} />
            <Panel1 style={styles.panel} />
            <HueSlider />
          </ColorPicker>
          <View>
            <TextInput
              mode="outlined"
              label={t('habitForm.hexLabel')}
              value={hexText}
              onChangeText={onHexText}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={7}
              error={!normalizedText}
            />
            <HelperText type="error" visible={!normalizedText}>
              {t('validation.colorInvalid')}
            </HelperText>
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>{t('common.cancel')}</Button>
          <Button onPress={() => onConfirm(hex)}>{t('common.ok')}</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.md },
  picker: { gap: Spacing.md },
  preview: { borderRadius: Radius.md },
  panel: { height: Size.colorPanel, borderRadius: Radius.md },
});
