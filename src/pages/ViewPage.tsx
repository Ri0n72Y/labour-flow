import { Switch } from '@headlessui/react'
import ReactECharts from 'echarts-for-react'
import { useMemo, useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { MarkdownList } from '../components/MarkdownList'
import type { ViewPeriod } from '../interfaces'
import { useLaborStore } from '../stores/laborStore'
import { getRecordTitle } from '../utils/record'
import {
  formatDate,
  formatDuration,
  getDurationSeconds,
  groupKey,
} from '../utils/time'

export function ViewPage() {
  const records = useLaborStore((state) => state.records)
  const [period, setPeriod] = useState<ViewPeriod>('week')
  const [showCharts, setShowCharts] = useState(false)

  const grouped = useMemo(() => {
    const totals = new Map<string, number>()
    for (const record of records) {
      const key = groupKey(record.startAt, period)
      totals.set(
        key,
        (totals.get(key) ?? 0) + getDurationSeconds(record) / 3600,
      )
    }
    return Array.from(totals.entries()).sort(([left], [right]) =>
      left.localeCompare(right),
    )
  }, [period, records])

  const tagTotals = useMemo(() => {
    const totals = new Map<string, number>()
    for (const record of records) {
      for (const tag of record.tags) {
        totals.set(
          tag,
          (totals.get(tag) ?? 0) + getDurationSeconds(record) / 3600,
        )
      }
    }
    return Array.from(totals.entries()).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2)),
    }))
  }, [records])

  const barOption = {
    grid: { left: 28, right: 12, top: 20, bottom: 28 },
    xAxis: {
      type: 'category',
      data: grouped.map(([key]) => key),
      axisLabel: { fontSize: 10 },
    },
    yAxis: { type: 'value' },
    series: [
      {
        type: 'bar',
        data: grouped.map(([, value]) => Number(value.toFixed(2))),
        itemStyle: { color: '#0f766e' },
      },
    ],
  }

  const pieOption = {
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie',
        radius: ['35%', '68%'],
        data: tagTotals,
      },
    ],
  }

  return (
    <div className="space-y-4 text-left">
      <div className="flex items-center justify-between rounded-md border border-stone-200 bg-white p-3 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-stone-950">
            {showCharts ? '图表模式' : '记录模式'}
          </p>
          <p className="mt-0.5 text-xs text-stone-500">
            {showCharts ? '查看劳动统计' : '查看签名记录明细'}
          </p>
        </div>
        <Switch
          checked={showCharts}
          className={`${showCharts ? 'bg-teal-700' : 'bg-stone-300'} relative inline-flex h-8 w-16 items-center rounded-full transition`}
          onChange={setShowCharts}
        >
          <span className="sr-only">切换查看模式</span>
          <span
            className={`${showCharts ? 'translate-x-9' : 'translate-x-1'} inline-block h-6 w-6 rounded-full bg-white transition`}
          />
        </Switch>
      </div>

      {showCharts ? (
        <>
          <div className="grid grid-cols-3 gap-2">
            {(['day', 'week', 'month'] as const).map((item) => (
              <button
                key={item}
                className={`rounded-md px-3 py-2 text-sm font-semibold ${period === item ? 'bg-teal-700 text-white' : 'bg-white text-stone-600'}`}
                type="button"
                onClick={() => setPeriod(item)}
              >
                {item === 'day' ? '日' : item === 'week' ? '周' : '月'}
              </button>
            ))}
          </div>

          <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-stone-950">时长统计</h2>
            {records.length === 0 ? (
              <EmptyState />
            ) : (
              <ReactECharts className="h-56" option={barOption} />
            )}
          </section>

          <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-stone-950">标签分布</h2>
            {tagTotals.length === 0 ? (
              <p className="mt-4 text-sm text-stone-400">暂无标签数据</p>
            ) : (
              <ReactECharts className="h-56" option={pieOption} />
            )}
          </section>
        </>
      ) : (
        <section className="space-y-3">
          {records.length === 0 && <EmptyState />}
          {records.map((record) => (
            <article
              key={record.wid}
              className="rounded-md border border-stone-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-stone-950">
                    {getRecordTitle(record)}
                  </h3>
                  <p className="mt-1 text-xs text-stone-500">
                    {formatDate(record.startAt)} ·{' '}
                    {formatDuration(getDurationSeconds(record))}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                  已签名
                </span>
              </div>
              <div className="mt-3">
                <MarkdownList text={record.description} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {record.tags.map((tag) => (
                  <span
                    key={tag}
                    className="tag-chip bg-stone-100 text-stone-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}
