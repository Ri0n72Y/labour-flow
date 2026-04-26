import { PlusIcon } from '@heroicons/react/24/outline'
import type { Project } from '../../types/domain'

export function ProjectSelector({
  projects,
  selectedProjectId,
  onChange,
  onCreate,
}: {
  projects: Project[]
  selectedProjectId: string
  onChange: (projectId: string) => void
  onCreate: () => void
}) {
  return (
    <section className="grid grid-cols-[1fr_auto] gap-2 text-left">
      <select
        className="input"
        value={selectedProjectId}
        onChange={(event) => onChange(event.target.value)}
        aria-label="选择项目"
      >
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.title}
          </option>
        ))}
      </select>
      <button
        className="icon-button bg-stone-100 text-stone-700"
        type="button"
        onClick={onCreate}
        aria-label="新建项目"
      >
        <PlusIcon className="h-5 w-5" />
      </button>
    </section>
  )
}
