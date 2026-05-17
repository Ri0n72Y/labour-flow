import type { LabourRecord, Project } from '../../types/domain'

export interface LabourRecordThread {
  root: LabourRecord
  latest: LabourRecord
  history: LabourRecord[]
}

export function getProjectTitle(projects: Project[], projectId: string) {
  return projects.find((project) => project.id === projectId)?.title ?? '未归档项目'
}

export function groupLabourRecordThreads(records: LabourRecord[]) {
  const roots = records.filter((record) => !record.patchOf)
  return roots
    .map((root): LabourRecordThread => {
      const patches = records
        .filter((record) => record.patchOf === root.id)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      return {
        root,
        latest: patches[0] ?? root,
        history: [root, ...patches].sort((left, right) =>
          left.createdAt.localeCompare(right.createdAt),
        ),
      }
    })
    .sort((left, right) => right.latest.createdAt.localeCompare(left.latest.createdAt))
}

export function dailyProjectCardKey(record: LabourRecord) {
  return `${record.date}:${record.projectId}`
}
