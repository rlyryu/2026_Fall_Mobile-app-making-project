import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { Button, useTheme } from 'react-native-paper';

import { EmptyState } from '@/components/common/empty-state';
import { HabitForm } from '@/components/habit-form/habit-form';
import { Spacing } from '@/constants/theme';
import { archiveHabit, updateHabit } from '@/db/habits';
import { useHabit } from '@/hooks/use-habits';
import { useLogicalToday } from '@/hooks/use-logical-today';
import { habitToDraft } from '@/lib/habit-draft';

export default function EditHabitScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const db = useSQLiteContext();
  const today = useLogicalToday();
  const { id } = useLocalSearchParams<{ id: string }>();
  const habitId = Number(id);
  const habit = useHabit(habitId);

  if (habit === undefined) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: t('habitForm.titleEdit') }} />
        <ActivityIndicator accessibilityLabel={t('common.loading')} />
      </View>
    );
  }
  if (habit === null) {
    return (
      <>
        <Stack.Screen options={{ title: t('habitForm.titleEdit') }} />
        <EmptyState title={t('habitForm.notFound')} icon="alert-circle-outline" />
      </>
    );
  }

  const confirmArchive = () =>
    Alert.alert(
      t('habitForm.archiveConfirmTitle'),
      t('habitForm.archiveConfirmMessage', { name: habit.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('habitForm.archive'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Archived from the logical today on: not due today or later, past days unchanged.
              await archiveHabit(db, habit.id, today);
              router.back();
            } catch {
              Alert.alert(t('common.errorTitle'), t('common.errorGeneric'));
            }
          },
        },
      ],
    );

  return (
    <HabitForm
      key={habit.id}
      title={t('habitForm.titleEdit')}
      initial={habitToDraft(habit)}
      onSubmit={async (input) => {
        await updateHabit(db, habit.id, input);
        router.back();
      }}
      footer={
        habit.archivedAt === null ? (
          <Button
            mode="outlined"
            icon="archive-outline"
            textColor={theme.colors.error}
            onPress={confirmArchive}
            style={styles.archive}>
            {t('habitForm.archive')}
          </Button>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  archive: { marginTop: Spacing.md },
});
