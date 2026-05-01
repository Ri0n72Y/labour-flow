import { describe, expect, it } from 'vitest'
import { exportProjectToMarkdown, parseProjectMarkdown } from '../../src/lib/markdown/projectMarkdown'
import type { LabourRecord, Project, PromptTemplate, WeeklyPlan, WeeklySnapshot } from '../../src/types/domain'

const project: Project = {
  id: 'project-1',
  title: 'Alpha',
  description: 'Project description',
  direction: 'Keep moving',
  hypothesis: 'If we keep shipping, we keep learning',
  completionCriteria: 'All weekly notes are exported',
  backlog: ['first item', 'second item'],
  createdAt: '2026-04-01T00:00:00.000Z',
  updatedAt: '2026-04-01T00:00:00.000Z',
}

const records: LabourRecord[] = [
  {
    id: 'record-1',
    projectId: project.id,
    date: '2026-04-30',
    content: '- shipped tests\n- fixed parser',
    durationMinutes: 90,
    createdAt: '2026-04-30T00:00:00.000Z',
    updatedAt: '2026-04-30T00:00:00.000Z',
  },
]

const weeklyPlans: WeeklyPlan[] = [
  {
    id: 'plan-1',
    projectId: project.id,
    weekStart: '2026-04-27',
    weekEnd: '2026-05-03',
    planText: '- keep coverage moving',
    createdAt: '2026-04-30T00:00:00.000Z',
    updatedAt: '2026-04-30T00:00:00.000Z',
  },
]

const weeklySnapshots: WeeklySnapshot[] = [
  {
    id: 'snapshot-1',
    projectId: project.id,
    weekStart: '2026-04-27',
    weekEnd: '2026-05-03',
    prompt: 'Summarize progress',
    content: 'Snapshot content',
    generatedAt: '2026-04-30T00:00:00.000Z',
  },
]

const promptTemplates: PromptTemplate[] = [
  {
    id: 'prompt-1',
    name: 'Global prompt',
    content: 'Summarize progress',
    scope: 'global',
    createdAt: '2026-04-30T00:00:00.000Z',
    updatedAt: '2026-04-30T00:00:00.000Z',
  },
]

describe('project markdown helpers', () => {
  it('exports and parses the project document structure', () => {
    const markdown = exportProjectToMarkdown(
      project,
      records,
      weeklyPlans,
      weeklySnapshots,
      promptTemplates,
      { currentDate: '2026-04-30' },
    )

    expect(markdown).toContain('shipped tests')
    expect(markdown).toContain('keep coverage moving')

    const parsed = parseProjectMarkdown(`# Alpha\n> Project description\n\n${markdown}`)

    expect(parsed.project.title).toBe('Alpha')
    expect(parsed.project.description).toBe('Project description')
    expect(parsed.project.direction).toBe('Keep moving')
    expect(parsed.project.hypothesis).toBe(
      'If we keep shipping, we keep learning',
    )
    expect(parsed.project.completionCriteria).toBe(
      'All weekly notes are exported',
    )
    expect(parsed.project.backlog).toEqual(['first item', 'second item'])
    expect(parsed.records).toEqual([
      {
        date: '2026-04-30',
        content: '- shipped tests\n- fixed parser',
        durationMinutes: 90,
      },
    ])
    expect(parsed.weeklyPlans).toHaveLength(1)
    expect(parsed.weeklySnapshots).toHaveLength(1)
    expect(parsed.promptTemplates).toHaveLength(1)
  })
})
