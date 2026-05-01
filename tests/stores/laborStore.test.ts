import { beforeEach, describe, expect, it } from 'vitest'
import { useLaborStore } from '../../src/stores/laborStore'
import { resetStores } from '../test-utils'

describe('useLaborStore', () => {
  beforeEach(() => {
    resetStores()
  })

  it('prepends records and tracks unique tags', () => {
    const record = {
      wid: 'wid-1',
      startAt: '2026-04-30T00:00:00.000Z',
      endAt: '2026-04-30T01:00:00.000Z',
      duration: 3600,
      createBy: 'user',
      createAt: '2026-04-30T00:00:00.000Z',
      outcome: '',
      description: '- ship tests',
      tags: ['alpha', 'beta'],
      signature: 'sig',
      logEntries: [],
    }

    useLaborStore.getState().addRecord(record)
    useLaborStore.getState().addRecord({ ...record, wid: 'wid-2', tags: ['beta', 'gamma'] })

    expect(useLaborStore.getState().records.map((item) => item.wid)).toEqual([
      'wid-2',
      'wid-1',
    ])
    expect(useLaborStore.getState().tagHistory).toEqual(['beta', 'gamma', 'alpha'])
  })

  it('exports the current state to JSON', () => {
    const json = useLaborStore.getState().exportJson({
      uid: 'Alice',
      displayId: 'Alice#12345678',
    })

    const payload = JSON.parse(json) as {
      exportedAt: string
      user: { uid: string }
      records: unknown[]
    }

    expect(payload.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(payload.user.uid).toBe('Alice')
    expect(payload.records).toEqual([])
  })
})
