import {
  ArrowPathIcon,
  ClockIcon,
  PauseIcon,
  PencilSquareIcon,
  PlayIcon,
  StopIcon,
} from '@heroicons/react/24/outline'
import type { ReactNode } from 'react'
import { RadioSwitch } from '../RadioSwitch'
import type { RecordMode, RecordStatus } from '../../interfaces'
import { cn } from '../../lib/styles/cn'
import { formatDateTime, formatDuration } from '../../utils/time'

const recordModeOptions = [
  { value: 'timer', label: '实时计时', icon: ClockIcon },
  { value: 'manual', label: '手动记录', icon: PencilSquareIcon },
] as const

const timerIconButtonClass =
  'inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20'

export function RecordModePill({
  mode,
  status,
  startAt,
  endAt,
  elapsedSeconds,
  manualDurationHours,
  hasTimerDraft,
  onModeChange,
  onManualDurationChange,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onStopTimer,
  onResetDraft,
}: {
  mode: RecordMode
  status: RecordStatus
  startAt: string | null
  endAt: string | null
  elapsedSeconds: number
  manualDurationHours: number
  hasTimerDraft: boolean
  onModeChange: (mode: RecordMode) => void
  onManualDurationChange: (hours: number) => void
  onStartTimer: () => void
  onPauseTimer: () => void
  onResumeTimer: () => void
  onStopTimer: () => void
  onResetDraft: () => void
}) {
  const hideModeSwitch =
    mode === 'timer' && ['running', 'paused'].includes(status)

  return (
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
                {status === 'idle' ? '00:00:00' : formatDuration(elapsedSeconds)}
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
                    onManualDurationChange(Number(event.target.value))
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
            <TimerButton label="开始计时" onClick={onStartTimer}>
              <PlayIcon className="h-5 w-5" />
            </TimerButton>
          )}
          {mode === 'timer' && status === 'running' && (
            <TimerButton label="暂停计时" onClick={onPauseTimer}>
              <PauseIcon className="h-5 w-5" />
            </TimerButton>
          )}
          {mode === 'timer' && status === 'paused' && (
            <TimerButton label="继续计时" onClick={onResumeTimer}>
              <PlayIcon className="h-5 w-5" />
            </TimerButton>
          )}
          {mode === 'timer' && status !== 'idle' && status !== 'stopped' && (
            <TimerButton label="结束计时" onClick={onStopTimer}>
              <StopIcon className="h-5 w-5" />
            </TimerButton>
          )}
          {hasTimerDraft && (
            <button
              className={cn(
                mode === 'timer'
                  ? timerIconButtonClass
                  : 'icon-button bg-white text-stone-700'
              )}
              type="button"
              onClick={onResetDraft}
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
              onChange={onModeChange}
            />
          )}
        </div>
      </div>
    </section>
  )
}

function TimerButton({
  label,
  children,
  onClick,
}: {
  label: string
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      className={timerIconButtonClass}
      type="button"
      onClick={onClick}
      aria-label={label}
    >
      {children}
    </button>
  )
}
