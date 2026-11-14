import type { ComponentProps } from 'react';

import type { MaterialCommunityIcons } from '@expo/vector-icons';

import type { TranslationKey } from '@/i18n';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface TabDef {
  /** Route file name inside `src/app/(tabs)/`. */
  name: string;
  titleKey: TranslationKey;
  icon: IconName;
  iconFocused: IconName;
}

/**
 * Bottom tabs, in order. To add a tab (e.g. Report): create `src/app/(tabs)/<name>.tsx`
 * and add one entry here (plus its i18n title key).
 */
export const TABS: readonly TabDef[] = [
  { name: 'index', titleKey: 'tabs.today', icon: 'check-circle-outline', iconFocused: 'check-circle' },
  { name: 'monthly', titleKey: 'tabs.monthly', icon: 'calendar-month-outline', iconFocused: 'calendar-month' },
  { name: 'habits', titleKey: 'tabs.habits', icon: 'format-list-bulleted', iconFocused: 'format-list-bulleted' },
  { name: 'settings', titleKey: 'tabs.settings', icon: 'cog-outline', iconFocused: 'cog' },
];
