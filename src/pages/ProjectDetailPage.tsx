import { ArrowLeftIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { useMemo, useState } from 'react'
import { MarkdownImportExport } from '../components/project/MarkdownImportExport'
import { ProjectDocumentPreview } from '../components/project/ProjectDocumentPreview'
import { PromptEditor } from '../components/prompt/PromptEditor'
import { formatMinutes, getWeekRange } from '../lib/date'
import { generateWeeklySnapshot } from '../lib/ai/generateWeeklySnapshot'
import { useLabourStore } from '../store/useLabourStore'

export function ProjectDetailPage({
  projectId,
  onBack,
}: {
  projectId: string
  onBack: () => void
}) {
  const project = useLabourStore((state) =>
    state.projects.find((item) => item.id === projectId),
  )
  const records = useLabourStore((state) => state.labourRecords)
  const weeklyPlans = useLabourStore((state) => state.weeklyPlans)
  const weeklySnapshots = useLabourStore((state) => state.weeklySnapshots)
  const promptTemplates = useLabourStore((state) => state.promptTemplates)
  const lastImportError = useLabourStore((state) => state.lastImportError)
  const addWeeklyPlan = useLabourStore((state) => state.addWeeklyPlan)
  const updateWeeklyPlan = useLabourStore((state) => state.updateWeeklyPlan)
  const addWeeklySnapshot = useLabourStore((state) => state.addWeeklySnapshot)
  const upsertPromptTemplate = useLabourStore((state) => state.upsertPromptTemplate)
  const exportMarkdown = useLabourStore((state) => state.exportProjectToMarkdown)
  const importMarkdownProject = useLabourStore((state) => state.importMarkdownProject)
  const [generating, setGenerating] = useState(false)
  const [message, setMessage] = useState('')

  const { weekStart, weekEnd } = getWeekRange()
  const projectRecords = useMemo(
    () =>
      records
        .filter((record) => record.projectId === projectId)
        .sort((left, right) => right.date.localeCompare(left.date)),
    [projectId, records],
  )
  const currentWeekRecords = projectRecords.filter(
    (record) => record.date >= weekStart && record.date <= weekEnd,
  )
  const currentPlan = weeklyPlans.find(
    (plan) =>
      plan.projectId === projectId &&
      plan.weekStart === weekStart &&
      plan.weekEnd === weekEnd,
  )
  const projectPrompt =
    promptTemplates.find((prompt) => prompt.projectId === projectId) ??
    promptTemplates.find((prompt) => prompt.scope === 'global')
  const markdown = project ? exportMarkdown(project.id) : ''

  if (!project) {
    return (
      <div className="space-y-4 text-left">
        <button className="small-button" type="button" onClick={onBack}>
          <ArrowLeftIcon className="h-4 w-4" />
          返回
        </button>
        <p className="rounded-md bg-white p-4 text-sm text-stone-500">项目不存在。</p>
      </div>
    )
  }

  const savePlan = (planText: string) => {
    if (currentPlan) {
      updateWeeklyPlan(currentPlan.id, { planText })
      return
    }
    addWeeklyPlan({ projectId, weekStart, weekEnd, planText })
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

  return (
    <div className="space-y-4 text-left">
      <button className="small-button" type="button" onClick={onBack}>
        <ArrowLeftIcon className="h-4 w-4" />
        返回项目
      </button>

      <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-semibold text-stone-950">{project.title}</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          {project.description || '还没有项目说明'}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-md bg-stone-50 p-3">
            <p className="text-xs text-stone-500">本周投入</p>
            <p className="mt-1 font-semibold text-stone-950">
              {formatMinutes(
                currentWeekRecords.reduce(
                  (total, record) => total + record.durationMinutes,
                  0,
                ),
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
      </section>

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
              <article key={record.id} className="rounded-md bg-stone-50 p-3">
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
              <article key={snapshot.id} className="rounded-md bg-stone-50 p-3">
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

      <ProjectDocumentPreview project={project} markdown={markdown} />
      <MarkdownImportExport
        markdown={markdown}
        importError={lastImportError}
        onImport={(value) => Boolean(importMarkdownProject(value, project.id))}
      />
    </div>
  )
}
