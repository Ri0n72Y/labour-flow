import {
  CheckIcon,
  ClockIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline'
import type { KeyboardEvent } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  indentMarkdownLines,
  markdownNewlineAtCursor,
} from '../../lib/notebook/textEditing'
import { sanitizeTagInput } from '../../lib/recording/recordSubmission'
import type { LabourRecord, Project } from '../../types/domain'
import { createManualRange, formatDateTime } from '../../utils/time'
import { HeadlessTextInput, HeadlessTextarea } from '../forms/HeadlessFields'
import { MarkdownList } from '../MarkdownList'
import { ProjectSelector } from './ProjectSelector'
import { TagNotebook } from './TagNotebook'

function durationLine(minutes: number) {
  if (!minutes) return ''
  const hours = minutes / 60
  return Number.isInteger(hours) ? `- ~${hours}h` : `- ~${hours.toFixed(1)}h`
}

function recordMarkdown(record: LabourRecord) {
  return [record.content.trim(), durationLine(record.durationMinutes)]
    .filter(Boolean)
    .join('\n')
}

export function LabourRecordCard({
  history,
  latest,
  projects = [],
  tagHistory = [],
  onCreateProject,
  onEdit,
  onSign,
  projectTitle,
  signing,
}: {
  history: LabourRecord[]
  latest: LabourRecord
  projects?: Project[]
  tagHistory?: string[]
  onCreateProject?: () => void
  onEdit?: (record: LabourRecord, updates: Partial<LabourRecord>) => void
  onSign?: (record: LabourRecord) => void
  projectTitle: string
  signing?: boolean
}) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [draftProjectId, setDraftProjectId] = useState(latest.projectId)
  const [draftDate, setDraftDate] = useState(latest.date)
  const [draftContent, setDraftContent] = useState(latest.content)
  const [draftDurationHours, setDraftDurationHours] = useState(
    latest.durationMinutes / 60
  )
  const [draftTags, setDraftTags] = useState(latest.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const edited = history.length > 1
  const signed = Boolean(latest.signature)

  const resetDraft = () => {
    setDraftProjectId(latest.projectId)
    setDraftDate(latest.date)
    setDraftContent(latest.content)
    setDraftDurationHours(latest.durationMinutes / 60)
    setDraftTags(latest.tags ?? [])
    setTagInput('')
  }

  const saveEdit = () => {
    const content = draftContent.trim()
    if (!content) return
    const durationHours = Number.isFinite(draftDurationHours)
      ? draftDurationHours
      : 0
    const durationMinutes = Math.max(0, Math.round(durationHours * 60))
    const range = createManualRange(draftDate, durationHours)
    const updates: Partial<LabourRecord> = {
      projectId: draftProjectId,
      date: draftDate,
      content,
      durationMinutes,
      durationSeconds: durationMinutes * 60,
      startAt: range.startAt,
      endAt: range.endAt,
      tags: draftTags,
    }
    const unchanged =
      updates.projectId === latest.projectId &&
      updates.date === latest.date &&
      updates.content === latest.content &&
      updates.durationMinutes === latest.durationMinutes &&
      JSON.stringify(updates.tags ?? []) === JSON.stringify(latest.tags ?? [])
    if (unchanged) {
      setEditing(false)
      return
    }
    onEdit?.(latest, updates)
    setEditing(false)
  }

  const toggleDraftTag = (tag: string) => {
    setDraftTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag]
    )
  }

  const submitDraftTag = () => {
    const tag = sanitizeTagInput(tagInput)
    if (!tag) return
    if (!draftTags.includes(tag)) setDraftTags((current) => [...current, tag])
    setTagInput('')
  }

  const handleDraftContentKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (event.key === 'Tab') {
      event.preventDefault()
      const input = event.currentTarget
      const result = indentMarkdownLines({
        value: draftContent,
        start: input.selectionStart,
        end: input.selectionEnd,
        outdent: event.shiftKey,
      })
      setDraftContent(result.value)
      window.requestAnimationFrame(() => {
        input.selectionStart = result.start
        input.selectionEnd = result.end
      })
      return
    }
    if (event.key !== 'Enter') return
    event.preventDefault()
    const input = event.currentTarget
    const result = markdownNewlineAtCursor(
      draftContent,
      input.selectionStart,
      input.selectionEnd
    )
    setDraftContent(result.value)
    window.requestAnimationFrame(() => {
      input.selectionStart = result.cursor
      input.selectionEnd = result.cursor
    })
  }

  if (editing) {
    return (
      <article className="notebook-paper overflow-hidden rounded-md border border-amber-200 text-left shadow-sm">
        <ProjectSelector
          embedded
          projects={projects}
          selectedProjectId={draftProjectId}
          onChange={setDraftProjectId}
          onCreate={onCreateProject ?? (() => undefined)}
        />
        <div className="grid grid-cols-[1fr_7rem] gap-3 border-t border-dashed border-amber-200 px-4 py-3">
          <label className="block text-sm font-semibold text-stone-700">
            <HeadlessTextInput
              className="mt-2 h-9 w-full rounded-md bg-white/45 px-2 text-sm text-stone-800 outline-none transition focus:bg-white/70 focus:ring-2 focus:ring-amber-200"
              type="date"
              value={draftDate}
              onChange={(event) => setDraftDate(event.target.value)}
            />
          </label>
          <label className="block text-sm font-semibold text-stone-700">
            <span className="mt-2 flex h-9 items-center rounded-md bg-white/45 px-2 focus-within:bg-white/70 focus-within:ring-2 focus-within:ring-amber-200">
              <HeadlessTextInput
                className="min-w-0 flex-1 bg-transparent text-right font-mono text-sm text-stone-900 outline-none"
                min={0}
                step={0.5}
                type="number"
                value={draftDurationHours}
                onChange={(event) =>
                  setDraftDurationHours(Number(event.target.value))
                }
              />
              <span className="ml-1 text-sm text-stone-500">h</span>
            </span>
          </label>
        </div>
        <section className="border-t border-dashed border-amber-200 px-4 py-3 text-left">
          <HeadlessTextarea
            className="notebook-input notebook-active-input min-h-24 resize-y"
            value={draftContent}
            onChange={(event) => setDraftContent(event.target.value)}
            onKeyDown={handleDraftContentKeyDown}
          />
        </section>
        <TagNotebook
          embedded
          showTitle={false}
          tags={draftTags}
          tagHistory={tagHistory}
          value={tagInput}
          onChange={setTagInput}
          onToggle={toggleDraftTag}
          onSubmit={submitDraftTag}
        />
        <div className="grid grid-cols-2 gap-2 border-t border-dashed border-amber-200 px-4 py-4">
          <button
            className="small-button justify-center"
            type="button"
            onClick={() => {
              resetDraft()
              setEditing(false)
            }}
          >
            {t('common.cancel')}
          </button>
          <button
            className="h-10 rounded-md bg-teal-700 px-3 text-sm font-semibold text-white"
            type="button"
            onClick={saveEdit}
          >
            {t('common.save')}
          </button>
        </div>
      </article>
    )
  }

  return (
    <article className="notebook-paper overflow-hidden rounded-md border border-amber-200 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-teal-800">
            {projectTitle}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            {t('recordCard.project')}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={`rounded-full px-2 py-1 text-xs font-semibold ${
              signed
                ? 'bg-emerald-50/90 text-emerald-700'
                : 'bg-amber-100/80 text-amber-900'
            }`}
          >
            {signed ? t('recordCard.signed') : t('recordCard.unsigned')}
          </span>
          {edited ? (
            <button
              className="text-xs font-semibold text-teal-700"
              type="button"
              onClick={() => setShowHistory((value) => !value)}
            >
              {t('recordCard.edited')}
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 border-t border-dashed border-amber-200 pt-3">
        <h5 className="mb-2 text-sm font-semibold text-stone-900">
          {latest.date}
        </h5>
        <MarkdownList text={recordMarkdown(latest)} />
      </div>

      {latest.tags?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {latest.tags.map((tag) => (
            <span key={tag} className="tag-chip bg-white/70 text-stone-600">
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2">
        {onEdit ? (
          <button
            className="small-button justify-center"
            type="button"
            onClick={() => setEditing(true)}
          >
            <PencilSquareIcon className="h-4 w-4" />
            {signed ? t('recordCard.patchEdit') : t('recordCard.edit')}
          </button>
        ) : null}
        {!signed && onSign ? (
          <button
            className="flex h-10 items-center justify-center gap-2 rounded-md bg-stone-950 px-3 text-sm font-semibold text-white disabled:bg-stone-300"
            disabled={signing}
            type="button"
            onClick={() => onSign(latest)}
          >
            <CheckIcon className="h-4 w-4" />
            {signing ? t('record.signing') : t('recordCard.sign')}
          </button>
        ) : (
          <span className="flex h-10 items-center justify-center gap-2 rounded-md bg-white/60 px-3 text-sm font-semibold text-stone-500">
            <ClockIcon className="h-4 w-4" />
            {latest.signedAt
              ? formatDateTime(latest.signedAt)
              : t('recordCard.local')}
          </span>
        )}
      </div>

      {showHistory ? (
        <div className="mt-4 space-y-2 border-t border-stone-100 pt-3">
          {history.map((item, index) => (
            <div key={item.id} className="rounded-md bg-white/60 p-3">
              <p className="text-xs font-semibold text-stone-500">
                {index === 0 ? t('recordCard.original') : t('recordCard.patch')}{' '}
                · {formatDateTime(item.createdAt)}
              </p>
              <div className="mt-2">
                <h5 className="mb-2 text-sm font-semibold text-stone-900">
                  {item.date}
                </h5>
                <MarkdownList text={recordMarkdown(item)} />
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  )
}
