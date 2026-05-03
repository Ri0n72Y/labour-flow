import { useTranslation } from 'react-i18next'
import type { Project } from '../../types/domain'

export function ProjectDocumentPreview({
  markdown,
  project,
}: {
  markdown: string
  project: Project
}) {
  const { t } = useTranslation()

  return (
    <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-stone-950">
        {t('projectDocument.title')}
      </h2>
      <p className="mt-1 text-xs text-stone-500">
        {t('projectDocument.subtitle')}
      </p>
      <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-md bg-stone-950 p-3 text-xs leading-5 text-stone-100">
        {markdown || `# ${project.title}`}
      </pre>
    </section>
  )
}
