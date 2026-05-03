import { beforeEach, describe, expect, it } from 'vitest'
import { useLabourStore } from '../../src/store/useLabourStore'
import { resetStores } from '../test-utils'

describe('useLabourStore', () => {
  beforeEach(() => {
    resetStores()
  })

  it('creates, updates, and archives projects', () => {
    const created = useLabourStore.getState().createProject({
      title: 'Alpha',
      description: 'Project description',
    })

    expect(useLabourStore.getState().projects[0].id).toBe(created.id)

    useLabourStore.getState().updateProject(created.id, {
      title: 'Alpha v2',
    })
    expect(
      useLabourStore.getState().projects.find((project) => project.id === created.id)
        ?.title,
    ).toBe('Alpha v2')

    useLabourStore.getState().archiveProject(created.id)
    expect(
      useLabourStore.getState().projects.find((project) => project.id === created.id)
        ?.isArchived,
    ).toBe(true)

    useLabourStore.getState().updateProject(created.id, {
      title: 'Archived edit',
    })
    expect(
      useLabourStore.getState().projects.find((project) => project.id === created.id)
        ?.title,
    ).toBe('Alpha v2')
  })

  it('deletes only projects without labour records', () => {
    const emptyProject = useLabourStore.getState().createProject({
      title: 'Empty',
      description: 'Can be deleted',
    })
    const activeProject = useLabourStore.getState().createProject({
      title: 'Active',
      description: 'Has records',
    })

    useLabourStore.getState().addWeeklyPlan({
      projectId: emptyProject.id,
      weekStart: '2026-04-27',
      weekEnd: '2026-05-03',
      planText: '- cleanup',
    })
    useLabourStore.getState().addLabourRecord({
      projectId: activeProject.id,
      date: '2026-04-30',
      content: '- durable record',
      durationMinutes: 30,
    })

    expect(useLabourStore.getState().deleteProject(activeProject.id)).toBe(false)
    expect(
      useLabourStore
        .getState()
        .projects.some((project) => project.id === activeProject.id),
    ).toBe(true)

    expect(useLabourStore.getState().deleteProject(emptyProject.id)).toBe(true)
    expect(
      useLabourStore
        .getState()
        .projects.some((project) => project.id === emptyProject.id),
    ).toBe(false)
    expect(
      useLabourStore
        .getState()
        .weeklyPlans.some((plan) => plan.projectId === emptyProject.id),
    ).toBe(false)
  })

  it('prevents archived projects from receiving labour records', () => {
    const project = useLabourStore.getState().createProject({
      title: 'Archived',
      description: 'No new labour',
    })

    useLabourStore.getState().archiveProject(project.id)

    expect(() =>
      useLabourStore.getState().addLabourRecord({
        projectId: project.id,
        date: '2026-04-30',
        content: '- should not save',
        durationMinutes: 30,
      }),
    ).toThrow('已归档项目不能新增劳动记录。')
  })

  it('tracks labours, computes stats, and supports markdown import/export', () => {
    const project = useLabourStore.getState().createProject({
      title: 'Importable project',
      description: 'Project description',
      direction: 'Direction',
      hypothesis: 'Hypothesis',
      completionCriteria: 'Criteria',
      backlog: ['first task'],
    })

    useLabourStore.getState().addLabourRecord({
      projectId: project.id,
      date: '2026-04-30',
      content: '- first task',
      durationMinutes: 90,
    })

    useLabourStore.getState().addWeeklyPlan({
      projectId: project.id,
      weekStart: '2026-04-27',
      weekEnd: '2026-05-03',
      planText: '- keep going',
    })

    useLabourStore.getState().addWeeklySnapshot({
      projectId: project.id,
      weekStart: '2026-04-27',
      weekEnd: '2026-05-03',
      prompt: 'Summarize',
      content: 'Summary',
    })

    const stats = useLabourStore.getState().computeProjectStats(project.id)
    const userStats = useLabourStore.getState().computeUserStats()

    expect(stats.recordCount).toBe(1)
    expect(stats.totalDurationMinutes).toBe(90)
    expect(userStats.totalDurationMinutes).toBe(90)

    const markdown = useLabourStore.getState().exportProjectToMarkdown(project.id)
    expect(markdown).toContain('first task')
    expect(markdown).toContain('keep going')
    expect(markdown).toContain('Summary')

    const imported = useLabourStore
      .getState()
      .importMarkdownProject(`# Imported project\n> Description\n\n${markdown}`)
    expect(imported?.title).toBe('Imported project')
    expect(useLabourStore.getState().lastImportError).toBeUndefined()
  })
})
