import { cn } from '../../lib/styles/cn'

export function ValueText({
  fallback,
  value,
}: {
  fallback: string
  value?: string
}) {
  const hasValue = Boolean(value?.trim())

  return (
    <p
      className={cn(
        'whitespace-pre-wrap text-sm leading-6',
        hasValue ? 'text-stone-700' : 'text-stone-400'
      )}
    >
      {hasValue ? value : fallback}
    </p>
  )
}
