import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { addDays, formatMinutes, todayKey } from '../../lib/date'
import { getDailyActivity } from '../../lib/stats/labourStats'
import type { LabourRecord } from '../../types/domain'

export function LabourHeatmap({
  labourRecords,
  days = 90,
}: {
  labourRecords: LabourRecord[]
  days?: number
}) {
  const { t } = useTranslation()
  const cells = useMemo(() => {
    const activity = new Map(
      getDailyActivity(labourRecords).map((item) => [item.date, item]),
    )
    const end = todayKey()
    const start = addDays(end, -(days - 1))
    return Array.from({ length: days }, (_, index) => {
      const date = addDays(start, index)
      const item = activity.get(date)
      const duration = item?.durationMinutes ?? 0
      const level =
        duration >= 240 ? 4 : duration >= 120 ? 3 : duration >= 45 ? 2 : duration > 0 ? 1 : 0
      return {
        date,
        recordCount: item?.recordCount ?? 0,
        durationMinutes: duration,
        level,
      }
    })
  }, [days, labourRecords])

  const palette = ['bg-stone-100', 'bg-emerald-100', 'bg-emerald-300', 'bg-teal-500', 'bg-stone-900']

  return (
    <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-stone-950">
          {t('stats.heatmap')}
        </h2>
        <span className="text-xs text-stone-500">
          {t('stats.heatmapPastDays', { count: days })}
        </span>
      </div>
      <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-1">
        {cells.map((cell) => (
          <div
            key={cell.date}
            className={`h-4 w-4 rounded-[3px] ${palette[cell.level]}`}
            title={`${cell.date}：${t('common.recordsCount', {
              count: cell.recordCount,
            })}，${formatMinutes(cell.durationMinutes)}`}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1 text-xs text-stone-500">
        <span>{t('stats.heatmapLess')}</span>
        {palette.map((color) => (
          <span key={color} className={`h-3 w-3 rounded-[3px] ${color}`} />
        ))}
        <span>{t('stats.heatmapMore')}</span>
      </div>
    </section>
  )
}
