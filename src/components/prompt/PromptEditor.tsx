import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PromptTemplate } from '../../types/domain'

export function PromptEditor({
  prompt,
  onSave,
}: {
  prompt?: PromptTemplate
  onSave: (content: string) => void
}) {
  const { t } = useTranslation()
  const [content, setContent] = useState(prompt?.content ?? '')

  return (
    <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-stone-950">
        {t('prompt.title')}
      </h2>
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
        {t('prompt.save')}
      </button>
    </section>
  )
}
