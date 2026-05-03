import {
  ArrowDownTrayIcon,
  ClipboardIcon,
  DocumentArrowUpIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import { type ChangeEvent, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HeadlessTextarea } from '../forms/HeadlessFields'

function markdownFileName(title: string) {
  const normalized = title
    .trim()
    .replace(/[<>:"/\\|?*]/g, '-')
    .split('')
    .filter((char) => char.charCodeAt(0) >= 32)
    .join('')
    .replace(/\s+/g, ' ')
    .replace(/\.+$/g, '')

  return `${normalized || '未命名项目'}.md`
}

export function ProjectMarkdownExport({
  markdown,
  projectTitle,
}: {
  markdown: string
  projectTitle: string
}) {
  const { t } = useTranslation()
  const [message, setMessage] = useState('')

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown)
    setMessage(t('markdown.copied'))
  }

  const handleDownload = () => {
    const blob = new Blob([markdown], {
      type: 'text/markdown;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = markdownFileName(projectTitle)
    anchor.click()
    URL.revokeObjectURL(url)
    setMessage(t('markdown.exported', { fileName: anchor.download }))
  }

  return (
    <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-stone-950">
        {t('markdown.exportTitle')}
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          className="flex h-10 items-center justify-center gap-2 rounded-md bg-stone-950 px-3 text-sm font-semibold text-white"
          type="button"
          onClick={handleDownload}
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          {t('common.downloadFile')}
        </button>
        <button
          className="flex h-10 items-center justify-center gap-2 rounded-md bg-white px-3 text-sm font-semibold text-stone-700 ring-1 ring-stone-200"
          type="button"
          onClick={handleCopy}
        >
          <ClipboardIcon className="h-4 w-4" />
          {t('common.copy')}
        </button>
      </div>
      {message && (
        <p className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </p>
      )}
    </section>
  )
}

export function ProjectMarkdownImport({
  importError,
  onImport,
}: {
  importError?: string
  onImport: (markdown: string) => boolean
}) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState('')
  const [message, setMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const importDraft = (markdown: string) => {
    const ok = onImport(markdown)
    setMessage(ok ? t('markdown.importSuccess') : '')
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const text = await file.text()
    setDraft(text)
    importDraft(text)
  }

  return (
    <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-stone-950">
        {t('markdown.importTitle')}
      </h2>
      <HeadlessTextarea
        className="input mt-3 min-h-32 resize-y"
        placeholder={t('markdown.importPlaceholder')}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      <input
        ref={fileInputRef}
        accept=".md,.markdown,text/markdown,text/plain"
        className="sr-only"
        type="file"
        onChange={(event) => {
          void handleFileChange(event)
        }}
      />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          className="flex h-10 items-center justify-center gap-2 rounded-md bg-teal-700 px-3 text-sm font-semibold text-white"
          type="button"
          onClick={() => importDraft(draft)}
        >
          <DocumentArrowUpIcon className="h-4 w-4" />
          {t('projects.import')}
        </button>
        <button
          className="flex h-10 items-center justify-center gap-2 rounded-md bg-white px-3 text-sm font-semibold text-stone-700 ring-1 ring-stone-200"
          type="button"
          onClick={() => fileInputRef.current?.click()}
        >
          <DocumentTextIcon className="h-4 w-4" />
          {t('markdown.uploadFile')}
        </button>
      </div>
      {(message || importError) && (
        <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {importError || message}
        </p>
      )}
    </section>
  )
}
