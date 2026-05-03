import { PlusIcon, TagIcon } from '@heroicons/react/24/outline'
import type { KeyboardEvent } from 'react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

const defaultTags = ['写作', '开发', '沟通', '研究', '设计', '维护']

export function TagNotebook({
  tags,
  tagHistory,
  value,
  onChange,
  onToggle,
  onSubmit,
}: {
  tags: string[]
  tagHistory: string[]
  value: string
  onChange: (value: string) => void
  onToggle: (tag: string) => void
  onSubmit: () => void
}) {
  const { t } = useTranslation()
  const suggestions = useMemo(() => {
    const query = value.trim().toLowerCase()
    return Array.from(new Set([...tagHistory, ...defaultTags]))
      .filter((tag) => !tags.includes(tag))
      .filter((tag) => !query || tag.toLowerCase().includes(query))
      .slice(0, 8)
  }, [tagHistory, tags, value])

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    onSubmit()
  }

  return (
    <section className="notebook-paper rounded-md border border-amber-200 p-4 text-left shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <TagIcon className="h-4 w-4 text-teal-700" />
        <h2 className="text-base font-semibold text-stone-950">
          {t('record.tags.title')}
        </h2>
      </div>
      <div className="space-y-3">
        <div className="flex min-h-8 flex-wrap gap-2">
          {tags.length === 0 ? (
            <span className="text-sm leading-8 text-stone-400">
              {t('record.noTagHint')}
            </span>
          ) : (
            tags.map((tag) => (
              <button
                key={tag}
                className="rounded-full bg-teal-50 px-3 py-1 text-sm text-teal-800 transition hover:bg-teal-100"
                type="button"
                onClick={() => onToggle(tag)}
              >
                #{tag}
              </button>
            ))
          )}
        </div>
        <div className="grid grid-cols-[1fr_auto] items-center gap-2 border-t border-dashed border-amber-200 pt-3">
          <input
            className="h-9 rounded-md bg-amber-50/70 px-3 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:bg-white focus:ring-2 focus:ring-amber-200"
            placeholder={t('record.inputTagPlaceholder')}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-teal-700 transition hover:bg-teal-50 disabled:text-stone-300"
            type="button"
            disabled={!value.trim()}
            onClick={onSubmit}
            aria-label={t('record.addTag')}
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((tag) => (
              <button
                key={tag}
                className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600 transition hover:bg-stone-200"
                type="button"
                onClick={() => onToggle(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
