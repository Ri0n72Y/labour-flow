import { PlusIcon, TagIcon } from '@heroicons/react/24/outline'
import type { KeyboardEvent } from 'react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/styles/cn'
import { HeadlessTextInput } from '../forms/HeadlessFields'

const defaultTags = ['写作', '开发', '沟通', '研究', '设计', '维护']

export function TagNotebook({
  tags,
  tagHistory,
  value,
  onChange,
  onToggle,
  onSubmit,
  embedded = false,
  showTitle = true,
}: {
  tags: string[]
  tagHistory: string[]
  value: string
  onChange: (value: string) => void
  onToggle: (tag: string) => void
  onSubmit: () => void
  embedded?: boolean
  showTitle?: boolean
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
    <section
      className={cn(
        'text-left',
        embedded
          ? 'border-t border-dashed border-amber-200 px-4 py-4'
          : 'notebook-paper rounded-md border border-amber-200 p-4 shadow-sm',
      )}
    >
      {showTitle ? (
        <div className="mb-2 flex items-center gap-2">
          <TagIcon className="h-4 w-4 text-teal-700" />
          <h2 className="text-base font-semibold text-stone-950">
            {t('record.tags.title')}
          </h2>
        </div>
      ) : null}
      <div className="space-y-2">
        <div className="flex min-h-7 items-center gap-2 overflow-x-auto whitespace-nowrap text-sm">
          {tags.length === 0 ? (
            <span className="text-stone-400">
              {t('record.noTagHint')}
            </span>
          ) : (
            tags.map((tag) => (
              <button
                key={tag}
                className="shrink-0 text-sm font-semibold text-teal-800 transition hover:text-teal-950"
                type="button"
                onClick={() => onToggle(tag)}
              >
                #{tag}
              </button>
            ))
          )}
        </div>
        <div className="grid grid-cols-[1fr_auto] items-center gap-2">
          <HeadlessTextInput
            className="h-9 rounded-md bg-white/45 px-2 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:bg-white/70 focus:ring-2 focus:ring-amber-200"
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
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap text-sm">
            <span className="shrink-0 text-stone-500">
              {t('record.tags.suggestions')}
            </span>
            <div className="flex gap-2">
              {suggestions.map((tag) => (
                <button
                  key={tag}
                  className="shrink-0 text-sm font-medium text-amber-800 transition hover:text-amber-950"
                  type="button"
                  onClick={() => onToggle(tag)}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
