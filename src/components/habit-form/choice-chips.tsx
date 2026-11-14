import { StyleSheet, View } from 'react-native';
import { Chip } from 'react-native-paper';

import { Spacing } from '@/constants/theme';

export interface ChipOption<T> {
  value: T;
  label: string;
  /** Spoken label when the visible label is abbreviated (e.g. "월" -> "월요일"). */
  accessibilityLabel?: string;
}

interface Props<T> {
  options: readonly ChipOption<T>[];
  isSelected: (value: T) => boolean;
  onPress: (value: T) => void;
}

/** A wrapping row of selectable chips (single- or multi-select, decided by the caller). */
export function ChoiceChips<T extends string | number | null>({ options, isSelected, onPress }: Props<T>) {
  return (
    <View style={styles.row}>
      {options.map((o) => (
        <Chip
          key={String(o.value)}
          mode="outlined"
          selected={isSelected(o.value)}
          showSelectedCheck={false}
          showSelectedOverlay
          onPress={() => onPress(o.value)}
          accessibilityLabel={o.accessibilityLabel ?? o.label}
          accessibilityState={{ selected: isSelected(o.value) }}>
          {o.label}
        </Chip>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
