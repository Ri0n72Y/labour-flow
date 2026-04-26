import { ClipboardIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

export function MarkdownImportExport({
  markdown,
  importError,
  onImport,
}: {
  markdown: string
  importError?: string
  onImport: (markdown: string) => boolean
}) {
  const [draft, setDraft] = useState('')
  const [message, setMessage] = useState('')

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown)
    setMessage('标记文档已复制。')
  }

  return (
    <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-stone-950">标记文档导入 / 导出</h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          className="flex h-10 items-center justify-center gap-2 rounded-md bg-stone-950 px-3 text-sm font-semibold text-white"
          type="button"
          onClick={handleCopy}
        >
          <ClipboardIcon className="h-4 w-4" />
          复制导出
        </button>
        <button
          className="flex h-10 items-center justify-center gap-2 rounded-md bg-teal-700 px-3 text-sm font-semibold text-white"
          type="button"
          onClick={() => {
            const ok = onImport(draft)
            setMessage(ok ? '标记文档已导入，已有记录不会被删除。' : '')
          }}
        >
          <DocumentArrowUpIcon className="h-4 w-4" />
          导入
        </button>
      </div>
      <textarea
        className="input mt-3 min-h-32 resize-y"
        placeholder="粘贴项目标记文档，导入解析会尽量宽松处理。"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      {(message || importError) && (
        <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {importError || message}
        </p>
      )}
    </section>
  )
}
