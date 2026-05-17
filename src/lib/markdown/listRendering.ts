export type MarkdownListStyle = 'unordered' | 'ordered'

const markerPattern = /^\s*(?:[-*+]\s+|\d+[.)]\s+)/
const orderedMarkerPattern = /^\s*\d+[.)]\s+/
const listLinePattern = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/

export interface MarkdownListLine {
  content: string
  level: number
  marker: string
}

function cleanLine(line: string) {
  return line.replace(markerPattern, '').trim()
}

export function markdownListItems(text: string) {
  return text
    .split('\n')
    .map(cleanLine)
    .filter(Boolean)
}

export function getMarkdownListStyle(text: string): MarkdownListStyle {
  const firstLine = text
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean)
  return firstLine && orderedMarkerPattern.test(firstLine)
    ? 'ordered'
    : 'unordered'
}

export function markdownListLines(text: string): MarkdownListLine[] {
  return text
    .split('\n')
    .map((line) => {
      const match = line.match(listLinePattern)
      if (!match) {
        const content = line.trim()
        return content ? { content, level: 0, marker: '-' } : null
      }
      const indentWidth = match[1].replace(/\t/g, '  ').length
      return {
        content: match[3].trim(),
        level: Math.floor(indentWidth / 2),
        marker: match[2],
      }
    })
    .filter((line): line is MarkdownListLine => Boolean(line?.content))
}

export function normalizeMarkdownListText(
  text: string,
  listStyle: MarkdownListStyle
) {
  let orderedIndex = 1
  return text
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.trim())
    .map((line) => {
      if (markerPattern.test(line)) return line
      if (listStyle === 'ordered') return `${orderedIndex++}. ${line.trim()}`
      return `- ${line.trim()}`
    })
    .join('\n')
}
