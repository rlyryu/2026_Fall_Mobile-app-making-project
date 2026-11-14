import { type ErrorBoundaryProps, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Button, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';

import { Spacing } from '@/constants/theme';
import { initDatabase } from '@/db/migrations';
import i18n from '@/i18n';
import { SettingsProvider } from '@/hooks/use-settings';
import {
  navigationDarkTheme,
  navigationLightTheme,
  paperDarkTheme,
  paperLightTheme,
} from '@/theme';

// Keep the native splash up until the DB and settings are ready (see SettingsProvider).
SplashScreen.preventAutoHideAsync();

/** Shown if the DB fails to open/migrate. Outside all providers, so it uses plain RN. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);
  return (
    <View style={styles.error}>
      <Text style={styles.errorTitle}>{i18n.t('common.errorTitle')}</Text>
      <Text>{i18n.t('common.errorGeneric')}</Text>
      {__DEV__ ? <Text>{error.message}</Text> : null}
      <Button title={i18n.t('common.retry')} onPress={() => void retry()} />
    </View>
  );
}

export default function RootLayout() {
  const dark = useColorScheme() === 'dark';

  return (
    <GestureHandlerRootView style={styles.root}>
      <SQLiteProvider databaseName="habit-tracker.db" onInit={initDatabase}>
        <SettingsProvider>
          <PaperProvider theme={dark ? paperDarkTheme : paperLightTheme}>
            <ThemeProvider value={dark ? navigationDarkTheme : navigationLightTheme}>
              <StatusBar style="auto" />
              <Stack screenOptions={{ headerShown: false }} />
            </ThemeProvider>
          </PaperProvider>
        </SettingsProvider>
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  error: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.lg },
  errorTitle: { fontWeight: '700' },
});
