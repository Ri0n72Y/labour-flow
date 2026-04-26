import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LaborDraft, RecordMode } from '../interfaces'
import { nowIso } from '../utils/time'

const createEmptyDraft = (): LaborDraft => ({
  mode: 'manual',
  status: 'idle',
  startAt: null,
  endAt: null,
  pausedAt: null,
  pausedSeconds: 0,
  manualDurationHours: 1,
  logs: [],
  activeText: '',
  tags: [],
})

interface RecordingState extends LaborDraft {
  setMode: (mode: RecordMode) => void
  startTimer: () => void
  pauseTimer: () => void
  resumeTimer: () => void
  stopTimer: () => void
  setActiveText: (activeText: string) => void
  commitActiveLog: () => void
  updateLog: (id: string, text: string) => void
  removeLog: (id: string) => void
  toggleTag: (tag: string) => void
  setManualDuration: (manualDurationHours: number) => void
  resetDraft: () => void
}

export const useRecordingStore = create<RecordingState>()(
  persist(
    (set, get) => ({
      ...createEmptyDraft(),
      setMode: (mode) => set({ mode }),
      startTimer: () =>
        set({
          status: 'running',
          startAt: nowIso(),
          endAt: null,
          pausedAt: null,
          pausedSeconds: 0,
        }),
      pauseTimer: () => {
        if (get().status !== 'running') return
        set({ status: 'paused', pausedAt: nowIso() })
      },
      resumeTimer: () => {
        const { status, pausedAt, pausedSeconds } = get()
        if (status !== 'paused' || !pausedAt) return
        set({
          status: 'running',
          pausedAt: null,
          pausedSeconds:
            pausedSeconds +
            Math.max(0, Math.round((Date.now() - Date.parse(pausedAt)) / 1000)),
        })
      },
      stopTimer: () => {
        const { status, pausedAt, pausedSeconds } = get()
        const extraPausedSeconds =
          status === 'paused' && pausedAt
            ? Math.max(
                0,
                Math.round((Date.now() - Date.parse(pausedAt)) / 1000)
              )
            : 0
        set({
          status: 'stopped',
          endAt: nowIso(),
          pausedAt: null,
          pausedSeconds: pausedSeconds + extraPausedSeconds,
        })
      },
      setActiveText: (activeText) => set({ activeText }),
      commitActiveLog: () => {
        const text = get().activeText.trim()
        if (!text) return
        set((state) => ({
          activeText: '',
          logs: [
            ...state.logs,
            {
              id: crypto.randomUUID(),
              text,
              done: true,
              createdAt: nowIso(),
            },
          ],
        }))
      },
      updateLog: (id, text) =>
        set((state) => ({
          logs: state.logs.map((log) =>
            log.id === id ? { ...log, text } : log
          ),
        })),
      removeLog: (id) =>
        set((state) => ({
          logs: state.logs.filter((log) => log.id !== id),
        })),
      toggleTag: (tag) => {
        const cleanTag = tag.trim()
        if (!cleanTag) return
        set((state) => ({
          tags: state.tags.includes(cleanTag)
            ? state.tags.filter((item) => item !== cleanTag)
            : [...state.tags, cleanTag],
        }))
      },
      setManualDuration: (manualDurationHours) =>
        set({
          manualDurationHours: Math.max(
            0,
            Math.round(manualDurationHours * 2) / 2
          ),
        }),
      resetDraft: () => set(createEmptyDraft()),
    }),
    {
      name: 'labourflow-recording',
    }
  )
)
