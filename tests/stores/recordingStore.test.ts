import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useRecordingStore } from '../../src/stores/recordingStore'
import { resetStores } from '../test-utils'

describe('useRecordingStore', () => {
  beforeEach(() => {
    resetStores()
  })

  it('manages timer lifecycle and manual duration rounding', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-30T00:00:00.000Z'))

    const store = useRecordingStore.getState()
    store.setMode('timer')
    store.startTimer()

    expect(useRecordingStore.getState().status).toBe('running')
    expect(useRecordingStore.getState().startAt).toBe('2026-04-30T00:00:00.000Z')

    vi.setSystemTime(new Date('2026-04-30T00:00:05.000Z'))
    useRecordingStore.getState().pauseTimer()
    expect(useRecordingStore.getState().status).toBe('paused')

    vi.setSystemTime(new Date('2026-04-30T00:00:10.000Z'))
    useRecordingStore.getState().resumeTimer()
    expect(useRecordingStore.getState().status).toBe('running')
    expect(useRecordingStore.getState().pausedSeconds).toBe(5)

    vi.setSystemTime(new Date('2026-04-30T00:00:12.000Z'))
    useRecordingStore.getState().stopTimer()
    expect(useRecordingStore.getState().status).toBe('stopped')
    expect(useRecordingStore.getState().endAt).toBe('2026-04-30T00:00:12.000Z')
    expect(useRecordingStore.getState().pausedSeconds).toBe(5)

    useRecordingStore.getState().setManualDuration(1.24)
    expect(useRecordingStore.getState().manualDurationHours).toBe(1)
    useRecordingStore.getState().setManualDuration(1.26)
    expect(useRecordingStore.getState().manualDurationHours).toBe(1.5)
  })

  it('commits logs and toggles tags', () => {
    const store = useRecordingStore.getState()
    store.setActiveText('  First log  ')
    store.commitActiveLog()

    expect(useRecordingStore.getState().logs).toHaveLength(1)
    expect(useRecordingStore.getState().activeText).toBe('')
    expect(useRecordingStore.getState().logs[0].text).toBe('First log')

    store.toggleTag('alpha')
    store.toggleTag(' alpha ')
    store.toggleTag('beta')

    expect(useRecordingStore.getState().tags).toEqual(['beta'])
  })
})
