import { TrashIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import type { LaborLogEntry } from '../../interfaces'
import { cn } from '../../lib/styles/cn'
import { AutoGrowTextarea } from './AutoGrowTextarea'

export function EditableLogItem({
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
