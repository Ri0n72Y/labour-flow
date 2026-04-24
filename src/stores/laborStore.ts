import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SignedLaborRecord } from '../interfaces'

interface LaborState {
  records: SignedLaborRecord[]
  tagHistory: string[]
  addRecord: (record: SignedLaborRecord) => void
  exportJson: (user: unknown) => string
}

export const useLaborStore = create<LaborState>()(
  persist(
    (set, get) => ({
      records: [],
      tagHistory: [],
      addRecord: (record) =>
        set((state) => ({
          records: [record, ...state.records],
          tagHistory: Array.from(new Set([...record.tags, ...state.tagHistory])),
        })),
      exportJson: (user) =>
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            user,
            records: get().records,
          },
          null,
          2,
        ),
    }),
    {
      name: 'labourflow-records',
    },
  ),
)
