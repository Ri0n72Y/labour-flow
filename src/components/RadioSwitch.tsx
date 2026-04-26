import type { ComponentType } from 'react'
import { cn } from '../lib/styles/cn'

export interface RadioSwitchOption<T extends string> {
  value: T
  label: string
  icon: ComponentType<{ className?: string }>
}

export function RadioSwitch<T extends string>({
  value,
  options,
  ariaLabel,
  onChange,
  className = '',
}: {
  value: T
  options: readonly [RadioSwitchOption<T>, RadioSwitchOption<T>]
  ariaLabel: string
  onChange: (value: T) => void
  className?: string
}) {
  const activeIndex = options.findIndex((option) => option.value === value)
  const nextValue = activeIndex === 0 ? options[1].value : options[0].value

  return (
    <div
      className={cn(
        'relative grid h-8 w-[4.5rem] cursor-pointer grid-cols-2 rounded-full bg-amber-100/80 p-1',
        className
      )}
      role="radiogroup"
      aria-label={ariaLabel}
      onClick={() => onChange(nextValue)}
      onKeyDown={(event) => {
        if (event.key !== ' ' && event.key !== 'Enter') return
        event.preventDefault()
        onChange(nextValue)
      }}
    >
      <span
        className={cn(
          'pointer-events-none absolute left-1 top-1 h-6 w-8 rounded-full bg-white shadow-sm transition-transform duration-200',
          activeIndex === 1 ? 'translate-x-8' : 'translate-x-0'
        )}
      />
      {options.map((option) => {
        const Icon = option.icon
        const selected = option.value === value
        return (
          <button
            key={option.value}
            className={cn(
              'relative z-10 inline-flex h-6 w-8 items-center justify-center rounded-full transition',
              selected
                ? 'text-stone-950'
                : 'text-stone-400 hover:text-stone-600'
            )}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.label}
            tabIndex={selected ? 0 : -1}
          >
            <Icon className="h-4 w-4" />
          </button>
        )
      })}
    </div>
  )
}
