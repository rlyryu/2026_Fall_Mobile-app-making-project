import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { Chip, useTheme } from 'react-native-paper';

import { Border, Radius, Size, Spacing } from '@/constants/theme';
import { getContrastingTextColor, PRESET_COLORS } from '@/lib/colors';

import { ColorPickerDialog } from './color-picker-dialog';

interface Props {
  value: string;
  onChange: (hex: string) => void;
}

/** 12 preset swatches + "custom" (opens the color picker). A non-preset value is shown as an extra swatch. */
export function ColorField({ value, onChange }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [pickerOpen, setPickerOpen] = useState(false);

  const isPreset = (PRESET_COLORS as readonly string[]).includes(value.toUpperCase());
  const swatches: string[] = isPreset ? [...PRESET_COLORS] : [...PRESET_COLORS, value.toUpperCase()];

  return (
    <View style={styles.container}>
      <View style={styles.swatches}>
        {swatches.map((c) => {
          const selected = c === value.toUpperCase();
          return (
            <Pressable
              key={c}
              onPress={() => onChange(c)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={c}
              hitSlop={Spacing.xs}
              style={[
                styles.swatch,
                { backgroundColor: c },
                selected && { borderColor: theme.colors.onSurface, borderWidth: Border.markerWidth * 2 },
              ]}>
              {selected ? (
                <MaterialCommunityIcons name="check" size={Size.colorSwatch * 0.55} color={getContrastingTextColor(c)} />
              ) : null}
            </Pressable>
          );
        })}
      </View>
      <View style={styles.customRow}>
        <Chip mode="outlined" icon="palette-outline" onPress={() => setPickerOpen(true)}>
          {t('habitForm.customColor')}
        </Chip>
      </View>

      {pickerOpen ? (
        <ColorPickerDialog
          initialColor={value}
          onDismiss={() => setPickerOpen(false)}
          onConfirm={(hex) => {
            onChange(hex);
            setPickerOpen(false);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.sm },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  swatch: {
    width: Size.colorSwatch,
    height: Size.colorSwatch,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: Border.width,
    borderColor: 'transparent',
  },
  customRow: { flexDirection: 'row' },
});
