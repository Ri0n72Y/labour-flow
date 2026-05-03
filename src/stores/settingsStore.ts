import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { defaultLanguage, type AppLanguage } from '../i18n/resources'

interface SettingsState {
  language: AppLanguage
  setLanguage: (language: AppLanguage) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: defaultLanguage,
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'labourflow-settings',
    }
  )
)
