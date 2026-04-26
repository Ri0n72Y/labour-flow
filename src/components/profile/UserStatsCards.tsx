import { formatMinutes } from '../../lib/date'
import type { UserStats } from '../../types/domain'

export function UserStatsCards({ stats }: { stats: UserStats }) {
  const items = [
    { label: '连续记录', value: `${stats.currentStreak} 天` },
    { label: '最近 7 天', value: `${stats.activeDays7} 天活跃` },
    { label: '最近 30 天', value: `${stats.activeDays30} 天活跃` },
    { label: '总劳动时长', value: formatMinutes(stats.totalDurationMinutes) },
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
