import { ArchiveBoxIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { ProjectCard } from '../components/project/ProjectCard'
import { useLabourStore } from '../store/useLabourStore'

export function ProjectsPage({
  onOpenProject,
}: {
  onOpenProject: (projectId: string) => void
}) {
  const projects = useLabourStore((state) => state.projects)
  const createProject = useLabourStore((state) => state.createProject)
  const updateProject = useLabourStore((state) => state.updateProject)
  const archiveProject = useLabourStore((state) => state.archiveProject)
  const computeProjectStats = useLabourStore((state) => state.computeProjectStats)
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleCreate = () => {
    const project = createProject({
      title: '新的劳动项目',
      description: '项目说明',
      backlog: [],
    })
    setEditingId(project.id)
  }

  return (
    <div className="space-y-4 text-left">
      <button
        className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white"
        type="button"
        onClick={handleCreate}
      >
        <PlusIcon className="h-5 w-5" />
        新建项目
      </button>

      {projects.map((project) =>
        editingId === project.id ? (
          <section
            key={project.id}
            className="rounded-md border border-stone-200 bg-white p-4 shadow-sm"
          >
            <input
              className="input"
              value={project.title}
              onChange={(event) => updateProject(project.id, { title: event.target.value })}
            />
            <textarea
              className="input mt-3 min-h-20 resize-y"
              value={project.description ?? ''}
              placeholder="项目描述"
              onChange={(event) =>
                updateProject(project.id, { description: event.target.value })
              }
            />
            <textarea
              className="input mt-3 min-h-20 resize-y"
              value={project.direction ?? ''}
              placeholder="项目方向"
              onChange={(event) =>
                updateProject(project.id, { direction: event.target.value })
              }
            />
            <textarea
              className="input mt-3 min-h-20 resize-y"
              value={project.hypothesis ?? ''}
              placeholder="当前假设"
              onChange={(event) =>
                updateProject(project.id, { hypothesis: event.target.value })
              }
            />
            <textarea
              className="input mt-3 min-h-20 resize-y"
              value={project.completionCriteria ?? ''}
              placeholder="完成标准"
              onChange={(event) =>
                updateProject(project.id, {
                  completionCriteria: event.target.value,
                })
              }
            />
            <textarea
              className="input mt-3 min-h-20 resize-y"
              value={(project.backlog ?? []).join('\n')}
              placeholder="待办池，每行一个"
              onChange={(event) =>
                updateProject(project.id, {
                  backlog: event.target.value
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean),
                })
              }
            />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                className="h-10 rounded-md bg-teal-700 px-3 text-sm font-semibold text-white"
                type="button"
                onClick={() => setEditingId(null)}
              >
                完成
              </button>
              <button
                className="flex h-10 items-center justify-center gap-2 rounded-md bg-stone-100 px-3 text-sm font-semibold text-stone-700"
                type="button"
                onClick={() => archiveProject(project.id)}
              >
                <ArchiveBoxIcon className="h-4 w-4" />
                归档
              </button>
            </div>
          </section>
        ) : (
          <div key={project.id} className="space-y-2">
            <ProjectCard
              project={project}
              stats={computeProjectStats(project.id)}
              onOpen={() => onOpenProject(project.id)}
            />
            <button
              className="h-9 w-full rounded-md bg-white px-3 text-sm font-semibold text-stone-600"
              type="button"
              onClick={() => setEditingId(project.id)}
            >
              编辑方向 / 假设 / 待办池
            </button>
          </div>
        ),
      )}
    </div>
  )
}
