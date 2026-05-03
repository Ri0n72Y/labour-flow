import {
  ArrowPathIcon,
  ClockIcon,
  PauseIcon,
  PencilSquareIcon,
  PlayIcon,
  StopIcon,
} from '@heroicons/react/24/outline'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { RadioSwitch } from '../RadioSwitch'
import type { RecordMode, RecordStatus } from '../../interfaces'
import { cn } from '../../lib/styles/cn'
import { formatDateTime, formatDuration } from '../../utils/time'

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
  const { t } = useTranslation()
  const hideModeSwitch =
    mode === 'timer' && ['running', 'paused'].includes(status)
  const recordModeOptions = [
    { value: 'timer', label: t('record.timerMode'), icon: ClockIcon },
    { value: 'manual', label: t('record.manualMode'), icon: PencilSquareIcon },
  ] as const

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
                  ? t('record.paused')
                  : status === 'stopped'
                    ? t('record.timerEnded', { time: formatDateTime(endAt) })
                    : formatDateTime(startAt) || t('record.waitingStart')}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-base font-semibold text-stone-950">
                {t('record.manualMode')}
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
                  aria-label={t('record.manualDurationInput')}
                />
                <span className="ml-1 text-xs text-stone-500">h</span>
              </label>
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {mode === 'timer' && status === 'idle' && (
            <TimerButton label={t('record.startTimer')} onClick={onStartTimer}>
              <PlayIcon className="h-5 w-5" />
            </TimerButton>
          )}
          {mode === 'timer' && status === 'running' && (
            <TimerButton label={t('record.pauseTimer')} onClick={onPauseTimer}>
              <PauseIcon className="h-5 w-5" />
            </TimerButton>
          )}
          {mode === 'timer' && status === 'paused' && (
            <TimerButton label={t('record.resumeTimer')} onClick={onResumeTimer}>
              <PlayIcon className="h-5 w-5" />
            </TimerButton>
          )}
          {mode === 'timer' && status !== 'idle' && status !== 'stopped' && (
            <TimerButton label={t('record.stopTimer')} onClick={onStopTimer}>
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
              aria-label={t('record.reset')}
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          )}
          {!hideModeSwitch && (
            <RadioSwitch<RecordMode>
              ariaLabel={t('record.mode')}
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
