import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/common/empty-state';

/** Placeholder: replaced by the real Habits list in M3. */
export default function HabitsScreen() {
  const { t } = useTranslation();
  return <EmptyState title={t('habits.empty')} hint={t('habits.emptyHint')} icon="format-list-bulleted" />;
}
