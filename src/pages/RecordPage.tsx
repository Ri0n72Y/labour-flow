import { CheckIcon } from '@heroicons/react/24/outline'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Notebook } from '../components/Notebook'
import { LabourRecordCard } from '../components/record/LabourRecordCard'
import { ProjectSelector } from '../components/record/ProjectSelector'
import { RecordModePill } from '../components/record/RecordModePill'
import { RegistrationGate } from '../components/record/RegistrationGate'
import { TagNotebook } from '../components/record/TagNotebook'
import type { LaborData } from '../interfaces'
import { todayKey } from '../lib/date'
import {
  clampDuration,
  durationLabel,
  formatDurationShort,
  formatStartTime,
  getElapsedSeconds,
  type ListStyle,
} from '../lib/recording/recordFormatting'
import {
  activeProjects as getActiveProjects,
  canSignDraft,
  fallbackProjectId,
  labourRecordInputFromPrepared,
  prepareLaborRecord,
  resolveSelectedProjectId,
  sanitizeTagInput,
} from '../lib/recording/recordSubmission'
import {
  getProjectTitle,
  groupLabourRecordThreads,
} from '../lib/records/labourRecordCards'
import { useLabourStore } from '../store/useLabourStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useLaborStore } from '../stores/laborStore'
import { useRecordingStore } from '../stores/recordingStore'
import { useUserStore } from '../stores/userStore'
import type { LabourRecord } from '../types/domain'
import {
  isEd25519KeyPair,
  publicKeyPayload,
  signLaborRecord,
} from '../utils/crypto'
import { nowIso, todayInputValue } from '../utils/time'

export function RecordPage() {
  const { t } = useTranslation()
  const recording = useRecordingStore()
  const projects = useLabourStore((state) => state.projects)
  const labourRecords = useLabourStore((state) => state.labourRecords)
  const createProject = useLabourStore((state) => state.createProject)
  const addLabourRecord = useLabourStore((state) => state.addLabourRecord)
  const patchLabourRecord = useLabourStore((state) => state.patchLabourRecord)
  const updateLabourRecord = useLabourStore((state) => state.updateLabourRecord)
  const signDomainRecord = useLabourStore((state) => state.signLabourRecord)
  const addSignedRecord = useLaborStore((state) => state.addRecord)
  const tagHistory = useLaborStore((state) => state.tagHistory)
  const autoSignRecords = useSettingsStore((state) => state.autoSignRecords)
  const user = useUserStore()
  const activeProjects = useMemo(
    () => getActiveProjects(projects),
    [projects]
  )
  const fallbackProject = useMemo(
    () => fallbackProjectId(labourRecords, activeProjects),
    [activeProjects, labourRecords]
  )
  const [projectId, setProjectId] = useState('')
  const [listStyle, setListStyle] = useState<ListStyle>('unordered')
  const [clockTick, setClockTick] = useState(0)
  const [tagInput, setTagInput] = useState('')
  const [signing, setSigning] = useState(false)
  const [signingRecordId, setSigningRecordId] = useState('')
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
  const hasTimerDraft =
    Boolean(recording.startAt) || recording.status !== 'idle'
  const selectedProjectId = resolveSelectedProjectId(
    activeProjects,
    projectId,
    fallbackProject
  )
  const canSign = canSignDraft({ ...recording, hasKeys })
  const durationText =
    recording.mode === 'timer'
      ? formatDurationShort(elapsedSeconds)
      : durationLabel(recording.manualDurationHours)
  const durationMetaText =
    recording.mode === 'timer' ? formatStartTime(recording.startAt) : ''
  const recordThreads = useMemo(
    () => groupLabourRecordThreads(labourRecords),
    [labourRecords]
  )

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
    setMessage(t('record.messages.createdProject'))
  }

  const submitTagInput = () => {
    const tag = sanitizeTagInput(tagInput)
    if (!tag) return
    if (!recording.tags.includes(tag)) recording.toggleTag(tag)
    setTagInput('')
  }

  const handleRegister = async () => {
    setMessage('')
    setRegistering(true)
    try {
      await user.generateKeys()
      setMessage(t('record.messages.registered'))
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : t('record.messages.registerFailed')
      )
    } finally {
      setRegistering(false)
    }
  }

  const signedPayloadFromRecord = (record: LabourRecord): Omit<LaborData, 'signature'> => ({
    wid: record.signedRecordWid ?? record.id,
    startAt: record.startAt ?? `${record.date}T00:00:00.000Z`,
    endAt: record.endAt ?? `${record.date}T00:00:00.000Z`,
    duration: record.durationSeconds ?? record.durationMinutes * 60,
    createBy: record.createdBy ?? publicKeyPayload(user.publicKeyJwk),
    createAt: record.createdAt,
    outcome: '',
    description: record.content,
    tags: record.tags ?? [],
  })

  const signSavedRecord = async (record: LabourRecord, confirmFirst = true) => {
    setMessage('')
    if (!user.privateKeyJwk || !user.publicKeyJwk) {
      setMessage(t('record.messages.keyRequired'))
      return
    }
    if (
      confirmFirst &&
      !window.confirm(t('recordCard.signConfirm'))
    ) {
      return
    }
    const wid = record.signedRecordWid ?? crypto.randomUUID()
    const recordBase = { ...signedPayloadFromRecord(record), wid }
    setSigningRecordId(record.id)
    try {
      const signature = await signLaborRecord(recordBase, user.privateKeyJwk)
      addSignedRecord({ ...recordBase, signature, logEntries: [] })
      signDomainRecord(record.id, signature, wid)
      setMessage(t('record.messages.signed'))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('record.messages.signFailed'))
    } finally {
      setSigningRecordId('')
    }
  }

  const handleSaveRecord = async () => {
    setMessage('')
    if (!user.privateKeyJwk || !user.publicKeyJwk) {
      setMessage(t('record.messages.keyRequired'))
      return
    }

    if (recording.activeText.trim()) recording.commitActiveLog()
    const latest = useRecordingStore.getState()
    const nextProjectId = ensureProjectId()
    const prepared = prepareLaborRecord({
      createAt: nowIso(),
      createBy: publicKeyPayload(user.publicKeyJwk),
      draft: latest,
      listStyle,
      manualDateValue: todayInputValue(),
      wid: crypto.randomUUID(),
    })
    if (!prepared.ok) {
      setMessage(t('record.messages.writeLog'))
      return
    }

    setSigning(true)
    try {
      let signature: string | undefined
      if (autoSignRecords) {
        signature = await signLaborRecord(prepared.recordBase, user.privateKeyJwk)
        addSignedRecord({ ...prepared.recordBase, signature, logEntries: latest.logs })
      }
      addLabourRecord(
        labourRecordInputFromPrepared({
          projectId: nextProjectId,
          date: todayKey(),
          description: prepared.description,
          duration: prepared.duration,
          startAt: prepared.recordBase.startAt,
          endAt: prepared.recordBase.endAt,
          tags: prepared.recordBase.tags,
          createdBy: prepared.recordBase.createBy,
          signature,
          signedAt: signature ? nowIso() : undefined,
          signedRecordWid: prepared.recordBase.wid,
        })
      )
      recording.resetDraft()
      setTagInput('')
      setMessage(autoSignRecords ? t('record.messages.signed') : t('record.messages.savedUnsigned'))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('record.messages.signFailed'))
    } finally {
      setSigning(false)
    }
  }

  const handleEditRecord = (record: LabourRecord, updates: Partial<LabourRecord>) => {
    if (record.signature) {
      patchLabourRecord(record.id, updates)
      return
    }
    updateLabourRecord(record.id, updates)
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
      <section className="notebook-paper overflow-hidden rounded-md border border-amber-200 text-left shadow-sm">
        <ProjectSelector
          embedded
          projects={activeProjects}
          selectedProjectId={selectedProjectId}
          onChange={setProjectId}
          onCreate={createQuickProject}
        />
        <RecordModePill
          embedded
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
          embedded
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
          embedded
          tags={recording.tags}
          tagHistory={tagHistory}
          value={tagInput}
          onChange={setTagInput}
          onToggle={recording.toggleTag}
          onSubmit={submitTagInput}
        />

        <div className="border-t border-dashed border-amber-200 px-4 py-4">
          <button
            className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white disabled:bg-stone-300"
            disabled={!canSign || signing}
            type="button"
            onClick={() => {
              void handleSaveRecord()
            }}
          >
            <CheckIcon className="h-5 w-5" />
            {signing ? t('record.saving') : autoSignRecords ? t('record.saveAndAutoSign') : t('record.saveUnsigned')}
          </button>
        </div>
      </section>

      {message && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-left text-sm text-amber-800">
          {message}
        </p>
      )}

      <section className="space-y-3">
        <h2 className="px-1 text-base font-semibold text-stone-950">
          {t('record.recentCards')}
        </h2>
        {recordThreads.map((thread) => (
          <LabourRecordCard
            key={thread.root.id}
            history={thread.history}
            latest={thread.latest}
            projects={activeProjects}
            projectTitle={getProjectTitle(projects, thread.latest.projectId)}
            signing={signingRecordId === thread.latest.id}
            tagHistory={tagHistory}
            onCreateProject={createQuickProject}
            onEdit={handleEditRecord}
            onSign={(record) => {
              void signSavedRecord(record)
            }}
          />
        ))}
      </section>
    </div>
  )
}
