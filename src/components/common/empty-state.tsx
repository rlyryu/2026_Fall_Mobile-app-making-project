import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { Opacity, Spacing } from '@/constants/theme';

interface Props {
  title: string;
  hint?: string;
  icon?: ComponentProps<typeof MaterialCommunityIcons>['name'];
}

export function EmptyState({ title, hint, icon = 'checkbox-blank-circle-outline' }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name={icon}
        size={40}
        color={theme.colors.outline}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <Text variant="titleMedium" style={styles.text}>
        {title}
      </Text>
      {hint ? (
        <Text
          variant="bodyMedium"
          style={[styles.text, { color: theme.colors.onSurfaceVariant, opacity: Opacity.secondaryText }]}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.xl,
  },
  text: { textAlign: 'center' },
});
