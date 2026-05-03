import { useTranslation } from 'react-i18next'
import { formatMinutes } from '../../lib/date'
import type { UserStats } from '../../types/domain'

export function UserStatsCards({ stats }: { stats: UserStats }) {
  const { t } = useTranslation()
  const items = [
    {
      label: t('stats.currentStreak'),
      value: t('stats.days', { count: stats.currentStreak }),
    },
    {
      label: t('stats.recent7'),
      value: t('stats.activeDays', { count: stats.activeDays7 }),
    },
    {
      label: t('stats.recent30'),
      value: t('stats.activeDays', { count: stats.activeDays30 }),
    },
    {
      label: t('stats.totalDuration'),
      value: formatMinutes(stats.totalDurationMinutes),
    },
  ]

  return (
    <section className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-md border border-stone-200 bg-white p-3 shadow-sm"
        >
          <p className="text-xs text-stone-500">{item.label}</p>
          <p className="mt-1 text-lg font-semibold text-stone-950">{item.value}</p>
        </div>
      ))}
    </section>
  )
}
