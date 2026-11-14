/**
 * App theme: react-native-paper Material 3 (light/dark follows the system), plus a matching
 * navigation theme for expo-router's ThemeProvider so headers/tab bar use the same colors.
 * Spacing/radius/sizes live in `src/constants/theme.ts`.
 */
import { DarkTheme, DefaultTheme, type Theme as NavigationTheme } from 'expo-router';
import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';

export const paperLightTheme: MD3Theme = MD3LightTheme;
export const paperDarkTheme: MD3Theme = MD3DarkTheme;

function toNavigationTheme(base: NavigationTheme, paper: MD3Theme): NavigationTheme {
  return {
    ...base,
    dark: paper.dark,
    colors: {
      ...base.colors,
      primary: paper.colors.primary,
      background: paper.colors.background,
      card: paper.colors.surface,
      text: paper.colors.onSurface,
      border: paper.colors.outlineVariant,
      notification: paper.colors.error,
    },
  };
}

export const navigationLightTheme = toNavigationTheme(DefaultTheme, paperLightTheme);
export const navigationDarkTheme = toNavigationTheme(DarkTheme, paperDarkTheme);
