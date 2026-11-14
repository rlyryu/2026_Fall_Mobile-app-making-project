import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Border, Radius, Size } from '@/constants/theme';
import { getContrastingTextColor } from '@/lib/colors';

interface Props {
  checked: boolean;
  color: string;
}

/**
 * Filled circle with a check = done; empty outlined circle = not done.
 * (State is conveyed by shape, not only by color.)
 */
export function CheckMark({ checked, color }: Props) {
  return (
    <View
      style={[
        styles.circle,
        { borderColor: color },
        checked && { backgroundColor: color },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {checked ? (
        <MaterialCommunityIcons name="check" size={Size.checkMark * 0.65} color={getContrastingTextColor(color)} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: Size.checkMark,
    height: Size.checkMark,
    borderRadius: Radius.pill,
    borderWidth: Border.markerWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
