import { Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, StyleSheet, View } from 'react-native';
import { FAB, IconButton, Text, useTheme } from 'react-native-paper';

import { EmptyState } from '@/components/common/empty-state';
import { TextPromptDialog } from '@/components/common/text-prompt-dialog';
import { Border, Size, Spacing } from '@/constants/theme';
import { createCategory, deleteCategory, renameCategory } from '@/db/categories';
import { useCategories } from '@/hooks/use-habits';
import type { Category } from '@/lib/types';

type Editing = { mode: 'add' } | { mode: 'rename'; category: Category };

export default function CategoriesScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const db = useSQLiteContext();
  const categories = useCategories();
  const [editing, setEditing] = useState<Editing | null>(null);

  const run = async (task: () => Promise<unknown>) => {
    try {
      await task();
    } catch {
      Alert.alert(t('common.errorTitle'), t('common.errorGeneric'));
    }
  };

  const confirmDelete = (c: Category) =>
    Alert.alert(t('categories.deleteConfirmTitle'), t('categories.deleteConfirmMessage', { name: c.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        // Habits in this category become uncategorized via FK ON DELETE SET NULL.
        onPress: () => void run(() => deleteCategory(db, c.id)),
      },
    ]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ title: t('categories.title') }} />
      {categories === undefined ? (
        <View style={styles.center}>
          <ActivityIndicator accessibilityLabel={t('common.loading')} />
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={categories.length === 0 ? styles.emptyContent : styles.listContent}
          renderItem={({ item }) => (
            <View style={[styles.row, { borderBottomColor: theme.colors.outlineVariant }]}>
              <Text variant="bodyLarge" style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              <IconButton
                icon="pencil-outline"
                accessibilityLabel={`${t('common.rename')} ${item.name}`}
                onPress={() => setEditing({ mode: 'rename', category: item })}
              />
              <IconButton
                icon="delete-outline"
                accessibilityLabel={`${t('common.delete')} ${item.name}`}
                onPress={() => confirmDelete(item)}
              />
            </View>
          )}
          ListEmptyComponent={<EmptyState title={t('categories.empty')} icon="shape-outline" />}
        />
      )}
      <FAB
        icon="plus"
        accessibilityLabel={t('categories.add')}
        onPress={() => setEditing({ mode: 'add' })}
        style={styles.fab}
      />

      {editing ? (
        <TextPromptDialog
          key={editing.mode === 'rename' ? `r${editing.category.id}` : 'add'}
          title={editing.mode === 'add' ? t('categories.add') : t('categories.renameTitle')}
          label={t('categories.nameLabel')}
          initialValue={editing.mode === 'rename' ? editing.category.name : ''}
          confirmLabel={editing.mode === 'add' ? t('common.add') : t('common.save')}
          emptyError={t('categories.nameRequired')}
          onDismiss={() => setEditing(null)}
          onConfirm={(name) => {
            const current = editing;
            setEditing(null);
            void run(() =>
              current.mode === 'add'
                ? createCategory(db, name)
                : renameCategory(db, current.category.id, name),
            );
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingBottom: Size.fabClearance },
  emptyContent: { flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    minHeight: Size.touch + Spacing.sm,
    borderBottomWidth: Border.width,
  },
  name: { flex: 1 },
  fab: { position: 'absolute', right: Spacing.md, bottom: Spacing.md },
});
