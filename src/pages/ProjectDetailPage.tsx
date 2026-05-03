import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ProjectActivityPanel } from '../components/project/ProjectActivityPanel'
import { ProjectArchivePanel } from '../components/project/ProjectArchivePanel'
import { ProjectDataPanel } from '../components/project/ProjectDataPanel'
import { ProjectDeleteDialog } from '../components/project/ProjectDeleteDialog'
import { ProjectDetailTabs } from '../components/project/ProjectDetailTabs'
import { generateWeeklySnapshot } from '../lib/ai/generateWeeklySnapshot'
import { getWeekRange } from '../lib/date'
import {
  backlogItemsFromText,
  linesFromBacklog,
  updateBacklogTaskLine,
} from '../lib/project/backlog'
import {
  findCurrentWeeklyPlan,
  findProjectPrompt,
  getProjectRecords,
  getRecordsInWeek,
  projectUpdatesFromDraft,
  toProjectDraft,
  type DetailPanelId,
  type ProjectSectionId,
} from '../lib/project/projectDetail'
import { useLabourStore } from '../store/useLabourStore'
import type { Project } from '../types/domain'

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
  const [draft, setDraft] = useState(() => toProjectDraft(project))

  const { weekStart, weekEnd } = getWeekRange()
  const projectRecords = useMemo(
    () => getProjectRecords(records, projectId),
    [projectId, records]
  )
  const currentWeekRecords = useMemo(
    () => getRecordsInWeek(projectRecords, weekStart, weekEnd),
    [projectRecords, weekEnd, weekStart]
  )
  const currentPlan = useMemo(
    () => findCurrentWeeklyPlan(weeklyPlans, projectId, weekStart, weekEnd),
    [projectId, weekEnd, weekStart, weeklyPlans]
  )
  const projectPrompt = useMemo(
    () => findProjectPrompt(promptTemplates, projectId),
    [projectId, promptTemplates]
  )
  const projectSnapshots = useMemo(
    () =>
      weeklySnapshots.filter((snapshot) => snapshot.projectId === projectId),
    [projectId, weeklySnapshots]
  )
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
    const updates = projectUpdatesFromDraft(sectionId, draft)

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

  const handleToggleBacklogTask = (lineIndex: number, checked: boolean) => {
    if (isArchived) return
    const backlogText = updateBacklogTaskLine(
      project.backlogText ?? linesFromBacklog(project.backlog),
      lineIndex,
      checked
    )
    updateProject(project.id, {
      backlogText,
      backlog: backlogItemsFromText(backlogText),
    })
  }

  const handleSavePrompt = (content: string) => {
    upsertPromptTemplate({
      id: projectPrompt?.projectId ? projectPrompt.id : undefined,
      name: `${project.title} 周总结提示词`,
      scope: 'project',
      projectId,
      content,
    })
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

      <ProjectDetailTabs activePanel={activePanel} onChange={setActivePanel} />

      {activePanel === 'archive' ? (
        <ProjectArchivePanel
          canDeleteProject={canDeleteProject}
          currentWeekRecords={currentWeekRecords}
          draft={draft}
          isArchived={isArchived}
          project={project}
          projectRecords={projectRecords}
          sectionState={sectionState}
          setDraft={setDraft}
          onArchiveProject={handleArchiveProject}
          onCancelEdit={cancelEditSection}
          onEditSection={beginEditSection}
          onRequestDeleteProject={() => setConfirmingDelete(true)}
          onSaveSection={saveProjectSection}
          onSelectSection={handleSelectSection}
          onToggleBacklogTask={handleToggleBacklogTask}
        />
      ) : null}

      {activePanel === 'activity' ? (
        <ProjectActivityPanel
          currentPlan={currentPlan}
          generating={generating}
          isArchived={isArchived}
          message={message}
          projectPrompt={projectPrompt}
          projectRecords={projectRecords}
          projectSnapshots={projectSnapshots}
          onGenerateSnapshot={() => {
            void handleGenerateSnapshot()
          }}
          onSavePlan={savePlan}
          onSavePrompt={handleSavePrompt}
        />
      ) : null}

      {activePanel === 'data' ? (
        <ProjectDataPanel markdown={markdown} project={project} />
      ) : null}

      <ProjectDeleteDialog
        open={confirmingDelete}
        projectTitle={project.title}
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={handleDeleteProject}
      />
    </div>
  )
}
