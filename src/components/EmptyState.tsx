import { useTranslation } from 'react-i18next'

export function EmptyState() {
  const { t } = useTranslation()

  return (
    <p className="mt-4 rounded-md bg-stone-50 px-3 py-6 text-center text-sm text-stone-400">
      {t('empty.stats')}
    </p>
  )
}
