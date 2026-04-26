import { formatMinutes } from '../../lib/date'
import type { Project, ProjectStats } from '../../types/domain'

export function ProjectCard({
  project,
  stats,
  onOpen,
}: {
  project: Project
  stats: ProjectStats
  onOpen?: () => void
}) {
  return (
    <article className="rounded-md border border-teal-100 bg-teal-50/35 p-4 text-left shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 border-l-2 border-teal-600 pl-3">
          <h3 className="truncate text-base font-semibold text-stone-950">
            {project.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-stone-500">
            {project.description || '还没有项目说明'}
          </p>
        </div>
        {project.isArchived && (
          <span className="rounded-full bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-500">
            已归档
          </span>
        )}
      </div>
      <p className="mt-3 rounded-md bg-white/65 px-3 py-2 text-sm leading-6 text-stone-700">
        {stats.recentProgress}
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-stone-600">
        <span className="rounded-full bg-white/70 px-2.5 py-1">
          {stats.recordCount} 条记录
        </span>
        <span className="rounded-full bg-white/70 px-2.5 py-1">
          本周 {formatMinutes(stats.thisWeekDurationMinutes)}
        </span>
      </div>
      {onOpen && (
        <button
          className="mt-3 h-10 w-full rounded-md bg-teal-700 px-3 text-sm font-semibold text-white transition hover:bg-teal-800"
          type="button"
          onClick={onOpen}
        >
          查看项目
        </button>
      )}
    </article>
  )
}
