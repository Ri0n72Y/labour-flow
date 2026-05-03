import { DocumentArrowUpIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ProjectCard } from '../components/project/ProjectCard'
import { ProjectMarkdownImport } from '../components/project/MarkdownImportExport'
import { useLabourStore } from '../store/useLabourStore'

export function ProjectsPage({
  onOpenProject,
}: {
  onOpenProject: (projectId: string) => void
}) {
  const { t } = useTranslation()
  const projects = useLabourStore((state) => state.projects)
  const createProject = useLabourStore((state) => state.createProject)
  const importMarkdownProject = useLabourStore(
    (state) => state.importMarkdownProject
  )
  const lastImportError = useLabourStore((state) => state.lastImportError)
  const computeProjectStats = useLabourStore(
    (state) => state.computeProjectStats
  )
  const [showImport, setShowImport] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const activeProjects = projects.filter((project) => !project.isArchived)
  const archivedProjects = projects.filter((project) => project.isArchived)

  const handleCreate = () => {
    const project = createProject({
      title: '新的劳动项目',
      description: '项目说明',
      backlog: [],
    })
    onOpenProject(project.id)
  }

  return (
    <div className="space-y-4 text-left">
      <section className="grid grid-cols-2 gap-2">
        <button
          className="flex h-11 items-center justify-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white"
          type="button"
          onClick={handleCreate}
        >
          <PlusIcon className="h-5 w-5" />
          {t('projects.create')}
        </button>
        <button
          className="flex h-11 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-stone-700 shadow-sm ring-1 ring-stone-200"
          type="button"
          onClick={() => setShowImport((current) => !current)}
        >
          <DocumentArrowUpIcon className="h-5 w-5" />
          {t('projects.import')}
        </button>
      </section>

      {showImport ? (
        <ProjectMarkdownImport
          importError={lastImportError}
          onImport={(markdown) => {
            const project = importMarkdownProject(markdown)
            if (!project) return false
            onOpenProject(project.id)
            return true
          }}
        />
      ) : null}

      {activeProjects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          stats={computeProjectStats(project.id)}
          onOpen={() => onOpenProject(project.id)}
        />
      ))}

      {archivedProjects.length ? (
        <section className="space-y-3">
          <button
            className="flex h-10 w-full items-center justify-center rounded-md bg-stone-100 px-3 text-sm font-semibold text-stone-600"
            type="button"
            onClick={() => setShowArchived((current) => !current)}
          >
            {showArchived
              ? t('projects.hideArchived')
              : t('projects.showArchived', { count: archivedProjects.length })}
          </button>
          {showArchived
            ? archivedProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  stats={computeProjectStats(project.id)}
                  onOpen={() => onOpenProject(project.id)}
                />
              ))
            : null}
        </section>
      ) : null}
    </div>
  )
}
