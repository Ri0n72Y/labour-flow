import { describe, expect, it } from 'vitest'
import { generateWeeklySnapshot } from '../../src/lib/ai/generateWeeklySnapshot'
import type { LabourRecord, Project, WeeklyPlan } from '../../src/types/domain'

const project: Project = {
  id: 'project-1',
  title: 'Alpha',
  createdAt: '2026-04-01T00:00:00.000Z',
  updatedAt: '2026-04-01T00:00:00.000Z',
}

const records: LabourRecord[] = [
  {
    id: 'record-1',
    projectId: project.id,
    date: '2026-04-30',
    content: 'shipped tests',
    durationMinutes: 90,
    createdAt: '2026-04-30T00:00:00.000Z',
    updatedAt: '2026-04-30T00:00:00.000Z',
  },
]

const weeklyPlan: WeeklyPlan = {
  id: 'plan-1',
  projectId: project.id,
  weekStart: '2026-04-27',
  weekEnd: '2026-05-03',
  planText: '- keep moving',
  createdAt: '2026-04-30T00:00:00.000Z',
  updatedAt: '2026-04-30T00:00:00.000Z',
}

describe('generateWeeklySnapshot', () => {
  it('summarizes the current week without calling an external service', async () => {
    const content = await generateWeeklySnapshot({
      project,
      records,
      weeklyPlan,
      prompt: 'Focus on progress',
    })

    expect(content).toContain('Alpha')
    expect(content).toContain('90')
    expect(content).toContain('keep moving')
    expect(content).toContain('shipped tests')
    expect(content).toContain('Focus on progress')
  })
})
