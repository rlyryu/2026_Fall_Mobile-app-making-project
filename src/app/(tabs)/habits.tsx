import { router, useNavigation } from 'expo-router';
import { useLayoutEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, SectionList, StyleSheet, View } from 'react-native';
import { FAB, IconButton, Text, useTheme } from 'react-native-paper';

import { EmptyState } from '@/components/common/empty-state';
import { HabitListRow } from '@/components/habits/habit-list-row';
import { Size, Spacing } from '@/constants/theme';
import { useCategories, useHabits } from '@/hooks/use-habits';
import { groupByCategory } from '@/lib/grouping';

export default function HabitsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigation = useNavigation();
  const habits = useHabits({ archived: false });
  const categories = useCategories();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          <IconButton
            icon="shape-outline"
            accessibilityLabel={t('habits.manageCategories')}
            onPress={() => router.push('/categories')}
          />
          <IconButton
            icon="archive-outline"
            accessibilityLabel={t('habits.archive')}
            onPress={() => router.push('/archive')}
          />
        </View>
      ),
    });
  }, [navigation, t]);

  const sections = useMemo(
    () => (habits && categories ? groupByCategory(habits, categories, (h) => h.categoryId) : undefined),
    [habits, categories],
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      {sections === undefined ? (
        <View style={styles.center}>
          <ActivityIndicator accessibilityLabel={t('common.loading')} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(h) => String(h.id)}
          contentContainerStyle={sections.length === 0 ? styles.emptyContent : styles.listContent}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text variant="labelLarge" style={[styles.sectionHeader, { color: theme.colors.onSurfaceVariant }]}>
              {section.title ?? t('habits.uncategorized')}
            </Text>
          )}
          renderItem={({ item }) => (
            <HabitListRow habit={item} onPress={() => router.push(`/habit/${item.id}/edit`)} />
          )}
          ListEmptyComponent={
            <EmptyState title={t('habits.empty')} hint={t('habits.emptyHint')} icon="format-list-bulleted" />
          }
        />
      )}
      <FAB
        icon="plus"
        accessibilityLabel={t('habits.add')}
        onPress={() => router.push('/habit/new')}
        style={styles.fab}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingBottom: Size.fabClearance },
  emptyContent: { flexGrow: 1 },
  sectionHeader: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.xs },
  headerActions: { flexDirection: 'row' },
  fab: { position: 'absolute', right: Spacing.md, bottom: Spacing.md },
});
