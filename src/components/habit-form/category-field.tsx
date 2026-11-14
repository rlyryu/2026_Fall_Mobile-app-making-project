import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { TextPromptDialog } from '@/components/common/text-prompt-dialog';
import { createCategory } from '@/db/categories';
import { useCategories } from '@/hooks/use-habits';

import { ChoiceChips } from './choice-chips';

const NEW = 'new' as const;

interface Props {
  value: number | null;
  onChange: (categoryId: number | null) => void;
}

/** "None" + existing categories + "New category" (created inline and selected). */
export function CategoryField({ value, onChange }: Props) {
  const { t } = useTranslation();
  const db = useSQLiteContext();
  const categories = useCategories() ?? [];
  const [creating, setCreating] = useState(false);

  const options = [
    { value: null, label: t('habitForm.noCategory') },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
    { value: NEW, label: `+ ${t('habitForm.newCategory')}` },
  ];

  return (
    <>
      <ChoiceChips<number | null | typeof NEW>
        options={options}
        isSelected={(v) => v === value}
        onPress={(v) => (v === NEW ? setCreating(true) : onChange(v))}
      />
      {creating ? (
        <TextPromptDialog
          title={t('habitForm.newCategory')}
          label={t('categories.nameLabel')}
          confirmLabel={t('common.add')}
          emptyError={t('categories.nameRequired')}
          onDismiss={() => setCreating(false)}
          onConfirm={async (name) => {
            setCreating(false);
            try {
              onChange(await createCategory(db, name));
            } catch {
              Alert.alert(t('common.errorTitle'), t('common.errorGeneric'));
            }
          }}
        />
      ) : null}
    </>
  );
}
