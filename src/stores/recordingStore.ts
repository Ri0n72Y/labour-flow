import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LaborDraft, RecordMode } from '../interfaces'
import { nowIso, todayInputValue } from '../utils/time'

const createEmptyDraft = (): LaborDraft => ({
  mode: 'timer',
  status: 'idle',
  startAt: null,
  endAt: null,
  manualDate: todayInputValue(),
  manualDurationHours: 1,
  logs: [],
  activeText: '',
  tags: [],
})

interface RecordingState extends LaborDraft {
  setMode: (mode: RecordMode) => void
  startTimer: () => void
  stopTimer: () => void
  setActiveText: (activeText: string) => void
  commitActiveLog: () => void
  updateLog: (id: string, text: string) => void
  removeLog: (id: string) => void
  toggleTag: (tag: string) => void
  setManualDate: (manualDate: string) => void
  setManualDuration: (manualDurationHours: number) => void
  resetDraft: () => void
}

export const useRecordingStore = create<RecordingState>()(
  persist(
    (set, get) => ({
      ...createEmptyDraft(),
      setMode: (mode) => set({ mode, status: 'idle', startAt: null, endAt: null }),
      startTimer: () => set({ status: 'running', startAt: nowIso(), endAt: null }),
      stopTimer: () => set({ status: 'stopped', endAt: nowIso() }),
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
          logs: state.logs.map((log) => (log.id === id ? { ...log, text } : log)),
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
      setManualDate: (manualDate) => set({ manualDate }),
      setManualDuration: (manualDurationHours) =>
        set({ manualDurationHours: Math.max(0.5, Math.round(manualDurationHours * 2) / 2) }),
      resetDraft: () => set(createEmptyDraft()),
    }),
    {
      name: 'labourflow-recording',
    },
  ),
)
