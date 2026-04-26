import {
  ArrowPathIcon,
  CheckIcon,
  ClockIcon,
  PauseIcon,
  PencilSquareIcon,
  PlayIcon,
  PlusIcon,
  StopIcon,
  TagIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import type { KeyboardEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { KeyIcon } from '../components/icons/KeyIcon'
import { Notebook } from '../components/Notebook'
import { RadioSwitch } from '../components/RadioSwitch'
import type { LaborData, RecordMode } from '../interfaces'
import { todayKey } from '../lib/date'
import { markdownListItems } from '../lib/markdown/listRendering'
import { cn } from '../lib/styles/cn'
import { useLabourStore } from '../store/useLabourStore'
import { useLaborStore } from '../stores/laborStore'
import { useRecordingStore } from '../stores/recordingStore'
import { useUserStore } from '../stores/userStore'
import {
  isEd25519KeyPair,
  publicKeyPayload,
  signLaborRecord,
} from '../utils/crypto'
import {
  createManualRange,
  formatDateTime,
  formatDuration,
  nowIso,
  todayInputValue,
} from '../utils/time'

type ListStyle = 'unordered' | 'ordered'

const recordModeOptions = [
  { value: 'timer', label: '实时计时', icon: ClockIcon },
  { value: 'manual', label: '手动记录', icon: PencilSquareIcon },
] as const

const timerIconButtonClass =
  'inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20'

function durationLabel(hours: number) {
  return `${Number(hours.toFixed(1))}h`
}

function clampDuration(hours: number) {
  return Math.max(0, Math.round(hours * 2) / 2)
}

function formatDurationShort(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function formatStartTime(dateIso: string | null | undefined) {
  if (!dateIso) return ''
  const date = new Date(dateIso)
  if (Number.isNaN(date.getTime())) return ''
  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes()
  ).padStart(2, '0')} 开始`
}

function descriptionFromLogs(
  logs: Array<{ text: string }>,
  listStyle: ListStyle
) {
  const lines = logs.flatMap((log) => markdownListItems(log.text))
  if (listStyle === 'ordered') {
    return lines.map((line, index) => `${index + 1}. ${line}`).join('\n')
  }
  return lines.map((line) => `- ${line}`).join('\n')
}

function TagNotebook({
  tags,
  tagHistory,
  value,
  onChange,
  onToggle,
  onSubmit,
}: {
  tags: string[]
  tagHistory: string[]
  value: string
  onChange: (value: string) => void
  onToggle: (tag: string) => void
  onSubmit: () => void
}) {
  const suggestions = useMemo(() => {
    const defaults = ['写作', '开发', '沟通', '研究', '设计', '维护']
    const query = value.trim().toLowerCase()
    return Array.from(new Set([...tagHistory, ...defaults]))
      .filter((tag) => !tags.includes(tag))
      .filter((tag) => !query || tag.toLowerCase().includes(query))
      .slice(0, 8)
  }, [tagHistory, tags, value])

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    onSubmit()
  }

  return (
    <section className="notebook-paper rounded-md border border-amber-200 p-4 text-left shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <TagIcon className="h-4 w-4 text-teal-700" />
        <h2 className="text-base font-semibold text-stone-950">标签</h2>
      </div>
      <div className="space-y-3">
        <div className="flex min-h-8 flex-wrap gap-2">
          {tags.length === 0 ? (
            <span className="text-sm leading-8 text-stone-400">
              为这次劳动加一个简短标记...
            </span>
          ) : (
            tags.map((tag) => (
              <button
                key={tag}
                className="rounded-full bg-teal-50 px-3 py-1 text-sm text-teal-800 transition hover:bg-teal-100"
                type="button"
                onClick={() => onToggle(tag)}
              >
                #{tag}
              </button>
            ))
          )}
        </div>
        <div className="grid grid-cols-[1fr_auto] items-center gap-2 border-t border-dashed border-amber-200 pt-3">
          <input
            className="h-9 rounded-md bg-amber-50/70 px-3 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:bg-white focus:ring-2 focus:ring-amber-200"
            placeholder="输入标签，Enter 确认"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-teal-700 transition hover:bg-teal-50 disabled:text-stone-300"
            type="button"
            disabled={!value.trim()}
            onClick={onSubmit}
            aria-label="添加标签"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((tag) => (
              <button
                key={tag}
                className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600 transition hover:bg-stone-200"
                type="button"
                onClick={() => onToggle(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export function RecordPage() {
  const {
    mode,
    status,
    startAt,
    endAt,
    pausedAt,
    pausedSeconds,
    manualDurationHours,
    logs,
    activeText,
    tags,
    setMode,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    setActiveText,
    commitActiveLog,
    updateLog,
    removeLog,
    toggleTag,
    setManualDuration,
    resetDraft,
  } = useRecordingStore()
  const projects = useLabourStore((state) => state.projects)
  const labourRecords = useLabourStore((state) => state.labourRecords)
  const createProject = useLabourStore((state) => state.createProject)
  const addLabourRecord = useLabourStore((state) => state.addLabourRecord)
  const addSignedRecord = useLaborStore((state) => state.addRecord)
  const tagHistory = useLaborStore((state) => state.tagHistory)
  const user = useUserStore()
  const activeProjects = useMemo(
    () => projects.filter((project) => !project.isArchived),
    [projects]
  )
  const projectById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects]
  )
  const latestProjectId = labourRecords.find((record) =>
    activeProjects.some((project) => project.id === record.projectId)
  )?.projectId
  const fallbackProjectId = latestProjectId ?? activeProjects[0]?.id ?? ''
  const [projectId, setProjectId] = useState('')
  const [listStyle, setListStyle] = useState<ListStyle>('unordered')
  const [clockTick, setClockTick] = useState(0)
  const [tagInput, setTagInput] = useState('')
  const [signing, setSigning] = useState(false)
  const [message, setMessage] = useState('')
  const [registering, setRegistering] = useState(false)

  useEffect(() => {
    if (status !== 'running') return
    const interval = window.setInterval(() => setClockTick(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [status])

  const totalPausedSeconds = pausedSeconds ?? 0
  const elapsedSeconds =
    status === 'idle' || !startAt
      ? 0
      : Math.round(
          Math.max(
            0,
            (endAt
              ? Date.parse(endAt)
              : status === 'paused' && pausedAt
                ? Date.parse(pausedAt)
                : clockTick || Date.parse(startAt)) - Date.parse(startAt)
          ) /
            1000 -
            totalPausedSeconds
        )
  const hasKeys = isEd25519KeyPair(user.publicKeyJwk, user.privateKeyJwk)
  const hasTimerDraft = Boolean(startAt) || status !== 'idle'
  const hideModeSwitch =
    mode === 'timer' && ['running', 'paused'].includes(status)
  const selectedProjectId = projectId || fallbackProjectId
  const selectedProject = projectById.get(selectedProjectId)
  const canSign =
    hasKeys &&
    (mode === 'manual' || status === 'stopped') &&
    (logs.length > 0 || activeText.trim())
  const durationText =
    mode === 'timer'
      ? formatDurationShort(elapsedSeconds)
      : durationLabel(manualDurationHours)
  const durationMetaText = mode === 'timer' ? formatStartTime(startAt) : ''

  const ensureProjectId = () => {
    if (selectedProjectId) return selectedProjectId
    const project = createProject({
      title: '默认劳动项目',
      description: '自动创建，用来承接快速劳动记录。',
    })
    setProjectId(project.id)
    return project.id
  }

  const createQuickProject = () => {
    const project = createProject({
      title: '新的劳动项目',
      description: '从一条笔记开始。',
    })
    setProjectId(project.id)
    setMessage('已切换到新的劳动项目。')
  }

  const submitTagInput = () => {
    const tag = tagInput.trim().replace(/^#/, '')
    if (!tag) return
    if (!tags.includes(tag)) toggleTag(tag)
    setTagInput('')
  }

  const handleRegister = async () => {
    setMessage('')
    setRegistering(true)
    try {
      await user.generateKeys()
      setMessage('注册已完成，可以开始记录劳动。')
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : '注册失败，请确认正在使用安全上下文。'
      )
    } finally {
      setRegistering(false)
    }
  }

  const handleSign = async () => {
    setMessage('')
    if (!user.privateKeyJwk || !user.publicKeyJwk) {
      setMessage('请先完成注册并生成本地密钥。')
      return
    }

    if (activeText.trim()) commitActiveLog()
    const latest = useRecordingStore.getState()
    const nextProjectId = ensureProjectId()
    const range =
      latest.mode === 'manual'
        ? createManualRange(todayInputValue(), latest.manualDurationHours)
        : { startAt: latest.startAt, endAt: latest.endAt }

    if (!range.startAt || !range.endAt || latest.logs.length === 0) {
      setMessage('请至少写下一条劳动日志。')
      return
    }

    const duration =
      latest.mode === 'manual'
        ? Math.round(latest.manualDurationHours * 3600)
        : Math.max(
            0,
            Math.round(
              (Date.parse(range.endAt) - Date.parse(range.startAt)) / 1000
            ) - (latest.pausedSeconds ?? 0)
          )
    const description = descriptionFromLogs(latest.logs, listStyle)
    if (!description) {
      setMessage('请至少写下一条劳动日志。')
      return
    }

    setSigning(true)
    try {
      const recordBase: Omit<LaborData, 'signature'> = {
        wid: crypto.randomUUID(),
        startAt: range.startAt,
        endAt: range.endAt,
        duration,
        createBy: publicKeyPayload(user.publicKeyJwk),
        createAt: nowIso(),
        outcome: '',
        description,
        tags: latest.tags,
      }
      const signature = await signLaborRecord(recordBase, user.privateKeyJwk)
      addSignedRecord({ ...recordBase, signature, logEntries: latest.logs })
      addLabourRecord({
        projectId: nextProjectId,
        date: todayKey(),
        content: description,
        durationMinutes: Math.round(duration / 60),
        reflection: undefined,
        progressNote: markdownListItems(description)[0] ?? description,
      })
      resetDraft()
      setTagInput('')
      setMessage('记录已签名保存。')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '签名失败，请重试。')
    } finally {
      setSigning(false)
    }
  }

  if (!hasKeys) {
    return (
      <div className="space-y-4">
        <section className="rounded-md border border-amber-200 bg-amber-50 p-5 text-left shadow-sm">
          <div className="flex items-start gap-3">
            <UserCircleIcon className="mt-0.5 h-6 w-6 shrink-0 text-amber-700" />
            <div>
              <p className="text-base font-semibold text-amber-950">
                先完成注册
              </p>
              <p className="mt-2 text-sm leading-6 text-amber-800">
                劳动流需要先生成本地公钥和私钥，之后才能为劳动记录签名并确认记录属于你。
              </p>
            </div>
          </div>
          <button
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white disabled:bg-stone-300"
            disabled={registering}
            type="button"
            onClick={handleRegister}
          >
            <KeyIcon />
            {registering ? '注册中' : '注册并生成密钥'}
          </button>
        </section>
        {message && (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-left text-sm text-amber-800">
            {message}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="px-1 text-left text-xs text-stone-400">
        当前项目：{selectedProject?.title ?? '自动创建'}
      </p>

      <section
        className={cn(
          'rounded-full py-3 pl-5 pr-4 text-left shadow-sm transition-colors duration-200',
          mode === 'timer' ? 'bg-stone-950 text-white' : 'bg-[#fffaf0] text-stone-950'
        )}
      >
        <div className="grid min-h-10 grid-cols-[1fr_auto] items-center gap-3">
          <div className="min-w-0">
            {mode === 'timer' ? (
              <div className="flex min-w-0 items-center gap-3">
                <span className="font-mono text-xl font-semibold tabular-nums">
                  {status === 'idle'
                    ? '00:00:00'
                    : formatDuration(elapsedSeconds)}
                </span>
                <span className="truncate text-xs text-stone-400">
                  {status === 'paused'
                    ? '已暂停'
                    : status === 'stopped'
                      ? `已结束 ${formatDateTime(endAt)}`
                      : formatDateTime(startAt) || '等待开始'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-base font-semibold text-stone-950">
                  手动记录
                </span>
                <label className="inline-flex h-9 items-center rounded-full bg-amber-50/70 px-3 text-sm text-stone-700 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-200">
                  <input
                    className="w-16 bg-transparent text-right font-mono text-base font-semibold text-stone-950 outline-none"
                    min={0}
                    step={0.5}
                    type="number"
                    value={manualDurationHours}
                    onChange={(event) =>
                      setManualDuration(Number(event.target.value))
                    }
                    aria-label="手动输入用时"
                  />
                  <span className="ml-1 text-xs text-stone-500">h</span>
                </label>
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {mode === 'timer' && status === 'idle' && (
              <button
                className={timerIconButtonClass}
                type="button"
                onClick={startTimer}
                aria-label="开始计时"
              >
                <PlayIcon className="h-5 w-5" />
              </button>
            )}
            {mode === 'timer' && status === 'running' && (
              <button
                className={timerIconButtonClass}
                type="button"
                onClick={pauseTimer}
                aria-label="暂停计时"
              >
                <PauseIcon className="h-5 w-5" />
              </button>
            )}
            {mode === 'timer' && status === 'paused' && (
              <button
                className={timerIconButtonClass}
                type="button"
                onClick={resumeTimer}
                aria-label="继续计时"
              >
                <PlayIcon className="h-5 w-5" />
              </button>
            )}
            {mode === 'timer' && status !== 'idle' && status !== 'stopped' && (
              <button
                className={timerIconButtonClass}
                type="button"
                onClick={stopTimer}
                aria-label="结束计时"
              >
                <StopIcon className="h-5 w-5" />
              </button>
            )}
            {hasTimerDraft && (
              <button
                className={cn(
                  mode === 'timer'
                    ? timerIconButtonClass
                    : 'icon-button bg-white text-stone-700'
                )}
                type="button"
                onClick={resetDraft}
                aria-label="重置记录"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
            )}
            {!hideModeSwitch && (
              <RadioSwitch<RecordMode>
                ariaLabel="记录模式"
                className={cn(mode === 'timer' && 'bg-stone-800')}
                options={recordModeOptions}
                value={mode}
                onChange={setMode}
              />
            )}
          </div>
        </div>
      </section>

      <Notebook
        activeText={activeText}
        logs={logs}
        listStyle={listStyle}
        durationHours={manualDurationHours}
        durationText={durationText}
        durationMetaText={durationMetaText}
        onChangeActive={setActiveText}
        onCommit={commitActiveLog}
        onUpdate={updateLog}
        onRemove={removeLog}
        onListStyleChange={setListStyle}
        onDecreaseDuration={
          mode === 'manual'
            ? () => setManualDuration(clampDuration(manualDurationHours - 0.5))
            : undefined
        }
        onIncreaseDuration={
          mode === 'manual'
            ? () => setManualDuration(clampDuration(manualDurationHours + 0.5))
            : undefined
        }
      />

      <TagNotebook
        tags={tags}
        tagHistory={tagHistory}
        value={tagInput}
        onChange={setTagInput}
        onToggle={toggleTag}
        onSubmit={submitTagInput}
      />

      <section className="grid grid-cols-[1fr_auto] gap-2 text-left">
        <select
          className="input"
          value={selectedProjectId}
          onChange={(event) => setProjectId(event.target.value)}
          aria-label="选择项目"
        >
          {activeProjects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.title}
            </option>
          ))}
        </select>
        <button
          className="icon-button bg-stone-100 text-stone-700"
          type="button"
          onClick={createQuickProject}
          aria-label="新建项目"
        >
          <PlusIcon className="h-5 w-5" />
        </button>
      </section>

      <button
        className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white disabled:bg-stone-300"
        disabled={!canSign || signing}
        type="button"
        onClick={() => {
          void handleSign()
        }}
      >
        <CheckIcon className="h-5 w-5" />
        {signing ? '签名中' : '完成并签名'}
      </button>

      {message && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-left text-sm text-amber-800">
          {message}
        </p>
      )}
    </div>
  )
}
