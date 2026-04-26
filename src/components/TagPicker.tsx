import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { PlusIcon } from '@heroicons/react/24/outline'
import { useMemo, useState } from 'react'

export function TagPicker({
  open,
  tagHistory,
  selectedTags,
  onClose,
  onToggle,
}: {
  open: boolean
  tagHistory: string[]
  selectedTags: string[]
  onClose: () => void
  onToggle: (tag: string) => void
}) {
  const [query, setQuery] = useState('')
  const suggestions = useMemo(() => {
    const defaults = ['写作', '开发', '沟通', '研究', '设计', '维护']
    return Array.from(new Set([...tagHistory, ...defaults])).filter((tag) =>
      tag.toLowerCase().includes(query.trim().toLowerCase())
    )
  }, [query, tagHistory])

  const createTag = () => {
    if (!query.trim()) return
    onToggle(query)
    setQuery('')
  }

  return (
    <Dialog className="relative z-50" open={open} onClose={onClose}>
      <div className="fixed inset-0 bg-stone-950/30" />
      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md p-3">
        <DialogPanel className="rounded-t-lg bg-white p-4 text-left shadow-xl">
          <DialogTitle className="text-lg font-semibold text-stone-950">
            选择标签
          </DialogTitle>
          <div className="mt-4 flex gap-2">
            <input
              className="input"
              placeholder="搜索或创建标签"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button
              className="icon-button bg-teal-700 text-white"
              type="button"
              onClick={createTag}
              aria-label="创建标签"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 flex max-h-52 flex-wrap gap-2 overflow-y-auto">
            {suggestions.map((tag) => (
              <button
                key={tag}
                className={`tag-chip ${selectedTags.includes(tag) ? 'bg-teal-700 text-white' : 'bg-stone-100 text-stone-700'}`}
                type="button"
                onClick={() => onToggle(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
