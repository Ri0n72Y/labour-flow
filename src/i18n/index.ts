import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { defaultLanguage, resources } from './resources'
import { useSettingsStore } from '../stores/settingsStore'

const initialLanguage = useSettingsStore.getState().language || defaultLanguage

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: defaultLanguage,
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
})

if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLanguage
}

export default i18n
