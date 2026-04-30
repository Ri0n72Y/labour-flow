import { describe, expect, it } from 'vitest'
import {
  addDays,
  formatMinutes,
  getWeekRange,
  todayKey,
  toDateKey,
} from '../../src/lib/date'
import {
  createManualRange,
  formatDate,
  formatDateTime,
  formatDuration,
  formatMonth,
  getDurationSeconds,
  groupKey,
  nowIso,
  todayInputValue,
} from '../../src/utils/time'

describe('time helpers', () => {
  it('formats duration values consistently', () => {
    expect(formatDuration(0)).toBe('00:00:00')
    expect(formatDuration(3661)).toBe('01:01:01')
    expect(formatMinutes(65)).toBe('1 小时 5 分钟')
  })

  it('formats dates and validates invalid input', () => {
    const date = new Date(2026, 3, 30, 8, 15, 30)

    expect(formatDate(date)).toBe('2026-04-30')
    expect(formatDateTime(date.toISOString())).toBe(
      '2026-04-30 08:15:30',
    )
    expect(formatMonth(date)).toBe('2026-04')
    expect(formatDate(null)).toBe('')
    expect(formatDateTime('bad input')).toBe('')
  })

  it('derives keys and ranges from dates', () => {
    expect(toDateKey('2026-04-30T00:00:00.000Z')).toBe('2026-04-30')
    expect(addDays('2026-04-30', 2)).toBe('2026-05-02')
    expect(getWeekRange('2026-04-30')).toEqual({
      weekStart: '2026-04-27',
      weekEnd: '2026-05-03',
    })
  })

  it('builds manual ranges and grouped keys', () => {
    const range = createManualRange('2026-04-30', 1.5)

    expect(range.startAt).toBe('2026-04-30T01:00:00.000Z')
    expect(range.endAt).toBe('2026-04-30T02:30:00.000Z')
    expect(groupKey('2026-04-30T08:15:30.000Z', 'day')).toBe('2026-04-30')
    expect(groupKey('2026-04-30T08:15:30.000Z', 'month')).toBe('2026-04')
    expect(groupKey('2026-04-30T08:15:30.000Z', 'week')).toMatch(
      /^2026-W\d{2}$/,
    )
  })

  it('prefers stored duration seconds and falls back to timestamps', () => {
    expect(
      getDurationSeconds({
        startAt: '2026-04-30T00:00:00.000Z',
        endAt: '2026-04-30T00:10:00.000Z',
        duration: 42,
      }),
    ).toBe(42)
    expect(
      getDurationSeconds({
        startAt: '2026-04-30T00:00:00.000Z',
        endAt: '2026-04-30T00:10:00.000Z',
      }),
    ).toBe(600)
  })

  it('exposes current date helpers', () => {
    expect(todayKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(todayInputValue()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(nowIso()).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })
})
