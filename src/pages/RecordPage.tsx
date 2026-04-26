import { Switch } from '@headlessui/react'
import {
  ArrowPathIcon,
  CheckIcon,
  ClockIcon,
  PauseIcon,
  PlayIcon,
  StopIcon,
  TagIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { KeyIcon } from '../components/icons/KeyIcon'
import { Notebook } from '../components/Notebook'
import { TagPicker } from '../components/TagPicker'
import type { LaborData } from '../interfaces'
import { useLaborStore } from '../stores/laborStore'
import { useRecordingStore } from '../stores/recordingStore'
import { useUserStore } from '../stores/userStore'
import {
  isEd25519KeyPair,
  publicKeyPayload,
  signLaborRecord,
} from '../utils/crypto'
import { normalizeDescriptionItem } from '../utils/record'
import {
  createManualRange,
  formatDateTime,
  formatDuration,
  nowIso,
  todayInputValue,
} from '../utils/time'

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
  const user = useUserStore()
  const addRecord = useLaborStore((state) => state.addRecord)
  const tagHistory = useLaborStore((state) => state.tagHistory)
  const [clockTick, setClockTick] = useState(0)
  const [tagPickerOpen, setTagPickerOpen] = useState(false)
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
  const canSign =
    hasKeys &&
    (status === 'stopped' || mode === 'manual') &&
    (logs.length > 0 || activeText.trim())

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
          : '注册失败，请确认正在使用 HTTPS。'
      )
    } finally {
      setRegistering(false)
    }
  }

  const handleSign = async () => {
    setMessage('')
    if (!user.privateKeyJwk || !user.publicKeyJwk) {
      setMessage('请先在“我的”页面生成密钥。')
      return
    }

    if (activeText.trim()) commitActiveLog()
    const latest = useRecordingStore.getState()
    const range =
      latest.mode === 'manual'
        ? createManualRange(todayInputValue(), latest.manualDurationHours)
        : { startAt: latest.startAt, endAt: latest.endAt }

    if (!range.startAt || !range.endAt || latest.logs.length === 0) {
      setMessage('请补充时间和至少一条劳动日志。')
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

    setSigning(true)
    try {
      const description = latest.logs
        .map((log) => normalizeDescriptionItem(log.text))
        .filter(Boolean)
        .join('\n')
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
      addRecord({ ...recordBase, signature, logEntries: latest.logs })
      resetDraft()
      setMessage('记录已签名保存。')
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : '签名失败，请检查 HTTPS 和浏览器 WebCrypto 支持。'
      )
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
                LabourFlow
                需要先生成本地公钥和私钥，之后才能为劳动记录签名并确认记录属于你。
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
      {mode === 'timer' ? (
        <section
          className={`${status === 'idle' ? 'p-4' : 'px-3 py-2'} rounded-md bg-stone-950 text-left text-white shadow-sm`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {status === 'idle' && (
                <p className="mt-1 text-lg font-semibold">实时计时</p>
              )}
              {status !== 'idle' && (
                <div className="flex min-w-0 items-center gap-2">
                  <ClockIcon className="h-5 w-5 shrink-0 text-amber-300" />
                  <span className="text-lg font-semibold">
                    {formatDuration(elapsedSeconds)}
                  </span>
                  <span className="truncate text-xs text-stone-300">
                    {status === 'paused'
                      ? '已暂停'
                      : status === 'stopped'
                        ? `已结束 ${formatDateTime(endAt)}`
                        : formatDateTime(startAt)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Switch
                checked={false}
                className="relative inline-flex h-8 w-16 items-center rounded-full bg-stone-700 transition"
                onChange={(checked) => setMode(checked ? 'manual' : 'timer')}
              >
                <span className="sr-only">切换记录模式</span>
                <span className="inline-block h-6 w-6 translate-x-1 rounded-full bg-white transition" />
              </Switch>
              {status === 'idle' && (
                <button
                  className="icon-button bg-teal-600 text-white"
                  type="button"
                  onClick={startTimer}
                  aria-label="开始计时"
                >
                  <PlayIcon className="h-5 w-5" />
                </button>
              )}
              {status === 'running' && (
                <button
                  className="icon-button bg-amber-400 text-stone-950"
                  type="button"
                  onClick={pauseTimer}
                  aria-label="暂停计时"
                >
                  <PauseIcon className="h-5 w-5" />
                </button>
              )}
              {status === 'paused' && (
                <button
                  className="icon-button bg-teal-600 text-white"
                  type="button"
                  onClick={resumeTimer}
                  aria-label="继续计时"
                >
                  <PlayIcon className="h-5 w-5" />
                </button>
              )}
              {status !== 'idle' && status !== 'stopped' && (
                <button
                  className="icon-button bg-red-500 text-white"
                  type="button"
                  onClick={stopTimer}
                  aria-label="结束计时"
                >
                  <StopIcon className="h-5 w-5" />
                </button>
              )}
              {hasTimerDraft && (
                <button
                  className="icon-button bg-white text-stone-700"
                  type="button"
                  onClick={resetDraft}
                  aria-label="重置记录"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
          {status === 'idle' && (
            <p className="mt-4 text-xs text-stone-300">自动记录开始时间</p>
          )}
        </section>
      ) : (
        <section className="rounded-md border border-stone-200 bg-white p-4 text-left shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="mt-1 text-lg font-semibold text-stone-950">
                手动记录
              </p>
            </div>
            <Switch
              checked
              className="relative inline-flex h-8 w-16 items-center rounded-full bg-teal-700 transition"
              onChange={(checked) => setMode(checked ? 'manual' : 'timer')}
            >
              <span className="sr-only">切换记录模式</span>
              <span className="inline-block h-6 w-6 translate-x-9 rounded-full bg-white transition" />
            </Switch>
          </div>
          <div className="mt-4 grid grid-cols-[1fr_auto] items-end gap-3">
            <label className="text-sm font-medium text-stone-600 flex items-center gap-3">
              <span className="shrink-0">小时</span>
              <input
                className="input mt-1 w-24"
                min="0.5"
                step="0.5"
                type="number"
                value={manualDurationHours}
                onChange={(event) =>
                  setManualDuration(Number(event.target.value))
                }
              />
            </label>
          </div>
        </section>
      )}

      <Notebook
        activeText={activeText}
        logs={logs}
        onChangeActive={setActiveText}
        onCommit={commitActiveLog}
        onUpdate={updateLog}
        onRemove={removeLog}
      />

      <section className="rounded-md border border-stone-200 bg-white p-4 text-left shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-stone-950">标签</h2>
          <button
            className="small-button"
            type="button"
            onClick={() => setTagPickerOpen(true)}
          >
            <TagIcon className="h-4 w-4" />
            选择
          </button>
        </div>
        <div className="flex min-h-10 flex-wrap gap-2">
          {tags.length === 0 && (
            <p className="text-sm text-stone-400">还没有选择标签</p>
          )}
          {tags.map((tag) => (
            <button
              key={tag}
              className="tag-chip bg-teal-50 text-teal-800"
              type="button"
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      <button
        className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white disabled:bg-stone-300"
        disabled={!canSign || signing}
        type="button"
        onClick={handleSign}
      >
        <CheckIcon className="h-5 w-5" />
        {signing ? '签名中' : '完成并签名'}
      </button>
      {message && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-left text-sm text-amber-800">
          {message}
        </p>
      )}

      <TagPicker
        open={tagPickerOpen}
        tagHistory={tagHistory}
        selectedTags={tags}
        onClose={() => setTagPickerOpen(false)}
        onToggle={toggleTag}
      />
    </div>
  )
}
