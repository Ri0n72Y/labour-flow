import {
  ArrowDownTrayIcon,
  ClipboardIcon,
  DocumentArrowUpIcon,
} from '@heroicons/react/24/outline'
import { useState } from 'react'

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
  const [message, setMessage] = useState('')

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown)
    setMessage('标记文档已复制。')
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
    setMessage(`已导出 ${anchor.download}`)
  }

  return (
    <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-stone-950">项目报告导出</h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          className="flex h-10 items-center justify-center gap-2 rounded-md bg-stone-950 px-3 text-sm font-semibold text-white"
          type="button"
          onClick={handleDownload}
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          下载文件
        </button>
        <button
          className="flex h-10 items-center justify-center gap-2 rounded-md bg-white px-3 text-sm font-semibold text-stone-700 ring-1 ring-stone-200"
          type="button"
          onClick={handleCopy}
        >
          <ClipboardIcon className="h-4 w-4" />
          复制
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
  const [draft, setDraft] = useState('')
  const [message, setMessage] = useState('')

  return (
    <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-stone-950">导入项目</h2>
      <textarea
        className="input mt-3 min-h-32 resize-y"
        placeholder="粘贴项目标记文档，导入解析会尽量宽松处理。"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      <button
        className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-3 text-sm font-semibold text-white"
        type="button"
        onClick={() => {
          const ok = onImport(draft)
          setMessage(ok ? '标记文档已导入，已有记录不会被删除。' : '')
        }}
      >
        <DocumentArrowUpIcon className="h-4 w-4" />
        导入
      </button>
      {(message || importError) && (
        <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {importError || message}
        </p>
      )}
    </section>
  )
}
