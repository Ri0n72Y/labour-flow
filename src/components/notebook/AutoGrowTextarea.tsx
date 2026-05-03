import type { KeyboardEvent } from 'react'
import { useRef } from 'react'
import { cn } from '../../lib/styles/cn'
import { HeadlessTextarea } from '../forms/HeadlessFields'
import { useAutoGrowTextarea } from './useAutoGrowTextarea'

export function AutoGrowTextarea({
  value,
  className,
  placeholder,
  onChange,
  onKeyDown,
  onFocus,
  onBlur,
}: {
  value: string
  className?: string
  placeholder?: string
  onChange: (value: string) => void
  onKeyDown?: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  onFocus?: () => void
  onBlur?: () => void
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null)
  useAutoGrowTextarea(ref, value)

  return (
    <HeadlessTextarea
      ref={ref}
      className={cn('notebook-input', className)}
      placeholder={placeholder}
      rows={1}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  )
}
