import type { Badge, LabourRecord, Project, WeeklySnapshot } from '../../types/domain'
import { addDays, getWeekRange, todayKey } from '../date'

export interface DailyActivity {
  date: string
  recordCount: number
  durationMinutes: number
}

export function getDailyActivity(records: LabourRecord[]) {
  const activity = new Map<string, DailyActivity>()
  for (const record of records) {
    const current = activity.get(record.date) ?? {
      date: record.date,
      recordCount: 0,
      durationMinutes: 0,
    }
    current.recordCount += 1
    current.durationMinutes += record.durationMinutes
    activity.set(record.date, current)
  }
  return Array.from(activity.values()).sort((left, right) =>
    left.date.localeCompare(right.date),
  )
}

export function getCurrentStreak(records: LabourRecord[]) {
  const activeDates = new Set(records.map((record) => record.date))
  let cursor = todayKey()
  let streak = 0
  while (activeDates.has(cursor)) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

export function getActiveDaysInRange(records: LabourRecord[], days: number) {
  const end = todayKey()
  const start = addDays(end, -(days - 1))
  return new Set(
    records
      .filter((record) => record.date >= start && record.date <= end)
      .map((record) => record.date),
  ).size
}

export function getTotalDuration(records: LabourRecord[]) {
  return records.reduce((total, record) => total + record.durationMinutes, 0)
}

export function getProjectRecentProgress(
  project: Project,
  records: LabourRecord[],
) {
  const latest = records
    .filter((record) => record.projectId === project.id)
    .toSorted((left, right) => right.date.localeCompare(left.date))[0]
  return latest?.progressNote || latest?.content || '还没有记录最近进展'
}

export function getWeeklyDuration(
  records: LabourRecord[],
  weekStart: string,
  weekEnd: string,
) {
  return records
    .filter((record) => record.date >= weekStart && record.date <= weekEnd)
    .reduce((total, record) => total + record.durationMinutes, 0)
}

export function deriveBadges(
  records: LabourRecord[],
  weeklySnapshots: WeeklySnapshot[],
) {
  const earnedAt = new Date().toISOString()
  const badges: Badge[] = []
  if (getCurrentStreak(records) >= 7) {
    badges.push({
      id: 'streak-7',
      name: '连续记录者',
      description: '连续 7 天留下劳动记录',
      type: 'consistency',
      earnedAt,
    })
  }
  if (getActiveDaysInRange(records, 30) >= 20) {
    badges.push({
      id: 'active-20-30',
      name: '稳定劳动者',
      description: '最近 30 天至少 20 天有记录',
      type: 'consistency',
      earnedAt,
    })
  }
  if (weeklySnapshots.length >= 4) {
    badges.push({
      id: 'weekly-summary-4',
      name: '周总结维护者',
      description: '维护了至少 4 个周小结',
      type: 'summary',
      earnedAt,
    })
  }

  const durationByProject = new Map<string, number>()
  for (const record of records) {
    durationByProject.set(
      record.projectId,
      (durationByProject.get(record.projectId) ?? 0) + record.durationMinutes,
    )
  }
  if ([...durationByProject.values()].some((minutes) => minutes >= 20 * 60)) {
    badges.push({
      id: 'project-20h',
      name: '项目推进者',
      description: '单个项目累计投入超过 20 小时',
      type: 'progress',
      earnedAt,
    })
  }
  return badges
}

export function currentWeekDuration(records: LabourRecord[]) {
  const { weekStart, weekEnd } = getWeekRange()
  return getWeeklyDuration(records, weekStart, weekEnd)
}
