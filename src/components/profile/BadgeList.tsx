import { useTranslation } from 'react-i18next'
import type { Badge } from '../../types/domain'

export function BadgeList({ badges }: { badges: Badge[] }) {
  const { t } = useTranslation()

  return (
    <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-stone-950">
        {t('badges.title')}
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {badges.length === 0 ? (
          <p className="text-sm text-stone-500">{t('badges.empty')}</p>
        ) : (
          badges.map((badge) => {
            const name = t(`badges.items.${badge.id}.name`, {
              defaultValue: badge.name,
            })
            const description = t(`badges.items.${badge.id}.description`, {
              defaultValue: badge.description,
            })

            return (
              <span
                key={badge.id}
                className="rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800"
                title={description}
              >
                {name}
              </span>
            )
          })
        )}
      </div>
    </section>
  )
}
