import {
  Dialog,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react'
import {
  ArchiveBoxIcon,
  ArrowLeftIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  SparklesIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { type ReactNode, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  HeadlessTextInput,
  HeadlessTextarea,
} from '../components/forms/HeadlessFields'
import { ProjectMarkdownExport } from '../components/project/MarkdownImportExport'
import { ProjectDocumentPreview } from '../components/project/ProjectDocumentPreview'
import { PromptEditor } from '../components/prompt/PromptEditor'
import { generateWeeklySnapshot } from '../lib/ai/generateWeeklySnapshot'
import { formatMinutes, getWeekRange } from '../lib/date'
import { cn } from '../lib/styles/cn'
import { useLabourStore } from '../store/useLabourStore'
import type { Project } from '../types/domain'

type ProjectSectionId =
  | 'summary'
  | 'direction'
  | 'hypothesis'
  | 'completionCriteria'
  | 'backlog'
type DetailPanelId = 'archive' | 'activity' | 'data'

const detailPanels: Array<{ id: DetailPanelId; labelKey: string }> = [
  { id: 'archive', labelKey: 'projectDetail.archive' },
  { id: 'activity', labelKey: 'projectDetail.activity' },
  { id: 'data', labelKey: 'projectDetail.data' },
]

interface ProjectDraft {
  title: string
  description: string
  direction: string
  hypothesis: string
  completionCriteria: string
  backlogText: string
}

function toProjectDraft(project: Project): ProjectDraft {
  return {
    title: project.title,
    description: project.description ?? '',
    direction: project.direction ?? '',
    hypothesis: project.hypothesis ?? '',
    completionCriteria: project.completionCriteria ?? '',
    backlogText: project.backlogText ?? (project.backlog ?? []).join('\n'),
  }
}

function ValueText({ fallback, value }: { fallback: string; value?: string }) {
  const hasValue = Boolean(value?.trim())

  return (
    <p
      className={cn(
        'whitespace-pre-wrap text-sm leading-6',
        hasValue ? 'text-stone-700' : 'text-stone-400'
      )}
    >
      {hasValue ? value : fallback}
    </p>
  )
}

function EditableProjectSection({
  children,
  editing,
  editor,
  id,
  onCancel,
  onEdit,
  onSave,
  onSelect,
  readOnly = false,
  selected,
  subtitle,
  title,
}: {
  children: ReactNode
  editing: boolean
  editor: ReactNode
  id: ProjectSectionId
  onCancel: () => void
  onEdit: (sectionId: ProjectSectionId) => void
  onSave: (sectionId: ProjectSectionId) => void
  onSelect: (sectionId: ProjectSectionId) => void
  readOnly?: boolean
  selected: boolean
  subtitle?: string
  title: string
}) {
  const { t } = useTranslation()

  return (
    <>
      <section
        className={cn(
          'rounded-md border bg-white p-4 text-left shadow-sm transition',
          selected
            ? 'border-teal-500 ring-2 ring-teal-600/20'
            : 'border-stone-200'
        )}
        tabIndex={0}
        onClick={() => onSelect(id)}
        onKeyDown={(event) => {
          if (event.currentTarget !== event.target) return
          if (event.key !== 'Enter' && event.key !== ' ') return
          event.preventDefault()
          onSelect(id)
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-stone-950">{title}</h2>
            {subtitle && (
              <p className="mt-1 text-xs leading-5 text-stone-500">{subtitle}</p>
            )}
          </div>
          <div className="flex h-9 w-9 shrink-0 justify-end">
            {!readOnly && (selected || editing) ? (
              <button
                aria-label={t('common.editSection', { title })}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-stone-950 text-white transition hover:bg-stone-800"
                title={t('common.editSection', { title })}
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onEdit(id)
                }}
              >
                <PencilSquareIcon className="h-5 w-5" />
              </button>
            ) : null}
          </div>
        </div>
        <div className="mt-3 max-h-56 overflow-auto pr-1">{children}</div>
      </section>

      <Dialog className="relative z-50" open={editing} onClose={onCancel}>
        <div className="fixed inset-0 bg-stone-950/35" aria-hidden="true" />
        <div className="fixed inset-0 flex items-end justify-center p-3 sm:items-center">
          <DialogPanel className="w-full max-w-2xl rounded-md bg-white p-4 text-left shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <DialogTitle className="text-base font-semibold text-stone-950">
                {title}
              </DialogTitle>
              <button
                aria-label={t('common.cancelSection', { title })}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-stone-100 text-stone-600 transition hover:bg-stone-200"
                title={t('common.cancelSection', { title })}
                type="button"
                onClick={onCancel}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 max-h-[68vh] overflow-auto pr-1">{editor}</div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-teal-700 px-3 text-sm font-semibold text-white transition hover:bg-teal-800"
                type="button"
                onClick={() => onSave(id)}
              >
                <CheckIcon className="h-5 w-5" />
                {t('common.save')}
              </button>
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-stone-100 px-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-200"
                type="button"
                onClick={onCancel}
              >
                <XMarkIcon className="h-5 w-5" />
                {t('common.cancel')}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  )
}

export function ProjectDetailPage({
  projectId,
  onBack,
}: {
  projectId: string
  onBack: () => void
}) {
  const { t } = useTranslation()
  const project = useLabourStore((state) =>
    state.projects.find((item) => item.id === projectId)
  )

  if (!project) {
    return (
      <div className="space-y-4 text-left">
        <button className="small-button" type="button" onClick={onBack}>
          <ArrowLeftIcon className="h-4 w-4" />
          {t('projectDetail.backToProjects')}
        </button>
        <p className="rounded-md bg-white p-4 text-sm text-stone-500">
          {t('projectDetail.noProject')}
        </p>
      </div>
    )
  }

  return (
    <ProjectDetailContent key={project.id} project={project} onBack={onBack} />
  )
}

function ProjectDetailContent({
  project,
  onBack,
}: {
  project: Project
  onBack: () => void
}) {
  const { t } = useTranslation()
  const projectId = project.id
  const records = useLabourStore((state) => state.labourRecords)
  const weeklyPlans = useLabourStore((state) => state.weeklyPlans)
  const weeklySnapshots = useLabourStore((state) => state.weeklySnapshots)
  const promptTemplates = useLabourStore((state) => state.promptTemplates)
  const addWeeklyPlan = useLabourStore((state) => state.addWeeklyPlan)
  const updateWeeklyPlan = useLabourStore((state) => state.updateWeeklyPlan)
  const addWeeklySnapshot = useLabourStore((state) => state.addWeeklySnapshot)
  const upsertPromptTemplate = useLabourStore(
    (state) => state.upsertPromptTemplate
  )
  const updateProject = useLabourStore((state) => state.updateProject)
  const archiveProject = useLabourStore((state) => state.archiveProject)
  const deleteProject = useLabourStore((state) => state.deleteProject)
  const exportMarkdown = useLabourStore(
    (state) => state.exportProjectToMarkdown
  )
  const [activePanel, setActivePanel] = useState<DetailPanelId>('archive')
  const [generating, setGenerating] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedSection, setSelectedSection] =
    useState<ProjectSectionId | null>(null)
  const [editingSection, setEditingSection] = useState<ProjectSectionId | null>(
    null
  )
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [draft, setDraft] = useState<ProjectDraft>(() =>
    toProjectDraft(project)
  )

  const { weekStart, weekEnd } = getWeekRange()
  const projectRecords = useMemo(
    () =>
      records
        .filter((record) => record.projectId === projectId)
        .sort((left, right) => right.date.localeCompare(left.date)),
    [projectId, records]
  )
  const currentWeekRecords = projectRecords.filter(
    (record) => record.date >= weekStart && record.date <= weekEnd
  )
  const currentPlan = weeklyPlans.find(
    (plan) =>
      plan.projectId === projectId &&
      plan.weekStart === weekStart &&
      plan.weekEnd === weekEnd
  )
  const projectPrompt =
    promptTemplates.find((prompt) => prompt.projectId === projectId) ??
    promptTemplates.find((prompt) => prompt.scope === 'global')
  const markdown = exportMarkdown(project.id)
  const isArchived = Boolean(project.isArchived)
  const canDeleteProject = projectRecords.length === 0

  const handleSelectSection = (sectionId: ProjectSectionId) => {
    if (editingSection && editingSection !== sectionId) return
    setSelectedSection(sectionId)
  }

  const beginEditSection = (sectionId: ProjectSectionId) => {
    if (isArchived) return
    setSelectedSection(sectionId)
    setDraft(toProjectDraft(project))
    setEditingSection(sectionId)
  }

  const cancelEditSection = () => {
    setDraft(toProjectDraft(project))
    setEditingSection(null)
  }

  const saveProjectSection = (sectionId: ProjectSectionId) => {
    if (isArchived) return
    const updates: Partial<Project> = {}

    if (sectionId === 'summary') {
      updates.title = draft.title.trim() || '未命名项目'
      updates.description = draft.description
    }

    if (sectionId === 'direction') {
      updates.direction = draft.direction
    }

    if (sectionId === 'hypothesis') {
      updates.hypothesis = draft.hypothesis
    }

    if (sectionId === 'completionCriteria') {
      updates.completionCriteria = draft.completionCriteria
    }

    if (sectionId === 'backlog') {
      updates.backlogText = draft.backlogText
      updates.backlog = draft.backlogText
        .split('\n')
        .map((line) =>
          line
            .trim()
            .replace(/^\s*(?:[-*+]\s+|\d+[.)]\s+)/, '')
            .replace(/^\[[ xX]\]\s+/, '')
            .trim()
        )
        .filter((line) => line && !line.startsWith('#'))
    }

    updateProject(project.id, updates)
    setDraft(toProjectDraft({ ...project, ...updates }))
    setSelectedSection(sectionId)
    setEditingSection(null)
  }

  const savePlan = (planText: string) => {
    if (isArchived) return
    if (currentPlan) {
      updateWeeklyPlan(currentPlan.id, { planText })
      return
    }
    addWeeklyPlan({ projectId, weekStart, weekEnd, planText })
  }

  const handleArchiveProject = () => {
    archiveProject(project.id)
    onBack()
  }

  const handleDeleteProject = () => {
    if (!deleteProject(project.id)) return
    setConfirmingDelete(false)
    onBack()
  }

  const handleGenerateSnapshot = async () => {
    if (isArchived) return
    setGenerating(true)
    setMessage('')
    try {
      const content = await generateWeeklySnapshot({
        project,
        records: currentWeekRecords,
        weeklyPlan: currentPlan,
        prompt: projectPrompt?.content ?? '',
      })
      addWeeklySnapshot({
        projectId,
        weekStart,
        weekEnd,
        prompt: projectPrompt?.content ?? '',
        content,
        generatedAt: new Date().toISOString(),
      })
      setMessage(t('projectDetail.generated'))
    } finally {
      setGenerating(false)
    }
  }

  const sectionState = (sectionId: ProjectSectionId) => ({
    editing: editingSection === sectionId,
    selected: selectedSection === sectionId || editingSection === sectionId,
  })

  return (
    <div className="space-y-4 text-left">
      <button className="small-button" type="button" onClick={onBack}>
        <ArrowLeftIcon className="h-4 w-4" />
        {t('projectDetail.backToProjects')}
      </button>

      <div className="grid grid-cols-3 gap-2 rounded-md bg-stone-100 p-1">
        {detailPanels.map((panel) => (
          <button
            key={panel.id}
            className={cn(
              'h-9 rounded-md text-sm font-semibold transition',
              activePanel === panel.id
                ? 'bg-white text-stone-950 shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            )}
            type="button"
            onClick={() => setActivePanel(panel.id)}
          >
            {t(panel.labelKey)}
          </button>
        ))}
      </div>

      {activePanel === 'archive' ? (
        <>
          <EditableProjectSection
            id="summary"
            title={t('projectDetail.summary')}
            subtitle={t('projectDetail.summarySubtitle')}
            onCancel={cancelEditSection}
            onEdit={beginEditSection}
            onSave={saveProjectSection}
            onSelect={handleSelectSection}
            readOnly={isArchived}
            {...sectionState('summary')}
            editor={
              <div className="space-y-3">
                <label className="block">
                  <span className="text-xs font-semibold text-stone-500">
                    {t('projectDetail.title')}
                  </span>
                  <HeadlessTextInput
                    className="input mt-1"
                    value={draft.title}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-stone-500">
                    {t('projectDetail.description')}
                  </span>
                  <HeadlessTextarea
                    className="input mt-1 min-h-24 resize-y"
                    placeholder={t('projectDetail.descriptionPlaceholder')}
                    value={draft.description}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                  />
                </label>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-md bg-stone-50 p-3">
                    <p className="text-xs text-stone-500">
                      {t('projectDetail.thisWeekDuration')}
                    </p>
                    <p className="mt-1 font-semibold text-stone-950">
                      {formatMinutes(
                        currentWeekRecords.reduce(
                          (total, record) => total + record.durationMinutes,
                          0
                        )
                      )}
                    </p>
                  </div>
                  <div className="rounded-md bg-stone-50 p-3">
                    <p className="text-xs text-stone-500">
                      {t('projectDetail.recordCount')}
                    </p>
                    <p className="mt-1 font-semibold text-stone-950">
                      {t('common.recordsCount', { count: projectRecords.length })}
                    </p>
                  </div>
                </div>
              </div>
            }
          >
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-stone-500">
                  {t('projectDetail.title')}
                </p>
                <h3 className="mt-1 text-xl font-semibold text-stone-950">
                  {project.title}
                </h3>
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-500">
                  {t('projectDetail.description')}
                </p>
                <ValueText
                  fallback={t('projectDetail.descriptionEmpty')}
                  value={project.description}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md bg-stone-50 p-3">
                  <p className="text-xs text-stone-500">
                    {t('projectDetail.thisWeekDuration')}
                  </p>
                  <p className="mt-1 font-semibold text-stone-950">
                    {formatMinutes(
                      currentWeekRecords.reduce(
                        (total, record) => total + record.durationMinutes,
                        0
                      )
                    )}
                  </p>
                </div>
                <div className="rounded-md bg-stone-50 p-3">
                  <p className="text-xs text-stone-500">
                    {t('projectDetail.recordCount')}
                  </p>
                  <p className="mt-1 font-semibold text-stone-950">
                    {t('common.recordsCount', { count: projectRecords.length })}
                  </p>
                </div>
              </div>
              {project.isArchived && (
                <span className="inline-flex rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-500">
                  {t('common.archived')}
                </span>
              )}
            </div>
          </EditableProjectSection>

          <EditableProjectSection
            id="direction"
            title={t('projectDetail.direction')}
            subtitle={t('projectDetail.directionSubtitle')}
            onCancel={cancelEditSection}
            onEdit={beginEditSection}
            onSave={saveProjectSection}
            onSelect={handleSelectSection}
            readOnly={isArchived}
            {...sectionState('direction')}
            editor={
              <HeadlessTextarea
                className="input min-h-28 resize-y"
                placeholder={t('projectDetail.directionPlaceholder')}
                value={draft.direction}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    direction: event.target.value,
                  }))
                }
              />
            }
          >
            <ValueText
              fallback={t('projectDetail.directionEmpty')}
              value={project.direction}
            />
          </EditableProjectSection>

          <EditableProjectSection
            id="hypothesis"
            title={t('projectDetail.hypothesis')}
            subtitle={t('projectDetail.hypothesisSubtitle')}
            onCancel={cancelEditSection}
            onEdit={beginEditSection}
            onSave={saveProjectSection}
            onSelect={handleSelectSection}
            readOnly={isArchived}
            {...sectionState('hypothesis')}
            editor={
              <HeadlessTextarea
                className="input min-h-28 resize-y"
                placeholder={t('projectDetail.hypothesisPlaceholder')}
                value={draft.hypothesis}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    hypothesis: event.target.value,
                  }))
                }
              />
            }
          >
            <ValueText
              fallback={t('projectDetail.hypothesisEmpty')}
              value={project.hypothesis}
            />
          </EditableProjectSection>

          <EditableProjectSection
            id="completionCriteria"
            title={t('projectDetail.completionCriteria')}
            subtitle={t('projectDetail.completionCriteriaSubtitle')}
            onCancel={cancelEditSection}
            onEdit={beginEditSection}
            onSave={saveProjectSection}
            onSelect={handleSelectSection}
            readOnly={isArchived}
            {...sectionState('completionCriteria')}
            editor={
              <HeadlessTextarea
                className="input min-h-28 resize-y"
                placeholder={t('projectDetail.completionCriteria')}
                value={draft.completionCriteria}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    completionCriteria: event.target.value,
                  }))
                }
              />
            }
          >
            <ValueText
              fallback={t('projectDetail.completionCriteriaEmpty')}
              value={project.completionCriteria}
            />
          </EditableProjectSection>

          <EditableProjectSection
            id="backlog"
            title={t('projectDetail.backlog')}
            subtitle={t('projectDetail.backlogSubtitle')}
            onCancel={cancelEditSection}
            onEdit={beginEditSection}
            onSave={saveProjectSection}
            onSelect={handleSelectSection}
            readOnly={isArchived}
            {...sectionState('backlog')}
            editor={
              <HeadlessTextarea
                className="input min-h-32 resize-y"
                placeholder={t('projectDetail.backlogPlaceholder')}
                value={draft.backlogText}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    backlogText: event.target.value,
                  }))
                }
              />
            }
          >
            {project.backlogText?.trim() || project.backlog?.length ? (
              project.backlogText?.trim() ? (
                <pre className="whitespace-pre-wrap text-sm leading-6 text-stone-700">
                  {project.backlogText}
                </pre>
              ) : (
                <ul className="space-y-2 text-sm text-stone-700">
                  {(project.backlog ?? []).map((item) => (
                    <li key={item} className="rounded-md bg-stone-50 px-3 py-2">
                      {item}
                    </li>
                  ))}
                </ul>
              )
            ) : (
              <p className="text-sm text-stone-400">
                {t('projectDetail.backlogEmpty')}
              </p>
            )}
          </EditableProjectSection>

          {!isArchived && (
            <div className="grid grid-cols-2 gap-2">
              <button
                className="flex h-10 items-center justify-center gap-2 rounded-md bg-stone-100 px-3 text-sm font-semibold text-stone-700"
                type="button"
                onClick={handleArchiveProject}
              >
                <ArchiveBoxIcon className="h-4 w-4" />
                {t('projectDetail.archiveProject')}
              </button>
              {canDeleteProject ? (
                <button
                  className="flex h-10 items-center justify-center gap-2 rounded-md bg-red-600 px-3 text-sm font-semibold text-white"
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                >
                  <TrashIcon className="h-4 w-4" />
                  {t('projectDetail.deleteProject')}
                </button>
              ) : null}
            </div>
          )}
        </>
      ) : null}

      {activePanel === 'activity' ? (
        <>
          {!isArchived ? (
            <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
              <h2 className="text-base font-semibold text-stone-950">
                {t('projectDetail.weekPlan')}
              </h2>
              <HeadlessTextarea
                className="input mt-3 min-h-28 resize-y"
                value={currentPlan?.planText ?? ''}
                placeholder={t('projectDetail.weekPlanPlaceholder')}
                onChange={(event) => savePlan(event.target.value)}
              />
            </section>
          ) : currentPlan?.planText ? (
            <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
              <h2 className="text-base font-semibold text-stone-950">
                {t('projectDetail.weekPlan')}
              </h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-stone-700">
                {currentPlan.planText}
              </p>
            </section>
          ) : null}

          <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-stone-950">
              {t('projectDetail.projectLog')}
            </h2>
            <div className="mt-3 space-y-3">
              {projectRecords.length === 0 ? (
                <p className="text-sm text-stone-500">
                  {t('projectDetail.noRecords')}
                </p>
              ) : (
                projectRecords.map((record) => (
                  <article
                    key={record.id}
                    className="rounded-md bg-stone-50 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-stone-950">
                        {record.date}
                      </span>
                      <span className="text-xs text-stone-500">
                        {formatMinutes(record.durationMinutes)}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-stone-700">
                      {record.content}
                    </p>
                  </article>
                ))
              )}
            </div>
          </section>

          {!isArchived ? (
            <PromptEditor
              prompt={projectPrompt}
              onSave={(content) =>
                upsertPromptTemplate({
                  id: projectPrompt?.projectId ? projectPrompt.id : undefined,
                  name: `${project.title} 周总结提示词`,
                  scope: 'project',
                  projectId,
                  content,
                })
              }
            />
          ) : null}

          <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-stone-950">
                {t('projectDetail.weeklySnapshot')}
              </h2>
              {!isArchived ? (
                <button
                  className="flex h-9 items-center gap-2 rounded-md bg-teal-700 px-3 text-sm font-semibold text-white disabled:bg-stone-300"
                  disabled={generating}
                  type="button"
                  onClick={handleGenerateSnapshot}
                >
                  <SparklesIcon className="h-4 w-4" />
                  {generating
                    ? t('projectDetail.generating')
                    : t('projectDetail.localGenerate')}
                </button>
              ) : null}
            </div>
            <div className="mt-3 space-y-3">
              {weeklySnapshots
                .filter((snapshot) => snapshot.projectId === projectId)
                .map((snapshot) => (
                  <article
                    key={snapshot.id}
                    className="rounded-md bg-stone-50 p-3"
                  >
                    <p className="text-xs font-semibold text-stone-500">
                      {snapshot.weekStart} ~ {snapshot.weekEnd}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-stone-700">
                      {snapshot.content}
                    </p>
                  </article>
                ))}
            </div>
            {message && (
              <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {message}
              </p>
            )}
          </section>
        </>
      ) : null}

      {activePanel === 'data' ? (
        <>
          <ProjectDocumentPreview project={project} markdown={markdown} />
          <ProjectMarkdownExport
            markdown={markdown}
            projectTitle={project.title}
          />
        </>
      ) : null}

      <Dialog
        className="relative z-50"
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
      >
        <div className="fixed inset-0 bg-stone-950/35" aria-hidden="true" />
        <div className="fixed inset-0 flex items-end justify-center p-3 sm:items-center">
          <DialogPanel className="w-full max-w-md rounded-md bg-white p-4 text-left shadow-xl">
            <div className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-700">
                <ExclamationTriangleIcon className="h-6 w-6" />
              </span>
              <div>
                <DialogTitle className="text-base font-semibold text-stone-950">
                  {t('projectDetail.deleteConfirmTitle')}
                </DialogTitle>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  {t('projectDetail.deleteConfirmBody', {
                    title: project.title,
                  })}
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                className="h-10 rounded-md bg-red-600 px-3 text-sm font-semibold text-white"
                type="button"
                onClick={handleDeleteProject}
              >
                {t('projectDetail.confirmDelete')}
              </button>
              <button
                className="h-10 rounded-md bg-stone-100 px-3 text-sm font-semibold text-stone-700"
                type="button"
                onClick={() => setConfirmingDelete(false)}
              >
                {t('common.cancel')}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  )
}
