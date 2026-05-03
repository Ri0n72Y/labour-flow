import { describe, expect, it } from 'vitest'
import {
  findCurrentWeeklyPlan,
  findProjectPrompt,
  getProjectRecords,
  getRecordDurationTotal,
  getRecordsInWeek,
  projectUpdatesFromDraft,
  toProjectDraft,
  type ProjectDraft,
} from '../../src/lib/project/projectDetail'
import type {
  LabourRecord,
  Project,
  PromptTemplate,
  WeeklyPlan,
} from '../../src/types/domain'

const project: Project = {
  id: 'project-1',
  title: 'Alpha',
  description: 'Initial description',
  backlog: ['legacy item'],
  createdAt: '2026-04-01T00:00:00.000Z',
  updatedAt: '2026-04-01T00:00:00.000Z',
}

const draft: ProjectDraft = {
  title: '  Beta  ',
  description: 'Updated description',
  direction: 'Ship carefully',
  hypothesis: 'Testing keeps changes honest',
  completionCriteria: 'All critical paths covered',
  backlogText: '- [ ] first\n2. [x] second',
}

describe('project detail helpers', () => {
  it('creates editable drafts without mutating the project shape', () => {
    expect(toProjectDraft(project)).toEqual({
      title: 'Alpha',
      description: 'Initial description',
      direction: '',
      hypothesis: '',
      completionCriteria: '',
      backlogText: 'legacy item',
    })
  })

  it('builds focused project updates for each editable section', () => {
    expect(projectUpdatesFromDraft('summary', draft)).toEqual({
      title: 'Beta',
      description: 'Updated description',
    })
    expect(projectUpdatesFromDraft('direction', draft)).toEqual({
      direction: 'Ship carefully',
    })
    expect(projectUpdatesFromDraft('backlog', draft)).toEqual({
      backlogText: '- [ ] first\n2. [x] second',
      backlog: ['first', 'second'],
    })
  })

  it('sorts project records and filters the current week', () => {
    const records: LabourRecord[] = [
      record('old', 'project-1', '2026-04-20', 30),
      record('newest-other', 'project-2', '2026-05-03', 999),
      record('newest', 'project-1', '2026-05-03', 45),
      record('middle', 'project-1', '2026-04-30', 15),
    ]

    const projectRecords = getProjectRecords(records, 'project-1')
    expect(projectRecords.map((item) => item.id)).toEqual([
      'newest',
      'middle',
      'old',
    ])
    expect(getRecordsInWeek(projectRecords, '2026-04-27', '2026-05-03')).toEqual(
      [projectRecords[0], projectRecords[1]],
    )
    expect(getRecordDurationTotal(projectRecords)).toBe(90)
  })

  it('finds the active weekly plan and prefers a project prompt over global', () => {
    const weeklyPlans: WeeklyPlan[] = [
      plan('previous', 'project-1', '2026-04-20', '2026-04-26'),
      plan('current', 'project-1', '2026-04-27', '2026-05-03'),
    ]
    const prompts: PromptTemplate[] = [
      prompt('global', 'global'),
      prompt('project', 'project', 'project-1'),
    ]

    expect(
      findCurrentWeeklyPlan(
        weeklyPlans,
        'project-1',
        '2026-04-27',
        '2026-05-03',
      )?.id,
    ).toBe('current')
    expect(findProjectPrompt(prompts, 'project-1')?.id).toBe('project')
    expect(findProjectPrompt(prompts, 'project-2')?.id).toBe('global')
  })
})

function record(
  id: string,
  projectId: string,
  date: string,
  durationMinutes: number,
): LabourRecord {
  return {
    id,
    projectId,
    date,
    durationMinutes,
    content: id,
    createdAt: `${date}T00:00:00.000Z`,
    updatedAt: `${date}T00:00:00.000Z`,
  }
}

function plan(
  id: string,
  projectId: string,
  weekStart: string,
  weekEnd: string,
): WeeklyPlan {
  return {
    id,
    projectId,
    weekStart,
    weekEnd,
    planText: id,
    createdAt: `${weekStart}T00:00:00.000Z`,
    updatedAt: `${weekStart}T00:00:00.000Z`,
  }
}

function prompt(
  id: string,
  scope: PromptTemplate['scope'],
  projectId?: string,
): PromptTemplate {
  return {
    id,
    scope,
    projectId,
    name: id,
    content: id,
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
  }
}
