import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { defaultLanguage, type AppLanguage } from '../i18n/resources'

interface SettingsState {
  autoSignRecords: boolean
  language: AppLanguage
  setAutoSignRecords: (enabled: boolean) => void
  setLanguage: (language: AppLanguage) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      autoSignRecords: false,
      language: defaultLanguage,
      setAutoSignRecords: (enabled) => set({ autoSignRecords: enabled }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'labourflow-settings',
    }
  )
)
