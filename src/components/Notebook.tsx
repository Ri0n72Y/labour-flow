import {
  CheckIcon,
  ListBulletIcon,
  MinusIcon,
  MicrophoneIcon,
  NumberedListIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import type { KeyboardEvent, RefObject } from 'react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { LaborLogEntry } from '../interfaces'
import { markdownListItems } from '../lib/markdown/listRendering'
import { cn } from '../lib/styles/cn'
import { RadioSwitch } from './RadioSwitch'

type ListStyle = 'unordered' | 'ordered'

const listStyleOptions = [
  { value: 'unordered', label: '无序列表', icon: ListBulletIcon },
  { value: 'ordered', label: '有序列表', icon: NumberedListIcon },
] as const

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

function durationLabel(hours: number) {
  return `${Number(hours.toFixed(1))}h`
}

function nextListPrefix(text: string, listStyle: ListStyle) {
  const lines = text.split('\n')
  const currentLine = lines.at(-1) ?? ''
  const indent = currentLine.match(/^\s*/)?.[0] ?? ''
  if (listStyle === 'unordered') return `${indent}- `

  const numberMatch = currentLine.match(/^\s*(\d+)[.)]\s+/)
  const nextNumber = numberMatch ? Number(numberMatch[1]) + 1 : lines.length + 1
  return `${indent}${nextNumber}. `
}

function insertAtCursor(
  value: string,
  insert: string,
  start: number,
  end: number
) {
  return `${value.slice(0, start)}${insert}${value.slice(end)}`
}

function useAutoGrowTextarea(
  ref: RefObject<HTMLTextAreaElement | null>,
  value: string
) {
  useLayoutEffect(() => {
    const input = ref.current
    if (!input) return
    input.style.height = '0px'
    input.style.height = `${Math.max(32, input.scrollHeight)}px`
  }, [ref, value])
}

function AutoGrowTextarea({
  value,
  className,
  placeholder,
  onChange,
  onKeyDown,
  onFocus,
  onBlur,
}: {
  value: string
  className?: string
  placeholder?: string
  onChange: (value: string) => void
  onKeyDown?: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  onFocus?: () => void
  onBlur?: () => void
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null)
  useAutoGrowTextarea(ref, value)

  return (
    <textarea
      ref={ref}
      className={cn('notebook-input', className)}
      placeholder={placeholder}
      rows={1}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  )
}

function EditableLogItem({
  log,
  onUpdate,
  onRemove,
}: {
  log: LaborLogEntry
  onUpdate: (id: string, text: string) => void
  onRemove: (id: string) => void
}) {
  const [focused, setFocused] = useState(false)

  return (
    <li className="group pl-1">
      <div className="grid grid-cols-[1fr_auto] items-start gap-2">
        <AutoGrowTextarea
          className="pr-2"
          value={log.text}
          onChange={(value) => onUpdate(log.id, value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            window.setTimeout(() => setFocused(false), 120)
          }}
        />
        <button
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-md text-red-500 transition hover:bg-red-50',
            focused ? 'opacity-100' : 'opacity-0'
          )}
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onRemove(log.id)}
          aria-label="删除日志"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </li>
  )
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
  const [speechActive, setSpeechActive] = useState(false)
  const activeInputRef = useRef<HTMLTextAreaElement | null>(null)
  const LogList = listStyle === 'ordered' ? 'ol' : 'ul'
  const shownDuration =
    durationText ??
    (typeof durationHours === 'number' ? durationLabel(durationHours) : '')
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
        <h2 className="text-base font-semibold text-stone-950">劳动日志</h2>
        {onListStyleChange && (
          <RadioSwitch
            ariaLabel="列表风格"
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
                <li key={log.id} className="group pl-1">
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <p className="whitespace-pre-wrap">
                      {markdownListItems(log.text).join('\n')}
                    </p>
                    <button
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-500 opacity-70 transition hover:bg-red-50"
                      type="button"
                      onClick={() => onRemove(log.id)}
                      aria-label="删除日志"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              )
            )}
          </LogList>
        )}
        <div className="grid grid-cols-[1fr_auto_auto] items-start gap-2">
          <textarea
            ref={activeInputRef}
            className="notebook-input notebook-active-input"
            placeholder="记录刚完成的一小步劳动..."
            rows={1}
            value={activeText}
            onChange={(event) => onChangeActive(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-teal-700 transition hover:bg-teal-50"
            type="button"
            onClick={startSpeech}
            aria-label="语音输入"
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
            aria-label="确认日志"
          >
            <CheckIcon className="h-5 w-5" />
          </button>
        </div>
        {shownDuration && (
          <ul className="list-disc pl-5 text-sm text-stone-700">
            <li className="pl-1 leading-8">
              <div className="flex h-8 items-center justify-between gap-3 overflow-hidden">
                <span className="inline-flex h-8 min-w-0 items-center">
                  用时{' '}
                  {onDecreaseDuration ? (
                    <button
                      className="mx-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-100 hover:text-stone-950"
                      type="button"
                      onClick={onDecreaseDuration}
                      aria-label="减少用时"
                    >
                      <MinusIcon className="h-5 w-5" />
                    </button>
                  ) : (
                    <span className="mx-1 inline-flex h-8 w-8" aria-hidden />
                  )}
                  <span className="inline-flex h-8 min-w-13 items-center justify-center leading-8">
                    {shownDuration}
                  </span>
                  {onIncreaseDuration ? (
                    <button
                      className="mx-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-100 hover:text-stone-950"
                      type="button"
                      onClick={onIncreaseDuration}
                      aria-label="增加用时"
                    >
                      <PlusIcon className="h-5 w-5" />
                    </button>
                  ) : (
                    <span className="mx-1 inline-flex h-8 w-8" aria-hidden />
                  )}
                </span>
                {durationMetaText && (
                  <span className="shrink-0 text-xs leading-8 text-stone-400">
                    {durationMetaText}
                  </span>
                )}
              </div>
            </li>
          </ul>
        )}
        <p className="text-xs text-stone-400">
          Shift + Enter 确认，Enter 换行
        </p>
      </div>
    </section>
  )
}
