import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/common/empty-state';

/** Placeholder: replaced by the real Settings screen in M4. */
export default function SettingsScreen() {
  const { t } = useTranslation();
  return <EmptyState title={t('tabs.settings')} icon="cog-outline" />;
}
