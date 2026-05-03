import {
  CheckIcon,
  ListBulletIcon,
  MicrophoneIcon,
  NumberedListIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import type { KeyboardEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { LaborLogEntry } from '../interfaces'
import { markdownListItems } from '../lib/markdown/listRendering'
import { nextListPrefix, insertAtCursor } from '../lib/notebook/textEditing'
import { durationLabel, type ListStyle } from '../lib/recording/recordFormatting'
import { cn } from '../lib/styles/cn'
import { HeadlessTextarea } from './forms/HeadlessFields'
import { DurationRow } from './notebook/DurationRow'
import { EditableLogItem } from './notebook/EditableLogItem'
import { useAutoGrowTextarea } from './notebook/useAutoGrowTextarea'
import { RadioSwitch } from './RadioSwitch'

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

export function Notebook({
  activeText,
  logs,
  listStyle = 'unordered',
  durationHours,
  durationText,
  durationMetaText,
  onChangeActive,
  onCommit,
  onUpdate,
  onRemove,
  onListStyleChange,
  onDecreaseDuration,
  onIncreaseDuration,
}: {
  activeText: string
  logs: LaborLogEntry[]
  listStyle?: ListStyle
  durationHours?: number
  durationText?: string
  durationMetaText?: string
  onChangeActive: (value: string) => void
  onCommit: () => void
  onUpdate?: (id: string, text: string) => void
  onRemove: (id: string) => void
  onListStyleChange?: (style: ListStyle) => void
  onDecreaseDuration?: () => void
  onIncreaseDuration?: () => void
}) {
  const { t } = useTranslation()
  const [speechActive, setSpeechActive] = useState(false)
  const activeInputRef = useRef<HTMLTextAreaElement | null>(null)
  const LogList = listStyle === 'ordered' ? 'ol' : 'ul'
  const shownDuration =
    durationText ??
    (typeof durationHours === 'number' ? durationLabel(durationHours) : '')
  const listStyleOptions = [
    { value: 'unordered', label: t('record.unorderedList'), icon: ListBulletIcon },
    { value: 'ordered', label: t('record.orderedList'), icon: NumberedListIcon },
  ] as const
  useAutoGrowTextarea(activeInputRef, activeText)

  useEffect(() => {
    activeInputRef.current?.focus()
  }, [])

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
      activeInputRef.current?.focus()
    }
    recognition.onerror = () => {
      setSpeechActive(false)
      activeInputRef.current?.focus()
    }
    setSpeechActive(true)
    recognition.start()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter') return
    if (event.shiftKey) {
      event.preventDefault()
      onCommit()
      window.requestAnimationFrame(() => activeInputRef.current?.focus())
      return
    }

    event.preventDefault()
    const input = event.currentTarget
    const prefix = nextListPrefix(
      activeText.slice(0, input.selectionStart),
      listStyle
    )
    const insert = `\n${prefix}`
    const nextValue = insertAtCursor(
      activeText,
      insert,
      input.selectionStart,
      input.selectionEnd
    )
    const nextCursor = input.selectionStart + insert.length
    onChangeActive(nextValue)
    window.requestAnimationFrame(() => {
      input.selectionStart = nextCursor
      input.selectionEnd = nextCursor
    })
  }

  return (
    <section className="notebook-paper rounded-md border border-amber-200 p-4 text-left shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-stone-950">
          {t('record.labourLog')}
        </h2>
        {onListStyleChange && (
          <RadioSwitch
            ariaLabel={t('record.listStyle')}
            options={listStyleOptions}
            value={listStyle}
            onChange={onListStyleChange}
          />
        )}
      </div>
      <div className="space-y-3">
        {logs.length > 0 && (
          <LogList
            className={cn(
              'space-y-2 border-b border-dashed border-amber-200 pb-3 pl-5 text-sm leading-8 text-stone-800',
              listStyle === 'ordered' ? 'list-decimal' : 'list-disc'
            )}
          >
            {logs.map((log) =>
              onUpdate ? (
                <EditableLogItem
                  key={log.id}
                  log={log}
                  onUpdate={onUpdate}
                  onRemove={onRemove}
                />
              ) : (
                <ReadOnlyLogItem key={log.id} log={log} onRemove={onRemove} />
              )
            )}
          </LogList>
        )}
        <div className="grid grid-cols-[1fr_auto_auto] items-start gap-2">
          <HeadlessTextarea
            ref={activeInputRef}
            className="notebook-input notebook-active-input"
            placeholder={t('record.logPlaceholder')}
            rows={1}
            value={activeText}
            onChange={(event) => onChangeActive(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-teal-700 transition hover:bg-teal-50"
            type="button"
            onClick={startSpeech}
            aria-label={t('record.speechInput')}
          >
            <MicrophoneIcon
              className={cn('h-5 w-5', speechActive && 'text-red-500')}
            />
          </button>
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-teal-700 transition hover:bg-teal-50"
            type="button"
            onClick={() => {
              onCommit()
              window.requestAnimationFrame(() =>
                activeInputRef.current?.focus()
              )
            }}
            aria-label={t('record.confirmLog')}
          >
            <CheckIcon className="h-5 w-5" />
          </button>
        </div>
        <DurationRow
          duration={shownDuration}
          metaText={durationMetaText}
          onDecrease={onDecreaseDuration}
          onIncrease={onIncreaseDuration}
        />
        <p className="text-xs text-stone-400">
          {t('record.shortcutHint')}
        </p>
      </div>
    </section>
  )
}

function ReadOnlyLogItem({
  log,
  onRemove,
}: {
  log: LaborLogEntry
  onRemove: (id: string) => void
}) {
  const { t } = useTranslation()

  return (
    <li className="group pl-1">
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <p className="whitespace-pre-wrap">
          {markdownListItems(log.text).join('\n')}
        </p>
        <button
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-500 opacity-70 transition hover:bg-red-50"
          type="button"
          onClick={() => onRemove(log.id)}
          aria-label={t('common.deleteLog')}
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </li>
  )
}
