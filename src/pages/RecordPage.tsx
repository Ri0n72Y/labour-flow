import { CheckIcon } from '@heroicons/react/24/outline'
import { useEffect, useMemo, useState } from 'react'
import { Notebook } from '../components/Notebook'
import { ProjectSelector } from '../components/record/ProjectSelector'
import { RecordModePill } from '../components/record/RecordModePill'
import { RegistrationGate } from '../components/record/RegistrationGate'
import { TagNotebook } from '../components/record/TagNotebook'
import type { LaborData } from '../interfaces'
import { todayKey } from '../lib/date'
import {
  clampDuration,
  descriptionFromLogs,
  durationLabel,
  formatDurationShort,
  formatStartTime,
  getElapsedSeconds,
  type ListStyle,
} from '../lib/recording/recordFormatting'
import { useLabourStore } from '../store/useLabourStore'
import { useLaborStore } from '../stores/laborStore'
import { useRecordingStore } from '../stores/recordingStore'
import { useUserStore } from '../stores/userStore'
import {
  isEd25519KeyPair,
  publicKeyPayload,
  signLaborRecord,
} from '../utils/crypto'
import { createManualRange, nowIso, todayInputValue } from '../utils/time'

export function RecordPage() {
  const recording = useRecordingStore()
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
    if (recording.status !== 'running') return
    const interval = window.setInterval(() => setClockTick(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [recording.status])

  const elapsedSeconds = getElapsedSeconds({
    status: recording.status,
    startAt: recording.startAt,
    endAt: recording.endAt,
    pausedAt: recording.pausedAt,
    pausedSeconds: recording.pausedSeconds ?? 0,
    clockTick,
  })
  const hasKeys = isEd25519KeyPair(user.publicKeyJwk, user.privateKeyJwk)
  const hasTimerDraft = Boolean(recording.startAt) || recording.status !== 'idle'
  const selectedProjectId = projectId || fallbackProjectId
  const selectedProject = projectById.get(selectedProjectId)
  const canSign =
    hasKeys &&
    (recording.mode === 'manual' || recording.status === 'stopped') &&
    (recording.logs.length > 0 || recording.activeText.trim())
  const durationText =
    recording.mode === 'timer'
      ? formatDurationShort(elapsedSeconds)
      : durationLabel(recording.manualDurationHours)
  const durationMetaText =
    recording.mode === 'timer' ? formatStartTime(recording.startAt) : ''

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
    if (!recording.tags.includes(tag)) recording.toggleTag(tag)
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

    if (recording.activeText.trim()) recording.commitActiveLog()
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
      })
      recording.resetDraft()
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
      <RegistrationGate
        registering={registering}
        message={message}
        onRegister={handleRegister}
      />
    )
  }

  return (
    <div className="space-y-4">
      <p className="px-1 text-left text-xs text-stone-400">
        当前项目：{selectedProject?.title ?? '自动创建'}
      </p>

      <RecordModePill
        mode={recording.mode}
        status={recording.status}
        startAt={recording.startAt}
        endAt={recording.endAt}
        elapsedSeconds={elapsedSeconds}
        manualDurationHours={recording.manualDurationHours}
        hasTimerDraft={hasTimerDraft}
        onModeChange={recording.setMode}
        onManualDurationChange={recording.setManualDuration}
        onStartTimer={recording.startTimer}
        onPauseTimer={recording.pauseTimer}
        onResumeTimer={recording.resumeTimer}
        onStopTimer={recording.stopTimer}
        onResetDraft={recording.resetDraft}
      />

      <Notebook
        activeText={recording.activeText}
        logs={recording.logs}
        listStyle={listStyle}
        durationHours={recording.manualDurationHours}
        durationText={durationText}
        durationMetaText={durationMetaText}
        onChangeActive={recording.setActiveText}
        onCommit={recording.commitActiveLog}
        onUpdate={recording.updateLog}
        onRemove={recording.removeLog}
        onListStyleChange={setListStyle}
        onDecreaseDuration={
          recording.mode === 'manual'
            ? () =>
                recording.setManualDuration(
                  clampDuration(recording.manualDurationHours - 0.5)
                )
            : undefined
        }
        onIncreaseDuration={
          recording.mode === 'manual'
            ? () =>
                recording.setManualDuration(
                  clampDuration(recording.manualDurationHours + 0.5)
                )
            : undefined
        }
      />

      <TagNotebook
        tags={recording.tags}
        tagHistory={tagHistory}
        value={tagInput}
        onChange={setTagInput}
        onToggle={recording.toggleTag}
        onSubmit={submitTagInput}
      />

      <ProjectSelector
        projects={activeProjects}
        selectedProjectId={selectedProjectId}
        onChange={setProjectId}
        onCreate={createQuickProject}
      />

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
