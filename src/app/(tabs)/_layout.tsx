import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'react-native-paper';

import { Size } from '@/constants/theme';
import { TABS } from '@/constants/tabs';

export default function TabsLayout() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
      }}>
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: t(tab.titleKey),
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons
                name={focused ? tab.iconFocused : tab.icon}
                size={Size.tabIcon}
                color={typeof color === 'string' ? color : theme.colors.primary}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
