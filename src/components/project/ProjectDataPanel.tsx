import type { Project } from '../../types/domain'
import { ProjectMarkdownExport } from './MarkdownImportExport'
import { ProjectDocumentPreview } from './ProjectDocumentPreview'

export function ProjectDataPanel({
  markdown,
  project,
}: {
  markdown: string
  project: Project
}) {
  return (
    <>
      <ProjectDocumentPreview project={project} markdown={markdown} />
      <ProjectMarkdownExport markdown={markdown} projectTitle={project.title} />
    </>
  )
}
