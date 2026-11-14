import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { HelperText, Text, useTheme } from 'react-native-paper';

import { Spacing } from '@/constants/theme';

interface Props {
  label: string;
  /** Translated error message; shown under the section when set. */
  error?: string;
  children: ReactNode;
}

export function FormSection({ label, error, children }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
      {children}
      {error ? (
        <HelperText type="error" padding="none">
          {error}
        </HelperText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.sm },
});
