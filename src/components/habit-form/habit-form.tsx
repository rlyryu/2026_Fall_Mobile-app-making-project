import { Stack } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, SegmentedButtons, TextInput, useTheme } from 'react-native-paper';

import { Spacing } from '@/constants/theme';
import { useSettings } from '@/hooks/use-settings';
import type { GoalDirection, HabitType, IsoWeekday, RecurrenceType } from '@/lib/types';
import {
  type HabitDraft,
  type HabitFieldError,
  type HabitInput,
  hasErrors,
  MAX_NAME_LENGTH,
  normalizeHabitDraft,
  validateHabitDraft,
} from '@/lib/validation';
import { orderedWeekdays } from '@/lib/week';

import { CategoryField } from './category-field';
import { ChoiceChips } from './choice-chips';
import { ColorField } from './color-field';
import { FormSection } from '@/components/common/form-section';
import { StartDateField } from './start-date-field';

interface Props {
  /** Header title. */
  title: string;
  initial: HabitDraft;
  /** Persist the habit (and navigate away). Throwing shows a generic error. */
  onSubmit: (input: HabitInput) => Promise<void>;
  /** Extra content at the bottom (e.g. the Archive button when editing). */
  footer?: ReactNode;
}

const TIMES_PER_WEEK = [1, 2, 3, 4, 5, 6, 7] as const;

/** Add/edit form shared by `habit/new` and `habit/[id]/edit`. */
export function HabitForm({ title, initial, onSubmit, footer }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { weekStart } = useSettings().settings;

  const [draft, setDraft] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const errors = validateHabitDraft(draft);
  const errorText = (e: HabitFieldError | undefined) =>
    submitted && e ? t(`validation.${e}`) : undefined;

  const set = <K extends keyof HabitDraft>(key: K, value: HabitDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const toggleDay = (day: IsoWeekday) =>
    setDraft((d) => ({
      ...d,
      daysOfWeek: d.daysOfWeek.includes(day)
        ? d.daysOfWeek.filter((x) => x !== day)
        : [...d.daysOfWeek, day],
    }));

  const save = async () => {
    setSubmitted(true);
    if (saving || hasErrors(errors)) return;
    setSaving(true);
    try {
      await onSubmit(normalizeHabitDraft(draft));
    } catch {
      setSaving(false);
      Alert.alert(t('common.errorTitle'), t('common.errorGeneric'));
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title,
          headerRight: () => (
            <Button onPress={save} disabled={saving}>
              {t('common.save')}
            </Button>
          ),
        }}
      />
      <ScrollView
        style={{ backgroundColor: theme.colors.background }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        {/* Name */}
        <View>
          <TextInput
            mode="outlined"
            label={t('habitForm.name')}
            placeholder={t('habitForm.namePlaceholder')}
            value={draft.name}
            onChangeText={(v) => set('name', v)}
            maxLength={MAX_NAME_LENGTH}
            error={!!errorText(errors.name)}
          />
          <HelperText type="error" visible={!!errorText(errors.name)}>
            {errorText(errors.name)}
          </HelperText>
        </View>

        {/* Type */}
        <FormSection label={t('habitForm.type')}>
          <SegmentedButtons<HabitType>
            value={draft.type}
            onValueChange={(v) => set('type', v)}
            buttons={[
              { value: 'check', label: t('habitForm.typeCheck'), icon: 'check' },
              { value: 'quantity', label: t('habitForm.typeQuantity'), icon: 'counter' },
            ]}
          />
        </FormSection>

        {draft.type === 'quantity' ? (
          <>
            <FormSection label={t('habitForm.goalValue')} error={errorText(errors.goalValue)}>
              <View style={styles.inline}>
                <TextInput
                  mode="outlined"
                  label={t('habitForm.goalValue')}
                  value={draft.goalValueText}
                  onChangeText={(v) => set('goalValueText', v)}
                  inputMode="decimal"
                  error={!!errorText(errors.goalValue)}
                  style={styles.flex}
                />
                <TextInput
                  mode="outlined"
                  label={t('habitForm.unit')}
                  placeholder={t('habitForm.unitPlaceholder')}
                  value={draft.unit}
                  onChangeText={(v) => set('unit', v)}
                  maxLength={10}
                  style={styles.flex}
                />
              </View>
            </FormSection>
            <FormSection label={t('habitForm.direction')}>
              <SegmentedButtons<GoalDirection>
                value={draft.goalDirection}
                onValueChange={(v) => set('goalDirection', v)}
                buttons={[
                  { value: 'at_least', label: t('habitForm.atLeast') },
                  { value: 'at_most', label: t('habitForm.atMost') },
                ]}
              />
            </FormSection>
          </>
        ) : null}

        {/* Recurrence */}
        <FormSection
          label={t('habitForm.recurrence')}
          error={errorText(errors.daysOfWeek) ?? errorText(errors.timesPerWeek)}>
          <SegmentedButtons<RecurrenceType>
            value={draft.recurrenceType}
            onValueChange={(v) => set('recurrenceType', v)}
            buttons={[
              { value: 'daily', label: t('habitForm.daily') },
              { value: 'weekdays', label: t('habitForm.weekdays') },
              { value: 'weekly_count', label: t('habitForm.weeklyCount') },
            ]}
          />
          {draft.recurrenceType === 'weekdays' ? (
            <>
              <ChoiceChips<IsoWeekday>
                options={orderedWeekdays(weekStart).map((d) => ({
                  value: d,
                  label: t(`weekday.${d}`),
                  accessibilityLabel: t(`weekdayLong.${d}`),
                }))}
                isSelected={(d) => draft.daysOfWeek.includes(d)}
                onPress={toggleDay}
              />
              <SegmentedButtons<'1' | '2'>
                value={String(draft.recurrenceInterval) as '1' | '2'}
                onValueChange={(v) => set('recurrenceInterval', v === '2' ? 2 : 1)}
                buttons={[
                  { value: '1', label: t('habitForm.everyWeek') },
                  { value: '2', label: t('habitForm.everyOtherWeek') },
                ]}
              />
            </>
          ) : null}
          {draft.recurrenceType === 'weekly_count' ? (
            <ChoiceChips<number>
              options={TIMES_PER_WEEK.map((n) => ({
                value: n,
                label: String(n),
                accessibilityLabel: t('habitForm.timesPerWeek', { count: n }),
              }))}
              isSelected={(n) => draft.timesPerWeek === n}
              onPress={(n) => set('timesPerWeek', n)}
            />
          ) : null}
        </FormSection>

        <FormSection label={t('habitForm.category')}>
          <CategoryField value={draft.categoryId} onChange={(id) => set('categoryId', id)} />
        </FormSection>

        <FormSection label={t('habitForm.color')} error={errorText(errors.color)}>
          <ColorField value={draft.color} onChange={(c) => set('color', c)} />
        </FormSection>

        <FormSection label={t('habitForm.startDate')} error={errorText(errors.startDate)}>
          <StartDateField value={draft.startDate} onChange={(d) => set('startDate', d)} />
        </FormSection>

        {footer}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.md, gap: Spacing.lg, paddingBottom: Spacing.xl },
  inline: { flexDirection: 'row', gap: Spacing.sm },
  flex: { flex: 1 },
});
