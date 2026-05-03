import {
  Checkbox,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@headlessui/react'
import {
  CheckIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'
import {
  parseBacklog,
  type BacklogTask,
  type BacklogTextLine,
} from '../../lib/project/backlog'
import { cn } from '../../lib/styles/cn'

export function BacklogPreview({
  fallbackItems = [],
  markdown = '',
  readOnly = false,
  onToggleTask,
}: {
  fallbackItems?: string[]
  markdown?: string
  readOnly?: boolean
  onToggleTask?: (lineIndex: number, checked: boolean) => void
}) {
  const sections = parseBacklog(markdown, fallbackItems)

  if (!sections.length) return null

  return (
    <div className="space-y-3">
      {sections.map((section) =>
        section.title ? (
          <Disclosure key={section.id} defaultOpen>
            {({ open }) => (
              <div className="rounded-md border border-stone-200 bg-stone-50/70">
                <DisclosureButton className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left">
                  <span className="min-w-0 truncate text-sm font-semibold text-stone-900">
                    {section.title}
                  </span>
                  <ChevronDownIcon
                    className={cn(
                      'h-4 w-4 shrink-0 text-stone-500 transition',
                      open && 'rotate-180'
                    )}
                  />
                </DisclosureButton>
                <DisclosurePanel className="space-y-2 border-t border-stone-200 px-3 py-3">
                  <BacklogSectionContent
                    lines={section.lines}
                    readOnly={readOnly}
                    tasks={section.tasks}
                    onToggleTask={onToggleTask}
                  />
                </DisclosurePanel>
              </div>
            )}
          </Disclosure>
        ) : (
          <div key={section.id} className="space-y-2">
            <BacklogSectionContent
              lines={section.lines}
              readOnly={readOnly}
              tasks={section.tasks}
              onToggleTask={onToggleTask}
            />
          </div>
        )
      )}
    </div>
  )
}

function BacklogSectionContent({
  lines,
  readOnly,
  tasks,
  onToggleTask,
}: {
  lines: BacklogTextLine[]
  readOnly: boolean
  tasks: BacklogTask[]
  onToggleTask?: (lineIndex: number, checked: boolean) => void
}) {
  return (
    <>
      {lines.map((line) => (
        <p
          key={line.lineIndex}
          className="whitespace-pre-wrap text-sm leading-6 text-stone-600"
        >
          {line.text}
        </p>
      ))}
      {tasks.map((task) => (
        <Checkbox
          key={task.lineIndex}
          checked={task.checked}
          className={cn(
            'grid grid-cols-[auto_minmax(0,1fr)] items-start gap-2 rounded-md px-2 py-1.5 text-sm leading-6',
            readOnly ? 'text-stone-600' : 'cursor-pointer text-stone-800 hover:bg-white'
          )}
          disabled={readOnly}
          onChange={(checked) => onToggleTask?.(task.lineIndex, checked)}
        >
          <span
            className={cn(
              'mt-0.5 flex h-5 w-5 items-center justify-center rounded border transition',
              task.checked
                ? 'border-teal-700 bg-teal-700 text-white'
                : 'border-stone-300 bg-white text-transparent'
            )}
          >
            <CheckIcon className="h-4 w-4" />
          </span>
          <span
            className={cn(
              'min-w-0',
              task.checked && 'text-stone-400 line-through'
            )}
          >
            {task.text}
          </span>
        </Checkbox>
      ))}
    </>
  )
}
