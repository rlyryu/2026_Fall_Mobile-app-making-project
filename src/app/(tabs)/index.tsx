import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, AppState, SectionList, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { EmptyState } from '@/components/common/empty-state';
import { DateHeader } from '@/components/today/date-header';
import { HabitRow } from '@/components/today/habit-row';
import { QuantityDialog } from '@/components/today/quantity-dialog';
import { Spacing } from '@/constants/theme';
import { useLogActions } from '@/hooks/use-log-actions';
import { useLogicalToday } from '@/hooks/use-logical-today';
import { useTodaySections } from '@/hooks/use-today-sections';
import { addDays } from '@/lib/date';
import { resolveSelectedDate, type TodayItem } from '@/lib/today';
import type { ISODate } from '@/lib/types';

/** Home (main screen): today's habits, with ‹ › to fix a past day's records. */
export default function HomeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const today = useLogicalToday();

  // A past day picked with ‹ ›. null = today. It is reset whenever the user leaves this tab
  // or the app goes to the background, so Home always reopens on today.
  const [selected, setSelected] = useState<ISODate | null>(null);
  const date = resolveSelectedDate(selected ?? undefined, today);

  useFocusEffect(useCallback(() => () => setSelected(null), []));
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') setSelected(null);
    });
    return () => sub.remove();
  }, []);

  const sections = useTodaySections(date, today);
  const actions = useLogActions(date);
  const [editing, setEditing] = useState<TodayItem | null>(null);

  const goTo = (target: ISODate) => setSelected(target === today ? null : target);

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <DateHeader
        date={date}
        today={today}
        onPrev={() => goTo(addDays(date, -1))}
        onNext={() => goTo(addDays(date, 1))}
        onToday={() => goTo(today)}
      />

      {sections === undefined ? (
        <View style={styles.center}>
          <ActivityIndicator accessibilityLabel={t('common.loading')} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.habit.id)}
          contentContainerStyle={sections.length === 0 ? styles.emptyContent : styles.listContent}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text
              variant="labelLarge"
              style={[styles.sectionHeader, { color: theme.colors.onSurfaceVariant }]}>
              {section.title ?? t('habits.uncategorized')}
            </Text>
          )}
          renderItem={({ item }) => (
            <HabitRow
              item={item}
              onToggle={() => void actions.toggleCheck(item)}
              onStep={(direction) => void actions.step(item, direction)}
              onEditValue={() => setEditing(item)}
            />
          )}
          ListEmptyComponent={
            <EmptyState title={t('today.empty')} hint={t('today.emptyHint')} icon="calendar-blank-outline" />
          }
        />
      )}

      {editing ? (
        <QuantityDialog
          key={`${editing.habit.id}-${date}`}
          item={editing}
          onDismiss={() => setEditing(null)}
          onSubmit={(value) => {
            void actions.setValue(editing, value);
            setEditing(null);
          }}
          onClear={() => {
            void actions.clear(editing);
            setEditing(null);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingBottom: Spacing.lg },
  emptyContent: { flexGrow: 1 },
  sectionHeader: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
});
