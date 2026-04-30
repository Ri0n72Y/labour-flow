import { describe, expect, it } from 'vitest'
import { getRecordTitle, normalizeDescriptionItem } from '../../src/utils/record'
import type { SignedLaborRecord } from '../../src/interfaces'

describe('record helpers', () => {
  it('normalizes markdown list items', () => {
    expect(normalizeDescriptionItem('  repair the build  ')).toBe(
      '- repair the build',
    )
    expect(normalizeDescriptionItem('* keep existing bullet')).toBe(
      '* keep existing bullet',
    )
    expect(normalizeDescriptionItem('')).toBe('')
  })

  it('derives the record title from the first description line', () => {
    const record: SignedLaborRecord = {
      wid: 'wid-1',
      startAt: '2026-04-30T00:00:00.000Z',
      endAt: '2026-04-30T01:00:00.000Z',
      duration: 3600,
      createBy: 'user',
      createAt: '2026-04-30T01:00:00.000Z',
      outcome: '',
      description: '- First line\n- Second line',
      tags: [],
      signature: 'sig',
      logEntries: [],
    }

    expect(getRecordTitle(record)).toBe('First line')
    expect(getRecordTitle({ ...record, description: '', outcome: 'Fallback' })).toBe(
      'Fallback',
    )
  })
})
