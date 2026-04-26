export type MarkdownListStyle = 'unordered' | 'ordered'

const markerPattern = /^\s*(?:[-*+]\s+|\d+[.)]\s+)/
const orderedMarkerPattern = /^\s*\d+[.)]\s+/

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
