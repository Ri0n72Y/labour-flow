import { useState } from 'react'
import type { PromptTemplate } from '../../types/domain'

export function PromptEditor({
  prompt,
  onSave,
}: {
  prompt?: PromptTemplate
  onSave: (content: string) => void
}) {
  const [content, setContent] = useState(prompt?.content ?? '')

  return (
    <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-stone-950">周总结提示词</h2>
      <textarea
        className="input mt-3 min-h-32 resize-y"
        value={content}
        onChange={(event) => setContent(event.target.value)}
      />
      <button
        className="mt-3 h-10 w-full rounded-md bg-teal-700 px-3 text-sm font-semibold text-white"
        type="button"
        onClick={() => onSave(content)}
      >
        保存提示词
      </button>
    </section>
  )
}
