import type { SignedLaborRecord } from '../interfaces'

const markdownListMarkerPattern = /^\s*(?:[-*+]\s+|\d+[.)]\s+)/

export function normalizeDescriptionItem(text: string) {
  const cleanText = text.trim()
  if (!cleanText) return ''
  return markdownListMarkerPattern.test(cleanText) ? cleanText : `- ${cleanText}`
}

export function getRecordTitle(record: SignedLaborRecord) {
  const firstLine = record.description
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean)

  return (
    firstLine?.replace(markdownListMarkerPattern, '').trim() ||
    record.outcome ||
    '劳动记录'
  )
}
