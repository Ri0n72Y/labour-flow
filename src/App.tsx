import { Dialog, DialogPanel, DialogTitle, Switch } from '@headlessui/react'
import {
  ChartBarIcon,
  CheckIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  MicrophoneIcon,
  PencilSquareIcon,
  PlayIcon,
  PlusIcon,
  StopIcon,
  TagIcon,
  TrashIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import ReactECharts from 'echarts-for-react'
import {
  type ChangeEvent,
  type ComponentType,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { LaborData, SignedLaborRecord, ViewPeriod } from './interfaces'
import { useLaborStore } from './stores/laborStore'
import { useRecordingStore } from './stores/recordingStore'
import { useUserStore } from './stores/userStore'
import {
  isEd25519KeyPair,
  publicKeyLabel,
  publicKeyPayload,
  signLaborRecord,
} from './utils/crypto'
import {
  createManualRange,
  formatDate,
  formatDateTime,
  formatDuration,
  getDurationSeconds,
  groupKey,
  nowIso,
} from './utils/time'

type TabId = 'record' | 'view' | 'user'

interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  start: () => void
  onresult:
    | ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void)
    | null
  onerror: (() => void) | null
}

interface SpeechWindow extends Window {
  SpeechRecognition?: new () => SpeechRecognitionLike
  webkitSpeechRecognition?: new () => SpeechRecognitionLike
}

const tabs: Array<{
  id: TabId
  label: string
  icon: ComponentType<{ className?: string }>
}> = [
  { id: 'record', label: '记录', icon: PencilSquareIcon },
  { id: 'view', label: '查看', icon: ChartBarIcon },
  { id: 'user', label: '我的', icon: UserCircleIcon },
]

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('record')

  return (
    <main className="min-h-svh bg-[#f7f3ea] text-[#1f2933]">
      <div className="mx-auto flex min-h-svh w-full max-w-md flex-col bg-[#fbfaf7] shadow-2xl shadow-stone-300/50">
        <header className="flex items-center justify-between gap-3 border-b border-stone-200 px-5 pb-3 pt-5">
          <div className="min-w-0 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
              LabourFlow
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-stone-950">
              {activeTab === 'record'
                ? '劳动记录'
                : activeTab === 'view'
                  ? '记录查看'
                  : '用户信息'}
            </h1>
          </div>
          <UserIdentityBadge />
        </header>

        <section className="flex-1 overflow-y-auto px-4 pb-24 pt-4">
          {activeTab === 'record' && <RecordPage />}
          {activeTab === 'view' && <ViewPage />}
          {activeTab === 'user' && <UserPage />}
        </section>

        <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-stone-200 bg-white/95 px-3 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur">
          <div className="grid grid-cols-3 gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  className={`flex h-14 flex-col items-center justify-center rounded-md text-xs font-medium transition ${
                    active
                      ? 'bg-teal-700 text-white'
                      : 'text-stone-500 hover:bg-stone-100'
                  }`}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon className="h-5 w-5" />
                  <span className="mt-1">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </nav>
      </div>
    </main>
  )
}

function UserIdentityBadge() {
  const uid = useUserStore((state) => state.uid)
  const avatarDataUrl = useUserStore((state) => state.avatarDataUrl)
  const publicKeyJwk = useUserStore((state) => state.publicKeyJwk)
  const privateKeyJwk = useUserStore((state) => state.privateKeyJwk)
  const hasKeys = isEd25519KeyPair(publicKeyJwk, privateKeyJwk)
  const displayId = `${uid || 'worker'}#${publicKeyLabel(publicKeyJwk)}`

  if (!hasKeys) {
    return (
      <div
        className="flex h-9 shrink-0 items-center gap-2 rounded-full px-3 text-xs text-black-500 ring-1 opacity-20"
        title="未注册"
      >
        <UserCircleIcon className="h-5 w-5" />
        未注册
      </div>
    )
  }

  return (
    <div
      className="flex min-w-0 max-w-[46%] items-center gap-2 rounded-full bg-white px-2 py-1 shadow-sm ring-1 ring-stone-200"
      title={displayId}
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone-100">
        {avatarDataUrl ? (
          <img
            className="h-full w-full object-cover"
            src={avatarDataUrl}
            alt="用户头像"
          />
        ) : (
          <UserCircleIcon className="h-5 w-5 text-stone-400" />
        )}
      </div>
      <span className="min-w-0 truncate text-sm font-extralight text-stone-500">
        {displayId}
      </span>
    </div>
  )
}

function RecordPage() {
  const {
    mode,
    status,
    startAt,
    endAt,
    manualDate,
    manualDurationHours,
    logs,
    activeText,
    tags,
    setMode,
    startTimer,
    stopTimer,
    setActiveText,
    commitActiveLog,
    updateLog,
    removeLog,
    toggleTag,
    setManualDate,
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

  const elapsedSeconds =
    status === 'idle' || !startAt
      ? 0
      : Math.round(
          ((endAt ? Date.parse(endAt) : clockTick || Date.parse(startAt)) -
            Date.parse(startAt)) /
            1000
        )

  const hasKeys = isEd25519KeyPair(user.publicKeyJwk, user.privateKeyJwk)
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
        ? createManualRange(latest.manualDate, latest.manualDurationHours)
        : { startAt: latest.startAt, endAt: latest.endAt }

    if (!range.startAt || !range.endAt || latest.logs.length === 0) {
      setMessage('请补充时间和至少一条劳动日志。')
      return
    }

    setSigning(true)
    try {
      const recordBase: Omit<LaborData, 'signature'> = {
        wid: crypto.randomUUID(),
        startAt: range.startAt,
        endAt: range.endAt,
        createBy: publicKeyPayload(user.publicKeyJwk),
        createAt: nowIso(),
        outcome: latest.logs[0]?.text.slice(0, 36) || '劳动记录',
        description: latest.logs.map((log) => log.text).join('\n'),
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
      <section className="rounded-md border border-stone-200 bg-white p-4 text-left shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-stone-500">记录模式</p>
            <p className="mt-1 text-lg font-semibold text-stone-950">
              {mode === 'timer' ? '实时计时' : '手动补录'}
            </p>
          </div>
          <Switch
            checked={mode === 'manual'}
            className={`${mode === 'manual' ? 'bg-teal-700' : 'bg-stone-300'} relative inline-flex h-8 w-16 items-center rounded-full transition`}
            onChange={(checked) => setMode(checked ? 'manual' : 'timer')}
          >
            <span className="sr-only">切换记录模式</span>
            <span
              className={`${mode === 'manual' ? 'translate-x-9' : 'translate-x-1'} inline-block h-6 w-6 rounded-full bg-white transition`}
            />
          </Switch>
        </div>

        {mode === 'timer' ? (
          <div className="mt-4 rounded-md bg-stone-950 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-2xl font-semibold">
                <ClockIcon className="h-6 w-6 text-amber-300" />
                {formatDuration(elapsedSeconds)}
              </div>
              {status === 'running' ? (
                <button
                  className="icon-button bg-red-500 text-white"
                  type="button"
                  onClick={stopTimer}
                  aria-label="结束计时"
                >
                  <StopIcon className="h-5 w-5" />
                </button>
              ) : (
                <button
                  className="icon-button bg-teal-600 text-white"
                  type="button"
                  onClick={startTimer}
                  aria-label="开始计时"
                >
                  <PlayIcon className="h-5 w-5" />
                </button>
              )}
            </div>
            <p className="mt-2 text-xs text-stone-300">
              {status === 'idle'
                ? '自动记录开始时间'
                : status === 'running'
                  ? formatDateTime(startAt)
                  : `已结束 ${formatDateTime(endAt)}`}
            </p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-[1fr_auto] gap-3">
            <label className="text-sm font-medium text-stone-600">
              日期
              <input
                className="input mt-1"
                type="date"
                value={manualDate}
                onChange={(event) => setManualDate(event.target.value)}
              />
            </label>
            <label className="text-sm font-medium text-stone-600">
              小时
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
        )}
      </section>

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

function Notebook({
  activeText,
  logs,
  onChangeActive,
  onCommit,
  onUpdate,
  onRemove,
}: {
  activeText: string
  logs: SignedLaborRecord['logEntries']
  onChangeActive: (value: string) => void
  onCommit: () => void
  onUpdate: (id: string, text: string) => void
  onRemove: (id: string) => void
}) {
  const [speechActive, setSpeechActive] = useState(false)

  const startSpeech = () => {
    const speechWindow = window as SpeechWindow
    const SpeechRecognition =
      speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.lang = 'zh-CN'
    recognition.interimResults = false
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? ''
      onChangeActive(`${activeText}${activeText ? ' ' : ''}${transcript}`)
      setSpeechActive(false)
    }
    recognition.onerror = () => setSpeechActive(false)
    setSpeechActive(true)
    recognition.start()
  }

  return (
    <section className="rounded-md border border-amber-200 bg-[#fffaf0] p-4 text-left shadow-sm">
      <h2 className="mb-3 text-base font-semibold text-stone-950">劳动日志</h2>
      <div className="space-y-3">
        {logs.map((log, index) => (
          <div
            key={log.id}
            className="grid grid-cols-[auto_1fr_auto] gap-2 border-b border-dashed border-amber-200 pb-2"
          >
            <span className="mt-2 flex h-5 w-5 items-center justify-center rounded-full bg-teal-700 text-xs text-white">
              {index + 1}
            </span>
            <textarea
              className="notebook-input"
              value={log.text}
              rows={2}
              onChange={(event) => onUpdate(log.id, event.target.value)}
            />
            <button
              className="icon-button bg-white text-red-500"
              type="button"
              onClick={() => onRemove(log.id)}
              aria-label="删除日志"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
        <div className="grid grid-cols-[1fr_auto_auto] gap-2">
          <textarea
            className="notebook-input"
            placeholder="记录刚完成的一小步劳动..."
            rows={3}
            value={activeText}
            onChange={(event) => onChangeActive(event.target.value)}
          />
          <button
            className="icon-button bg-white text-teal-700"
            type="button"
            onClick={startSpeech}
            aria-label="语音输入"
          >
            <MicrophoneIcon
              className={`h-5 w-5 ${speechActive ? 'text-red-500' : ''}`}
            />
          </button>
          <button
            className="icon-button bg-teal-700 text-white"
            type="button"
            onClick={onCommit}
            aria-label="保存日志"
          >
            <CheckIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  )
}

function TagPicker({
  open,
  tagHistory,
  selectedTags,
  onClose,
  onToggle,
}: {
  open: boolean
  tagHistory: string[]
  selectedTags: string[]
  onClose: () => void
  onToggle: (tag: string) => void
}) {
  const [query, setQuery] = useState('')
  const suggestions = useMemo(() => {
    const defaults = ['写作', '开发', '沟通', '研究', '设计', '维护']
    return Array.from(new Set([...tagHistory, ...defaults])).filter((tag) =>
      tag.toLowerCase().includes(query.trim().toLowerCase())
    )
  }, [query, tagHistory])

  const createTag = () => {
    if (!query.trim()) return
    onToggle(query)
    setQuery('')
  }

  return (
    <Dialog className="relative z-50" open={open} onClose={onClose}>
      <div className="fixed inset-0 bg-stone-950/30" />
      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md p-3">
        <DialogPanel className="rounded-t-lg bg-white p-4 text-left shadow-xl">
          <DialogTitle className="text-lg font-semibold text-stone-950">
            选择 Tag
          </DialogTitle>
          <div className="mt-4 flex gap-2">
            <input
              className="input"
              placeholder="搜索或创建 tag"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button
              className="icon-button bg-teal-700 text-white"
              type="button"
              onClick={createTag}
              aria-label="创建 tag"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 flex max-h-52 flex-wrap gap-2 overflow-y-auto">
            {suggestions.map((tag) => (
              <button
                key={tag}
                className={`tag-chip ${selectedTags.includes(tag) ? 'bg-teal-700 text-white' : 'bg-stone-100 text-stone-700'}`}
                type="button"
                onClick={() => onToggle(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

function ViewPage() {
  const records = useLaborStore((state) => state.records)
  const [period, setPeriod] = useState<ViewPeriod>('week')

  const grouped = useMemo(() => {
    const totals = new Map<string, number>()
    for (const record of records) {
      const key = groupKey(record.startAt, period)
      totals.set(
        key,
        (totals.get(key) ?? 0) + getDurationSeconds(record) / 3600
      )
    }
    return Array.from(totals.entries()).sort(([left], [right]) =>
      left.localeCompare(right)
    )
  }, [period, records])

  const tagTotals = useMemo(() => {
    const totals = new Map<string, number>()
    for (const record of records) {
      for (const tag of record.tags)
        totals.set(
          tag,
          (totals.get(tag) ?? 0) + getDurationSeconds(record) / 3600
        )
    }
    return Array.from(totals.entries()).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2)),
    }))
  }, [records])

  const barOption = {
    grid: { left: 28, right: 12, top: 20, bottom: 28 },
    xAxis: {
      type: 'category',
      data: grouped.map(([key]) => key),
      axisLabel: { fontSize: 10 },
    },
    yAxis: { type: 'value' },
    series: [
      {
        type: 'bar',
        data: grouped.map(([, value]) => Number(value.toFixed(2))),
        itemStyle: { color: '#0f766e' },
      },
    ],
  }

  const pieOption = {
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie',
        radius: ['35%', '68%'],
        data: tagTotals,
      },
    ],
  }

  return (
    <div className="space-y-4 text-left">
      <div className="grid grid-cols-3 gap-2">
        {(['day', 'week', 'month'] as const).map((item) => (
          <button
            key={item}
            className={`rounded-md px-3 py-2 text-sm font-semibold ${period === item ? 'bg-teal-700 text-white' : 'bg-white text-stone-600'}`}
            type="button"
            onClick={() => setPeriod(item)}
          >
            {item === 'day' ? '日' : item === 'week' ? '周' : '月'}
          </button>
        ))}
      </div>

      <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-stone-950">时长统计</h2>
        {records.length === 0 ? (
          <EmptyState />
        ) : (
          <ReactECharts className="h-56" option={barOption} />
        )}
      </section>

      <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-stone-950">Tag 分布</h2>
        {tagTotals.length === 0 ? (
          <p className="mt-4 text-sm text-stone-400">暂无 tag 数据</p>
        ) : (
          <ReactECharts className="h-56" option={pieOption} />
        )}
      </section>

      <section className="space-y-3">
        {records.map((record) => (
          <article
            key={record.wid}
            className="rounded-md border border-stone-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-stone-950">
                  {record.outcome}
                </h3>
                <p className="mt-1 text-xs text-stone-500">
                  {formatDate(record.startAt)} ·{' '}
                  {formatDuration(getDurationSeconds(record))}
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                已签名
              </span>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm text-stone-700">
              {record.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {record.tags.map((tag) => (
                <span
                  key={tag}
                  className="tag-chip bg-stone-100 text-stone-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}

function EmptyState() {
  return (
    <p className="mt-4 rounded-md bg-stone-50 px-3 py-6 text-center text-sm text-stone-400">
      完成一条劳动记录后，这里会出现统计。
    </p>
  )
}

function UserPage() {
  const user = useUserStore()
  const records = useLaborStore((state) => state.records)
  const exportJson = useLaborStore((state) => state.exportJson)
  const [uidDraft, setUidDraft] = useState(user.uid)
  const [keyMessage, setKeyMessage] = useState('')
  const [profileMessage, setProfileMessage] = useState('')
  const hasKeys = isEd25519KeyPair(user.publicKeyJwk, user.privateKeyJwk)
  const displayId = `${user.uid || 'worker'}#${publicKeyLabel(user.publicKeyJwk)}`
  const cleanUidDraft = uidDraft.trim() || 'worker'
  const uidChanged = cleanUidDraft !== user.uid

  const handleAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => user.setAvatarDataUrl(String(reader.result ?? ''))
    reader.readAsDataURL(file)
  }

  const handleSaveUid = () => {
    user.setUid(uidDraft)
    setUidDraft(cleanUidDraft)
    setProfileMessage('名称已保存，完整身份已更新。')
  }

  const handleGenerateKeys = async () => {
    setKeyMessage('')
    try {
      await user.generateKeys()
      setKeyMessage('密钥已生成并保存在本地。')
    } catch (error) {
      setKeyMessage(
        error instanceof Error
          ? error.message
          : '密钥生成失败，请确认正在使用 HTTPS。'
      )
    }
  }

  const handleExport = () => {
    const publicUser = {
      uid: user.uid,
      displayId,
      publicKeyJwk: user.publicKeyJwk,
    }
    const blob = new Blob([exportJson(publicUser)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `labourflow-${formatDate(new Date())}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4 text-left">
      {!hasKeys && (
        <section className="rounded-md border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-sm font-semibold text-amber-900">还没有完成注册</p>
          <p className="mt-1 text-sm text-amber-800">
            生成密钥后，LabourFlow
            才能为劳动记录签名并确认记录属于你。你可以点击右上角“注册”快捷完成。
          </p>
        </section>
      )}

      <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <label className="flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-stone-100">
            {user.avatarDataUrl ? (
              <img
                className="h-full w-full object-cover"
                src={user.avatarDataUrl}
                alt="用户头像"
              />
            ) : (
              <UserCircleIcon className="h-12 w-12 text-stone-400" />
            )}
            <input
              className="sr-only"
              type="file"
              accept="image/*"
              onChange={handleAvatar}
            />
          </label>
          <div className="min-w-0 flex-1">
            <label className="text-sm font-medium text-stone-600">
              用户名
              <input
                className="input mt-1"
                value={uidDraft}
                onChange={(event) => {
                  setUidDraft(event.target.value)
                  setProfileMessage('')
                }}
              />
            </label>
            <button
              className="mt-2 h-10 w-full rounded-md bg-teal-700 px-3 text-sm font-semibold text-white disabled:bg-stone-300"
              disabled={!uidChanged}
              type="button"
              onClick={handleSaveUid}
            >
              保存
            </button>
            {profileMessage && (
              <p className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {profileMessage}
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 rounded-md bg-stone-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
            完整身份
          </p>
          <p className="mt-1 break-all text-sm text-stone-950">{displayId}</p>
        </div>
      </section>

      <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-stone-950">密钥管理</h2>
        <p className="mt-2 text-sm text-stone-500">
          公钥前八位：{publicKeyLabel(user.publicKeyJwk)}
        </p>
        <button
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white"
          type="button"
          onClick={handleGenerateKeys}
        >
          <KeyIcon />
          生成 / 重新生成密钥
        </button>
        {keyMessage && (
          <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {keyMessage}
          </p>
        )}
      </section>

      <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-stone-950">数据导出</h2>
        <p className="mt-2 text-sm text-stone-500">
          当前共有 {records.length} 条已签名劳动记录。
        </p>
        <button
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white"
          type="button"
          onClick={handleExport}
        >
          <DocumentArrowDownIcon className="h-5 w-5" />
          导出 JSON
        </button>
      </section>
    </div>
  )
}

function KeyIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M15 7.5a4.5 4.5 0 1 0 2 3.74L21 7.25V5h-2.25l-2.1 2.1A4.48 4.48 0 0 0 15 7.5Z" />
      <path d="M7.5 13.5 5 16v3h3l2.5-2.5" />
    </svg>
  )
}

export default App
