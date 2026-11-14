import { format } from 'date-fns';
import { Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, StyleSheet, View } from 'react-native';
import { IconButton, useTheme } from 'react-native-paper';

import { EmptyState } from '@/components/common/empty-state';
import { HabitListRow } from '@/components/habits/habit-list-row';
import { Spacing } from '@/constants/theme';
import { deleteHabit, restoreHabit } from '@/db/habits';
import { useHabits } from '@/hooks/use-habits';
import { useSettings } from '@/hooks/use-settings';
import { parseISODate } from '@/lib/date';
import type { Habit } from '@/lib/types';

export default function ArchiveScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const db = useSQLiteContext();
  const { dateLocale } = useSettings();
  const habits = useHabits({ archived: true });

  const run = async (task: () => Promise<unknown>) => {
    try {
      await task();
    } catch {
      Alert.alert(t('common.errorTitle'), t('common.errorGeneric'));
    }
  };

  const confirmDelete = (h: Habit) =>
    Alert.alert(t('archive.deleteConfirmTitle'), t('archive.deleteConfirmMessage', { name: h.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('archive.deletePermanently'),
        style: 'destructive',
        // Logs are removed too (FK ON DELETE CASCADE).
        onPress: () => void run(() => deleteHabit(db, h.id)),
      },
    ]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ title: t('archive.title') }} />
      {habits === undefined ? (
        <View style={styles.center}>
          <ActivityIndicator accessibilityLabel={t('common.loading')} />
        </View>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(h) => String(h.id)}
          contentContainerStyle={habits.length === 0 ? styles.emptyContent : styles.listContent}
          renderItem={({ item }) => (
            <HabitListRow
              habit={item}
              note={
                item.archivedAt
                  ? t('archive.archivedOn', {
                      date: format(parseISODate(item.archivedAt), t('dateFormat.full'), { locale: dateLocale }),
                    })
                  : undefined
              }
              right={
                <View style={styles.actions}>
                  <IconButton
                    icon="restore"
                    accessibilityLabel={`${t('common.restore')} ${item.name}`}
                    onPress={() => void run(() => restoreHabit(db, item.id))}
                  />
                  <IconButton
                    icon="delete-forever-outline"
                    iconColor={theme.colors.error}
                    accessibilityLabel={`${t('archive.deletePermanently')} ${item.name}`}
                    onPress={() => confirmDelete(item)}
                  />
                </View>
              }
            />
          )}
          ListEmptyComponent={<EmptyState title={t('archive.empty')} icon="archive-outline" />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingBottom: Spacing.lg },
  emptyContent: { flexGrow: 1 },
  actions: { flexDirection: 'row' },
});
