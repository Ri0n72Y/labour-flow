import { describe, expect, it, vi } from 'vitest'
import {
  currentWeekDuration,
  deriveBadges,
  getActiveDaysInRange,
  getDailyActivity,
  getCurrentStreak,
  getProjectRecentProgress,
  getTotalDuration,
  getWeeklyDuration,
} from '../../src/lib/stats/labourStats'
import type { LabourRecord, Project, WeeklySnapshot } from '../../src/types/domain'

const project: Project = {
  id: 'project-1',
  title: 'Alpha',
  createdAt: '2026-04-01T00:00:00.000Z',
  updatedAt: '2026-04-01T00:00:00.000Z',
}

function record(date: string, durationMinutes: number, projectId = project.id): LabourRecord {
  return {
    id: `${date}-${durationMinutes}`,
    projectId,
    date,
    content: `work for ${date}`,
    durationMinutes,
    createdAt: `${date}T00:00:00.000Z`,
    updatedAt: `${date}T00:00:00.000Z`,
  }
}

describe('labour stats helpers', () => {
  it('aggregates daily activity and total duration', () => {
    const records = [record('2026-04-29', 30), record('2026-04-29', 45), record('2026-04-30', 15)]

    expect(getDailyActivity(records)).toEqual([
      { date: '2026-04-29', recordCount: 2, durationMinutes: 75 },
      { date: '2026-04-30', recordCount: 1, durationMinutes: 15 },
    ])
    expect(getTotalDuration(records)).toBe(90)
    expect(getWeeklyDuration(records, '2026-04-28', '2026-05-04')).toBe(90)
  })

  it('finds project progress and streak-style signals', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-30T08:00:00.000Z'))
    const streakRecords = [
      record('2026-04-30', 30),
      record('2026-04-29', 30),
      record('2026-04-28', 30),
    ]

    expect(getProjectRecentProgress(project, streakRecords)).toBe(
      'work for 2026-04-30',
    )
    expect(getCurrentStreak(streakRecords)).toBe(3)
    expect(getActiveDaysInRange(streakRecords, 7)).toBe(3)
  })

  it('derives badges from sustained progress', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-30T08:00:00.000Z'))
    const records = Array.from({ length: 20 }, (_, index) =>
      record(`2026-04-${String(30 - index).padStart(2, '0')}`, 60),
    )
    const weeklySnapshots: WeeklySnapshot[] = [
      {
        id: 'snapshot-0',
        projectId: project.id,
        weekStart: '2026-04-27',
        weekEnd: '2026-05-03',
        prompt: '',
        content: 'summary',
      },
      {
        id: 'snapshot-1',
        projectId: project.id,
        weekStart: '2026-04-20',
        weekEnd: '2026-04-26',
        prompt: '',
        content: 'summary',
      },
      {
        id: 'snapshot-2',
        projectId: project.id,
        weekStart: '2026-04-13',
        weekEnd: '2026-04-19',
        prompt: '',
        content: 'summary',
      },
      {
        id: 'snapshot-3',
        projectId: project.id,
        weekStart: '2026-04-06',
        weekEnd: '2026-04-12',
        prompt: '',
        content: 'summary',
      },
    ]

    const badges = deriveBadges(records, weeklySnapshots)

    expect(badges.map((badge) => badge.id)).toEqual(
      expect.arrayContaining([
        'streak-7',
        'active-20-30',
        'weekly-summary-4',
        'project-20h',
      ]),
    )
  })

  it('uses the current week window', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-30T08:00:00.000Z'))
    const weekRecords = [
      record('2026-04-28', 30),
      record('2026-04-30', 60),
      record('2026-05-04', 90),
    ]

    expect(currentWeekDuration(weekRecords)).toBe(90)
  })
})
