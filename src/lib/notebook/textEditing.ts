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

const indentUnit = '  '

export function insertAtCursor(
  value: string,
  insert: string,
  start: number,
  end: number
) {
  return `${value.slice(0, start)}${insert}${value.slice(end)}`
}

export function markdownNewlineAtCursor(
  value: string,
  start: number,
  end: number
) {
  const currentLineStart = value.lastIndexOf('\n', Math.max(0, start - 1)) + 1
  const currentLine = value.slice(currentLineStart, start)
  const orderedMatch = currentLine.match(/^(\s*)(\d+)([.)])\s+/)
  const unorderedMatch = currentLine.match(/^(\s*)([-*+])\s+/)
  const indent = currentLine.match(/^\s*/)?.[0] ?? ''
  const prefix = orderedMatch
    ? `${orderedMatch[1]}${Number(orderedMatch[2]) + 1}${orderedMatch[3]} `
    : unorderedMatch
      ? `${unorderedMatch[1]}${unorderedMatch[2]} `
      : indent
  const insert = `\n${prefix}`
  return {
    value: insertAtCursor(value, insert, start, end),
    cursor: start + insert.length,
  }
}

export function indentMarkdownLines({
  end,
  outdent = false,
  start,
  value,
}: {
  end: number
  outdent?: boolean
  start: number
  value: string
}) {
  const lineStart = value.lastIndexOf('\n', Math.max(0, start - 1)) + 1
  const lineEndCandidate = value.indexOf('\n', end)
  const lineEnd = lineEndCandidate === -1 ? value.length : lineEndCandidate
  const before = value.slice(0, lineStart)
  const selected = value.slice(lineStart, lineEnd)
  const after = value.slice(lineEnd)
  let startDelta = 0
  let endDelta = 0

  const lines = selected.split('\n').map((line, index) => {
    if (outdent) {
      const removeCount = line.startsWith(indentUnit)
        ? indentUnit.length
        : line.startsWith(' ')
          ? 1
          : 0
      if (index === 0) startDelta -= Math.min(removeCount, start - lineStart)
      endDelta -= removeCount
      return line.slice(removeCount)
    }
    if (index === 0) startDelta += indentUnit.length
    endDelta += indentUnit.length
    return `${indentUnit}${line}`
  })

  return {
    value: `${before}${lines.join('\n')}${after}`,
    start: Math.max(lineStart, start + startDelta),
    end: Math.max(lineStart, end + endDelta),
  }
}
