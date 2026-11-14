import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { HabitForm } from '@/components/habit-form/habit-form';
import { createHabit } from '@/db/habits';
import { useLogicalToday } from '@/hooks/use-logical-today';
import { emptyDraft } from '@/lib/habit-draft';

export default function NewHabitScreen() {
  const { t } = useTranslation();
  const db = useSQLiteContext();
  const today = useLogicalToday();
  // Initial draft is fixed on mount (start date defaults to the logical today).
  const [initial] = useState(() => emptyDraft(today));

  return (
    <HabitForm
      title={t('habitForm.titleNew')}
      initial={initial}
      onSubmit={async (input) => {
        await createHabit(db, input);
        router.back();
      }}
    />
  );
}
