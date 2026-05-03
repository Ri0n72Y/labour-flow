import '@testing-library/jest-dom/vitest'

import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { webcrypto } from 'node:crypto'
import '../src/i18n'
import i18n from '../src/i18n'
import { defaultLanguage } from '../src/i18n/resources'
import { useSettingsStore } from '../src/stores/settingsStore'

Object.defineProperty(globalThis, 'crypto', {
  configurable: true,
  value: webcrypto,
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
  localStorage.clear()
  useSettingsStore.setState(useSettingsStore.getInitialState(), true)
  void i18n.changeLanguage(defaultLanguage)
})
