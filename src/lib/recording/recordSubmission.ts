import type { LaborData, LaborDraft } from '../../interfaces'
import type { LabourRecord, Project } from '../../types/domain'
import { createManualRange } from '../../utils/time'
import { descriptionFromLogs, type ListStyle } from './recordFormatting'

type LaborRecordInput = Omit<LabourRecord, 'id' | 'createdAt' | 'updatedAt'>

export function activeProjects(projects: Project[]) {
  return projects.filter((project) => !project.isArchived)
}

export function fallbackProjectId(
  records: LabourRecord[],
  projects: Project[]
) {
  const activeProjectIds = new Set(projects.map((project) => project.id))
  return (
    records.find((record) => activeProjectIds.has(record.projectId))
      ?.projectId ??
    projects[0]?.id ??
    ''
  )
}

export function resolveSelectedProjectId(
  projects: Project[],
  selectedProjectId: string,
  fallbackId: string
) {
  return projects.some((project) => project.id === selectedProjectId)
    ? selectedProjectId
    : fallbackId
}

export function sanitizeTagInput(value: string) {
  return value.trim().replace(/^#/, '')
}

export function canSignDraft({
  activeText,
  hasKeys,
  logs,
  mode,
  status,
}: Pick<LaborDraft, 'activeText' | 'logs' | 'mode' | 'status'> & {
  hasKeys: boolean
}) {
  return (
    hasKeys &&
    (mode === 'manual' || status === 'stopped') &&
    (logs.length > 0 || Boolean(activeText.trim()))
  )
}

export function prepareLaborRecord({
  createAt,
  createBy,
  draft,
  listStyle,
  manualDateValue,
  wid,
}: {
  createAt: string
  createBy: string
  draft: LaborDraft
  listStyle: ListStyle
  manualDateValue: string
  wid: string
}):
  | {
      ok: true
      description: string
      duration: number
      recordBase: Omit<LaborData, 'signature'>
    }
  | { ok: false; reason: 'empty-description' | 'missing-record-input' } {
  const range =
    draft.mode === 'manual'
      ? createManualRange(manualDateValue, draft.manualDurationHours)
      : { startAt: draft.startAt, endAt: draft.endAt }

  if (!range.startAt || !range.endAt || draft.logs.length === 0) {
    return { ok: false, reason: 'missing-record-input' }
  }

  const duration =
    draft.mode === 'manual'
      ? Math.round(draft.manualDurationHours * 3600)
      : Math.max(
          0,
          Math.round(
            (Date.parse(range.endAt) - Date.parse(range.startAt)) / 1000
          ) - (draft.pausedSeconds ?? 0)
        )
  const description = descriptionFromLogs(draft.logs, listStyle)
  if (!description) return { ok: false, reason: 'empty-description' }

  return {
    ok: true,
    description,
    duration,
    recordBase: {
      wid,
      startAt: range.startAt,
      endAt: range.endAt,
      duration,
      createBy,
      createAt,
      outcome: '',
      description,
      tags: draft.tags,
    },
  }
}

export function labourRecordInputFromPrepared({
  date,
  description,
  duration,
  projectId,
}: {
  date: string
  description: string
  duration: number
  projectId: string
}): LaborRecordInput {
  return {
    projectId,
    date,
    content: description,
    durationMinutes: Math.round(duration / 60),
  }
}
