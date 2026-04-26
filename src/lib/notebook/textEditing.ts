import type { ListStyle } from '../recording/recordFormatting'

export function nextListPrefix(text: string, listStyle: ListStyle) {
  const lines = text.split('\n')
  const currentLine = lines.at(-1) ?? ''
  const indent = currentLine.match(/^\s*/)?.[0] ?? ''
  if (listStyle === 'unordered') return `${indent}- `

  const numberMatch = currentLine.match(/^\s*(\d+)[.)]\s+/)
  const nextNumber = numberMatch ? Number(numberMatch[1]) + 1 : lines.length + 1
  return `${indent}${nextNumber}. `
}

export function insertAtCursor(
  value: string,
  insert: string,
  start: number,
  end: number
) {
  return `${value.slice(0, start)}${insert}${value.slice(end)}`
}
