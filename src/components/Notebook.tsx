import { CheckIcon, MicrophoneIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import type { LaborLogEntry } from '../interfaces'

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
  onChangeActive,
  onCommit,
  onUpdate,
  onRemove,
}: {
  activeText: string
  logs: LaborLogEntry[]
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
