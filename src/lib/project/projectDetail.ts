import type {
  LabourRecord,
  Project,
  PromptTemplate,
  WeeklyPlan,
} from '../../types/domain'
import { backlogItemsFromText } from './backlog'

export type ProjectSectionId =
  | 'summary'
  | 'direction'
  | 'hypothesis'
  | 'completionCriteria'
  | 'backlog'

export type DetailPanelId = 'archive' | 'activity' | 'data'

export interface ProjectDraft {
  title: string
  description: string
  direction: string
  hypothesis: string
  completionCriteria: string
  backlogText: string
}

export const detailPanels: Array<{ id: DetailPanelId; labelKey: string }> = [
  { id: 'archive', labelKey: 'projectDetail.archive' },
  { id: 'activity', labelKey: 'projectDetail.activity' },
  { id: 'data', labelKey: 'projectDetail.data' },
]

export function toProjectDraft(project: Project): ProjectDraft {
  return {
    title: project.title,
    description: project.description ?? '',
    direction: project.direction ?? '',
    hypothesis: project.hypothesis ?? '',
    completionCriteria: project.completionCriteria ?? '',
    backlogText: project.backlogText ?? (project.backlog ?? []).join('\n'),
  }
}

export function projectUpdatesFromDraft(
  sectionId: ProjectSectionId,
  draft: ProjectDraft,
  fallbackTitle = '未命名项目'
): Partial<Project> {
  if (sectionId === 'summary') {
    return {
      title: draft.title.trim() || fallbackTitle,
      description: draft.description,
    }
  }

  if (sectionId === 'direction') return { direction: draft.direction }
  if (sectionId === 'hypothesis') return { hypothesis: draft.hypothesis }
  if (sectionId === 'completionCriteria') {
    return { completionCriteria: draft.completionCriteria }
  }

  return {
    backlogText: draft.backlogText,
    backlog: backlogItemsFromText(draft.backlogText),
  }
}

export function getProjectRecords(
  records: LabourRecord[],
  projectId: string
) {
  return records
    .filter((record) => record.projectId === projectId)
    .sort((left, right) => right.date.localeCompare(left.date))
}

export function getRecordsInWeek(
  records: LabourRecord[],
  weekStart: string,
  weekEnd: string
) {
  return records.filter(
    (record) => record.date >= weekStart && record.date <= weekEnd
  )
}

export function getRecordDurationTotal(records: LabourRecord[]) {
  return records.reduce((total, record) => total + record.durationMinutes, 0)
}

export function findCurrentWeeklyPlan(
  weeklyPlans: WeeklyPlan[],
  projectId: string,
  weekStart: string,
  weekEnd: string
) {
  return weeklyPlans.find(
    (plan) =>
      plan.projectId === projectId &&
      plan.weekStart === weekStart &&
      plan.weekEnd === weekEnd
  )
}

export function findProjectPrompt(
  promptTemplates: PromptTemplate[],
  projectId: string
) {
  return (
    promptTemplates.find((prompt) => prompt.projectId === projectId) ??
    promptTemplates.find((prompt) => prompt.scope === 'global')
  )
}
