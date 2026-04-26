import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline'
import type { ReactNode } from 'react'

export function DurationRow({
  duration,
  metaText,
  onDecrease,
  onIncrease,
}: {
  duration: string
  metaText?: string
  onDecrease?: () => void
  onIncrease?: () => void
}) {
  if (!duration) return null

  return (
    <ul className="list-disc pl-5 text-sm text-stone-700">
      <li className="pl-1 leading-8">
        <div className="flex h-8 items-center justify-between gap-3 overflow-hidden">
          <span className="inline-flex h-8 min-w-0 items-center">
            用时{' '}
            {onDecrease ? (
              <DurationButton label="减少用时" onClick={onDecrease}>
                <MinusIcon className="h-5 w-5" />
              </DurationButton>
            ) : (
              <span className="mx-1 inline-flex h-8 w-8" aria-hidden />
            )}
            <span className="inline-flex h-8 min-w-13 items-center justify-center leading-8">
              {duration}
            </span>
            {onIncrease ? (
              <DurationButton label="增加用时" onClick={onIncrease}>
                <PlusIcon className="h-5 w-5" />
              </DurationButton>
            ) : (
              <span className="mx-1 inline-flex h-8 w-8" aria-hidden />
            )}
          </span>
          {metaText && (
            <span className="shrink-0 text-xs leading-8 text-stone-400">
              {metaText}
            </span>
          )}
        </div>
      </li>
    </ul>
  )
}

function DurationButton({
  label,
  children,
  onClick,
}: {
  label: string
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      className="mx-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-100 hover:text-stone-950"
      type="button"
      onClick={onClick}
      aria-label={label}
    >
      {children}
    </button>
  )
}
