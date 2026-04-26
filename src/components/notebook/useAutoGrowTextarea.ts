import type { RefObject } from 'react'
import { useLayoutEffect } from 'react'

export function useAutoGrowTextarea(
  ref: RefObject<HTMLTextAreaElement | null>,
  value: string
) {
  useLayoutEffect(() => {
    const input = ref.current
    if (!input) return
    input.style.height = '0px'
    input.style.height = `${Math.max(32, input.scrollHeight)}px`
  }, [ref, value])
}
