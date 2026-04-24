import type { SignedLaborRecord, ViewPeriod } from '../interfaces'

export function nowIso() {
  return new Date().toISOString()
}

export function todayInputValue() {
  return formatDate(new Date())
}

export function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60
  return [hours, minutes, rest].map((part) => String(part).padStart(2, '0')).join(':')
}

export function formatDateTime(dateIso: string | null | undefined) {
  if (!dateIso) return ''
  const date = new Date(dateIso)
  if (Number.isNaN(date.getTime())) return ''
  return `${formatDate(date)} ${formatTime(date)}`
}

export function formatDate(dateInput: string | Date | null | undefined) {
  if (!dateInput) return ''
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (Number.isNaN(date.getTime())) return ''
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function formatTime(date: Date) {
  return [
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
    String(date.getSeconds()).padStart(2, '0'),
  ].join(':')
}

export function formatMonth(dateInput: string | Date) {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (Number.isNaN(date.getTime())) return ''
  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
  ].join('-')
  return datePart
}

export function getDurationSeconds(record: Pick<SignedLaborRecord, 'startAt' | 'endAt'>) {
  return Math.max(0, Math.round((Date.parse(record.endAt) - Date.parse(record.startAt)) / 1000))
}

export function groupKey(dateIso: string, period: ViewPeriod) {
  const date = new Date(dateIso)
  if (period === 'day') return formatDate(date)
  if (period === 'month') return formatMonth(date)

  const monday = new Date(date)
  const day = monday.getDay() || 7
  monday.setDate(monday.getDate() - day + 1)
  return `${monday.getFullYear()}-W${String(getWeekNumber(monday)).padStart(2, '0')}`
}

export function createManualRange(dateValue: string, durationHours: number) {
  const start = new Date(`${dateValue}T09:00:00`)
  const end = new Date(start.getTime() + durationHours * 3600 * 1000)
  return { startAt: start.toISOString(), endAt: end.toISOString() }
}

function getWeekNumber(date: Date) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNumber = target.getUTCDay() || 7
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber)
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
  return Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}
