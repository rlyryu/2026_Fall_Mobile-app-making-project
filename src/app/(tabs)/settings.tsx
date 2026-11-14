import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { List, SegmentedButtons, Text, useTheme } from 'react-native-paper';

import { FormSection } from '@/components/common/form-section';
import { formatHour, HourPickerDialog } from '@/components/settings/hour-picker-dialog';
import { Border, Opacity, Radius, Spacing } from '@/constants/theme';
import { setSetting } from '@/db/settings';
import { useSettings } from '@/hooks/use-settings';
import type { AppSettings, LanguageSetting, WeekStart } from '@/lib/types';

/**
 * Settings are stored in the `settings` table only. Changing them never touches habits or
 * logs (days_of_week stays ISO; week_start only affects display order and week boundaries).
 */
export default function SettingsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const db = useSQLiteContext();
  const { settings } = useSettings();
  const [hourPickerOpen, setHourPickerOpen] = useState(false);

  const save = async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    try {
      await setSetting(db, key, value);
    } catch {
      Alert.alert(t('common.errorTitle'), t('common.errorGeneric'));
    }
  };

  const hint = { color: theme.colors.onSurfaceVariant, opacity: Opacity.secondaryText };

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}>
      <FormSection label={t('settings.language')}>
        <SegmentedButtons<LanguageSetting>
          value={settings.language}
          onValueChange={(v) => void save('language', v)}
          buttons={[
            { value: 'system', label: t('settings.languageSystem') },
            { value: 'ko', label: t('settings.languageKo') },
            { value: 'en', label: t('settings.languageEn') },
          ]}
        />
      </FormSection>

      <FormSection label={t('settings.weekStart')}>
        <SegmentedButtons<WeekStart>
          value={settings.weekStart}
          onValueChange={(v) => void save('weekStart', v)}
          buttons={[
            { value: 'sun', label: t('settings.sunday') },
            { value: 'mon', label: t('settings.monday') },
          ]}
        />
        <Text variant="bodySmall" style={hint}>
          {t('settings.weekStartHint')}
        </Text>
      </FormSection>

      <FormSection label={t('settings.dayStartHour')}>
        <List.Item
          title={formatHour(settings.dayStartHour, t)}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => setHourPickerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`${t('settings.dayStartHour')} ${formatHour(settings.dayStartHour, t)}`}
          style={[styles.item, { borderColor: theme.colors.outlineVariant }]}
        />
        <Text variant="bodySmall" style={hint}>
          {t('settings.dayStartHourHint')}
        </Text>
      </FormSection>

      {hourPickerOpen ? (
        <HourPickerDialog
          value={settings.dayStartHour}
          onDismiss={() => setHourPickerOpen(false)}
          onSelect={(hour) => {
            setHourPickerOpen(false);
            void save('dayStartHour', hour);
          }}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.md, gap: Spacing.lg },
  item: { borderWidth: Border.width, borderRadius: Radius.md },
});
