import {
  ArchiveBoxIcon,
  ArrowLeftIcon,
  CheckIcon,
  PencilSquareIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { type ReactNode, useMemo, useState } from 'react'
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

const detailPanels: Array<{ id: DetailPanelId; label: string }> = [
  { id: 'archive', label: '档案' },
  { id: 'activity', label: '推进' },
  { id: 'data', label: '数据' },
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
    backlogText: (project.backlog ?? []).join('\n'),
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
  selected: boolean
  subtitle?: string
  title: string
}) {
  return (
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
        <div className="flex h-9 w-20 shrink-0 justify-end gap-1">
          {editing ? (
            <>
              <button
                aria-label={`保存${title}`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-teal-700 text-white transition hover:bg-teal-800"
                title={`保存${title}`}
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onSave(id)
                }}
              >
                <CheckIcon className="h-5 w-5" />
              </button>
              <button
                aria-label={`放弃${title}`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-stone-100 text-stone-600 transition hover:bg-stone-200"
                title={`放弃${title}`}
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onCancel()
                }}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </>
          ) : selected ? (
            <button
              aria-label={`编辑${title}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-stone-950 text-white transition hover:bg-stone-800"
              title={`编辑${title}`}
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
      <div className="mt-3">{editing ? editor : children}</div>
    </section>
  )
}

export function ProjectDetailPage({
  projectId,
  onBack,
}: {
  projectId: string
  onBack: () => void
}) {
  const project = useLabourStore((state) =>
    state.projects.find((item) => item.id === projectId)
  )

  if (!project) {
    return (
      <div className="space-y-4 text-left">
        <button className="small-button" type="button" onClick={onBack}>
          <ArrowLeftIcon className="h-4 w-4" />
          返回
        </button>
        <p className="rounded-md bg-white p-4 text-sm text-stone-500">
          项目不存在。
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

  const handleSelectSection = (sectionId: ProjectSectionId) => {
    if (editingSection && editingSection !== sectionId) return
    setSelectedSection(sectionId)
  }

  const beginEditSection = (sectionId: ProjectSectionId) => {
    setSelectedSection(sectionId)
    setDraft(toProjectDraft(project))
    setEditingSection(sectionId)
  }

  const cancelEditSection = () => {
    setDraft(toProjectDraft(project))
    setEditingSection(null)
  }

  const saveProjectSection = (sectionId: ProjectSectionId) => {
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
      updates.backlog = draft.backlogText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
    }

    updateProject(project.id, updates)
    setDraft(toProjectDraft({ ...project, ...updates }))
    setSelectedSection(sectionId)
    setEditingSection(null)
  }

  const savePlan = (planText: string) => {
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

  const handleGenerateSnapshot = async () => {
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
      setMessage('已生成本地模拟周小结。')
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
        返回项目档案
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
            {panel.label}
          </button>
        ))}
      </div>

      {activePanel === 'archive' ? (
        <>
          <EditableProjectSection
            id="summary"
            title="项目概览"
            subtitle="点击本节后，可编辑标题和说明。"
            onCancel={cancelEditSection}
            onEdit={beginEditSection}
            onSave={saveProjectSection}
            onSelect={handleSelectSection}
            {...sectionState('summary')}
            editor={
              <div className="space-y-3">
                <label className="block">
                  <span className="text-xs font-semibold text-stone-500">
                    标题
                  </span>
                  <input
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
                    说明
                  </span>
                  <textarea
                    className="input mt-1 min-h-24 resize-y"
                    placeholder="项目说明"
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
                    <p className="text-xs text-stone-500">本周投入</p>
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
                    <p className="text-xs text-stone-500">记录数</p>
                    <p className="mt-1 font-semibold text-stone-950">
                      {projectRecords.length} 条
                    </p>
                  </div>
                </div>
              </div>
            }
          >
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-stone-500">标题</p>
                <h3 className="mt-1 text-xl font-semibold text-stone-950">
                  {project.title}
                </h3>
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-500">说明</p>
                <ValueText
                  fallback="还没有项目说明。"
                  value={project.description}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md bg-stone-50 p-3">
                  <p className="text-xs text-stone-500">本周投入</p>
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
                  <p className="text-xs text-stone-500">记录数</p>
                  <p className="mt-1 font-semibold text-stone-950">
                    {projectRecords.length} 条
                  </p>
                </div>
              </div>
              {project.isArchived && (
                <span className="inline-flex rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-500">
                  已归档
                </span>
              )}
            </div>
          </EditableProjectSection>

          <EditableProjectSection
            id="direction"
            title="项目方向"
            subtitle="当前项目要持续推进的主线。"
            onCancel={cancelEditSection}
            onEdit={beginEditSection}
            onSave={saveProjectSection}
            onSelect={handleSelectSection}
            {...sectionState('direction')}
            editor={
              <textarea
                className="input min-h-28 resize-y"
                placeholder="项目方向"
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
            <ValueText fallback="还没有项目方向。" value={project.direction} />
          </EditableProjectSection>

          <EditableProjectSection
            id="hypothesis"
            title="当前假设"
            subtitle="记录项目判断、试验前提或需要验证的方向。"
            onCancel={cancelEditSection}
            onEdit={beginEditSection}
            onSave={saveProjectSection}
            onSelect={handleSelectSection}
            {...sectionState('hypothesis')}
            editor={
              <textarea
                className="input min-h-28 resize-y"
                placeholder="当前假设"
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
            <ValueText fallback="还没有当前假设。" value={project.hypothesis} />
          </EditableProjectSection>

          <EditableProjectSection
            id="completionCriteria"
            title="完成标准"
            subtitle="用来判断这个项目阶段是否完成的标准。"
            onCancel={cancelEditSection}
            onEdit={beginEditSection}
            onSave={saveProjectSection}
            onSelect={handleSelectSection}
            {...sectionState('completionCriteria')}
            editor={
              <textarea
                className="input min-h-28 resize-y"
                placeholder="完成标准"
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
              fallback="还没有完成标准。"
              value={project.completionCriteria}
            />
          </EditableProjectSection>

          <EditableProjectSection
            id="backlog"
            title="待办池"
            subtitle="每行保存为一个待办项。"
            onCancel={cancelEditSection}
            onEdit={beginEditSection}
            onSave={saveProjectSection}
            onSelect={handleSelectSection}
            {...sectionState('backlog')}
            editor={
              <textarea
                className="input min-h-32 resize-y"
                placeholder="待办池，每行一个"
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
            {project.backlog?.length ? (
              <ul className="space-y-2 text-sm text-stone-700">
                {project.backlog.map((item) => (
                  <li key={item} className="rounded-md bg-stone-50 px-3 py-2">
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-stone-400">还没有待办项。</p>
            )}
          </EditableProjectSection>

          {!project.isArchived && (
            <button
              className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-stone-100 px-3 text-sm font-semibold text-stone-700"
              type="button"
              onClick={handleArchiveProject}
            >
              <ArchiveBoxIcon className="h-4 w-4" />
              归档项目
            </button>
          )}
        </>
      ) : null}

      {activePanel === 'activity' ? (
        <>
          <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-stone-950">本周计划</h2>
            <textarea
              className="input mt-3 min-h-28 resize-y"
              value={currentPlan?.planText ?? ''}
              placeholder="- 本周最小推进目标"
              onChange={(event) => savePlan(event.target.value)}
            />
          </section>

          <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-stone-950">项目日志</h2>
            <div className="mt-3 space-y-3">
              {projectRecords.length === 0 ? (
                <p className="text-sm text-stone-500">还没有劳动记录。</p>
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

          <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-stone-950">周小结</h2>
              <button
                className="flex h-9 items-center gap-2 rounded-md bg-teal-700 px-3 text-sm font-semibold text-white disabled:bg-stone-300"
                disabled={generating}
                type="button"
                onClick={handleGenerateSnapshot}
              >
                <SparklesIcon className="h-4 w-4" />
                {generating ? '生成中' : '模拟生成'}
              </button>
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
    </div>
  )
}
