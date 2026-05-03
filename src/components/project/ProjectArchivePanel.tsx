import { ArchiveBoxIcon, TrashIcon } from '@heroicons/react/24/outline'
import type { Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import { formatMinutes } from '../../lib/date'
import {
  getRecordDurationTotal,
  type ProjectDraft,
  type ProjectSectionId,
} from '../../lib/project/projectDetail'
import type { LabourRecord, Project } from '../../types/domain'
import { HeadlessTextInput, HeadlessTextarea } from '../forms/HeadlessFields'
import { MarkdownBlockPreview } from '../MarkdownBlockPreview'
import { BacklogPreview } from './BacklogPreview'
import { EditableProjectSection } from './EditableProjectSection'
import { ValueText } from './ValueText'

interface SectionState {
  editing: boolean
  selected: boolean
}

export function ProjectArchivePanel({
  canDeleteProject,
  currentWeekRecords,
  draft,
  isArchived,
  onArchiveProject,
  onCancelEdit,
  onEditSection,
  onRequestDeleteProject,
  onSaveSection,
  onSelectSection,
  onToggleBacklogTask,
  project,
  projectRecords,
  sectionState,
  setDraft,
}: {
  canDeleteProject: boolean
  currentWeekRecords: LabourRecord[]
  draft: ProjectDraft
  isArchived: boolean
  onArchiveProject: () => void
  onCancelEdit: () => void
  onEditSection: (sectionId: ProjectSectionId) => void
  onRequestDeleteProject: () => void
  onSaveSection: (sectionId: ProjectSectionId) => void
  onSelectSection: (sectionId: ProjectSectionId) => void
  onToggleBacklogTask: (lineIndex: number, checked: boolean) => void
  project: Project
  projectRecords: LabourRecord[]
  sectionState: (sectionId: ProjectSectionId) => SectionState
  setDraft: Dispatch<SetStateAction<ProjectDraft>>
}) {
  const { t } = useTranslation()

  return (
    <>
      <EditableProjectSection
        id="summary"
        title={t('projectDetail.summary')}
        subtitle={t('projectDetail.summarySubtitle')}
        onCancel={onCancelEdit}
        onEdit={onEditSection}
        onSave={onSaveSection}
        onSelect={onSelectSection}
        readOnly={isArchived}
        {...sectionState('summary')}
        editor={
          <ProjectSummaryEditor
            currentWeekRecords={currentWeekRecords}
            draft={draft}
            projectRecords={projectRecords}
            setDraft={setDraft}
          />
        }
      >
        <ProjectSummaryView
          currentWeekRecords={currentWeekRecords}
          project={project}
          projectRecords={projectRecords}
        />
      </EditableProjectSection>

      <EditableProjectSection
        id="direction"
        title={t('projectDetail.direction')}
        subtitle={t('projectDetail.directionSubtitle')}
        onCancel={onCancelEdit}
        onEdit={onEditSection}
        onSave={onSaveSection}
        onSelect={onSelectSection}
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
        onCancel={onCancelEdit}
        onEdit={onEditSection}
        onSave={onSaveSection}
        onSelect={onSelectSection}
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
        <MarkdownBlockPreview
          fallback={t('projectDetail.hypothesisEmpty')}
          value={project.hypothesis}
        />
      </EditableProjectSection>

      <EditableProjectSection
        id="completionCriteria"
        title={t('projectDetail.completionCriteria')}
        subtitle={t('projectDetail.completionCriteriaSubtitle')}
        onCancel={onCancelEdit}
        onEdit={onEditSection}
        onSave={onSaveSection}
        onSelect={onSelectSection}
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
        <MarkdownBlockPreview
          fallback={t('projectDetail.completionCriteriaEmpty')}
          value={project.completionCriteria}
        />
      </EditableProjectSection>

      <EditableProjectSection
        id="backlog"
        title={t('projectDetail.backlog')}
        subtitle={t('projectDetail.backlogSubtitle')}
        onCancel={onCancelEdit}
        onEdit={onEditSection}
        onSave={onSaveSection}
        onSelect={onSelectSection}
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
          <BacklogPreview
            fallbackItems={project.backlog}
            markdown={project.backlogText}
            readOnly={isArchived}
            onToggleTask={onToggleBacklogTask}
          />
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
            onClick={onArchiveProject}
          >
            <ArchiveBoxIcon className="h-4 w-4" />
            {t('projectDetail.archiveProject')}
          </button>
          {canDeleteProject ? (
            <button
              className="flex h-10 items-center justify-center gap-2 rounded-md bg-red-600 px-3 text-sm font-semibold text-white"
              type="button"
              onClick={onRequestDeleteProject}
            >
              <TrashIcon className="h-4 w-4" />
              {t('projectDetail.deleteProject')}
            </button>
          ) : null}
        </div>
      )}
    </>
  )
}

function ProjectSummaryEditor({
  currentWeekRecords,
  draft,
  projectRecords,
  setDraft,
}: {
  currentWeekRecords: LabourRecord[]
  draft: ProjectDraft
  projectRecords: LabourRecord[]
  setDraft: Dispatch<SetStateAction<ProjectDraft>>
}) {
  const { t } = useTranslation()

  return (
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
      <ProjectSummaryStats
        currentWeekRecords={currentWeekRecords}
        projectRecords={projectRecords}
      />
    </div>
  )
}

function ProjectSummaryView({
  currentWeekRecords,
  project,
  projectRecords,
}: {
  currentWeekRecords: LabourRecord[]
  project: Project
  projectRecords: LabourRecord[]
}) {
  const { t } = useTranslation()

  return (
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
      <ProjectSummaryStats
        currentWeekRecords={currentWeekRecords}
        projectRecords={projectRecords}
      />
      {project.isArchived && (
        <span className="inline-flex rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-500">
          {t('common.archived')}
        </span>
      )}
    </div>
  )
}

function ProjectSummaryStats({
  currentWeekRecords,
  projectRecords,
}: {
  currentWeekRecords: LabourRecord[]
  projectRecords: LabourRecord[]
}) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-2 gap-2 text-sm">
      <div className="rounded-md bg-stone-50 p-3">
        <p className="text-xs text-stone-500">
          {t('projectDetail.thisWeekDuration')}
        </p>
        <p className="mt-1 font-semibold text-stone-950">
          {formatMinutes(getRecordDurationTotal(currentWeekRecords))}
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
  )
}
