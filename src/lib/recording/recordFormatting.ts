import type { LaborLogEntry } from '../../interfaces'
import { markdownListItems } from '../markdown/listRendering'

export type ListStyle = 'unordered' | 'ordered'

export function durationLabel(hours: number) {
  return `${Number(hours.toFixed(1))}h`
}

export function clampDuration(hours: number) {
  return Math.max(0, Math.round(hours * 2) / 2)
}

export function formatDurationShort(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function formatStartTime(dateIso: string | null | undefined) {
  if (!dateIso) return ''
  const date = new Date(dateIso)
  if (Number.isNaN(date.getTime())) return ''
  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes()
  ).padStart(2, '0')} 开始`
}

export function getElapsedSeconds({
  status,
  startAt,
  endAt,
  pausedAt,
  pausedSeconds,
  clockTick,
}: {
  status: string
  startAt: string | null
  endAt: string | null
  pausedAt: string | null
  pausedSeconds: number
  clockTick: number
}) {
  if (status === 'idle' || !startAt) return 0
  const effectiveEnd =
    endAt ??
    (status === 'paused' && pausedAt
      ? pausedAt
      : new Date(clockTick || Date.parse(startAt)).toISOString())
  return Math.round(
    Math.max(0, Date.parse(effectiveEnd) - Date.parse(startAt)) / 1000 -
      pausedSeconds
  )
}

export function descriptionFromLogs(
  logs: Array<Pick<LaborLogEntry, 'text'>>,
  listStyle: ListStyle
) {
  const lines = logs.flatMap((log) => markdownListItems(log.text))
  if (listStyle === 'ordered') {
    return lines.map((line, index) => `${index + 1}. ${line}`).join('\n')
  }
  return lines.map((line) => `- ${line}`).join('\n')
}
